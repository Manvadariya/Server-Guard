import os
import uuid
import asyncio
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from typing import List, Optional, Dict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import aiohttp

from playbooks import (
    run_playbook,
    get_blocked_ips,
    get_isolated_services,
    get_action_log,
    clear_all_actions,
    unblock_ip,
    ActionResult
)

PORT = int(os.environ.get("PORT", 8004))
API_GATEWAY_URL = os.environ.get("API_GATEWAY_URL", "http://localhost:3001")

class Alert(BaseModel):
    id: str
    title: str
    description: str
    severity: str
    source: str
    timestamp: str
    acknowledged: bool = False
    evidence: Optional[dict] = None
    recommendation: Optional[str] = None
    anomaly_id: Optional[str] = None
    rule_id: Optional[str] = None

class ActionOutput(BaseModel):
    action_id: str
    action_type: str
    status: str
    target: str
    message: str
    executed_at: str
    details: Optional[dict] = None

class ExecuteResponse(BaseModel):
    alert_id: str
    actions_executed: int
    actions: List[ActionOutput]

class HealthResponse(BaseModel):
    status: str = "healthy"
    service: str = "response-engine"
    version: str = "1.0.0"
    blocked_ips: int = 0
    isolated_services: int = 0

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Response Engine running on port {PORT}")
    print(f"Gateway: {API_GATEWAY_URL}")
    yield
    print("Response Engine shutting down...")

app = FastAPI(
    title="ServerGuard - Response Engine",
    description="Automated incident response",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    return HealthResponse(
        status="healthy",
        service="response-engine",
        version="1.0.0",
        blocked_ips=len(get_blocked_ips()),
        isolated_services=len(get_isolated_services())
    )

@app.get("/status", tags=["Status"])
async def get_status():
    from playbooks import throttled_ips
    return {
        "blocked_ips": get_blocked_ips(),
        "isolated_services": get_isolated_services(),
        "throttled_ips": throttled_ips,
        "actions_executed": len(get_action_log())
    }

@app.get("/actions", tags=["Actions"])
async def list_actions(limit: int = 50):
    actions = get_action_log()[-limit:]
    return {
        "actions": [
            {
                "action_type": a.action_type,
                "status": a.status,
                "target": a.target,
                "message": a.message,
                "executed_at": a.executed_at,
            }
            for a in reversed(actions)
        ],
        "count": len(actions)
    }

@app.post("/execute", response_model=ExecuteResponse, tags=["Execute"])
async def execute_response(alert: Alert):
    try:
        print(f"Executing response for: {alert.title}")

        results = run_playbook(alert.model_dump())

        actions = []
        for result in results:
            action_id = str(uuid.uuid4())
            action = ActionOutput(
                action_id=action_id,
                action_type=result.action_type,
                status=result.status,
                target=result.target,
                message=result.message,
                executed_at=result.executed_at,
                details=result.details
            )
            actions.append(action)

            print(f"   {result.message}")

        await emit_action_events(alert, actions)

        return ExecuteResponse(
            alert_id=alert.id,
            actions_executed=len(actions),
            actions=actions
        )

    except Exception as e:
        print(f"Response execution error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def emit_action_events(alert: Alert, actions: List[ActionOutput]):
    try:
        async with aiohttp.ClientSession() as session:
            for action in actions:
                event = {
                    "type": "response_action",
                    "alert_id": alert.id,
                    "action": action.model_dump(),
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }

                async with session.post(
                    f"{API_GATEWAY_URL}/internal/device-status",
                    json=event,
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as resp:
                    if resp.status == 200:
                        print(f"Action event emitted: {action.action_type}")

                # Sync IP blocks to API Gateway's IP Manager
                if action.action_type == "block_ip" and action.status == "success":
                    await sync_block_to_gateway(action.target, alert)

    except aiohttp.ClientError as e:
        print(f"Could not emit action event: {e}")


async def sync_block_to_gateway(ip: str, alert: Alert):
    """Sync IP block to API Gateway's centralized IP Manager"""
    if not ip or ip == "unknown" or ip == "N/A":
        return

    try:
        # Map rule_id to block reason
        reason_map = {
            "sql_injection": "sql_injection",
            "brute_force": "brute_force",
            "rate_spike": "flooding",
            "ml_web_gatekeeper": "ml_detected",
            "ml_network_shield": "flooding",
        }
        reason = reason_map.get(alert.rule_id, "abuse")

        # Map severity
        severity_map = {
            "critical": "critical",
            "high": "high",
            "warning": "medium",
            "medium": "medium",
            "low": "low"
        }
        severity = severity_map.get(alert.severity, "high")

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{API_GATEWAY_URL}/ip/block",
                json={
                    "ip": ip,
                    "reason": reason,
                    "severity": severity,
                    "duration": None  # Use default based on severity
                },
                timeout=aiohttp.ClientTimeout(total=5)
            ) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    print(f"[Response Engine] Synced block to Gateway: {ip} -> {result.get('message')}")
                else:
                    print(f"[Response Engine] Gateway block sync failed: {resp.status}")
    except Exception as e:
        print(f"[Response Engine] Could not sync block to Gateway: {e}")


@app.post("/block/{ip}", tags=["Manual"])
async def manual_block_ip(ip: str, duration: int = 600, reason: str = "manual"):
    """Block an IP via Response Engine (syncs to API Gateway)"""
    from playbooks import blocked_ips

    if ip in blocked_ips:
        return {"status": "already_blocked", "ip": ip}

    blocked_ips.add(ip)

    # Sync to API Gateway
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{API_GATEWAY_URL}/ip/block",
                json={"ip": ip, "reason": reason, "severity": "high", "duration": duration},
                timeout=aiohttp.ClientTimeout(total=5)
            ) as resp:
                gateway_result = await resp.json() if resp.status == 200 else None
    except:
        gateway_result = None

    return {
        "status": "blocked",
        "ip": ip,
        "message": f"IP {ip} blocked",
        "gateway_sync": gateway_result
    }

@app.delete("/block/{ip}", tags=["Manual"])
async def manual_unblock_ip(ip: str):
    """Unblock an IP via Response Engine (syncs to API Gateway)"""
    if not unblock_ip(ip):
        raise HTTPException(status_code=404, detail="IP not blocked")

    # Sync to API Gateway
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{API_GATEWAY_URL}/ip/unblock",
                json={"ip": ip},
                timeout=aiohttp.ClientTimeout(total=5)
            ) as resp:
                gateway_result = await resp.json() if resp.status == 200 else None
    except:
        gateway_result = None

    return {"status": "unblocked", "ip": ip, "gateway_sync": gateway_result}

@app.post("/isolate/{service}", tags=["Manual"])
async def manual_isolate_service(service: str):
    from playbooks import isolated_services

    if service in isolated_services:
        return {"status": "already_isolated", "service": service}

    isolated_services.add(service)
    return {"status": "isolated", "service": service}

@app.delete("/isolate/{service}", tags=["Manual"])
async def manual_restore_service(service: str):
    from playbooks import isolated_services

    if service not in isolated_services:
        raise HTTPException(status_code=404, detail="Service not isolated")

    isolated_services.discard(service)
    return {"status": "restored", "service": service}

@app.post("/throttle/{ip}", tags=["Manual"])
async def manual_throttle_ip(ip: str, limit: int = 10):
    from playbooks import throttled_ips

    throttled_ips[ip] = limit
    return {"status": "throttled", "ip": ip, "limit": limit, "message": f"IP {ip} throttled to {limit} req/min"}

@app.delete("/throttle/{ip}", tags=["Manual"])
async def manual_remove_throttle(ip: str):
    from playbooks import throttled_ips

    if ip not in throttled_ips:
        raise HTTPException(status_code=404, detail="IP not throttled")

    del throttled_ips[ip]
    return {"status": "unthrottled", "ip": ip}

@app.delete("/reset", tags=["Admin"])
async def reset_all():
    clear_all_actions()
    return {"status": "reset", "message": "All actions cleared"}


# ==========================================
# SOAR PLAYBOOK EXECUTION
# ==========================================

class SOARPlaybookRequest(BaseModel):
    """Request model for SOAR playbook execution"""
    playbook_type: str = "full"  # full, ip_block, rate_limit, quarantine
    target_ips: Optional[List[str]] = None  # Specific IPs to target
    block_duration: int = 1800  # 30 minutes default (production-grade)
    rate_limit: int = 10  # requests per minute
    auto_unblock: bool = True  # Auto-unblock after duration

class SOARPlaybookResponse(BaseModel):
    """Response model for SOAR playbook execution"""
    success: bool
    playbook_id: str
    actions_executed: List[dict]
    blocked_ips: List[str]
    rate_limited_ips: List[str]
    quarantined_services: List[str]
    auto_unblock_scheduled: bool
    unblock_at: Optional[str] = None
    message: str

# Store scheduled unblocks for tracking
scheduled_unblocks: Dict[str, datetime] = {}

@app.post("/soar/execute", response_model=SOARPlaybookResponse, tags=["SOAR"])
async def execute_soar_playbook(request: SOARPlaybookRequest):
    """
    Execute SOAR (Security Orchestration, Automation & Response) playbook.
    
    Production-grade automated threat mitigation:
    - IP Blocking: Blocks malicious IPs at gateway level
    - Rate Limiting: Throttles suspicious traffic
    - Quarantine: Isolates compromised services
    - Auto-Unblock: Automatically unblocks IPs after specified duration (default 30 min)
    """
    from playbooks import blocked_ips, throttled_ips, isolated_services, action_log
    import uuid
    
    playbook_id = str(uuid.uuid4())[:8]
    actions_executed = []
    blocked_list = []
    rate_limited_list = []
    quarantined_list = []
    
    # Get target IPs from alerts or use provided list
    target_ips = request.target_ips or []
    
    # If no specific IPs provided, get from recent blocked events in logs
    if not target_ips:
        # Get IPs from recent action log that were detected as threats
        for action in action_log[-20:]:
            if hasattr(action, 'target') and action.target and action.target not in ['N/A', 'unknown', '127.0.0.1']:
                target_ips.append(action.target)
        target_ips = list(set(target_ips))  # Remove duplicates
    
    # Simulate threat IPs for demo if none found
    if not target_ips:
        target_ips = [
            f"185.220.101.{i}" for i in [42, 65, 89]  # Simulated threat IPs
        ]
    
    now = datetime.utcnow()
    unblock_time = now + timedelta(seconds=request.block_duration)
    
    # Execute actions based on playbook type
    if request.playbook_type in ["full", "ip_block"]:
        for ip in target_ips[:10]:  # Limit to 10 IPs per execution
            # Block IP via API Gateway
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        f"{API_GATEWAY_URL}/ip/block",
                        json={
                            "ip": ip,
                            "reason": "soar_playbook",
                            "severity": "high",
                            "duration": request.block_duration
                        },
                        timeout=aiohttp.ClientTimeout(total=5)
                    ) as resp:
                        if resp.status == 200:
                            result = await resp.json()
                            blocked_list.append(ip)
                            actions_executed.append({
                                "type": "ip_block",
                                "target": ip,
                                "status": "success",
                                "duration": request.block_duration,
                                "message": result.get("message", f"Blocked {ip}")
                            })
                            
                            # Schedule auto-unblock
                            if request.auto_unblock:
                                scheduled_unblocks[ip] = unblock_time
                        else:
                            actions_executed.append({
                                "type": "ip_block",
                                "target": ip,
                                "status": "failed",
                                "message": f"Gateway returned {resp.status}"
                            })
            except Exception as e:
                # Fallback to local blocking
                blocked_ips.add(ip)
                blocked_list.append(ip)
                actions_executed.append({
                    "type": "ip_block",
                    "target": ip,
                    "status": "success_local",
                    "duration": request.block_duration,
                    "message": f"Blocked {ip} (local only, gateway unavailable)"
                })
    
    if request.playbook_type in ["full", "rate_limit"]:
        for ip in target_ips[:10]:
            throttled_ips[ip] = request.rate_limit
            rate_limited_list.append(ip)
            actions_executed.append({
                "type": "rate_limit",
                "target": ip,
                "status": "success",
                "limit": request.rate_limit,
                "message": f"Rate limited {ip} to {request.rate_limit} req/min"
            })
    
    if request.playbook_type in ["full", "quarantine"]:
        # Quarantine any compromised services (placeholder for demo)
        demo_services = ["suspicious-container-1"]
        for service in demo_services:
            isolated_services.add(service)
            quarantined_list.append(service)
            actions_executed.append({
                "type": "quarantine",
                "target": service,
                "status": "success",
                "message": f"Service {service} quarantined"
            })
    
    # Schedule background unblock task
    if request.auto_unblock and blocked_list:
        asyncio.create_task(schedule_auto_unblock(blocked_list, request.block_duration))
    
    return SOARPlaybookResponse(
        success=True,
        playbook_id=playbook_id,
        actions_executed=actions_executed,
        blocked_ips=blocked_list,
        rate_limited_ips=rate_limited_list,
        quarantined_services=quarantined_list,
        auto_unblock_scheduled=request.auto_unblock,
        unblock_at=unblock_time.isoformat() + "Z" if request.auto_unblock else None,
        message=f"SOAR playbook executed: {len(blocked_list)} IPs blocked, {len(rate_limited_list)} rate-limited, {len(quarantined_list)} quarantined"
    )


async def schedule_auto_unblock(ips: List[str], delay_seconds: int):
    """Background task to auto-unblock IPs after delay"""
    await asyncio.sleep(delay_seconds)
    
    for ip in ips:
        try:
            # Unblock via API Gateway
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{API_GATEWAY_URL}/ip/unblock",
                    json={"ip": ip},
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as resp:
                    if resp.status == 200:
                        print(f"[SOAR] Auto-unblocked {ip} after {delay_seconds}s")
                    
            # Also remove from local set
            from playbooks import blocked_ips
            blocked_ips.discard(ip)
            
            # Remove from scheduled unblocks
            scheduled_unblocks.pop(ip, None)
            
        except Exception as e:
            print(f"[SOAR] Auto-unblock failed for {ip}: {e}")


@app.get("/soar/status", tags=["SOAR"])
async def get_soar_status():
    """Get current SOAR defense status"""
    from playbooks import blocked_ips, throttled_ips, isolated_services
    
    return {
        "active_blocks": list(blocked_ips),
        "active_rate_limits": dict(throttled_ips),
        "quarantined_services": list(isolated_services),
        "scheduled_unblocks": {
            ip: dt.isoformat() + "Z" for ip, dt in scheduled_unblocks.items()
        },
        "total_blocked": len(blocked_ips),
        "total_throttled": len(throttled_ips),
        "total_quarantined": len(isolated_services)
    }


@app.post("/soar/unblock-all", tags=["SOAR"])
async def soar_unblock_all():
    """Emergency: Unblock all IPs (clear all defenses)"""
    from playbooks import blocked_ips, throttled_ips, isolated_services
    
    unblocked = list(blocked_ips)
    
    # Unblock all via Gateway
    for ip in unblocked:
        try:
            async with aiohttp.ClientSession() as session:
                await session.post(
                    f"{API_GATEWAY_URL}/ip/unblock",
                    json={"ip": ip},
                    timeout=aiohttp.ClientTimeout(total=2)
                )
        except:
            pass
    
    blocked_ips.clear()
    throttled_ips.clear()
    isolated_services.clear()
    scheduled_unblocks.clear()
    
    return {
        "success": True,
        "message": f"All defenses cleared: {len(unblocked)} IPs unblocked",
        "unblocked_ips": unblocked
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=PORT,
        reload=False
    )
