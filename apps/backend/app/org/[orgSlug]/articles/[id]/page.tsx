'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useArticle } from '@/lib/api/hooks';
import Link from 'next/link';

export default function OrgArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const articleId = params.id as string;

  const { data: article, isLoading, error } = useArticle(articleId);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="text-text-secondary">Loading article...</div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="card p-6">
          <p className="text-red-400 mb-4">Article not found</p>
          <Link href={`/org/${orgSlug}/articles`} className="btn btn-secondary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Articles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href={`/org/${orgSlug}/articles`} className="text-blue-accent hover:underline mb-4 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back to Articles
        </Link>
        <h1 className="text-3xl font-bold text-text-primary mb-2">{article.title}</h1>
        <p className="text-text-muted">
          Created {new Date(article.createdAt).toLocaleDateString()} • {article.category}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Article Content */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Article Content</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-text-secondary whitespace-pre-wrap">{article.content}</p>
          </div>
        </div>

        {/* Generate Media */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Generate Media</h2>
          <p className="text-text-secondary mb-6">
            Create interactive learning content from this article
          </p>
          <Link
            href={`/org/${orgSlug}/articles/new?article=${article.id}`}
            className="btn btn-gold inline-flex items-center gap-2 w-full justify-center"
          >
            <Sparkles className="w-5 h-5" />
            Generate Media
          </Link>
        </div>
      </div>
    </div>
  );
}
