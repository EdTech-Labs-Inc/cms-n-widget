import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsApi } from '../client';
import type { CreateTagRequest, UpdateTagRequest } from '../../api.types';

// Query Keys
export const tagQueryKeys = {
  tags: (orgSlug: string) => ['tags', orgSlug] as const,
  tag: (orgSlug: string, id: string) => ['tags', orgSlug, id] as const,
  tagCategories: (orgSlug: string) => ['tags', orgSlug, 'categories'] as const,
};

// Tag Hooks

export function useTags(orgSlug: string) {
  return useQuery({
    queryKey: tagQueryKeys.tags(orgSlug),
    queryFn: () => tagsApi.getAll(orgSlug),
    enabled: !!orgSlug,
  });
}

export function useTag(orgSlug: string, id: string) {
  return useQuery({
    queryKey: tagQueryKeys.tag(orgSlug, id),
    queryFn: () => tagsApi.getById(orgSlug, id),
    enabled: !!orgSlug && !!id,
  });
}

export function useTagCategories(orgSlug: string) {
  return useQuery({
    queryKey: tagQueryKeys.tagCategories(orgSlug),
    queryFn: () => tagsApi.getCategories(orgSlug),
    enabled: !!orgSlug,
  });
}

export function useCreateTag(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTagRequest) => tagsApi.create(orgSlug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.tags(orgSlug) });
    },
  });
}

export function useBulkCreateTags(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tags: CreateTagRequest[]) => tagsApi.bulkCreate(orgSlug, tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.tags(orgSlug) });
    },
  });
}

export function useUpdateTag(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTagRequest }) => tagsApi.update(orgSlug, id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.tags(orgSlug) });
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.tag(orgSlug, variables.id) });
    },
  });
}

export function useDeleteTag(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tagsApi.delete(orgSlug, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.tags(orgSlug) });
    },
  });
}
