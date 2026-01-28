@echo off
echo ========================================================
echo   SERVER GUARD - ONE CLICK SETUP & START
echo ========================================================
echo.

echo [1/4] Installing Backend Dependencies...
python -m pip install -r backend/requirements.txt
python -m pip install -r model_microservice/requirements.txt

echo [2/4] Installing Frontend Dependencies...
cd frontend
call npm install
cd ..

echo [3/4] Starting Backend Services...
start "ServerGuard Backend" cmd /k "python start_services.py"

echo [4/4] Starting React Frontend...
cd frontend
start "ServerGuard Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ========================================================
echo   SYSTEM LAUNCHED
echo ========================================================
echo Dashboard: http://localhost:5173/dashboard
echo Simulation: http://localhost:5173/simulation
echo Gateway API: http://localhost:3001
echo.
echo NOTE: Use 'python demo_simulation.py' in a separate window to manually trigger attacks if desired.
pause
