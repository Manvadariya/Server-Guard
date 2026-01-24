import requests
import json
import time

BASE_URL = "http://localhost:8002"

def test_health():
    print(f"Testing GET {BASE_URL}/health ...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Failed: {e}")
    print("-" * 50)

def test_rules():
    print(f"Testing GET {BASE_URL}/rules ...")
    try:
        response = requests.get(f"{BASE_URL}/rules")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Failed: {e}")
    print("-" * 50)

def test_analyze_single():
    print(f"Testing POST {BASE_URL}/analyze ...")
    try:
        with open("clean_events.json", "r") as f:
            events = json.load(f)
        
        for event in events:
            print(f"Sending event: {event.get('event_id')}")
            response = requests.post(f"{BASE_URL}/analyze", json=event)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                print(f"Response: {json.dumps(response.json(), indent=2)}")
            else:
                print(f"Error: {response.text}")
            print("." * 30)
    except Exception as e:
        print(f"Failed: {e}")
    print("-" * 50)

def test_analyze_batch():
    print(f"Testing POST {BASE_URL}/analyze/batch ...")
    try:
        with open("clean_events.json", "r") as f:
            events = json.load(f)
        
        print(f"Sending batch of {len(events)} events")
        response = requests.post(f"{BASE_URL}/analyze/batch", json=events)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Failed: {e}")
    print("-" * 50)

if __name__ == "__main__":
    print("Starting API Tests...\n")
    test_health()
    test_rules()
    test_analyze_single()
    test_analyze_batch()
