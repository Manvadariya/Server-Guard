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
            # Construct command to open titled window
            # cmd /k keeps window open. "title ..." sets the window title.
            cmd_str = " ".join(service['command'])
            full_command = f'title ServerGuard - {service["name"]} && {cmd_str}'
            
            p = subprocess.Popen(
                ["cmd", "/k", full_command], 
                cwd=service_path,
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
            processes.append((service['name'], p))
            time.sleep(1) # Wait a bit for startup
            
            if p.poll() is not None:
                print(f"❌ {service['name']} failed to start immediately.")
            else:
                print(f"✅ {service['name']} started (PID: {p.pid}) in new window")

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
            for item in processes[:]:
                name, p = item
                if p.poll() is not None:
                    print(f"⚠️  {name} window closed!")
                    processes.remove(item)
    except KeyboardInterrupt:
        print("\n🛑 Stopping all services...")
        for name, p in processes:
            print(f"   Killing {name}...")
            # We need to kill the process tree because Popen is holding cmd.exe
            subprocess.run(f"taskkill /F /T /PID {p.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print("Done.")

def kill_process_on_port(port):
    """
    Finds and kills the process occupying the specified port on Windows.
    """
    try:
        # Find PID using netstat
        result = subprocess.run(f'netstat -ano | findstr :{port}', shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        output = result.stdout.decode().strip()
        
        if not output:
            return # Port is free

        lines = output.split('\n')
        for line in lines:
            parts = line.split()
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
