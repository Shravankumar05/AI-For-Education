const express = require('express');
const router = express.Router();
const {
  getFlashcards,
  createFlashcard,
  updateFlashcard,
  deleteFlashcard,
} = require('../controllers/flashcardController');

router.route('/:documentId').get(getFlashcards);
router.route('/').post(createFlashcard);
router.route('/:id').put(updateFlashcard).delete(deleteFlashcard);

module.exports = router;