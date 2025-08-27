"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const flashcard_1 = require("../controllers/flashcard");
const router = (0, express_1.Router)();
router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});
router.post('/generate', flashcard_1.generateFlashcards);
router.get('/:docId', flashcard_1.getFlashcardsByDocId);
router.post('/:id/review', flashcard_1.reviewFlashcard);
exports.default = router;
