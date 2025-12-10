'use client';

import { useState, useMemo } from 'react';
import { Play, Loader2, User, Film, Type, AlertCircle } from 'lucide-react';

type TimelineSection = 'start' | 'video' | 'end';

interface PreviewPanelProps {
  // Character preview
  characterThumbnailUrl?: string | null;
  characterName?: string | null;

  // Bumper previews
  startBumperThumbnailUrl?: string | null;
  startBumperName?: string | null;
  startBumperMediaUrl?: string | null;
  startBumperType?: 'image' | 'video' | null;
  endBumperThumbnailUrl?: string | null;
  endBumperName?: string | null;
  endBumperMediaUrl?: string | null;
  endBumperType?: 'image' | 'video' | null;

  // Caption preview
  captionPreviewUrl?: string | null;
  captionStyleName?: string | null;

  // Validation state
  isScriptReady: boolean;
  isCharacterSelected: boolean;
  isLookSelected: boolean;
  isCaptionSelected: boolean;

  // Generate action
  onGenerate: () => void;
  isGenerating: boolean;
}

export function PreviewPanel({
  characterThumbnailUrl,
  characterName,
  startBumperThumbnailUrl,
  startBumperName,
  startBumperMediaUrl,
  startBumperType,
  endBumperThumbnailUrl,
  endBumperName,
  endBumperMediaUrl,
  endBumperType,
  captionPreviewUrl,
  captionStyleName,
  isScriptReady,
  isCharacterSelected,
  isLookSelected,
  isCaptionSelected,
  onGenerate,
  isGenerating,
}: PreviewPanelProps) {
  const [activeSection, setActiveSection] = useState<TimelineSection>('video');

  const hasStartBumper = !!startBumperThumbnailUrl || !!startBumperMediaUrl;
  const hasEndBumper = !!endBumperThumbnailUrl || !!endBumperMediaUrl;

  const canGenerate = useMemo(() => {
    return isScriptReady && isCharacterSelected && isLookSelected && isCaptionSelected;
  }, [isScriptReady, isCharacterSelected, isLookSelected, isCaptionSelected]);

  const missingItems = useMemo(() => {
    const items: string[] = [];
    if (!isScriptReady) items.push('Script');
    if (!isCharacterSelected) items.push('Character');
    if (!isLookSelected) items.push('Look');
    if (!isCaptionSelected) items.push('Caption Style');
    return items;
  }, [isScriptReady, isCharacterSelected, isLookSelected, isCaptionSelected]);

  const renderPreviewContent = () => {
    switch (activeSection) {
      case 'start':
        if (startBumperThumbnailUrl || startBumperMediaUrl) {
          const previewSrc = startBumperThumbnailUrl || startBumperMediaUrl;
          return (
            <div className="relative w-full h-full">
              {startBumperType === 'video' && startBumperMediaUrl ? (
                <video
                  src={startBumperMediaUrl}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                  autoPlay
                />
              ) : (
                <img
                  src={previewSrc!}
                  alt={startBumperName || 'Start bumper'}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 text-xs text-white flex items-center gap-1.5">
                <Film className="w-3 h-3" />
                Start Bumper
              </div>
            </div>
          );
        }
        return (
          <div className="flex flex-col items-center justify-center text-text-muted">
            <div className="w-16 h-16 rounded-full bg-white-10 flex items-center justify-center mb-3">
              <Play className="w-8 h-8" />
            </div>
            <p className="text-sm">No start bumper selected</p>
            <p className="text-xs mt-1 opacity-60">Optional intro for your video</p>
          </div>
        );

      case 'end':
        if (endBumperThumbnailUrl || endBumperMediaUrl) {
          const previewSrc = endBumperThumbnailUrl || endBumperMediaUrl;
          return (
            <div className="relative w-full h-full">
              {endBumperType === 'video' && endBumperMediaUrl ? (
                <video
                  src={endBumperMediaUrl}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                  autoPlay
                />
              ) : (
                <img
                  src={previewSrc!}
                  alt={endBumperName || 'End bumper'}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 text-xs text-white flex items-center gap-1.5">
                <Film className="w-3 h-3" />
                End Bumper
              </div>
            </div>
          );
        }
        return (
          <div className="flex flex-col items-center justify-center text-text-muted">
            <div className="w-16 h-16 rounded-full bg-white-10 flex items-center justify-center mb-3">
              <Play className="w-8 h-8" />
            </div>
            <p className="text-sm">No end bumper selected</p>
            <p className="text-xs mt-1 opacity-60">Optional outro for your video</p>
          </div>
        );

      case 'video':
      default:
        if (characterThumbnailUrl) {
          return (
            <div className="relative w-full h-full">
              <img
                src={characterThumbnailUrl}
                alt={characterName || 'Character'}
                className="w-full h-full object-cover"
              />
              {/* Caption style preview overlay */}
              {captionPreviewUrl && (
                <div className="absolute left-0 right-0 bottom-[15%] pointer-events-none">
                  <img
                    src={captionPreviewUrl}
                    alt={captionStyleName || 'Caption style preview'}
                    className="w-full h-auto object-contain opacity-90"
                  />
                </div>
              )}
              {/* Caption style label */}
              {captionStyleName && (
                <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 text-xs text-white flex items-center gap-1.5">
                  <Type className="w-3 h-3" />
                  {captionStyleName}
                </div>
              )}
              {/* Character name label */}
              {characterName && (
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
                    <p className="text-white text-sm font-medium truncate">{characterName}</p>
                  </div>
                </div>
              )}
            </div>
          );
        }
        return (
          <div className="flex flex-col items-center justify-center text-text-muted">
            <div className="w-16 h-16 rounded-full bg-white-10 flex items-center justify-center mb-3">
              <User className="w-8 h-8" />
            </div>
            <p className="text-sm">Select a character to preview</p>
            <p className="text-xs mt-1 opacity-60">Choose from Step 2 &amp; 3</p>
          </div>
        );
    }
  };

  return (
    <div className="sticky top-4 space-y-4">
      {/* Preview Container - 9:16 aspect ratio */}
      <div className="bg-white-5 rounded-xl overflow-hidden border border-white-20">
        <div className="aspect-[9/16] bg-navy-dark flex items-center justify-center relative">
          {renderPreviewContent()}
        </div>
      </div>

      {/* Timeline Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveSection('start')}
          className={`relative flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            activeSection === 'start'
              ? 'bg-gold text-navy-dark'
              : 'bg-white-10 text-text-secondary hover:bg-white-20'
          }`}
        >
          Start
          {hasStartBumper && activeSection !== 'start' && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('video')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            activeSection === 'video'
              ? 'bg-gold text-navy-dark'
              : 'bg-white-10 text-text-secondary hover:bg-white-20'
          }`}
        >
          Video
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('end')}
          className={`relative flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            activeSection === 'end'
              ? 'bg-gold text-navy-dark'
              : 'bg-white-10 text-text-secondary hover:bg-white-20'
          }`}
        >
          End
          {hasEndBumper && activeSection !== 'end' && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Generate Button */}
      <button
        type="button"
        onClick={onGenerate}
        disabled={!canGenerate || isGenerating}
        className="w-full py-3 px-4 bg-blue-accent hover:bg-blue-accent/90 disabled:bg-blue-accent/30 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating Video...
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            Generate Video
          </>
        )}
      </button>

      {/* Missing Items Warning */}
      {!canGenerate && missingItems.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-200">
            <span className="font-medium">Required:</span> {missingItems.join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
