# 🎓 AI-For-Education Platform

> **An intelligent document processing and learning platform powered by advanced AI technologies**

[![Next.js](https://img.shields.io/badge/Next.js-15.5.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0+-brightgreen?style=flat-square&logo=mongodb)](https://mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript)](https://typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-yellow?style=flat-square&logo=python)](https://python.org/)

## 🚀 Project Overview

The AI-For-Education Platform is a sophisticated microservices-based application that transforms how students and educators interact with educational content. By leveraging cutting-edge AI technologies including **Retrieval-Augmented Generation (RAG)**, **semantic search**, and **intelligent document processing**, this platform provides personalized learning experiences through document analysis, interactive Q&A, and adaptive flashcard systems.

### 🎯 Key Value Propositions

- **📚 Intelligent Document Processing**: Upload and parse PDF/Word documents with advanced chunking algorithms
- **🔍 Semantic Search**: AI-powered search that understands context and meaning, not just keywords
- **💬 Interactive Q&A**: RAG-based question answering system with contextual responses
- **🃏 Smart Flashcards**: Automatically generated study cards with spaced repetition and progress tracking
- **📊 Analytics Dashboard**: Comprehensive learning analytics and progress visualization
- **🎨 Modern UI/UX**: Responsive design built with Next.js 15 and Tailwind CSS

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Next.js 15.5.0 Client]
        B[React 19.1.0 Components]
        C[Tailwind CSS 4.0]
    end
    
    subgraph "API Gateway"
        D[Express.js Backend]
        E[CORS & Middleware]
    end
    
    subgraph "Microservices"
        F[Semantic Search Service]
        G[RAG Processing Service]
        H[Document Parser Service]
    end
    
    subgraph "Data Layer"
        I[MongoDB 8.0+]
        J[Vector Database]
        K[File Storage]
    end
    
    A --> D
    D --> F
    D --> G
    D --> H
    F --> I
    G --> I
    H --> K
```

### 🧩 Microservices Breakdown

#### 1. **Frontend Application** (Port 3000)
- **Technology**: Next.js 15.5.0 with App Router, React 19.1.0, TypeScript
- **Features**: Server-side rendering, responsive design, real-time updates
- **UI Framework**: Tailwind CSS 4.0 for modern, accessible design

#### 2. **API Gateway & Main Backend** (Port 5000)
- **Technology**: Express.js with TypeScript, MongoDB integration
- **Responsibilities**: Request routing, authentication, file uploads, data persistence
- **Features**: RESTful API, error handling, CORS management

#### 3. **Semantic Search Service** (Port 5005)
- **Technology**: Python with sentence-transformers, FAISS vector database
- **Algorithm**: Multi-signal ranking (40% exact phrases, 30% individual terms, 20% proximity, 10% structure)
- **Features**: Vector embeddings, similarity scoring, context-aware search

#### 4. **RAG Processing Service** (Port 5002)
- **Technology**: Python with Ollama integration, semantic chunking
- **Features**: Question answering, context retrieval, response generation
- **Model**: Optimized for educational content with citation tracking

#### 5. **Database Layer**
- **Primary**: MongoDB 8.0+ for document metadata, user data, flashcards
- **Vector Store**: FAISS for semantic embeddings and similarity search
- **File Storage**: Local file system with organized document management

---

## 🌟 Core Features

### 📄 **Document Management**
- **Multi-format Support**: PDF, Word, TXT document processing
- **Intelligent Parsing**: Semantic-aware chunking that preserves document structure
- **Metadata Extraction**: Automatic title, author, and content categorization
- **Version Control**: Document versioning and update tracking

### 🔍 **Advanced Search System**
- **Semantic Understanding**: Context-aware search beyond keyword matching
- **Multi-modal Queries**: Support for natural language and structured queries
- **Result Ranking**: Sophisticated scoring algorithm with multiple relevance signals
- **Search Analytics**: Query performance and result effectiveness tracking

### 💡 **Interactive Q&A System**
- **RAG Architecture**: Retrieval-Augmented Generation for accurate responses
- **Context Preservation**: Maintains conversation context across questions
- **Source Attribution**: Citations and references for all generated answers
- **Learning Adaptation**: Improves responses based on user feedback

### 🎴 **Smart Flashcard System**
- **Auto-generation**: AI-powered flashcard creation from document content
- **Spaced Repetition**: Scientifically-backed review scheduling
- **Progress Tracking**: Detailed analytics on learning progress
- **Export Capabilities**: CSV export for external study tools
- **Review Modes**: Multiple study modes including timed sessions

### 📊 **Analytics & Insights**
- **Learning Metrics**: Time spent, questions asked, concepts mastered
- **Performance Tracking**: Progress visualization and goal setting
- **Content Analytics**: Most searched topics and knowledge gaps
- **Usage Statistics**: Platform engagement and feature utilization

---

## 🛠️ Technology Stack

### **Frontend Technologies**
- **Framework**: Next.js 15.5.0 (App Router, Server Components)
- **UI Library**: React 19.1.0 with TypeScript 5.0+
- **Styling**: Tailwind CSS 4.0 with custom design system
- **State Management**: React Context API and Server State
- **Build Tool**: Integrated Next.js build system

### **Backend Technologies**
- **Runtime**: Node.js 18+ with Express.js 5.1.0
- **Language**: TypeScript for type safety and developer experience
- **Database**: MongoDB 8.0+ with Mongoose ODM
- **File Processing**: Multer for uploads, pdf-parse for document processing
- **API Design**: RESTful architecture with comprehensive error handling

### **AI/ML Technologies**
- **Embeddings**: sentence-transformers (all-MiniLM-L6-v2)
- **LLM Integration**: Ollama with llama3.2:1b for resource efficiency
- **Vector Search**: FAISS for high-performance similarity search
- **NLP Processing**: Custom text processing and semantic analysis

### **Infrastructure & DevOps**
- **Containerization**: Docker support for consistent deployment
- **Process Management**: Custom batch scripts for service orchestration
- **Development**: Hot reload, TypeScript compilation, ESLint
- **Monitoring**: Comprehensive logging and error tracking

---

## 📋 Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js** v18.0+ ([Download here](https://nodejs.org/))
- **Python** 3.8+ ([Download here](https://python.org/))
- **MongoDB** 8.0+ ([Download here](https://mongodb.com/try/download/community))
- **Git** ([Download here](https://git-scm.com/))
- **npm** or **yarn** (comes with Node.js)

### **System Requirements**
- **RAM**: Minimum 8GB (16GB recommended for optimal performance)
- **Storage**: 5GB free space for dependencies and models
- **OS**: Windows 10+, macOS 10.15+, or Linux Ubuntu 20.04+

---

## 🚀 Quick Start Guide

### **1. Clone the Repository**
```bash
# Clone the project from GitHub
git clone https://github.com/your-username/AI-For-Education.git

# Navigate to project directory
cd AI-For-Education
```

### **2. Environment Setup**

#### **Install Node.js Dependencies**
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root directory
cd ..
```

#### **Install Python Dependencies**
```bash
# Install Python packages for AI services
pip install sentence-transformers numpy flask torch transformers

# For GPU acceleration (optional)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

#### **Setup MongoDB**

**Windows:**
```bash
# Create data directory
mkdir C:\data\db

# Start MongoDB (if in PATH)
mongod --dbpath "C:\data\db"

# Or use the provided batch script
start-mongodb.bat
```

**macOS/Linux:**
```bash
# Create data directory
sudo mkdir -p /data/db
sudo chown $(whoami) /data/db

# Start MongoDB
mongod --dbpath /data/db
```

### **3. Quick Launch (Recommended)**

Use the provided startup script for automated service orchestration:

```bash
# Windows
start-all.bat

# This script will start all services in sequence:
# 1. MongoDB (if not running)
# 2. Semantic Search Server (Port 5005)
# 3. RAG Server (Port 5002)
# 4. Backend API (Port 5000)
# 5. Frontend Application (Port 3000)
```

### **4. Manual Startup (Alternative)**

For development or debugging, start services individually:

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Semantic Search
cd backend/src/utils
python semantic_search.py

# Terminal 4: RAG Service
cd backend/src/utils
python rag_module.py
```

### **5. Verify Installation**

Check that all services are running:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/documents
- **Search Service**: http://localhost:5005
- **RAG Service**: http://localhost:5002/health

---

## 📖 Usage Guide

### **Getting Started**

1. **Access the Platform**: Navigate to http://localhost:3000
2. **Upload Documents**: Click "Upload Document" and select PDF/Word files
3. **Explore Features**: Use the tabbed interface to access different functionalities

### **Document Processing**

```bash
# Supported formats: PDF, DOC, DOCX, TXT
# Maximum file size: 50MB
# Processing time: 30-60 seconds depending on document size
```

1. Select document from file explorer
2. Wait for processing completion
3. Access processed document from the dashboard

### **Search Functionality**

**Basic Search:**
```
Query: "machine learning algorithms"
Results: Contextually relevant sections with similarity scores
```

**Advanced Queries:**
```
Query: "What are the key differences between supervised and unsupervised learning?"
Results: Comprehensive sections with highlighted key differences
```

### **Q&A System**

**Example Interactions:**
```
User: "Explain the concept of neural networks"
AI: "Based on the document, neural networks are..."
[Includes source citations and page references]

User: "How do backpropagation algorithms work?"
AI: "The document describes backpropagation as..."
[Provides step-by-step explanation with diagrams if available]
```

### **Flashcard Study**

1. **Auto-generation**: System creates flashcards from key concepts
2. **Study Mode**: Interactive flip cards with progress tracking
3. **Review Scheduling**: Spaced repetition based on performance
4. **Export Options**: Download as CSV for external tools

---

## 🔧 API Documentation

### **Core Endpoints**

#### **Document Management**
```http
GET /api/documents
# Returns: List of all uploaded documents

POST /api/documents/upload
# Body: FormData with file
# Returns: Document metadata and processing status

GET /api/documents/:id
# Returns: Specific document details and content

DELETE /api/documents/:id
# Returns: Deletion confirmation
```

#### **Search System**
```http
POST /api/search
# Body: { "query": "search term", "documentId": "doc_id" }
# Returns: Ranked search results with similarity scores

GET /api/search/history
# Returns: User's search history and analytics
```

#### **Q&A System**
```http
POST /api/qa
# Body: { "question": "user question", "documentId": "doc_id" }
# Returns: AI-generated answer with source citations

GET /api/qa/conversations/:documentId
# Returns: Conversation history for specific document
```

#### **Flashcard System**
```http
GET /api/flashcards/:documentId
# Returns: All flashcards for a document

POST /api/flashcards
# Body: { "question": "Q", "answer": "A", "documentId": "doc_id" }
# Returns: Created flashcard

PUT /api/flashcards/:id
# Body: Updated flashcard data
# Returns: Modified flashcard

DELETE /api/flashcards/:id
# Returns: Deletion confirmation

GET /api/flashcards/:documentId/export
# Returns: CSV file download
```

### **Microservice APIs**

#### **Semantic Search Service (Port 5005)**
```http
POST /search
# Body: { "query": "search term", "documents": [...] }
# Returns: Vector similarity results

GET /health
# Returns: Service status and model information
```

#### **RAG Service (Port 5002)**
```http
POST /answer
# Body: { "question": "user question", "context": [...] }
# Returns: Generated answer with confidence scores

GET /health
# Returns: Service status and model readiness
```

---

## 🔍 Development & Debugging

### **Development Mode**

```bash
# Enable hot reload for all services
npm run dev:all

# Watch mode for TypeScript compilation
npm run dev:watch

# Debug mode with verbose logging
NODE_ENV=development npm run dev
```

### **Common Troubleshooting**

#### **Port Conflicts**
```bash
# Check what's running on ports
netstat -ano | findstr :3000
netstat -ano | findstr :5000
netstat -ano | findstr :5002
netstat -ano | findstr :5005

# Kill processes if needed
taskkill /PID <process_id> /F
```

#### **MongoDB Connection Issues**
```bash
# Verify MongoDB is running
mongo --eval "db.adminCommand('ismaster')"

# Check MongoDB logs
tail -f /var/log/mongodb/mongod.log

# Restart MongoDB service
sudo systemctl restart mongod
```

#### **Python Dependencies**
```bash
# Create virtual environment
python -m venv ai_env
source ai_env/bin/activate  # On Windows: ai_env\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Verify installations
python -c "import sentence_transformers; print('✓ sentence-transformers')"
python -c "import torch; print('✓ PyTorch')"
```

#### **Memory Issues**
```bash
# Monitor system resources
top -p $(pgrep -d, node)

# Adjust Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run dev

# Use lighter AI models for limited hardware
# Model: llama3.2:1b instead of larger models
# Embedding: nomic-embed-text for efficiency
```

### **Performance Optimization**

```bash
# Production build
npm run build
npm run start

# Enable compression
export COMPRESS=true

# Optimize AI model loading
export MODEL_CACHE_DIR=/tmp/model_cache
```

---

## 🧪 Testing

### **Automated Testing**

```bash
# Run all tests
npm test

# Run specific test suites
npm test:backend
npm test:frontend
npm test:integration

# Coverage report
npm run test:coverage
```

### **Manual Testing Checklist**

- [ ] Document upload (PDF, Word, TXT)
- [ ] Search functionality with various queries
- [ ] Q&A system with follow-up questions
- [ ] Flashcard creation and study mode
- [ ] Export functionality
- [ ] Responsive design on mobile/tablet
- [ ] Error handling and edge cases

---

## 🚀 Deployment

### **Production Deployment**

```bash
# Build production assets
npm run build:all

# Start production servers
npm run start:production

# Use PM2 for process management
npm install -g pm2
pm2 start ecosystem.config.js
```

### **Docker Deployment**

```bash
# Build and run with Docker Compose
docker-compose up -d

# Scale services
docker-compose up -d --scale backend=3

# Monitor logs
docker-compose logs -f
```

### **Environment Variables**

```env
# Backend Configuration
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai_education
NODE_ENV=production

# AI Service Configuration
SEARCH_SERVICE_URL=http://localhost:5005
RAG_SERVICE_URL=http://localhost:5002
OLLAMA_HOST=http://localhost:11434

# Security
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=https://yourdomain.com
```

---

## 👥 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### **Development Workflow**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Support & Contact

- **Documentation**: [Project Wiki](https://github.com/your-username/AI-For-Education/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/AI-For-Education/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/AI-For-Education/discussions)

---

## 🎯 Roadmap

### **Current Version (v1.0)**
- ✅ Document upload and processing
- ✅ Semantic search functionality
- ✅ RAG-based Q&A system
- ✅ Flashcard generation and study mode
- ✅ MongoDB persistence
- ✅ Responsive web interface

### **Upcoming Features (v1.1)**
- 🔄 Real-time collaboration
- 🔄 Advanced analytics dashboard
- 🔄 Mobile application
- 🔄 Multi-language support
- 🔄 Integration with LMS platforms

### **Future Vision (v2.0)**
- 🎯 AI-powered content generation
- 🎯 Personalized learning paths
- 🎯 Voice interaction capabilities
- 🎯 Advanced gamification
- 🎯 Blockchain-based certificates

---

<div align="center">

**Built with ❤️ for the future of education**

[⭐ Star this project](https://github.com/your-username/AI-For-Education) | [🐛 Report a bug](https://github.com/your-username/AI-For-Education/issues) | [💡 Request a feature](https://github.com/your-username/AI-For-Education/issues)

</div>