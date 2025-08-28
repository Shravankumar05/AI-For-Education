#!/usr/bin/env python3
"""
Simplified Semantic Search Server for AI Education Tool
Based on the travel app example - handles document indexing and search operations.
"""

import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer, CrossEncoder
import numpy as np
from typing import Dict, Any, List, Optional
import faiss

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
EMBEDDING_MODEL = 'all-MiniLM-L6-v2'
RERANK_MODEL = 'cross-encoder/ms-marco-MiniLM-L-6-v2'

# Global variables for models and indices
model = None
reranker = None
document_indices = {}  # documentId -> faiss index
document_chunks = {}   # documentId -> list of chunks

def initialize_models():
    """Initialize the sentence transformer and reranker models."""
    global model, reranker
    
    try:
        logging.info(f"Loading SentenceTransformer model: {EMBEDDING_MODEL}")
        model = SentenceTransformer(EMBEDDING_MODEL)
        
        logging.info(f"Loading CrossEncoder model: {RERANK_MODEL}")
        reranker = CrossEncoder(RERANK_MODEL)
        
        logging.info("Models loaded successfully")
        return True
    except Exception as e:
        logging.error(f"Failed to load models: {e}")
        return False

def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """Calculate cosine similarity between two vectors."""
    try:
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
            
        return float(dot_product / (norm1 * norm2))
    except Exception:
        return 0.0

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'message': 'Semantic search server is running',
        'model': EMBEDDING_MODEL,
        'indexed_documents': len(document_indices)
    })

@app.route('/index', methods=['POST'])
def index_document():
    """Index a document with its chunks for semantic search."""
    try:
        data = request.get_json()
        
        # Validate request
        if not data:
            return jsonify({'status': 'error', 'message': 'No JSON data provided'}), 400
        
        document_id = data.get('documentId')
        chunks = data.get('chunks', [])
        
        if not document_id:
            return jsonify({'status': 'error', 'message': 'documentId is required'}), 400
        
        if not chunks:
            return jsonify({'status': 'error', 'message': 'chunks are required'}), 400
        
        logging.info(f"Indexing document {document_id} with {len(chunks)} chunks")
        
        # Extract text from chunks
        chunk_texts = []
        for chunk in chunks:
            if isinstance(chunk, dict) and 'text' in chunk:
                chunk_texts.append(chunk['text'])
            elif isinstance(chunk, str):
                chunk_texts.append(chunk)
            else:
                logging.warning(f"Invalid chunk format: {chunk}")
                continue
        
        if not chunk_texts:
            return jsonify({'status': 'error', 'message': 'No valid chunks found'}), 400
        
        # Generate embeddings for all chunks
        logging.info(f"Generating embeddings for {len(chunk_texts)} chunks")
        embeddings = model.encode(chunk_texts, convert_to_tensor=False, show_progress_bar=False)
        
        # Create FAISS index
        dimension = embeddings.shape[1]
        index = faiss.IndexFlatL2(dimension)  # L2 distance for similarity
        index.add(embeddings.astype('float32'))
        
        # Store the index and chunks
        document_indices[document_id] = index
        document_chunks[document_id] = chunks
        
        logging.info(f"Successfully indexed document {document_id}")
        
        return jsonify({
            'status': 'success',
            'message': f'Indexed {len(chunk_texts)} chunks for document {document_id}',
            'chunks_indexed': len(chunk_texts),
            'embedding_dimension': dimension
        })
        
    except Exception as e:
        logging.error(f"Error indexing document: {e}", exc_info=True)
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/search', methods=['POST'])
def search_document():
    """Search within a specific document using semantic similarity."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'status': 'error', 'message': 'No JSON data provided'}), 400
        
        document_id = data.get('documentId')
        query = data.get('query')
        top_k = data.get('top_k', 5)
        
        if not document_id or not query:
            return jsonify({'status': 'error', 'message': 'documentId and query are required'}), 400
        
        if document_id not in document_indices:
            return jsonify({'status': 'error', 'message': f'Document {document_id} not indexed'}), 404
        
        logging.info(f"Searching document {document_id} with query: '{query}'")
        
        # Get the index and chunks for this document
        index = document_indices[document_id]
        chunks = document_chunks[document_id]
        
        # Generate query embedding
        query_embedding = model.encode([query], convert_to_tensor=False, show_progress_bar=False)
        
        # Search in the index
        distances, indices = index.search(query_embedding.astype('float32'), min(top_k * 2, len(chunks)))
        
        # Prepare initial results
        initial_results = []
        for i, (distance, idx) in enumerate(zip(distances[0], indices[0])):
            if idx < len(chunks):
                chunk = chunks[idx]
                # Convert L2 distance to similarity (0-1 range)
                similarity = 1 / (1 + distance)
                
                result = {
                    'text': chunk.get('text', '') if isinstance(chunk, dict) else str(chunk),
                    'similarity': float(similarity),
                    'chunk_id': chunk.get('chunk_id', f'chunk_{idx}') if isinstance(chunk, dict) else f'chunk_{idx}',
                    'header': chunk.get('header', '') if isinstance(chunk, dict) else '',
                    'word_count': chunk.get('word_count', 0) if isinstance(chunk, dict) else len(str(chunk).split()),
                    'start_idx': 0,  # Placeholder
                    'end_idx': len(chunk.get('text', '') if isinstance(chunk, dict) else str(chunk))
                }
                initial_results.append(result)
        
        # Reranking with CrossEncoder
        if initial_results and len(initial_results) > 1:
            try:
                logging.info(f"Reranking {len(initial_results)} results")
                passages = [result['text'] for result in initial_results]
                pairs = [(query, passage) for passage in passages]
                
                rerank_scores = reranker.predict(pairs, show_progress_bar=False)
                
                # Add rerank scores and sort
                for result, score in zip(initial_results, rerank_scores):
                    result['rerank_score'] = float(score)
                
                # Sort by rerank score
                initial_results.sort(key=lambda x: x['rerank_score'], reverse=True)
                
            except Exception as rerank_error:
                logging.warning(f"Reranking failed: {rerank_error}")
                # Continue with original similarity scores
        
        # Take top_k results
        final_results = initial_results[:top_k]
        
        # Add highlighting (simple version)
        query_terms = query.lower().split()
        for result in final_results:
            text = result['text']
            highlighted_text = text
            
            # Simple highlighting - replace query terms with marked versions
            for term in query_terms:
                if len(term) > 2:  # Only highlight terms longer than 2 characters
                    highlighted_text = highlighted_text.replace(
                        term, f'<mark>{term}</mark>'
                    )
                    # Also try capitalized version
                    highlighted_text = highlighted_text.replace(
                        term.capitalize(), f'<mark>{term.capitalize()}</mark>'
                    )
            
            result['highlighted_text'] = highlighted_text
        
        logging.info(f"Returning {len(final_results)} search results")
        
        return jsonify({
            'status': 'success',
            'results': final_results,
            'query': query,
            'document_id': document_id,
            'total_results': len(final_results)
        })
        
    except Exception as e:
        logging.error(f"Error searching document: {e}", exc_info=True)
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/clear', methods=['POST'])
def clear_indices():
    """Clear all document indices (for testing/debugging)."""
    global document_indices, document_chunks
    
    document_indices.clear()
    document_chunks.clear()
    
    logging.info("Cleared all document indices")
    
    return jsonify({
        'status': 'success',
        'message': 'All indices cleared'
    })

if __name__ == '__main__':
    logging.info("Starting Semantic Search Server...")
    
    # Initialize models
    if not initialize_models():
        logging.error("Failed to initialize models. Exiting.")
        exit(1)
    
    # Start the server
    port = 5004
    logging.info(f"Starting server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)