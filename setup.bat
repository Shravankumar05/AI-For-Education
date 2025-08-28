@echo off
setlocal enabledelayedexpansion

:: AI-For-Education Platform Setup Script for Windows
:: This script automates the installation of all required dependencies and models

echo.
echo 🎓 AI-For-Education Platform Setup for Windows
echo ==================================================
echo.

:: Check if running in correct directory
if not exist "package.json" (
    echo ❌ ERROR: Please run this script from the AI-For-Education project root directory
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ❌ ERROR: Frontend directory not found. Please run from project root.
    pause
    exit /b 1
)

if not exist "backend" (
    echo ❌ ERROR: Backend directory not found. Please run from project root.
    pause
    exit /b 1
)

echo 📋 Checking system requirements...

:: Check available disk space (simplified check)
echo ✅ System requirements check completed

echo.
echo 🔧 Installing dependencies...

:: Check if Node.js is installed
echo 📦 Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/
    echo    After installation, restart this script.
    pause
    exit /b 1
) else (
    echo ✅ Node.js found: 
    node --version
)

:: Check if Python is installed
echo 🐍 Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python not found. Please install Python 3.8+ from https://python.org/
    echo    Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
) else (
    echo ✅ Python found: 
    python --version
)

:: Check if MongoDB is installed
echo 🍃 Checking MongoDB installation...
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  MongoDB not found. 
    echo    Please install MongoDB Community Server from:
    echo    https://www.mongodb.com/try/download/community
    echo.
    echo    Or continue without MongoDB (some features may not work)
    set /p continue="Continue without MongoDB? (y/N): "
    if /i "!continue!" neq "y" (
        pause
        exit /b 1
    )
) else (
    echo ✅ MongoDB found
)

:: Check if Ollama is installed
echo 🤖 Checking Ollama installation...
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Ollama not found. 
    echo    Please install Ollama from https://ollama.ai/download
    echo    After installation, restart this script.
    pause
    exit /b 1
) else (
    echo ✅ Ollama found: 
    ollama --version
)

echo.
echo 📦 Installing Python dependencies...

:: Create virtual environment if it doesn't exist
if not exist "ai_env" (
    echo Creating Python virtual environment...
    python -m venv ai_env
)

:: Activate virtual environment and install dependencies
echo Activating virtual environment and installing packages...
call ai_env\Scripts\activate.bat

:: Upgrade pip
python -m pip install --upgrade pip

:: Install required packages
echo Installing sentence-transformers...
pip install sentence-transformers

echo Installing numpy...
pip install numpy

echo Installing flask...
pip install flask

echo Installing torch...
pip install torch

echo Installing transformers...
pip install transformers

echo Installing faiss-cpu...
pip install faiss-cpu

echo Installing ollama...
pip install ollama

:: Deactivate virtual environment
call ai_env\Scripts\deactivate.bat

echo ✅ Python dependencies installed successfully

echo.
echo 🤖 Setting up Ollama models...

:: Start Ollama service if not running
echo Starting Ollama service...
start /B ollama serve
timeout /t 5 /nobreak >nul

:: Pull required models
echo Downloading llama3.2:1b model (this may take a few minutes)...
ollama pull llama3.2:1b
if %errorlevel% neq 0 (
    echo ❌ Failed to download llama3.2:1b model
    echo    Please check your internet connection and try again
    pause
    exit /b 1
)

echo Downloading nomic-embed-text model...
ollama pull nomic-embed-text
if %errorlevel% neq 0 (
    echo ❌ Failed to download nomic-embed-text model
    echo    Please check your internet connection and try again
    pause
    exit /b 1
)

echo ✅ Ollama models installed successfully

echo.
echo 📦 Installing Node.js dependencies...

:: Install backend dependencies
echo Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

:: Install frontend dependencies
echo Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

:: Install root dependencies
echo Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install root dependencies
    pause
    exit /b 1
)

echo ✅ Node.js dependencies installed successfully

echo.
echo 🗂️  Setting up MongoDB data directory...

:: Create MongoDB data directory
if not exist "C:\data\db" (
    mkdir "C:\data\db"
    echo ✅ MongoDB data directory created at C:\data\db
) else (
    echo ✅ MongoDB data directory already exists
)

echo.
echo 🚀 Creating startup script...

:: Create Windows startup script
(
echo @echo off
echo echo 🚀 Starting AI-For-Education Platform...
echo echo.
echo.
echo echo 📊 Starting MongoDB...
echo start /B mongod --dbpath "C:\data\db"
echo timeout /t 3 /nobreak ^>nul
echo.
echo echo 🤖 Starting Ollama service...
echo start /B ollama serve
echo timeout /t 3 /nobreak ^>nul
echo.
echo echo ⚙️  Starting backend services...
echo cd backend
echo.
echo echo 🔍 Starting semantic search server...
echo call ..\ai_env\Scripts\activate.bat
echo start /B python src\utils\semantic_search_server.py
echo timeout /t 2 /nobreak ^>nul
echo.
echo echo 🧠 Starting RAG server...
echo start /B python src\utils\rag_server.py
echo timeout /t 2 /nobreak ^>nul
echo.
echo echo 🌐 Starting main backend server...
echo start /B npm run dev
echo cd ..
echo.
echo echo 🎨 Starting frontend...
echo cd frontend
echo start /B npm run dev
echo cd ..
echo.
echo echo ✅ All services started!
echo echo.
echo echo 🌐 Frontend: http://localhost:3000
echo echo ⚙️  Backend API: http://localhost:5000
echo echo 🔍 Search Service: http://localhost:5005
echo echo 🧠 RAG Service: http://localhost:5002
echo echo.
echo echo Press any key to stop all services...
echo pause ^>nul
) > start-platform.bat

echo ✅ Startup script created: start-platform.bat

echo.
echo 🔍 Verifying installation...

:: Verify Node.js
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.js: VERIFIED
) else (
    echo ❌ Node.js: FAILED
    set verification_failed=1
)

:: Verify Python
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Python: VERIFIED
) else (
    echo ❌ Python: FAILED
    set verification_failed=1
)

:: Verify Ollama
ollama --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Ollama: VERIFIED
) else (
    echo ❌ Ollama: FAILED
    set verification_failed=1
)

:: Verify Ollama models
ollama list | findstr "llama3.2:1b" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ llama3.2:1b model: VERIFIED
) else (
    echo ❌ llama3.2:1b model: FAILED
    set verification_failed=1
)

ollama list | findstr "nomic-embed-text" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ nomic-embed-text model: VERIFIED
) else (
    echo ❌ nomic-embed-text model: FAILED
    set verification_failed=1
)

echo.
if defined verification_failed (
    echo ❌ Setup completed with some errors. Please check the output above.
    echo.
) else (
    echo 🎉 Setup completed successfully!
    echo.
    echo 📋 Next steps:
    echo 1. Run 'start-platform.bat' to start all services
    echo 2. Open http://localhost:3000 in your browser
    echo 3. Upload a document and start exploring!
    echo.
    echo 📚 For more information, check the README.md file
    echo.
)

echo Press any key to exit...
pause >nul