
import requests
from flask import Flask, render_template, jsonify
from datetime import datetime

app = Flask(__name__)

# Microservice Endpoints
import os

# Microservice Endpoints (Via API Gateway)
API_GATEWAY_URL = os.environ.get("API_GATEWAY_URL", "http://localhost:3001")
INGEST_URL = f"{API_GATEWAY_URL}/proxy/logs"
RESPONSE_STATUS_URL = f"{API_GATEWAY_URL}/proxy/defense/status"
RESPONSE_ACTIONS_URL = f"{API_GATEWAY_URL}/proxy/defense/actions"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/stats')
def get_stats():
    response_data = {
        "logs": [],
        "blocked_count": 0,
        "isolated_count": 0,
        "actions": []
    }

    # 1. Get Live Traffic Logs
    try:
        r_logs = requests.get(INGEST_URL, timeout=2).json()
        if isinstance(r_logs, list):
            response_data["logs"] = r_logs
    except Exception as e:
        print(f"Log fetch failed: {e}")

    # 2. Get Defense Status
    try:
        r_status = requests.get(RESPONSE_STATUS_URL, timeout=2).json()
        response_data["blocked_count"] = len(r_status.get("blocked_ips", []))
        response_data["isolated_count"] = len(r_status.get("isolated_services", []))
    except Exception as e:
        print(f"Status fetch failed: {e}")

    # 3. Get Recent Actions
    try:
        r_actions = requests.get(RESPONSE_ACTIONS_URL, timeout=2).json()
        response_data["actions"] = r_actions.get("actions", [])
    except Exception as e:
        print(f"Action fetch failed: {e}")

    return jsonify(response_data)

if __name__ == '__main__':
    app.run(port=8000, host='0.0.0.0')
