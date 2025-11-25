import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from '../client';

// Query Keys
const submissionQueryKey = (id: string) => ['submissions', id] as const;

// Tag Management Hooks - Interactive Podcast

export function useAddInteractivePodcastTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, ipId, tagId }: { submissionId: string; ipId: string; tagId: string }) => submissionsApi.addInteractivePodcastTag(submissionId, ipId, { tagId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(variables.submissionId) });
    },
  });
}

export function useRemoveInteractivePodcastTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, ipId, tagId }: { submissionId: string; ipId: string; tagId: string }) => submissionsApi.removeInteractivePodcastTag(submissionId, ipId, tagId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(variables.submissionId) });
    },
  });
}
