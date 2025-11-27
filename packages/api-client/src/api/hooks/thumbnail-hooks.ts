import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from '../client';

// Query Keys
const submissionQueryKey = (orgSlug: string, id: string) => ['submissions', orgSlug, id] as const;

// Thumbnail Management Hooks

// Video Thumbnails
export function useRegenerateVideoThumbnail(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, videoId, prompt }: { submissionId: string; videoId: string; prompt: string }) =>
      submissionsApi.regenerateVideoThumbnail(orgSlug, submissionId, videoId, prompt),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

export function useUploadVideoThumbnail(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, videoId, file }: { submissionId: string; videoId: string; file: File }) =>
      submissionsApi.uploadVideoThumbnail(orgSlug, submissionId, videoId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

// Podcast Thumbnails
export function useRegeneratePodcastThumbnail(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, podcastId, prompt }: { submissionId: string; podcastId: string; prompt: string }) =>
      submissionsApi.regeneratePodcastThumbnail(orgSlug, submissionId, podcastId, prompt),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

export function useUploadPodcastThumbnail(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, podcastId, file }: { submissionId: string; podcastId: string; file: File }) =>
      submissionsApi.uploadPodcastThumbnail(orgSlug, submissionId, podcastId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

// Interactive Podcast Thumbnails
export function useRegenerateInteractivePodcastThumbnail(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, ipId, prompt }: { submissionId: string; ipId: string; prompt: string }) =>
      submissionsApi.regenerateInteractivePodcastThumbnail(orgSlug, submissionId, ipId, prompt),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

export function useUploadInteractivePodcastThumbnail(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, ipId, file }: { submissionId: string; ipId: string; file: File }) =>
      submissionsApi.uploadInteractivePodcastThumbnail(orgSlug, submissionId, ipId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}
