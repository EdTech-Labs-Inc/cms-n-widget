'use client';

import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-purple-accent/20' : 'bg-white-10'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-purple-accent" />
        ) : (
          <Bot className="w-4 h-4 text-text-secondary" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
          isUser
            ? 'bg-purple-accent text-white rounded-tr-sm'
            : 'bg-white-10 text-text-primary rounded-tl-sm'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">
          {content}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse" />
          )}
        </p>
      </div>
    </div>
  );
}
