import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from '../client';

// Query Keys
const submissionQueryKey = (orgSlug: string, id: string) => ['submissions', orgSlug, id] as const;

// Tag Management Hooks - Interactive Podcast

export function useAddInteractivePodcastTag(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, ipId, tagId }: { submissionId: string; ipId: string; tagId: string }) =>
      submissionsApi.addInteractivePodcastTag(orgSlug, submissionId, ipId, { tagId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

export function useRemoveInteractivePodcastTag(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, ipId, tagId }: { submissionId: string; ipId: string; tagId: string }) =>
      submissionsApi.removeInteractivePodcastTag(orgSlug, submissionId, ipId, tagId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}
