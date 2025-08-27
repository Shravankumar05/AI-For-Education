"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processFile = exports.extractTextFromPDF = exports.generateEmbeddings = void 0;
// Mock embeddings generation since we don't have Ollama installed
// import { Ollama } from 'ollama';
const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");
const ollama = new Ollama();
/**
 * Process text content and generate embeddings using nomic-embed-text
 */
const generateEmbeddings = async (text) => {
    try {
        // Using nomic-embed-text model through Ollama
        const response = await ollama.embeddings({
            model: 'nomic-embed-text',
            prompt: text,
        });
        return response.embedding;
    }
    catch (error) {
        console.error('Error generating embeddings:', error);
        throw new Error('Failed to generate embeddings');
    }
};
exports.generateEmbeddings = generateEmbeddings;
/**
 * Extract text content from a PDF file
 */
const extractTextFromPDF = async (filePath) => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        return data.text;
    }
    catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error('Failed to extract text from PDF');
    }
};
exports.extractTextFromPDF = extractTextFromPDF;
/**
 * Process uploaded file and extract its content based on file type
 */
const processFile = async (filePath) => {
    const fileExtension = path.extname(filePath).toLowerCase();
    switch (fileExtension) {
        case '.pdf':
            return await (0, exports.extractTextFromPDF)(filePath);
        case '.txt':
            return fs.readFileSync(filePath, 'utf-8');
        default:
            throw new Error(`Unsupported file type: ${fileExtension}`);
    }
};
exports.processFile = processFile;
//# sourceMappingURL=embeddings.js.map