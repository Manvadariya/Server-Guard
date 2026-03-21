"""
Server Guard - Unified Backend Server
Combines all microservices into a single FastAPI application for Render free tier deployment.
"""
import os
import sys
import uuid
import asyncio
import time
import urllib.parse
import threading
import warnings
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from typing import Dict, Set, Optional, List, Any
from collections import defaultdict
from pathlib import Path

# Suppress warnings
warnings.filterwarnings("ignore", category=UserWarning)

from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
import socketio
import aiohttp

# ==============================================================================
# Add backend module paths so we can import from existing code
# ==============================================================================
BASE_DIR = Path(__file__).parent
sys.path.insert(0, str(BASE_DIR / "backend" / "api-gateway"))
sys.path.insert(0, str(BASE_DIR / "backend" / "detection-engine"))
sys.path.insert(0, str(BASE_DIR / "backend" / "response-engine"))

# Import from existing modules
from ip_manager import ip_manager, BlockReason, ThreatSeverity
from ip_middleware import setup_ip_middleware, process_event_queue, set_socket_io
from rules import run_all_rules, AnomalySignal as RuleAnomalySignal, DETECTION_RULES
from playbooks import (
    run_playbook, get_blocked_ips, get_isolated_services, get_action_log,
    clear_all_actions, unblock_ip, ActionResult,
    blocked_ips as playbook_blocked_ips, throttled_ips as playbook_throttled_ips,
    isolated_services as playbook_isolated_services
)

# ==============================================================================
# ML MODEL LOADING (from model_microservice)
# ==============================================================================
import torch
import torch.nn as nn
import numpy as np
import pandas as pd
import joblib

DEVICE = torch.device("cpu")
SYSTEM_LOGS = []

class NetworkShield(nn.Module):
    def __init__(self, input_dim):
        super(NetworkShield, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 256), nn.BatchNorm1d(256), nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(256, 128), nn.BatchNorm1d(128), nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(128, 64), nn.BatchNorm1d(64), nn.ReLU(),
            nn.Linear(64, 32), nn.ReLU(),
            nn.Linear(32, 1), nn.Sigmoid()
        )
    def forward(self, x): return self.net(x)

print("[*] Initializing Server Guard Inference Engine...")
MODEL_DIR = BASE_DIR / "model_microservice" / "models"

# Load Web Brain (Random Forest)
try:
    web_model = joblib.load(str(MODEL_DIR / "web_brain_model.pkl"))
    web_vectorizer = joblib.load(str(MODEL_DIR / "web_brain_vectorizer.pkl"))
    print("[+] Web Brain (SQLi/XSS) Online.")
except Exception as e:
    print(f"[-] Web Brain Offline: {e}")
    web_model = None
    web_vectorizer = None

# Load Network Brain (PyTorch)
try:
    net_cols = joblib.load(str(MODEL_DIR / "network_cols.pkl"))
    net_scaler = joblib.load(str(MODEL_DIR / "network_scaler.pkl"))
    net_model = NetworkShield(input_dim=len(net_cols))
    net_model.load_state_dict(torch.load(str(MODEL_DIR / "network_shield.pth"), map_location=DEVICE))
    net_model.eval()
    print("[+] Network Shield (Flow Analysis) Online.")
except Exception as e:
    print(f"[-] Network Shield Offline: {e}")
    net_model = None
    net_cols = None
    net_scaler = None

print("[*] System Ready.")

# ==============================================================================
# INGEST STORAGE (in-memory for simplicity on free tier)
# ==============================================================================
ingest_events: List[dict] = []
INGEST_MAX_EVENTS = 1000

def save_ingest_event(event: dict):
    global ingest_events
    ingest_events.append(event)
    if len(ingest_events) > INGEST_MAX_EVENTS:
        ingest_events = ingest_events[-INGEST_MAX_EVENTS:]

def get_recent_ingest(limit=50):
    return list(reversed(ingest_events[-limit:]))

def get_ingest_count():
    return len(ingest_events)

def clear_ingest():
    global ingest_events
    ingest_events = []

# ==============================================================================
# ALERT MANAGER (in-memory)
# ==============================================================================
alerts_generated = 0
alert_history: List[dict] = []

ALERT_TEMPLATES = {
    "sql_injection": {"title": "SQL Injection Attempt", "severity": "critical"},
    "rate_spike": {"title": "Potential DDoS Attack", "severity": "warning"},
    "high_cpu": {"title": "High CPU Usage Alert", "severity": "warning"},
    "high_memory": {"title": "Critical Memory Usage", "severity": "critical"},
    "high_network": {"title": "High Network Traffic (Data Exfiltration Risk)", "severity": "warning"},
    "brute_force": {"title": "Brute Force Attack Detected", "severity": "critical"},
}

def generate_alert_from_anomaly(anomaly: dict) -> dict:
    global alerts_generated
    template_config = ALERT_TEMPLATES.get(anomaly.get("rule_id", ""), {})
    severity = template_config.get("severity", anomaly.get("severity", "warning"))
    if anomaly.get("rule_id", "").startswith("ml_") or anomaly.get("severity") == "critical":
        severity = anomaly.get("severity", severity)

    evidence = anomaly.get("evidence", {})
    source = evidence.get("service", "Unknown Service")
    if not source or source == "Unknown Service":
        source = evidence.get("source_ip", "Unknown")

    alert = {
        "id": str(uuid.uuid4()),
        "title": template_config.get("title", anomaly.get("rule_name", "Detection")),
        "description": anomaly.get("description", ""),
        "severity": severity,
        "source": source,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "acknowledged": False,
        "evidence": evidence,
        "recommendation": anomaly.get("recommendation", ""),
        "anomaly_id": anomaly.get("anomaly_id", ""),
        "rule_id": anomaly.get("rule_id", ""),
    }
    alerts_generated += 1
    alert_history.append(alert)
    if len(alert_history) > 100:
        alert_history.pop(0)
    return alert

# ==============================================================================
# ML HELPER FUNCTIONS
# ==============================================================================
def adapt_network_features(sim_data):
    if net_cols is None:
        return None
    features = {col: 0.0 for col in net_cols}
    if 'Rate' in sim_data:
        features['flow_pkts_s'] = float(sim_data['Rate'])
        features['flow_byts_s'] = float(sim_data['Rate']) * 60
    if 'syn_count' in sim_data:
        features['syn_flag_cnt'] = 1.0 if sim_data['syn_count'] > 5 else 0.0
    if 'IAT' in sim_data:
        features['flow_iat_mean'] = float(sim_data['IAT'])
    if features.get('flow_pkts_s', 0) > 1000:
        features['flow_duration'] = 100000.0
        features['tot_fwd_pkts'] = 100.0
    else:
        features['flow_duration'] = 5000.0
        features['tot_fwd_pkts'] = 10.0
    return pd.DataFrame([features], columns=net_cols)

# ==============================================================================
# PYDANTIC MODELS
# ==============================================================================
class TelemetryEvent(BaseModel):
    event_id: str
    source_ip: str
    domain: str = "general"
    service: str
    event_type: str
    payload: dict = {}
    timestamp: int
    received_at: str = None

class AlertEvent(BaseModel):
    id: str
    title: str
    description: str = ""
    severity: str
    source: str
    timestamp: str
    acknowledged: bool = False
    evidence: dict = None
    recommendation: str = None

class BlockIPRequest(BaseModel):
    ip: str
    reason: str = "manual"
    severity: str = "high"
    duration: Optional[int] = None

class UnblockIPRequest(BaseModel):
    ip: str

class AnomalyOutput(BaseModel):
    anomaly_id: str
    rule_id: str
    rule_name: str
    severity: str
    confidence: float
    description: str
    evidence: dict
    recommendation: str
    source_event_id: str
    detected_at: str

# ==============================================================================
# SOCKET.IO SETUP
# ==============================================================================
PORT = int(os.environ.get("PORT", 8000))

sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=False,
    engineio_logger=False
)

connected_clients: Set[str] = set()

@sio.event
async def connect(sid, environ):
    connected_clients.add(sid)
    print(f"Frontend connected: {sid} (total: {len(connected_clients)})")
    await sio.emit('connected', {
        'message': 'Connected to ServerGuard Unified Gateway',
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }, to=sid)

@sio.event
async def disconnect(sid):
    connected_clients.discard(sid)
    print(f"Frontend disconnected: {sid} (total: {len(connected_clients)})")

@sio.event
async def ping(sid, data):
    await sio.emit('pong', {'timestamp': datetime.utcnow().isoformat() + 'Z'}, to=sid)

# ==============================================================================
# FASTAPI APP
# ==============================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    set_socket_io(sio)
    await ip_manager.start()

    async def event_processor():
        while True:
            await process_event_queue()
            await asyncio.sleep(0.1)

    event_task = asyncio.create_task(event_processor())

    print(f"=== Server Guard Unified Backend running on port {PORT} ===")
    print(f"  Models: Web={'online' if web_model else 'offline'}, Network={'online' if net_model else 'offline'}")
    print(f"  Rules: {len(DETECTION_RULES)} detection rules loaded")
    yield

    event_task.cancel()
    try:
        await event_task
    except asyncio.CancelledError:
        pass
    await ip_manager.stop()
    print("Server Guard shutting down...")

app = FastAPI(
    title="ServerGuard - Unified Backend",
    description="All-in-one security operations backend",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

setup_ip_middleware(app, sio=sio, bypass_local=True, enable_threat_detection=True)
socket_app = socketio.ASGIApp(sio, app)

# ==============================================================================
# HEALTH ENDPOINTS
# ==============================================================================
@app.get("/health", tags=["Health"])
async def health_check():
    stats = ip_manager.get_stats()
    return {
        "status": "healthy",
        "service": "server-guard-unified",
        "version": "2.0.0",
        "connected_clients": len(connected_clients),
        "blocked_ips": stats.get("blocked_count", 0),
        "models": {
            "web_brain": "online" if web_model else "offline",
            "network_shield": "online" if net_model else "offline"
        },
        "rules_loaded": len(DETECTION_RULES),
        "alerts_generated": alerts_generated,
        "events_ingested": get_ingest_count(),
    }

# ==============================================================================
# DASHBOARD ENDPOINT
# ==============================================================================
@app.get("/api/dashboard", tags=["Dashboard"])
async def get_dashboard():
    """Returns recent logs for the UI"""
    return {
        "logs": SYSTEM_LOGS[-50:],
        "total_logs": len(SYSTEM_LOGS),
        "timestamp": datetime.now().isoformat()
    }

# ==============================================================================
# ML ANALYZE ENDPOINT (Model Microservice)
# ==============================================================================
@app.post("/api/analyze", tags=["ML Analysis"])
async def analyze_packet(request: Request):
    """Main AI Analysis Pipeline: Web Brain + Network Shield + Heuristics"""
    try:
        req = await request.json()
        service = req.get('service_type', 'unknown')
        source_ip = req.get('source_ip') or (request.client.host if request.client else 'unknown')

        web_ai_score = None
        net_ai_score = None
        web_model_used = False
        net_model_used = False

        response = {
            "status": "allowed", "threat_level": "low", "messages": [],
            "model_status": {
                "web": "online" if web_model else "offline",
                "network": "online" if net_model else "offline"
            }
        }

        # --- LAYER 0: BRUTE FORCE DETECTION ---
        if 'auth_data' in req or req.get('attack_type') == 'brute_force':
            auth_data = req.get('auth_data', {})
            failed_attempts = auth_data.get('failed_attempts', 0)
            attempt_rate = auth_data.get('attempt_rate', 0)
            if failed_attempts > 50 or attempt_rate > 30:
                bf_score = min(0.98, 0.85 + (failed_attempts / 1000))
                log_entry = {
                    "id": len(SYSTEM_LOGS) + 1, "timestamp": datetime.now().isoformat(),
                    "service": service, "status": "blocked", "threat_level": "critical",
                    "source": "Auth Guardian",
                    "message": f"Brute Force Attack Detected ({failed_attempts} failed attempts)",
                    "payload_preview": f"User: {auth_data.get('username', 'unknown')}",
                    "score": bf_score, "model_score": bf_score, "is_ai_gen": True, "source_ip": source_ip
                }
                SYSTEM_LOGS.append(log_entry)
                _process_ml_alert(log_entry, source_ip)
                return log_entry

        # --- LAYER 0.5: PORT SCAN DETECTION ---
        if 'scan_data' in req or req.get('attack_type') == 'port_scan':
            scan_data = req.get('scan_data', {})
            ports_scanned = scan_data.get('ports_scanned', 0)
            scan_rate = scan_data.get('scan_rate', 0)
            syn_packets = scan_data.get('syn_packets', 0)
            if ports_scanned > 100 or scan_rate > 50 or syn_packets > 100:
                scan_score = min(0.97, 0.88 + (ports_scanned / 50000))
                log_entry = {
                    "id": len(SYSTEM_LOGS) + 1, "timestamp": datetime.now().isoformat(),
                    "service": service, "status": "blocked", "threat_level": "high",
                    "source": "Network Sentinel",
                    "message": f"Port Scan Detected ({ports_scanned} ports, {syn_packets} SYN packets)",
                    "payload_preview": f"Scan rate: {scan_rate}/sec",
                    "score": scan_score, "model_score": scan_score, "is_ai_gen": True, "source_ip": source_ip
                }
                SYSTEM_LOGS.append(log_entry)
                _process_ml_alert(log_entry, source_ip)
                return log_entry

        # --- LAYER 1: WEB GATEKEEPER (SQLi/XSS) ---
        if 'payload' in req and req['payload'] and req['payload'] not in ['LOGIN_ATTEMPT', 'TCP_FLOW_DATA_ONLY', 'NMAP_SYN_SCAN', 'PING']:
            raw_text = str(req['payload'])
            lower_text = raw_text.lower()
            heuristic_triggers = ["1=1", "union select", "drop table", "script>", "alert("]
            heuristic_hit = any(x in lower_text for x in heuristic_triggers)

            ai_score = 0
            if web_model:
                try:
                    norm_text = urllib.parse.unquote(lower_text)
                    vec = web_vectorizer.transform([norm_text])
                    try:
                        ai_score = float(web_model.predict_proba(vec)[0][1])
                    except:
                        ai_score = float(web_model.predict(vec)[0])
                    web_model_used = True
                    web_ai_score = ai_score
                except: pass

            final_score = ai_score
            if heuristic_hit:
                final_score = max(0.92, ai_score + 0.6)
            elif ai_score > 0:
                final_score = max(ai_score, 0.75)

            if ai_score > 0.3 or heuristic_hit:
                log_entry = {
                    "id": len(SYSTEM_LOGS) + 1, "timestamp": datetime.now().isoformat(),
                    "service": service, "status": "blocked", "threat_level": "critical",
                    "source": "Web Gatekeeper",
                    "message": "Malicious Web Payload Detected (SQLi/XSS)",
                    "payload_preview": raw_text[:50],
                    "score": min(0.99, final_score),
                    "model_score": ai_score if ai_score else None,
                    "heuristic_match": heuristic_hit,
                    "is_ai_gen": web_model_used and ai_score > 0.1,
                    "source_ip": source_ip
                }
                SYSTEM_LOGS.append(log_entry)
                _process_ml_alert(log_entry, source_ip)
                return log_entry

        # --- LAYER 2: NETWORK SHIELD (DDoS/Flow) ---
        if 'network_data' in req or req.get('attack_type') == 'ddos':
            heuristic_ddos = False
            net_prob = 0.0
            try:
                rate = float(req.get('network_data', {}).get('Rate', 0))
                syns = float(req.get('network_data', {}).get('syn_count', 0))
                if rate > 5000 or syns > 50:
                    heuristic_ddos = True
            except: pass
            if req.get('attack_type') == 'ddos':
                heuristic_ddos = True

            if net_model and 'network_data' in req:
                net_df = adapt_network_features(req['network_data'])
                if net_df is not None:
                    net_scaled = net_scaler.transform(net_df.values)
                    net_tensor = torch.FloatTensor(net_scaled).to(DEVICE)
                    with torch.no_grad():
                        net_prob = net_model(net_tensor).item()
                        net_model_used = True
                        net_ai_score = net_prob

            final_net_score = net_prob
            if heuristic_ddos:
                final_net_score = max(0.92, net_prob + 0.5)
            elif net_prob > 0.4:
                final_net_score = max(net_prob, 0.85)

            if heuristic_ddos or (net_model and net_prob > 0.4):
                log_entry = {
                    "id": len(SYSTEM_LOGS) + 1, "timestamp": datetime.now().isoformat(),
                    "service": service, "status": "blocked", "threat_level": "critical",
                    "source": "Network Shield",
                    "message": "Anomalous Traffic Flow Detected (DDoS Signature)",
                    "score": min(0.99, final_net_score),
                    "model_score": net_prob if net_model else None,
                    "heuristic": heuristic_ddos,
                    "is_ai_gen": net_model_used and net_prob > 0.3,
                    "source_ip": source_ip
                }
                SYSTEM_LOGS.append(log_entry)
                _process_ml_alert(log_entry, source_ip)
                return log_entry

        # --- LAYER 3: RESOURCE MONITOR ---
        if 'server_metrics' in req:
            cpu = req['server_metrics'].get('cpu_usage', 0)
            if cpu > 95:
                log_entry = {
                    "id": len(SYSTEM_LOGS) + 1, "timestamp": datetime.now().isoformat(),
                    "service": service, "status": "warning", "threat_level": "high",
                    "source": "Resource Monitor",
                    "message": f"Critical CPU Usage: {cpu}%",
                    "score": 1.0, "source_ip": source_ip
                }
                SYSTEM_LOGS.append(log_entry)
                return log_entry

        # --- NORMAL TRAFFIC ---
        SYSTEM_LOGS.append({
            "id": len(SYSTEM_LOGS) + 1, "timestamp": datetime.now().isoformat(),
            "service": service, "status": "allowed", "message": "Traffic Normal",
            "score": (web_ai_score or net_ai_score or 0.0),
            "web_score": web_ai_score, "net_score": net_ai_score,
            "web_used": web_model_used, "net_used": net_model_used,
            "source": "Normal Monitor"
        })
        response.update({
            "web_ai_score": web_ai_score, "web_model_used": web_model_used,
            "net_ai_score": net_ai_score, "net_model_used": net_model_used
        })
        return response

    except Exception as e:
        print(f"[!] API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _process_ml_alert(log_entry: dict, source_ip: str):
    """Process ML detection: generate alert and execute response playbook (inline)"""
    try:
        anomaly = {
            "anomaly_id": f"ml_{log_entry.get('id', 0)}",
            "rule_id": f"ml_{log_entry.get('source', 'unknown').lower().replace(' ', '_')}",
            "rule_name": log_entry.get('source', 'ML Detection'),
            "severity": log_entry.get('threat_level', 'high'),
            "confidence": log_entry.get('score', 0.9),
            "description": log_entry.get('message', 'AI-detected threat'),
            "evidence": {
                "service": log_entry.get('service', 'unknown'),
                "payload_preview": log_entry.get('payload_preview', ''),
                "model_score": log_entry.get('model_score'),
                "source": log_entry.get('source'),
                "source_ip": source_ip,
                "attacker_ip": source_ip
            },
            "recommendation": "Auto-detected by ML. Review and confirm.",
            "source_event_id": str(log_entry.get('id', '')),
            "detected_at": log_entry.get('timestamp', datetime.now().isoformat())
        }
        # Generate alert
        alert = generate_alert_from_anomaly(anomaly)
        # Execute response playbook
        run_playbook(alert)
    except Exception as e:
        print(f"[!] ML alert processing error: {e}")


@app.get("/api/dashboard", tags=["ML Analysis"])
async def get_dashboard():
    return {"logs": SYSTEM_LOGS[-50:], "total_logs": len(SYSTEM_LOGS), "timestamp": datetime.now().isoformat()}

@app.get("/api/model/health", tags=["ML Analysis"])
async def model_health():
    return {
        "status": "healthy", "service": "model-microservice", "version": "2.0.0",
        "models": {"web_brain": "online" if web_model else "offline", "network_shield": "online" if net_model else "offline"},
        "logs_count": len(SYSTEM_LOGS),
    }

# ==============================================================================
# TELEMETRY ENDPOINTS
# ==============================================================================
@app.post("/internal/telemetry", tags=["Internal"])
async def receive_telemetry(event: TelemetryEvent):
    try:
        frontend_event = {
            "deviceId": event.service,
            "deviceName": event.service.replace("-", " ").title(),
            "timestamp": event.received_at or datetime.utcnow().isoformat() + "Z",
            "metrics": {
                "cpu": event.payload.get("cpu", 50),
                "memory": event.payload.get("memory", 50),
                "network": event.payload.get("network", 100),
                "requests": event.payload.get("requests", 100),
            }
        }
        await sio.emit('telemetry', frontend_event)
        return {"status": "broadcast", "clients": len(connected_clients)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/internal/alert", tags=["Internal"])
async def receive_alert(alert: AlertEvent):
    try:
        await sio.emit('alert', alert.model_dump())
        return {"status": "broadcast", "clients": len(connected_clients)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/internal/device-status", tags=["Internal"])
async def receive_device_status(data: dict):
    try:
        await sio.emit('device:status', data)
        return {"status": "broadcast", "clients": len(connected_clients)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ml-alert", tags=["ML Integration"])
async def receive_ml_alert(data: dict):
    try:
        alert_event = {
            "id": f"ml_{data.get('id', datetime.utcnow().timestamp())}",
            "title": data.get('message', 'ML Detection'),
            "description": f"{data.get('source', 'AI')} - {data.get('message', '')}",
            "severity": data.get('threat_level', 'high'),
            "source": data.get('source', 'Model Microservice'),
            "timestamp": data.get('timestamp', datetime.utcnow().isoformat() + 'Z'),
            "acknowledged": False,
            "evidence": {
                "service": data.get('service', 'unknown'),
                "payload_preview": data.get('payload_preview', ''),
                "score": data.get('score', 0.9),
                "model_score": data.get('model_score'),
                "status": data.get('status', 'blocked')
            },
            "recommendation": "Review AI detection. Auto-blocked by ML model."
        }
        await sio.emit('alert', alert_event)
        await sio.emit('ml_detection', data)
        return {"status": "broadcast", "clients": len(connected_clients), "alert_id": alert_event["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# IP MANAGEMENT API
# ==============================================================================
@app.post("/ip/block", tags=["IP Management"])
async def block_ip_endpoint(request_data: BlockIPRequest):
    try:
        reason = BlockReason(request_data.reason)
    except ValueError:
        reason = BlockReason.MANUAL
    try:
        severity = ThreatSeverity(request_data.severity)
    except ValueError:
        severity = ThreatSeverity.HIGH
    result = ip_manager.block_ip(ip=request_data.ip, reason=reason, severity=severity, duration=request_data.duration, triggered_by="api_request")
    if result.get("success"):
        await sio.emit('ip:blocked', {"ip": request_data.ip, "reason": request_data.reason, "severity": request_data.severity, "expires_in": result.get("expires_in"), "timestamp": datetime.utcnow().isoformat() + "Z"})
    return result

@app.post("/ip/unblock", tags=["IP Management"])
async def unblock_ip_endpoint(request_data: UnblockIPRequest):
    result = ip_manager.unblock_ip(ip=request_data.ip, triggered_by="api_request")
    if result.get("success"):
        await sio.emit('ip:unblocked', {"ip": request_data.ip, "timestamp": datetime.utcnow().isoformat() + "Z"})
    return result

@app.get("/ip/check/{ip}", tags=["IP Management"])
async def check_ip_status(ip: str):
    return ip_manager.is_blocked(ip)

@app.get("/ip/blocked", tags=["IP Management"])
async def get_blocked_ips_endpoint():
    blocked = ip_manager.get_blocked_ips()
    return {"blocked_ips": blocked, "count": len(blocked)}

@app.get("/ip/throttled", tags=["IP Management"])
async def get_throttled_ips():
    throttled = ip_manager.get_throttled_ips()
    return {"throttled_ips": throttled, "count": len(throttled)}

@app.get("/ip/audit", tags=["IP Management"])
async def get_ip_audit_log(limit: int = 100):
    return {"audit_log": ip_manager.get_audit_log(limit), "limit": limit}

@app.get("/ip/stats", tags=["IP Management"])
async def get_ip_stats():
    return ip_manager.get_stats()

@app.get("/ip/dropped", tags=["Dropped Packets"])
async def get_dropped_packets(limit: int = 100, attack_type: str = None):
    packets = ip_manager.get_dropped_packets(limit=limit, attack_type=attack_type)
    stats = ip_manager.get_dropped_stats()
    return {"packets": packets, "count": len(packets), "total_dropped": stats.get("total_dropped", 0), "stats": stats}

@app.get("/ip/dropped/stats", tags=["Dropped Packets"])
async def get_dropped_stats():
    return ip_manager.get_dropped_stats()

@app.get("/ip/dropped/stream", tags=["Dropped Packets"])
async def get_dropped_stream():
    packets = ip_manager.get_dropped_packets(limit=20)
    return {"packets": packets, "count": len(packets)}

@app.get("/ip/brute-force/{ip}", tags=["Detection"])
async def check_brute_force_status(ip: str):
    return ip_manager.check_brute_force(ip)

@app.post("/ip/auth-attempt", tags=["Detection"])
async def record_auth_attempt(request: Request, data: dict):
    ip = data.get("ip")
    if not ip:
        forwarded_for = request.headers.get("X-Forwarded-For")
        ip = forwarded_for.split(",")[0].strip() if forwarded_for else (request.client.host if request.client else "unknown")
    result = ip_manager.record_auth_attempt(ip=ip, username=data.get("username", "unknown"), success=data.get("success", False), endpoint=data.get("endpoint", "/login"))
    if result.get("action") == "blocked":
        await sio.emit('ip:blocked', {"ip": ip, "reason": "brute_force", "severity": "high", "automated": True, "details": result.get("details", {}), "timestamp": datetime.utcnow().isoformat() + "Z"})
    return result

@app.get("/ip/flooding/{ip}", tags=["Detection"])
async def check_flooding_status(ip: str):
    return ip_manager.check_flooding(ip)

@app.post("/ip/rate-limit", tags=["Detection"])
async def apply_rate_limit(data: dict):
    ip = data.get("ip")
    if not ip:
        raise HTTPException(status_code=400, detail="IP address required")
    result = ip_manager.apply_throttle(ip=ip, new_limit=data.get("limit", 10), duration=data.get("duration", 300))
    await sio.emit('ip:rate_limited', {"ip": ip, "new_limit": data.get("limit", 10), "duration": data.get("duration", 300), "timestamp": datetime.utcnow().isoformat() + "Z"})
    return result

@app.post("/ip/clear", tags=["IP Management"])
async def clear_all_blocks():
    result = ip_manager.clear_all()
    await sio.emit('ip:cleared', {"cleared_count": result.get("cleared_count", 0), "timestamp": datetime.utcnow().isoformat() + "Z"})
    return result

@app.post("/ip/detect-threat", tags=["IP Management"])
async def detect_threat_endpoint(request: Request, data: dict):
    ip = data.get("ip") or (request.client.host if request.client else "unknown")
    result = ip_manager.record_suspicious_activity(ip=ip, activity_type=data.get("activity_type", "suspicious"), score=data.get("score", 25), details=data.get("details", {}))
    if result.get("action") == "blocked":
        await sio.emit('ip:blocked', {"ip": ip, "reason": data.get("activity_type", "suspicious"), "severity": result.get("severity", "high"), "automated": True, "timestamp": datetime.utcnow().isoformat() + "Z"})
    return result

# ==============================================================================
# INGEST ENDPOINTS
# ==============================================================================
@app.post("/ingest", tags=["Ingest"])
async def ingest_event(request: Request):
    try:
        data = await request.json()
        event_id = data.get("event_id") or str(uuid.uuid4())
        timestamp = data.get("timestamp") or int(time.time())
        event = {
            "event_id": event_id,
            "source_ip": data.get("source_ip"),
            "domain": data.get("domain"),
            "service": data.get("service", "unknown"),
            "event_type": data.get("event_type", "unknown"),
            "payload": data.get("payload", {}),
            "timestamp": timestamp,
            "received_at": datetime.utcnow().isoformat() + "Z"
        }
        save_ingest_event(event)
        # Run detection rules inline
        anomaly_signals = run_all_rules(event)
        for signal in anomaly_signals:
            anomaly = {
                "anomaly_id": str(uuid.uuid4()),
                "rule_id": signal.rule_id, "rule_name": signal.rule_name,
                "severity": signal.severity, "confidence": signal.confidence,
                "description": signal.description, "evidence": signal.evidence,
                "recommendation": signal.recommendation,
                "source_event_id": event_id,
                "detected_at": datetime.utcnow().isoformat() + "Z"
            }
            alert = generate_alert_from_anomaly(anomaly)
            run_playbook(alert)
            await sio.emit('alert', alert)

        await sio.emit('telemetry', {
            "deviceId": event.get("service"), "timestamp": event.get("received_at"),
            "metrics": event.get("payload", {})
        })
        return {"success": True, "event_id": event_id, "message": "Event processed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/events", tags=["Events"])
async def list_events(limit: int = 50):
    events = get_recent_ingest(limit)
    return {"events": events, "count": len(events), "total": get_ingest_count()}

@app.delete("/events", tags=["Events"])
async def delete_events():
    clear_ingest()
    return {"message": "All events cleared"}

# ==============================================================================
# ALERTS ENDPOINTS
# ==============================================================================
@app.get("/alerts", tags=["Alerts"])
async def list_alerts(limit: int = 50):
    return {"alerts": alert_history[-limit:][::-1], "count": len(alert_history), "total_generated": alerts_generated}

@app.post("/alerts/{alert_id}/acknowledge", tags=["Alerts"])
async def acknowledge_alert(alert_id: str):
    for alert in alert_history:
        if alert["id"] == alert_id:
            alert["acknowledged"] = True
            return {"status": "acknowledged", "alert_id": alert_id}
    raise HTTPException(status_code=404, detail="Alert not found")

@app.delete("/alerts", tags=["Alerts"])
async def clear_alerts():
    global alert_history
    alert_history = []
    return {"status": "cleared"}

# ==============================================================================
# RESPONSE ENGINE / SOAR ENDPOINTS
# ==============================================================================
@app.get("/defense/status", tags=["Response Engine"])
async def get_defense_status():
    return {
        "blocked_ips": get_blocked_ips(),
        "isolated_services": get_isolated_services(),
        "throttled_ips": dict(playbook_throttled_ips),
        "actions_executed": len(get_action_log())
    }

@app.get("/defense/actions", tags=["Response Engine"])
async def list_defense_actions(limit: int = 50):
    actions = get_action_log()[-limit:]
    return {
        "actions": [{"action_type": a.action_type, "status": a.status, "target": a.target, "message": a.message, "executed_at": a.executed_at} for a in reversed(actions)],
        "count": len(actions)
    }

@app.post("/defense/execute", tags=["Response Engine"])
async def execute_defense(alert_data: dict):
    try:
        results = run_playbook(alert_data)
        actions = [{"action_type": r.action_type, "status": r.status, "target": r.target, "message": r.message, "executed_at": r.executed_at} for r in results]
        return {"alert_id": alert_data.get("id", "unknown"), "actions_executed": len(actions), "actions": actions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/defense/reset", tags=["Response Engine"])
async def reset_defense():
    clear_all_actions()
    return {"status": "reset", "message": "All actions cleared"}

# ==============================================================================
# PROXY/COMPAT ENDPOINTS (for frontend backward compat)
# ==============================================================================
@app.get("/proxy/logs", tags=["Proxy"])
async def proxy_logs(limit: int = 50):
    events = get_recent_ingest(limit)
    return {"events": events, "count": len(events), "total": get_ingest_count()}

@app.get("/proxy/defense/status", tags=["Proxy"])
async def proxy_defense_status():
    return await get_defense_status()

@app.get("/proxy/defense/actions", tags=["Proxy"])
async def proxy_defense_actions(limit: int = 50):
    return await list_defense_actions(limit)

@app.get("/telemetry/summary", tags=["Telemetry"])
async def get_telemetry_summary():
    return {
        "connected_clients": len(connected_clients),
        "blocked_ips": len(ip_manager.blocked_ips),
        "active_threats": 0,
        "events_processed": get_ingest_count(),
        "system_health": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

@app.get("/api/telemetry/summary", tags=["Telemetry"])
async def get_api_telemetry_summary():
    return await get_telemetry_summary()

@app.get("/system/health", tags=["System"])
async def get_system_health():
    return {
        "services": {"unified_backend": "healthy", "connected_clients": len(connected_clients), "blocked_ips": len(ip_manager.blocked_ips)},
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

@app.get("/clients", tags=["Status"])
async def get_connected_clients():
    return {"connected_clients": len(connected_clients), "client_ids": list(connected_clients)}

# ==============================================================================
# SOAR PLAYBOOK ENDPOINTS
# ==============================================================================
@app.post("/soar/execute", tags=["SOAR"])
async def execute_soar_playbook(request_data: dict):
    playbook_type = request_data.get("playbook_type", "full")
    target_ips = request_data.get("target_ips", [])
    block_duration = request_data.get("block_duration", 1800)
    rate_limit = request_data.get("rate_limit", 10)
    auto_unblock = request_data.get("auto_unblock", True)

    playbook_id = str(uuid.uuid4())[:8]
    actions_executed = []
    blocked_list = []
    rate_limited_list = []

    if not target_ips:
        for action in get_action_log()[-20:]:
            if hasattr(action, 'target') and action.target and action.target not in ['N/A', 'unknown', '127.0.0.1']:
                target_ips.append(action.target)
        target_ips = list(set(target_ips))

    if not target_ips:
        target_ips = [f"185.220.101.{i}" for i in [42, 65, 89]]

    now = datetime.utcnow()
    unblock_time = now + timedelta(seconds=block_duration)

    if playbook_type in ["full", "ip_block"]:
        for ip in target_ips[:10]:
            try:
                result = ip_manager.block_ip(ip=ip, reason=BlockReason.MANUAL, severity=ThreatSeverity.HIGH, duration=block_duration, triggered_by="soar_playbook")
                blocked_list.append(ip)
                actions_executed.append({"type": "ip_block", "target": ip, "status": "success", "message": result.get("message", f"Blocked {ip}")})
            except Exception as e:
                actions_executed.append({"type": "ip_block", "target": ip, "status": "failed", "message": str(e)})

    if playbook_type in ["full", "rate_limit"]:
        for ip in target_ips[:10]:
            playbook_throttled_ips[ip] = rate_limit
            rate_limited_list.append(ip)
            actions_executed.append({"type": "rate_limit", "target": ip, "status": "success", "message": f"Rate limited {ip} to {rate_limit} req/min"})

    return {
        "success": True, "playbook_id": playbook_id,
        "actions_executed": actions_executed,
        "blocked_ips": blocked_list, "rate_limited_ips": rate_limited_list,
        "auto_unblock_scheduled": auto_unblock,
        "unblock_at": unblock_time.isoformat() + "Z" if auto_unblock else None,
        "message": f"SOAR playbook executed: {len(blocked_list)} IPs blocked, {len(rate_limited_list)} rate-limited"
    }

@app.get("/soar/status", tags=["SOAR"])
async def get_soar_status():
    return {
        "active_blocks": get_blocked_ips(),
        "active_rate_limits": dict(playbook_throttled_ips),
        "quarantined_services": get_isolated_services(),
        "total_blocked": len(get_blocked_ips()),
    }

@app.post("/soar/unblock-all", tags=["SOAR"])
async def soar_unblock_all():
    unblocked = get_blocked_ips()
    clear_all_actions()
    ip_manager.clear_all()
    return {"success": True, "message": f"All defenses cleared: {len(unblocked)} IPs unblocked", "unblocked_ips": unblocked}

# ==============================================================================
# DETECTION ENGINE ENDPOINTS (compatibility)
# ==============================================================================
@app.get("/rules", tags=["Detection"])
async def list_rules():
    return {"rules": [{"id": rid, "name": func.__name__} for rid, func in DETECTION_RULES], "count": len(DETECTION_RULES)}

@app.post("/analyze", tags=["Detection"])
async def analyze_event(event: TelemetryEvent):
    try:
        event_dict = event.model_dump()
        anomaly_signals = run_all_rules(event_dict)
        anomalies = []
        for signal in anomaly_signals:
            anomaly = AnomalyOutput(
                anomaly_id=str(uuid.uuid4()), rule_id=signal.rule_id, rule_name=signal.rule_name,
                severity=signal.severity, confidence=signal.confidence, description=signal.description,
                evidence=signal.evidence, recommendation=signal.recommendation,
                source_event_id=event.event_id, detected_at=datetime.utcnow().isoformat() + "Z"
            )
            anomalies.append(anomaly)
            # Process alert inline
            alert = generate_alert_from_anomaly(anomaly.model_dump())
            run_playbook(alert)
            await sio.emit('alert', alert)

        return {"event_id": event.event_id, "anomalies_detected": len(anomalies), "anomalies": [a.model_dump() for a in anomalies]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# MAIN
# ==============================================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host="0.0.0.0", port=PORT, reload=False)
