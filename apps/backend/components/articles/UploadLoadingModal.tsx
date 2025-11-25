'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Sparkles, Video, Globe, Zap, Loader2 } from 'lucide-react';

interface UploadLoadingModalProps {
  isOpen: boolean;
}

interface LoadingPhrase {
  text: string;
  icon: React.ReactNode;
}

const loadingPhrases: LoadingPhrase[] = [
  {
    text: 'Analyzing article content...',
    icon: <FileText className="w-8 h-8 text-blue-accent" />,
  },
  {
    text: 'Extracting key educational insights...',
    icon: <Sparkles className="w-8 h-8 text-gold" />,
  },
  {
    text: 'Preparing multimedia generation...',
    icon: <Video className="w-8 h-8 text-purple-accent" />,
  },
  {
    text: 'Processing language content...',
    icon: <Globe className="w-8 h-8 text-teal-accent" />,
  },
  {
    text: 'Optimizing for learning...',
    icon: <Zap className="w-8 h-8 text-pink-accent" />,
  },
];

export function UploadLoadingModal({ isOpen }: UploadLoadingModalProps) {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setCurrentPhraseIndex(0);
      return;
    }

    const interval = setInterval(() => {
      // Start fade out transition
      setIsTransitioning(true);

      // After fade out, change phrase and fade in
      setTimeout(() => {
        setCurrentPhraseIndex((prev) => (prev + 1) % loadingPhrases.length);
        setIsTransitioning(false);
      }, 300); // Half of the transition duration
    }, 2500); // Show each phrase for 2.5 seconds

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const currentPhrase = loadingPhrases[currentPhraseIndex];

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md mx-4">
        {/* Modal Card */}
        <div className="bg-navy-secondary border-2 border-white-20 rounded-2xl p-8 shadow-card">
          {/* Animated Spinner */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* <Loader2 className="w-16 h-16 text-blue-accent animate-spin" /> */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-blue-accent/20 rounded-full animate-pulse" />
              </div>
            </div>
          </div>

          {/* Current Loading Phrase with Icon */}
          <div
            className={`transition-opacity duration-300 ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="bg-white-10 p-4 rounded-xl">
                {currentPhrase.icon}
              </div>
              <p className="text-xl font-semibold text-text-primary text-center">
                {currentPhrase.text}
              </p>
            </div>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2">
            {loadingPhrases.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentPhraseIndex
                    ? 'w-8 bg-blue-accent'
                    : 'w-2 bg-white-20'
                }`}
              />
            ))}
          </div>

          {/* Secondary Message */}
          <p className="text-center text-text-muted text-sm mt-6">
            This may take a few moments. Please don't close this window.
          </p>
        </div>

        {/* Ambient Glow Effect */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-accent/20 via-purple-accent/10 to-transparent rounded-2xl blur-2xl" />
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
