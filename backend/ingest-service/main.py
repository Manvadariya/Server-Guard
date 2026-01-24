
import aiohttp
import uuid
from fastapi import FastAPI, BackgroundTasks
from schemas import TelemetryPayload
from storage import save_telemetry, get_recent_telemetry
from contextlib import asynccontextmanager

PORT = 8001
DETECTION_ENGINE_URL = "http://localhost:8002/analyze"

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Ingest Service running on port {PORT}")
    yield

app = FastAPI(lifespan=lifespan)

async def forward_to_detection(data: dict):
    # Asynchronously push to Detection Engine
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(DETECTION_ENGINE_URL, json=data) as resp:
                pass
    except Exception as e:
        print(f"⚠️ Failed to forward to Detection Engine: {e}")

@app.post("/ingest")
async def ingest_telemetry(data: TelemetryPayload, background_tasks: BackgroundTasks):
    # 1. Save to DB
    record = data.model_dump()
    save_telemetry(record)

    # 2. Forward to Detection (Fire & Forget)
    background_tasks.add_task(forward_to_detection, record)

    return {"status": "received", "event_id": data.event_id}

@app.get("/logs")
def get_logs(limit: int = 20):
    return get_recent_telemetry(limit)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
