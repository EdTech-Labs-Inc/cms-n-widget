'use client';

import { useMemo } from 'react';
import { useVideoBumpers } from '@/lib/api/hooks';
import { Loader2, Check, ImageIcon, Film, X } from 'lucide-react';
import type { VideoBumper } from '@repo/api-client';

interface BumpersStepProps {
  orgSlug: string;
  startBumperId: string | null;
  startBumperDuration: number | null;
  endBumperId: string | null;
  endBumperDuration: number | null;
  onStartBumperSelect: (
    bumperId: string | null,
    duration: number | null,
    thumbnailUrl: string | null,
    mediaUrl: string | null,
    bumperType: 'image' | 'video' | null
  ) => void;
  onEndBumperSelect: (
    bumperId: string | null,
    duration: number | null,
    thumbnailUrl: string | null,
    mediaUrl: string | null,
    bumperType: 'image' | 'video' | null
  ) => void;
  disabled?: boolean;
}

function BumperCard({
  bumper,
  selected,
  onClick,
  disabled,
}: {
  bumper: VideoBumper;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const handleCardClick = (e: React.MouseEvent) => {
    if (disabled) return;
    onClick();
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick(e as unknown as React.MouseEvent);
        }
      }}
      className={`relative w-full rounded-xl overflow-hidden transition-all duration-200 border-2 ${
        selected
          ? 'border-gold ring-2 ring-gold/30'
          : 'border-white-20 hover:border-white-40'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {/* Preview - always show thumbnail */}
      <div className="aspect-video bg-navy-dark relative">
        {bumper.thumbnailUrl || bumper.mediaUrl ? (
          <img
            src={bumper.thumbnailUrl || bumper.mediaUrl}
            alt={bumper.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white-10">
            <ImageIcon className="w-8 h-8 text-text-muted" />
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-xs text-white flex items-center gap-1">
          {bumper.type === 'video' ? (
            <>
              <Film className="w-3 h-3" />
              Video
            </>
          ) : (
            <>
              <ImageIcon className="w-3 h-3" />
              Image
            </>
          )}
        </div>

        {/* Selected indicator */}
        {selected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gold flex items-center justify-center">
            <Check className="w-4 h-4 text-navy-dark" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2 bg-white-5">
        <div className="font-medium text-text-primary text-sm truncate">
          {bumper.name}
        </div>
        {bumper.duration && (
          <div className="text-xs text-text-muted">
            {bumper.type === 'video' ? `${bumper.duration}s` : `Suggested: ${bumper.duration}s`}
          </div>
        )}
      </div>
    </div>
  );
}

function BumperSection({
  title,
  bumpers,
  selectedBumperId,
  selectedDuration,
  onSelect,
  disabled,
}: {
  title: string;
  bumpers: VideoBumper[];
  selectedBumperId: string | null;
  selectedDuration: number | null;
  onSelect: (
    bumperId: string | null,
    duration: number | null,
    thumbnailUrl: string | null,
    mediaUrl: string | null,
    bumperType: 'image' | 'video' | null
  ) => void;
  disabled?: boolean;
}) {
  const selectedBumper = bumpers.find((b) => b.id === selectedBumperId);
  const isImageBumper = selectedBumper?.type === 'image';

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-text-primary">{title}</h4>

      {/* No Bumper Option */}
      <button
        type="button"
        onClick={() => onSelect(null, null, null, null, null)}
        disabled={disabled}
        className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 border ${
          selectedBumperId === null
            ? 'border-gold bg-gold/10'
            : 'border-white-20 bg-white-5 hover:border-white-40'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="w-8 h-8 rounded-full bg-white-20 flex items-center justify-center">
          <X className="w-4 h-4 text-text-muted" />
        </div>
        <span className="text-sm text-text-primary">No {title.toLowerCase()}</span>
        {selectedBumperId === null && (
          <Check className="w-4 h-4 text-gold ml-auto" />
        )}
      </button>

      {/* Bumper Grid */}
      {bumpers.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {bumpers.map((bumper) => (
            <BumperCard
              key={bumper.id}
              bumper={bumper}
              selected={selectedBumperId === bumper.id}
              onClick={() =>
                onSelect(
                  bumper.id,
                  bumper.type === 'image' ? (bumper.duration || 3) : null,
                  bumper.thumbnailUrl || null,
                  bumper.mediaUrl,
                  bumper.type as 'image' | 'video'
                )
              }
              disabled={disabled}
            />
          ))}
        </div>
      ) : (
        <div className="p-3 bg-white-10 rounded-lg text-text-muted text-sm">
          No {title.toLowerCase()}s available.
        </div>
      )}

      {/* Duration input for image bumpers */}
      {isImageBumper && selectedBumperId && (
        <div className="flex items-center gap-3 p-3 bg-white-5 rounded-lg border border-white-10">
          <label className="text-sm text-text-secondary">Display duration:</label>
          <input
            type="number"
            min={1}
            max={10}
            value={selectedDuration || 3}
            onChange={(e) =>
              onSelect(
                selectedBumperId,
                Math.max(1, Math.min(10, Number(e.target.value))),
                selectedBumper?.thumbnailUrl || null,
                selectedBumper?.mediaUrl || null,
                'image'
              )
            }
            disabled={disabled}
            className="w-20 px-2 py-1 bg-navy-dark border border-white-20 rounded text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
          />
          <span className="text-sm text-text-muted">seconds</span>
        </div>
      )}
    </div>
  );
}

export function BumpersStep({
  orgSlug,
  startBumperId,
  startBumperDuration,
  endBumperId,
  endBumperDuration,
  onStartBumperSelect,
  onEndBumperSelect,
  disabled = false,
}: BumpersStepProps) {
  const {
    data: bumpers,
    isLoading,
    isError,
  } = useVideoBumpers(orgSlug);

  const allBumpers = bumpers || [];

  // Filter bumpers by position
  const startBumpers = useMemo(() => {
    return allBumpers.filter(
      (b) => b.position === 'start' || b.position === 'both'
    );
  }, [allBumpers]);

  const endBumpers = useMemo(() => {
    return allBumpers.filter(
      (b) => b.position === 'end' || b.position === 'both'
    );
  }, [allBumpers]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-white-10 rounded-xl">
        <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
        <span className="ml-2 text-text-muted">Loading bumpers...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
        Failed to load bumpers. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-muted">
        Add intro and outro bumpers to your video (optional):
      </p>

      {/* Start Bumper */}
      <BumperSection
        title="Start Bumper"
        bumpers={startBumpers}
        selectedBumperId={startBumperId}
        selectedDuration={startBumperDuration}
        onSelect={onStartBumperSelect}
        disabled={disabled}
      />

      {/* End Bumper */}
      <BumperSection
        title="End Bumper"
        bumpers={endBumpers}
        selectedBumperId={endBumperId}
        selectedDuration={endBumperDuration}
        onSelect={onEndBumperSelect}
        disabled={disabled}
      />

      {/* Summary */}
      <div className="p-3 bg-white-5 rounded-lg border border-white-10">
        <p className="text-xs text-text-muted">
          <strong className="text-text-secondary">Configuration:</strong>{' '}
          {startBumperId ? 'Start bumper' : 'No start bumper'}
          {startBumperDuration ? ` (${startBumperDuration}s)` : ''}
          {' • '}
          {endBumperId ? 'End bumper' : 'No end bumper'}
          {endBumperDuration ? ` (${endBumperDuration}s)` : ''}
        </p>
      </div>
    </div>
  );
}
