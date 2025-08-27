@echo off
echo Starting AI Education Tool Frontend...
echo ====================================

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js and try again
    pause
    exit /b 1
)

REM Navigate to frontend directory
cd /d "%~dp0frontend"

echo.
echo Installing dependencies (if needed)...
npm install

echo.
echo Starting frontend development server...
echo Frontend will be available at: http://localhost:3000
echo.

npm run dev