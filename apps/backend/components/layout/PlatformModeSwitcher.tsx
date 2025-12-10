'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, GraduationCap, Sparkles } from 'lucide-react';
import { usePlatformMode, PlatformMode } from '@/lib/context/platform-mode-context';

const MODES = [
  {
    value: 'learning' as PlatformMode,
    label: 'Learning Platform',
    icon: GraduationCap,
    description: 'Educational content creation',
  },
  {
    value: 'creative' as PlatformMode,
    label: 'Creative Platform',
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
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-white-5 hover:bg-white-10 border border-white-10 hover:border-white-20 transition-all group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center">
            <CurrentIcon className="w-4 h-4 text-gold" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm font-medium text-text-primary truncate">
              {currentMode.label}
            </div>
            <div className="text-xs text-text-muted truncate">
              {currentMode.description}
            </div>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-text-muted flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 py-2 bg-navy-secondary border border-white-10 rounded-lg shadow-xl z-50">
          {MODES.map((modeOption) => {
            const Icon = modeOption.icon;
            const isActive = modeOption.value === mode;

            return (
              <button
                key={modeOption.value}
                onClick={() => handleModeChange(modeOption.value)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                  isActive
                    ? 'bg-gold/10 text-text-primary'
                    : 'text-text-secondary hover:bg-white-5 hover:text-text-primary'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-gold/20' : 'bg-white-5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-gold' : 'text-text-muted'}`} />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">{modeOption.label}</div>
                  <div className="text-xs text-text-muted">{modeOption.description}</div>
                </div>
                {isActive && (
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-gold" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
