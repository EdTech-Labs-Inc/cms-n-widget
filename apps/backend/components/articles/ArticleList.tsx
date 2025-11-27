'use client';

import { useState } from 'react';
import { Plus, Loader2, FileText, Search, AlertCircle } from 'lucide-react';
import { useArticles } from '@/lib/api/hooks';
import { MediaCard } from '@/components/media/MediaCard';
import Link from 'next/link';

type ApprovalStatus = 'all' | 'approved' | 'pending';

interface ArticleListProps {
  orgSlug: string;
}

export function ArticleList({ orgSlug }: ArticleListProps) {
  const { data: articles = [], isLoading, error } = useArticles(orgSlug);
  const basePath = orgSlug ? `/org/${orgSlug}` : '';
  const [approvalFilter, setApprovalFilter] = useState<ApprovalStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-6 h-6 text-blue-accent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-400" />
        <p className="text-red-400">Failed to load articles. Please try again.</p>
      </div>
    );
  }

  // Filter by approval status
  let filteredArticles = articles || [];
  if (approvalFilter === 'approved') {
    filteredArticles = filteredArticles.filter((a) => a.isApproved === true);
  } else if (approvalFilter === 'pending') {
    filteredArticles = filteredArticles.filter((a) => a.isApproved === false || !a.isApproved);
  }

  // Filter by search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredArticles = filteredArticles.filter((a) =>
      a.title.toLowerCase().includes(query) || a.content.toLowerCase().includes(query)
    );
  }

  if (filteredArticles.length === 0) {
    return (
      <div>
        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pl-10"
            />
          </div>

          {/* Approval Status Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setApprovalFilter('all')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                approvalFilter === 'all' ? 'bg-blue-accent text-white' : 'bg-white-10 text-text-secondary hover:bg-white-20'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setApprovalFilter('approved')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                approvalFilter === 'approved' ? 'bg-success text-white' : 'bg-white-10 text-text-secondary hover:bg-white-20'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setApprovalFilter('pending')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                approvalFilter === 'pending' ? 'bg-gold text-navy-primary' : 'bg-white-10 text-text-secondary hover:bg-white-20'
              }`}
            >
              Pending Approval
            </button>
          </div>
        </div>

        {/* Empty State */}
        <div className="card p-12 text-center">
          <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-muted mb-4">No articles found</p>
          <Link href={`${basePath}/articles/new`} className="btn btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Your First Article
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input w-full pl-10"
          />
        </div>

        {/* Approval Status Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setApprovalFilter('all')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              approvalFilter === 'all' ? 'bg-blue-accent text-white' : 'bg-white-10 text-text-secondary hover:bg-white-20'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setApprovalFilter('approved')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              approvalFilter === 'approved' ? 'bg-success text-white' : 'bg-white-10 text-text-secondary hover:bg-white-20'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setApprovalFilter('pending')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              approvalFilter === 'pending' ? 'bg-gold text-navy-primary' : 'bg-white-10 text-text-secondary hover:bg-white-20'
            }`}
          >
            Pending Approval
          </button>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredArticles.map((article) => (
          <MediaCard
            key={article.id}
            id={article.id}
            type="article"
            title={article.title}
            thumbnailUrl={article.thumbnailUrl}
            status="COMPLETED"
            isApproved={article.isApproved}
            articleId={article.id}
          />
        ))}
      </div>
    </div>
  );
}
