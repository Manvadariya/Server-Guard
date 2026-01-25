from pydantic import BaseModel, field_validator
from typing import Optional, Dict, Any

class TelemetryEventInput(BaseModel):
    event_id: Optional[str] = None
    timestamp: Optional[float] = None
    source_ip: Optional[str] = None
    domain: Optional[str] = None
    service: str
    event_type: str
    payload: Dict[str, Any]

    @field_validator('domain')
    def validate_domain(cls, v):
        allowed_domains = ["web_server", "database", "auth_service", "api_gateway"]
        if v and v not in allowed_domains:
            raise ValueError(f"Domain '{v}' is not a valid Server Guard domain")
        if v == "agriculture":
            raise ValueError("Legacy IoT domain 'agriculture' is no longer supported")
        return v

class TelemetryEvent(BaseModel):
    event_id: str
    source_ip: Optional[str] = None
    domain: Optional[str] = None
    service: str
    event_type: str
    payload: Dict[str, Any]
    timestamp: float
    received_at: str

class IngestResponse(BaseModel):
    success: bool
    event_id: str
    message: str

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    events_ingested: int