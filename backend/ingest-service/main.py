import os
import uuid
import time
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import socketio
import aiohttp

# Import from our cleaned storage and schemas
from schemas import TelemetryEventInput, TelemetryEvent, IngestResponse, HealthResponse
from storage import init_storage, save_telemetry, get_recent_telemetry, get_event_count, clear_storage

# Configuration
DETECTION_ENGINE_URL = os.environ.get("DETECTION_ENGINE_URL", "http://localhost:8002")
API_GATEWAY_URL = os.environ.get("API_GATEWAY_URL", "http://localhost:3001")

# Socket.IO for Real-Time Dashboard updates
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=False
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Server Guard Ingest Service starting...")
    init_storage()
    print(f"Storage initialized. Events in DB: {get_event_count()}")
    print(f"Forwarding to Detection Engine at: {DETECTION_ENGINE_URL}")
    yield
    print("Ingest Service shutting down...")

app = FastAPI(
    title="Server Guard - Ingest Service",
    description="High-throughput server telemetry ingestion",
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

# Wrap FastAPI with Socket.IO
socket_app = socketio.ASGIApp(sio, app)

# ==========================================
# 1. REAL-TIME SOCKET EVENTS
# ==========================================
@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")
    await sio.emit('connected', {'message': 'Connected to Server Guard Ingest'}, to=sid)

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

# ==========================================
# 2. HEALTH & UTILS
# ==========================================
@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    return HealthResponse(
        status="healthy",
        service="server-guard-ingest",
        version="1.0.0",
        events_ingested=get_event_count()
    )

async def forward_to_detection(event_dict: dict):
    """Async background task to send data to AI engine without blocking ingest"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{DETECTION_ENGINE_URL}/analyze",
                json=event_dict,
                timeout=aiohttp.ClientTimeout(total=5)
            ) as resp:
                if resp.status == 200:
                    analysis = await resp.json()
                    anomalies = analysis.get("anomalies_detected", 0)
                    if anomalies > 0:
                        print(f"[WARN] Detection Engine found {anomalies} anomalies")
    except Exception as e:
        # We just log connection errors, we don't crash the ingest
        print(f"[WARN] Could not reach Detection Engine: {e}")

async def forward_to_api_gateway(event_dict: dict):
    """Forward telemetry event to API Gateway for frontend broadcast"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{API_GATEWAY_URL}/internal/telemetry",
                json=event_dict,
                timeout=aiohttp.ClientTimeout(total=3)
            ) as resp:
                if resp.status == 200:
                    print(f"[INFO] Event forwarded to API Gateway")
                else:
                    print(f"[WARN] API Gateway returned status {resp.status}")
    except Exception as e:
        print(f"[WARN] Could not reach API Gateway: {e}")

# ==========================================
# 3. CORE INGESTION API
# ==========================================
@app.post("/ingest", response_model=IngestResponse, tags=["Ingest"])
async def ingest_event(event_input: TelemetryEventInput, background_tasks: BackgroundTasks):
    try:
        # 1. Generate IDs and Timestamps
        event_id = event_input.event_id or str(uuid.uuid4())
        timestamp = event_input.timestamp or int(time.time())

        # 2. Normalize Data
        normalized_event = TelemetryEvent(
            event_id=event_id,
            source_ip=event_input.source_ip,
            domain=event_input.domain,
            service=event_input.service,
            event_type=event_input.event_type,
            payload=event_input.payload,
            timestamp=timestamp,
            received_at=datetime.utcnow().isoformat() + "Z"
        )

        event_dict = normalized_event.model_dump()

        # 3. Store Locally (Fast)
        stored = save_telemetry(event_dict)
        if not stored:
            print("[ERROR] Failed to write to local storage")

        # 4. Forward to API Gateway for frontend display (Background Task)
        background_tasks.add_task(forward_to_api_gateway, event_dict)

        # 5. Forward to AI Engine (Background Task)
        # We use BackgroundTasks so the API returns immediately to the client
        background_tasks.add_task(forward_to_detection, event_dict)

        print(f"[INFO] Ingested: {event_input.event_type} from {event_input.service}")

        return IngestResponse(
            success=True,
            event_id=event_id,
            message="Event queued for analysis"
        )

    except Exception as e:
        print(f"[ERROR] Ingest error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/events", tags=["Events"])
async def list_events(limit: int = 50):
    """Get recent events for dashboard history"""
    events = get_recent_telemetry(limit=limit)
    return {
        "events": events,
        "count": len(events),
        "total": get_event_count()
    }

@app.delete("/events", tags=["Events"])
async def delete_events():
    """Clear audit logs"""
    cleared = clear_storage()
    if cleared:
        return {"message": "All server events cleared"}
    raise HTTPException(status_code=500, detail="Failed to clear events")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    print(f"Server Guard Ingest Service running on port {port}")
    uvicorn.run(socket_app, host="0.0.0.0", port=port, reload=False)