/**
 * API service for document operations
 */

const API_BASE_URL = 'http://localhost:5000/api';
const SEARCH_API_BASE_URL = 'http://localhost:5005';

export interface Document {
  _id: string;
  name: string;
  createdAt: string;
  fileType: string;
  textPreview: string;
  hasEmbedding: boolean;
}

export interface SearchResult {
  text: string;
  highlighted_text: string;
  similarity: number;
  rerank_score: number;
  start_idx: number;
  end_idx: number;
  word_count: number;
}

export interface SearchResponse {
  status: string;
  results: SearchResult[];
  message?: string;
}

export interface DocumentUploadResponse {
  success: boolean;
  document: {
    id: string;
    name: string;
    createdAt: string;
  };
}

export interface DocumentListResponse {
  success: boolean;
  documents: Document[];
}

export interface QAResponse {
  success: boolean;
  answer: string;
  sources?: any[];
  context?: SearchResult[];
  document_name?: string;
  model_used?: string;
  message?: string;
}

/**
 * Upload a document to the server
 */
export const uploadDocument = async (file: File): Promise<DocumentUploadResponse> => {
  const formData = new FormData();
  formData.append('document', file);

  const response = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status: ${response.status}`);
  }

  return response.json();
};

// Flashcard API

export const getFlashcards = async (documentId: string) => {
  const response = await fetch(`${API_BASE_URL}/flashcards/${documentId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch flashcards');
  }
  const data = await response.json();
  return data; // Returns { success: true, flashcards: [...] }
};

export const createFlashcard = async (flashcard: { documentId: string; question: string; answer: string }) => {
  const response = await fetch(`${API_BASE_URL}/flashcards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(flashcard),
  });
  if (!response.ok) {
    throw new Error('Failed to create flashcard');
  }
  return response.json();
};

export const updateFlashcard = async (id: string, flashcard: { question: string; answer: string }) => {
  const response = await fetch(`${API_BASE_URL}/flashcards/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(flashcard),
  });
  if (!response.ok) {
    throw new Error('Failed to update flashcard');
  }
  return response.json();
};

export const deleteFlashcard = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/flashcards/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete flashcard');
  }
  return response.json();
};

// New flashcard functions
export const getFlashcardsForReview = async (documentId: string) => {
  const response = await fetch(`${API_BASE_URL}/flashcards/${documentId}/review`);
  if (!response.ok) {
    throw new Error('Failed to fetch flashcards for review');
  }
  return response.json();
};

export const exportFlashcardsCSV = async (documentId: string) => {
  const response = await fetch(`${API_BASE_URL}/flashcards/${documentId}/export`);
  if (!response.ok) {
    throw new Error('Failed to export flashcards');
  }
  
  // Create download link
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'flashcards.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Get all documents
 */
export const getDocuments = async (): Promise<DocumentListResponse> => {
  const response = await fetch(`${API_BASE_URL}/documents`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch documents with status: ${response.status}`);
  }
  
  return response.json();
};

/**
 * Index a document for search
 */
export const indexDocument = async (documentId: string): Promise<any> => {
  const doc = await getDocument(documentId);
  const response = await fetch(`${SEARCH_API_BASE_URL}/index`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ documentId, text: doc.text }),
  });

  if (!response.ok) {
    throw new Error(`Indexing failed with status: ${response.status}`);
  }

  return response.json();
};

/**
 * Search within a document
 */
export const searchDocument = async (documentId: string, query: string): Promise<SearchResponse> => {
  const response = await fetch(`${API_BASE_URL}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ documentId, query }),
  });
  
  if (!response.ok) {
    throw new Error(`Search failed with status: ${response.status}`);
  }
  
  return response.json();
};

/**
 * Get a single document by ID
 */
export const getDocument = async (id: string): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/documents/${id}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch document with status: ${response.status}`);
  }
  
  return response.json();
};

/**
 * Ask a question about a document using RAG
 */
export const askQuestion = async (documentId: string, question: string): Promise<QAResponse> => {
  const response = await fetch(`${API_BASE_URL}/qa`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ documentId, question }),
  });
  
  if (!response.ok) {
    throw new Error(`Q&A request failed with status: ${response.status}`);
  }
  
  return response.json();
};
