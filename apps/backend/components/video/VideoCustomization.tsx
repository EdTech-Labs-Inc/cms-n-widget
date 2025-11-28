'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSubmagicTemplates, useHeygenAvatars } from '@/lib/api/hooks';
import { Loader2, ChevronLeft, ChevronRight, Sparkles, Search } from 'lucide-react';

export interface VideoCustomizationConfig {
  characterId: string;
  characterType: 'avatar' | 'talking_photo';
  voiceId: string;
  enableCaptions: boolean;
  captionTemplate: string;
  enableMagicZooms: boolean;
  enableMagicBrolls: boolean;
  magicBrollsPercentage: number;
}

const AVATARS_PER_PAGE = 12;

const CAPTION_TEMPLATES = [
  {
    id: 'Ella',
    displayName: 'ELLA',
    thumbnailUrl: 'https://res.cloudinary.com/dphekriyz/image/upload/v1761151032/Screenshot_2025-10-22_at_17.36.40_xy4hgc.png'
  },
  {
    id: 'Sara',
    displayName: 'Sara',
    thumbnailUrl: 'https://res.cloudinary.com/dphekriyz/image/upload/v1761151032/Screenshot_2025-10-22_at_17.36.21_fmbyw7.png'
  },
  {
    id: 'Daniel',
    displayName: 'Daniel',
    thumbnailUrl: 'https://res.cloudinary.com/dphekriyz/image/upload/v1761151032/Screenshot_2025-10-22_at_17.36.33_nupjf3.png'
  },
  {
    id: 'Tracy',
    displayName: 'TRACY',
    thumbnailUrl: 'https://res.cloudinary.com/dphekriyz/image/upload/v1761151033/Screenshot_2025-10-22_at_17.36.45_odmkrg.png'
  }
];

interface VideoCustomizationProps {
  value: VideoCustomizationConfig;
  onChange: (config: VideoCustomizationConfig) => void;
  disabled?: boolean;
}

export function VideoCustomization({ value, onChange, disabled = false }: VideoCustomizationProps) {
  const { data: templates, isLoading: templatesLoading } = useSubmagicTemplates();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch ALL avatars (pagination handled on frontend)
  const {
    data: avatarsData,
    isLoading: avatarsLoading,
    isError: avatarsError,
  } = useHeygenAvatars();

  const allAvatars = avatarsData?.avatars || [];

  // Filter avatars by search query
  const filteredAvatars = useMemo(() => {
    if (!searchQuery.trim()) {
      return allAvatars;
    }
    const query = searchQuery.toLowerCase().trim();
    return allAvatars.filter(avatar =>
      avatar.name.toLowerCase().includes(query) ||
      avatar.type.toLowerCase().includes(query)
    );
  }, [allAvatars, searchQuery]);

  // Calculate pagination on filtered results
  const totalPages = Math.ceil(filteredAvatars.length / AVATARS_PER_PAGE);
  const paginatedAvatars = useMemo(() => {
    const startIndex = (currentPage - 1) * AVATARS_PER_PAGE;
    return filteredAvatars.slice(startIndex, startIndex + AVATARS_PER_PAGE);
  }, [filteredAvatars, currentPage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Set default character when avatars load (if no character is set)
  useEffect(() => {
    if (allAvatars.length > 0 && !value.characterId) {
      const firstAvatar = allAvatars[0];
      onChange({
        ...value,
        characterId: firstAvatar.id,
        characterType: firstAvatar.type,
        voiceId: firstAvatar.voiceId
      });
    }
  }, [allAvatars, value.characterId]);

  const handleCharacterChange = (avatarId: string, characterType: 'avatar' | 'talking_photo', voiceId: string) => {
    onChange({ ...value, characterId: avatarId, characterType, voiceId });
  };

  const handleCaptionsToggle = () => {
    onChange({ ...value, enableCaptions: !value.enableCaptions });
  };

  const handleTemplateChange = (template: string) => {
    onChange({ ...value, captionTemplate: template });
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

        {avatarsLoading ? (
          <div className="flex items-center justify-center p-8 bg-white-10 rounded-xl">
            <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
            <span className="ml-2 text-text-muted">Loading avatars...</span>
          </div>
        ) : avatarsError ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            Failed to load avatars. Please try again later.
          </div>
        ) : allAvatars.length === 0 ? (
          <div className="p-4 bg-white-10 rounded-xl text-text-muted text-sm">
            No avatars available.
          </div>
        ) : (
          <>
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search avatars..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white-10 border border-transparent rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold/50 transition-colors"
                disabled={disabled}
              />
            </div>

            {/* Avatar Grid */}
            {filteredAvatars.length === 0 ? (
              <div className="p-4 bg-white-10 rounded-xl text-text-muted text-sm text-center">
                No avatars found matching "{searchQuery}"
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {paginatedAvatars.map((avatar) => (
                    <label
                      key={avatar.id}
                      className={`flex flex-col gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                        value.characterId === avatar.id
                          ? 'bg-gold-light border-gold'
                          : 'bg-white-10 border-transparent hover:bg-white-20'
                      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="radio"
                        name="character"
                        value={avatar.id}
                        checked={value.characterId === avatar.id}
                        onChange={() => handleCharacterChange(avatar.id, avatar.type, avatar.voiceId)}
                        className="sr-only"
                        disabled={disabled}
                      />
                      <div className="flex items-center gap-3">
                        {avatar.previewUrl ? (
                          <img
                            src={avatar.previewUrl}
                            alt={avatar.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-purple flex items-center justify-center text-white font-bold">
                            {avatar.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="text-text-primary font-medium">{avatar.name}</div>
                          <div className="text-xs text-text-muted capitalize">{avatar.type.replace('_', ' ')}</div>
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
                  Showing {paginatedAvatars.length} of {filteredAvatars.length} avatars
                  {searchQuery && ` (filtered from ${allAvatars.length} total)`}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Captions Toggle */}
      <div>
        <label className="flex items-center gap-3 p-4 rounded-xl bg-white-10 hover:bg-white-20 cursor-pointer transition-all duration-200">
          <input
            type="checkbox"
            checked={value.enableCaptions}
            onChange={handleCaptionsToggle}
            className="w-5 h-5 rounded border-white-40 bg-transparent checked:bg-blue-accent"
            disabled={disabled}
          />
          <div className="flex-1">
            <div className="font-medium text-text-primary">Enable Captions</div>
            <div className="text-sm text-text-muted">Add AI-generated captions to the video</div>
          </div>
        </label>
      </div>

      {/* Caption Template Selection */}
      {value.enableCaptions && (
        <div>
          <label className="block text-text-secondary text-sm font-medium mb-3">
            Caption Style
          </label>
          {templatesLoading ? (
            <div className="flex items-center justify-center p-8 bg-white-10 rounded-xl">
              <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
            </div>
          ) : (() => {
            // Filter templates to only show those available in API response
            const availableTemplates = CAPTION_TEMPLATES.filter(template =>
              templates?.includes(template.id)
            );
            // Fallback to all templates if API fails or returns empty
            const displayTemplates = availableTemplates.length > 0 ? availableTemplates : CAPTION_TEMPLATES;

            return (
              <div className="grid grid-cols-2 gap-3">
                {displayTemplates.map((template) => (
                  <label
                    key={template.id}
                    className={`flex flex-col gap-2 p-3 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                      value.captionTemplate === template.id
                        ? 'bg-gold-light border-gold'
                        : 'bg-white-10 border-transparent hover:bg-white-20'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      name="captionTemplate"
                      value={template.id}
                      checked={value.captionTemplate === template.id}
                      onChange={() => handleTemplateChange(template.id)}
                      className="sr-only"
                      disabled={disabled}
                    />
                    <div className="flex justify-center">
                      <img
                        src={template.thumbnailUrl}
                        alt={template.displayName}
                        className="w-1/2 h-auto object-cover"
                      />
                    </div>
                  </label>
                ))}
              </div>
            );
          })()}
        </div>
      )}

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
    </div>
  );
}
