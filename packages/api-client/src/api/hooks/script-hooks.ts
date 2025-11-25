import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from '../client';

// Query Keys
const submissionQueryKey = (id: string) => ['submissions', id] as const;

// Script Update Hooks

export function useUpdateVideoScript() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, videoId, script }: { submissionId: string; videoId: string; script: string }) =>
      submissionsApi.updateVideoOutput(submissionId, videoId, { script }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(variables.submissionId) });
    },
  });
}

export function useUpdatePodcastScript() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, podcastId, transcript }: { submissionId: string; podcastId: string; transcript: string }) =>
      submissionsApi.updatePodcastScript(submissionId, podcastId, transcript),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(variables.submissionId) });
    },
  });
}

export function useUpdateInteractivePodcastScript() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, ipId, script }: { submissionId: string; ipId: string; script: string }) =>
      submissionsApi.updateInteractivePodcastScript(submissionId, ipId, script),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(variables.submissionId) });
    },
  });
}

// AI Script Regeneration Hooks

export function useRegenerateVideoScript() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, videoId, promptGuidance }: { submissionId: string; videoId: string; promptGuidance: string }) =>
      submissionsApi.regenerateVideoScript(submissionId, videoId, promptGuidance),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(variables.submissionId) });
    },
  });
}

export function useRegeneratePodcastScript() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, podcastId, promptGuidance }: { submissionId: string; podcastId: string; promptGuidance: string }) =>
      submissionsApi.regeneratePodcastScript(submissionId, podcastId, promptGuidance),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(variables.submissionId) });
    },
  });
}

export function useRegenerateInteractivePodcastScript() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, ipId, promptGuidance }: { submissionId: string; ipId: string; promptGuidance: string }) =>
      submissionsApi.regenerateInteractivePodcastScript(submissionId, ipId, promptGuidance),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(variables.submissionId) });
    },
  });
}
