import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsApi } from '../client';
import type { CreateTagRequest, UpdateTagRequest } from '../../api.types';

// Query Keys
export const tagQueryKeys = {
  tags: ['tags'] as const,
  tag: (id: string) => ['tags', id] as const,
  tagCategories: ['tags', 'categories'] as const,
};

// Tag Hooks

export function useTags() {
  return useQuery({
    queryKey: tagQueryKeys.tags,
    queryFn: tagsApi.getAll,
  });
}

export function useTag(id: string) {
  return useQuery({
    queryKey: tagQueryKeys.tag(id),
    queryFn: () => tagsApi.getById(id),
    enabled: !!id,
  });
}

export function useTagCategories() {
  return useQuery({
    queryKey: tagQueryKeys.tagCategories,
    queryFn: tagsApi.getCategories,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTagRequest) => tagsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.tags });
    },
  });
}

export function useBulkCreateTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tags: CreateTagRequest[]) => tagsApi.bulkCreate(tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.tags });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTagRequest }) => tagsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.tags });
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.tag(variables.id) });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tagsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.tags });
    },
  });
}
