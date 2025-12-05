'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCharacters } from '@/lib/api/hooks';
import { Loader2, ChevronLeft, ChevronRight, Sparkles, Search } from 'lucide-react';

export interface VideoCustomizationConfig {
  characterId: string; // Our DB Character ID (for validation)
  heygenAvatarId: string; // The actual HeyGen avatar/talking_photo ID
  characterType: 'avatar' | 'talking_photo';
  voiceId: string; // ElevenLabs voice ID from linked Voice
  enableMagicZooms: boolean;
  enableMagicBrolls: boolean;
  magicBrollsPercentage: number;
  generateBubbles: boolean;
}

const CHARACTERS_PER_PAGE = 12;

interface VideoCustomizationProps {
  orgSlug: string;
  value: VideoCustomizationConfig;
  onChange: (config: VideoCustomizationConfig) => void;
  disabled?: boolean;
}

export function VideoCustomization({ orgSlug, value, onChange, disabled = false }: VideoCustomizationProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch characters from database
  const {
    data: characters,
    isLoading: charactersLoading,
    isError: charactersError,
  } = useCharacters(orgSlug);

  const allCharacters = characters || [];

  // Filter characters by search query
  const filteredCharacters = useMemo(() => {
    if (!searchQuery.trim()) {
      return allCharacters;
    }
    const query = searchQuery.toLowerCase().trim();
    return allCharacters.filter(character =>
      character.name.toLowerCase().includes(query) ||
      character.characterType.toLowerCase().includes(query) ||
      character.voice?.name?.toLowerCase().includes(query)
    );
  }, [allCharacters, searchQuery]);

  // Calculate pagination on filtered results
  const totalPages = Math.ceil(filteredCharacters.length / CHARACTERS_PER_PAGE);
  const paginatedCharacters = useMemo(() => {
    const startIndex = (currentPage - 1) * CHARACTERS_PER_PAGE;
    return filteredCharacters.slice(startIndex, startIndex + CHARACTERS_PER_PAGE);
  }, [filteredCharacters, currentPage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // No auto-selection - user must explicitly select a character

  const handleCharacterChange = (
    characterId: string,
    heygenAvatarId: string,
    characterType: 'avatar' | 'talking_photo',
    voiceId: string
  ) => {
    onChange({ ...value, characterId, heygenAvatarId, characterType, voiceId });
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
        <label className="block text-text-secondary text-sm font-medium mb-3">
          Character
        </label>

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
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search characters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white-10 border border-transparent rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold/50 transition-colors"
                disabled={disabled}
              />
            </div>

            {/* Character Grid */}
            {filteredCharacters.length === 0 ? (
              <div className="p-4 bg-white-10 rounded-xl text-text-muted text-sm text-center">
                No characters found matching "{searchQuery}"
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {paginatedCharacters.map((character) => (
                    <label
                      key={character.id}
                      className={`flex flex-col gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                        value.characterId === character.id
                          ? 'bg-gold-light border-gold'
                          : 'bg-white-10 border-transparent hover:bg-white-20'
                      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="radio"
                        name="character"
                        value={character.id}
                        checked={value.characterId === character.id}
                        onChange={() => handleCharacterChange(character.id, character.heygenAvatarId, character.characterType, character.voice.elevenlabsVoiceId)}
                        className="sr-only"
                        disabled={disabled}
                      />
                      <div className="flex items-center gap-3">
                        {character.thumbnailUrl ? (
                          <img
                            src={character.thumbnailUrl}
                            alt={character.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-purple flex items-center justify-center text-white font-bold">
                            {character.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="text-text-primary font-medium">{character.name}</div>
                          <div className="text-xs text-text-muted capitalize">{character.characterType.replace('_', ' ')}</div>
                          <div className="text-xs text-text-muted">Voice: {character.voice?.name}</div>
                        </div>
                      </div>
                    </label>
                  ))}
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
                  Showing {paginatedCharacters.length} of {filteredCharacters.length} characters
                  {searchQuery && ` (filtered from ${allCharacters.length} total)`}
                </div>
              </>
            )}
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
