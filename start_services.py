import subprocess
import time
import sys
import os
import signal

# Define services with their start commands and ports
# Adjust the python command if you have a specific virtualenv, but here we assume 'python' is in path
SERVICES = [
    {
        "name": "Ingest Service",
        "folder": "backend/ingest-service",
        "command": ["python", "main.py"],
        "port": 8001
    },
    {
        "name": "Detection Engine",
        "folder": "backend/detection-engine",
        "command": ["python", "main.py"],
        "port": 8002
    },
    {
        # Does not exist as a separate folder? Let's check.
        # Based on file listing, Alert Manager seems to be missing main.py or folder?
        # Listing showed 'alert-manager' directory in 'backend' with 3 children.
        # I'll enable it if I find it, for now assume it follows similar pattern.
        "name": "Alert Manager",
        "folder": "backend/alert-manager",
        "command": ["python", "main.py"],
        "port": 8003
    },
    {
        "name": "Response Engine",
        "folder": "backend/response-engine",
        "command": ["python", "main.py"],
        "port": 8004
    },
    {
        "name": "Model Service",
        "folder": "model_microservice",
        "command": ["python", "app.py"],
        "port": 8006
    },
    {
        "name": "API Gateway",
        "folder": "backend/api-gateway",
        "command": ["python", "main.py"],  # Gateway runs on 3001
        "port": 3001
    },
    {
        "name": "Dashboard",
        "folder": "dashboard",
        "command": ["python", "app.py"],   # Runs on 8000
        "port": 8000
    }
]

processes = []

def start_services():
    print("🚀 Starting Server-Guard Services...")
    project_root = os.getcwd()

    for service in SERVICES:
        # Check if folder exists
        service_path = os.path.join(project_root, service["folder"])
        if not os.path.exists(service_path):
            print(f"⚠️  Skipping {service['name']} (Folder not found: {service['folder']})")
            continue

        # Clean up port if occupied
        kill_process_on_port(service['port'])

        print(f"👉 Starting {service['name']} on port {service['port']}...")
        
        try:
            # Start process in new window/background
            # Using Shell=True to run in shell, but better to keep track of PID
            # For Windows, creationflags=subprocess.CREATE_NEW_CONSOLE helps to see logs in new windows if desired
            # But for automation, we want them in background.
            
            p = subprocess.Popen(
                service['command'], 
                cwd=service_path,
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
            processes.append((service['name'], p))
            time.sleep(1) # Wait a bit for startup
            
            if p.poll() is not None:
                print(f"❌ {service['name']} failed to start immediately.")
                out, err = p.communicate()
                print("STDOUT:", out.decode())
                print("STDERR:", err.decode())
            else:
                print(f"✅ {service['name']} started (PID: {p.pid})")

        except Exception as e:
            print(f"❌ Failed to start {service['name']}: {e}")

    print("\n🌐 specific System is running.")
    print("Dashboard: http://localhost:8000")
    print("Gateway:   http://localhost:3001")
    print("Press Ctrl+C to stop all services.")

    try:
        while True:
            time.sleep(1)
            # Check if any process died
            for name, p in processes:
                if p.poll() is not None:
                    print(f"⚠️  {name} stopped unexpectedly!")
                    out, err = p.communicate()
                    if out: print(out.decode())
                    if err: print(err.decode())
                    processes.remove((name, p))
    except KeyboardInterrupt:
        print("\n🛑 Stopping all services...")
        for name, p in processes:
            print(f"   Killing {name}...")
            p.terminate() 
            # p.kill() if needed
        print("Done.")

def kill_process_on_port(port):
    """
    Finds and kills the process occupying the specified port on Windows.
    """
    try:
        # Find PID using netstat
        # netstat -ano | findstr :<port>
        result = subprocess.run(f'netstat -ano | findstr :{port}', shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        output = result.stdout.decode().strip()
        
        if not output:
            return # Port is free

        lines = output.split('\n')
        for line in lines:
            parts = line.split()
            # typical line: TCP    0.0.0.0:8001           0.0.0.0:0              LISTENING       25204
            # We want the last element which is the PID
            if len(parts) > 4 and str(port) in parts[1]:
                pid = parts[-1]
                try:
                    pid = int(pid)
                    print(f"🧹 Port {port} is in use by PID {pid}. Killing it...")
                    subprocess.run(f'taskkill /F /PID {pid}', shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                except ValueError:
                    pass
    except Exception as e:
        print(f"⚠️  Failed to clean up port {port}: {e}")

if __name__ == "__main__":
    start_services()
