'use client';

import React from 'react';
import FlashcardView from './FlashcardView';

const FlashcardPage = ({ params }: { params: { id: string } }) => {
  return <FlashcardView documentId={params.id} />;
};

export default FlashcardPage;