import torch
import torch.nn as nn
import numpy as np
import pandas as pd
import joblib
import os
import urllib.parse
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import warnings

# Suppress Version Mismatch Warnings (Safe to ignore for now)
warnings.filterwarnings("ignore", category=UserWarning)

# --- CONFIGURATION ---
app = Flask(__name__)
CORS(app) # Enable Cross-Origin for Dashboard
DEVICE = torch.device("cpu") # Inference on CPU is standard for web APIs
SYSTEM_LOGS = [] # In-memory storage for the dashboard

# ==========================================
# 1. MODEL ARCHITECTURES (Fixed to match train.py)
# ==========================================

class NetworkShield(nn.Module):
    """
    MATCHES TRAIN.PY EXACTLY:
    Linear(Input -> 128) -> ReLU -> Linear(128 -> 64) -> ReLU -> Linear(64 -> 1) -> Sigmoid
    """
    def __init__(self, input_dim):
        super(NetworkShield, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 128), nn.ReLU(),
            nn.Linear(128, 64), nn.ReLU(),
            nn.Linear(64, 1), nn.Sigmoid()
        )
    def forward(self, x): return self.net(x)

# ==========================================
# 2. MODEL LOADING
# ==========================================
print("⚡ Initializing Server Guard Inference Engine...")

# A. Load Web Brain (Random Forest)
try:
    web_model = joblib.load("models/web_brain_model.pkl")
    web_vectorizer = joblib.load("models/web_brain_vectorizer.pkl")
    print("✅ Web Brain (SQLi/XSS) Online.")
except Exception as e:
    print(f"⚠️ Web Brain Offline: {e}")
    web_model = None

# B. Load Network Brain (PyTorch)
try:
    net_cols = joblib.load("models/network_cols.pkl")
    net_scaler = joblib.load("models/network_scaler.pkl")
    
    # Initialize Model with correct input dimension
    net_model = NetworkShield(input_dim=len(net_cols))
    
    # Load Weights (Map to CPU)
    net_model.load_state_dict(torch.load("models/network_shield.pth", map_location=DEVICE))
    net_model.eval() # Set to evaluation mode
    print("✅ Network Shield (Flow Analysis) Online.")
except Exception as e:
    print(f"⚠️ Network Shield Offline: {e}")
    net_model = None

print("🚀 System Ready.")

# ==========================================
# 3. HELPER: DATA ADAPTER
# ==========================================
def adapt_network_features(sim_data):
    """
    Bridging Logic:
    Converts simple simulation metrics (Rate, SYN Count) into 
    the complex Flow Features expected by the CIC-IDS trained model.
    """
    # 1. Create a dictionary with defaults (0) for all expected columns
    features = {col: 0.0 for col in net_cols}
    
    # 2. Map available simulation data to model features
    if 'Rate' in sim_data:
        features['flow_pkts_s'] = float(sim_data['Rate'])
        features['flow_byts_s'] = float(sim_data['Rate']) * 60 
        
    if 'syn_count' in sim_data:
        features['syn_flag_cnt'] = 1.0 if sim_data['syn_count'] > 5 else 0.0
        
    if 'IAT' in sim_data:
        features['flow_iat_mean'] = float(sim_data['IAT'])
        
    # 3. Infer other features based on context for better accuracy
    if features['flow_pkts_s'] > 1000:
        # High rate implies attack characteristics
        features['flow_duration'] = 100000.0
        features['tot_fwd_pkts'] = 100.0
    else:
        # Normal characteristics
        features['flow_duration'] = 5000.0
        features['tot_fwd_pkts'] = 10.0

    # 4. Return ordered values as DataFrame
    return pd.DataFrame([features], columns=net_cols)

# ==========================================
# 4. API ENDPOINTS
# ==========================================

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    """Returns recent logs for the UI"""
    return jsonify({
        "logs": SYSTEM_LOGS[-50:], # Send last 50 logs
        "total_logs": len(SYSTEM_LOGS),
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/analyze', methods=['POST'])
def analyze_packet():
    """
    Main Analysis Pipeline:
    Request -> Web Brain (Layer 1) -> Network Brain (Layer 2) -> Heuristics (Layer 3)
    """
    try:
        req = request.json
        service = req.get('service_type', 'unknown')
        response = {"status": "allowed", "threat_level": "low", "messages": []}

        # --- LAYER 1: WEB GATEKEEPER (SQLi/XSS Detection) ---
        if 'payload' in req and req['payload']:
            raw_text = str(req['payload'])
            
            # A. Heuristic Fast-Fail (Catch obvious test patterns)
            lower_text = raw_text.lower()
            heuristic_triggers = ["1=1", "union select", "drop table", "script>", "alert("]
            heuristic_hit = any(x in lower_text for x in heuristic_triggers)
            
            # B. AI Inference
            ai_score = 0
            if web_model:
                try:
                    # Normalize (URL decode, etc)
                    norm_text = urllib.parse.unquote(lower_text)
                    # Vectorize
                    vec = web_vectorizer.transform([norm_text])
                    # Predict
                    try:
                        ai_score = float(web_model.predict_proba(vec)[0][1])
                    except:
                        ai_score = float(web_model.predict(vec)[0])
                except: pass

            # C. Decision Logic
            if ai_score > 0.7 or heuristic_hit:
                log_entry = {
                    "id": len(SYSTEM_LOGS) + 1,
                    "timestamp": datetime.now().isoformat(),
                    "service": service,
                    "status": "blocked",
                    "threat_level": "critical",
                    "source": "Web Gatekeeper",
                    "message": f"Malicious Web Payload Detected (SQLi/XSS)",
                    "payload_preview": raw_text[:50],
                    "score": 0.99
                }
                SYSTEM_LOGS.append(log_entry)
                return jsonify(log_entry)

        # --- LAYER 2: NETWORK SHIELD (DDoS/Flow Detection) ---
        if 'network_data' in req and net_model:
            # A. Adapt Data (Simulation -> Model Features)
            net_df = adapt_network_features(req['network_data'])
            
            # B. Preprocess
            net_scaled = net_scaler.transform(net_df.values)
            net_tensor = torch.FloatTensor(net_scaled).to(DEVICE)
            
            # C. AI Inference
            with torch.no_grad():
                net_prob = net_model(net_tensor).item()
            
            # D. Decision Logic
            # We use a threshold of 0.8 for the neural net
            if net_prob > 0.8:
                log_entry = {
                    "id": len(SYSTEM_LOGS) + 1,
                    "timestamp": datetime.now().isoformat(),
                    "service": service,
                    "status": "blocked",
                    "threat_level": "critical",
                    "source": "Network Shield",
                    "message": f"Anomalous Traffic Flow Detected (DDoS Signature)",
                    "score": net_prob
                }
                SYSTEM_LOGS.append(log_entry)
                return jsonify(log_entry)

        # --- LAYER 3: RESOURCE MONITOR (Metrics) ---
        if 'server_metrics' in req:
            metrics = req['server_metrics']
            cpu = metrics.get('cpu_usage', 0)
            
            if cpu > 95:
                log_entry = {
                    "id": len(SYSTEM_LOGS) + 1,
                    "timestamp": datetime.now().isoformat(),
                    "service": service,
                    "status": "warning",
                    "threat_level": "high",
                    "source": "Resource Monitor",
                    "message": f"Critical CPU Usage: {cpu}%",
                    "score": 1.0
                }
                SYSTEM_LOGS.append(log_entry)
                return jsonify(log_entry)

        # --- LOG NORMAL TRAFFIC (Sampled) ---
        if len(SYSTEM_LOGS) % 5 == 0:
             SYSTEM_LOGS.append({
                "id": len(SYSTEM_LOGS) + 1,
                "timestamp": datetime.now().isoformat(),
                "service": service,
                "status": "monitoring",
                "message": "Traffic Normal",
                "score": 0.0
             })

        return jsonify(response)

    except Exception as e:
        print(f"❌ API Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🧠 Server Guard AI running on port 8006")
    app.run(debug=False, port=8006, host='0.0.0.0')