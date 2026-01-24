
import os
import uuid
from typing import List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from contextlib import asynccontextmanager
from playbooks import run_playbook, get_action_log, blocked_ips, isolated_services

PORT = 8004

class Alert(BaseModel):
    id: str = str(uuid.uuid4())
    rule_id: str
    severity: str
    evidence: dict = {}
    source_ip: str = None
    service: str = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Response Engine running on port {PORT}")
    yield

app = FastAPI(lifespan=lifespan)

@app.get("/status")
async def get_status():
    return {
        "blocked_ips": list(blocked_ips),
        "isolated_services": list(isolated_services),
        "actions_executed": len(get_action_log())
    }

@app.get("/actions")
async def list_actions():
    return {"actions": get_action_log()[-20:]} # Return last 20 actions

@app.post("/execute")
async def execute_response(alert: Alert):
    print(f"⚡ Executing Response for Alert: {alert.rule_id} ({alert.severity})")
    results = run_playbook(alert.model_dump())
    return {
        "alert_id": alert.id,
        "actions_taken": results
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
