'use client';

import { useState, useEffect } from 'react';
import { SupportWidgetTrigger } from './SupportWidgetTrigger';
import { SupportWidgetPanel } from './SupportWidgetPanel';

type TabType = 'chat' | 'feedback';

interface SupportWidgetProps {
  user?: {
    id: string;
    email: string;
    fullName: string | null;
  } | null;
}

export function SupportWidget({ user }: SupportWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [sessionId, setSessionId] = useState('');

  // Generate session ID on mount
  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  // Reset session when widget is closed
  const handleClose = () => {
    setIsOpen(false);
  };

  const handleOpen = () => {
    // Generate new session ID when opening
    if (!isOpen) {
      setSessionId(crypto.randomUUID());
    }
    setIsOpen(true);
  };

  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  // Don't render if no session ID yet (SSR)
  if (!sessionId) {
    return null;
  }

  return (
    <>
      <SupportWidgetTrigger isOpen={isOpen} onClick={handleToggle} />
      <SupportWidgetPanel
        isOpen={isOpen}
        onClose={handleClose}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sessionId={sessionId}
      />
    </>
  );
}
