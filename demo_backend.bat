@echo off
title Server Guard - Full Backend Demo Launcher
color 0A

echo.
echo  ╔═══════════════════════════════════════════════════════════════════╗
echo  ║                                                                   ║
echo  ║   ███████╗███████╗██████╗ ██╗   ██╗███████╗██████╗                ║
echo  ║   ██╔════╝██╔════╝██╔══██╗██║   ██║██╔════╝██╔══██╗               ║
echo  ║   ███████╗█████╗  ██████╔╝██║   ██║█████╗  ██████╔╝               ║
echo  ║   ╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██╔══╝  ██╔══██╗               ║
echo  ║   ███████║███████╗██║  ██║ ╚████╔╝ ███████╗██║  ██║               ║
echo  ║   ╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝               ║
echo  ║                                                                   ║
echo  ║           G U A R D   -   F U L L   B A C K E N D                ║
echo  ║                                                                   ║
echo  ╚═══════════════════════════════════════════════════════════════════╝
echo.

echo [*] Starting Server Guard Full Backend Stack...
echo.
echo     Services to launch:
echo     -------------------
echo     1. Ingest Service      (Port 8001) - Telemetry ingestion
echo     2. Detection Engine    (Port 8002) - Rule-based detection
echo     3. Alert Manager       (Port 8003) - Alert generation
echo     4. Response Engine     (Port 8004) - Automated response
echo     5. Model Microservice  (Port 8006) - AI/ML detection
echo     6. API Gateway         (Port 3001) - Frontend gateway
echo.
echo     Frontend:
echo     ---------
echo     7. React Dashboard     (Port 5173) - Web UI
echo.

:: Check Python is available
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python not found in PATH. Please install Python 3.8+
    pause
    exit /b 1
)

:: Check npm is available
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] npm not found. Frontend will not start automatically.
    set SKIP_FRONTEND=1
)

echo.
echo [1/7] Starting Ingest Service (Port 8001)...
start "ServerGuard - Ingest Service" cmd /k "cd /d %~dp0backend\ingest-service && python main.py"
timeout /t 2 /nobreak >nul

echo [2/7] Starting Detection Engine (Port 8002)...
start "ServerGuard - Detection Engine" cmd /k "cd /d %~dp0backend\detection-engine && python main.py"
timeout /t 2 /nobreak >nul

echo [3/7] Starting Alert Manager (Port 8003)...
start "ServerGuard - Alert Manager" cmd /k "cd /d %~dp0backend\alert-manager && python main.py"
timeout /t 2 /nobreak >nul

echo [4/7] Starting Response Engine (Port 8004)...
start "ServerGuard - Response Engine" cmd /k "cd /d %~dp0backend\response-engine && python main.py"
timeout /t 2 /nobreak >nul

echo [5/7] Starting Model Microservice (Port 8006)...
start "ServerGuard - Model Microservice (AI)" cmd /k "cd /d %~dp0model_microservice && python app.py"
timeout /t 3 /nobreak >nul

echo [6/7] Starting API Gateway (Port 3001)...
start "ServerGuard - API Gateway" cmd /k "cd /d %~dp0backend\api-gateway && python main.py"
timeout /t 2 /nobreak >nul

if defined SKIP_FRONTEND (
    echo [7/7] Skipping Frontend (npm not found)
) else (
    echo [7/7] Starting React Frontend (Port 5173)...
    start "ServerGuard - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
    timeout /t 3 /nobreak >nul
)

echo.
echo  [SUCCESS] All services launched!
echo.
echo  Service Endpoints:
echo  ------------------
echo  Ingest Service:     http://127.0.0.1:8001/health
echo  Detection Engine:   http://127.0.0.1:8002/health
echo  Alert Manager:      http://127.0.0.1:8003/health
echo  Response Engine:    http://127.0.0.1:8004/health
echo  Model Microservice: http://127.0.0.1:8006/health
echo  API Gateway:        http://127.0.0.1:3001/health
echo.
echo  Frontend Dashboard: http://localhost:5173
echo  Attack Simulation:  http://localhost:5173/simulation
echo.
echo ═══════════════════════════════════════════════════════════════════
echo.
echo  DEMO OPTIONS:
echo  1. Frontend Attack Console - Open http://localhost:5173/simulation
echo  2. CLI Demo Controller     - Run: python demo_simulation.py
echo.
echo  Full Pipeline Flow:
echo  Attack -^> Model Service (AI) -^> Alert Manager -^> Response Engine
echo          -^> API Gateway -^> Frontend Dashboard (Real-time)
echo.
echo  Press any key to open the dashboard in your browser...
pause >nul

start http://localhost:5173

echo.
echo  [INFO] Dashboard opened. Services running in background windows.
echo  [INFO] Close this window to keep services running.
echo  [INFO] Close individual service windows to stop them.
echo.
pause
