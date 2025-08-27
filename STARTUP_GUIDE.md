# AI Education Tool - Quick Start Guide

## Prerequisites
- Node.js (version 16 or higher)
- Python 3.7+
- npm or yarn

## Quick Start

### Option 1: Use Startup Scripts (Recommended)

1. **Start Backend Services:**
   ```bash
   # Double-click or run in terminal:
   start-all-services.bat
   ```
   This starts:
   - Semantic Search Server (Port 5001)
   - RAG Server (Port 5002)
   - Main Backend Server (Port 5000)

2. **Start Frontend:**
   ```bash
   # Double-click or run in terminal:
   start-frontend.bat
   ```
   This starts the frontend on http://localhost:3000

### Option 2: Manual Startup

1. **Backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Features

### Document Management
- Upload PDF and TXT documents
- View document list
- Individual document pages

### Search & Discovery
- **Semantic Search**: Search within documents using AI-powered semantic matching
- **Q&A System**: Ask questions about document content using RAG (Retrieval-Augmented Generation)

### How to Use

1. **Upload a Document:**
   - Go to home page (http://localhost:3000)
   - Click "Choose File" and select a PDF or TXT file
   - Click "Upload Document"

2. **Search Document:**
   - Click on any document from the list
   - Use the "Search Document" box to find relevant content
   - Results show similarity scores and highlighted text

3. **Ask Questions:**
   - On any document page, use the "Ask a Question" box
   - Type natural language questions about the document
   - Get AI-generated answers with source context

## API Endpoints

### Main Backend (Port 5000)
- `GET /api/documents` - List all documents
- `POST /api/documents/upload` - Upload new document
- `GET /api/documents/:id` - Get specific document
- `POST /api/search` - Search within document
- `POST /api/qa` - Ask questions about document

### Microservices
- **Semantic Search Server (Port 5001)**: Handles vector similarity search
- **RAG Server (Port 5002)**: Handles question answering with context

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors:**
   - Run `npm install` in both frontend and backend directories

2. **Port already in use:**
   - Check if services are already running
   - Kill existing processes or change ports in configuration

3. **Python servers not starting:**
   - Ensure Python is installed and in PATH
   - Install required Python packages: `pip install sentence-transformers numpy flask`

4. **Backend startup error:**
   - Make sure you're running `node src/server.js` not `server.js`
   - Check that all dependencies are installed

### Service Status Check

You can verify services are running by visiting:
- Backend: http://localhost:5000/api/health
- Semantic Search: http://localhost:5001 (should show a basic response)
- RAG Server: http://localhost:5002/health

## Architecture

```
Frontend (Next.js) ←→ Main Backend (Express.js)
                         ↓
                    Semantic Search Server (Python)
                         ↓  
                    RAG Server (Python)
```

The system uses a microservices architecture where:
- **Frontend**: React/Next.js application for user interface
- **Main Backend**: Express.js server handling file uploads, document management
- **Semantic Search**: Python service for vector-based document search
- **RAG Server**: Python service for question answering using retrieved context

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, MongoDB (optional), Multer
- **AI Services**: Python, sentence-transformers, NumPy
- **File Processing**: PDF parsing, text extraction