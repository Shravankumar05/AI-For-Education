import os
import sys
import json
import http.server
import socketserver
from urllib.parse import urlparse, parse_qs
from typing import Dict, Any, List, Optional

# Add the parent directory to sys.path to import rag_module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the RAG module
from rag_module import get_rag_system, RAGSystem

# Default port for the server
DEFAULT_PORT = 5002

# Initialize the RAG system
rag_system = get_rag_system()

class RAGHandler(http.server.BaseHTTPRequestHandler):
    """
    HTTP request handler for the RAG server.
    """
    
    def _set_headers(self, status_code=200, content_type="application/json"):
        """
        Set the response headers.
        
        Args:
            status_code: HTTP status code
            content_type: Content type of the response
        """
        self.send_response(status_code)
        self.send_header("Content-type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self):
        """
        Handle OPTIONS requests for CORS.
        """
        self._set_headers()

    def do_GET(self):
        """
        Handle GET requests.
        """
        # Parse the URL
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        # Health check endpoint
        if path == "/health":
            self._set_headers()
            response = {"status": "ok", "message": "RAG server is running"}
            self.wfile.write(json.dumps(response).encode())
        else:
            self._set_headers(404)
            response = {"error": "Not found"}
            self.wfile.write(json.dumps(response).encode())

    def do_POST(self):
        """
        Handle POST requests.
        """
        # Parse the URL
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        # Get the content length
        content_length = int(self.headers["Content-Length"]) if "Content-Length" in self.headers else 0
        
        # Read the request body
        if content_length > 0:
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode("utf-8"))
        else:
            request_data = {}
        
        # Answer generation endpoint
        if path == "/answer":
            self._handle_answer_request(request_data)
        else:
            self._set_headers(404)
            response = {"error": "Not found"}
            self.wfile.write(json.dumps(response).encode())

    def _handle_answer_request(self, request_data: Dict[str, Any]):
        """
        Handle requests to the /answer endpoint.
        
        Args:
            request_data: The request data
        """
        # Check if the required fields are present
        if "question" not in request_data:
            self._set_headers(400)
            response = {"error": "Missing required field: question"}
            self.wfile.write(json.dumps(response).encode())
            return
        
        # Extract the question and context (context is optional)
        question = request_data["question"]
        context = request_data.get("context_chunks", [])
        
        try:
            # Generate the answer using the RAG system
            result = rag_system.generate_answer(question, context)
            
            # Return the result
            self._set_headers()
            self.wfile.write(json.dumps(result).encode())
        except Exception as e:
            self._set_headers(500)
            response = {"error": str(e)}
            self.wfile.write(json.dumps(response).encode())


def run_server(port: int = DEFAULT_PORT):
    """
    Run the RAG server on the specified port.
    
    Args:
        port: The port to run the server on
    """
    with socketserver.TCPServer(("0.0.0.0", port), RAGHandler) as httpd:
        print(f"Starting RAG server on port {port}...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("Stopping RAG server...")
            httpd.server_close()


if __name__ == "__main__":
    # Get the port from the command line arguments
    port = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT
    
    # Run the server
    run_server(port)