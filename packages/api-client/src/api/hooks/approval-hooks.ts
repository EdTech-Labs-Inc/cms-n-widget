import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from '../client';

// Query Keys
const submissionQueryKey = (orgSlug: string, id: string) => ['submissions', orgSlug, id] as const;

// Approval Hooks

export function useApproveAudio(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, audioId }: { submissionId: string; audioId: string }) =>
      submissionsApi.approveAudio(orgSlug, submissionId, audioId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
      const previousSubmission = queryClient.getQueryData(submissionQueryKey(orgSlug, variables.submissionId));

      queryClient.setQueryData(submissionQueryKey(orgSlug, variables.submissionId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          audioOutputs: old.audioOutputs?.map((ao: any) => (ao.id === variables.audioId ? { ...ao, isApproved: true, approvedAt: new Date().toISOString() } : ao)),
        };
      });

      return { previousSubmission };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousSubmission) {
        queryClient.setQueryData(submissionQueryKey(orgSlug, variables.submissionId), context.previousSubmission);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

export function useUnapproveAudio(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, audioId }: { submissionId: string; audioId: string }) =>
      submissionsApi.unapproveAudio(orgSlug, submissionId, audioId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
      const previousSubmission = queryClient.getQueryData(submissionQueryKey(orgSlug, variables.submissionId));

      queryClient.setQueryData(submissionQueryKey(orgSlug, variables.submissionId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          audioOutputs: old.audioOutputs?.map((ao: any) => (ao.id === variables.audioId ? { ...ao, isApproved: false, approvedAt: null } : ao)),
        };
      });

      return { previousSubmission };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousSubmission) {
        queryClient.setQueryData(submissionQueryKey(orgSlug, variables.submissionId), context.previousSubmission);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

export function useApprovePodcast(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, podcastId }: { submissionId: string; podcastId: string }) =>
      submissionsApi.approvePodcast(orgSlug, submissionId, podcastId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
      const previousSubmission = queryClient.getQueryData(submissionQueryKey(orgSlug, variables.submissionId));

      queryClient.setQueryData(submissionQueryKey(orgSlug, variables.submissionId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          podcastOutputs: old.podcastOutputs?.map((po: any) => (po.id === variables.podcastId ? { ...po, isApproved: true, approvedAt: new Date().toISOString() } : po)),
        };
      });

      return { previousSubmission };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousSubmission) {
        queryClient.setQueryData(submissionQueryKey(orgSlug, variables.submissionId), context.previousSubmission);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

export function useUnapprovePodcast(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, podcastId }: { submissionId: string; podcastId: string }) =>
      submissionsApi.unapprovePodcast(orgSlug, submissionId, podcastId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
      const previousSubmission = queryClient.getQueryData(submissionQueryKey(orgSlug, variables.submissionId));

      queryClient.setQueryData(submissionQueryKey(orgSlug, variables.submissionId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          podcastOutputs: old.podcastOutputs?.map((po: any) => (po.id === variables.podcastId ? { ...po, isApproved: false, approvedAt: null } : po)),
        };
      });

      return { previousSubmission };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousSubmission) {
        queryClient.setQueryData(submissionQueryKey(orgSlug, variables.submissionId), context.previousSubmission);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

export function useApproveVideo(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, videoId }: { submissionId: string; videoId: string }) =>
      submissionsApi.approveVideo(orgSlug, submissionId, videoId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
      const previousSubmission = queryClient.getQueryData(submissionQueryKey(orgSlug, variables.submissionId));

      queryClient.setQueryData(submissionQueryKey(orgSlug, variables.submissionId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          videoOutputs: old.videoOutputs?.map((vo: any) => (vo.id === variables.videoId ? { ...vo, isApproved: true, approvedAt: new Date().toISOString() } : vo)),
        };
      });

      return { previousSubmission };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousSubmission) {
        queryClient.setQueryData(submissionQueryKey(orgSlug, variables.submissionId), context.previousSubmission);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

export function useUnapproveVideo(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, videoId }: { submissionId: string; videoId: string }) =>
      submissionsApi.unapproveVideo(orgSlug, submissionId, videoId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
      const previousSubmission = queryClient.getQueryData(submissionQueryKey(orgSlug, variables.submissionId));

      queryClient.setQueryData(submissionQueryKey(orgSlug, variables.submissionId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          videoOutputs: old.videoOutputs?.map((vo: any) => (vo.id === variables.videoId ? { ...vo, isApproved: false, approvedAt: null } : vo)),
        };
      });

      return { previousSubmission };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousSubmission) {
        queryClient.setQueryData(submissionQueryKey(orgSlug, variables.submissionId), context.previousSubmission);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

export function useApproveQuiz(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, quizId }: { submissionId: string; quizId: string }) =>
      submissionsApi.approveQuiz(orgSlug, submissionId, quizId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
      const previousSubmission = queryClient.getQueryData(submissionQueryKey(orgSlug, variables.submissionId));

      queryClient.setQueryData(submissionQueryKey(orgSlug, variables.submissionId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          quizOutputs: old.quizOutputs?.map((qo: any) => (qo.id === variables.quizId ? { ...qo, isApproved: true, approvedAt: new Date().toISOString() } : qo)),
        };
      });

      return { previousSubmission };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousSubmission) {
        queryClient.setQueryData(submissionQueryKey(orgSlug, variables.submissionId), context.previousSubmission);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

export function useUnapproveQuiz(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, quizId }: { submissionId: string; quizId: string }) =>
      submissionsApi.unapproveQuiz(orgSlug, submissionId, quizId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
      const previousSubmission = queryClient.getQueryData(submissionQueryKey(orgSlug, variables.submissionId));

      queryClient.setQueryData(submissionQueryKey(orgSlug, variables.submissionId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          quizOutputs: old.quizOutputs?.map((qo: any) => (qo.id === variables.quizId ? { ...qo, isApproved: false, approvedAt: null } : qo)),
        };
      });

      return { previousSubmission };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousSubmission) {
        queryClient.setQueryData(submissionQueryKey(orgSlug, variables.submissionId), context.previousSubmission);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

export function useApproveInteractivePodcast(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, ipId }: { submissionId: string; ipId: string }) =>
      submissionsApi.approveInteractivePodcast(orgSlug, submissionId, ipId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
      const previousSubmission = queryClient.getQueryData(submissionQueryKey(orgSlug, variables.submissionId));

      queryClient.setQueryData(submissionQueryKey(orgSlug, variables.submissionId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          interactivePodcastOutputs: old.interactivePodcastOutputs?.map((ipo: any) =>
            ipo.id === variables.ipId ? { ...ipo, isApproved: true, approvedAt: new Date().toISOString() } : ipo,
          ),
        };
      });

      return { previousSubmission };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousSubmission) {
        queryClient.setQueryData(submissionQueryKey(orgSlug, variables.submissionId), context.previousSubmission);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

export function useUnapproveInteractivePodcast(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, ipId }: { submissionId: string; ipId: string }) =>
      submissionsApi.unapproveInteractivePodcast(orgSlug, submissionId, ipId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
      const previousSubmission = queryClient.getQueryData(submissionQueryKey(orgSlug, variables.submissionId));

      queryClient.setQueryData(submissionQueryKey(orgSlug, variables.submissionId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          interactivePodcastOutputs: old.interactivePodcastOutputs?.map((ipo: any) =>
            ipo.id === variables.ipId ? { ...ipo, isApproved: false, approvedAt: null } : ipo,
          ),
        };
      });

      return { previousSubmission };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousSubmission) {
        queryClient.setQueryData(submissionQueryKey(orgSlug, variables.submissionId), context.previousSubmission);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}
