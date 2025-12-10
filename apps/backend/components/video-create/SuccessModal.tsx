'use client';

import { CheckCircle, X, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { usePlatformMode } from '@/lib/context/platform-mode-context';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgSlug: string;
}

export function SuccessModal({ isOpen, onClose, orgSlug }: SuccessModalProps) {
  const { mode } = usePlatformMode();

  if (!isOpen) return null;

  // Determine redirect based on platform mode
  const dashboardLink = mode === 'creative' ? `/org/${orgSlug}/creative` : `/org/${orgSlug}/dashboard`;
  const dashboardLabel = mode === 'creative' ? 'Go to Videos' : 'Go to Dashboard';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-background-secondary rounded-xl shadow-2xl border border-white-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary">Video Queued</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-white-10 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-text-secondary mb-4">
            Your video has been queued for generation successfully!
          </p>

          <div className="p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-lg mb-6">
            <p className="text-sm text-text-secondary">
              <strong className="text-text-primary">What happens next?</strong>
              <br />
              Video generation typically takes 15-20 minutes. You'll be able to view your completed video once it's ready.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
            >
              Create Another
            </button>
            <Link
              href={dashboardLink}
              className="btn btn-primary flex items-center gap-2"
            >
              {dashboardLabel}
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
