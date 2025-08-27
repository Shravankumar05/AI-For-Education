"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewFlashcard = exports.getFlashcardsByDocId = exports.generateFlashcards = void 0;
const axios_1 = __importDefault(require("axios"));
const flashcard_1 = __importDefault(require("../models/flashcard"));
// A simple function to extract keywords from text
const extractKeywords = (text) => {
    const stopWords = new Set([
        'a', 'an', 'the', 'is', 'are', 'in', 'on', 'at', 'and', 'or', 'for', 'to', 'of',
        'with', 'by', 'as', 'from', 'about', 'into', 'through', 'over', 'after', 'before',
        'up', 'down', 'out', 'off', 'under', 'above', 'between', 'among', 'but', 'however',
        'so', 'then', 'thus', 'therefore', 'while', 'although', 'because', 'since',
        'if', 'unless', 'until', 'when', 'where', 'why', 'how', 'what', 'which', 'who',
        'whom', 'whose', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
        'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our',
        'their', 'mine', 'yours', 'hers', 'ours', 'theirs', 'myself', 'yourself',
        'himself', 'herself', 'itself', 'ourselves', 'yourselves', 'themselves'
    ]);
    const words = text
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .split(/\s+/);
    const wordFrequencies = {};
    for (const word of words) {
        if (!stopWords.has(word) && word.length > 4) {
            wordFrequencies[word] = (wordFrequencies[word] || 0) + 1;
        }
    }
    // Sort words by frequency and take the top 10
    const sortedKeywords = Object.keys(wordFrequencies).sort((a, b) => wordFrequencies[b] - wordFrequencies[a]);
    return sortedKeywords.slice(0, 10);
};
    const { docId } = req.params;
    const { docId } = req.body;
        const text = response.data.text;
        if (!text) {
            return res.status(404).json({ message: 'Document or document text not found' });
        }
        const llmResponse = yield axios_1.default.post('http://localhost:5000/api/generate-flashcards', {
            text: text
        });
        res.status(200).json({ flashcards });
    }
    catch (error) {
        console.error('Error generating flashcards:', error);
        res.status(500).json({ message: 'Error generating flashcards', error: error.message });
    }
});
exports.generateFlashcards = generateFlashcards;
const getFlashcardsByDocId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { docId } = req.params;
    try {
        const flashcards = yield flashcard_1.default.find({ docId });
        res.status(200).json(flashcards);
    }
    catch (error) { // Explicitly type error
        res.status(500).json({ message: 'Error fetching flashcards', error: error.message });
    }
});
exports.getFlashcardsByDocId = getFlashcardsByDocId;
const reviewFlashcard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { grade } = req.body; // grade: 0-5
    try {
        const flashcard = yield flashcard_1.default.findById(id);
        if (!flashcard) {
            return res.status(404).json({ message: 'Flashcard not found' });
        }
        // SM-2 algorithm implementation
        let { ease, interval } = flashcard;
        if (grade >= 3) {
            if (interval === 1) {
                interval = 6;
            }
            else {
                interval = Math.round(interval * ease);
            }
            ease = ease + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02);
        }
        else {
            interval = 1;
        }
        if (ease < 1.3)
            ease = 1.3;
        flashcard.ease = ease;
        flashcard.interval = interval;
        yield flashcard.save();
        res.status(200).json(flashcard);
    }
    catch (error) { // Explicitly type error
        res.status(500).json({ message: 'Error reviewing flashcard', error: error.message });
    }
});
exports.reviewFlashcard = reviewFlashcard;
