'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useSubmissions, useArticles } from '@/lib/api/hooks';
import { Search, Loader2 } from 'lucide-react';
import { MediaCard } from '@/components/media/MediaCard';

type MediaType = 'all' | 'videos' | 'podcasts' | 'audio' | 'quizzes' | 'articles';
type ApprovalStatus = 'all' | 'approved' | 'pending';

export default function OrgLibraryPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const [activeFilter, setActiveFilter] = useState<MediaType>('all');
  const [approvalFilter, setApprovalFilter] = useState<ApprovalStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading } = useSubmissions(orgSlug, 1, 100, true);
  const { data: articles = [], isLoading: articlesLoading } = useArticles(orgSlug);

  // Extract all media items from submissions
  const allVideos =
    data?.submissions?.flatMap((sub) => {
      return (
        sub.videoOutputs?.map((vo) => ({
          type: 'video' as const,
          id: vo.id,
          title: vo.title || sub.article?.title || 'Untitled Video',
          thumbnailUrl: vo.thumbnailUrl,
          duration: vo.duration ? `${Math.floor(vo.duration / 60)}:${(vo.duration % 60).toString().padStart(2, '0')}` : null,
          articleTitle: sub.article?.title,
          submissionId: sub.id,
          isApproved: vo.isApproved,
          status: vo.status || 'COMPLETED',
          createdAt: vo.createdAt,
        })) || []
      );
    }) || [];

  const allPodcasts =
    data?.submissions?.flatMap((sub) => {
      return (
        sub.podcastOutputs?.map((po) => ({
          type: 'podcast' as const,
          id: po.id,
          title: po.title || sub.article?.title || 'Untitled Podcast',
          thumbnailUrl: po.thumbnailUrl,
          duration: po.duration ? `${Math.floor(po.duration / 60)} min` : null,
          articleTitle: sub.article?.title,
          submissionId: sub.id,
          isApproved: po.isApproved,
          status: po.status || 'COMPLETED',
          createdAt: po.createdAt,
        })) || []
      );
    }) || [];

  const allAudio =
    data?.submissions?.flatMap((sub) => {
      return (
        sub.audioOutputs?.map((ao) => ({
          type: 'audio' as const,
          id: ao.id,
          title: sub.article?.title || 'Untitled Audio',
          duration: ao.duration ? `${Math.floor(ao.duration / 60)} min` : null,
          articleTitle: sub.article?.title,
          submissionId: sub.id,
          isApproved: ao.isApproved,
          status: ao.status || 'COMPLETED',
          createdAt: ao.createdAt,
        })) || []
      );
    }) || [];

  const allQuizzes =
    data?.submissions?.flatMap((sub) => {
      return (
        sub.quizOutputs?.map((qo) => ({
          type: 'quiz' as const,
          id: qo.id,
          title: sub.article?.title || 'Untitled Quiz',
          duration: null,
          articleTitle: sub.article?.title,
          submissionId: sub.id,
          isApproved: qo.isApproved,
          status: qo.status || 'COMPLETED',
          createdAt: qo.createdAt,
        })) || []
      );
    }) || [];

  const allArticles = articles.map((article) => ({
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
  }));

  // Combine and filter
  let allMedia = [...allVideos, ...allPodcasts, ...allAudio, ...allQuizzes, ...allArticles];

  if (activeFilter !== 'all') {
    allMedia = allMedia.filter((item) => {
      if (activeFilter === 'videos') return item.type === 'video';
      if (activeFilter === 'podcasts') return item.type === 'podcast';
      if (activeFilter === 'audio') return item.type === 'audio';
      if (activeFilter === 'quizzes') return item.type === 'quiz';
      if (activeFilter === 'articles') return item.type === 'article';
      return true;
    });
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    allMedia = allMedia.filter((item) => item.title.toLowerCase().includes(query) || item.articleTitle?.toLowerCase().includes(query));
  }

  // Filter by approval status
  if (approvalFilter !== 'all') {
    allMedia = allMedia.filter((item) => {
      if (approvalFilter === 'approved') return item.isApproved === true;
      if (approvalFilter === 'pending') return item.isApproved === false;
      return true;
    });
  }

  // Sort by created date (newest first)
  allMedia.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
          <input type="text" placeholder="Search by title or article..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input w-full pl-10" />
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

        {/* Media Type Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === 'all' ? 'bg-gold text-navy-primary' : 'bg-white-10 text-text-secondary hover:bg-white-20'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('videos')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === 'videos' ? 'bg-gold text-navy-primary' : 'bg-white-10 text-text-secondary hover:bg-white-20'
            }`}
          >
            Videos
          </button>
          <button
            onClick={() => setActiveFilter('podcasts')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === 'podcasts' ? 'bg-gold text-navy-primary' : 'bg-white-10 text-text-secondary hover:bg-white-20'
            }`}
          >
            Podcasts
          </button>
          <button
            onClick={() => setActiveFilter('audio')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === 'audio' ? 'bg-gold text-navy-primary' : 'bg-white-10 text-text-secondary hover:bg-white-20'
            }`}
          >
            Audio
          </button>
          <button
            onClick={() => setActiveFilter('quizzes')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === 'quizzes' ? 'bg-gold text-navy-primary' : 'bg-white-10 text-text-secondary hover:bg-white-20'
            }`}
          >
            Quizzes
          </button>
          <button
            onClick={() => setActiveFilter('articles')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === 'articles' ? 'bg-gold text-navy-primary' : 'bg-white-10 text-text-secondary hover:bg-white-20'
            }`}
          >
            Articles
          </button>
        </div>
      </div>

      {/* Results */}
      {(isLoading || articlesLoading) ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-6 h-6 text-blue-accent animate-spin" />
        </div>
      ) : allMedia.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-text-muted">{searchQuery ? `No results found for "${searchQuery}"` : 'No media in library yet'}</p>
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
                thumbnailUrl={'thumbnailUrl' in item ? item.thumbnailUrl : undefined}
                status={item.status}
                isApproved={item.isApproved}
                submissionId={item.submissionId}
                articleId={'articleId' in item ? item.articleId : undefined}
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
