'use client';

import { Check, Loader2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ApprovalButtonProps {
  isApproved?: boolean;
  approvedAt?: string;
  isLoading?: boolean;
  onApprove: () => void;
  onUnapprove?: () => void;
  disabled?: boolean;
}

export function ApprovalButton({
  isApproved = false,
  approvedAt,
  isLoading = false,
  onApprove,
  onUnapprove,
  disabled = false,
}: ApprovalButtonProps) {
  if (isApproved) {
    return (
      <div className="inline-flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-success/20 border border-success/30 rounded-full shadow-sm">
          <Check className="w-4 h-4 text-success shrink-0" />
          <div className="flex flex-col">
            <span className="text-success font-semibold text-sm">Approved</span>
            {approvedAt && (
              <span className="text-success/70 text-xs">
                {formatDistanceToNow(new Date(approvedAt), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
        {onUnapprove && (
          <button
            onClick={onUnapprove}
            disabled={isLoading || disabled}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white-10 hover:bg-white-20 border border-white-20 hover:border-error/50 text-text-secondary hover:text-error font-medium rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-xs">Withdrawing...</span>
              </>
            ) : (
              <>
                <X className="w-3.5 h-3.5" />
                <span className="text-xs">Withdraw</span>
              </>
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={onApprove}
      disabled={isLoading || disabled}
      className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-success hover:bg-success/90 text-white font-medium rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:scale-95"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Approving...</span>
        </>
      ) : (
        <>
          <Check className="w-4 h-4" />
          <span className="text-sm">Approve</span>
        </>
      )}
    </button>
  );
}
