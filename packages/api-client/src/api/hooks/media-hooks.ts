import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from '../client';
import type { VideoCustomizationConfig } from '../../api.types';

// Query Keys
const submissionQueryKey = (orgSlug: string, id: string) => ['submissions', orgSlug, id] as const;

// ============================================
// Media Regeneration Hooks (for COMPLETED outputs)
// ============================================

export function useRegenerateVideoMedia(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, videoId, videoCustomization }: { submissionId: string; videoId: string; videoCustomization?: any }) =>
      submissionsApi.regenerateVideoMedia(orgSlug, submissionId, videoId, videoCustomization),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

export function useRegeneratePodcastMedia(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, podcastId }: { submissionId: string; podcastId: string }) =>
      submissionsApi.regeneratePodcastMedia(orgSlug, submissionId, podcastId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

export function useRegenerateInteractivePodcastMedia(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, ipId }: { submissionId: string; ipId: string }) =>
      submissionsApi.regenerateInteractivePodcastMedia(orgSlug, submissionId, ipId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

// ============================================
// Media Generation from Script Hooks (for SCRIPT_READY outputs)
// These are used after user reviews/edits script and triggers media generation
// ============================================

export function useGenerateVideoMedia(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      submissionId,
      videoId,
      videoCustomization,
    }: {
      submissionId: string;
      videoId: string;
      videoCustomization: VideoCustomizationConfig;
    }) => submissionsApi.generateVideoMedia(orgSlug, submissionId, videoId, videoCustomization),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

export function useGeneratePodcastMedia(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      submissionId,
      podcastId,
      voiceSelection,
    }: {
      submissionId: string;
      podcastId: string;
      voiceSelection?: {
        interviewerVoiceId?: string;
        guestVoiceId?: string;
      };
    }) => submissionsApi.generatePodcastMedia(orgSlug, submissionId, podcastId, voiceSelection),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}

export function useGenerateInteractivePodcastMedia(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      submissionId,
      ipId,
      voiceSelection,
    }: {
      submissionId: string;
      ipId: string;
      voiceSelection?: {
        voiceId?: string;
      };
    }) => submissionsApi.generateInteractivePodcastMedia(orgSlug, submissionId, ipId, voiceSelection),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(orgSlug, variables.submissionId) });
    },
  });
}
