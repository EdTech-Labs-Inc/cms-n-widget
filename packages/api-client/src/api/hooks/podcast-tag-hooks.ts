import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from '../client';

// Query Keys
const submissionQueryKey = (orgSlug: string, id: string) => ['submissions', orgSlug, id] as const;

// Tag Management Hooks - Podcast

export function useAddPodcastTag(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, podcastId, tagId }: { submissionId: string; podcastId: string; tagId: string }) =>
      submissionsApi.addPodcastTag(orgSlug, submissionId, podcastId, { tagId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

export function useRemovePodcastTag(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, podcastId, tagId }: { submissionId: string; podcastId: string; tagId: string }) =>
      submissionsApi.removePodcastTag(orgSlug, submissionId, podcastId, tagId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}
