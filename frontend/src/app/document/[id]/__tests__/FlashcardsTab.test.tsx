import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FlashcardsTab from '../FlashcardsTab'

// Mock the API module
jest.mock('../../services/api', () => ({
  getFlashcards: jest.fn().mockResolvedValue({
    success: true,
    flashcards: [
      {
        _id: 'flash1',
        question: 'What is AI?',
        answer: 'Artificial Intelligence',
        documentId: 'test-doc-id',
        createdAt: new Date().toISOString(),
      },
      {
        _id: 'flash2',
        question: 'What is ML?',
        answer: 'Machine Learning',
        documentId: 'test-doc-id',
        createdAt: new Date().toISOString(),
      },
    ],
  }),
  createFlashcard: jest.fn().mockResolvedValue({
    success: true,
    flashcard: {
      _id: 'new-flash-id',
      question: 'What is Deep Learning?',
      answer: 'A subset of machine learning',
      documentId: 'test-doc-id',
      createdAt: new Date().toISOString(),
    },
  }),
  updateFlashcard: jest.fn(),
  deleteFlashcard: jest.fn(),
  exportFlashcardsCSV: jest.fn(),
}))

describe('FlashcardsTab Component', () => {
  const mockDocumentId = 'test-doc-id'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders flashcards list correctly', async () => {
    render(<FlashcardsTab documentId={mockDocumentId} />)
    
    await waitFor(() => {
      expect(screen.getByText('What is AI?')).toBeInTheDocument()
      expect(screen.getByText('What is ML?')).toBeInTheDocument()
    })
  })

  test('enters review mode correctly', async () => {
    const user = userEvent.setup()
    render(<FlashcardsTab documentId={mockDocumentId} />)
    
    await waitFor(() => {
      expect(screen.getByText('What is AI?')).toBeInTheDocument()
    })

    const reviewButton = screen.getByRole('button', { name: /review mode/i })
    await user.click(reviewButton)
    
    expect(screen.getByText('Review Mode')).toBeInTheDocument()
    expect(screen.getByText('Card 1 of 2')).toBeInTheDocument()
  })

  test('flips flashcard in review mode', async () => {
    const user = userEvent.setup()
    render(<FlashcardsTab documentId={mockDocumentId} />)
    
    // Enter review mode
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /review mode/i })).toBeInTheDocument()
    })
    
    const reviewButton = screen.getByRole('button', { name: /review mode/i })
    await user.click(reviewButton)
    
    // Wait for review mode to load
    await waitFor(() => {
      expect(screen.getByText('What is AI?')).toBeInTheDocument()
    })
    
    // Click to flip card (find the flashcard container)
    const flashcardContainer = screen.getByText('What is AI?').closest('div')
    if (flashcardContainer) {
      await user.click(flashcardContainer)
      
      await waitFor(() => {
        expect(screen.getByText('Artificial Intelligence')).toBeInTheDocument()
      })
    }
  })

  test('navigates between flashcards', async () => {
    const user = userEvent.setup()
    render(<FlashcardsTab documentId={mockDocumentId} />)
    
    // Enter review mode
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /review mode/i })).toBeInTheDocument()
    })
    
    const reviewButton = screen.getByRole('button', { name: /review mode/i })
    await user.click(reviewButton)
    
    // Wait for review mode
    await waitFor(() => {
      expect(screen.getByText('Card 1 of 2')).toBeInTheDocument()
    })
    
    // Navigate to next card
    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)
    
    await waitFor(() => {
      expect(screen.getByText('Card 2 of 2')).toBeInTheDocument()
    })
  })

  test('creates new flashcard', async () => {
    const user = userEvent.setup()
    render(<FlashcardsTab documentId={mockDocumentId} />)
    
    await waitFor(() => {
      expect(screen.getByText('What is AI?')).toBeInTheDocument()
    })

    // Find and fill the form inputs
    const questionInput = screen.getByPlaceholderText(/question/i) || screen.getByLabelText(/question/i)
    const answerInput = screen.getByPlaceholderText(/answer/i) || screen.getByLabelText(/answer/i)
    const createButton = screen.getByRole('button', { name: /create/i })
    
    await user.type(questionInput, 'What is Deep Learning?')
    await user.type(answerInput, 'A subset of machine learning')
    await user.click(createButton)
    
    // Verify API call was made
    const { createFlashcard } = require('../../services/api')
    expect(createFlashcard).toHaveBeenCalledWith({
      documentId: mockDocumentId,
      question: 'What is Deep Learning?',
      answer: 'A subset of machine learning',
    })
  })

  test('exports flashcards as CSV', async () => {
    const user = userEvent.setup()
    render(<FlashcardsTab documentId={mockDocumentId} />)
    
    await waitFor(() => {
      expect(screen.getByText('What is AI?')).toBeInTheDocument()
    })

    const exportButton = screen.getByRole('button', { name: /export/i })
    await user.click(exportButton)
    
    // Verify export function was called
    const { exportFlashcardsCSV } = require('../../services/api')
    expect(exportFlashcardsCSV).toHaveBeenCalledWith(mockDocumentId)
  })
})