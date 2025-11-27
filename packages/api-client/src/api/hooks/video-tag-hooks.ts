import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from '../client';

// Query Keys
const submissionQueryKey = (orgSlug: string, id: string) => ['submissions', orgSlug, id] as const;

// Tag Management Hooks - Video

export function useAddVideoTag(orgSlug: string) {
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
    }) => submissionsApi.addVideoTag(orgSlug, submissionId, videoId, { tagId }),
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });

      // Snapshot previous value
      const previousSubmission = queryClient.getQueryData(submissionQueryKey(orgSlug, variables.submissionId));

      // Optimistically update to the new value
      queryClient.setQueryData(submissionQueryKey(orgSlug, variables.submissionId), (old: any) => {
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
        queryClient.setQueryData(submissionQueryKey(orgSlug, variables.submissionId), context.previousSubmission);
      }
    },
    onSettled: (_, __, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

export function useRemoveVideoTag(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, videoId, tagId }: { submissionId: string; videoId: string; tagId: string }) =>
      submissionsApi.removeVideoTag(orgSlug, submissionId, videoId, tagId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
      const previousSubmission = queryClient.getQueryData(submissionQueryKey(orgSlug, variables.submissionId));

      queryClient.setQueryData(submissionQueryKey(orgSlug, variables.submissionId), (old: any) => {
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
        queryClient.setQueryData(submissionQueryKey(orgSlug, variables.submissionId), context.previousSubmission);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}
