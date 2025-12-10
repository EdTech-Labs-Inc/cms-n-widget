'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type PlatformMode = 'learning' | 'creative';

interface PlatformModeContextType {
  mode: PlatformMode;
  setMode: (mode: PlatformMode) => void;
}

const PlatformModeContext = createContext<PlatformModeContextType | undefined>(undefined);

const STORAGE_KEY = 'edtech-platform-mode';

export function PlatformModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<PlatformMode>('learning');
  const [isHydrated, setIsHydrated] = useState(false);

  // Load mode from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'learning' || saved === 'creative') {
      setModeState(saved);
    }
    setIsHydrated(true);
  }, []);

  // Save mode to localStorage when it changes
  const setMode = (newMode: PlatformMode) => {
    setModeState(newMode);
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY, newMode);
    }
  };

  return (
    <PlatformModeContext.Provider value={{ mode, setMode }}>
      {children}
    </PlatformModeContext.Provider>
  );
}

export function usePlatformMode() {
  const context = useContext(PlatformModeContext);
  if (context === undefined) {
    throw new Error('usePlatformMode must be used within a PlatformModeProvider');
  }
  return context;
}
