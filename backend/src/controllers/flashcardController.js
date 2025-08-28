const mongoose = require('mongoose');
const Flashcard = require('../models/flashcard');

// @desc    Get all flashcards for a document
// @route   GET /api/flashcards/:documentId
// @access  Public
const getFlashcards = async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ documentId: req.params.documentId }).sort({ createdAt: -1 });
    res.json({ success: true, flashcards });
  } catch (err) {
    console.error('Error getting flashcards:', err.message);
    res.status(500).json({ success: false, error: 'Server Error', message: err.message });
  }
};

// @desc    Create a flashcard
// @route   POST /api/flashcards
// @access  Public
const createFlashcard = async (req, res) => {
  const { documentId, question, answer } = req.body;

  if (!documentId || !question || !answer) {
    return res.status(400).json({ success: false, error: 'documentId, question, and answer are required' });
  }

  try {
    const newFlashcard = new Flashcard({
      documentId: new mongoose.Types.ObjectId(documentId),
      question: question.trim(),
      answer: answer.trim(),
    });

    const flashcard = await newFlashcard.save();
    res.status(201).json({ success: true, flashcard });
  } catch (err) {
    console.error('Error creating flashcard:', err.message);
    res.status(500).json({ success: false, error: 'Server Error', message: err.message });
  }
};

// @desc    Update a flashcard
// @route   PUT /api/flashcards/:id
// @access  Public
const updateFlashcard = async (req, res) => {
  const { question, answer } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ success: false, error: 'question and answer are required' });
  }

  try {
    const flashcard = await Flashcard.findByIdAndUpdate(
      req.params.id,
      {
        question: question.trim(),
        answer: answer.trim(),
      },
      { new: true, runValidators: true }
    );

    if (!flashcard) {
      return res.status(404).json({ success: false, error: 'Flashcard not found' });
    }

    res.json({ success: true, flashcard });
  } catch (err) {
    console.error('Error updating flashcard:', err.message);
    res.status(500).json({ success: false, error: 'Server Error', message: err.message });
  }
};

// @desc    Delete a flashcard
// @route   DELETE /api/flashcards/:id
// @access  Public
const deleteFlashcard = async (req, res) => {
  try {
    const flashcard = await Flashcard.findByIdAndDelete(req.params.id);

    if (!flashcard) {
      return res.status(404).json({ success: false, error: 'Flashcard not found' });
    }

    res.json({ success: true, message: 'Flashcard removed' });
  } catch (err) {
    console.error('Error deleting flashcard:', err.message);
    res.status(500).json({ success: false, error: 'Server Error', message: err.message });
  }
};

// @desc    Get flashcards for review mode
// @route   GET /api/flashcards/:documentId/review
// @access  Public
const getFlashcardsForReview = async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ documentId: req.params.documentId })
      .select('question answer _id')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, flashcards, count: flashcards.length });
  } catch (err) {
    console.error('Error getting flashcards for review:', err.message);
    res.status(500).json({ success: false, error: 'Server Error', message: err.message });
  }
};

// @desc    Export flashcards as CSV
// @route   GET /api/flashcards/:documentId/export
// @access  Public
const exportFlashcardsCSV = async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ documentId: req.params.documentId })
      .select('question answer')
      .sort({ createdAt: -1 });
    
    // Create CSV content
    const csvHeader = 'Question,Answer\n';
    const csvContent = flashcards.map(f => 
      `"${f.question.replace(/"/g, '""')}","${f.answer.replace(/"/g, '""')}"`
    ).join('\n');
    
    const csv = csvHeader + csvContent;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="flashcards.csv"');
    res.send(csv);
  } catch (err) {
    console.error('Error exporting flashcards:', err.message);
    res.status(500).json({ success: false, error: 'Server Error', message: err.message });
  }
};

module.exports = {
  getFlashcards,
  createFlashcard,
  updateFlashcard,
  deleteFlashcard,
  getFlashcardsForReview,
  exportFlashcardsCSV,
};