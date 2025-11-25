import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from '../client';

// Query Keys
const submissionQueryKey = (id: string) => ['submissions', id] as const;

// Tag Management Hooks - Video

export function useAddVideoTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      submissionId,
      videoId,
      tagId,
    }: {
      submissionId: string;
      videoId: string;
      tagId: string;
    }) => submissionsApi.addVideoTag(submissionId, videoId, { tagId }),
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: submissionQueryKey(variables.submissionId) });

      // Snapshot previous value
      const previousSubmission = queryClient.getQueryData(submissionQueryKey(variables.submissionId));

      // Optimistically update to the new value
      queryClient.setQueryData(submissionQueryKey(variables.submissionId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          videoOutputs: old.videoOutputs?.map((vo: any) =>
            vo.id === variables.videoId
              ? {
                  ...vo,
                  tags: [...(vo.tags || []), { id: Date.now().toString(), tag: { id: variables.tagId }, videoOutputId: variables.videoId, tagId: variables.tagId }],
                }
              : vo,
          ),
        };
      });

      return { previousSubmission };
    },
    onError: (err, variables, context: any) => {
      // Rollback on error
      if (context?.previousSubmission) {
        queryClient.setQueryData(submissionQueryKey(variables.submissionId), context.previousSubmission);
      }
    },
    onSettled: (_, __, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(variables.submissionId) });
    },
  });
}

export function useRemoveVideoTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, videoId, tagId }: { submissionId: string; videoId: string; tagId: string }) => submissionsApi.removeVideoTag(submissionId, videoId, tagId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: submissionQueryKey(variables.submissionId) });
      const previousSubmission = queryClient.getQueryData(submissionQueryKey(variables.submissionId));

      queryClient.setQueryData(submissionQueryKey(variables.submissionId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          videoOutputs: old.videoOutputs?.map((vo: any) =>
            vo.id === variables.videoId
              ? {
                  ...vo,
                  tags: vo.tags?.filter((t: any) => t.tagId !== variables.tagId),
                }
              : vo,
          ),
        };
      });

      return { previousSubmission };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousSubmission) {
        queryClient.setQueryData(submissionQueryKey(variables.submissionId), context.previousSubmission);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(variables.submissionId) });
    },
  });
}
