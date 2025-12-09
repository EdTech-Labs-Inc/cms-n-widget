import { useQuery, useMutation } from '@tanstack/react-query';
import { backgroundMusicApi, videoBumpersApi, captionStylesApi, standaloneVideoApi } from '../client';
import type { CreateStandaloneVideoRequest, CreateStandaloneVideoResponse } from '../client';
import type { BackgroundMusic, VideoBumper, CaptionStyle, StandaloneVideo } from '../../api.types';

/**
 * Query keys for video create resources
 */
export const videoCreateQueryKeys = {
  backgroundMusic: (orgSlug: string) => ['background-music', orgSlug] as const,
  videoBumpers: (orgSlug: string) => ['video-bumpers', orgSlug] as const,
  videoBumpersFiltered: (orgSlug: string, position: string) => ['video-bumpers', orgSlug, position] as const,
  captionStyles: (orgSlug: string) => ['caption-styles', orgSlug] as const,
  standaloneVideos: (orgSlug: string) => ['standalone-videos', orgSlug] as const,
};

/**
 * Hook to fetch all background music for an organization
 *
 * @param orgSlug - Organization slug
 * @returns React Query result with background music array
 */
export function useBackgroundMusic(orgSlug: string) {
  return useQuery<BackgroundMusic[]>({
    queryKey: videoCreateQueryKeys.backgroundMusic(orgSlug),
    queryFn: () => backgroundMusicApi.getAll(orgSlug),
    enabled: !!orgSlug,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch all video bumpers for an organization
 * Optionally filter by position (start, end, both)
 *
 * @param orgSlug - Organization slug
 * @param position - Optional position filter
 * @returns React Query result with video bumpers array
 */
export function useVideoBumpers(orgSlug: string, position?: 'start' | 'end' | 'both') {
  return useQuery<VideoBumper[]>({
    queryKey: position
      ? videoCreateQueryKeys.videoBumpersFiltered(orgSlug, position)
      : videoCreateQueryKeys.videoBumpers(orgSlug),
    queryFn: () => videoBumpersApi.getAll(orgSlug, position),
    enabled: !!orgSlug,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch all caption styles for an organization
 *
 * @param orgSlug - Organization slug
 * @returns React Query result with caption styles array
 */
export function useCaptionStyles(orgSlug: string) {
  return useQuery<CaptionStyle[]>({
    queryKey: videoCreateQueryKeys.captionStyles(orgSlug),
    queryFn: () => captionStylesApi.getAll(orgSlug),
    enabled: !!orgSlug,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to create a standalone video
 *
 * @param orgSlug - Organization slug
 * @returns React Query mutation for creating a standalone video
 */
export function useCreateStandaloneVideo(orgSlug: string) {
  return useMutation<CreateStandaloneVideoResponse, Error, CreateStandaloneVideoRequest>({
    mutationFn: (payload) => standaloneVideoApi.create(orgSlug, payload),
  });
}

/**
 * Hook to fetch all standalone videos for an organization
 *
 * @param orgSlug - Organization slug
 * @returns React Query result with standalone videos array
 */
export function useStandaloneVideos(orgSlug: string) {
  return useQuery<StandaloneVideo[]>({
    queryKey: videoCreateQueryKeys.standaloneVideos(orgSlug),
    queryFn: () => standaloneVideoApi.getAll(orgSlug),
    enabled: !!orgSlug,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
