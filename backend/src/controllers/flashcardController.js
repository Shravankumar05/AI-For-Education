const Flashcard = require('../models/flashcard');

// @desc    Get all flashcards for a document
// @route   GET /api/flashcards/:documentId
// @access  Public
const getFlashcards = async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ documentId: req.params.documentId });
    res.json(flashcards);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Create a flashcard
// @route   POST /api/flashcards
// @access  Public
const createFlashcard = async (req, res) => {
  const { documentId, question, answer } = req.body;

  try {
    const newFlashcard = new Flashcard({
      documentId,
      question,
      answer,
    });

    const flashcard = await newFlashcard.save();
    res.json(flashcard);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Update a flashcard
// @route   PUT /api/flashcards/:id
// @access  Public
const updateFlashcard = async (req, res) => {
  const { question, answer } = req.body;

  try {
    let flashcard = await Flashcard.findById(req.params.id);

    if (!flashcard) {
      return res.status(404).json({ msg: 'Flashcard not found' });
    }

    flashcard.question = question;
    flashcard.answer = answer;

    await flashcard.save();

    res.json(flashcard);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Delete a flashcard
// @route   DELETE /api/flashcards/:id
// @access  Public
const deleteFlashcard = async (req, res) => {
  try {
    let flashcard = await Flashcard.findById(req.params.id);

    if (!flashcard) {
      return res.status(404).json({ msg: 'Flashcard not found' });
    }

    await flashcard.remove();

    res.json({ msg: 'Flashcard removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

module.exports = {
  getFlashcards,
  createFlashcard,
  updateFlashcard,
  deleteFlashcard,
};