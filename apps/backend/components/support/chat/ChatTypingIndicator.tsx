'use client';

import { Bot } from 'lucide-react';

export function ChatTypingIndicator() {
  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white-10">
        <Bot className="w-4 h-4 text-text-secondary" />
      </div>

      {/* Typing Dots */}
      <div className="bg-white-10 px-4 py-3 rounded-2xl rounded-tl-sm">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
