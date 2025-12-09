'use client';

import { useCaptionStyles } from '@/lib/api/hooks';
import { Loader2, Check, ImageIcon } from 'lucide-react';
import type { CaptionStyle } from '@repo/api-client';

interface CaptionsStepProps {
  orgSlug: string;
  selectedCaptionStyleId: string | null;
  onCaptionStyleSelect: (
    captionStyleId: string,
    captionStyleName: string | null,
    previewImageUrl: string | null
  ) => void;
  disabled?: boolean;
}

function CaptionStyleCard({
  style,
  selected,
  onClick,
  disabled,
}: {
  style: CaptionStyle;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative w-full rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border-2 ${
        selected
          ? 'border-gold ring-2 ring-gold/30'
          : 'border-white-20 hover:border-white-40'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {/* Preview Image */}
      <div className="aspect-video bg-navy-dark">
        {style.previewImageUrl ? (
          <img
            src={style.previewImageUrl}
            alt={style.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white-10">
            <ImageIcon className="w-8 h-8 text-text-muted" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 bg-white-5">
        <div className="flex items-center justify-between">
          <span className="font-medium text-text-primary text-sm truncate">
            {style.name}
          </span>
          {selected && (
            <div className="w-5 h-5 rounded-full bg-gold flex items-center justify-center">
              <Check className="w-3 h-3 text-navy-dark" />
            </div>
          )}
        </div>

        {/* Logo indicator */}
        {style.logoUrl && (
          <div className="mt-1 flex items-center gap-1 text-xs text-text-muted">
            <ImageIcon className="w-3 h-3" />
            <span>Includes logo overlay</span>
          </div>
        )}
      </div>
    </button>
  );
}

export function CaptionsStep({
  orgSlug,
  selectedCaptionStyleId,
  onCaptionStyleSelect,
  disabled = false,
}: CaptionsStepProps) {
  const {
    data: captionStyles,
    isLoading,
    isError,
  } = useCaptionStyles(orgSlug);

  const styles = captionStyles || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-white-10 rounded-xl">
        <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
        <span className="ml-2 text-text-muted">Loading caption styles...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
        Failed to load caption styles. Please try again later.
      </div>
    );
  }

  if (styles.length === 0) {
    return (
      <div className="p-4 bg-white-10 rounded-xl text-text-muted text-sm">
        No caption styles available. Please contact an administrator to add caption styles for your organization.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        Select a caption style for your video:
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {styles.map((style) => (
          <CaptionStyleCard
            key={style.id}
            style={style}
            selected={selectedCaptionStyleId === style.id}
            onClick={() => onCaptionStyleSelect(style.id, style.name, style.previewImageUrl || null)}
            disabled={disabled}
          />
        ))}
      </div>

      {selectedCaptionStyleId && (
        <div className="text-xs text-text-muted text-center">
          Selected: {styles.find((s) => s.id === selectedCaptionStyleId)?.name}
        </div>
      )}
    </div>
  );
}
