'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useCharacters } from '@/lib/api/hooks';
import { Loader2, ChevronLeft, ChevronRight, Sparkles, ArrowLeft } from 'lucide-react';

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

export interface VideoCustomizationConfig {
  characterId: string; // Our DB Character ID - heygenImageKey and voiceId are looked up from Character
  enableMagicZooms: boolean;
  enableMagicBrolls: boolean;
  magicBrollsPercentage: number;
  generateBubbles: boolean;
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

  // Fetch characters from database
  const {
    data: characters,
    isLoading: charactersLoading,
    isError: charactersError,
  } = useCharacters(orgSlug);

  const allCharacters = characters || [];

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
    </div>
  );
}
