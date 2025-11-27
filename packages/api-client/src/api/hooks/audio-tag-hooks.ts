import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from '../client';

// Query Keys
const submissionQueryKey = (orgSlug: string, id: string) => ['submissions', orgSlug, id] as const;

// Tag Management Hooks - Audio

export function useAddAudioTag(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, audioId, tagId }: { submissionId: string; audioId: string; tagId: string }) =>
      submissionsApi.addAudioTag(orgSlug, submissionId, audioId, { tagId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

export function useRemoveAudioTag(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, audioId, tagId }: { submissionId: string; audioId: string; tagId: string }) =>
      submissionsApi.removeAudioTag(orgSlug, submissionId, audioId, tagId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}
