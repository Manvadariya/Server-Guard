#!/usr/bin/env python3
"""
Server-Guard Agent v1.0
========================
Lightweight agent to deploy on any server you want to monitor.

INSTALLATION:
    pip install fastapi uvicorn psutil requests

USAGE:
    python server_guard_agent.py --port 8006 --central-server http://your-central-server:8001

This agent:
1. Collects server metrics (CPU, memory, network)
2. Exposes /api/analyze endpoint for attack simulation
3. Optionally forwards data to your central Server-Guard instance
"""

import argparse
import asyncio
import platform
import socket
import time
import random
from datetime import datetime
from typing import Optional
from contextlib import asynccontextmanager

# Optional imports with fallbacks
try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False
    print("[WARN] psutil not installed. Install with: pip install psutil")

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# ============ Configuration ============
class AgentConfig:
    def __init__(self):
        self.agent_id = f"agent-{socket.gethostname()}-{random.randint(1000,9999)}"
        self.central_server: Optional[str] = None
        self.forward_interval: int = 30  # seconds
        self.port: int = 8006
        
config = AgentConfig()

# ============ Models ============
class AnalyzeRequest(BaseModel):
    service_type: str = "http"
    payload: str = ""
    network_data: dict = {}
    server_metrics: dict = {}

class AnalyzeResponse(BaseModel):
    status: str
    threat_level: str
    is_attack: bool
    attack_type: Optional[str] = None
    confidence: float
    web_ai_score: Optional[float] = None
    net_ai_score: Optional[float] = None
    agent_id: str
    server_info: dict

# ============ Threat Detection (Local) ============
# Simple rule-based detection when no central AI server
SQL_PATTERNS = ["'", "\"", "--", "union", "select", "drop", "insert", "delete", "or 1=1", "' or '"]
XSS_PATTERNS = ["<script", "javascript:", "onerror=", "onload=", "onclick="]
BRUTE_FORCE_THRESHOLD = 50  # requests per minute

request_counts = {}  # IP -> count

def detect_threat_locally(payload: str, network_data: dict, source_ip: str) -> dict:
    """Simple local threat detection without AI"""
    payload_lower = payload.lower()
    
    # SQL Injection
    if any(p in payload_lower for p in SQL_PATTERNS):
        return {
            "is_attack": True,
            "attack_type": "SQL Injection",
            "threat_level": "high",
            "confidence": 0.85
        }
    
    # XSS
    if any(p in payload_lower for p in XSS_PATTERNS):
        return {
            "is_attack": True,
            "attack_type": "XSS",
            "threat_level": "high", 
            "confidence": 0.82
        }
    
    # Brute Force (high request rate)
    current_minute = int(time.time() / 60)
    key = f"{source_ip}:{current_minute}"
    request_counts[key] = request_counts.get(key, 0) + 1
    
    if request_counts[key] > BRUTE_FORCE_THRESHOLD:
        return {
            "is_attack": True,
            "attack_type": "Brute Force",
            "threat_level": "medium",
            "confidence": 0.78
        }
    
    # DDoS indicators
    syn_count = network_data.get("syn_count", 0)
    rate = network_data.get("Rate", 0)
    
    if syn_count > 100 or rate > 10000:
        return {
            "is_attack": True,
            "attack_type": "DDoS",
            "threat_level": "critical",
            "confidence": 0.90
        }
    
    return {
        "is_attack": False,
        "attack_type": None,
        "threat_level": "low",
        "confidence": 0.95
    }

# ============ Server Metrics ============
def get_server_metrics() -> dict:
    """Collect current server metrics"""
    metrics = {
        "hostname": socket.gethostname(),
        "platform": platform.system(),
        "timestamp": datetime.now().isoformat()
    }
    
    if HAS_PSUTIL:
        metrics.update({
            "cpu_percent": psutil.cpu_percent(interval=0.1),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage('/').percent if platform.system() != 'Windows' else psutil.disk_usage('C:').percent,
            "network_connections": len(psutil.net_connections()),
            "process_count": len(psutil.pids())
        })
    
    return metrics

# ============ FastAPI App ============
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"""
╔══════════════════════════════════════════════════════════════╗
║           SERVER-GUARD AGENT v1.0 - ACTIVE                  ║
╠══════════════════════════════════════════════════════════════╣
║  Agent ID:  {config.agent_id:<44} ║
║  Hostname:  {socket.gethostname():<44} ║
║  Platform:  {platform.system()} {platform.release():<36} ║
║  Port:      {config.port:<44} ║
║  Central:   {str(config.central_server or 'None (standalone mode)'):<44} ║
╚══════════════════════════════════════════════════════════════╝
    """)
    
    if config.central_server and HAS_REQUESTS:
        asyncio.create_task(forward_metrics_task())
    
    yield
    # Shutdown
    print("[AGENT] Shutting down...")

app = FastAPI(
    title="Server-Guard Agent",
    description="Lightweight security monitoring agent",
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

# ============ Endpoints ============
@app.get("/")
async def root():
    return {
        "service": "Server-Guard Agent",
        "version": "1.0.0",
        "agent_id": config.agent_id,
        "status": "active",
        "endpoints": ["/api/analyze", "/api/metrics", "/api/health"]
    }

@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "agent_id": config.agent_id,
        "uptime": time.time(),
        "metrics": get_server_metrics()
    }

@app.get("/api/metrics")
async def metrics():
    return get_server_metrics()

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(request: Request, data: AnalyzeRequest):
    """
    Main endpoint for attack simulation and threat detection.
    Compatible with Server-Guard Attack Simulation console.
    """
    # Get client IP
    client_ip = request.client.host if request.client else "unknown"
    
    # Detect threats
    detection = detect_threat_locally(
        payload=data.payload,
        network_data=data.network_data,
        source_ip=client_ip
    )
    
    # Build response
    response = AnalyzeResponse(
        status="blocked" if detection["is_attack"] else "allowed",
        threat_level=detection["threat_level"],
        is_attack=detection["is_attack"],
        attack_type=detection["attack_type"],
        confidence=detection["confidence"],
        web_ai_score=detection["confidence"] if detection["is_attack"] else 0.1,
        net_ai_score=detection["confidence"] * 0.9 if detection["is_attack"] else 0.05,
        agent_id=config.agent_id,
        server_info=get_server_metrics()
    )
    
    # Log detection
    if detection["is_attack"]:
        print(f"[ALERT] {detection['attack_type']} detected from {client_ip} - Threat: {detection['threat_level']}")
    
    # Forward to central server if configured
    if config.central_server and HAS_REQUESTS:
        try:
            requests.post(
                f"{config.central_server}/events",
                json={
                    "agent_id": config.agent_id,
                    "timestamp": datetime.now().isoformat(),
                    "source_ip": client_ip,
                    "detection": detection,
                    "payload_sample": data.payload[:100] if data.payload else None
                },
                timeout=2
            )
        except:
            pass  # Don't block on forwarding failure
    
    return response

# ============ Background Tasks ============
async def forward_metrics_task():
    """Periodically forward metrics to central server"""
    while True:
        await asyncio.sleep(config.forward_interval)
        if config.central_server and HAS_REQUESTS:
            try:
                requests.post(
                    f"{config.central_server}/agent/heartbeat",
                    json={
                        "agent_id": config.agent_id,
                        "timestamp": datetime.now().isoformat(),
                        "metrics": get_server_metrics()
                    },
                    timeout=5
                )
            except Exception as e:
                print(f"[WARN] Failed to send heartbeat: {e}")

# ============ Main ============
def main():
    parser = argparse.ArgumentParser(description="Server-Guard Agent")
    parser.add_argument("--port", type=int, default=8006, help="Port to run agent on")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--central-server", type=str, help="Central Server-Guard URL (e.g., http://your-server:8001)")
    
    args = parser.parse_args()
    
    config.port = args.port
    config.central_server = args.central_server
    
    uvicorn.run(app, host=args.host, port=args.port)

if __name__ == "__main__":
    main()
