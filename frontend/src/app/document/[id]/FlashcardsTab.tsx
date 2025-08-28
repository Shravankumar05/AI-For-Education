'use client';

import React, { useEffect, useState } from 'react';
import { getFlashcards, createFlashcard, deleteFlashcard, updateFlashcard, exportFlashcardsCSV } from '../../services/api';

interface Flashcard {
  _id: string;
  question: string;
  answer: string;
  createdAt?: string;
}

interface FlashcardsTabProps {
  documentId: string;
}

const FlashcardsTab: React.FC<FlashcardsTabProps> = ({ documentId }) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const fetchFlashcards = async () => {
    try {
      setLoading(true);
      const response = await getFlashcards(documentId);
      if (response.success) {
        setFlashcards(response.flashcards || []);
      } else {
        setError('Failed to load flashcards');
      }
    } catch (err) {
      console.error('Error fetching flashcards:', err);
      setError('Failed to load flashcards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashcards();
  }, [documentId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this flashcard?')) return;
    
    try {
      await deleteFlashcard(id);
      await fetchFlashcards(); // Refresh the list
    } catch (err) {
      console.error('Error deleting flashcard:', err);
      setError('Failed to delete flashcard');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFlashcard) return;

    try {
      await updateFlashcard(editingFlashcard._id, { 
        question: editingFlashcard.question, 
        answer: editingFlashcard.answer 
      });
      setEditingFlashcard(null);
      await fetchFlashcards(); // Refresh the list
    } catch (err) {
      console.error('Error updating flashcard:', err);
      setError('Failed to update flashcard');
    }
  };

  const handleDownloadCsv = async () => {
    try {
      await exportFlashcardsCSV(documentId);
    } catch (err) {
      console.error('Error downloading CSV:', err);
      setError('Failed to download CSV');
    }
  };

  const handleCreateFlashcard = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const question = formData.get('question') as string;
    const answer = formData.get('answer') as string;

    if (!question?.trim() || !answer?.trim()) {
      setError('Both question and answer are required');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      await createFlashcard({ documentId, question: question.trim(), answer: answer.trim() });
      form.reset();
      await fetchFlashcards(); // Refresh the list
    } catch (err) {
      console.error('Error creating flashcard:', err);
      setError('Failed to create flashcard');
    } finally {
      setIsCreating(false);
    }
  };

  // Navigation functions for review mode
  const nextCard = () => {
    setShowAnswer(false);
    setReviewIndex(prev => (prev + 1) % flashcards.length);
  };

  const previousCard = () => {
    setShowAnswer(false);
    setReviewIndex(prev => prev === 0 ? flashcards.length - 1 : prev - 1);
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        <span className="ml-2">Loading flashcards...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          Error: {error}
          <button 
            onClick={() => { setError(null); fetchFlashcards(); }}
            className="ml-4 text-sm underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isReviewMode && flashcards.length > 0) {
    const currentFlashcard = flashcards[reviewIndex];

    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Review Mode</h1>
            <p className="text-gray-600">Card {reviewIndex + 1} of {flashcards.length}</p>
          </div>
          <button 
            onClick={() => { setIsReviewMode(false); setShowAnswer(false); setReviewIndex(0); }}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Exit Review
          </button>
        </div>

        <div className="flex flex-col items-center">
          {/* Flashcard Display */}
          <div 
            className="relative w-full max-w-2xl h-80 cursor-pointer mb-6"
            onClick={toggleAnswer}
          >
            <div className={`absolute inset-0 rounded-xl shadow-lg transition-transform duration-700 preserve-3d ${showAnswer ? 'rotate-y-180' : ''}`}>
              {/* Front of card */}
              <div className="absolute inset-0 bg-white border-2 border-blue-200 rounded-xl p-6 flex items-center justify-center backface-hidden">
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-2">Question</div>
                  <p className="text-lg font-medium text-gray-800">{currentFlashcard.question}</p>
                  <div className="text-sm text-gray-400 mt-4">Click to reveal answer</div>
                </div>
              </div>
              
              {/* Back of card */}
              <div className="absolute inset-0 bg-blue-50 border-2 border-blue-300 rounded-xl p-6 flex items-center justify-center backface-hidden rotate-y-180">
                <div className="text-center">
                  <div className="text-sm text-blue-600 mb-2">Answer</div>
                  <p className="text-lg font-medium text-gray-800">{currentFlashcard.answer}</p>
                  <div className="text-sm text-blue-400 mt-4">Click to show question</div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={previousCard}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
              disabled={flashcards.length <= 1}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            
            <button
              onClick={toggleAnswer}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              {showAnswer ? 'Show Question' : 'Show Answer'}
            </button>
            
            <button 
              onClick={nextCard}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
              disabled={flashcards.length <= 1}
            >
              Next
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-2xl mt-6">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((reviewIndex + 1) / flashcards.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Flashcards</h1>
          <p className="text-gray-600">{flashcards.length} card{flashcards.length !== 1 ? 's' : ''} available</p>
        </div>
        <div className="flex space-x-3">
          {flashcards.length > 0 && (
            <>
              <button 
                onClick={() => setIsReviewMode(true)} 
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Review Mode
              </button>
              <button 
                onClick={handleDownloadCsv} 
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download CSV
              </button>
            </>
          )}
        </div>
      </div>

      {/* Create Flashcard Form */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Create New Flashcard</h2>
        <form onSubmit={handleCreateFlashcard} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
            <textarea
              name="question"
              placeholder="Enter your question here..."
              required
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
            <textarea
              name="answer"
              placeholder="Enter the answer here..."
              required
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Flashcard
              </>
            )}
          </button>
        </form>
      </div>

      {/* Flashcards Grid */}
      {flashcards.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-500 mb-2">No flashcards yet</h3>
          <p className="text-gray-400">Create your first flashcard using the form above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flashcards.map((flashcard) => (
            <div key={flashcard._id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-2 text-sm uppercase text-blue-600">Question</h3>
                <p className="text-gray-800 mb-4">{flashcard.question}</p>
                <h3 className="font-semibold text-gray-800 mb-2 text-sm uppercase text-green-600">Answer</h3>
                <p className="text-gray-600">{flashcard.answer}</p>
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setEditingFlashcard(flashcard)}
                  className="px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors flex items-center text-sm"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(flashcard._id)}
                  className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center text-sm"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingFlashcard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Edit Flashcard</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                <textarea
                  value={editingFlashcard.question}
                  onChange={(e) => setEditingFlashcard({ ...editingFlashcard, question: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                <textarea
                  value={editingFlashcard.answer}
                  onChange={(e) => setEditingFlashcard({ ...editingFlashcard, answer: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingFlashcard(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Update Flashcard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* CSS for 3D flip effect */}
      <style jsx>{`
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

export default FlashcardsTab;