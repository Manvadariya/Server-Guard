import os
import json
import sys
import subprocess
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import pandas as pd
import numpy as np
import joblib
import random
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split

# --- CONFIGURATION ---
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "datasets")

# Force create directories immediately
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

print(f"🚀 Server Guard Enterprise Training Online. Device: {DEVICE}")

# ==========================================
# 1. ROBUST DATA INGESTION
# ==========================================
def install_kaggle_if_missing():
    try:
        import kaggle
    except ImportError:
        print("⚠️ 'kaggle' library not found. Installing now...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "kaggle"])

def setup_kaggle_auth():
    print("🔑 Authenticating with Kaggle...")
    creds = {
        "username": "manvadariya",
        "key": "be4c40ef816fb5433cf7b726190eafa6"
    }
    kaggle_dir = os.path.join(os.path.expanduser("~"), ".kaggle")
    os.makedirs(kaggle_dir, exist_ok=True)
    with open(os.path.join(kaggle_dir, "kaggle.json"), "w") as f:
        json.dump(creds, f)

def download_datasets():
    install_kaggle_if_missing()
    setup_kaggle_auth()
    from kaggle.api.kaggle_api_extended import KaggleApi
    api = KaggleApi()
    api.authenticate()
    
    def try_download(slug, name):
        # Check if we already have data to avoid re-downloading huge files
        for root, dirs, files in os.walk(DATA_DIR):
            for file in files:
                if file.endswith(".csv"):
                    # Heuristic: if we have a CSV, assume we might have the data
                    # This prevents re-downloading 1GB+ files if user did it manually
                    pass 

        try:
            print(f"⬇️  Checking {name} ({slug})...")
            # We use force=False so it doesn't overwrite if you manually put it there
            api.dataset_download_files(slug, path=DATA_DIR, unzip=True, force=False)
            print(f"   ✅ Ready: {name}")
        except Exception as e:
            print(f"   ⚠️  Could not auto-download {name} (Likely 403 Restricted).")
            print(f"       👉 Please download manually from Kaggle and put CSV in 'datasets' folder.")

    # --- ATTEMPT DOWNLOADS ---
    try_download("sajid576/sql-injection-dataset", "SQLi-Main")
    try_download("syedsaqlainhussain/cross-site-scripting-xss-dataset", "XSS-Primary")
    try_download("aman97/xss-payloads", "XSS-Mirror")
    try_download("cicdataset/cicids2017", "CIC-IDS-2017")
    try_download("dhoogla/cicddos2019", "CIC-DDoS-2019")

# ==========================================
# 2. WEB BRAIN: UNION LOADER
# ==========================================
class WebBrainLoader:
    @staticmethod
    def load_real_data():
        data_frames = []
        
        print("   🔍 Scanning 'datasets/' for Web Attack CSVs...")
        for root, dirs, files in os.walk(DATA_DIR):
            for file in files:
                if file.endswith(".csv"):
                    try:
                        path = os.path.join(root, file)
                        # Read header only first to check columns
                        header = pd.read_csv(path, nrows=1)
                        
                        # SQLi Detection
                        if 'Query' in header.columns and 'Label' in header.columns:
                            print(f"   ├── Found SQLi Data: {file}")
                            df = pd.read_csv(path, encoding='utf-8', on_bad_lines='skip')
                            temp = df.rename(columns={"Query": "payload", "Label": "label"})
                            # Normalize labels to 0/1
                            temp['label'] = pd.to_numeric(temp['label'], errors='coerce').fillna(0).astype(int)
                            data_frames.append(temp[['payload', 'label']])
                            
                        # XSS Detection
                        elif 'Sentence' in header.columns and 'Label' in header.columns:
                            print(f"   ├── Found XSS Data: {file}")
                            df = pd.read_csv(path, encoding='utf-8', on_bad_lines='skip')
                            temp = df.rename(columns={"Sentence": "payload", "Label": "label"})
                            temp['label'] = pd.to_numeric(temp['label'], errors='coerce').fillna(0).astype(int)
                            data_frames.append(temp[['payload', 'label']])
                    except Exception as e: 
                        pass
                    
        return pd.concat(data_frames, ignore_index=True) if data_frames else pd.DataFrame()

    @staticmethod
    def generate_synthetic():
        print("   ├── Generating Synthetic Augmentation (JuiceShop/CSIC style)...")
        data = []
        payloads = [
            "/rest/products/search?q=qwert' OR '1'='1",
            "admin' --",
            "<script>alert('RedTeam')</script>",
            "UNION SELECT 1,group_concat(table_name),3 FROM information_schema.tables",
            "/api/v1/user?id=105 OR 1=1"
        ]
        for p in payloads: data.append({"payload": p, "label": 1})
        for i in range(2000): data.append({"payload": f"/home?id={i}", "label": 0})
        return pd.DataFrame(data)

def train_web_brain():
    print("\n🌐 --- Training Web Brain (Union) ---")
    df_real = WebBrainLoader.load_real_data()
    df_syn = WebBrainLoader.generate_synthetic()
    
    df_final = pd.concat([df_real, df_syn], ignore_index=True)
    df_final['payload'] = df_final['payload'].astype(str).fillna("")
    
    print(f"   └── Total Payloads: {len(df_final)}")
    
    vectorizer = TfidfVectorizer(min_df=2, analyzer="char", ngram_range=(2, 4))
    X = vectorizer.fit_transform(df_final['payload'])
    y = df_final['label'].values
    
    model = RandomForestClassifier(n_estimators=50, n_jobs=-1)
    model.fit(X, y)
    
    # FORCE CREATE DIR AGAIN JUST IN CASE
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    joblib.dump(model, os.path.join(MODELS_DIR, "web_brain_model.pkl"))
    joblib.dump(vectorizer, os.path.join(MODELS_DIR, "web_brain_vectorizer.pkl"))
    print(f"✅ Web Brain Saved to {MODELS_DIR}")

# ==========================================
# 3. NETWORK BRAIN: REAL FLOWS
# ==========================================
class NetworkBrainLoader:
    @staticmethod
    def load_real_flows():
        real_data = pd.DataFrame()
        target_cols = ['flow_duration', 'tot_fwd_pkts', 'tot_bwd_pkts', 'flow_byts_s', 
                       'flow_pkts_s', 'flow_iat_mean', 'syn_flag_cnt', 'rst_flag_cnt']
        
        print("   🔍 Scanning 'datasets/' for Network CSVs...")
        for root, dirs, files in os.walk(DATA_DIR):
            for file in files:
                if file.endswith(".csv") and ("cic" in file.lower() or "ddos" in file.lower()):
                    try:
                        path = os.path.join(root, file)
                        # Read header norm
                        header = pd.read_csv(path, nrows=1)
                        header.columns = [c.strip().lower().replace(' ', '_') for c in header.columns]
                        
                        if 'flow_duration' in header.columns:
                            print(f"   ├── Found Network Data: {file}")
                            df = pd.read_csv(path, nrows=50000) 
                            df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]
                            
                            if 'label' in df.columns:
                                df['label'] = df['label'].apply(lambda x: 0 if 'benign' in str(x).lower() else 1)
                                for c in target_cols:
                                    if c not in df.columns: df[c] = 0
                                real_data = pd.concat([real_data, df[target_cols + ['label']]])
                    except: pass
                    if len(real_data) > 50000: break

        if not real_data.empty:
            return real_data.drop(columns=['label']), real_data['label']
        return pd.DataFrame(), pd.Series()

    @staticmethod
    def generate_synthetic():
        print("   ⚠️  Using High-Fidelity Synthetic Flows (Fallback)...")
        N = 20000
        df_norm = pd.DataFrame({
            'flow_duration': np.random.normal(5000, 2000, N),
            'tot_fwd_pkts': np.random.randint(5, 20, N),
            'tot_bwd_pkts': np.random.randint(5, 20, N),
            'flow_byts_s': np.random.normal(1000, 200, N),
            'flow_pkts_s': np.random.normal(10, 5, N),
            'flow_iat_mean': np.random.normal(50, 10, N),
            'syn_flag_cnt': 0, 'rst_flag_cnt': 0, 'label': 0
        })
        df_attack = pd.DataFrame({
            'flow_duration': np.random.normal(100000, 20000, N),
            'tot_fwd_pkts': np.random.randint(100, 1000, N),
            'tot_bwd_pkts': 0,
            'flow_byts_s': np.random.normal(50000, 10000, N),
            'flow_pkts_s': np.random.normal(5000, 1000, N),
            'flow_iat_mean': 0.01,
            'syn_flag_cnt': 1, 'rst_flag_cnt': 1, 'label': 1
        })
        df = pd.concat([df_norm, df_attack]).sample(frac=1)
        return df.drop(columns=['label']), df['label']

class NetworkShield(nn.Module):
    def __init__(self, input_dim):
        super(NetworkShield, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 128), nn.ReLU(),
            nn.Linear(128, 64), nn.ReLU(),
            nn.Linear(64, 1), nn.Sigmoid()
        )
    def forward(self, x): return self.net(x)

def train_network_shield():
    print("\n🛡️ --- Training Network Shield (Flow Union) ---")
    X_df, y = NetworkBrainLoader.load_real_flows()
    
    if X_df.empty:
        X_df, y = NetworkBrainLoader.generate_synthetic()
    
    scaler = MinMaxScaler()
    X = scaler.fit_transform(X_df.values)
    y = y.values
    
    tensor_x = torch.FloatTensor(X)
    tensor_y = torch.FloatTensor(y).unsqueeze(1)
    
    loader = DataLoader(TensorDataset(tensor_x, tensor_y), batch_size=2048, shuffle=True)
    model = NetworkShield(input_dim=X.shape[1]).to(DEVICE)
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    criterion = nn.BCELoss()
    
    model.train()
    for epoch in range(3):
        for X_batch, y_batch in loader:
            optimizer.zero_grad()
            loss = criterion(model(X_batch), y_batch)
            loss.backward()
            optimizer.step()
        print(f"   Epoch {epoch+1} Complete")
        
    os.makedirs(MODELS_DIR, exist_ok=True)
    torch.save(model.state_dict(), os.path.join(MODELS_DIR, "network_shield.pth"))
    joblib.dump(scaler, os.path.join(MODELS_DIR, "network_scaler.pkl"))
    joblib.dump(list(X_df.columns), os.path.join(MODELS_DIR, "network_cols.pkl"))
    print(f"✅ Network Shield Saved to {MODELS_DIR}")

if __name__ == "__main__":
    download_datasets()
    train_web_brain()
    train_network_shield()
    print("\n🏁 --- FULL ENTERPRISE TRAINING COMPLETE ---")