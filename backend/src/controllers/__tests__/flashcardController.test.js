const request = require('supertest')
const express = require('express')
const mongoose = require('mongoose')
const Flashcard = require('../models/flashcard')
const { 
  getFlashcards, 
  createFlashcard, 
  updateFlashcard, 
  deleteFlashcard 
} = require('../controllers/flashcardController')

const app = express()
app.use(express.json())

// Setup routes for testing
app.get('/api/flashcards/:documentId', getFlashcards)
app.post('/api/flashcards', createFlashcard)
app.put('/api/flashcards/:id', updateFlashcard)
app.delete('/api/flashcards/:id', deleteFlashcard)

describe('Flashcard Controller', () => {
  const mockDocumentId = new mongoose.Types.ObjectId()
  let flashcardId

  beforeEach(async () => {
    // Create test flashcard
    const flashcard = new Flashcard({
      documentId: mockDocumentId,
      question: 'Test Question',
      answer: 'Test Answer'
    })
    const saved = await flashcard.save()
    flashcardId = saved._id.toString()
  })

  describe('GET /api/flashcards/:documentId', () => {
    test('should return flashcards for document', async () => {
      const response = await request(app)
        .get(`/api/flashcards/${mockDocumentId}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.flashcards).toHaveLength(1)
      expect(response.body.flashcards[0].question).toBe('Test Question')
    })

    test('should return empty array for non-existent document', async () => {
      const nonExistentId = new mongoose.Types.ObjectId()
      const response = await request(app)
        .get(`/api/flashcards/${nonExistentId}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.flashcards).toHaveLength(0)
    })
  })

  describe('POST /api/flashcards', () => {
    test('should create new flashcard', async () => {
      const newFlashcard = {
        documentId: mockDocumentId.toString(),
        question: 'New Question',
        answer: 'New Answer'
      }

      const response = await request(app)
        .post('/api/flashcards')
        .send(newFlashcard)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.flashcard.question).toBe('New Question')
      expect(response.body.flashcard.answer).toBe('New Answer')
    })

    test('should validate required fields', async () => {
      const incompleteFlashcard = {
        documentId: mockDocumentId.toString(),
        question: 'Question without answer'
      }

      const response = await request(app)
        .post('/api/flashcards')
        .send(incompleteFlashcard)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('required')
    })
  })

  describe('PUT /api/flashcards/:id', () => {
    test('should update existing flashcard', async () => {
      const updates = {
        question: 'Updated Question',
        answer: 'Updated Answer'
      }

      const response = await request(app)
        .put(`/api/flashcards/${flashcardId}`)
        .send(updates)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.flashcard.question).toBe('Updated Question')
    })

    test('should return 404 for non-existent flashcard', async () => {
      const nonExistentId = new mongoose.Types.ObjectId()
      const updates = {
        question: 'Updated Question',
        answer: 'Updated Answer'
      }

      const response = await request(app)
        .put(`/api/flashcards/${nonExistentId}`)
        .send(updates)
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })

  describe('DELETE /api/flashcards/:id', () => {
    test('should delete flashcard', async () => {
      const response = await request(app)
        .delete(`/api/flashcards/${flashcardId}`)
        .expect(200)

      expect(response.body.success).toBe(true)

      // Verify flashcard is deleted
      const deletedFlashcard = await Flashcard.findById(flashcardId)
      expect(deletedFlashcard).toBeNull()
    })

    test('should return 404 for non-existent flashcard', async () => {
      const nonExistentId = new mongoose.Types.ObjectId()

      const response = await request(app)
        .delete(`/api/flashcards/${nonExistentId}`)
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })
})