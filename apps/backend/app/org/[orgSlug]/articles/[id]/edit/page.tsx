'use client';

import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useArticle, useApproveArticle, useUnapproveArticle, useRegenerateArticleThumbnail, useUploadArticleThumbnail } from '@/lib/api/hooks';
import { useToast } from '@/components/ui/ToastContainer';
import { MediaEditLayout } from '@/components/layout/MediaEditLayout';
import { ThumbnailManager } from '@/components/media/ThumbnailManager';

export default function OrgArticleEditPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const articleId = params.id as string;
  const toast = useToast();

  // Data fetching
  const { data: article, isLoading } = useArticle(articleId, orgSlug);

  // Mutations
  const approveArticle = useApproveArticle();
  const unapproveArticle = useUnapproveArticle();
  const regenerateArticleThumbnail = useRegenerateArticleThumbnail();
  const uploadArticleThumbnail = useUploadArticleThumbnail();

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col justify-center items-center py-12 gap-3">
          <Loader2 className="w-8 h-8 text-blue-accent animate-spin" />
          <div className="text-text-secondary">Loading article...</div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="card p-6">
          <p className="text-red-400">Article not found</p>
        </div>
      </div>
    );
  }

  // Approval handlers
  const handleApprove = () => {
    approveArticle.mutate(
      { articleId, orgSlug },
      {
        onSuccess: () => toast.success('Article approved', 'Article has been approved'),
        onError: (error: any) => toast.error('Failed to approve article', error?.message || 'Please try again'),
      }
    );
  };

  const handleUnapprove = () => {
    unapproveArticle.mutate(
      { articleId, orgSlug },
      {
        onSuccess: () => toast.success('Approval withdrawn', 'Article approval has been withdrawn'),
        onError: (error: any) => toast.error('Failed to withdraw approval', error?.message || 'Please try again'),
      }
    );
  };

  return (
    <MediaEditLayout
      title={article.title}
      backUrl={`/org/${orgSlug}/articles`}
      backLabel="Back to Articles"
      isApproved={article.isApproved}
      approvedAt={article.approvedAt}
      onApprove={handleApprove}
      onUnapprove={handleUnapprove}
      isApproving={approveArticle.isPending || unapproveArticle.isPending}
      previewContent={
        <div className="card p-6">
          <h2 className="text-2xl font-bold text-text-primary mb-4">{article.title}</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-text-secondary whitespace-pre-wrap">{article.content}</p>
          </div>
          <div className="mt-6 pt-6 border-t border-white-10">
            <div className="flex flex-wrap gap-4 text-sm text-text-muted">
              <div>
                <span className="font-medium">Category:</span> {article.category}
              </div>
              <div>
                <span className="font-medium">Created:</span>{' '}
                {new Date(article.createdAt).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Updated:</span>{' '}
                {new Date(article.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Article Info Card */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Article Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Title</label>
              <div className="text-text-primary">{article.title}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Category</label>
              <div className="text-text-primary">{article.category}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Content</label>
              <div className="text-text-primary whitespace-pre-wrap max-h-96 overflow-y-auto p-4 bg-white-5 rounded-lg">
                {article.content}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white-10">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Created</label>
                <div className="text-text-primary text-sm">
                  {new Date(article.createdAt).toLocaleDateString()} at{' '}
                  {new Date(article.createdAt).toLocaleTimeString()}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Last Updated</label>
                <div className="text-text-primary text-sm">
                  {new Date(article.updatedAt).toLocaleDateString()} at{' '}
                  {new Date(article.updatedAt).toLocaleTimeString()}
                </div>
              </div>
            </div>

            {article.approvedAt && (
              <div className="pt-4 border-t border-white-10">
                <label className="block text-sm font-medium text-text-secondary mb-1">Approved</label>
                <div className="text-text-primary text-sm">
                  {new Date(article.approvedAt).toLocaleDateString()} at{' '}
                  {new Date(article.approvedAt).toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Thumbnail Manager */}
        <ThumbnailManager
          thumbnailUrl={article.thumbnailUrl}
          itemTitle={article.title}
          onRegenerateSuccess={(newThumbnailUrl) => {
            // Optimistically update will be handled by query invalidation
          }}
          onUploadSuccess={(newThumbnailUrl) => {
            // Optimistically update will be handled by query invalidation
          }}
          regenerateMutation={{
            mutate: (data: { prompt: string }, options?: any) =>
              regenerateArticleThumbnail.mutate({ articleId, prompt: data.prompt, orgSlug }, options),
            isPending: regenerateArticleThumbnail.isPending,
          }}
          uploadMutation={{
            mutate: (file: File, options?: any) =>
              uploadArticleThumbnail.mutate({ articleId, file, orgSlug }, options),
            isPending: uploadArticleThumbnail.isPending,
          }}
        />
      </div>
    </MediaEditLayout>
  );
}
