import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesApi } from '../client';
import type { CreateArticleRequest } from '../../api.types';

// Query Keys
export const articleQueryKeys = {
  articles: (orgSlug: string) => ['articles', orgSlug] as const,
  article: (orgSlug: string, id: string) => ['articles', orgSlug, id] as const,
};

// Article Hooks

export function useArticles(orgSlug: string) {
  return useQuery({
    queryKey: articleQueryKeys.articles(orgSlug),
    queryFn: () => articlesApi.getAll(orgSlug),
    enabled: !!orgSlug,
  });
}

export function useArticle(orgSlug: string, id: string) {
  return useQuery({
    queryKey: articleQueryKeys.article(orgSlug, id),
    queryFn: () => articlesApi.getById(orgSlug, id),
    enabled: !!orgSlug && !!id,
  });
}

export function useCreateArticle(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateArticleRequest) => articlesApi.create(orgSlug, data),
    onSuccess: () => {
      // Invalidate articles list to refetch
      queryClient.invalidateQueries({ queryKey: articleQueryKeys.articles(orgSlug) });
    },
  });
}

// Article approval hooks
export function useApproveArticle(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (articleId: string) => articlesApi.approveArticle(orgSlug, articleId),
    onMutate: async (articleId) => {
      await queryClient.cancelQueries({ queryKey: articleQueryKeys.article(orgSlug, articleId) });
      const previousArticle = queryClient.getQueryData(articleQueryKeys.article(orgSlug, articleId));

      queryClient.setQueryData(articleQueryKeys.article(orgSlug, articleId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          isApproved: true,
          approvedAt: new Date().toISOString(),
        };
      });

      return { previousArticle };
    },
    onError: (err, articleId, context: any) => {
      if (context?.previousArticle) {
        queryClient.setQueryData(articleQueryKeys.article(orgSlug, articleId), context.previousArticle);
      }
    },
    onSettled: (_, __, articleId) => {
      queryClient.invalidateQueries({ queryKey: articleQueryKeys.article(orgSlug, articleId) });
      queryClient.invalidateQueries({ queryKey: articleQueryKeys.articles(orgSlug) });
    },
  });
}

export function useUnapproveArticle(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (articleId: string) => articlesApi.unapproveArticle(orgSlug, articleId),
    onMutate: async (articleId) => {
      await queryClient.cancelQueries({ queryKey: articleQueryKeys.article(orgSlug, articleId) });
      const previousArticle = queryClient.getQueryData(articleQueryKeys.article(orgSlug, articleId));

      queryClient.setQueryData(articleQueryKeys.article(orgSlug, articleId), (old: any) => {
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
    onError: (err, articleId, context: any) => {
      if (context?.previousArticle) {
        queryClient.setQueryData(articleQueryKeys.article(orgSlug, articleId), context.previousArticle);
      }
    },
    onSettled: (_, __, articleId) => {
      queryClient.invalidateQueries({ queryKey: articleQueryKeys.article(orgSlug, articleId) });
      queryClient.invalidateQueries({ queryKey: articleQueryKeys.articles(orgSlug) });
    },
  });
}

// Article Thumbnails
export function useRegenerateArticleThumbnail(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ articleId, prompt }: { articleId: string; prompt: string }) =>
      articlesApi.regenerateThumbnail(orgSlug, articleId, prompt),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: articleQueryKeys.article(orgSlug, variables.articleId) });
    },
  });
}

export function useUploadArticleThumbnail(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ articleId, file }: { articleId: string; file: File }) =>
      articlesApi.uploadThumbnail(orgSlug, articleId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: articleQueryKeys.article(orgSlug, variables.articleId) });
    },
  });
}
