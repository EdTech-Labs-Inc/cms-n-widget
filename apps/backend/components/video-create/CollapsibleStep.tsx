'use client';

import { ReactNode } from 'react';
import { ChevronDown, Check, AlertCircle } from 'lucide-react';

interface CollapsibleStepProps {
  stepNumber: number;
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  isComplete: boolean;
  isDisabled?: boolean;
  isRequired?: boolean;
  children: ReactNode;
}

export function CollapsibleStep({
  stepNumber,
  title,
  isExpanded,
  onToggle,
  isComplete,
  isDisabled = false,
  isRequired = false,
  children,
}: CollapsibleStepProps) {
  const showRequiredWarning = isRequired && !isComplete && !isExpanded;

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all duration-200 ${
        isExpanded
          ? 'border-gold/50 bg-white-5'
          : showRequiredWarning
            ? 'border-amber-500/30 bg-white-5'
            : 'border-white-20 bg-white-5'
      } ${isDisabled ? 'opacity-50' : ''}`}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={isDisabled}
        className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${
          isDisabled ? 'cursor-not-allowed' : 'hover:bg-white-10'
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
            isComplete
              ? 'bg-green-500 text-white'
              : isExpanded
                ? 'bg-gold text-navy-dark'
                : showRequiredWarning
                  ? 'bg-amber-500/20 text-amber-500'
                  : 'bg-white-20 text-text-secondary'
          }`}
        >
          {isComplete ? (
            <Check className="w-4 h-4" />
          ) : showRequiredWarning ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            stepNumber
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={`font-medium truncate ${
                isExpanded ? 'text-text-primary' : 'text-text-secondary'
              }`}
            >
              {title}
            </h3>
            {isRequired && !isComplete && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                Required
              </span>
            )}
          </div>
        </div>

        <ChevronDown
          className={`w-5 h-5 text-text-muted shrink-0 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 pt-0 border-t border-white-10">{children}</div>
      </div>
    </div>
  );
}
