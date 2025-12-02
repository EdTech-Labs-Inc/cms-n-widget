'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useSubmissions, useArticles, useTags } from '@/lib/api/hooks';
import { Search, Loader2, X } from 'lucide-react';
import { MediaCard } from '@/components/media/MediaCard';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import type { Tag } from '@repo/api-client';

type OutputStatus = 'PENDING' | 'PROCESSING' | 'SCRIPT_READY' | 'COMPLETED' | 'FAILED';

interface MediaItem {
  type: 'video' | 'podcast' | 'audio' | 'quiz' | 'article';
  id: string;
  title: string;
  thumbnailUrl?: string;
  duration: string | null;
  articleTitle?: string;
  submissionId?: string;
  articleId?: string;
  isApproved?: boolean;
  status: OutputStatus;
  createdAt: string;
  tags: Tag[];
  category?: string;
}

export default function OrgLibraryPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  // Filter state - all multi-select arrays
  const [approvalFilter, setApprovalFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Data fetching
  const { data, isLoading } = useSubmissions(orgSlug, 1, 100, true);
  const { data: articles = [], isLoading: articlesLoading } = useArticles(orgSlug);
  const { data: orgTags = [] } = useTags(orgSlug);

  // Build a map of articleId -> unique tags from all outputs
  const articleTagsMap = useMemo(() => {
    const map = new Map<string, Tag[]>();
    data?.submissions?.forEach((sub) => {
      if (!sub.article) return;
      const articleId = sub.article.id;
      const existingTags = map.get(articleId) || [];

      // Collect all tags from all output types (only from COMPLETED outputs)
      const allOutputTags: Tag[] = [
        ...(sub.videoOutputs?.filter((o) => o.status === 'COMPLETED').flatMap((o) => o.tags?.map((t) => t.tag) || []) || []),
        ...(sub.audioOutputs?.filter((o) => o.status === 'COMPLETED').flatMap((o) => o.tags?.map((t) => t.tag) || []) || []),
        ...(sub.podcastOutputs?.filter((o) => o.status === 'COMPLETED').flatMap((o) => o.tags?.map((t) => t.tag) || []) || []),
        ...(sub.quizOutputs?.filter((o) => o.status === 'COMPLETED').flatMap((o) => o.tags?.map((t) => t.tag) || []) || []),
        ...(sub.interactivePodcastOutputs?.filter((o) => o.status === 'COMPLETED').flatMap((o) => o.tags?.map((t) => t.tag) || []) || []),
      ];

      // Deduplicate by tag id
      const uniqueTags = [...existingTags, ...allOutputTags].filter(
        (tag, idx, arr) => arr.findIndex((t) => t.id === tag.id) === idx
      );
      map.set(articleId, uniqueTags);
    });
    return map;
  }, [data?.submissions]);

  // Extract all media items from submissions - only COMPLETED outputs
  const allVideos: MediaItem[] =
    data?.submissions?.flatMap((sub) => {
      return (
        sub.videoOutputs
          ?.filter((vo) => vo.status === 'COMPLETED')
          ?.map((vo) => ({
            type: 'video' as const,
            id: vo.id,
            title: vo.title || sub.article?.title || 'Untitled Video',
            thumbnailUrl: vo.thumbnailUrl,
            duration: vo.duration ? `${Math.floor(vo.duration / 60)}:${(vo.duration % 60).toString().padStart(2, '0')}` : null,
            articleTitle: sub.article?.title,
            submissionId: sub.id,
            isApproved: vo.isApproved,
            status: 'COMPLETED' as const,
            createdAt: vo.createdAt,
            tags: vo.tags?.map((t) => t.tag) || [],
            category: sub.article?.category,
          })) || []
      );
    }) || [];

  const allPodcasts: MediaItem[] =
    data?.submissions?.flatMap((sub) => {
      return (
        sub.podcastOutputs
          ?.filter((po) => po.status === 'COMPLETED')
          ?.map((po) => ({
            type: 'podcast' as const,
            id: po.id,
            title: po.title || sub.article?.title || 'Untitled Podcast',
            thumbnailUrl: po.thumbnailUrl,
            duration: po.duration ? `${Math.floor(po.duration / 60)} min` : null,
            articleTitle: sub.article?.title,
            submissionId: sub.id,
            isApproved: po.isApproved,
            status: 'COMPLETED' as const,
            createdAt: po.createdAt,
            tags: po.tags?.map((t) => t.tag) || [],
            category: sub.article?.category,
          })) || []
      );
    }) || [];

  const allAudio: MediaItem[] =
    data?.submissions?.flatMap((sub) => {
      return (
        sub.audioOutputs
          ?.filter((ao) => ao.status === 'COMPLETED')
          ?.map((ao) => ({
            type: 'audio' as const,
            id: ao.id,
            title: sub.article?.title || 'Untitled Audio',
            duration: ao.duration ? `${Math.floor(ao.duration / 60)} min` : null,
            articleTitle: sub.article?.title,
            submissionId: sub.id,
            isApproved: ao.isApproved,
            status: 'COMPLETED' as const,
            createdAt: ao.createdAt,
            tags: ao.tags?.map((t) => t.tag) || [],
            category: sub.article?.category,
          })) || []
      );
    }) || [];

  const allQuizzes: MediaItem[] =
    data?.submissions?.flatMap((sub) => {
      return (
        sub.quizOutputs
          ?.filter((qo) => qo.status === 'COMPLETED')
          ?.map((qo) => ({
            type: 'quiz' as const,
            id: qo.id,
            title: sub.article?.title || 'Untitled Quiz',
            duration: null,
            articleTitle: sub.article?.title,
            submissionId: sub.id,
            isApproved: qo.isApproved,
            status: 'COMPLETED' as const,
            createdAt: qo.createdAt,
            tags: qo.tags?.map((t) => t.tag) || [],
            category: sub.article?.category,
          })) || []
      );
    }) || [];

  const allArticles: MediaItem[] = articles.map((article) => ({
    type: 'article' as const,
    id: article.id,
    title: article.title,
    thumbnailUrl: article.thumbnailUrl,
    duration: null,
    articleTitle: article.title,
    submissionId: undefined,
    articleId: article.id,
    isApproved: article.isApproved,
    status: 'COMPLETED' as const,
    createdAt: article.createdAt,
    tags: articleTagsMap.get(article.id) || [],
    category: article.category,
  }));

  // Combine and filter
  let allMedia = [...allVideos, ...allPodcasts, ...allAudio, ...allQuizzes, ...allArticles];

  // Search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    allMedia = allMedia.filter(
      (item) => item.title.toLowerCase().includes(query) || item.articleTitle?.toLowerCase().includes(query)
    );
  }

  // Approval filter (OR logic)
  if (approvalFilter.length > 0) {
    allMedia = allMedia.filter((item) => {
      if (approvalFilter.includes('approved') && item.isApproved === true) return true;
      if (approvalFilter.includes('unapproved') && item.isApproved !== true) return true;
      return false;
    });
  }

  // Type filter (OR logic)
  if (typeFilter.length > 0) {
    allMedia = allMedia.filter((item) => typeFilter.includes(item.type));
  }

  // Category filter (OR logic)
  if (categoryFilter.length > 0) {
    allMedia = allMedia.filter((item) => item.category && categoryFilter.includes(item.category));
  }

  // Tag filter (OR logic)
  if (tagFilter.length > 0) {
    if (tagFilter.includes('untagged')) {
      // Special case: show only untagged items
      allMedia = allMedia.filter((item) => item.tags.length === 0);
    } else {
      allMedia = allMedia.filter((item) => tagFilter.some((tagId) => item.tags.some((t) => t.id === tagId)));
    }
  }

  // Sort by created date (newest first)
  allMedia.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Check if any filters are active
  const hasActiveFilters =
    approvalFilter.length > 0 || typeFilter.length > 0 || categoryFilter.length > 0 || tagFilter.length > 0;

  const clearFilters = () => {
    setApprovalFilter([]);
    setTypeFilter([]);
    setCategoryFilter([]);
    setTagFilter([]);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Library</h1>
        <p className="text-text-secondary">Browse all your generated content</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            placeholder="Search by title or article..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input w-full pl-10"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <FilterDropdown
            label="Status"
            options={[
              { value: 'approved', label: 'Approved' },
              { value: 'unapproved', label: 'Unapproved' },
            ]}
            value={approvalFilter}
            onChange={setApprovalFilter}
          />

          <FilterDropdown
            label="Type"
            options={[
              { value: 'video', label: 'Videos' },
              { value: 'podcast', label: 'Podcasts' },
              { value: 'audio', label: 'Audio' },
              { value: 'quiz', label: 'Quizzes' },
              { value: 'article', label: 'Articles' },
            ]}
            value={typeFilter}
            onChange={setTypeFilter}
          />

          <FilterDropdown
            label="Category"
            options={[
              { value: 'EVERGREEN', label: 'Evergreen' },
              { value: 'PERIODIC_UPDATES', label: 'Periodic Updates' },
              { value: 'MARKET_UPDATES', label: 'Market Updates' },
            ]}
            value={categoryFilter}
            onChange={setCategoryFilter}
          />

          <FilterDropdown
            label="Tags"
            options={[
              { value: 'untagged', label: 'Untagged' },
              ...orgTags.map((t) => ({ value: t.id, label: t.name })),
            ]}
            value={tagFilter}
            onChange={setTagFilter}
          />

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              <X className="w-4 h-4" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {isLoading || articlesLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-6 h-6 text-blue-accent animate-spin" />
        </div>
      ) : allMedia.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-text-muted">
            {searchQuery || hasActiveFilters ? 'No results found with current filters' : 'No media in library yet'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-text-muted text-sm mb-4">
            Showing {allMedia.length} item{allMedia.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allMedia.map((item) => (
              <MediaCard
                key={item.id}
                id={item.id}
                type={item.type}
                title={item.title}
                thumbnailUrl={item.thumbnailUrl}
                status={item.status}
                isApproved={item.isApproved}
                submissionId={item.submissionId}
                articleId={item.articleId}
                duration={item.duration}
                orgSlug={orgSlug}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
