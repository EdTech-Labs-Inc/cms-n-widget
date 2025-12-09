'use client';

import { Sparkles } from 'lucide-react';

interface SpecialEffectsStepProps {
  enableMagicZooms: boolean;
  enableMagicBrolls: boolean;
  magicBrollsPercentage: number;
  onMagicZoomsChange: (enabled: boolean) => void;
  onMagicBrollsChange: (enabled: boolean) => void;
  onBrollsPercentageChange: (percentage: number) => void;
  disabled?: boolean;
}

export function SpecialEffectsStep({
  enableMagicZooms,
  enableMagicBrolls,
  magicBrollsPercentage,
  onMagicZoomsChange,
  onMagicBrollsChange,
  onBrollsPercentageChange,
  disabled = false,
}: SpecialEffectsStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        Configure AI-powered special effects for your video:
      </p>

      {/* Magic Zooms Toggle */}
      <label className={`flex items-center gap-3 p-4 rounded-xl bg-white-10 hover:bg-white-20 transition-all duration-200 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
        <input
          type="checkbox"
          checked={enableMagicZooms}
          onChange={(e) => onMagicZoomsChange(e.target.checked)}
          className="w-5 h-5 rounded border-white-40 bg-transparent checked:bg-gold accent-gold"
          disabled={disabled}
        />
        <div className="flex-1">
          <div className="font-medium text-text-primary flex items-center gap-2">
            Magic Zooms <Sparkles className="w-4 h-4 text-gold" />
          </div>
          <div className="text-sm text-text-muted">
            Automatic zoom effects on key phrases for emphasis
          </div>
        </div>
      </label>

      {/* Magic B-rolls Toggle */}
      <div className="space-y-3">
        <label className={`flex items-center gap-3 p-4 rounded-xl bg-white-10 hover:bg-white-20 transition-all duration-200 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            checked={enableMagicBrolls}
            onChange={(e) => onMagicBrollsChange(e.target.checked)}
            className="w-5 h-5 rounded border-white-40 bg-transparent checked:bg-gold accent-gold"
            disabled={disabled}
          />
          <div className="flex-1">
            <div className="font-medium text-text-primary flex items-center gap-2">
              Magic B-Rolls <Sparkles className="w-4 h-4 text-gold" />
            </div>
            <div className="text-sm text-text-muted">
              Automatically add relevant stock footage to enhance your video
            </div>
          </div>
        </label>

        {/* B-roll Percentage Slider */}
        {enableMagicBrolls && (
          <div className="px-4 pb-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-secondary">
                B-Roll Coverage
              </label>
              <span className="text-sm font-medium text-text-primary">
                {magicBrollsPercentage}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={magicBrollsPercentage}
              onChange={(e) => onBrollsPercentageChange(Number(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-white-20 rounded-lg appearance-none cursor-pointer accent-gold disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>0% (None)</span>
              <span>50%</span>
              <span>100% (Max)</span>
            </div>
            <p className="text-xs text-text-muted mt-2">
              Higher percentage means more B-roll footage will replace the avatar video.
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="p-3 bg-white-5 rounded-lg border border-white-10">
        <p className="text-xs text-text-muted">
          <strong className="text-text-secondary">Current settings:</strong>{' '}
          {enableMagicZooms ? 'Zooms enabled' : 'No zooms'}
          {' • '}
          {enableMagicBrolls
            ? `B-rolls at ${magicBrollsPercentage}% coverage`
            : 'No B-rolls'}
        </p>
      </div>
    </div>
  );
}
