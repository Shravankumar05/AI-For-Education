// Mock embeddings generation since we don't have Ollama installed
// import { Ollama } from 'ollama';
import * as fs from 'fs';
import * as path from 'path';
import * as pdf from 'pdf-parse';

const ollama = new Ollama();

/**
 * Process text content and generate embeddings using nomic-embed-text
 */
export const generateEmbeddings = async (text: string): Promise<number[]> => {
  try {
    // Using nomic-embed-text model through Ollama
    const response = await ollama.embeddings({
      model: 'nomic-embed-text',
      prompt: text,
    });
    
    return response.embedding;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw new Error('Failed to generate embeddings');
  }
};

/**
 * Extract text content from a PDF file
 */
export const extractTextFromPDF = async (filePath: string): Promise<string> => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

/**
 * Process uploaded file and extract its content based on file type
 */
export const processFile = async (filePath: string): Promise<string> => {
  const fileExtension = path.extname(filePath).toLowerCase();
  
  switch (fileExtension) {
    case '.pdf':
      return await extractTextFromPDF(filePath);
    case '.txt':
      return fs.readFileSync(filePath, 'utf-8');
    default:
      throw new Error(`Unsupported file type: ${fileExtension}`);
  }
};