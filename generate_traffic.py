import requests
import time
import uuid
import random
import json
from datetime import datetime
from threading import Thread

# Color codes
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RESET = "\033[0m"

GATEWAY_URL = "http://localhost:3001/internal/telemetry"
INGEST_URL = "http://localhost:8001/ingest"

def send_payload(data):
    # Send to Gateway (for Dashboard Visualization)
    try:
        requests.post(GATEWAY_URL, json=data, timeout=1)
    except:
        pass

    # Send to Ingest (for Detection)
    try:
        requests.post(INGEST_URL, json=data, timeout=1)
    except:
        pass

def simulate_healthy_host(hostname, ip):
    while True:
        event_id = str(uuid.uuid4())
        timestamp = int(time.time())
        
        # Normal fluctuation
        cpu = random.uniform(10, 40)
        memory = random.uniform(30, 60)
        network = random.uniform(10, 100)
        
        payload = {
            "event_id": event_id,
            "source_ip": ip,
            "domain": "finance",
            "service": hostname,
            "event_type": "metric",
            "payload": {
                "cpu": cpu,
                "memory": memory,
                "network": network,
                "requests": random.randint(5, 20)
            },
            "timestamp": timestamp
        }
        
        send_payload(payload)
        # print(f"{GREEN} [HEALTHY] {hostname} sent metrics.{RESET}")
        time.sleep(2)

def simulate_attacker():
    attacks = [
        # SQL Injection
        {
            "type": "sql_injection_attempt",
            "payload": {"query": "SELECT * FROM users WHERE id = '1' OR '1'='1'", "username": "admin"},
            "msg": "Trying SQL Injection..."
        },
        # Brute Force (simulated as failed auth)
        {
            "type": "auth_failure",
            "payload": {"username": "admin", "success": False, "password": "password123"},
            "msg": "Brute forcing login..."
        },
        # High CPU (Crypto miner?)
        {
            "type": "metric",
            "payload": {"cpu": 95, "memory": 80, "network": 200},
            "msg": "High CPU detected (Possible Miner)..."
        },
        # XSS Attack
        {
            "type": "xss_attempt",
            "payload": {"query": "<script>alert('XSS')</script>", "username": "victim"},
            "msg": "Injecting XSS payload..."
        },
        # Network Flood (DDoS)
        {
            "type": "metric_flood",
            "payload": {"cpu": 30, "memory": 40, "network": 5000, "syn_count": 100},
            "msg": "Flooding Network (DDoS)..."
        }
    ]

    attacker_ip = "10.66.6.66"
    ddos_ip = "192.168.99.99"

    while True:
        time.sleep(random.randint(5, 10)) # Attack every 5-10 seconds
        
        attack = random.choice(attacks)
        event_id = str(uuid.uuid4())
        
        data = {
            "event_id": event_id,
            "source_ip": attacker_ip,
            "domain": "finance",
            "service": "web-server-01", # attacking the web server
            "event_type": attack['type'],
            "payload": attack['payload'],
            "timestamp": int(time.time())
        }
        
        print(f"{RED} [ATTACK] {attack['msg']} ({attacker_ip}){RESET}")
        send_payload(data)

if __name__ == "__main__":
    print(f"{CYAN}Starting Traffic Simulator...{RESET}")
    print(f"{CYAN}Generating background noise + attacks...{RESET}")

    # Start healthy hosts
    t1 = Thread(target=simulate_healthy_host, args=("web-server-01", "192.168.1.10"))
    t2 = Thread(target=simulate_healthy_host, args=("db-server-01", "192.168.1.11"))
    
    t1.daemon = True
    t2.daemon = True
    
    t1.start()
    t2.start()

    # Start attacker
    try:
        simulate_attacker()
    except KeyboardInterrupt:
        print("\nStopping simulator.")
