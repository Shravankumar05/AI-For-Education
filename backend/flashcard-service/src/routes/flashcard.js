"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const flashcard_1 = require("../controllers/flashcard");
const router = (0, express_1.Router)();
router.get('/:docId', flashcard_1.generateFlashcards);
exports.default = router;
//# sourceMappingURL=flashcard.js.map