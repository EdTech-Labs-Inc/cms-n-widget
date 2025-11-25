import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from '../client';

// Query Keys
const submissionQueryKey = (id: string) => ['submissions', id] as const;

// Thumbnail Management Hooks

// Video Thumbnails
export function useRegenerateVideoThumbnail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, videoId, prompt }: { submissionId: string; videoId: string; prompt: string }) =>
      submissionsApi.regenerateVideoThumbnail(submissionId, videoId, prompt),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(variables.submissionId) });
    },
  });
}

export function useUploadVideoThumbnail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, videoId, file }: { submissionId: string; videoId: string; file: File }) =>
      submissionsApi.uploadVideoThumbnail(submissionId, videoId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(variables.submissionId) });
    },
  });
}

// Podcast Thumbnails
export function useRegeneratePodcastThumbnail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, podcastId, prompt }: { submissionId: string; podcastId: string; prompt: string }) =>
      submissionsApi.regeneratePodcastThumbnail(submissionId, podcastId, prompt),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(variables.submissionId) });
    },
  });
}

export function useUploadPodcastThumbnail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, podcastId, file }: { submissionId: string; podcastId: string; file: File }) =>
      submissionsApi.uploadPodcastThumbnail(submissionId, podcastId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(variables.submissionId) });
    },
  });
}

// Interactive Podcast Thumbnails
export function useRegenerateInteractivePodcastThumbnail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, ipId, prompt }: { submissionId: string; ipId: string; prompt: string }) =>
      submissionsApi.regenerateInteractivePodcastThumbnail(submissionId, ipId, prompt),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(variables.submissionId) });
    },
  });
}

export function useUploadInteractivePodcastThumbnail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, ipId, file }: { submissionId: string; ipId: string; file: File }) =>
      submissionsApi.uploadInteractivePodcastThumbnail(submissionId, ipId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(variables.submissionId) });
    },
  });
}
