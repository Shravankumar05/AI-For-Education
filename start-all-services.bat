@echo off

ECHO "Starting All Services..."

REM Start backend server
ECHO "Starting backend server..."
cd backend
call npm install
start "Backend" cmd /c "npm run dev"
cd ..

REM Start semantic search server
ECHO "Starting semantic search server..."
cd backend
pip install -r requirements.txt
start "Semantic Search" cmd /c "python src/utils/semantic_search_server_v2.py 5004"
cd ..

REM Start frontend server
ECHO "Starting frontend server..."
cd frontend
call npm install
start "Frontend" cmd /c "npm run dev"
cd ..

ECHO "All services started!"