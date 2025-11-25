import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from '../client';

// Query Keys
const submissionQueryKey = (id: string) => ['submissions', id] as const;

// Media Regeneration Hooks

export function useRegenerateVideoMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, videoId, videoCustomization }: { submissionId: string; videoId: string; videoCustomization?: any }) =>
      submissionsApi.regenerateVideoMedia(submissionId, videoId, videoCustomization),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(variables.submissionId) });
    },
  });
}

export function useRegeneratePodcastMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, podcastId }: { submissionId: string; podcastId: string }) =>
      submissionsApi.regeneratePodcastMedia(submissionId, podcastId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(variables.submissionId) });
    },
  });
}

export function useRegenerateInteractivePodcastMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, ipId }: { submissionId: string; ipId: string }) =>
      submissionsApi.regenerateInteractivePodcastMedia(submissionId, ipId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(variables.submissionId) });
    },
  });
}
