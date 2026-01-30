#!/usr/bin/env python3
"""
Server Guard - Unified Application
Runs all microservices in a single container using localhost for internal communication.
This solves deployment issues on platforms like Render where multiple services
can have connectivity problems.
"""

import os
import sys
import multiprocessing
import time
import signal
from typing import List

# Service configurations - ports for internal localhost communication
SERVICES = {
    "ingest": {"port": 8001, "name": "Ingest Service"},
    "detection": {"port": 8002, "name": "Detection Engine"},
    "alert": {"port": 8003, "name": "Alert Manager"},
    "response": {"port": 8004, "name": "Response Engine"},
    "model": {"port": 8006, "name": "Model Service"},
    "gateway": {"port": 3001, "name": "API Gateway"},  # Main entry point
}

# Set environment variables for localhost communication
def setup_environment():
    """Configure environment variables for internal localhost communication"""
    os.environ.setdefault("INGEST_SERVICE_URL", "http://127.0.0.1:8001")
    os.environ.setdefault("DETECTION_ENGINE_URL", "http://127.0.0.1:8002")
    os.environ.setdefault("ALERT_MANAGER_URL", "http://127.0.0.1:8003")
    os.environ.setdefault("RESPONSE_ENGINE_URL", "http://127.0.0.1:8004")
    os.environ.setdefault("MODEL_SERVICE_URL", "http://127.0.0.1:8006")
    os.environ.setdefault("API_GATEWAY_URL", "http://127.0.0.1:3001")
    os.environ.setdefault("DEMO_MODE", "true")  # Enable demo mode for deployment

def run_ingest_service():
    """Run the Ingest Service"""
    os.environ["PORT"] = str(SERVICES["ingest"]["port"])
    os.chdir(os.path.join(os.path.dirname(__file__), "backend", "ingest-service"))
    sys.path.insert(0, os.getcwd())
    
    import uvicorn
    from main import socket_app
    uvicorn.run(socket_app, host="0.0.0.0", port=SERVICES["ingest"]["port"], log_level="info")

def run_detection_engine():
    """Run the Detection Engine"""
    os.environ["PORT"] = str(SERVICES["detection"]["port"])
    os.chdir(os.path.join(os.path.dirname(__file__), "backend", "detection-engine"))
    sys.path.insert(0, os.getcwd())
    
    import uvicorn
    from main import app
    uvicorn.run(app, host="0.0.0.0", port=SERVICES["detection"]["port"], log_level="info")

def run_alert_manager():
    """Run the Alert Manager"""
    os.environ["PORT"] = str(SERVICES["alert"]["port"])
    os.chdir(os.path.join(os.path.dirname(__file__), "backend", "alert-manager"))
    sys.path.insert(0, os.getcwd())
    
    import uvicorn
    from main import app
    uvicorn.run(app, host="0.0.0.0", port=SERVICES["alert"]["port"], log_level="info")

def run_response_engine():
    """Run the Response Engine"""
    os.environ["PORT"] = str(SERVICES["response"]["port"])
    os.chdir(os.path.join(os.path.dirname(__file__), "backend", "response-engine"))
    sys.path.insert(0, os.getcwd())
    
    import uvicorn
    from main import app
    uvicorn.run(app, host="0.0.0.0", port=SERVICES["response"]["port"], log_level="info")

def run_model_service():
    """Run the Model Service (Flask)"""
    os.environ["PORT"] = str(SERVICES["model"]["port"])
    os.chdir(os.path.join(os.path.dirname(__file__), "model_microservice"))
    sys.path.insert(0, os.getcwd())
    
    from app import app
    app.run(host="0.0.0.0", port=SERVICES["model"]["port"], debug=False, use_reloader=False)

def run_api_gateway():
    """Run the API Gateway (main entry point)"""
    # The external PORT env var (from Render) maps to the gateway
    external_port = int(os.environ.get("PORT", SERVICES["gateway"]["port"]))
    os.chdir(os.path.join(os.path.dirname(__file__), "backend", "api-gateway"))
    sys.path.insert(0, os.getcwd())
    
    import uvicorn
    from main import socket_app
    uvicorn.run(socket_app, host="0.0.0.0", port=external_port, log_level="info")

def start_service(target, name):
    """Start a service in a separate process with error handling"""
    try:
        print(f"[Unified] Starting {name}...")
        target()
    except Exception as e:
        print(f"[Unified] Error in {name}: {e}")
        raise

def main():
    """Start all services in separate processes"""
    print("=" * 60)
    print("    Server Guard - Unified Deployment")
    print("    Starting all services in single container...")
    print("=" * 60)
    
    setup_environment()
    
    # Get the project root directory
    project_root = os.path.dirname(os.path.abspath(__file__))
    
    # Define service runners
    service_runners = [
        (run_ingest_service, SERVICES["ingest"]["name"]),
        (run_detection_engine, SERVICES["detection"]["name"]),
        (run_alert_manager, SERVICES["alert"]["name"]),
        (run_response_engine, SERVICES["response"]["name"]),
        (run_model_service, SERVICES["model"]["name"]),
    ]
    
    processes: List[multiprocessing.Process] = []
    
    # Start internal services first
    for runner, name in service_runners:
        p = multiprocessing.Process(target=start_service, args=(runner, name))
        p.daemon = True
        p.start()
        processes.append(p)
        print(f"[Unified] {name} started (PID: {p.pid})")
        time.sleep(1)  # Stagger startup
    
    # Wait a bit for internal services to be ready
    print("[Unified] Waiting for internal services to initialize...")
    time.sleep(3)
    
    # Start the API Gateway in the main process (handles external traffic)
    print(f"[Unified] Starting API Gateway (main entry point)...")
    
    def cleanup_processes():
        """Gracefully terminate all child processes"""
        print("[Unified] Cleaning up child processes...")
        for p in processes:
            if p.is_alive():
                p.terminate()
        # Wait for graceful shutdown
        for p in processes:
            p.join(timeout=10)
            if p.is_alive():
                print(f"[Unified] Force killing process {p.pid}")
                p.kill()
                p.join(timeout=2)
    
    def signal_handler(signum, frame):
        print("\n[Unified] Received shutdown signal...")
        cleanup_processes()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Run the gateway in the main process
    try:
        run_api_gateway()
    except KeyboardInterrupt:
        print("\n[Unified] Shutting down...")
    except Exception as e:
        print(f"[Unified] Gateway error: {e}")
    finally:
        cleanup_processes()

if __name__ == "__main__":
    # Use 'spawn' start method for cross-platform compatibility
    # Check if already set to avoid errors
    try:
        multiprocessing.set_start_method('spawn')
    except RuntimeError:
        pass  # Already set
    main()
