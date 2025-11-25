'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RefreshCw, AlertTriangle, X } from 'lucide-react';
import { VideoCustomization, VideoCustomizationConfig } from '@/components/video/VideoCustomization';

interface RegenerateMediaButtonProps {
  onRegenerate: (videoCustomization?: VideoCustomizationConfig) => void;
  isRegenerating?: boolean;
  mediaType: 'video' | 'podcast' | 'interactive-podcast';
  disabled?: boolean;
  // Video-specific props (only used when mediaType === 'video')
  videoCustomization?: VideoCustomizationConfig;
  onVideoCustomizationChange?: (config: VideoCustomizationConfig) => void;
}

export function RegenerateMediaButton({
  onRegenerate,
  isRegenerating = false,
  mediaType,
  disabled = false,
  videoCustomization,
  onVideoCustomizationChange,
}: RegenerateMediaButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Track if component is mounted (for portal)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (showConfirmation) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Prevent scrolling on body
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Restore scrolling
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showConfirmation]);

  const handleConfirm = () => {
    setShowConfirmation(false);
    // Pass video customization only for video media type
    if (mediaType === 'video' && videoCustomization) {
      onRegenerate(videoCustomization);
    } else {
      onRegenerate();
    }
  };

  const mediaTypeLabel = {
    'video': 'video',
    'podcast': 'podcast audio',
    'interactive-podcast': 'interactive podcast audio',
  }[mediaType];

  const regenerationNote = {
    'video': 'This will create a new video using your edited script. The video will be sent to HeyGen for generation and may take several minutes.',
    'podcast': 'This will regenerate the podcast audio using your edited transcript. This process may take 2-5 minutes depending on the length.',
    'interactive-podcast': 'This will regenerate the audio and interactive questions using your edited script. This process may take 3-6 minutes.',
  }[mediaType];

  return (
    <>
      <div className="border-t border-white-20 pt-4 mt-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-text-primary mb-1">Regenerate Media</h3>
            <p className="text-xs text-text-secondary">
              Once you're happy with your script edits, regenerate the {mediaTypeLabel} to reflect your changes.
            </p>
          </div>
          <button
            onClick={() => setShowConfirmation(true)}
            disabled={disabled || isRegenerating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-accent hover:bg-blue-accent/90 disabled:bg-blue-accent/30 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            {isRegenerating ? `Regenerating...` : `Regenerate ${mediaType === 'video' ? 'Video' : 'Audio'}`}
          </button>
        </div>
      </div>

      {/* Confirmation Modal - Rendered via Portal */}
      {showConfirmation && mounted && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className={`bg-navy-dark border border-white-20 rounded-2xl w-full shadow-2xl my-8 ${mediaType === 'video' ? 'max-w-2xl' : 'max-w-md'}`}>
            <div className="max-h-[calc(90vh-4rem)] overflow-y-auto p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-warning/20 rounded-lg shrink-0">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-text-primary mb-1">
                    Confirm Regeneration
                  </h3>
                  <p className="text-sm text-text-secondary">
                    This will replace the existing {mediaTypeLabel} with a new one based on your edited script.
                  </p>
                </div>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="text-text-muted hover:text-text-primary transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-white-10 border border-white-20 rounded-lg p-3 mb-4">
                <p className="text-xs text-text-secondary">
                  {regenerationNote}
                </p>
              </div>

              {/* Video Customization Section (only for videos) */}
              {mediaType === 'video' && videoCustomization && onVideoCustomizationChange && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-text-primary mb-3">
                    Video Settings
                  </h4>
                  <div className="p-4 rounded-xl bg-white-10 border border-white-20">
                    <VideoCustomization
                      value={videoCustomization}
                      onChange={onVideoCustomizationChange}
                      disabled={false}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 px-4 py-2 bg-white-10 hover:bg-white-20 text-text-primary rounded-lg font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-2 bg-blue-accent hover:bg-blue-accent/90 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
