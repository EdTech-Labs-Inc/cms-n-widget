import { useQuery } from '@tanstack/react-query';
import { charactersApi, voicesApi } from '../client';
import type { Character, Voice } from '../../api.types';

/**
 * Query keys for character and voice queries
 */
export const characterQueryKeys = {
  characters: (orgSlug: string) => ['characters', orgSlug] as const,
  voices: (orgSlug: string) => ['voices', orgSlug] as const,
};

/**
 * Hook to fetch all characters for an organization
 * Characters include linked voice information for video generation
 *
 * @param orgSlug - Organization slug
 * @returns React Query result with characters array
 *
 * @example
 * const { data: characters, isLoading } = useCharacters(orgSlug);
 */
export function useCharacters(orgSlug: string) {
  return useQuery<Character[]>({
    queryKey: characterQueryKeys.characters(orgSlug),
    queryFn: () => charactersApi.getAll(orgSlug),
    enabled: !!orgSlug,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch all voices for an organization
 * Used for podcast and interactive podcast voice selection
 *
 * @param orgSlug - Organization slug
 * @returns React Query result with voices array
 *
 * @example
 * const { data: voices, isLoading } = useVoices(orgSlug);
 */
export function useVoices(orgSlug: string) {
  return useQuery<Voice[]>({
    queryKey: characterQueryKeys.voices(orgSlug),
    queryFn: () => voicesApi.getAll(orgSlug),
    enabled: !!orgSlug,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
