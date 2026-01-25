@echo off
echo ========================================================
echo   SERVER GUARD - ONE CLICK START
echo ========================================================
echo.

echo [1/3] Starting Backend Services...
start "ServerGuard Backend" cmd /k "python start_services.py"

echo [2/3] Starting React Frontend...
cd frontend
start "ServerGuard Frontend" cmd /k "npm run dev"
cd ..

echo [3/3] Starting Demo Controller...
timeout /t 5 >nul
start "Demo Simulation" cmd /k "python demo_simulation.py"

echo.
echo ========================================================
echo   ALL SYSTEMS ONLINE
echo ========================================================
echo.
echo Dashboard: http://localhost:5173/dashboard
echo Simulation: http://localhost:5173/simulation
echo Gateway API: http://localhost:3001
echo.
pause
