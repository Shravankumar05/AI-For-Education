#!/usr/bin/env python3
"""
Simplified Semantic Search Server for AI Education Tool
This version avoids heavy dependencies and focuses on basic functionality.
"""

import http.server
import socketserver
import json
import sys
import logging
from typing import Dict, Any, List, Optional
import re

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Constants
DEFAULT_PORT = 5004

# Global storage for indexed documents
document_indices = {}  # documentId -> list of chunks

def advanced_similarity(query: str, text: str) -> float:
    """
    Advanced similarity calculation with multi-signal ranking.
    """
    query_lower = query.lower().strip()
    text_lower = text.lower()
    
    if not query_lower or not text_lower:
        return 0.0
    
    score = 0.0
    
    # 1. Exact phrase match (highest priority) - 40% weight
    if query_lower in text_lower:
        score += 10.0
        
        # Position bonus - earlier matches get higher scores
        start_index = text_lower.find(query_lower)
        position_bonus = max(0, (1000 - start_index) / 1000) * 2
        score += position_bonus
        
        # Whole word boundary bonus
        import re
        if re.search(r'\b' + re.escape(query_lower) + r'\b', text_lower):
            score += 3.0
    
    # 2. Individual word matching - 35% weight
    query_words = query_lower.split()
    text_words = set(text_lower.split())
    
    matched_words = 0
    for word in query_words:
        if len(word) < 2:
            continue
            
        # Exact word match
        if word in text_words:
            matched_words += 1
            score += 2.0 * min(len(word) / 4, 2)  # Length bonus
        else:
            # Partial word match
            for text_word in text_words:
                if word in text_word or text_word in word:
                    score += 0.5
                    break
    
    # All words present bonus
    if len(query_words) > 1 and matched_words == len(query_words):
        score += 5.0  # Strong bonus for having all words
    
    # Word coverage ratio
    coverage = matched_words / max(len(query_words), 1)
    score += coverage * 3.0
    
    # 3. Term frequency - 15% weight
    for word in query_words:
        if len(word) >= 3:
            count = text_lower.count(word)
            score += min(count * 0.5, 2.0)  # Diminishing returns
    
    # 4. Length normalization - 10% weight
    text_length = len(text.split())
    if 50 <= text_length <= 300:
        score *= 1.2  # Prefer medium-length texts
    elif text_length < 20:
        score *= 0.7  # Penalize very short texts
    elif text_length > 500:
        score *= 0.9  # Slight penalty for very long texts
    
    # Normalize final score
    return min(score / 10.0, 1.0)

def highlight_text_advanced(text: str, query: str) -> str:
    """
    Advanced text highlighting with phrase and word priority.
    """
    import re
    
    highlighted = text
    query = query.strip()
    
    if not query:
        return highlighted
    
    # 1. Highlight exact phrase match first (highest priority)
    if len(query) > 0:
        phrase_pattern = re.compile(f'({re.escape(query)})', re.IGNORECASE)
        highlighted = phrase_pattern.sub(
            r'<mark style="background: #ff6b35; color: white; font-weight: bold;">\1</mark>',
            highlighted
        )
    
    # 2. Highlight individual words (if not already highlighted as part of phrase)
    words = query.split()
    for word in words:
        if len(word) > 2:  # Only highlight words longer than 2 characters
            # Use word boundary for accurate matching, avoid double highlighting
            word_pattern = re.compile(f'(?<!<mark[^>]*>)\\b({re.escape(word)})\\b(?![^<]*</mark>)', re.IGNORECASE)
            highlighted = word_pattern.sub(
                r'<mark style="background: #ffd23f;">\1</mark>',
                highlighted
            )
    
    return highlighted

def highlight_text_simple(text: str, query: str) -> str:
    """
    Simple text highlighting (kept for backward compatibility).
    """
    return highlight_text_advanced(text, query)

class SimpleSearchHandler(http.server.BaseHTTPRequestHandler):
    """
    HTTP request handler for the simplified semantic search server.
    """
    
    def _set_headers(self, status_code=200):
        """
        Set response headers with CORS support.
        """
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_OPTIONS(self):
        """
        Handle CORS preflight requests.
        """
        self._set_headers()
    
    def do_GET(self):
        """
        Handle GET requests.
        """
        if self.path == '/health':
            self._set_headers()
            response = {
                'status': 'ok', 
                'message': 'Simple search server is running', 
                'indexed_documents': len(document_indices)
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self._set_headers(404)
            response = {'status': 'error', 'message': 'Not found'}
            self.wfile.write(json.dumps(response).encode())
    
    def do_POST(self):
        """
        Handle POST requests.
        """
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        logging.info(f"Received POST request on {self.path} with data: {post_data.decode('utf-8')[:200]}...")

        try:
            data = json.loads(post_data.decode('utf-8'))
            
            if self.path == '/index':
                response = self._handle_index_request(data)
            elif self.path == '/search':
                response = self._handle_search_request(data)
            else:
                self._set_headers(404)
                response = {'status': 'error', 'message': 'Endpoint not found'}
                logging.warning(f"Endpoint not found for path: {self.path}")

        except json.JSONDecodeError:
            self._set_headers(400)
            response = {'status': 'error', 'message': 'Invalid JSON'}
            logging.error("Failed to decode JSON from request.")
        except Exception as e:
            self._set_headers(500)
            response = {'status': 'error', 'message': str(e)}
            logging.error(f"An unexpected error occurred: {e}", exc_info=True)

        self.wfile.write(json.dumps(response).encode())

    def _handle_index_request(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle indexing requests.
        """
        if 'documentId' not in data or 'chunks' not in data:
            self._set_headers(400)
            return {'status': 'error', 'message': 'Missing required fields: documentId and chunks'}
        
        document_id = data['documentId']
        chunks = data['chunks']
        
        if not chunks:
            self._set_headers(400)
            return {'status': 'error', 'message': 'No chunks provided'}
        
        # Store chunks for this document
        document_indices[document_id] = chunks
        
        logging.info(f"Indexed {len(chunks)} chunks for document {document_id}")
        
        self._set_headers()
        return {'status': 'success', 'message': f'Indexed {len(chunks)} chunks for document {document_id}.'}

    def _handle_search_request(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle search requests.
        """
        if 'documentId' not in data or 'query' not in data:
            self._set_headers(400)
            return {'status': 'error', 'message': 'Missing required fields: documentId and query'}
        
        document_id = data['documentId']
        query = data['query']
        top_k = data.get('top_k', 5)
        
        if document_id not in document_indices:
            self._set_headers(404)
            return {'status': 'error', 'message': f'Document {document_id} not indexed'}
        
        chunks = document_indices[document_id]
        
        # Calculate similarity for each chunk
        scored_results = []
        for i, chunk in enumerate(chunks):
            chunk_text = chunk.get('text', '') if isinstance(chunk, dict) else str(chunk)
            
            if not chunk_text:
                continue
            
            similarity = advanced_similarity(query, chunk_text)
            
            # Skip results with very low similarity
            if similarity < 0.1:
                continue
            
            result = {
                'text': chunk_text,
                'similarity': similarity,
                'chunk_id': chunk.get('chunk_id', f'chunk_{i}') if isinstance(chunk, dict) else f'chunk_{i}',
                'header': chunk.get('header', '') if isinstance(chunk, dict) else '',
                'word_count': chunk.get('word_count', len(chunk_text.split())) if isinstance(chunk, dict) else len(chunk_text.split()),
                'start_idx': 0,
                'end_idx': len(chunk_text),
                'highlighted_text': highlight_text_advanced(chunk_text, query),
                'rerank_score': similarity  # Use same score for rerank_score
            }
            
            scored_results.append(result)
        
        # Sort by similarity
        scored_results.sort(key=lambda x: x['similarity'], reverse=True)
        
        # Take top results
        final_results = scored_results[:top_k]
        
        logging.info(f"Returning {len(final_results)} search results for query: '{query}'")
        
        self._set_headers()
        return {
            'status': 'success',
            'results': final_results,
            'query': query,
            'document_id': document_id,
            'total_results': len(final_results)
        }

def run_server(port: int = DEFAULT_PORT):
    """
    Run the search server.
    """
    try:
        with socketserver.TCPServer(("0.0.0.0", port), SimpleSearchHandler) as httpd:
            logging.info(f"Starting simple search server on port {port}...")
            httpd.serve_forever()
    except OSError as e:
        logging.error(f"Could not start server on port {port}: {e}")
    except KeyboardInterrupt:
        logging.info("Shutting down simple search server.")
        if 'httpd' in locals() and httpd:
            httpd.server_close()

if __name__ == "__main__":
    port = DEFAULT_PORT
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"Invalid port number: {sys.argv[1]}. Using default port {DEFAULT_PORT}.")
    
    run_server(port)