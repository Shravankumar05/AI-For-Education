'use client';

import { useState, useEffect, use } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  getDocument,
  searchInDocument,
  askQuestion,
  createFlashcard,
  searchDocument, 
} from '../../services/api';
import { Document, SearchResult, QAResponse } from '../../services/api';

interface Document {
  _id: string;
  name: string;
  createdAt: string;
  fileType: string;
  textPreview: string;
  hasEmbedding: boolean;
}

interface SearchResult {
  text: string;
  similarity: number;
  highlighted_text?: string;
  header?: string;
  relevance_score?: number;
  rank?: number;
  preview?: string;
}

interface QAResponse {
  success: boolean;
  answer: string;
  sources?: any[];
  context?: SearchResult[];
  document_name?: string;
  model_used?: string;
  message?: string;
}

const DocumentDetailPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const documentId = params.id as string;
  const activeTab = searchParams.get('tab') || 'overview';

  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Q&A state
  const [question, setQuestion] = useState<string>('');
  const [qaResponse, setQaResponse] = useState<QAResponse | null>(null);
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [qaError, setQaError] = useState<string | null>(null);
  const [isSavingFlashcard, setIsSavingFlashcard] = useState(false);
  const [saveFlashcardSuccess, setSaveFlashcardSuccess] = useState(false);
  const [saveFlashcardError, setSaveFlashcardError] = useState<string | null>(null);

  // Fetch document details
  useEffect(() => {
    if (documentId) {
      fetchDocument();
    }
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await getDocument(documentId);
      setDocument(data.document);
    } catch (err) {
      console.error('Error fetching document:', err);
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      setSearchError(null);
      setSearchResults([]);

      const data = await searchDocument(documentId, searchQuery);
      setSearchResults(data.results || []);
      
      if (!data.success) {
        setSearchError(data.message || 'Search failed');
      }
    } catch (err) {
      console.error('Error searching document:', err);
      setSearchError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    try {
      setIsAsking(true);
      setQaError(null);
      setQaResponse(null);

      const response = await askQuestion(documentId, question);
      setQaResponse(response);
      
      if (!response.success) {
        setQaError(response.message || 'Failed to get answer');
      }
    } catch (err) {
      console.error('Error asking question:', err);
      setQaError(err instanceof Error ? err.message : 'Q&A failed');
    } finally {
      setIsAsking(false);
    }
  };

  const handleSaveFlashcard = async () => {
    if (!qaResponse || !documentId) return;

    setIsSavingFlashcard(true);
    setSaveFlashcardSuccess(false);
    setSaveFlashcardError(null);

    try {
      await createFlashcard({
        documentId,
        question,
        answer: qaResponse.answer,
      });
      setSaveFlashcardSuccess(true);
      setTimeout(() => setSaveFlashcardSuccess(false), 3000); // Hide after 3s
    } catch (error) {
      console.error('Failed to save flashcard:', error);
      setSaveFlashcardError('Failed to save flashcard. Please try again.');
    } finally {
      setIsSavingFlashcard(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 text-red-700 p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Error</h2>
            <p>{error || 'Document not found'}</p>
            <Link href="/" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
              ← Back to Documents
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div>
            <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
              ← Back to Documents
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{document.name}</h1>
            <p className="text-sm text-gray-500">
              Uploaded {new Date(document.createdAt).toLocaleDateString()} • {document.fileType.toUpperCase()}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <Link
              href={`/document/${documentId}`}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </Link>
            <Link
              href={`/document/${documentId}?tab=search`}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'search'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Search
            </Link>
            <Link
              href={`/document/${documentId}?tab=qa`}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'qa'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Q&A
            </Link>
            <Link
              href={`/document/${documentId}/flashcards`}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'flashcards'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Flashcards
            </Link>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Document Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">File Information</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-gray-500">Name:</dt>
                    <dd className="text-sm font-medium">{document.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Type:</dt>
                    <dd className="text-sm font-medium">{document.fileType.toUpperCase()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Uploaded:</dt>
                    <dd className="text-sm font-medium">
                      {new Date(document.createdAt).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Processing Status:</dt>
                    <dd className="text-sm font-medium">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        document.hasEmbedding 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {document.hasEmbedding ? 'Processed' : 'Processing'}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Content Preview</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {document.textPreview}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Search Document</h2>
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                    Search Query
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      id="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter your search terms..."
                      className="flex-1 min-w-0 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      disabled={isSearching}
                    />
                    <button
                      type="submit"
                      disabled={isSearching || !searchQuery.trim()}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSearching ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Searching...
                        </>
                      ) : (
                        'Search'
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {searchError && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
                  {searchError}
                </div>
              )}
            </div>

            {/* Search Results */}
            {searchResults && searchResults.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Search Results ({searchResults.length})
                </h3>
                <div className="space-y-4">
                  {searchResults.map((result, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-blue-600">
                            #{result.rank || index + 1}
                          </span>
                          {result.header && (
                            <span className="text-sm text-gray-500">
                              Section: {result.header}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-green-600">
                          {result.relevance_score || Math.round((result.similarity || 0) * 100)}% relevance
                        </span>
                      </div>
                      <div 
                        className="text-sm text-gray-700"
                        dangerouslySetInnerHTML={{
                          __html: result.highlighted_text || result.text
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'qa' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Ask a Question</h2>
              <form onSubmit={handleAskQuestion} className="space-y-4">
                <div>
                  <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Question
                  </label>
                  <div className="space-y-2">
                    <textarea
                      id="question"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Ask any question about this document..."
                      rows={3}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      disabled={isAsking}
                    />
                    <button
                      type="submit"
                      disabled={isAsking || !question.trim()}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAsking ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Thinking...
                        </>
                      ) : (
                        'Ask'
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {qaError && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
                  {qaError}
                </div>
              )}
            </div>

            {/* Q&A Response */}
            {qaResponse && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Answer</h3>
                <div className="space-y-4">
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700">
                      {qaResponse.answer}
                    </div>
                  </div>
                  <button
                    onClick={handleSaveFlashcard}
                    disabled={isSavingFlashcard}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isSavingFlashcard ? 'Saving...' : 'Save as Flashcard'}
                  </button>
                  {saveFlashcardSuccess && (
                    <div className="mt-2 text-sm text-green-600">
                      Flashcard saved successfully!
                    </div>
                  )}
                  {saveFlashcardError && (
                    <div className="mt-2 text-sm text-red-600">
                      {saveFlashcardError}
                    </div>
                  )}
                  
                  {qaResponse.context && qaResponse.context.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-700 mb-2">Relevant Context:</h4>
                      <div className="space-y-2">
                        {qaResponse.context.slice(0, 3).map((context, index) => (
                          <div key={index} className="text-sm bg-gray-50 p-3 rounded">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-500">
                                Relevance: {context.relevance_score || Math.round((context.similarity || 0) * 100)}%
                              </span>
                            </div>
                            <div className="text-gray-700">
                              {context.preview || context.text.substring(0, 200)}...
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {qaResponse.model_used && (
                    <div className="text-xs text-gray-500 border-t pt-2">
                      Generated using: {qaResponse.model_used}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default DocumentDetailPage;