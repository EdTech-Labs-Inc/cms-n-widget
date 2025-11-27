import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from '../client';
import type { CreateSubmissionRequest } from '../../api.types';

// Query Keys
export const submissionQueryKeys = {
  submissions: (orgSlug: string, page: number, limit: number, includeOutputs: boolean) => ['submissions', orgSlug, page, limit, includeOutputs] as const,
  submission: (orgSlug: string, id: string) => ['submissions', orgSlug, id] as const,
};

// Submission Hooks

export function useSubmissions(orgSlug: string, page: number = 1, limit: number = 20, includeOutputs = false) {
  return useQuery({
    queryKey: submissionQueryKeys.submissions(orgSlug, page, limit, includeOutputs),
    queryFn: () => submissionsApi.getAll(orgSlug, page, limit, includeOutputs),
    enabled: !!orgSlug,
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

export function useSubmission(orgSlug: string, id: string) {
  return useQuery({
    queryKey: submissionQueryKeys.submission(orgSlug, id),
    queryFn: () => submissionsApi.getById(orgSlug, id),
    enabled: !!orgSlug && !!id,
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

export function useCreateSubmission(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSubmissionRequest) => submissionsApi.create(orgSlug, data),
    onSuccess: (_, variables) => {
      // Invalidate submissions list
      queryClient.invalidateQueries({ queryKey: ['submissions', orgSlug] });
      // Also invalidate the specific article's data
      queryClient.invalidateQueries({ queryKey: ['articles', orgSlug, variables.articleId] });
    },
  });
}

export function useUpdateQuiz(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, quizId, questions }: { submissionId: string; quizId: string; questions: any[] }) =>
      submissionsApi.updateQuiz(orgSlug, submissionId, quizId, questions),
    onSuccess: (_, variables) => {
      // Invalidate the submission to refetch updated data
      queryClient.invalidateQueries({ queryKey: submissionQueryKeys.submission(orgSlug, variables.submissionId) });
    },
  });
}
