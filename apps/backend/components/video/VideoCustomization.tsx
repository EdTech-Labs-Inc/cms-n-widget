'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useCharacters, useCaptionStyles, useBackgroundMusic, useVideoBumpers } from '@/lib/api/hooks';
import { Loader2, ChevronLeft, ChevronRight, Sparkles, ArrowLeft, ImageIcon, Check, Play, Pause, Volume2, VolumeX, Music, Film, X } from 'lucide-react';
import type { CaptionStyle, BackgroundMusic, VideoBumper } from '@repo/api-client';

interface CharacterGroup {
  groupId: string;
  name: string;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  characters: Array<{
    id: string;
    name: string;
    heygenAvatarId: string;
    characterType: 'avatar' | 'talking_photo';
    thumbnailUrl?: string | null;
    previewUrl?: string | null;
    voice: {
      id: string;
      name: string;
      elevenlabsVoiceId: string;
    };
  }>;
}

/**
 * Image-centric card component with hover video preview
 */
function AvatarCard({
  thumbnailUrl,
  previewUrl,
  name,
  subtitle,
  selected,
  onClick,
  disabled,
}: {
  thumbnailUrl?: string | null;
  previewUrl?: string | null;
  name: string;
  subtitle?: string;
  selected?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const [isHovering, setIsHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isHovering && previewUrl) {
        videoRef.current.play().catch(() => {
          // Ignore autoplay errors
        });
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isHovering, previewUrl]);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`relative w-full aspect-[3/4] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border-2 ${
        selected
          ? 'border-gold ring-2 ring-gold/30'
          : 'border-transparent hover:border-white/20'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${
        isHovering && !disabled ? 'scale-105 z-10' : 'scale-100'
      }`}
    >
      {/* Thumbnail image */}
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={name}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isHovering && previewUrl ? 'opacity-0' : 'opacity-100'
          }`}
        />
      ) : (
        <div className={`absolute inset-0 w-full h-full bg-gradient-purple flex items-center justify-center text-white text-2xl font-bold transition-opacity duration-300 ${
          isHovering && previewUrl ? 'opacity-0' : 'opacity-100'
        }`}>
          {name.charAt(0)}
        </div>
      )}

      {/* Video preview (only rendered if previewUrl exists) */}
      {previewUrl && (
        <video
          ref={videoRef}
          src={previewUrl}
          muted
          loop
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isHovering ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Dark gradient overlay at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Text overlay */}
      <div className="absolute inset-x-0 bottom-0 p-3">
        <div className="text-white font-medium text-sm truncate">{name}</div>
        {subtitle && (
          <div className="text-white/70 text-xs">{subtitle}</div>
        )}
      </div>
    </button>
  );
}

/**
 * Music card component with play/pause audio preview
 */
function MusicCard({
  music,
  selected,
  onClick,
  disabled,
  isPlaying,
  onPlayChange,
}: {
  music: BackgroundMusic;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  isPlaying: boolean;
  onPlayChange: (playing: boolean) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch(() => onPlayChange(false));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, onPlayChange]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlayChange(!isPlaying);
  };

  const handleAudioEnded = () => {
    onPlayChange(false);
  };

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-play-button]')) return;
    if (!disabled) onClick();
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border-2 ${
        selected
          ? 'border-gold bg-gold/10'
          : 'border-white-20 bg-white-5 hover:border-white-40 hover:bg-white-10'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <button
        type="button"
        data-play-button
        onClick={handlePlayPause}
        disabled={disabled}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          isPlaying
            ? 'bg-gold text-navy-dark'
            : 'bg-white-20 text-text-primary hover:bg-white-30'
        }`}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </button>

      <div className="flex-1 text-left min-w-0">
        <div className="font-medium text-text-primary truncate">{music.name}</div>
        {music.duration && (
          <div className="text-xs text-text-muted">
            {formatDuration(music.duration)}
          </div>
        )}
      </div>

      {selected && (
        <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center shrink-0">
          <Check className="w-4 h-4 text-navy-dark" />
        </div>
      )}

      <audio
        ref={audioRef}
        src={music.previewAudioUrl}
        onEnded={handleAudioEnded}
        preload="none"
      />
    </div>
  );
}

/**
 * Bumper card component
 */
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
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onClick()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!disabled) onClick();
        }
      }}
      className={`relative w-full rounded-xl overflow-hidden transition-all duration-200 border-2 ${
        selected
          ? 'border-gold ring-2 ring-gold/30'
          : 'border-white-20 hover:border-white-40'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
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

        {selected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gold flex items-center justify-center">
            <Check className="w-4 h-4 text-navy-dark" />
          </div>
        )}
      </div>

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

export interface VideoCustomizationConfig {
  characterId: string; // Our DB Character ID - heygenImageKey and voiceId are looked up from Character
  captionStyleId: string; // Our DB CaptionStyle ID - submagicTemplate is looked up from CaptionStyle
  enableMagicZooms: boolean;
  enableMagicBrolls: boolean;
  magicBrollsPercentage: number;
  generateBubbles: boolean;
  // Background Music
  backgroundMusicId?: string | null;
  backgroundMusicVolume?: number; // 0-1, default 0.15
  // Bumpers
  startBumperId?: string | null;
  startBumperDuration?: number | null; // seconds, for image bumpers
  endBumperId?: string | null;
  endBumperDuration?: number | null; // seconds, for image bumpers
}

const ITEMS_PER_PAGE = 6;

interface VideoCustomizationProps {
  orgSlug: string;
  value: VideoCustomizationConfig;
  onChange: (config: VideoCustomizationConfig) => void;
  disabled?: boolean;
}

export function VideoCustomization({ orgSlug, value, onChange, disabled = false }: VideoCustomizationProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [playingMusicId, setPlayingMusicId] = useState<string | null>(null);

  // Fetch characters from database
  const {
    data: characters,
    isLoading: charactersLoading,
    isError: charactersError,
  } = useCharacters(orgSlug);

  // Fetch caption styles from database
  const {
    data: captionStyles,
    isLoading: captionStylesLoading,
    isError: captionStylesError,
  } = useCaptionStyles(orgSlug);

  // Fetch background music from database
  const {
    data: backgroundMusic,
    isLoading: musicLoading,
    isError: musicError,
  } = useBackgroundMusic(orgSlug);

  // Fetch video bumpers from database
  const {
    data: bumpers,
    isLoading: bumpersLoading,
    isError: bumpersError,
  } = useVideoBumpers(orgSlug);

  const allCharacters = characters || [];
  const allCaptionStyles = captionStyles || [];
  const musicList = backgroundMusic || [];
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

  // Group characters by heygenAvatarGroupId
  const characterGroups = useMemo(() => {
    const groupMap = new Map<string, CharacterGroup>();

    for (const character of allCharacters) {
      // Use groupId if available, otherwise use character id as unique group
      const groupId = character.heygenAvatarGroupId || `single_${character.id}`;

      if (groupMap.has(groupId)) {
        groupMap.get(groupId)!.characters.push(character);
      } else {
        groupMap.set(groupId, {
          groupId,
          name: character.name,
          thumbnailUrl: character.thumbnailUrl || null,
          previewUrl: character.previewUrl || null,
          characters: [character],
        });
      }
    }

    return Array.from(groupMap.values());
  }, [allCharacters]);

  // Get the currently selected group (for Level 2 view)
  const selectedGroup = useMemo(() => {
    if (!selectedGroupId) return null;
    return characterGroups.find(g => g.groupId === selectedGroupId) || null;
  }, [characterGroups, selectedGroupId]);

  // Get items for current level
  const currentItems = useMemo(() => {
    if (selectedGroupId && selectedGroup) {
      return selectedGroup.characters;
    }
    return characterGroups;
  }, [selectedGroupId, selectedGroup, characterGroups]);

  // Calculate pagination
  const totalPages = Math.ceil(currentItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return currentItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentItems, currentPage]);

  // Reset pagination when level changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGroupId]);

  // Handlers
  const handleBackToGroups = () => {
    setSelectedGroupId(null);
  };

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
  };

  const handleCharacterChange = (characterId: string) => {
    onChange({ ...value, characterId });
  };

  const handleZoomsToggle = () => {
    onChange({ ...value, enableMagicZooms: !value.enableMagicZooms });
  };

  const handleBrollsToggle = () => {
    onChange({ ...value, enableMagicBrolls: !value.enableMagicBrolls });
  };

  const handleBrollsPercentageChange = (percentage: number) => {
    onChange({ ...value, magicBrollsPercentage: percentage });
  };

  const handleBubblesToggle = () => {
    onChange({ ...value, generateBubbles: !value.generateBubbles });
  };

  const handleCaptionStyleChange = (captionStyleId: string) => {
    onChange({ ...value, captionStyleId });
  };

  // Music handlers
  const handleMusicSelect = (musicId: string | null) => {
    onChange({ ...value, backgroundMusicId: musicId });
  };

  const handleMusicVolumeChange = (volume: number) => {
    onChange({ ...value, backgroundMusicVolume: volume });
  };

  // Bumper handlers
  const handleStartBumperSelect = (bumperId: string | null, duration: number | null) => {
    onChange({
      ...value,
      startBumperId: bumperId,
      startBumperDuration: duration,
    });
  };

  const handleEndBumperSelect = (bumperId: string | null, duration: number | null) => {
    onChange({
      ...value,
      endBumperId: bumperId,
      endBumperDuration: duration,
    });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Character Selection */}
      <div>
        {/* Header with back button for Level 2 */}
        <div className="flex items-center gap-2 mb-3">
          {selectedGroupId ? (
            <button
              type="button"
              onClick={handleBackToGroups}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
              disabled={disabled}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">{selectedGroup?.name || 'Characters'}</span>
            </button>
          ) : (
            <label className="block text-text-secondary text-sm font-medium">
              Character
            </label>
          )}
        </div>

        {charactersLoading ? (
          <div className="flex items-center justify-center p-8 bg-white-10 rounded-xl">
            <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
            <span className="ml-2 text-text-muted">Loading characters...</span>
          </div>
        ) : charactersError ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            Failed to load characters. Please try again later.
          </div>
        ) : allCharacters.length === 0 ? (
          <div className="p-4 bg-white-10 rounded-xl text-text-muted text-sm">
            No characters available. Please contact an administrator to add characters for your organization.
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-3 gap-4 justify-items-center">
              {selectedGroupId ? (
                // Level 2: Characters within group
                (paginatedItems as CharacterGroup['characters']).map((character) => (
                  <div key={character.id} className="w-[75%]">
                    <AvatarCard
                      thumbnailUrl={character.thumbnailUrl}
                      previewUrl={character.previewUrl}
                      name={character.name}
                      selected={value.characterId === character.id}
                      onClick={() => handleCharacterChange(character.id)}
                      disabled={disabled}
                    />
                  </div>
                ))
              ) : (
                // Level 1: Groups
                (paginatedItems as CharacterGroup[]).map((group) => (
                  <div key={group.groupId} className="w-[75%]">
                    <AvatarCard
                      thumbnailUrl={group.thumbnailUrl}
                      previewUrl={group.previewUrl}
                      name={group.name}
                      subtitle={`${group.characters.length} look${group.characters.length !== 1 ? 's' : ''}`}
                      onClick={() => handleGroupSelect(group.groupId)}
                      disabled={disabled}
                    />
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-4">
                <button
                  type="button"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || disabled}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === 1 || disabled
                      ? 'bg-white-10 text-text-muted cursor-not-allowed'
                      : 'bg-white-10 text-text-primary hover:bg-white-20'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <span className="text-sm text-text-secondary">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || disabled}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === totalPages || disabled
                      ? 'bg-white-10 text-text-muted cursor-not-allowed'
                      : 'bg-white-10 text-text-primary hover:bg-white-20'
                  }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Results count */}
            <div className="text-xs text-text-muted text-center mt-2">
              Showing {paginatedItems.length} of {currentItems.length} {selectedGroupId ? 'looks' : 'characters'}
            </div>
          </>
        )}
      </div>

      {/* Caption Style Selection */}
      <div>
        <label className="block text-text-secondary text-sm font-medium mb-3">
          Caption Style
        </label>

        {captionStylesLoading ? (
          <div className="flex items-center justify-center p-8 bg-white-10 rounded-xl">
            <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
            <span className="ml-2 text-text-muted">Loading caption styles...</span>
          </div>
        ) : captionStylesError ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            Failed to load caption styles. Please try again later.
          </div>
        ) : allCaptionStyles.length === 0 ? (
          <div className="p-4 bg-white-10 rounded-xl text-text-muted text-sm">
            No caption styles available. Please contact an administrator to add caption styles for your organization.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {allCaptionStyles.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => handleCaptionStyleChange(style.id)}
                disabled={disabled}
                className={`relative w-full rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border-2 ${
                  value.captionStyleId === style.id
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
                    {value.captionStyleId === style.id && (
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
            ))}
          </div>
        )}
      </div>

      {/* Magic Zooms Toggle */}
      <div>
        <label className="flex items-center gap-3 p-4 rounded-xl bg-white-10 hover:bg-white-20 cursor-pointer transition-all duration-200">
          <input
            type="checkbox"
            checked={value.enableMagicZooms}
            onChange={handleZoomsToggle}
            className="w-5 h-5 rounded border-white-40 bg-transparent checked:bg-blue-accent"
            disabled={disabled}
          />
          <div className="flex-1">
            <div className="font-medium text-text-primary flex items-center gap-2">
              Magic Zooms <Sparkles className="w-4 h-4 text-gold" />
            </div>
            <div className="text-sm text-text-muted">Automatic zoom effects for emphasis</div>
          </div>
        </label>
      </div>

      {/* Magic B-rolls Toggle and Percentage */}
      <div className="space-y-3">
        <label className="flex items-center gap-3 p-4 rounded-xl bg-white-10 hover:bg-white-20 cursor-pointer transition-all duration-200">
          <input
            type="checkbox"
            checked={value.enableMagicBrolls}
            onChange={handleBrollsToggle}
            className="w-5 h-5 rounded border-white-40 bg-transparent checked:bg-blue-accent"
            disabled={disabled}
          />
          <div className="flex-1">
            <div className="font-medium text-text-primary flex items-center gap-2">
              Magic B-Rolls <Sparkles className="w-4 h-4 text-gold" />
            </div>
            <div className="text-sm text-text-muted">Add relevant B-roll footage automatically</div>
          </div>
        </label>

        {/* B-roll Percentage Slider */}
        {value.enableMagicBrolls && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-secondary">B-Roll Coverage</label>
              <span className="text-sm font-medium text-text-primary">{value.magicBrollsPercentage}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={value.magicBrollsPercentage}
              onChange={(e) => handleBrollsPercentageChange(Number(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-white-20 rounded-lg appearance-none cursor-pointer accent-gold disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Bubbles Toggle */}
      <div>
        <label className="flex items-center gap-3 p-4 rounded-xl bg-white-10 hover:bg-white-20 cursor-pointer transition-all duration-200">
          <input
            type="checkbox"
            checked={value.generateBubbles}
            onChange={handleBubblesToggle}
            className="w-5 h-5 rounded border-white-40 bg-transparent checked:bg-blue-accent"
            disabled={disabled}
          />
          <div className="flex-1">
            <div className="font-medium text-text-primary flex items-center gap-2">
              Interactive Bubbles <Sparkles className="w-4 h-4 text-gold" />
            </div>
            <div className="text-sm text-text-muted">Generate interactive quiz bubbles that appear during video playback</div>
          </div>
        </label>
      </div>

      {/* Background Music Section */}
      <div>
        <label className="block text-text-secondary text-sm font-medium mb-3">
          Background Music (Optional)
        </label>

        {musicLoading ? (
          <div className="flex items-center justify-center p-8 bg-white-10 rounded-xl">
            <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
            <span className="ml-2 text-text-muted">Loading music...</span>
          </div>
        ) : musicError ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            Failed to load background music. Please try again later.
          </div>
        ) : (
          <div className="space-y-2">
            {/* No Music Option */}
            <button
              type="button"
              onClick={() => handleMusicSelect(null)}
              disabled={disabled}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border-2 ${
                !value.backgroundMusicId
                  ? 'border-gold bg-gold/10'
                  : 'border-white-20 bg-white-5 hover:border-white-40 hover:bg-white-10'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="w-10 h-10 rounded-full bg-white-20 flex items-center justify-center shrink-0">
                <VolumeX className="w-5 h-5 text-text-muted" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-text-primary">No Background Music</div>
                <div className="text-xs text-text-muted">Video will only have speech audio</div>
              </div>
              {!value.backgroundMusicId && (
                <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-navy-dark" />
                </div>
              )}
            </button>

            {/* Music Options */}
            {musicList.length === 0 ? (
              <div className="p-4 bg-white-10 rounded-xl text-text-muted text-sm flex items-center gap-2">
                <Music className="w-4 h-4" />
                <span>No background music tracks available yet.</span>
              </div>
            ) : (
              musicList.map((music) => (
                <MusicCard
                  key={music.id}
                  music={music}
                  selected={value.backgroundMusicId === music.id}
                  onClick={() => handleMusicSelect(music.id)}
                  disabled={disabled}
                  isPlaying={playingMusicId === music.id}
                  onPlayChange={(playing) => setPlayingMusicId(playing ? music.id : null)}
                />
              ))
            )}

            {/* Volume Slider (only shown when music is selected) */}
            {value.backgroundMusicId && (
              <div className="pt-4 border-t border-white-10">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Music Volume
                  </label>
                  <span className="text-sm font-medium text-text-primary">
                    {Math.round((value.backgroundMusicVolume || 0.15) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.01"
                  value={value.backgroundMusicVolume || 0.15}
                  onChange={(e) => handleMusicVolumeChange(Number(e.target.value))}
                  disabled={disabled}
                  className="w-full h-2 bg-white-20 rounded-lg appearance-none cursor-pointer accent-gold disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>0%</span>
                  <span>15% (default)</span>
                  <span>50%</span>
                </div>
                <p className="text-xs text-text-muted mt-2">
                  Lower volume ensures the speech remains clearly audible.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bumpers Section */}
      <div>
        <label className="block text-text-secondary text-sm font-medium mb-3">
          Video Bumpers (Optional)
        </label>

        {bumpersLoading ? (
          <div className="flex items-center justify-center p-8 bg-white-10 rounded-xl">
            <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
            <span className="ml-2 text-text-muted">Loading bumpers...</span>
          </div>
        ) : bumpersError ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            Failed to load bumpers. Please try again later.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Start Bumper */}
            <div className="space-y-3">
              <h4 className="font-medium text-text-primary">Start Bumper</h4>

              {/* No Start Bumper Option */}
              <button
                type="button"
                onClick={() => handleStartBumperSelect(null, null)}
                disabled={disabled}
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 border ${
                  !value.startBumperId
                    ? 'border-gold bg-gold/10'
                    : 'border-white-20 bg-white-5 hover:border-white-40'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="w-8 h-8 rounded-full bg-white-20 flex items-center justify-center">
                  <X className="w-4 h-4 text-text-muted" />
                </div>
                <span className="text-sm text-text-primary">No start bumper</span>
                {!value.startBumperId && (
                  <Check className="w-4 h-4 text-gold ml-auto" />
                )}
              </button>

              {/* Start Bumper Grid */}
              {startBumpers.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {startBumpers.map((bumper) => (
                    <BumperCard
                      key={bumper.id}
                      bumper={bumper}
                      selected={value.startBumperId === bumper.id}
                      onClick={() =>
                        handleStartBumperSelect(
                          bumper.id,
                          bumper.type === 'image' ? (bumper.duration || 3) : null
                        )
                      }
                      disabled={disabled}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-white-10 rounded-lg text-text-muted text-sm">
                  No start bumpers available.
                </div>
              )}

              {/* Duration input for image bumpers */}
              {value.startBumperId && startBumpers.find(b => b.id === value.startBumperId)?.type === 'image' && (
                <div className="flex items-center gap-3 p-3 bg-white-5 rounded-lg border border-white-10">
                  <label className="text-sm text-text-secondary">Display duration:</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={value.startBumperDuration || 3}
                    onChange={(e) =>
                      handleStartBumperSelect(
                        value.startBumperId!,
                        Math.max(1, Math.min(10, Number(e.target.value)))
                      )
                    }
                    disabled={disabled}
                    className="w-20 px-2 py-1 bg-navy-dark border border-white-20 rounded text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                  <span className="text-sm text-text-muted">seconds</span>
                </div>
              )}
            </div>

            {/* End Bumper */}
            <div className="space-y-3">
              <h4 className="font-medium text-text-primary">End Bumper</h4>

              {/* No End Bumper Option */}
              <button
                type="button"
                onClick={() => handleEndBumperSelect(null, null)}
                disabled={disabled}
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 border ${
                  !value.endBumperId
                    ? 'border-gold bg-gold/10'
                    : 'border-white-20 bg-white-5 hover:border-white-40'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="w-8 h-8 rounded-full bg-white-20 flex items-center justify-center">
                  <X className="w-4 h-4 text-text-muted" />
                </div>
                <span className="text-sm text-text-primary">No end bumper</span>
                {!value.endBumperId && (
                  <Check className="w-4 h-4 text-gold ml-auto" />
                )}
              </button>

              {/* End Bumper Grid */}
              {endBumpers.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {endBumpers.map((bumper) => (
                    <BumperCard
                      key={bumper.id}
                      bumper={bumper}
                      selected={value.endBumperId === bumper.id}
                      onClick={() =>
                        handleEndBumperSelect(
                          bumper.id,
                          bumper.type === 'image' ? (bumper.duration || 3) : null
                        )
                      }
                      disabled={disabled}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-white-10 rounded-lg text-text-muted text-sm">
                  No end bumpers available.
                </div>
              )}

              {/* Duration input for image bumpers */}
              {value.endBumperId && endBumpers.find(b => b.id === value.endBumperId)?.type === 'image' && (
                <div className="flex items-center gap-3 p-3 bg-white-5 rounded-lg border border-white-10">
                  <label className="text-sm text-text-secondary">Display duration:</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={value.endBumperDuration || 3}
                    onChange={(e) =>
                      handleEndBumperSelect(
                        value.endBumperId!,
                        Math.max(1, Math.min(10, Number(e.target.value)))
                      )
                    }
                    disabled={disabled}
                    className="w-20 px-2 py-1 bg-navy-dark border border-white-20 rounded text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                  <span className="text-sm text-text-muted">seconds</span>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="p-3 bg-white-5 rounded-lg border border-white-10">
              <p className="text-xs text-text-muted">
                <strong className="text-text-secondary">Configuration:</strong>{' '}
                {value.startBumperId ? 'Start bumper' : 'No start bumper'}
                {value.startBumperDuration ? ` (${value.startBumperDuration}s)` : ''}
                {' • '}
                {value.endBumperId ? 'End bumper' : 'No end bumper'}
                {value.endBumperDuration ? ` (${value.endBumperDuration}s)` : ''}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
