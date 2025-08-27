@echo off
echo Starting AI Education Tool Services...
echo =====================================

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python and try again
    pause
    exit /b 1
)

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js and try again
    pause
    exit /b 1
)

REM Navigate to project directory
cd /d "%~dp0"

echo.
echo Starting services...
echo.

REM Start the semantic search server
echo [1/3] Starting Semantic Search Server (Port 5001)...
start "Semantic Search Server" cmd /k "cd /d "%~dp0backend" && python src/utils/semantic_search_server.py 5001"
timeout /t 3 /nobreak >nul

REM Start the RAG server  
echo [2/3] Starting RAG Server (Port 5002)...
start "RAG Server" cmd /k "cd /d "%~dp0backend" && python src/utils/rag_server.py 5002"
timeout /t 3 /nobreak >nul

REM Start the main backend server
echo [3/3] Starting Main Backend Server (Port 5000)...
start "Main Backend Server" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo =====================================
echo All services are starting up...
echo.
echo Services:
echo - Semantic Search Server: http://localhost:5001
echo - RAG Server: http://localhost:5002  
echo - Main Backend: http://localhost:5000
echo.
echo Frontend should be available at: http://localhost:3000
echo (Start frontend separately with: cd frontend && npm run dev)
echo.
echo Press any key to close this window (services will continue running)...
pause >nul