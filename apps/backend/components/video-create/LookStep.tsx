'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useCharacters } from '@/lib/api/hooks';
import { Loader2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

interface CharacterVariant {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  heygenAvatarId: string;
  characterType: 'avatar' | 'talking_photo';
  voiceId: string;
  voiceName: string;
}

interface LookStepProps {
  orgSlug: string;
  selectedGroupId: string | null;
  selectedCharacterId: string | null;
  onCharacterSelect: (
    characterId: string,
    heygenAvatarId: string,
    heygenCharacterType: 'avatar' | 'talking_photo',
    voiceId: string,
    thumbnailUrl: string | null
  ) => void;
  disabled?: boolean;
}

const ITEMS_PER_PAGE = 6;

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
        videoRef.current.play().catch(() => {});
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

      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-3">
        <div className="text-white font-medium text-sm truncate">{name}</div>
        {subtitle && (
          <div className="text-white/70 text-xs truncate">{subtitle}</div>
        )}
      </div>
    </button>
  );
}

export function LookStep({
  orgSlug,
  selectedGroupId,
  selectedCharacterId,
  onCharacterSelect,
  disabled = false,
}: LookStepProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: characters,
    isLoading,
    isError,
  } = useCharacters(orgSlug);

  const allCharacters = characters || [];

  // Filter characters by selected group
  const groupCharacters = useMemo((): CharacterVariant[] => {
    if (!selectedGroupId) return [];

    return allCharacters
      .filter((char) => {
        const charGroupId = char.heygenAvatarGroupId || `single_${char.id}`;
        return charGroupId === selectedGroupId;
      })
      .map((char) => ({
        id: char.id,
        name: char.name,
        thumbnailUrl: char.thumbnailUrl || null,
        previewUrl: char.previewUrl || null,
        heygenAvatarId: char.heygenAvatarId,
        characterType: char.characterType,
        voiceId: char.voice.elevenlabsVoiceId,
        voiceName: char.voice.name,
      }));
  }, [allCharacters, selectedGroupId]);

  // Reset page when group changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGroupId]);

  // Pagination
  const totalPages = Math.ceil(groupCharacters.length / ITEMS_PER_PAGE);
  const paginatedCharacters = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return groupCharacters.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [groupCharacters, currentPage]);

  const handleCharacterSelect = (variant: CharacterVariant) => {
    onCharacterSelect(
      variant.id,
      variant.heygenAvatarId,
      variant.characterType,
      variant.voiceId,
      variant.thumbnailUrl
    );
  };

  if (!selectedGroupId) {
    return (
      <div className="flex items-center gap-3 p-4 bg-white-10 rounded-lg">
        <AlertCircle className="w-5 h-5 text-text-muted" />
        <p className="text-sm text-text-muted">
          Please select a character first to see available looks.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-white-10 rounded-xl">
        <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
        <span className="ml-2 text-text-muted">Loading looks...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
        Failed to load character looks. Please try again later.
      </div>
    );
  }

  if (groupCharacters.length === 0) {
    return (
      <div className="p-4 bg-white-10 rounded-xl text-text-muted text-sm">
        No looks available for this character.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        Select a background and outfit for your character:
      </p>

      <div className="grid grid-cols-3 gap-4 justify-items-center">
        {paginatedCharacters.map((variant) => (
          <div key={variant.id} className="w-[75%]">
            <AvatarCard
              thumbnailUrl={variant.thumbnailUrl}
              previewUrl={variant.previewUrl}
              name={variant.name}
              subtitle={`Voice: ${variant.voiceName}`}
              selected={selectedCharacterId === variant.id}
              onClick={() => handleCharacterSelect(variant)}
              disabled={disabled}
            />
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

      <div className="text-xs text-text-muted text-center">
        Showing {paginatedCharacters.length} of {groupCharacters.length} looks
      </div>
    </div>
  );
}
