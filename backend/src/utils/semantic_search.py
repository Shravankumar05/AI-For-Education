import numpy as np
from typing import List, Dict, Any, Optional, Tuple
import re
from sentence_transformers import SentenceTransformer
import faiss

# Constants for semantic chunking
DEFAULT_CHUNK_SIZE = 300
DEFAULT_OVERLAP = 50
MIN_CHUNK_SIZE = 100

class Searcher:
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(model_name)
        self.index = None
        self.document_chunks = []

    def build_index(self, chunks: List[Dict[str, Any]]):
        self.document_chunks = chunks
        embeddings = self.model.encode([chunk['text'] for chunk in chunks], convert_to_tensor=True)
        self.index = faiss.IndexFlatL2(embeddings.shape[1])
        self.index.add(embeddings.cpu().detach().numpy())

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        if self.index is None:
            return []
        
        query_embedding = self.model.encode([query], convert_to_tensor=True)
        distances, indices = self.index.search(query_embedding.cpu().detach().numpy(), top_k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            chunk = self.document_chunks[idx].copy()
            chunk['similarity'] = 1 - distances[0][i]  # Convert distance to similarity
            results.append(chunk)
            
        return results

def semantic_chunk_text(text: str, target_size: int = DEFAULT_CHUNK_SIZE, 
                       overlap: int = DEFAULT_OVERLAP) -> List[Dict[str, Any]]:
    """
    Chunk text with semantic awareness (headers, paragraphs, lists).
    
    Args:
        text: Text to chunk
        target_size: Target chunk size in words
        overlap: Overlap between chunks in words
        
    Returns:
        List of chunk dictionaries with text and metadata
    """
    # Ensure minimum chunk size
    target_size = max(target_size, MIN_CHUNK_SIZE)
    
    # Split text into lines
    lines = text.split('\n')
    
    # Initialize variables
    chunks = []
    current_chunk = []
    current_word_count = 0
    current_header = None
    current_section = None
    chunk_id = 0
    
    # Process each line
    for line in lines:
        # Skip empty lines
        if not line.strip():
            continue
            
        # Check if line is a header
        header_match = re.match(r'^(#{1,6})\s+(.+)$', line)
        if header_match:
            # If we have content in the current chunk, finalize it
            if current_chunk and current_word_count >= MIN_CHUNK_SIZE:
                chunk_text = '\n'.join(current_chunk)
                chunks.append({
                    'text': chunk_text,
                    'header': current_header,
                    'section': current_section,
                    'word_count': current_word_count,
                    'chunk_id': f'chunk_{chunk_id}'
                })
                chunk_id += 1
                
                # Start new chunk with overlap
                overlap_words = []
                overlap_count = 0
                
                # Add overlap from previous chunk
                for prev_line in reversed(current_chunk):
                    prev_words = prev_line.split()
                    if overlap_count + len(prev_words) <= overlap:
                        overlap_words.insert(0, prev_line)
                        overlap_count += len(prev_words)
                    else:
                        # Take partial line to reach overlap
                        remaining = overlap - overlap_count
                        if remaining > 0:
                            partial = ' '.join(prev_words[-remaining:])
                            overlap_words.insert(0, partial)
                        break
                        
                current_chunk = overlap_words
                current_word_count = overlap_count
            
            # Update header information
            header_level = len(header_match.group(1))
            header_text = header_match.group(2)
            
            if header_level <= 2:
                current_section = header_text
                
            current_header = header_text
            
            # Add header to current chunk
            current_chunk.append(line)
            current_word_count += len(header_text.split())
        else:
            # Regular line - add to current chunk
            words_in_line = len(line.split())
            
            # Check if adding this line would exceed target size
            if current_word_count + words_in_line > target_size and current_word_count >= MIN_CHUNK_SIZE:
                # Finalize current chunk
                chunk_text = '\n'.join(current_chunk)
                chunks.append({
                    'text': chunk_text,
                    'header': current_header,
                    'section': current_section,
                    'word_count': current_word_count,
                    'chunk_id': f'chunk_{chunk_id}'
                })
                chunk_id += 1
                
                # Start new chunk with overlap
                overlap_words = []
                overlap_count = 0
                
                # Add overlap from previous chunk
                for prev_line in reversed(current_chunk):
                    prev_words = prev_line.split()
                    if overlap_count + len(prev_words) <= overlap:
                        overlap_words.insert(0, prev_line)
                        overlap_count += len(prev_words)
                    else:
                        # Take partial line to reach overlap
                        remaining = overlap - overlap_count
                        if remaining > 0:
                            partial = ' '.join(prev_words[-remaining:])
                            overlap_words.insert(0, partial)
                        break
                
                current_chunk = overlap_words
                current_word_count = overlap_count
            
            # Add line to current chunk
            current_chunk.append(line)
            current_word_count += words_in_line
    
    # Add final chunk if not empty
    if current_chunk and current_word_count > 0:
        chunk_text = '\n'.join(current_chunk)
        chunks.append({
            'text': chunk_text,
            'header': current_header,
            'section': current_section,
            'word_count': current_word_count,
            'chunk_id': f'chunk_{chunk_id}'
        })
    
    return chunks

def highlight_text(text: str, keywords: List[str]) -> str:
    """
    Highlight keywords in text with improved context.
    
    Args:
        text: Input text
        keywords: List of keywords to highlight
        
    Returns:
        Text with keywords highlighted using <mark> tags
    """
    # First, escape any HTML to prevent injection
    highlighted = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    
    # Sort keywords by length (descending) to highlight longer phrases first
    sorted_keywords = sorted(keywords, key=len, reverse=True)
    
    # Track positions of highlights to avoid overlapping
    highlight_positions = []
    
    for keyword in sorted_keywords:
        if len(keyword) < 3:
            continue
            
        # Use word boundaries for more accurate matching
        pattern = re.compile(f'\\b({re.escape(keyword)})\\b', re.IGNORECASE)
        
        # Find all matches
        for match in pattern.finditer(highlighted):
            start, end = match.span()
            
            # Check if this match overlaps with existing highlights
            overlaps = False
            for hs, he in highlight_positions:
                if (start <= he and end >= hs):
                    overlaps = True
                    break
                    
            if not overlaps:
                # Add highlight tags
                highlighted = highlighted[:start] + f'<mark>{highlighted[start:end]}</mark>' + highlighted[end:]
                
                # Update positions (accounting for added tags)
                highlight_positions.append((start, end))
                
                # Adjust positions for subsequent matches (tags add 13 characters: <mark></mark>)
                highlight_positions = [(s + 13 if s > end else s, e + 13 if e > end else e) 
                                     for s, e in highlight_positions]
    
    # Add context indicators for better readability
    if highlight_positions:
        # Find the first highlight position
        first_highlight = min(highlight_positions, key=lambda x: x[0])[0]
        
        # If the first highlight is not at the beginning, add context indicator
        context_before = 100  # Characters of context to show before first highlight
        if first_highlight > context_before:
            # Find the start of the sentence or paragraph containing the first highlight
            sentence_start = highlighted.rfind('.', 0, first_highlight)
            paragraph_start = highlighted.rfind('\n', 0, first_highlight)
            context_start = max(sentence_start, paragraph_start)
            
            if context_start > 0:
                highlighted = highlighted[:context_start] + ' [...] ' + highlighted[context_start:]
    
    return highlighted