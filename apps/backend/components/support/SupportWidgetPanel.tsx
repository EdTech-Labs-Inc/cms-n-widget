'use client';

import { useEffect, useRef } from 'react';
import { X, MessageSquare, Send } from 'lucide-react';
import { ChatTab } from './tabs/ChatTab';
import { FeedbackTab } from './tabs/FeedbackTab';

type TabType = 'chat' | 'feedback';

interface SupportWidgetPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  sessionId: string;
}

export function SupportWidgetPanel({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  sessionId,
}: SupportWidgetPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus trap when open
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  return (
    <>
      {/* Backdrop with blur */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel with frosted glass effect */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-widget-title"
        tabIndex={-1}
        className={`fixed z-50 bg-background-secondary/80 backdrop-blur-xl border-l border-white-10 shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } bottom-0 right-0 w-full md:w-[400px] h-[600px] md:h-[calc(100vh-120px)] md:bottom-24 md:right-6 md:rounded-xl md:border`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white-10">
          <h2 id="support-widget-title" className="text-lg font-semibold text-text-primary">
            Support
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-white-10 rounded-lg transition-colors"
            aria-label="Close support"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white-10">
          <button
            onClick={() => onTabChange('chat')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-purple-accent border-b-2 border-purple-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            aria-selected={activeTab === 'chat'}
            role="tab"
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
          <button
            onClick={() => onTabChange('feedback')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === 'feedback'
                ? 'text-purple-accent border-b-2 border-purple-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            aria-selected={activeTab === 'feedback'}
            role="tab"
          >
            <Send className="w-4 h-4" />
            Feedback
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-110px)] overflow-hidden">
          {activeTab === 'chat' ? (
            <ChatTab sessionId={sessionId} />
          ) : (
            <FeedbackTab />
          )}
        </div>
      </div>
    </>
  );
}
