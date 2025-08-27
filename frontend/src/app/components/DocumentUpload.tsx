'use client';

import { useState } from 'react';
import { uploadDocument } from '../services/api';

interface UploadStatus {
  isUploading: boolean;
  success: boolean;
  error: string | null;
}

const DocumentUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    isUploading: false,
    success: false,
    error: null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    
    // Reset status when a new file is selected
    setUploadStatus({
      isUploading: false,
      success: false,
      error: null,
    });
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus({
        isUploading: false,
        success: false,
        error: 'Please select a file to upload',
      });
      return;
    }

    // Check file type (only PDF and TXT allowed)
    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (fileType !== 'pdf' && fileType !== 'txt') {
      setUploadStatus({
        isUploading: false,
        success: false,
        error: 'Only PDF and TXT files are allowed',
      });
      return;
    }

    try {
      setUploadStatus({
        isUploading: true,
        success: false,
        error: null,
      });

      await uploadDocument(file);
      
      setUploadStatus({
        isUploading: false,
        success: true,
        error: null,
      });

      // Reset file input after successful upload
      setFile(null);
      
      // Trigger any callback to refresh document list
      if (typeof window !== 'undefined') {
        // Custom event to notify parent components
        window.dispatchEvent(new Event('documentUploaded'));
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setUploadStatus({
        isUploading: false,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload document',
      });
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select a document (PDF or TXT)
        </label>
        <input
          type="file"
          accept=".pdf,.txt"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {file && (
        <div className="mb-4 text-sm">
          <p>Selected file: <span className="font-medium">{file.name}</span></p>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploadStatus.isUploading}
        className={`w-full py-2 px-4 rounded-md text-white font-medium
          ${!file || uploadStatus.isUploading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'}
          transition-colors duration-200`}
      >
        {uploadStatus.isUploading ? 'Uploading...' : 'Upload Document'}
      </button>

      {uploadStatus.error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {uploadStatus.error}
        </div>
      )}

      {uploadStatus.success && (
        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
          Document uploaded successfully!
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;