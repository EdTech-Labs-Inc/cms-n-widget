import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from '../client';
import type { CreateSubmissionRequest } from '../../api.types';

// Query Keys
export const submissionQueryKeys = {
  submissions: (page: number, limit: number, includeOutputs: boolean) => ['submissions', page, limit, includeOutputs] as const,
  submission: (id: string) => ['submissions', id] as const,
};

// Submission Hooks

export function useSubmissions(page: number = 1, limit: number = 20, includeOutputs = false) {
  return useQuery({
    queryKey: submissionQueryKeys.submissions(page, limit, includeOutputs),
    queryFn: () => submissionsApi.getAll(page, limit, includeOutputs),
    refetchInterval: (query) => {
      // Poll every 5 seconds if any submission is processing or pending
      const data = query.state.data;
      const hasActiveSubmissions = data?.submissions?.some((s) => s.status === 'PROCESSING' || s.status === 'PENDING');
      if (hasActiveSubmissions) {
        return 5000;
      }
      return false;
    },
  });
}

export function useSubmission(id: string) {
  return useQuery({
    queryKey: submissionQueryKeys.submission(id),
    queryFn: () => submissionsApi.getById(id),
    enabled: !!id,
    refetchInterval: (query) => {
      // Poll every 5 seconds if submission is processing
      const data = query.state.data;
      if (data?.status === 'PROCESSING' || data?.status === 'PENDING') {
        return 5000;
      }
      return false;
    },
  });
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSubmissionRequest) => submissionsApi.create(data),
    onSuccess: (_, variables) => {
      // Invalidate submissions list
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      // Also invalidate the specific article's data
      queryClient.invalidateQueries({ queryKey: ['articles', variables.articleId] });
    },
  });
}

export function useUpdateQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, quizId, questions }: { submissionId: string; quizId: string; questions: any[] }) => submissionsApi.updateQuiz(submissionId, quizId, questions),
    onSuccess: (_, variables) => {
      // Invalidate the submission to refetch updated data
      queryClient.invalidateQueries({ queryKey: submissionQueryKeys.submission(variables.submissionId) });
    },
  });
}
