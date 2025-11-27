import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { heygenApi, type AvatarsResponse } from '../client';

/**
 * Query keys for HeyGen avatar queries
 */
export const heygenQueryKeys = {
  avatars: (page: number, limit: number) => ['heygen', 'avatars', page, limit] as const,
  allAvatars: () => ['heygen', 'avatars'] as const,
};

/**
 * Hook to fetch paginated avatars from HeyGen
 *
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 12)
 * @returns React Query result with avatars and pagination info
 *
 * @example
 * const { data, isLoading, error } = useHeygenAvatars(1, 12);
 * // data.avatars - Array of ProcessedAvatar
 * // data.pagination - { page, limit, total, totalPages }
 */
export function useHeygenAvatars(page: number = 1, limit: number = 12) {
  return useQuery({
    queryKey: heygenQueryKeys.avatars(page, limit),
    queryFn: () => heygenApi.getAvatars(page, limit),
    staleTime: 1000 * 60 * 60, // 1 hour client-side cache (server caches for 24h)
    placeholderData: (previousData) => previousData, // Keep showing previous data while fetching new page
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
      queryClient.invalidateQueries({ queryKey: heygenQueryKeys.allAvatars() });
    },
  });
}
