import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from '../client';

// Query Keys
const submissionQueryKey = (id: string) => ['submissions', id] as const;

// Tag Management Hooks - Podcast

export function useAddPodcastTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, podcastId, tagId }: { submissionId: string; podcastId: string; tagId: string }) =>
      submissionsApi.addPodcastTag(submissionId, podcastId, { tagId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(variables.submissionId) });
    },
  });
}

export function useRemovePodcastTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, podcastId, tagId }: { submissionId: string; podcastId: string; tagId: string }) => submissionsApi.removePodcastTag(submissionId, podcastId, tagId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(variables.submissionId) });
    },
  });
}
