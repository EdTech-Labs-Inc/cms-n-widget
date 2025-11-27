import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from '../client';

// Query Keys
const submissionQueryKey = (orgSlug: string, id: string) => ['submissions', orgSlug, id] as const;

// Media Regeneration Hooks

export function useRegenerateVideoMedia(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, videoId, videoCustomization }: { submissionId: string; videoId: string; videoCustomization?: any }) =>
      submissionsApi.regenerateVideoMedia(orgSlug, submissionId, videoId, videoCustomization),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

export function useRegeneratePodcastMedia(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, podcastId }: { submissionId: string; podcastId: string }) =>
      submissionsApi.regeneratePodcastMedia(orgSlug, submissionId, podcastId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

export function useRegenerateInteractivePodcastMedia(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, ipId }: { submissionId: string; ipId: string }) =>
      submissionsApi.regenerateInteractivePodcastMedia(orgSlug, submissionId, ipId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}
