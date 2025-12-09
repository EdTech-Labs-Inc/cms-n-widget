'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useCharacters } from '@/lib/api/hooks';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface CharacterGroup {
  groupId: string;
  name: string;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  characterCount: number;
}

interface CharacterStepProps {
  orgSlug: string;
  selectedGroupId: string | null;
  onGroupSelect: (groupId: string | null, groupName: string | null, thumbnailUrl: string | null) => void;
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
          <div className="text-white/70 text-xs">{subtitle}</div>
        )}
      </div>
    </button>
  );
}

export function CharacterStep({
  orgSlug,
  selectedGroupId,
  onGroupSelect,
  disabled = false,
}: CharacterStepProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: characters,
    isLoading,
    isError,
  } = useCharacters(orgSlug);

  const allCharacters = characters || [];

  // Group characters by heygenAvatarGroupId
  const characterGroups = useMemo(() => {
    const groupMap = new Map<string, CharacterGroup>();

    for (const character of allCharacters) {
      const groupId = character.heygenAvatarGroupId || `single_${character.id}`;

      if (groupMap.has(groupId)) {
        const group = groupMap.get(groupId)!;
        group.characterCount++;
      } else {
        groupMap.set(groupId, {
          groupId,
          name: character.name,
          thumbnailUrl: character.thumbnailUrl || null,
          previewUrl: character.previewUrl || null,
          characterCount: 1,
        });
      }
    }

    return Array.from(groupMap.values());
  }, [allCharacters]);

  // Pagination
  const totalPages = Math.ceil(characterGroups.length / ITEMS_PER_PAGE);
  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return characterGroups.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [characterGroups, currentPage]);

  const handleGroupSelect = (group: CharacterGroup) => {
    onGroupSelect(group.groupId, group.name, group.thumbnailUrl);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-white-10 rounded-xl">
        <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
        <span className="ml-2 text-text-muted">Loading characters...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
        Failed to load characters. Please try again later.
      </div>
    );
  }

  if (allCharacters.length === 0) {
    return (
      <div className="p-4 bg-white-10 rounded-xl text-text-muted text-sm">
        No characters available. Please contact an administrator to add characters for your organization.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        Select a character for your video:
      </p>

      <div className="grid grid-cols-3 gap-4 justify-items-center">
        {paginatedGroups.map((group) => (
          <div key={group.groupId} className="w-[75%]">
            <AvatarCard
              thumbnailUrl={group.thumbnailUrl}
              previewUrl={group.previewUrl}
              name={group.name}
              subtitle={`${group.characterCount} look${group.characterCount !== 1 ? 's' : ''}`}
              selected={selectedGroupId === group.groupId}
              onClick={() => handleGroupSelect(group)}
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
        Showing {paginatedGroups.length} of {characterGroups.length} characters
      </div>
    </div>
  );
}
