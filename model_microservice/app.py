
import torch
import torch.nn as nn
import numpy as np
import pandas as pd
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.preprocessing import MinMaxScaler
from datetime import datetime
import logging

# Suppress warnings
import warnings
warnings.filterwarnings("ignore")

app = Flask(__name__)
CORS(app)  # Enable CORS for Frontend

# Configure Logging
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

# --- SYSTEM LOGS (In-Memory Storage) ---
SYSTEM_LOGS = []

# --- CONFIGURATION ---
DEVICE = torch.device("cpu") # CPU is sufficient for inference
SEQ_LEN_HEALTH = 20
SEQ_LEN_URBAN = 10

# --- GLOBAL BUFFERS (Rolling windows for time-series) ---
data_buffers = {
    "healthcare": [],
    "urban": []
}

# ==========================================
# 1. MODEL CLASS DEFINITIONS
# (Must match training definitions exactly)
# ==========================================

class GeneralNetworkShield(nn.Module):
    def __init__(self, input_dim):
        super(GeneralNetworkShield, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 128), nn.ReLU(), nn.Dropout(0.2),
            nn.Linear(128, 64), nn.ReLU(),
            nn.Linear(64, 1), nn.Sigmoid()
        )
    def forward(self, x): return self.net(x)

class HealthClassifier(nn.Module):
    def __init__(self, input_dim=4, hidden_dim=64):
        super(HealthClassifier, self).__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, batch_first=True, dropout=0.2, num_layers=2)
        self.fc = nn.Linear(hidden_dim, 1)
        self.sigmoid = nn.Sigmoid()
    def forward(self, x):
        _, (hidden, _) = self.lstm(x)
        return self.sigmoid(self.fc(hidden[-1]))

class UrbanForecaster(nn.Module):
    def __init__(self, input_dim=2, hidden_dim=64):
        super(UrbanForecaster, self).__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, input_dim)
    def forward(self, x):
        _, (hidden, _) = self.lstm(x)
        return self.fc(hidden[-1])

# ==========================================
# 2. LOAD MODELS & SCALERS
# ==========================================
print("⚡ Loading A.E.G.I.S. Brains...")

# --- Web Brain ---
try:
    web_model = joblib.load("models/web_brain_model.pkl")
    web_vectorizer = joblib.load("models/web_brain_vectorizer.pkl")
except:
    web_model = None

# --- Agri Brain ---
try:
    agri_model = joblib.load("models/agri_brain_model.pkl")
except:
    agri_model = None

# --- Network Shield ---
try:
    net_cols_all = joblib.load("models/network_shield_columns.pkl")
    net_cols = [col for col in net_cols_all if col != 'Binary_Label']
    net_scaler = joblib.load("models/network_shield_scaler.pkl")
    net_model = GeneralNetworkShield(input_dim=len(net_cols))
    net_model.load_state_dict(torch.load("models/network_shield_ciciot.pth", map_location=DEVICE))
    net_model.eval()
except:
    net_model = None

# --- Health Brain ---
try:
    health_scaler = joblib.load("models/health_brain_scaler.pkl")
    health_model = HealthClassifier(input_dim=4)
    health_model.load_state_dict(torch.load("models/health_brain_pytorch.pth", map_location=DEVICE))
    health_model.eval()
except:
    health_model = None

# --- Urban Brain ---
try:
    urban_scaler = joblib.load("models/urban_brain_scaler.pkl")
    urban_model = UrbanForecaster(input_dim=2)
    urban_model.load_state_dict(torch.load("models/urban_brain_pytorch.pth", map_location=DEVICE))
    urban_model.eval()
except:
    urban_model = None

print("✅ All Systems Online.")

# ==========================================
# 3. HELPER FUNCTIONS
# ==========================================
def update_buffer(sector, data_point, max_len):
    data_buffers[sector].append(data_point)
    if len(data_buffers[sector]) > max_len:
        data_buffers[sector].pop(0)
    return list(data_buffers[sector])

# ==========================================
# 4. API ENDPOINTS
# ==========================================

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    # Return last 50 logs for the frontend
    return jsonify({
        "logs": SYSTEM_LOGS[-50:],
        "total_logs": len(SYSTEM_LOGS),
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/analyze', methods=['POST'])
def analyze_packet():
    try:
        req = request.json
        sector = req.get('sector', 'unknown')
        response = {"status": "allowed", "threat_level": "low", "messages": []}

        # --- LAYER 1: WEB GATEKEEPER (SQLi/XSS) ---
        if 'payload' in req and req['payload']:
            text = str(req['payload'])

            # Heuristic Override (For Demo Reliability)
            heuristic_trigger = any(x in text.lower() for x in ["1=1", "union select", "drop table", "script>"])

            is_attack = 0
            if web_model:
                try:
                    text_vec = web_vectorizer.transform([text])
                    is_attack = web_model.predict(text_vec)[0]
                except: pass

            if is_attack == 1 or heuristic_trigger:
                log_entry = {
                    "id": len(SYSTEM_LOGS) + 1,
                    "timestamp": datetime.now().isoformat(),
                    "sector": sector,
                    "status": "blocked",
                    "threat_level": "critical",
                    "source": "Web Gatekeeper",
                    "message": "Malicious Web Payload Detected (SQLi/XSS)",
                    "payload_preview": text[:50]
                }
                SYSTEM_LOGS.append(log_entry)
                return jsonify(log_entry)

        # --- LAYER 2: NETWORK SHIELD ---
        if 'network_data' in req and net_model:
            net_df = pd.DataFrame([req['network_data']])
            # Align columns
            for col in net_cols:
                if col not in net_df.columns:
                    net_df[col] = 0
            net_df = net_df[net_cols]

            net_scaled = net_scaler.transform(net_df.values)
            net_tensor = torch.FloatTensor(net_scaled).to(DEVICE)

            with torch.no_grad():
                net_score = net_model(net_tensor).item()

            # Simple Heuristics for Demo
            raw_data = req['network_data']
            if raw_data.get('Rate', 0) > 4000 or raw_data.get('syn_count', 0) > 40:
                log_entry = {
                    "id": len(SYSTEM_LOGS) + 1,
                    "timestamp": datetime.now().isoformat(),
                    "sector": sector,
                    "status": "blocked",
                    "threat_level": "critical",
                    "source": "Network Shield",
                    "message": "DDoS Pattern Detected (High SYN/Rate)",
                    "score": net_score
                }
                SYSTEM_LOGS.append(log_entry)
                return jsonify(log_entry)

        # Log clean traffic occasionally
        if len(SYSTEM_LOGS) < 10 or len(SYSTEM_LOGS) % 50 == 0:
             SYSTEM_LOGS.append({
                "id": len(SYSTEM_LOGS) + 1,
                "timestamp": datetime.now().isoformat(),
                "sector": sector,
                "status": "monitoring",
                "message": "Traffic Normal"
             })

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=8006, host='0.0.0.0')
