
from pydantic import BaseModel
from typing import Optional, Dict, Any

class TelemetryPayload(BaseModel):
    event_id: str
    source_ip: str
    service: str
    domain: str = "general" # healthcare, agri, urban
    event_type: str # log, metric, heartbeat
    payload: Dict[str, Any]
    timestamp: float
