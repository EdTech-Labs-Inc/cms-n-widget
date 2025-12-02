'use client';

import { CheckCircle } from 'lucide-react';

interface FeedbackSuccessProps {
  onReset: () => void;
}

export function FeedbackSuccess({ onReset }: FeedbackSuccessProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
        <CheckCircle className="w-8 h-8 text-green-500" />
      </div>

      <h3 className="text-xl font-semibold text-text-primary mb-2">
        Thank You!
      </h3>

      <p className="text-text-secondary mb-6 max-w-xs">
        Your feedback has been submitted successfully. We'll review it and get back to you if needed.
      </p>

      <button
        onClick={onReset}
        className="btn btn-ghost"
      >
        Submit Another
      </button>
    </div>
  );
}
