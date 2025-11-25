'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface AIPromptBoxProps {
  onRegenerate: (promptGuidance: string) => void;
  isRegenerating?: boolean;
  label?: string;
  placeholder?: string;
}

export function AIPromptBox({
  onRegenerate,
  isRegenerating = false,
  label = 'AI Script Improvement',
  placeholder = 'Describe how you want to improve the script (e.g., "Make it more engaging", "Add more examples", "Simplify the language")...',
}: AIPromptBoxProps) {
  const [promptGuidance, setPromptGuidance] = useState('');

  const handleRegenerate = () => {
    if (promptGuidance.trim() && !isRegenerating) {
      onRegenerate(promptGuidance.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleRegenerate();
    }
  };

  return (
    <div className="border-t border-white-20 pt-4 mt-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold" />
          <label className="text-sm font-medium text-text-primary">{label}</label>
        </div>

        <p className="text-xs text-text-secondary">
          Describe your desired changes and AI will regenerate an improved version of the script.
        </p>

        <textarea
          value={promptGuidance}
          onChange={(e) => setPromptGuidance(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          rows={3}
          className="w-full p-3 bg-navy-dark border border-white-20 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm resize-y"
          disabled={isRegenerating}
        />

        <div className="flex items-center justify-between">
          <p className="text-xs text-text-muted">
            {isRegenerating ? 'AI is generating...' : 'Press Cmd/Ctrl+Enter or click the button'}
          </p>
          <button
            onClick={handleRegenerate}
            disabled={!promptGuidance.trim() || isRegenerating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold/90 disabled:bg-gold/30 disabled:cursor-not-allowed text-navy-dark rounded-lg font-medium text-sm transition-colors"
          >
            {isRegenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Regenerate with AI
              </>
            )}
          </button>
        </div>

        {isRegenerating && (
          <div className="flex items-center gap-2 p-3 bg-gold/10 border border-gold/30 rounded-lg">
            <Loader2 className="w-4 h-4 text-gold animate-spin" />
            <p className="text-sm text-gold">
              AI is analyzing your feedback and generating an improved script. This may take 10-30 seconds...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
