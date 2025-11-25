import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesApi } from '../client';
import type { CreateArticleRequest } from '../../api.types';

// Query Keys
export const articleQueryKeys = {
  articles: ['articles'] as const,
  article: (id: string) => ['articles', id] as const,
};

// Article Hooks

export function useArticles() {
  return useQuery({
    queryKey: articleQueryKeys.articles,
    queryFn: articlesApi.getAll,
  });
}

export function useArticle(id: string, orgSlug?: string) {
  return useQuery({
    queryKey: articleQueryKeys.article(id),
    queryFn: () => orgSlug ? articlesApi.getByIdInOrg(id, orgSlug) : articlesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateArticleRequest) => articlesApi.create(data),
    onSuccess: () => {
      // Invalidate articles list to refetch
      queryClient.invalidateQueries({ queryKey: articleQueryKeys.articles });
    },
  });
}

// Article approval hooks
export function useApproveArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ articleId, orgSlug }: { articleId: string; orgSlug?: string }) =>
      orgSlug ? articlesApi.approveArticleInOrg(articleId, orgSlug) : articlesApi.approveArticle(articleId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: articleQueryKeys.article(variables.articleId) });
      const previousArticle = queryClient.getQueryData(articleQueryKeys.article(variables.articleId));

      queryClient.setQueryData(articleQueryKeys.article(variables.articleId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          isApproved: true,
          approvedAt: new Date().toISOString(),
        };
      });

      return { previousArticle };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousArticle) {
        queryClient.setQueryData(articleQueryKeys.article(variables.articleId), context.previousArticle);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: articleQueryKeys.article(variables.articleId) });
      queryClient.invalidateQueries({ queryKey: articleQueryKeys.articles });
    },
  });
}

export function useUnapproveArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ articleId, orgSlug }: { articleId: string; orgSlug?: string }) =>
      orgSlug ? articlesApi.unapproveArticleInOrg(articleId, orgSlug) : articlesApi.unapproveArticle(articleId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: articleQueryKeys.article(variables.articleId) });
      const previousArticle = queryClient.getQueryData(articleQueryKeys.article(variables.articleId));

      queryClient.setQueryData(articleQueryKeys.article(variables.articleId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          isApproved: false,
          approvedAt: null,
          approvedBy: null,
        };
      });

      return { previousArticle };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousArticle) {
        queryClient.setQueryData(articleQueryKeys.article(variables.articleId), context.previousArticle);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: articleQueryKeys.article(variables.articleId) });
      queryClient.invalidateQueries({ queryKey: articleQueryKeys.articles });
    },
  });
}

// Article Thumbnails
export function useRegenerateArticleThumbnail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ articleId, prompt, orgSlug }: { articleId: string; prompt: string; orgSlug?: string }) =>
      orgSlug ? articlesApi.regenerateThumbnailInOrg(articleId, orgSlug, prompt) : articlesApi.regenerateThumbnail(articleId, prompt),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: articleQueryKeys.article(variables.articleId) });
    },
  });
}

export function useUploadArticleThumbnail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ articleId, file, orgSlug }: { articleId: string; file: File; orgSlug?: string }) =>
      orgSlug ? articlesApi.uploadThumbnailInOrg(articleId, orgSlug, file) : articlesApi.uploadThumbnail(articleId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: articleQueryKeys.article(variables.articleId) });
    },
  });
}
