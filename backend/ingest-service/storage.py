
from collections import deque

# Keep last 1000 records in memory
telemetry_db = deque(maxlen=1000)

def save_telemetry(data: dict):
    telemetry_db.append(data)
    return True

def get_recent_telemetry(limit: int = 50):
    return list(telemetry_db)[-limit:]
