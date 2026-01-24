import requests
import random
import time
import json
from datetime import datetime

# Try to import colorama for "Hacker Terminal" aesthetics
try:
    from colorama import init, Fore, Style
    init(autoreset=True)
    HAS_COLOR = True
except ImportError:
    HAS_COLOR = False
    print("⚠️  Install colorama for cool visuals: pip install colorama")

# --- CONFIGURATION ---
API_URL = "http://127.0.0.1:8006/api/analyze"
DELAY = 1.0 # Seconds between attacks

# --- ATTACK DICTIONARIES ---
SQL_PAYLOADS = [
    "' OR 1=1 --",
    "UNION SELECT username, password FROM users",
    "admin' --",
    "1; DROP TABLE production_logs",
    "' OR '1'='1",
    "SELECT * FROM data WHERE id=1 OR 1=1"
]

OBFUSCATED_PAYLOADS = [
    "%27%20OR%201%3D1%20--",  # URL Encoded ' OR 1=1 --
    "UNION/**/SELECT/**/user,password/**/FROM/**/users", # Comment evasion
    "<sCrIpT>alert(1)</ScRiPt>", # Mixed case XSS
    "javascript:alert('XSS')"
]

NORMAL_URIS = [
    "GET /home HTTP/1.1",
    "POST /login_user",
    "GET /products?id=452",
    "GET /dashboard/stats",
    "POST /cart/add"
]

# ═══════════════════════════════════════════════════════════════
# GENERATORS
# ═══════════════════════════════════════════════════════════════

def generate_network_stats(mode="normal"):
    """
    Generates Flow Statistics matching CIC-IDS feature maps.
    modes: 'normal', 'ddos', 'heavy_load'
    """
    if mode == "ddos":
        # Signature: High Rate, High SYN, Tiny IAT
        return {
            "Rate": random.uniform(8000, 50000),      # Packets/sec
            "syn_count": random.randint(100, 300),     # SYN Flood signature
            "IAT": random.uniform(0.001, 0.05),       # Inter-Arrival Time (ms)
            "Tot size": random.uniform(64, 128)       # Fixed small packets
        }
    elif mode == "heavy_load":
        # Signature: High Rate, but low SYN (Legitimate traffic spike)
        return {
            "Rate": random.uniform(2000, 4500),
            "syn_count": random.randint(5, 20),
            "IAT": random.uniform(0.1, 0.5),
            "Tot size": random.uniform(500, 1500)
        }
    else:
        # Normal Traffic
        return {
            "Rate": random.uniform(10, 800),
            "syn_count": random.randint(0, 4),
            "IAT": random.uniform(1.0, 5.0),
            "Tot size": random.uniform(200, 1200)
        }

def generate_server_metrics(mode="normal"):
    if mode == "crash":
        return {"cpu_usage": random.randint(96, 100), "ram_usage": random.randint(90, 100)}
    elif mode == "busy":
        return {"cpu_usage": random.randint(50, 80), "ram_usage": random.randint(40, 60)}
    else:
        return {"cpu_usage": random.randint(5, 30), "ram_usage": random.randint(20, 40)}

# ═══════════════════════════════════════════════════════════════
# SIMULATION SCENARIOS
# ═══════════════════════════════════════════════════════════════

def sim_web_traffic():
    """Simulates HTTP Layer Activity (SQLi/XSS vs Normal)"""
    dice = random.random()
    
    if dice < 0.2: # 20% Obfuscated Attack (Advanced)
        payload = random.choice(OBFUSCATED_PAYLOADS)
        msg = f"🥷  Injecting Obfuscated Payload: {payload[:30]}..."
        is_attack = True
    elif dice < 0.4: # 20% Standard Attack
        payload = random.choice(SQL_PAYLOADS)
        msg = f"🔨  Injecting SQLi Payload: {payload[:30]}..."
        is_attack = True
    else: # 60% Normal
        payload = random.choice(NORMAL_URIS)
        msg = "🟢  Normal User Browsing"
        is_attack = False
        
    data = {
        "service_type": "web_frontend",
        "payload": payload,
        "network_data": generate_network_stats("normal"),
        "server_metrics": generate_server_metrics("normal")
    }
    return data, msg, is_attack

def sim_network_flood():
    """Simulates Layer 4 Activity (DDoS vs Heavy Load)"""
    dice = random.random()
    
    if dice < 0.3: # 30% DDoS Attack
        net_stats = generate_network_stats("ddos")
        msg = f"🌊  LAUNCHING DDoS FLOOD ({int(net_stats['Rate'])} pkts/sec)"
        server_metrics = generate_server_metrics("crash") # Server struggling
        is_attack = True
    else: # Normal but busy
        net_stats = generate_network_stats("heavy_load")
        msg = f"📉  High Traffic Volume (Legitimate)"
        server_metrics = generate_server_metrics("busy")
        is_attack = False
        
    data = {
        "service_type": "api_gateway",
        "payload": "TCP_FLOW_DATA_ONLY",
        "network_data": net_stats,
        "server_metrics": server_metrics
    }
    return data, msg, is_attack

# ═══════════════════════════════════════════════════════════════
# UI HELPERS
# ═══════════════════════════════════════════════════════════════

def log_result(scenario_msg, is_attack_sent, response):
    """Pretty prints the battle between Red Team (Sim) and Blue Team (AI)"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    
    # Analyze Response
    status = response.get("status", "allowed")
    threat_level = response.get("threat_level", "low")
    ai_msg = response.get("message", "No analysis")
    score = response.get("score", 0.0)
    
    # Colors
    c_reset = Style.RESET_ALL if HAS_COLOR else ""
    c_red = Fore.RED if HAS_COLOR else ""
    c_green = Fore.GREEN if HAS_COLOR else ""
    c_cyan = Fore.CYAN if HAS_COLOR else ""
    c_yellow = Fore.YELLOW if HAS_COLOR else ""
    
    print(f"{c_cyan}[{timestamp}]{c_reset} {scenario_msg}")
    
    # Did the AI catch it?
    if status == "blocked":
        print(f"    └── 🛡️  {c_green}BLOCKED by ServerGuard{c_reset} | Threat: {c_red}{threat_level.upper()}{c_reset} | Conf: {score:.2f}")
        print(f"    └── 🤖  AI Reason: {ai_msg}")
    elif status == "warning":
         print(f"    └── ⚠️  {c_yellow}WARNING Triggered{c_reset} | {ai_msg}")
    else:
        if is_attack_sent:
            print(f"    └── ❌  {c_red}MISSED ATTACK!{c_reset} (False Negative)")
        else:
            print(f"    └── ✅  Allowed (Correct)")
            
    print("-" * 60)

# ═══════════════════════════════════════════════════════════════
# MAIN LOOP
# ═══════════════════════════════════════════════════════════════

def main():
    print(f"""
    {Fore.RED if HAS_COLOR else ""}
    ███████╗███████╗██████╗ ██╗   ██╗███████╗██████╗ 
    ██╔════╝██╔════╝██╔══██╗██║   ██║██╔════╝██╔══██╗
    ███████╗█████╗  ██████╔╝██║   ██║█████╗  ██████╔╝
    ╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██╔══╝  ██╔══██╗
    ███████║███████╗██║  ██║ ╚████╔╝ ███████╗██║  ██║
    ╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝
    {Style.RESET_ALL if HAS_COLOR else ""}
    🔴 RED TEAM SIMULATION DRIVER v2.0 (SERVER EDITION)
    🎯 Target: {API_URL}
    """)
    
    time.sleep(1)
    
    while True:
        try:
            # Randomly choose between Layer 7 (Web) or Layer 4 (Network) simulation
            if random.random() > 0.5:
                data, msg, is_attack = sim_web_traffic()
            else:
                data, msg, is_attack = sim_network_flood()
                
            # Send to Server Guard
            try:
                r = requests.post(API_URL, json=data, timeout=2)
                if r.status_code == 200:
                    log_result(msg, is_attack, r.json())
                else:
                    print(f"❌ API Error {r.status_code}: {r.text}")
            except requests.exceptions.ConnectionError:
                print(f"❌ Connection Refused at {API_URL}. Is app.py running?")
            
            time.sleep(DELAY)
            
        except KeyboardInterrupt:
            print("\n🛑 Simulation Stopped.")
            break
        except Exception as e:
            print(f"⚠️ Error: {e}")
            time.sleep(1)

if __name__ == "__main__":
    main()