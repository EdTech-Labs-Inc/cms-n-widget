import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from '../client';

// Query Keys
const submissionQueryKey = (id: string) => ['submissions', id] as const;

// Tag Management Hooks - Quiz

export function useAddQuizTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, quizId, tagId }: { submissionId: string; quizId: string; tagId: string }) => submissionsApi.addQuizTag(submissionId, quizId, { tagId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(variables.submissionId) });
    },
  });
}

export function useRemoveQuizTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, quizId, tagId }: { submissionId: string; quizId: string; tagId: string }) => submissionsApi.removeQuizTag(submissionId, quizId, tagId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(variables.submissionId) });
    },
  });
}
