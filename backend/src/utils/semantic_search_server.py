import http.server
import socketserver
import json
import sys
import numpy as np
from typing import Dict, Any, List, Optional
import os
import logging
import ollama

# Import semantic search utilities
from semantic_search import (
    cosine_similarity, 
    search_documents, 
    extract_keywords, 
    highlight_text, 
    semantic_chunk_text,
    enhanced_similarity
)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Constants
DEFAULT_PORT = 5003
EMBEDDING_MODEL = 'nomic-embed-text'

class SemanticSearchHandler(http.server.BaseHTTPRequestHandler):
    """
    HTTP request handler for semantic search server.
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
            response = {'status': 'ok', 'message': 'Semantic search server is running', 'version': '1.1.0'}
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
            
            if self.path == '/search':
                response = self._handle_search_request(data)
            elif self.path == '/chunk':
                response = self._handle_chunk_request(data)
            elif self.path == '/embed':
                response = self._handle_embed_request(data)
            elif self.path == '/keywords':
                response = self._handle_keywords_request(data)
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
    
    def _handle_keywords_request(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle keyword extraction requests.
        
        Expected data format:
        {
            "text": "...",  # Text to extract keywords from
            "max_keywords": 15  # Optional max number of keywords
        }
        """
        if 'text' not in data:
            self._set_headers(400)
            return {'status': 'error', 'message': 'Missing required field: text'}
        
        text = data['text']
        max_keywords = data.get('max_keywords', 15)
        
        try:
            keywords = extract_keywords(text, max_keywords)
            self._set_headers()
            return {
                'status': 'success',
                'keywords': keywords
            }
        except Exception as e:
            self._set_headers(500)
            return {'status': 'error', 'message': str(e)}

    def _handle_search_request(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle semantic search requests.
        
        Expected data format:
        {
            "query_embedding": [...],  # Query embedding vector
            "chunk_embeddings": [...],  # List of chunk embedding vectors
            "document_chunks": [...],  # List of document chunks
            "query_terms": [...],  # Optional query terms for highlighting
            "top_k": 5,  # Optional number of results to return
            "use_enhanced_similarity": false,  # Optional flag to use enhanced similarity
            "query": "..."  # Original query text (needed for enhanced similarity)
        }
        """
        # Validate required fields
        required_fields = ['query_embedding', 'chunk_embeddings', 'document_chunks', 'query']
        for field in required_fields:
            if field not in data:
                self._set_headers(400)
                return {'status': 'error', 'message': f'Missing required field: {field}'}
        
        # Extract data
        query_embedding = data['query_embedding']
        chunk_embeddings = data['chunk_embeddings']
        document_chunks = data['document_chunks']
        query_terms = data.get('query_terms', [])
        top_k = data.get('top_k', 5)
        query = data['query']
        
        # Perform search
        try:
            search_results = search_documents(
                query_embedding=query_embedding,
                document_chunks=document_chunks,
                chunk_embeddings=chunk_embeddings,
                top_k=top_k,
                use_enhanced_similarity=data.get('use_enhanced_similarity', False),
                query=query,
                query_terms=query_terms
            )
            
            # Enhance results with highlighting if query terms provided
            if query_terms:
                for result in search_results:
                    result['highlighted_text'] = highlight_text(result['text'], query_terms)
            
            self._set_headers()
            return {
                'status': 'success',
                'results': search_results
            }
        except Exception as e:
            self._set_headers(500)
            return {'status': 'error', 'message': str(e)}
    
    def _handle_chunk_request(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle text chunking requests.
        
        Expected data format:
        {
            "text": "...",  # Text to chunk
            "chunk_size": 300,  # Optional target chunk size
            "overlap": 50  # Optional chunk overlap
        }
        """
        # Validate required fields
        if 'text' not in data:
            self._set_headers(400)
            logging.error("Missing required field: text")
            return {'status': 'error', 'message': 'Missing required field: text'}
        
        # Extract data
        text = data['text']
        chunk_size = data.get('chunk_size', 300)
        overlap = data.get('overlap', 50)
        
        # Perform chunking
        try:
            chunks = semantic_chunk_text(
                text=text,
                target_size=chunk_size,
                overlap=overlap
            )
            
            self._set_headers()
            return {
                'status': 'success',
                'chunks': chunks
            }
        except Exception as e:
            self._set_headers(500)
            logging.error(f"Failed to chunk text: {e}", exc_info=True)
            return {'status': 'error', 'message': str(e)}
            
    def _handle_embed_request(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle embedding generation requests.
        
        Expected data format:
        {
            "text": "...",  # Text to generate embeddings for
        }
        """
        logging.info(f"Handling /embed request with data: {data}")
        # Validate required fields
        if 'text' not in data:
            self._set_headers(400)
            logging.error("Missing required field: text in /embed request")
            return {'status': 'error', 'message': 'Missing required field: text'}
        
        # Extract data
        text = data['text']
        
        # Generate embeddings
        try:
            embedding = self._generate_embedding(text)
            
            self._set_headers()
            response = {
                'status': 'success',
                'embedding': embedding,
                'dimensions': len(embedding)
            }
            logging.info(f"Successfully generated embedding for text: '{text[:50]}...'")
            return response
        except Exception as e:
            self._set_headers(500)
            logging.error(f"Failed to generate embedding: {e}", exc_info=True)
            return {'status': 'error', 'message': str(e)}
    
    def _generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding using Ollama.
        """
        try:
            response = ollama.embeddings(model=EMBEDDING_MODEL, prompt=text)
            return response["embedding"]
        except Exception as e:
            logging.error(f"Failed to generate embedding with Ollama: {e}", exc_info=True)
            # Fallback to mock embedding if Ollama fails
            logging.info("Falling back to mock embedding.")
            return self._generate_mock_embedding(text)

    def _generate_mock_embedding(self, text: str) -> List[float]:
        """
        Generate a mock embedding for demonstration purposes.
        In production, this would be replaced with a real embedding model.
        """
        # Create a deterministic but simple mock embedding
        np.random.seed(hash(text) % 2**32)
        embedding = np.random.uniform(-1, 1, 384).tolist()
        return embedding

def run_server(port: int = DEFAULT_PORT):
    """
    Run the semantic search server.
    
    Args:
        port: Port number to listen on
    """
    try:
        with socketserver.TCPServer(("0.0.0.0", port), SemanticSearchHandler) as httpd:
            logging.info(f"Starting semantic search server on port {port}...")
            httpd.serve_forever()
    except OSError as e:
        logging.error(f"Could not start server on port {port}: {e}")
    except KeyboardInterrupt:
        logging.info("Shutting down semantic search server.")
        if 'httpd' in locals() and httpd:
            httpd.server_close()

if __name__ == "__main__":
    # Get port from command line argument if provided
    port = DEFAULT_PORT
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"Invalid port number: {sys.argv[1]}. Using default port {DEFAULT_PORT}.")
    
    run_server(port)