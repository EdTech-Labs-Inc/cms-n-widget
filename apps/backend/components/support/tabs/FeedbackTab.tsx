'use client';

import { useState } from 'react';
import { FeedbackForm } from '../feedback/FeedbackForm';
import { FeedbackSuccess } from '../feedback/FeedbackSuccess';

export function FeedbackTab() {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSuccess = () => {
    setShowSuccess(true);
  };

  const handleReset = () => {
    setShowSuccess(false);
  };

  if (showSuccess) {
    return <FeedbackSuccess onReset={handleReset} />;
  }

  return <FeedbackForm onSuccess={handleSuccess} />;
}
