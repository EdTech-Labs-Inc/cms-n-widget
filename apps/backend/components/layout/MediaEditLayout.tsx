'use client';

import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { ReactNode, useState } from 'react';
import { ApprovalButton } from '@/components/ui/ApprovalButton';

interface MediaEditLayoutProps {
  title: string;
  backUrl: string;
  backLabel?: string;
  isApproved?: boolean;
  approvedAt?: string | null | undefined;
  onApprove?: () => void;
  onUnapprove?: () => void;
  isApproving?: boolean;
  children: ReactNode;
  previewContent?: ReactNode;
  showApprovalButton?: boolean;
  showPreviewButton?: boolean;
  onPreviewClick?: () => void;
}

export function MediaEditLayout({
  title,
  backUrl,
  backLabel = 'Back to Submission',
  isApproved,
  approvedAt,
  onApprove,
  onUnapprove,
  isApproving,
  children,
  previewContent,
  showApprovalButton = true,
  showPreviewButton = false,
  onPreviewClick,
}: MediaEditLayoutProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handlePreviewClick = () => {
    if (onPreviewClick) {
      onPreviewClick();
    } else {
      setIsPreviewMode(!isPreviewMode);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Link
          href={backUrl}
          className="text-blue-accent hover:underline mb-4 inline-flex items-center gap-1 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Link>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2 break-words">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Preview Toggle */}
            {showPreviewButton && (
              <button
                onClick={handlePreviewClick}
                className="btn btn-secondary inline-flex items-center gap-2"
              >
                {isPreviewMode ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Edit
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Preview
                  </>
                )}
              </button>
            )}

            {/* Approval Button */}
            {showApprovalButton && onApprove && (
              <ApprovalButton
                isApproved={isApproved}
                approvedAt={approvedAt ?? undefined}
                isLoading={isApproving}
                onApprove={onApprove}
                onUnapprove={onUnapprove}
              />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {isPreviewMode && previewContent ? previewContent : children}
      </div>
    </div>
  );
}
