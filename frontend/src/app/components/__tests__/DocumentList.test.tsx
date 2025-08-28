import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DocumentList from '../DocumentList'

// Mock the API module
jest.mock('../../services/api', () => ({
  getDocuments: jest.fn().mockResolvedValue({
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
  }),
}))

describe('DocumentList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders document list correctly', async () => {
    render(<DocumentList />)
    
    // Wait for documents to load
    await waitFor(() => {
      expect(screen.getByText('Test Document 1')).toBeInTheDocument()
      expect(screen.getByText('Test Document 2')).toBeInTheDocument()
    })
  })

  test('displays loading state initially', () => {
    render(<DocumentList />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  test('handles document click navigation', async () => {
    const user = userEvent.setup()
    render(<DocumentList />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Document 1')).toBeInTheDocument()
    })

    const documentLinks = screen.getAllByRole('link')
    expect(documentLinks.length).toBeGreaterThan(0)
  })

  test('displays error state when API fails', async () => {
    const { getDocuments } = require('../../services/api')
    getDocuments.mockRejectedValueOnce(new Error('API Error'))

    render(<DocumentList />)
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })

  test('shows empty state when no documents', async () => {
    const { getDocuments } = require('../../services/api')
    getDocuments.mockResolvedValueOnce({
      success: true,
      documents: [],
    })

    render(<DocumentList />)
    
    await waitFor(() => {
      expect(screen.getByText(/no documents found/i)).toBeInTheDocument()
    })
  })
})