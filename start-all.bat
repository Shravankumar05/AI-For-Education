@echo off
echo Starting AI-For-Education Complete System...
echo.

echo [1/5] Starting MongoDB...
start "MongoDB" /min "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" --dbpath "C:\data\db"
echo MongoDB started in background
timeout /t 3 /nobreak >nul

echo [2/5] Starting Semantic Search Server (Port 5005)...
start "Semantic Search" cmd /k "cd /d "%~dp0backend\src\utils" && python simple_search_server.py 5005"
echo Semantic Search Server starting...
timeout /t 3 /nobreak >nul

echo [3/5] Starting RAG Server (Port 5002)...
start "RAG Server" cmd /k "cd /d "%~dp0backend\src\utils" && python rag_server.py"
echo RAG Server starting...
timeout /t 3 /nobreak >nul

echo [4/5] Starting Backend Server (Port 5000)...
start "Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"
echo Backend Server starting...
timeout /t 5 /nobreak >nul

echo [5/5] Starting Frontend (Port 3000)...
start "Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
echo Frontend starting...

echo.
echo ===================================================
echo All services are starting up...
echo ===================================================
echo.
echo Service URLs:
echo - Frontend:         http://localhost:3000
echo - Backend API:      http://localhost:5000
echo - Semantic Search:  http://localhost:5005
echo - RAG Server:       http://localhost:5002
echo - MongoDB:          Default port (27017)
echo.
echo IMPORTANT NOTES:
echo - Wait 30-60 seconds for all services to fully start
echo - The backend will show some 404 errors initially - this is normal
echo - Services will automatically fall back if others aren't available
echo - Close any service window to stop that service
echo.
echo Press any key to exit this window (services will continue running)...
pause >nul