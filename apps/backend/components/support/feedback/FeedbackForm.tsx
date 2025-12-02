'use client';

import { useState } from 'react';
import { Send, MessageSquare, Bug, Lightbulb, HelpCircle } from 'lucide-react';
import { useToast } from '@/components/ui/ToastContainer';

type FeedbackType = 'QUESTION' | 'BUG_REPORT' | 'FEATURE_REQUEST' | 'GENERAL';

interface FeedbackFormProps {
  onSuccess: () => void;
}

const feedbackTypes: { value: FeedbackType; label: string; icon: typeof MessageSquare }[] = [
  { value: 'QUESTION', label: 'Question', icon: HelpCircle },
  { value: 'BUG_REPORT', label: 'Bug Report', icon: Bug },
  { value: 'FEATURE_REQUEST', label: 'Feature Request', icon: Lightbulb },
  { value: 'GENERAL', label: 'General', icon: MessageSquare },
];

export function FeedbackForm({ onSuccess }: FeedbackFormProps) {
  const [type, setType] = useState<FeedbackType>('QUESTION');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      toast.error('Validation Error', 'Subject and message are required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/support/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          subject: subject.trim(),
          message: message.trim(),
          pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit feedback');
      }

      toast.success('Feedback Submitted', 'Thank you for your feedback!');
      setSubject('');
      setMessage('');
      setType('QUESTION');
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast.error('Submission Failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Feedback Type */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {feedbackTypes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                  type === value
                    ? 'border-purple-accent bg-purple-accent/10 text-text-primary'
                    : 'border-white-10 text-text-secondary hover:border-white-15 hover:bg-white-5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="feedback-subject" className="block text-sm font-medium text-text-secondary mb-2">
            Subject <span className="text-red-400">*</span>
          </label>
          <input
            id="feedback-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief summary of your feedback"
            className="input w-full"
            maxLength={255}
            required
          />
        </div>

        {/* Message */}
        <div>
          <label htmlFor="feedback-message" className="block text-sm font-medium text-text-secondary mb-2">
            Message <span className="text-red-400">*</span>
          </label>
          <textarea
            id="feedback-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Please provide details about your question or feedback..."
            className="input w-full min-h-[150px] resize-none"
            rows={6}
            maxLength={5000}
            required
          />
          <div className="text-xs text-text-muted mt-1 text-right">
            {message.length}/5000
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="p-4 border-t border-white-10">
        <button
          type="submit"
          disabled={isSubmitting || !subject.trim() || !message.trim()}
          className="btn btn-primary w-full flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Feedback
            </>
          )}
        </button>
      </div>
    </form>
  );
}
