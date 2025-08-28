const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { MongoClient } = require('mongodb');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const { spawn } = require('child_process');
const mongoose = require('mongoose');
require('./models/flashcard');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Connection
// Use a local MongoDB URI by default
const MONGODB_URI = 'mongodb://localhost:27017/ai-education';
let db;

// Fallback in-memory storage if MongoDB connection fails
let inMemoryDocuments = [];
let inMemoryEmbeddings = [];
let useInMemoryStorage = false;

// Semantic search server configuration
const SEMANTIC_SEARCH_URL = 'http://localhost:5005';
let semanticSearchServer = null;

// Start the semantic search server
function startSemanticSearchServer() {
  const pythonPath = process.platform === 'win32' ? 'python' : 'python3';
  const serverPath = path.join(__dirname, 'utils', 'semantic_search_server.py');
  
  try {
    semanticSearchServer = spawn(pythonPath, [serverPath, '5001']);
    
    semanticSearchServer.stdout.on('data', (data) => {
      console.log(`Semantic search server: ${data}`);
    });
    
    semanticSearchServer.stderr.on('data', (data) => {
      console.error(`Semantic search server error: ${data}`);
    });
    
    semanticSearchServer.on('close', (code) => {
      console.log(`Semantic search server exited with code ${code}`);
      semanticSearchServer = null;
    });
    
    // Give the server some time to start
    setTimeout(() => {
      console.log('Semantic search server should be running now');
    }, 2000);
  } catch (error) {
    console.error('Failed to start semantic search server:', error);
  }
}

// Check if semantic search server is running
async function checkSemanticSearchServer() {
  try {
    await axios.post(`${SEMANTIC_SEARCH_URL}/chunk`, { text: 'test' });
    return true;
  } catch (error) {
    return false;
  }
}

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Mongoose connected to MongoDB');

    const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db();
    
    // Create collections if they don't exist
    if (!(await db.listCollections({ name: 'documents' }).hasNext())) {
      await db.createCollection('documents');
    }
    if (!(await db.listCollections({ name: 'embeddings' }).hasNext())) {
      await db.createCollection('embeddings');
    }
    if (!(await db.listCollections({ name: 'flashcards' }).hasNext())) {
      await db.createCollection('flashcards');
    }
    
    useInMemoryStorage = false;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.log('Falling back to in-memory storage');
    useInMemoryStorage = true;
  }
}

// Call the connect function
connectToMongoDB();

// Start the semantic search server
// startSemanticSearchServer();

// RAG server configuration
const RAG_SERVER_URL = 'http://localhost:5002';
let ragServer = null;

// Start the RAG server
function startRAGServer() {
  const pythonPath = process.platform === 'win32' ? 'python' : 'python3';
  const serverPath = path.join(__dirname, 'utils', 'rag_server.py');
  
  try {
    ragServer = spawn(pythonPath, [serverPath, '5002']);
    
    ragServer.stdout.on('data', (data) => {
      console.log(`RAG server: ${data}`);
    });
    
    ragServer.stderr.on('data', (data) => {
      console.error(`RAG server error: ${data}`);
    });
    
    ragServer.on('close', (code) => {
      console.log(`RAG server exited with code ${code}`);
      ragServer = null;
    });
    
    // Give the server some time to start
    setTimeout(() => {
      console.log('RAG server should be running now');
    }, 2000);
  } catch (error) {
    console.error('Failed to start RAG server:', error);
  }
}

// Check if RAG server is running
async function checkRAGServer() {
  try {
    await axios.get(`${RAG_SERVER_URL}/health`);
    return true;
  } catch (error) {
    return false;
  }
}

// Start the semantic search server
// startSemanticSearchServer();

// Check if semantic search server is running after a delay
// setTimeout(async () => {
//   const isRunning = await checkSemanticSearchServer();
//   if (isRunning) {
//     console.log('Semantic search server is running');
//   } else {
//     console.warn('Semantic search server is not running. Some features may not work.');
//   }
// }, 3000);

// Start the RAG server
// startRAGServer();

// Check if RAG server is running after a delay
// setTimeout(async () => {
//   const isRunning = await checkRAGServer();
//   if (isRunning) {
//     console.log('RAG server is running');
//   } else {
//     console.warn('RAG server is not running. Question answering features may not work.');
//   }
// }, 4000);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import flashcard routes and controller
const {
  getFlashcards,
  createFlashcard,
  updateFlashcard,
  deleteFlashcard,
  getFlashcardsForReview,
  exportFlashcardsCSV,
} = require('./controllers/flashcardController');

// Flashcard routes
app.get('/api/flashcards/:documentId', getFlashcards);
app.post('/api/flashcards', createFlashcard);
app.put('/api/flashcards/:id', updateFlashcard);
app.delete('/api/flashcards/:id', deleteFlashcard);
app.get('/api/flashcards/:documentId/review', getFlashcardsForReview);
app.get('/api/flashcards/:documentId/export', exportFlashcardsCSV);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are allowed'));
    }
  },
});

// Function to extract text from PDF
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return '';
  }
}

// Function to extract text from TXT
function extractTextFromTXT(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error('Error extracting text from TXT:', error);
    return '';
  }
}

// Function to generate embeddings using Ollama or fallback to mock embeddings
async function generateEmbeddings(text) {
  try {
    // Try to use the semantic search server for embeddings only if it exists
    const response = await axios.post(`${SEMANTIC_SEARCH_URL}/embed`, {
      text: text
    }, {
      timeout: 2000 // 2 second timeout
    });
    
    if (response.data && response.data.embedding) {
      console.log('Using real embeddings from semantic search server');
      return response.data.embedding;
    } else {
      throw new Error('Invalid embedding response');
    }
  } catch (error) {
    // Only log warning if the error isn't a simple connection refused
    if (!error.message.includes('ECONNREFUSED') && !error.message.includes('404')) {
      console.warn('Semantic search server not available, using mock embeddings');
    }
    return generateMockEmbeddings(text);
  }
}

// Function to generate mock embeddings as fallback
function generateMockEmbeddings(text) {
  // Create a deterministic but improved mock embedding
  const mockEmbedding = [];
  const seed = text.length;
  
  // Generate a 384-dimensional embedding (common size)
  for (let i = 0; i < 384; i++) {
    // Improved hash function to generate more distinctive values
    let val = Math.sin(i * seed * 0.1) * 0.5;
    
    // Add some features based on text characteristics
    if (text.includes('?')) val += 0.05;
    if (text.includes('!')) val -= 0.05;
    if (text.length > 100) val *= 1.1;
    if (/\d+/.test(text)) val += 0.02;
    
    // Normalize to typical embedding range
    val = Math.max(Math.min(val, 1), -1);
    
    mockEmbedding.push(val);
  }
  
  return mockEmbedding;
}

// Helper function to chunk document text with semantic awareness
async function chunkDocumentText(text) {
  try {
    // Try to use semantic chunking if server is available
    const response = await axios.post(`${SEMANTIC_SEARCH_URL}/chunk`, {
      text,
      chunk_size: 500,  // Optimal size for educational content
      overlap: 100      // Sufficient overlap for context continuity
    }, {
      timeout: 2000 // 2 second timeout
    });
    
    if (response.data && response.data.chunks) {
      console.log(`Semantic chunking successful: ${response.data.chunks.length} chunks created`);
      return response.data.chunks;
    } else {
      throw new Error('Invalid response from semantic chunking service');
    }
  } catch (error) {
    // Only log detailed error if it's not a simple connection issue
    if (!error.message.includes('ECONNREFUSED') && !error.message.includes('404')) {
      console.warn('Semantic search server not available, using fallback chunking');
    }
    // Fallback to improved chunking if server fails
    return improvedChunkText(text);
  }
}

// Improved text chunking fallback with semantic awareness
function improvedChunkText(text, chunkSize = 500, overlap = 100) {
  // Split by paragraphs first to preserve structure
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const chunks = [];
  
  let currentChunk = '';
  let currentWordCount = 0;
  let currentHeader = '';
  let currentSection = '';
  let chunkId = 0;
  
  // Helper function to detect headers
  function detectHeader(text) {
    // Match markdown headers or numbered headers
    const headerMatch = text.match(/^(#{1,6}\s+)(.+)$/) || 
                       text.match(/^([0-9]+\.[0-9]*\s+)(.+)$/) ||
                       text.match(/^(Chapter|Section|Unit)\s+[0-9]+[:\.]?\s+(.+)$/i);
    
    if (headerMatch) {
      const headerText = headerMatch[2].trim();
      // Check if it's a top-level header
      const isTopLevel = headerMatch[1].startsWith('#') && headerMatch[1].trim().length <= 3 || 
                       headerMatch[1].match(/^[0-9]+\.\s+$/) ||
                       headerMatch[0].match(/^(Chapter|Section)\s+[0-9]+/i);
      
      return { 
        text: headerText, 
        isTopLevel 
      };
    }
    return null;
  }
  
  for (const paragraph of paragraphs) {
    const paragraphWords = paragraph.split(' ').length;
    const headerInfo = detectHeader(paragraph);
    
    // Update header information if this paragraph is a header
    if (headerInfo) {
      currentHeader = headerInfo.text;
      if (headerInfo.isTopLevel) {
        currentSection = headerInfo.text;
      }
    }
    
    // If adding this paragraph would exceed chunk size, finalize current chunk
    if (currentWordCount + paragraphWords > chunkSize && currentChunk) {
      chunks.push({
        text: currentChunk.trim(),
        start_idx: chunks.length * (chunkSize - overlap),
        end_idx: chunks.length * (chunkSize - overlap) + currentWordCount - 1,
        word_count: currentWordCount,
        header: currentHeader,
        section: currentSection,
        chunk_id: `chunk_${chunkId}`
      });
      chunkId++;
      
      // Start new chunk with overlap (keep last part of previous chunk)
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-overlap).join(' ');
      currentChunk = overlapWords + ' ' + paragraph;
      currentWordCount = overlap + paragraphWords;
    } else {
      // Add paragraph to current chunk
      if (currentChunk) {
        currentChunk += '\n\n' + paragraph;
      } else {
        currentChunk = paragraph;
      }
      currentWordCount += paragraphWords;
    }
  }
  
  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push({
      text: currentChunk.trim(),
      start_idx: chunks.length * (chunkSize - overlap),
      end_idx: chunks.length * (chunkSize - overlap) + currentWordCount - 1,
      word_count: currentWordCount,
      header: currentHeader,
      section: currentSection,
      chunk_id: `chunk_${chunkId}`
    });
  }
  
  return chunks;
}

// Routes
app.post('/api/documents/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    
    // Extract text based on file type
    let text = '';
    if (fileExt === '.pdf') {
      text = await extractTextFromPDF(filePath);
      console.log(`Extracted ${text.length} characters from PDF`);
    } else if (fileExt === '.txt') {
      text = extractTextFromTXT(filePath);
      console.log(`Extracted ${text.length} characters from TXT`);
    }
    
    if (!text || text.length < 50) {
      return res.status(400).json({ 
        success: false, 
        message: 'Could not extract sufficient text from the document. Please check the file and try again.' 
      });
    }
    
    // Generate document-level embeddings
    console.log('Generating document embeddings...');
    const embeddings = await generateEmbeddings(text);
    
    // Chunk the text with semantic awareness
    console.log('Chunking document text...');
    const chunks = await chunkDocumentText(text);
    console.log(`Created ${chunks.length} chunks`);
    
    // Generate embeddings for each chunk in parallel
    console.log('Generating chunk embeddings...');
    const chunkEmbeddingsPromises = chunks.map(async (chunk) => {
      return await generateEmbeddings(chunk.text);
    });
    
    // Wait for all chunk embeddings to complete
    const chunkEmbeddings = await Promise.all(chunkEmbeddingsPromises);
    
    // Create document record with enhanced metadata
    const newDoc = {
      name: req.file.originalname,
      filePath: filePath,
      fileType: fileExt.substring(1), // Remove the dot
      createdAt: new Date(),
      textContent: text.substring(0, 1000), // Store first 1000 chars of text for preview
      wordCount: text.split(/\s+/).length,
      chunkCount: chunks.length,
      processingMethod: 'semantic_chunking'
    };
    
    let docId;
    
    if (useInMemoryStorage) {
      // Use in-memory storage
      newDoc._id = Date.now().toString();
      newDoc.chunks = chunks;
      inMemoryDocuments.push(newDoc);
      
      // Store embeddings in memory with enhanced metadata
      const embeddingDoc = {
        documentId: newDoc._id,
        vector: embeddings,
        chunkEmbeddings: chunkEmbeddings,
        createdAt: new Date(),
        model: 'improved_embeddings',
        dimensions: embeddings.length
      };
      inMemoryEmbeddings.push(embeddingDoc);
      
      docId = newDoc._id;
    } else {
      // Insert document into MongoDB
      newDoc.chunks = chunks;
      const result = await db.collection('documents').insertOne(newDoc);
      
      // Store embeddings with enhanced metadata
      await db.collection('embeddings').insertOne({
        documentId: result.insertedId,
        vector: embeddings,
        chunkEmbeddings: chunkEmbeddings,
        createdAt: new Date(),
        model: 'improved_embeddings',
        dimensions: embeddings.length
      });
      
      docId = result.insertedId.toString();
    }
    
    // Index the document in the semantic search server
    try {
      console.log('Indexing document in semantic search server...');
      const indexResponse = await axios.post(`${SEMANTIC_SEARCH_URL}/index`, {
        documentId: docId,
        chunks: chunks
      }, {
        timeout: 10000 // 10 second timeout for indexing
      });
      
      if (indexResponse.data && indexResponse.data.status === 'success') {
        console.log(`Successfully indexed document ${docId} in semantic search server`);
      } else {
        console.warn(`Failed to index document ${docId}:`, indexResponse.data?.message || 'Unknown error');
      }
    } catch (indexError) {
      console.error('Error indexing document in semantic search server:', indexError.message);
      // Don't fail the upload if indexing fails - the document is still saved
    }

    return res.status(201).json({
      success: true,
      document: {
        id: docId,
        name: newDoc.name,
        createdAt: newDoc.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

app.get('/api/documents', async (_req, res) => {
  try {
    let formattedDocs = [];
    
    if (useInMemoryStorage) {
      // Use in-memory documents
      formattedDocs = inMemoryDocuments.map(doc => ({
        _id: doc._id,
        name: doc.name,
        createdAt: doc.createdAt.toISOString()
      }));
    } else {
      // Use MongoDB
      const documents = await db.collection('documents')
        .find({})
        .project({ name: 1, createdAt: 1 })
        .sort({ createdAt: -1 })
        .toArray();
      
      // Format documents for frontend
      formattedDocs = documents.map(doc => ({
        _id: doc._id.toString(),
        name: doc.name,
        createdAt: doc.createdAt.toISOString()
      }));
    }
    
    return res.status(200).json({
      success: true,
      documents: formattedDocs,
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// Semantic search endpoint with enhanced ranking
app.post('/api/search', async (req, res) => {
  try {
    const { documentId, query, topK = 5 } = req.body;  // Increased default topK
    
    if (!documentId || !query) {
      return res.status(400).json({ success: false, message: 'Document ID and query are required' });
    }
    
    console.log(`Processing search query: "${query}" for document: ${documentId}`);
    
    // Generate embedding for the query
    const queryEmbedding = await generateEmbeddings(query);
    
    // Get document and its embeddings
    let document, embeddings;
    
    if (useInMemoryStorage) {
      document = inMemoryDocuments.find(doc => doc._id === documentId);
      embeddings = inMemoryEmbeddings.find(emb => emb.documentId === documentId);
    } else {
      const { ObjectId } = require('mongodb');
      let mongoId;
      
      try {
        mongoId = new ObjectId(documentId);
      } catch (error) {
        return res.status(400).json({ success: false, message: 'Invalid document ID' });
      }
      
      document = await db.collection('documents').findOne({ _id: mongoId });
      embeddings = await db.collection('embeddings').findOne({ documentId: mongoId });
    }
    
    if (!document || !embeddings) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    
    // Extract query terms for highlighting (filter short words and common words)
    const queryTerms = query.split(' ').filter(term => 
      term.length > 2 && !['and', 'the', 'for', 'with', 'that', 'this', 'from', 'what', 'when', 'where', 'which', 'who', 'why', 'how'].includes(term.toLowerCase())
    );
    
    try {
      console.log('Sending search request to semantic search server...');
      // Call the new simplified semantic search server
      const response = await axios.post(`${SEMANTIC_SEARCH_URL}/search`, {
        documentId: documentId,
        query: query,
        top_k: topK
      }, {
        timeout: 5000 // 5 second timeout
      });
      
      if (response.data && response.data.results) {
        console.log(`Semantic search returned ${response.data.results.length} results`);
        
        // Enhance results with additional metadata
        const enhancedResults = response.data.results.map((result, index) => ({
          ...result,
          rank: index + 1,
          relevance_score: Math.round((result.similarity || 0) * 100),
          word_count: result.word_count || result.text.split(' ').length,
          has_header: Boolean(result.header),
          preview: result.text.substring(0, 200) + (result.text.length > 200 ? '...' : '')
        }));
        
        return res.status(200).json({
          success: true,
          results: enhancedResults,
          documentName: document.name,
          total_chunks: document.chunks?.length || 0,
          query: query,
          search_method: 'semantic'
        });
      } else {
        throw new Error('Invalid response from semantic search server');
      }
    } catch (error) {
      console.error('Error calling semantic search server:', error.message);
      console.log('Using fallback search method');
      
      // Enhanced fallback search
      const results = enhancedFallbackSearch(query, queryEmbedding, document.chunks, embeddings.chunkEmbeddings, queryTerms, topK);
      
      return res.status(200).json({
        success: true,
        results,
        documentName: document.name,
        total_chunks: document.chunks?.length || 0,
        query: query,
        fallback: true,
        search_method: 'fallback'
      });
    }
  } catch (error) {
    console.error('Error performing semantic search:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// Superior search algorithm with advanced multi-signal ranking
function enhancedFallbackSearch(query, queryEmbedding, documentChunks, chunkEmbeddings, queryTerms, topK = 5) {
  console.log(`Enhanced search for: "${query}" with terms: [${queryTerms.join(', ')}]`);
  
  // Calculate cosine similarity
  function cosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;
    
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }
    
    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);
    
    if (mag1 === 0 || mag2 === 0) return 0;
    
    return dotProduct / (mag1 * mag2);
  }
  
  // Advanced text scoring algorithm
  function calculateAdvancedTextScore(text, query, queryTerms) {
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    let score = 0;
    
    // 1. Exact query match (highest priority) - 40% weight
    if (textLower.includes(queryLower)) {
      const queryLength = queryLower.length;
      const startIndex = textLower.indexOf(queryLower);
      
      // Bonus for exact match
      score += 10.0;
      
      // Position bonus - earlier matches get higher scores
      const positionBonus = Math.max(0, (1000 - startIndex) / 1000) * 2;
      score += positionBonus;
      
      // Whole word boundary bonus
      const beforeChar = startIndex > 0 ? text[startIndex - 1] : ' ';
      const afterChar = startIndex + queryLength < text.length ? text[startIndex + queryLength] : ' ';
      if (/\s/.test(beforeChar) && /\s/.test(afterChar)) {
        score += 3.0; // Whole phrase bonus
      }
    }
    
    // 2. All terms present bonus - 30% weight
    const presentTerms = queryTerms.filter(term => {
      const termRegex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return termRegex.test(text);
    });
    
    const termCoverage = presentTerms.length / Math.max(queryTerms.length, 1);
    score += termCoverage * 8.0; // High bonus for having all terms
    
    // 3. Individual term matching with proximity - 20% weight
    queryTerms.forEach((term, termIndex) => {
      if (term.length < 2) return;
      
      const termLower = term.toLowerCase();
      const termRegex = new RegExp(`\\b${termLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = textLower.match(termRegex) || [];
      
      if (matches.length > 0) {
        // Base score for term presence
        let termScore = matches.length * Math.min(term.length / 3, 2);
        
        // Length bonus for longer terms
        if (term.length >= 4) termScore *= 1.5;
        if (term.length >= 6) termScore *= 1.3;
        
        // Frequency bonus (diminishing returns)
        termScore += Math.log(matches.length + 1) * 0.5;
        
        score += termScore;
      }
    });
    
    // 4. Term proximity bonus - 10% weight
    if (queryTerms.length >= 2) {
      for (let i = 0; i < queryTerms.length - 1; i++) {
        const term1 = queryTerms[i];
        const term2 = queryTerms[i + 1];
        
        const term1Regex = new RegExp(`\\b${term1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        const term2Regex = new RegExp(`\\b${term2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        
        const match1 = term1Regex.exec(textLower);
        const match2 = term2Regex.exec(textLower);
        
        if (match1 && match2) {
          const distance = Math.abs(match1.index - match2.index);
          if (distance < 100) { // Words within 100 characters
            const proximityScore = Math.max(0, (100 - distance) / 100) * 2;
            score += proximityScore;
          }
        }
      }
    }
    
    return score;
  }
  
  // Calculate enhanced similarity scores for each chunk
  const scoredChunks = documentChunks.map((chunk, index) => {
    // 1. Embedding similarity (30% weight)
    const embeddingSimilarity = chunkEmbeddings[index] ? 
      cosineSimilarity(queryEmbedding, chunkEmbeddings[index]) : 0;
    
    // 2. Advanced text scoring (60% weight)
    const textScore = calculateAdvancedTextScore(chunk.text, query, queryTerms);
    
    // 3. Structural importance (10% weight)
    let structuralScore = 0;
    
    // Header bonus
    if (chunk.header) {
      structuralScore += 0.5;
      
      // Check if query terms appear in header (very important)
      const headerScore = calculateAdvancedTextScore(chunk.header, query, queryTerms);
      if (headerScore > 0) {
        structuralScore += 2.0; // Strong header match bonus
      }
    }
    
    // Section importance
    if (chunk.section) {
      structuralScore += 0.3;
    }
    
    // Length normalization
    const wordCount = chunk.word_count || chunk.text.split(' ').length;
    let lengthFactor = 1;
    
    // Prefer medium-length chunks (100-500 words)
    if (wordCount >= 100 && wordCount <= 500) {
      lengthFactor = 1.2;
    } else if (wordCount >= 50 && wordCount < 100) {
      lengthFactor = 1.1;
    } else if (wordCount > 500) {
      lengthFactor = 0.9; // Slight penalty for very long chunks
    } else if (wordCount < 50) {
      lengthFactor = 0.8; // Penalty for very short chunks
    }
    
    // Combine scores with weights
    const finalScore = (
      (embeddingSimilarity * 0.3) +
      (Math.min(textScore / 10, 1) * 0.6) + // Normalize text score
      (structuralScore * 0.1)
    ) * lengthFactor;
    
    return {
      chunk,
      index,
      similarity: finalScore,
      embedding_similarity: embeddingSimilarity,
      text_score: textScore,
      structural_score: structuralScore,
      word_count: wordCount
    };
  });
  
  // Sort by final score
  scoredChunks.sort((a, b) => b.similarity - a.similarity);
  
  // Apply diversity and relevance filtering
  const diverseResults = [];
  const usedHeaders = new Map(); // Track header usage count
  const minRelevanceThreshold = 0.1; // Minimum relevance score
  
  for (const item of scoredChunks) {
    if (diverseResults.length >= topK) break;
    
    const chunk = item.chunk;
    const header = chunk.header;
    
    // Skip if score is too low
    if (item.similarity < minRelevanceThreshold) continue;
    
    // Diversity control - limit chunks from same header
    if (header) {
      const headerCount = usedHeaders.get(header) || 0;
      if (headerCount >= 2) continue; // Max 2 chunks per header
      usedHeaders.set(header, headerCount + 1);
    }
    
    // Enhanced highlighting
    let highlightedText = chunk.text;
    
    // Escape HTML
    highlightedText = highlightedText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Highlight exact query match first (highest priority)
    if (query && query.trim().length > 0) {
      const exactQuery = query.trim();
      const exactRegex = new RegExp(`(${exactQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      highlightedText = highlightedText.replace(exactRegex, '<mark class="exact-match" style="background: #ff6b35; color: white; font-weight: bold;">$1</mark>');
    }
    
    // Highlight individual terms
    queryTerms.forEach(term => {
      if (term.length < 3) return;
      
      const termRegex = new RegExp(`\\b(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
      // Use different highlight style for individual terms
      highlightedText = highlightedText.replace(termRegex, '<mark style="background: #ffd23f;">$1</mark>');
    });
    
    const result = {
      ...chunk,
      similarity: item.similarity,
      embedding_similarity: item.embedding_similarity,
      text_similarity: item.text_score,
      structural_similarity: item.structural_score,
      highlighted_text: highlightedText,
      rank: diverseResults.length + 1,
      relevance_score: Math.round(item.similarity * 100),
      word_count: item.word_count,
      has_header: Boolean(chunk.header),
      preview: chunk.text.substring(0, 200) + (chunk.text.length > 200 ? '...' : ''),
      search_method: 'enhanced_algorithm'
    };
    
    diverseResults.push(result);
  }
  
  console.log(`Enhanced search returned ${diverseResults.length} results with scores:`, 
    diverseResults.map(r => ({ similarity: r.similarity.toFixed(3), text_preview: r.text.substring(0, 50) + '...' })));
  
  return diverseResults;
}

app.get('/api/documents/:id', async (req, res) => {
  try {
    const docId = req.params.id;
    let document;
    let embedding;
    
    if (useInMemoryStorage) {
      // Find document in memory
      document = inMemoryDocuments.find(doc => doc._id === docId);
      
      if (!document) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }
      
      // Find embedding in memory
      embedding = inMemoryEmbeddings.find(emb => emb.documentId === docId);
    } else {
      // Use MongoDB
      const { ObjectId } = require('mongodb');
      let mongoId;
      
      try {
        mongoId = new ObjectId(docId);
      } catch (error) {
        return res.status(400).json({ success: false, message: 'Invalid document ID' });
      }
      
      document = await db.collection('documents').findOne({ _id: mongoId });
      
      if (!document) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }
      
      // Get embeddings for this document
      embedding = await db.collection('embeddings').findOne({ documentId: mongoId });
    }
    
    // Format response
    const formattedDoc = {
      _id: useInMemoryStorage ? document._id : document._id.toString(),
      name: document.name,
      createdAt: document.createdAt.toISOString(),
      fileType: document.fileType,
      textPreview: document.textContent,
      hasEmbedding: !!embedding
    };

    return res.status(200).json({
      success: true,
      document: formattedDoc,
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// Enhanced question answering endpoint
app.post('/api/qa', async (req, res) => {
  try {
    const { documentId, question } = req.body;

    if (!documentId || !question) {
      return res.status(400).json({ success: false, message: 'Document ID and question are required' });
    }

    // Get document and its chunks/embeddings
    let document;
    let embeddings;

    if (useInMemoryStorage) {
      document = inMemoryDocuments.find(doc => doc._id === documentId);
      embeddings = inMemoryEmbeddings.find(emb => emb.documentId === documentId);
    } else {
      const { ObjectId } = require('mongodb');
      let mongoId;
      try {
        mongoId = new ObjectId(documentId);
      } catch (error) {
        return res.status(400).json({ success: false, message: 'Invalid document ID' });
      }
      document = await db.collection('documents').findOne({ _id: mongoId });
      embeddings = await db.collection('embeddings').findOne({ documentId: mongoId });
    }
    
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    if (!embeddings || !embeddings.chunkEmbeddings) {
        return res.status(404).json({ success: false, message: 'Embeddings for this document are not available.' });
    }

    // Step 1: Extract keywords from the user's query
    let queryTerms = [];
    try {
      const keywordsResponse = await axios.post(`${SEMANTIC_SEARCH_URL}/keywords`, { text: question }, {
        timeout: 2000 // 2 second timeout
      });
      if (keywordsResponse.data && keywordsResponse.data.keywords) {
        queryTerms = keywordsResponse.data.keywords;
        console.log(`Extracted keywords: ${queryTerms.join(', ')}`);
      }
    } catch (error) {
      // Silently fall back to simple keyword extraction if service isn't available
      if (!error.message.includes('ECONNREFUSED') && !error.message.includes('404')) {
        console.warn('Keyword extraction service not available, using simple extraction');
      }
      // Simple keyword extraction fallback
      queryTerms = question.split(' ').filter(term => 
        term.length > 2 && 
        !['and', 'the', 'for', 'with', 'that', 'this', 'from', 'what', 'when', 'where', 'which', 'who', 'why', 'how', 'are', 'can', 'will', 'should', 'would', 'could'].includes(term.toLowerCase())
      );
    }

    // Step 2: Perform semantic search to get relevant chunks
    let relevantChunks = [];
    try {
        const queryEmbedding = await generateEmbeddings(question);
        const searchResponse = await axios.post(`${SEMANTIC_SEARCH_URL}/search`, {
            query: question,
            document_chunks: document.chunks,
            query_embedding: queryEmbedding,
            chunk_embeddings: embeddings.chunkEmbeddings,
            use_enhanced_similarity: true,
            query_terms: queryTerms,
            top_k: 10
        }, {
            timeout: 3000 // 3 second timeout
        });
        if (searchResponse.data && searchResponse.data.results && searchResponse.data.results.length > 0) {
            relevantChunks = searchResponse.data.results;
        } else {
            throw new Error('Semantic search returned no results');
        }
    } catch (searchError) {
        // Only log detailed error if it's not a simple connection issue
        if (!searchError.message.includes('ECONNREFUSED') && !searchError.message.includes('404')) {
            console.warn('Semantic search server not available, using fallback search');
        }
        const queryEmbedding = await generateEmbeddings(question);
        const fallbackQueryTerms = queryTerms.length > 0 ? queryTerms : question.split(' ').filter(term => term.length > 2 && !['and', 'the', 'for', 'with', 'that', 'this', 'from', 'what', 'when', 'where', 'which', 'who', 'why', 'how'].includes(term.toLowerCase()));
        relevantChunks = enhancedFallbackSearch(
            question,
            queryEmbedding,
            document.chunks,
            embeddings.chunkEmbeddings,
            fallbackQueryTerms,
            8 // Use a slightly smaller topK for fallback
        );
    }

    if (relevantChunks.length === 0) {
        return res.status(200).json({
            success: true,
            answer: "I couldn't find any relevant information in the document to answer your question.",
            sources: [],
            context: [],
            document_name: document.name,
            model_used: 'retrieval_failed'
        });
    }
    
    // Step 3: Prepare context and call RAG server
    const contextChunks = relevantChunks.map(chunk => ({
      text: chunk.text,
      header: chunk.header || '',
      document_id: documentId,
      document_name: document.name,
      chunk_id: chunk.chunk_id || chunk.index || 'unknown',
      similarity: chunk.similarity || 0,
      word_count: chunk.word_count || chunk.text.split(' ').length
    }));
    
    try {
      // Call enhanced RAG server
      const ragResponse = await axios.post(`${RAG_SERVER_URL}/answer`, {
        question,
        context_chunks: contextChunks  // Send structured context
      });
      
      // Enhanced response with better metadata
      return res.status(200).json({
        success: true,
        answer: ragResponse.data.answer,
        sources: ragResponse.data.sources,
        context: relevantChunks.map(chunk => ({
          ...chunk,
          relevance_score: Math.round((chunk.similarity || 0) * 100),
          preview: chunk.text.substring(0, 150) + (chunk.text.length > 150 ? '...' : '')
        })),
        document_name: document.name,
        model_used: ragResponse.data.model_used || 'enhanced_rag_system'
      });
    } catch (error) {
      console.error('Error calling RAG server, generating fallback answer:', error.message);
      
      // Enhanced fallback response with structured context
      const fallbackAnswer = generateFallbackAnswer(question, contextChunks);
      
      return res.status(200).json({
        success: true,
        answer: fallbackAnswer,
        sources: contextChunks.slice(0, 3).map(chunk => ({
          document_id: chunk.document_id,
          document_name: chunk.document_name,
          chunk_id: chunk.chunk_id,
          similarity: chunk.similarity
        })),
        context: relevantChunks.map(chunk => ({
          ...chunk,
          relevance_score: Math.round((chunk.similarity || 0) * 100),
          preview: chunk.text.substring(0, 150) + (chunk.text.length > 150 ? '...' : '')
        })),
        document_name: document.name,
        model_used: 'fallback_system',
        fallback: true
      });
    }
  } catch (error) {
    console.error('Error in question answering:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// Enhanced fallback answer generation
function generateFallbackAnswer(question, contextChunks) {
  if (!contextChunks || contextChunks.length === 0) {
    return "I don't have enough information to answer this question.";
  }
  
  // Sort by similarity
  const sortedChunks = contextChunks.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
  
  // Analyze question type
  const questionLower = question.toLowerCase();
  const isListQuestion = /what are|list|enumerate|name the|identify/.test(questionLower);
  const isDefinitionQuestion = /what is|define|explain|describe/.test(questionLower);
  
  if (isListQuestion) {
    // Try to extract list items
    const listItems = [];
    
    sortedChunks.slice(0, 3).forEach(chunk => {
      const text = chunk.text;
      
      // Look for numbered lists
      const numberedMatches = text.match(/^\s*\d+\.\s+(.+)$/gm);
      if (numberedMatches) {
        listItems.push(...numberedMatches.map(match => match.replace(/^\s*\d+\.\s+/, '')));
      }
      
      // Look for bullet points
      const bulletMatches = text.match(/^\s*[-*•]\s+(.+)$/gm);
      if (bulletMatches) {
        listItems.push(...bulletMatches.map(match => match.replace(/^\s*[-*•]\s+/, '')));
      }
    });
    
    if (listItems.length > 0) {
      const uniqueItems = [...new Set(listItems)].slice(0, 10);
      let answer = "Based on the document, here are the key points:\n\n";
      uniqueItems.forEach((item, index) => {
        answer += `${index + 1}. ${item}\n`;
      });
      return answer;
    }
  }
  
  // For other question types, extract most relevant sentences
  const questionWords = questionLower.split(' ').filter(word => word.length > 2);
  const relevantSentences = [];
  
  sortedChunks.slice(0, 2).forEach(chunk => {
    const sentences = chunk.text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    sentences.forEach(sentence => {
      const sentenceLower = sentence.toLowerCase();
      const hasRelevantWords = questionWords.some(word => sentenceLower.includes(word));
      
      if (hasRelevantWords && relevantSentences.length < 3) {
        relevantSentences.push(sentence.trim());
      }
    });
  });
  
  if (relevantSentences.length > 0) {
    return relevantSentences.join('. ') + '.';
  }
  
  // Final fallback - return first chunk
  const firstChunk = sortedChunks[0];
  if (firstChunk && firstChunk.similarity > 0.1) {
    const preview = firstChunk.text.substring(0, 300);
    return `Based on the document: ${preview}${firstChunk.text.length > 300 ? '...' : ''}`;
  }
  
  return "I found some relevant information but couldn't extract a clear answer to your question.";
}

// Health check route
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});