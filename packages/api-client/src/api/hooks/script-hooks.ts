import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from '../client';

// Query Keys
const submissionQueryKey = (orgSlug: string, id: string) => ['submissions', orgSlug, id] as const;

// Script Update Hooks

export function useUpdateVideoScript(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, videoId, script }: { submissionId: string; videoId: string; script: string }) =>
      submissionsApi.updateVideoOutput(orgSlug, submissionId, videoId, { script }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

export function useUpdatePodcastScript(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, podcastId, transcript }: { submissionId: string; podcastId: string; transcript: string }) =>
      submissionsApi.updatePodcastScript(orgSlug, submissionId, podcastId, transcript),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

export function useUpdateInteractivePodcastScript(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, ipId, script }: { submissionId: string; ipId: string; script: string }) =>
      submissionsApi.updateInteractivePodcastScript(orgSlug, submissionId, ipId, script),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

// AI Script Regeneration Hooks

export function useRegenerateVideoScript(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, videoId, promptGuidance }: { submissionId: string; videoId: string; promptGuidance: string }) =>
      submissionsApi.regenerateVideoScript(orgSlug, submissionId, videoId, promptGuidance),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

export function useRegeneratePodcastScript(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, podcastId, promptGuidance }: { submissionId: string; podcastId: string; promptGuidance: string }) =>
      submissionsApi.regeneratePodcastScript(orgSlug, submissionId, podcastId, promptGuidance),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

export function useRegenerateInteractivePodcastScript(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, ipId, promptGuidance }: { submissionId: string; ipId: string; promptGuidance: string }) =>
      submissionsApi.regenerateInteractivePodcastScript(orgSlug, submissionId, ipId, promptGuidance),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}
