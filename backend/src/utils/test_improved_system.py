#!/usr/bin/env python3
"""
Test script for the improved RAG system with semantic chunking.
This tests the system with the biology document example.
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.semantic_search import semantic_chunk_text, search_documents
from utils.rag_module import get_rag_system

# Sample biology text (from your document)
BIOLOGY_TEXT = """
# Biology Study Guide Template

## Ecology

### Levels of Organization
1. Individual: Single organism
2. Population: Same species in same area
3. Community: All species in same area
4. Ecosystem: Community + abiotic factors
5. Biosphere: All ecosystems on Earth

### Population Ecology

#### Population Growth
- Exponential growth: Unlimited resources
- Logistic growth: Limited by carrying capacity
- r-selected species: High reproductive rate, unstable environment
- K-selected species: Low reproductive rate, stable environment

#### Population Regulation
- Density-dependent factors: Competition, predation, disease
- Density-independent factors: Natural disasters, climate

### Community Interactions
- Competition: (-/-)
- Predation: (+/-)
- Mutualism: (+/+)
- Commensalism: (+/0)
- Parasitism: (+/-)

## Cell Biology

### Cell Structure and Function

#### Prokaryotic vs Eukaryotic Cells
- Prokaryotic cells: No membrane-bound nucleus or organelles
  - Examples: Bacteria, Archaea
  - DNA freely floating in cytoplasm
  - Ribosomes present but smaller (70S)

- Eukaryotic cells: Membrane-bound nucleus and organelles
  - Examples: Plants, animals, fungi, protists
  - DNA enclosed in nucleus
  - Larger ribosomes (80S)
"""

def test_chunking():
    """Test the improved semantic chunking."""
    print("="*60)
    print("TESTING IMPROVED SEMANTIC CHUNKING")
    print("="*60)
    
    # Test semantic chunking
    chunks = semantic_chunk_text(BIOLOGY_TEXT, target_size=300, overlap=50)
    
    print(f"Created {len(chunks)} chunks")
    print()
    
    for i, chunk in enumerate(chunks):
        header = chunk.get('header', 'No header')
        word_count = chunk.get('word_count', 0)
        preview = chunk['text'][:100] + "..." if len(chunk['text']) > 100 else chunk['text']
        
        print(f"Chunk {i+1}:")
        print(f"  Header: {header}")
        print(f"  Word count: {word_count}")
        print(f"  Preview: {preview}")
        print(f"  Full text: {chunk['text'][:200]}...")
        print()
    
    return chunks

def test_search(chunks):
    """Test search functionality with the chunked data."""
    print("="*60)
    print("TESTING SEARCH WITH 'levels of organization'")
    print("="*60)
    
    # Create mock embeddings for chunks
    chunk_embeddings = []
    for chunk in chunks:
        # Simple mock embedding based on text content
        text = chunk['text'].lower()
        words = text.split()
        embedding = [hash(word) % 100 / 100.0 for word in words[:10]]
        # Pad to 384 dimensions
        while len(embedding) < 384:
            embedding.append(0.0)
        chunk_embeddings.append(embedding[:384])
    
    # Create query embedding for "levels of organization"
    query = "levels of organization"
    query_words = query.split()
    query_embedding = [hash(word) % 100 / 100.0 for word in query_words]
    while len(query_embedding) < 384:
        query_embedding.append(0.0)
    query_embedding = query_embedding[:384]
    
    # Search
    results = search_documents(query_embedding, chunks, chunk_embeddings, top_k=3)
    
    print(f"Search results for '{query}':")
    print()
    
    for i, result in enumerate(results):
        print(f"Result {i+1}:")
        print(f"  Similarity: {result.get('similarity', 0):.3f}")
        print(f"  Header: {result.get('header', 'No header')}")
        print(f"  Text preview: {result['text'][:200]}...")
        print()
    
    return results

def test_rag(search_results):
    """Test RAG answer generation."""
    print("="*60)
    print("TESTING RAG ANSWER GENERATION")
    print("="*60)
    
    # Initialize RAG system
    rag_system = get_rag_system()
    
    # Prepare context chunks
    context_chunks = []
    for result in search_results:
        context_chunks.append({
            'text': result['text'],
            'header': result.get('header', ''),
            'document_name': 'Biology Study Guide',
            'similarity': result.get('similarity', 0),
            'chunk_id': result.get('chunk_id', 'unknown')
        })
    
    # Generate answer
    question = "what are the levels of organization"
    answer_result = rag_system.generate_answer(question, context_chunks)
    
    print(f"Question: {question}")
    print()
    print("Answer:")
    print(answer_result['answer'])
    print()
    print(f"Model used: {answer_result['model_used']}")
    print()
    print("Sources:")
    for source in answer_result.get('sources', []):
        print(f"  - {source}")

def main():
    """Run all tests."""
    print("TESTING IMPROVED RAG SYSTEM")
    print("="*60)
    
    # Test chunking
    chunks = test_chunking()
    
    # Test search
    search_results = test_search(chunks)
    
    # Test RAG
    test_rag(search_results)
    
    print("\nTesting complete!")

if __name__ == "__main__":
    main()