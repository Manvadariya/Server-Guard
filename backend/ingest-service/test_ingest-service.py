import requests
import json

API_URL = "http://localhost:8001"

def test_server_ingest():
    print("🧪 TEST 1: Sending Valid Server Telemetry...")
    
    payload = {
        "source_ip": "10.0.0.50",
        "domain": "web_server",  # Valid Domain
        "service": "nginx-proxy",
        "event_type": "http_request",
        "payload": {
            "method": "POST",
            "path": "/admin/login",
            "status": 403,
            "user_agent": "Mozilla/5.0"
        }
    }
    
    try:
        r = requests.post(f"{API_URL}/ingest", json=payload)
        if r.status_code == 200:
            print(f"✅ SUCCESS: Server log ingested. Event ID: {r.json()['event_id']}")
        else:
            print(f"❌ FAILED: {r.status_code} - {r.text}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")

def test_legacy_iot_rejection():
    print("\n🧪 TEST 2: Sending Legacy IoT Data (Should Fail Validation)...")
    
    payload = {
        "source_ip": "192.168.1.5",
        "domain": "agriculture",  # <--- INVALID DOMAIN (We removed this!)
        "service": "soil-sensor-01",
        "event_type": "sensor_reading",
        "payload": {"moisture": 80}
    }
    
    try:
        r = requests.post(f"{API_URL}/ingest", json=payload)
        if r.status_code == 422: # Validation Error
            print("✅ SUCCESS: Legacy 'agriculture' domain correctly rejected.")
        elif r.status_code == 200:
            print("❌ FAILURE: The API still accepted IoT data! Cleanup incomplete.")
        else:
            print(f"⚠️ Unexpected Status: {r.status_code}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    test_server_ingest()
    test_legacy_iot_rejection()