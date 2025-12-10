'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, GraduationCap, Sparkles } from 'lucide-react';
import { usePlatformMode, PlatformMode } from '@/lib/context/platform-mode-context';

const MODES = [
  {
    value: 'learning' as PlatformMode,
    label: 'Education',
    icon: GraduationCap,
    description: 'Learning hub content',
  },
  {
    value: 'creative' as PlatformMode,
    label: 'Marketing',
    icon: Sparkles,
    description: 'Social media videos',
  },
];

export function PlatformModeSwitcher() {
  const { mode, setMode } = usePlatformMode();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentMode = MODES.find((m) => m.value === mode) || MODES[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleModeChange = (newMode: PlatformMode) => {
    setMode(newMode);
    setIsOpen(false);
  };

  const CurrentIcon = currentMode.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary transition-all duration-200 hover:bg-white-10 hover:text-text-primary border border-white-10 hover:border-white-20"
      >
        <CurrentIcon className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-semibold flex-1 text-left truncate">
          {currentMode.label}
        </span>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 py-2 bg-black border border-white-10 rounded-xl shadow-xl z-50">
          {MODES.map((modeOption) => {
            const Icon = modeOption.icon;
            const isActive = modeOption.value === mode;

            return (
              <button
                key={modeOption.value}
                onClick={() => handleModeChange(modeOption.value)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                  isActive
                    ? 'bg-white-10 text-white'
                    : 'text-text-secondary hover:bg-white-10 hover:text-text-primary'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold">{modeOption.label}</div>
                  <div className="text-xs text-text-muted">{modeOption.description}</div>
                </div>
                {isActive && (
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-white" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
