import { http, HttpResponse } from 'msw'

export const handlers = [
  // Document endpoints
  http.get('/api/documents', () => {
    return HttpResponse.json({
      success: true,
      documents: [
        {
          _id: '1',
          title: 'Test Document 1',
          uploadDate: new Date().toISOString(),
          size: 1024,
        },
        {
          _id: '2',
          title: 'Test Document 2',
          uploadDate: new Date().toISOString(),
          size: 2048,
        },
      ],
    })
  }),

  http.post('/api/documents/upload', () => {
    return HttpResponse.json({
      success: true,
      document: {
        _id: 'new-doc-id',
        title: 'Uploaded Document',
        uploadDate: new Date().toISOString(),
        size: 1024,
      },
    })
  }),

  http.get('/api/documents/:id', ({ params }) => {
    return HttpResponse.json({
      success: true,
      document: {
        _id: params.id,
        title: `Document ${params.id}`,
        content: 'Sample document content',
        uploadDate: new Date().toISOString(),
        size: 1024,
      },
    })
  }),

  // Search endpoints
  http.post('/api/search', async ({ request }) => {
    const { query } = await request.json()
    return HttpResponse.json({
      success: true,
      results: [
        {
          text: `Search result for: ${query}`,
          score: 0.95,
          chunk_id: 1,
        },
        {
          text: `Another result for: ${query}`,
          score: 0.87,
          chunk_id: 2,
        },
      ],
    })
  }),

  // Q&A endpoints
  http.post('/api/qa', async ({ request }) => {
    const { question } = await request.json()
    return HttpResponse.json({
      success: true,
      answer: `AI generated answer for: ${question}`,
      sources: [
        { text: 'Source 1', score: 0.9 },
        { text: 'Source 2', score: 0.8 },
      ],
    })
  }),

  // Flashcard endpoints
  http.get('/api/flashcards/:documentId', ({ params }) => {
    return HttpResponse.json({
      success: true,
      flashcards: [
        {
          _id: 'flash1',
          question: 'What is AI?',
          answer: 'Artificial Intelligence',
          documentId: params.documentId,
          createdAt: new Date().toISOString(),
        },
        {
          _id: 'flash2',
          question: 'What is ML?',
          answer: 'Machine Learning',
          documentId: params.documentId,
          createdAt: new Date().toISOString(),
        },
      ],
    })
  }),

  http.post('/api/flashcards', async ({ request }) => {
    const flashcard = await request.json()
    return HttpResponse.json({
      success: true,
      flashcard: {
        _id: 'new-flashcard-id',
        ...flashcard,
        createdAt: new Date().toISOString(),
      },
    })
  }),

  http.put('/api/flashcards/:id', async ({ params, request }) => {
    const updates = await request.json()
    return HttpResponse.json({
      success: true,
      flashcard: {
        _id: params.id,
        ...updates,
        updatedAt: new Date().toISOString(),
      },
    })
  }),

  http.delete('/api/flashcards/:id', ({ params }) => {
    return HttpResponse.json({
      success: true,
      message: 'Flashcard deleted',
    })
  }),

  http.get('/api/flashcards/:documentId/export', ({ params }) => {
    const csvContent = 'Question,Answer\n"What is AI?","Artificial Intelligence"\n"What is ML?","Machine Learning"'
    return new HttpResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="flashcards-${params.documentId}.csv"`,
      },
    })
  }),
]