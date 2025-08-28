#!/bin/bash

# AI-For-Education Platform Setup Script
# This script automates the installation of all required dependencies and models

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check system requirements
check_system_requirements() {
    print_status "Checking system requirements..."
    
    # Check RAM (Linux/macOS)
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        RAM_GB=$(free -g | awk '/^Mem:/{print $2}')
        if [ "$RAM_GB" -lt 8 ]; then
            print_warning "System has ${RAM_GB}GB RAM. 8GB+ recommended for optimal performance."
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        RAM_GB=$(sysctl -n hw.memsize | awk '{print int($1/1024/1024/1024)}')
        if [ "$RAM_GB" -lt 8 ]; then
            print_warning "System has ${RAM_GB}GB RAM. 8GB+ recommended for optimal performance."
        fi
    fi
    
    # Check disk space (5GB minimum)
    AVAILABLE_SPACE=$(df . | tail -1 | awk '{print $4}')
    AVAILABLE_GB=$((AVAILABLE_SPACE / 1024 / 1024))
    if [ "$AVAILABLE_GB" -lt 5 ]; then
        print_error "Insufficient disk space. Need at least 5GB, available: ${AVAILABLE_GB}GB"
        exit 1
    fi
    
    print_success "System requirements check completed"
}

# Function to install Node.js
install_nodejs() {
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
        if [ "$MAJOR_VERSION" -ge 18 ]; then
            print_success "Node.js $NODE_VERSION is already installed"
            return
        else
            print_warning "Node.js version $NODE_VERSION is too old. Updating..."
        fi
    fi
    
    print_status "Installing Node.js..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Ubuntu/Debian
        if command_exists apt-get; then
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        # CentOS/RHEL/Fedora
        elif command_exists yum; then
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo yum install -y nodejs npm
        else
            print_error "Unsupported Linux distribution. Please install Node.js 18+ manually."
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command_exists brew; then
            brew install node@18
        else
            print_error "Homebrew not found. Please install Node.js 18+ manually from https://nodejs.org/"
            exit 1
        fi
    else
        print_error "Unsupported OS. Please install Node.js 18+ manually."
        exit 1
    fi
    
    print_success "Node.js installed successfully"
}

# Function to install Python
install_python() {
    if command_exists python3; then
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
        MAJOR_VERSION=$(echo $PYTHON_VERSION | cut -d'.' -f1)
        MINOR_VERSION=$(echo $PYTHON_VERSION | cut -d'.' -f2)
        if [ "$MAJOR_VERSION" -eq 3 ] && [ "$MINOR_VERSION" -ge 8 ]; then
            print_success "Python $PYTHON_VERSION is already installed"
            return
        else
            print_warning "Python version $PYTHON_VERSION is too old. Updating..."
        fi
    fi
    
    print_status "Installing Python 3.8+..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command_exists apt-get; then
            sudo apt-get update
            sudo apt-get install -y python3 python3-pip python3-venv
        elif command_exists yum; then
            sudo yum install -y python3 python3-pip
        else
            print_error "Unsupported Linux distribution. Please install Python 3.8+ manually."
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        if command_exists brew; then
            brew install python@3.11
        else
            print_error "Homebrew not found. Please install Python 3.8+ manually."
            exit 1
        fi
    else
        print_error "Unsupported OS. Please install Python 3.8+ manually."
        exit 1
    fi
    
    print_success "Python installed successfully"
}

# Function to install MongoDB
install_mongodb() {
    if command_exists mongod; then
        print_success "MongoDB is already installed"
        return
    fi
    
    print_status "Installing MongoDB..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command_exists apt-get; then
            # Ubuntu/Debian
            wget -qO - https://www.mongodb.org/static/pgp/server-8.0.asc | sudo apt-key add -
            echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
            sudo apt-get update
            sudo apt-get install -y mongodb-org
        elif command_exists yum; then
            # CentOS/RHEL/Fedora
            sudo tee /etc/yum.repos.d/mongodb-org-8.0.repo <<EOF
[mongodb-org-8.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/8/mongodb-org/8.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-8.0.asc
EOF
            sudo yum install -y mongodb-org
        fi
        
        # Start MongoDB service
        sudo systemctl start mongod
        sudo systemctl enable mongod
        
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        if command_exists brew; then
            brew tap mongodb/brew
            brew install mongodb-community@8.0
            brew services start mongodb/brew/mongodb-community
        else
            print_error "Homebrew not found. Please install MongoDB manually."
            exit 1
        fi
    else
        print_warning "Automatic MongoDB installation not supported on this OS."
        print_warning "Please install MongoDB 8.0+ manually from https://docs.mongodb.com/manual/installation/"
        return
    fi
    
    print_success "MongoDB installed and started successfully"
}

# Function to install Ollama
install_ollama() {
    if command_exists ollama; then
        print_success "Ollama is already installed"
        return
    fi
    
    print_status "Installing Ollama..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
        curl -fsSL https://ollama.ai/install.sh | sh
    else
        print_error "Automatic Ollama installation not supported on this OS."
        print_error "Please download and install Ollama manually from https://ollama.ai/download"
        exit 1
    fi
    
    print_success "Ollama installed successfully"
}

# Function to setup Ollama models
setup_ollama_models() {
    print_status "Setting up Ollama models..."
    
    # Start Ollama service if not running
    if ! pgrep -f "ollama serve" > /dev/null; then
        print_status "Starting Ollama service..."
        ollama serve &
        sleep 5
    fi
    
    # Pull required models
    print_status "Pulling llama3.2:1b model (1.3GB)..."
    ollama pull llama3.2:1b
    
    print_status "Pulling nomic-embed-text model (274MB)..."
    ollama pull nomic-embed-text
    
    # Verify models
    print_status "Verifying installed models..."
    if ollama list | grep -q "llama3.2:1b" && ollama list | grep -q "nomic-embed-text"; then
        print_success "All Ollama models installed successfully"
    else
        print_error "Failed to install some Ollama models"
        exit 1
    fi
}

# Function to install Python dependencies
install_python_dependencies() {
    print_status "Installing Python dependencies..."
    
    # Create virtual environment
    if [ ! -d "ai_env" ]; then
        python3 -m venv ai_env
    fi
    
    # Activate virtual environment
    source ai_env/bin/activate
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install dependencies
    pip install sentence-transformers numpy flask torch transformers faiss-cpu ollama
    
    # Deactivate virtual environment
    deactivate
    
    print_success "Python dependencies installed successfully"
}

# Function to install Node.js dependencies
install_nodejs_dependencies() {
    print_status "Installing Node.js dependencies..."
    
    # Backend dependencies
    print_status "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    
    # Frontend dependencies
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    
    # Root dependencies
    print_status "Installing root dependencies..."
    npm install
    
    print_success "Node.js dependencies installed successfully"
}

# Function to setup MongoDB data directory
setup_mongodb() {
    print_status "Setting up MongoDB data directory..."
    
    # Create data directory
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows
        mkdir -p /c/data/db
    else
        # Unix-like systems
        sudo mkdir -p /data/db
        sudo chown $(whoami) /data/db
    fi
    
    print_success "MongoDB data directory created"
}

# Function to verify installation
verify_installation() {
    print_status "Verifying installation..."
    
    local errors=0
    
    # Check Node.js
    if command_exists node && node --version | grep -q "v1[8-9]\|v2[0-9]"; then
        print_success "Node.js: $(node --version)"
    else
        print_error "Node.js 18+ not found"
        errors=$((errors + 1))
    fi
    
    # Check Python
    if command_exists python3; then
        print_success "Python: $(python3 --version)"
    else
        print_error "Python 3.8+ not found"
        errors=$((errors + 1))
    fi
    
    # Check MongoDB
    if command_exists mongod; then
        print_success "MongoDB: Installed"
    else
        print_error "MongoDB not found"
        errors=$((errors + 1))
    fi
    
    # Check Ollama
    if command_exists ollama; then
        print_success "Ollama: $(ollama --version)"
    else
        print_error "Ollama not found"
        errors=$((errors + 1))
    fi
    
    # Check Ollama models
    if ollama list | grep -q "llama3.2:1b" && ollama list | grep -q "nomic-embed-text"; then
        print_success "Ollama models: llama3.2:1b, nomic-embed-text"
    else
        print_error "Required Ollama models not found"
        errors=$((errors + 1))
    fi
    
    if [ $errors -eq 0 ]; then
        print_success "All components verified successfully!"
        return 0
    else
        print_error "Verification failed with $errors errors"
        return 1
    fi
}

# Function to create startup script
create_startup_script() {
    print_status "Creating startup script..."
    
    cat > start-platform.sh << 'EOF'
#!/bin/bash

# AI-For-Education Platform Startup Script

echo "🚀 Starting AI-For-Education Platform..."

# Start MongoDB
echo "📊 Starting MongoDB..."
if ! pgrep mongod > /dev/null; then
    mongod --dbpath /data/db --fork --logpath /tmp/mongodb.log
fi

# Start Ollama service
echo "🤖 Starting Ollama service..."
if ! pgrep -f "ollama serve" > /dev/null; then
    ollama serve &
    sleep 3
fi

# Activate Python virtual environment
if [ -f "ai_env/bin/activate" ]; then
    source ai_env/bin/activate
fi

# Start backend services
echo "⚙️  Starting backend services..."
cd backend

# Start semantic search server
echo "🔍 Starting semantic search server..."
python src/utils/semantic_search_server.py &

# Start RAG server
echo "🧠 Starting RAG server..."
python src/utils/rag_server.py &

# Start main backend
echo "🌐 Starting main backend server..."
npm run dev &

cd ..

# Start frontend
echo "🎨 Starting frontend..."
cd frontend
npm run dev &
cd ..

echo "✅ All services started!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "⚙️  Backend API: http://localhost:5000"
echo "🔍 Search Service: http://localhost:5005"
echo "🧠 RAG Service: http://localhost:5002"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
wait
EOF

    chmod +x start-platform.sh
    print_success "Startup script created: start-platform.sh"
}

# Main installation function
main() {
    echo "🎓 AI-For-Education Platform Setup"
    echo "=================================="
    echo ""
    
    # Check if running in project directory
    if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
        print_error "Please run this script from the AI-For-Education project root directory"
        exit 1
    fi
    
    print_status "Starting automated setup..."
    
    # System requirements check
    check_system_requirements
    
    # Install core dependencies
    install_nodejs
    install_python
    install_mongodb
    install_ollama
    
    # Setup services and models
    setup_mongodb
    setup_ollama_models
    
    # Install project dependencies
    install_python_dependencies
    install_nodejs_dependencies
    
    # Create startup script
    create_startup_script
    
    # Verify installation
    if verify_installation; then
        echo ""
        echo "🎉 Setup completed successfully!"
        echo ""
        echo "📋 Next steps:"
        echo "1. Run './start-platform.sh' to start all services"
        echo "2. Open http://localhost:3000 in your browser"
        echo "3. Upload a document and start exploring!"
        echo ""
        echo "📚 For more information, check the README.md file"
    else
        print_error "Setup completed with errors. Please check the output above."
        exit 1
    fi
}

# Run main function
main "$@"