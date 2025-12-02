'use client';

import { MessageCircleQuestion, X } from 'lucide-react';

interface SupportWidgetTriggerProps {
  isOpen: boolean;
  onClick: () => void;
}

export function SupportWidgetTrigger({ isOpen, onClick }: SupportWidgetTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
        isOpen
          ? 'bg-white-10 hover:bg-white-15 rotate-0'
          : 'bg-purple-accent hover:bg-purple-accent/80 rotate-0'
      }`}
      aria-label={isOpen ? 'Close support' : 'Open support'}
      aria-expanded={isOpen}
    >
      {isOpen ? (
        <X className="w-6 h-6 text-text-primary" />
      ) : (
        <MessageCircleQuestion className="w-6 h-6 text-white" />
      )}
    </button>
  );
}
