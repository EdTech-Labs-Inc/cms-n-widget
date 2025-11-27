import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi, heygenApi } from '../client';

// Query Keys
const submissionQueryKey = (orgSlug: string, id: string) => ['submissions', orgSlug, id] as const;

// Video Hooks

export function useUpdateVideoOutput(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, videoId, payload }: { submissionId: string; videoId: string; payload: any }) =>
      submissionsApi.updateVideoOutput(orgSlug, submissionId, videoId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

/**
 * Fetch available HeyGen characters
 */
export function useHeygenCharacters() {
  return useQuery({
    queryKey: ['heygen', 'characters'],
    queryFn: heygenApi.getCharacters,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}
