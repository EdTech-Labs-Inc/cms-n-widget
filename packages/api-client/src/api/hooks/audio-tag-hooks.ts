import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from '../client';

// Query Keys
const submissionQueryKey = (id: string) => ['submissions', id] as const;

// Tag Management Hooks - Audio

export function useAddAudioTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, audioId, tagId }: { submissionId: string; audioId: string; tagId: string }) => submissionsApi.addAudioTag(submissionId, audioId, { tagId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(variables.submissionId) });
    },
  });
}

export function useRemoveAudioTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, audioId, tagId }: { submissionId: string; audioId: string; tagId: string }) => submissionsApi.removeAudioTag(submissionId, audioId, tagId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(variables.submissionId) });
    },
  });
}
