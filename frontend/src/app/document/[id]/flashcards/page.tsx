'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getFlashcards, createFlashcard, updateFlashcard, deleteFlashcard } from '../../../services/api';

interface Flashcard {
  _id: string;
  question: string;
  answer: string;
}

export default function FlashcardsPage() {
  const params = useParams();
  const documentId = params.id as string;
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null);

  useEffect(() => {
    if (documentId) {
      fetchFlashcards();
    }
  }, [documentId]);

  const fetchFlashcards = async () => {
    const fetchedFlashcards = await getFlashcards(documentId);
    setFlashcards(fetchedFlashcards);
  };

  const handleCreate = async () => {
    if (newQuestion && newAnswer) {
      await createFlashcard({ documentId, question: newQuestion, answer: newAnswer });
      setNewQuestion('');
      setNewAnswer('');
      fetchFlashcards();
    }
  };

  const handleUpdate = async (flashcard: Flashcard) => {
    if (editingFlashcard) {
      await updateFlashcard(editingFlashcard._id, { question: editingFlashcard.question, answer: editingFlashcard.answer });
      setEditingFlashcard(null);
      fetchFlashcards();
    }
  };

  const handleDelete = async (id: string) => {
    await deleteFlashcard(id);
    fetchFlashcards();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Flashcards for Document {documentId}</h1>

      {/* Create Flashcard Form */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Create New Flashcard</h2>
        <input
          type="text"
          placeholder="Question"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          className="border p-2 rounded w-full mb-2"
        />
        <textarea
          placeholder="Answer"
          value={newAnswer}
          onChange={(e) => setNewAnswer(e.target.value)}
          className="border p-2 rounded w-full mb-2"
        />
        <button onClick={handleCreate} className="bg-blue-500 text-white p-2 rounded">
          Create
        </button>
      </div>

      {/* Flashcard List */}
      <div>
        {flashcards.map((flashcard) => (
          <div key={flashcard._id} className="border p-4 rounded mb-4">
            {editingFlashcard?._id === flashcard._id ? (
              <div>
                <input
                  type="text"
                  value={editingFlashcard.question}
                  onChange={(e) => setEditingFlashcard({ ...editingFlashcard, question: e.target.value })}
                  className="border p-2 rounded w-full mb-2"
                />
                <textarea
                  value={editingFlashcard.answer}
                  onChange={(e) => setEditingFlashcard({ ...editingFlashcard, answer: e.target.value })}
                  className="border p-2 rounded w-full mb-2"
                />
                <button onClick={() => handleUpdate(editingFlashcard)} className="bg-green-500 text-white p-2 rounded mr-2">
                  Save
                </button>
                <button onClick={() => setEditingFlashcard(null)} className="bg-gray-500 text-white p-2 rounded">
                  Cancel
                </button>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold">{flashcard.question}</h3>
                <p>{flashcard.answer}</p>
                <button onClick={() => setEditingFlashcard(flashcard)} className="bg-yellow-500 text-white p-2 rounded mr-2 mt-2">
                  Edit
                </button>
                <button onClick={() => handleDelete(flashcard._id)} className="bg-red-500 text-white p-2 rounded mt-2">
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}