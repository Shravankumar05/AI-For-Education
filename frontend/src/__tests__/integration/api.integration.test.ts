import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

describe('API Integration Tests', () => {
  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  test('should handle document upload API', async () => {
    // Mock the API response
    server.use(
      http.post('/api/documents/upload', () => {
        return HttpResponse.json({
          success: true,
          document: {
            _id: 'test-upload-id',
            title: 'Integration Test Document',
            uploadDate: new Date().toISOString(),
            size: 1024,
          },
        })
      })
    )

    // Simulate API call
    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: new FormData(),
    })
    
    const data = await response.json()
    
    expect(data.success).toBe(true)
    expect(data.document.title).toBe('Integration Test Document')
  })

  test('should handle search API', async () => {
    const searchQuery = { query: 'test search' }
    
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchQuery),
    })
    
    const data = await response.json()
    
    expect(data.success).toBe(true)
    expect(data.results).toHaveLength(2)
    expect(data.results[0].text).toContain('test search')
  })

  test('should handle flashcard creation', async () => {
    const flashcard = {
      documentId: 'test-doc-id',
      question: 'Integration test question',
      answer: 'Integration test answer',
    }
    
    const response = await fetch('/api/flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flashcard),
    })
    
    const data = await response.json()
    
    expect(data.success).toBe(true)
    expect(data.flashcard.question).toBe('Integration test question')
    expect(data.flashcard._id).toBe('new-flashcard-id')
  })

  test('should handle Q&A API', async () => {
    const question = { question: 'What is the meaning of life?' }
    
    const response = await fetch('/api/qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    })
    
    const data = await response.json()
    
    expect(data.success).toBe(true)
    expect(data.answer).toContain('What is the meaning of life?')
    expect(data.sources).toHaveLength(2)
  })
})