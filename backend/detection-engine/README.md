# Threat_Ops.ai - Detection Engine

Rule-based anomaly detection service.

## Features

- **SQL Injection Detection** - Pattern matching for malicious queries
- **Rate Spike Detection** - Abnormal request rates per IP
- **Metric Thresholds** - High CPU/Memory/Network alerts
- **Brute Force Detection** - Failed authentication patterns


## 🧪 How to Test

### 1. Using the Test Script
We provide a python script to run automated functionality tests.

1.  **Start the server:**
    ```bash
    uvicorn main:app --host 0.0.0.0 --port 8002
    ```

2.  **Run the test script:**
    Create a file named `test_detection.py` with the following content:

    <details>
    <summary>Click to view test_detection.py</summary>

    ```python
    import requests
    import json
    import time
    import sys

    # Configuration
    BASE_URL = "http://localhost:8002"
    TEST_EVENTS_FILE = "test_events.json"

    def run_tests():
        print(f"Testing Detection Engine at {BASE_URL}...")
        
        # 1. Check Health
        try:
            response = requests.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                print("✅ Health check passed!")
            else:
                print(f"❌ Health check failed: {response.status_code}")
                sys.exit(1)
        except requests.exceptions.ConnectionError:
            print(f"❌ Could not connect to {BASE_URL}. Is the server running?")
            sys.exit(1)

        # 2. Test Analysis with test_events.json
        print("\nSending Test Events...")
        try:
            with open(TEST_EVENTS_FILE, 'r') as f:
                events = json.load(f)
        except FileNotFoundError:
            print(f"❌ {TEST_EVENTS_FILE} not found!")
            return

        for event in events:
            print(f"\nSending event: {event['event_id']} ({event['event_type']})")
            time.sleep(0.1)
            response = requests.post(f"{BASE_URL}/analyze", json=event)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('anomalies'):
                    print(f"⚠️  ANOMALY DETECTED! ({len(result['anomalies'])})")
                else:
                    print("✅  No anomalies detected.")
            else:
                print(f"❌ Request failed: {response.text}")

    if __name__ == "__main__":
        run_tests()
    ```
    </details>

    Then run:
    ```bash
    python test_detection.py
    ```

### 2. Manual Testing (cURL)
Test a SQL Injection detection manually:

```bash
curl -X POST "http://localhost:8002/analyze" \
     -H "Content-Type: application/json" \
     -d '{
           "event_id": "manual-test-01",
           "source_ip": "10.0.0.5",
           "timestamp": 1710000000,
           "service": "web-app",
           "event_type": "http_request",
           "payload": {
             "path": "/login",
             "query": "SELECT * FROM users WHERE id=1 OR 1=1"
           }
         }'
```

---
## 📝 Logging
Logs are output in **JSON format** for easy ingestion by Splunk, Datadog, or ELK.
Example log entry:
```json
{"timestamp": "2024-05-20T10:00:00Z", "level": "INFO", "logger": "detection_engine", "message": "Anomaly detected", "extra_fields": {"rule": "SQL Injection", "severity": "critical"}}
```

Service runs at: **http://localhost:8002**

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/rules` | List detection rules |
| POST | `/analyze` | Analyze single event |
| POST | `/analyze/batch` | Analyze multiple events |

## Test Detection

```bash
# SQL Injection test
curl -X POST http://localhost:8002/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "test-1",
    "source_ip": "192.168.1.100",
    "domain": "healthcare",
    "service": "api",
    "event_type": "http_request",
    "payload": {"query": "SELECT * FROM users WHERE id=1 OR 1=1"},
    "timestamp": 1710000000
  }'

# High CPU test
curl -X POST http://localhost:8002/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "test-2",
    "source_ip": "10.0.0.1",
    "domain": "infrastructure",
    "service": "database",
    "event_type": "system_metric",
    "payload": {"cpu": 95.0, "memory": 60.0},
    "timestamp": 1710000000
  }'
```

## Detection Rules

| Rule | Trigger | Severity |
|------|---------|----------|
| `sql_injection` | SQL patterns in payload | Critical |
| `rate_spike` | >100 req/min from IP | Warning |
| `high_cpu` | CPU > 85% | Warning/Critical |
| `high_memory` | Memory > 90% | Critical |
| `high_network` | Network > 900 KB/s | Warning |
| `brute_force` | 5+ failed auths in 5min | Critical |
