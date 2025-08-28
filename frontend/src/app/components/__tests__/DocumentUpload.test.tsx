import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DocumentUpload from '../DocumentUpload'

// Mock the API module
jest.mock('../../services/api', () => ({
  uploadDocument: jest.fn().mockResolvedValue({
    success: true,
    document: {
      _id: 'new-doc-id',
      title: 'Uploaded Document',
      uploadDate: new Date().toISOString(),
      size: 1024,
    },
  }),
}))

describe('DocumentUpload Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders upload form correctly', () => {
    render(<DocumentUpload />)
    
    expect(screen.getByText(/upload document/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/choose file/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument()
  })

  test('handles file selection', async () => {
    const user = userEvent.setup()
    render(<DocumentUpload />)
    
    const fileInput = screen.getByLabelText(/choose file/i) as HTMLInputElement
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    
    await user.upload(fileInput, file)
    
    expect(fileInput.files![0]).toBe(file)
    expect(fileInput.files).toHaveLength(1)
  })

  test('validates file type', async () => {
    const user = userEvent.setup()
    render(<DocumentUpload />)
    
    const fileInput = screen.getByLabelText(/choose file/i) as HTMLInputElement
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    
    await user.upload(fileInput, invalidFile)
    
    // Should show validation error for unsupported file type
    await waitFor(() => {
      expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument()
    })
  })

  test('handles upload submission', async () => {
    const user = userEvent.setup()
    render(<DocumentUpload />)
    
    const fileInput = screen.getByLabelText(/choose file/i) as HTMLInputElement
    const uploadButton = screen.getByRole('button', { name: /upload/i })
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    
    await user.upload(fileInput, file)
    await user.click(uploadButton)
    
    // Verify upload request was made
    await waitFor(() => {
      expect(screen.getByText(/uploading/i)).toBeInTheDocument()
    })
  })

  test('displays upload progress', async () => {
    const user = userEvent.setup()
    render(<DocumentUpload />)
    
    const fileInput = screen.getByLabelText(/choose file/i) as HTMLInputElement
    const uploadButton = screen.getByRole('button', { name: /upload/i })
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    
    await user.upload(fileInput, file)
    await user.click(uploadButton)
    
    // Check for progress indicator
    await waitFor(() => {
      const progressElement = screen.queryByRole('progressbar')
      if (progressElement) {
        expect(progressElement).toBeInTheDocument()
      } else {
        // Alternative: check for progress text
        expect(screen.getByText(/uploading/i)).toBeInTheDocument()
      }
    })
  })
})