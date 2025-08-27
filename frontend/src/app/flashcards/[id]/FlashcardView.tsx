'use client';

import React, { useEffect, useState } from 'react';
import { getFlashcards, createFlashcard, deleteFlashcard, updateFlashcard } from '../../services/api';

interface Flashcard {
  _id: string;
  question: string;
  answer: string;
}

const FlashcardView = ({ documentId }: { documentId: string }) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null);

  const fetchFlashcards = async () => {
    try {
      const response = await getFlashcards(documentId);
      setFlashcards(response.flashcards || []);
    } catch (err) {
      setError('Failed to load flashcards');
    }
  };

  useEffect(() => {
    fetchFlashcards();
  }, [documentId]);

  const handleDelete = async (id: string) => {
    try {
      await deleteFlashcard(id);
      fetchFlashcards(); // Refresh the list
    } catch (err) {
      setError('Failed to delete flashcard');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFlashcard) return;

    try {
      await updateFlashcard(editingFlashcard._id, { question: editingFlashcard.question, answer: editingFlashcard.answer });
      setEditingFlashcard(null);
      fetchFlashcards(); // Refresh the list
    } catch (err) {
      setError('Failed to update flashcard');
    }
  };

  if (loading) {
    return <div className="p-6">Loading flashcards...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Flashcards</h1>

      <form
        className="mb-6 p-4 border rounded-lg"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const formData = new FormData(form);
          const question = formData.get('question') as string;
          const answer = formData.get('answer') as string;

          if (question && answer) {
            await createFlashcard({ documentId, question, answer });
            form.reset();
            const response = await getFlashcards(documentId);
            setFlashcards(response.flashcards || []);
          }
        }}
      >
        <div className="mb-4">
          <input
            name="question"
            placeholder="Question"
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <input
            name="answer"
            placeholder="Answer"
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Flashcard
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {flashcards.map((flashcard) => (
          <div key={flashcard._id} className="p-4 border rounded-lg shadow-sm">
            <h2 className="font-bold text-lg mb-2">{flashcard.question}</h2>
            <p>{flashcard.answer}</p>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setEditingFlashcard(flashcard)}
                className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(flashcard._id)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingFlashcard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h2 className="text-xl font-bold mb-4">Edit Flashcard</h2>
            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <input
                  type="text"
                  value={editingFlashcard.question}
                  onChange={(e) => setEditingFlashcard({ ...editingFlashcard, question: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  value={editingFlashcard.answer}
                  onChange={(e) => setEditingFlashcard({ ...editingFlashcard, answer: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingFlashcard(null)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardView;