import http.server
import socketserver
import json
import sys
import numpy as np
from typing import Dict, Any, List, Optional
import os
import logging
from sentence_transformers import CrossEncoder

# Import semantic search utilities
from semantic_search import (
    Searcher,
    semantic_chunk_text,
    highlight_text
)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Constants
DEFAULT_PORT = 5004
EMBEDDING_MODEL = 'all-MiniLM-L6-v2'
RERANK_MODEL = 'cross-encoder/ms-marco-MiniLM-L-6-v2'

# Load the reranker model
reranker = CrossEncoder(RERANK_MODEL)

# Instantiate the searcher
searcher = Searcher(EMBEDDING_MODEL)

class SemanticSearchHandlerV2(http.server.BaseHTTPRequestHandler):
    """
    HTTP request handler for the improved semantic search server.
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
            response = {'status': 'ok', 'message': 'Semantic search server v2 is running', 'version': '2.0.0'}
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
        logging.info(f"Received POST request on {self.path} with data: {post_data.decode('utf-8')}")

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
        # Check for the new format with documentId and chunks
        if 'documentId' in data and 'chunks' in data:
            document_id = data['documentId']
            chunks = data['chunks']
            
            if not chunks:
                self._set_headers(400)
                return {'status': 'error', 'message': 'No chunks provided'}
            
            # Build index using the provided chunks
            searcher.build_index(chunks)
            
            self._set_headers()
            return {'status': 'success', 'message': f'Indexed {len(chunks)} chunks for document {document_id}.'}
        
        # Fallback to old format for backward compatibility
        elif 'text' in data:
            text = data['text']
            chunks = semantic_chunk_text(text)
            searcher.build_index(chunks)

            self._set_headers()
            return {'status': 'success', 'message': f'Indexed {len(chunks)} chunks.'}
        
        else:
            self._set_headers(400)
            return {'status': 'error', 'message': 'Missing required field: documentId and chunks, or text'}

    def _handle_search_request(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle semantic search requests with metadata filtering and reranking.
        """
        # Support both new format (documentId + query) and old format (query only)
        if 'documentId' in data and 'query' in data:
            document_id = data['documentId']
            query = data['query']
            top_k = data.get('top_k', 5)
            
            # Perform search (searcher should already be indexed with the document)
            initial_results = searcher.search(query, top_k=top_k * 3)
            
        elif 'query' in data:
            query = data['query']
            top_k = data.get('top_k', 10)
            
            # Initial search
            initial_results = searcher.search(query, top_k=top_k * 3)
        else:
            self._set_headers(400)
            return {'status': 'error', 'message': 'Missing required field: query'}
        
        if not initial_results:
            self._set_headers()
            return {
                'status': 'success',
                'results': []
            }
        
        # Reranking
        passages = [result['text'] for result in initial_results]
        rerank_scores = reranker.predict([(query, passage) for passage in passages])
        
        for result, score in zip(initial_results, rerank_scores):
            result['rerank_score'] = float(score)
            
        # Sort by rerank score
        reranked_results = sorted(initial_results, key=lambda x: x['rerank_score'], reverse=True)[:top_k]
        
        # Add missing fields expected by the backend
        for result in reranked_results:
            if 'highlighted_text' not in result:
                # Simple highlighting
                highlighted = highlight_text(result['text'], query.split())
                result['highlighted_text'] = highlighted
            if 'start_idx' not in result:
                result['start_idx'] = 0
            if 'end_idx' not in result:
                result['end_idx'] = len(result['text'])
        
        self._set_headers()
        return {
            'status': 'success',
            'results': reranked_results
        }

def run_server(port: int = DEFAULT_PORT):
    """
    Run the semantic search server.
    """
    try:
        with socketserver.TCPServer(("0.0.0.0", port), SemanticSearchHandlerV2) as httpd:
            logging.info(f"Starting semantic search server v2 on port {port}...")
            httpd.serve_forever()
    except OSError as e:
        logging.error(f"Could not start server on port {port}: {e}")
    except KeyboardInterrupt:
        logging.info("Shutting down semantic search server v2.")
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