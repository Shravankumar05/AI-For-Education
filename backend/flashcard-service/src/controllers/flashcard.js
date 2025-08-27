"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFlashcards = void 0;
const express_1 = require("express");
const axios_1 = require("axios");
const generateFlashcards = async (req, res) => {
    const { docId } = req.params;
    if (!docId) {
        return res.status(400).json({ message: 'Document ID is required' });
    }
    try {
        // Fetch document from the main backend
        const response = await axios_1.default.get(`http://localhost:5000/api/documents/${docId}`);
        const document = response.data.document;
        if (!document || !document.textPreview) {
            return res.status(404).json({ message: 'Document or document text not found' });
        }
        const text = document.textPreview;
        // Call the LLM to generate flashcards
        const llmResponse = await axios_1.default.post('http://localhost:5000/api/generate-flashcards', {
            text: text
        });
        const flashcards = llmResponse.data.flashcards;
        res.status(200).json({ flashcards });
    }
    catch (error) {
        console.error('Error generating flashcards:', error);
        res.status(500).json({ message: 'Error generating flashcards', error: error.message });
    }
};
exports.generateFlashcards = generateFlashcards;
//# sourceMappingURL=flashcard.js.map