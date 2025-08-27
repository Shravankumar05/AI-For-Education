import numpy as np
from typing import List, Dict, Any, Optional, Tuple
import re

# Constants for semantic chunking
DEFAULT_CHUNK_SIZE = 300
DEFAULT_OVERLAP = 50
MIN_CHUNK_SIZE = 100

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """
    Calculate cosine similarity between two vectors.
    
    Args:
        vec1: First vector
        vec2: Second vector
        
    Returns:
        Cosine similarity score (0-1)
    """
    if len(vec1) != len(vec2):
        raise ValueError(f"Vector dimensions don't match: {len(vec1)} vs {len(vec2)}")
        
    # Convert to numpy arrays for efficient computation
    v1 = np.array(vec1)
    v2 = np.array(vec2)
    
    # Calculate dot product
    dot_product = np.dot(v1, v2)
    
    # Calculate magnitudes
    mag1 = np.linalg.norm(v1)
    mag2 = np.linalg.norm(v2)
    
    # Avoid division by zero
    if mag1 == 0 or mag2 == 0:
        return 0.0
        
    # Calculate cosine similarity
    return dot_product / (mag1 * mag2)
    
def enhanced_similarity(vec1: List[float], vec2: List[float], text1: str, text2: str, query_terms: List[str] = None) -> float:
    """
    Calculate enhanced similarity that combines cosine similarity with keyword matching.
    
    Args:
        vec1: First vector
        vec2: Second vector
        text1: Text corresponding to first vector
        text2: Text corresponding to second vector
        query_terms: List of important terms from the query
        
    Returns:
        Enhanced similarity score (0-1)
    """
    # Base similarity from vector comparison
    base_similarity = cosine_similarity(vec1, vec2)
    
    # If no query terms provided, return base similarity
    if not query_terms:
        return base_similarity
    
    # Calculate keyword match bonus
    keyword_bonus = 0.0
    text2_lower = text2.lower()
    
    # Check for presence of query terms in the text
    for term in query_terms:
        if term.lower() in text2_lower:
            keyword_bonus += 0.05  # Add 0.05 for each matching term
    
    # Check for list-like content which is valuable for certain queries
    list_indicators = [":\n", "- ", "• ", "* ", "\n1.", "\n2."]
    if any(indicator in text2 for indicator in list_indicators):
        keyword_bonus += 0.05
    
    # Cap the total bonus at 0.3 to avoid overwhelming the base similarity
    keyword_bonus = min(keyword_bonus, 0.3)
    
    # Combine base similarity with keyword bonus
    enhanced_score = min(base_similarity + keyword_bonus, 1.0)
    
    return enhanced_score

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

def search_documents(query_embedding: List[float], document_chunks: List[Dict[str, Any]],
                    chunk_embeddings: List[List[float]], top_k: int = 5, 
                    use_enhanced_similarity: bool = False, query: str = "", 
                    query_terms: List[str] = None) -> List[Dict[str, Any]]:
    """
    Search document chunks using vector similarity with optional enhanced scoring.
    
    Args:
        query_embedding: Query embedding vector
        document_chunks: List of document chunks
        chunk_embeddings: List of chunk embedding vectors
        top_k: Number of top results to return
        use_enhanced_similarity: Whether to use enhanced similarity scoring
        query: Original query text (needed for enhanced similarity)
        query_terms: Query terms for keyword matching
        
    Returns:
        List of top matching chunks with similarity scores
    """
    if len(document_chunks) != len(chunk_embeddings):
        raise ValueError(f"Number of chunks ({len(document_chunks)}) doesn't match number of embeddings ({len(chunk_embeddings)})")
    
    # Set default for query_terms
    if query_terms is None:
        query_terms = []
        
    # Calculate similarity scores
    similarities = []
    for i, chunk_embedding in enumerate(chunk_embeddings):
        if use_enhanced_similarity and query and i < len(document_chunks):
            # Use enhanced similarity with keyword matching and list detection
            similarity = enhanced_similarity(
                query_embedding, 
                chunk_embedding, 
                query, 
                document_chunks[i]['text'], 
                query_terms
            )
        else:
            # Use standard cosine similarity
            similarity = cosine_similarity(query_embedding, chunk_embedding)
        
        similarities.append((i, similarity))
    
    # Sort by similarity (descending)
    similarities.sort(key=lambda x: x[1], reverse=True)
    
    # Get top-k results
    top_results = []
    for i, similarity in similarities[:top_k]:
        chunk = document_chunks[i].copy()
        chunk['similarity'] = similarity
        top_results.append(chunk)
    
    return top_results

def extract_keywords(text: str, max_keywords: int = 15) -> List[str]:
    """
    Extract important keywords from text using TF-IDF like approach.
    
    Args:
        text: Input text
        max_keywords: Maximum number of keywords to extract
        
    Returns:
        List of extracted keywords
    """
    # Extended stop words list for better filtering
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
                 'be', 'been', 'being', 'in', 'on', 'at', 'to', 'for', 'with', 'by',
                 'about', 'as', 'of', 'that', 'this', 'these', 'those', 'it', 'its',
                 'what', 'when', 'where', 'who', 'how', 'which', 'there', 'here', 'have',
                 'has', 'had', 'do', 'does', 'did', 'can', 'could', 'will', 'would', 'should',
                 'may', 'might', 'must', 'than', 'then', 'they', 'them', 'their'}
    
    # Check if text is a question and extract question focus
    is_question = '?' in text
    question_focus = []
    if is_question:
        # Extract potential question focus words
        question_words = ['what', 'when', 'where', 'who', 'how', 'which', 'why']
        text_lower = text.lower()
        for qw in question_words:
            if qw in text_lower:
                # Get words after the question word
                parts = text_lower.split(qw, 1)[1].split()
                # Take a few words after the question word as potential focus
                question_focus = [w.strip('.,?!()[]{}:;"\'') for w in parts[:3] 
                                if len(w) > 3 and w not in stop_words]
    
    # Normalize text
    text_lower = text.lower()
    
    # Remove punctuation and split into words
    words = re.findall(r'\b\w+\b', text_lower)
    
    filtered_words = [word for word in words if word not in stop_words and len(word) > 2]
    
    # Count word frequencies with TF-IDF-like weighting
    word_counts = {}
    for word in filtered_words:
        # Base frequency
        base_freq = word_counts.get(word, 0) + 1
        
        # Apply weighting factors
        weight = 1.0
        
        # Longer words often carry more meaning
        if len(word) > 6:
            weight *= 1.5
        
        # Words in title case might be proper nouns or important concepts
        if word in text and word[0].isupper():
            weight *= 1.3
        
        # Words in question focus get higher weight
        if word in question_focus:
            weight *= 2.0
        
        # Words that appear in the beginning might be more important
        if word in ' '.join(filtered_words[:10]):
            weight *= 1.2
            
        # Apply weighted frequency
        word_counts[word] = base_freq * weight
    
    # Sort by weighted frequency
    sorted_words = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)
    
    # Get top keywords
    keywords = [word for word, count in sorted_words[:max_keywords]]
    
    # Always include question focus words if they exist
    for word in question_focus:
        if word not in keywords and len(word) > 2:
            keywords.append(word)
    
    return keywords

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