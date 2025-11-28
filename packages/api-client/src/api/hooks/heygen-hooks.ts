import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { heygenApi, type AvatarsResponse } from '../client';

/**
 * Query keys for HeyGen avatar queries
 */
export const heygenQueryKeys = {
  avatars: () => ['heygen', 'avatars'] as const,
};

/**
 * Hook to fetch all avatars from HeyGen
 * Pagination and search filtering is handled on the frontend
 *
 * @returns React Query result with all avatars
 *
 * @example
 * const { data, isLoading, error } = useHeygenAvatars();
 * // data.avatars - Array of ProcessedAvatar
 * // data.total - Total number of avatars
 */
export function useHeygenAvatars() {
  return useQuery({
    queryKey: heygenQueryKeys.avatars(),
    queryFn: () => heygenApi.getAvatars(),
    staleTime: 1000 * 60 * 60, // 1 hour client-side cache (server caches for 24h)
  });
}

/**
 * Hook to refresh the avatar cache (admin use)
 *
 * @returns Mutation to trigger cache refresh
 *
 * @example
 * const { mutate: refreshCache, isPending } = useRefreshAvatarCache();
 * refreshCache();
 */
export function useRefreshAvatarCache() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => heygenApi.refreshAvatarCache(),
    onSuccess: () => {
      // Invalidate all avatar queries to refetch with fresh data
      queryClient.invalidateQueries({ queryKey: heygenQueryKeys.avatars() });
    },
  });
}
