
import requests
from flask import Flask, render_template, jsonify
from datetime import datetime

app = Flask(__name__)

# Microservice Endpoints
INGEST_URL = "http://localhost:8001/logs"
RESPONSE_STATUS_URL = "http://localhost:8004/status"
RESPONSE_ACTIONS_URL = "http://localhost:8004/actions"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/stats')
def get_stats():
    try:
        # 1. Get Live Traffic Logs
        r_logs = requests.get(INGEST_URL, timeout=1).json()

        # 2. Get Defense Status
        r_status = requests.get(RESPONSE_STATUS_URL, timeout=1).json()

        # 3. Get Recent Actions
        r_actions = requests.get(RESPONSE_ACTIONS_URL, timeout=1).json()

        return jsonify({
            "logs": r_logs,
            "blocked_count": len(r_status.get("blocked_ips", [])),
            "isolated_count": len(r_status.get("isolated_services", [])),
            "actions": r_actions.get("actions", [])
        })
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == '__main__':
    app.run(port=8000, host='0.0.0.0')
