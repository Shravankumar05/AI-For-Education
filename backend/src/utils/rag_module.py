import os
import sys
import json
import numpy as np
from typing import List, Dict, Any

try:
    import ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False

import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Constants
EMBEDDING_MODEL = 'nomic-embed-text'
DEFAULT_MODEL = 'llama3.2:1b'

class RAGSystem:
    """
    A simplified RAG system based on the logic in docs/demo_rag.py.
    """
    def __init__(self, model_name: str = DEFAULT_MODEL):
        self.model_name = model_name
        self.ollama_available = OLLAMA_AVAILABLE

    def generate_answer(self, question: str, context_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not self.ollama_available:
            return {
                "answer": "Ollama is not available. Please install the 'ollama' package and ensure the server is running.",
                "sources": [],
                "model_used": "mock_llm",
            }

        # Format the context for the prompt
        formatted_context = self._format_context(context_chunks)

        # Create the instruction prompt
        instruction_prompt = f"""You are a helpful chatbot.
Use only the following pieces of context to answer the question. Don't make up any new information:
{formatted_context}
"""
        logging.info(f"Instruction prompt for Ollama: {instruction_prompt}")

        try:
            stream = ollama.chat(
                model=self.model_name,
                messages=[
                    {'role': 'system', 'content': instruction_prompt},
                    {'role': 'user', 'content': question},
                ],
                stream=True,
            )

            answer = ""
            for chunk in stream:
                answer += chunk['message']['content']

            logging.info(f"Full answer from Ollama: {answer}")

            return {
                "answer": answer,
                "sources": self._extract_sources(context_chunks),
                "model_used": f"ollama_{self.model_name}",
            }
        except Exception as e:
            logging.error(f"Error during Ollama chat: {e}", exc_info=True)
            return {
                "answer": f"Error generating answer with Ollama: {e}",
                "sources": [],
                "model_used": "error",
            }

    def _format_context(self, context_chunks: List[Dict[str, Any]]) -> str:
        logging.info(f"Formatting {len(context_chunks)} context chunks.")
        
        # Log the received chunks for debugging
        for i, chunk in enumerate(context_chunks):
            logging.info(f"Chunk {i+1}: similarity={chunk.get('similarity', 'N/A')}, text='{chunk.get('text', '')[:50]}...'")

        sorted_chunks = sorted(context_chunks, key=lambda x: x.get('similarity', 0), reverse=True)
        
        # Log the sorted chunks
        logging.info("Chunks after sorting by similarity:")
        for i, chunk in enumerate(sorted_chunks):
            logging.info(f"Sorted Chunk {i+1}: similarity={chunk.get('similarity', 'N/A')}, text='{chunk.get('text', '')[:50]}...'")

        formatted_context = '\n'.join([f" - {chunk['text']}" for chunk in sorted_chunks])
        logging.info(f"Formatted context length: {len(formatted_context)}")
        return formatted_context

    def _extract_sources(self, context_chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        sources = []
        for chunk in context_chunks:
            sources.append({
                "document_id": chunk.get("document_id", ""),
                "document_name": chunk.get("document_name", "Unknown"),
                "chunk_id": chunk.get("chunk_id", ""),
                "similarity": chunk.get("similarity", 0.0),
                "text": chunk.get("text", ""),
                "preview": chunk.get("text", "")[:150] + "..." if len(chunk.get("text", "")) > 150 else chunk.get("text", ""),
            })
        return sources

def get_rag_system(model_name: str = DEFAULT_MODEL) -> RAGSystem:
    return RAGSystem(model_name=model_name)

if __name__ == "__main__":
    rag = get_rag_system()
    context = [
        {
            "document_id": "doc1",
            "document_name": "Sample Document",
            "chunk_id": "chunk1",
            "text": "The sky is blue due to Rayleigh scattering.",
            "similarity": 0.9
        },
        {
            "document_id": "doc2",
            "document_name": "Another Document",
            "chunk_id": "chunkA",
            "text": "Water is composed of hydrogen and oxygen.",
            "similarity": 0.1
        }
    ]
    question = "Why is the sky blue?"
    result = rag.generate_answer(question, context)
    print(json.dumps(result, indent=2))