'use client';

import { use } from 'react';
import Link from 'next/link';
import { useStandaloneVideos } from '@repo/api-client';
import { PortraitVideoPlayer } from '@/components/video/PortraitVideoPlayer';
import { Loader2, Video, Plus, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface PageProps {
  params: Promise<{ orgSlug: string }>;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
          <CheckCircle className="w-3 h-3" />
          Completed
        </span>
      );
    case 'PROCESSING':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          Processing
        </span>
      );
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    case 'FAILED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
          <AlertCircle className="w-3 h-3" />
          Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-text-muted">
          {status}
        </span>
      );
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function VideosPage({ params }: PageProps) {
  const { orgSlug } = use(params);
  const { data: videos, isLoading, error } = useStandaloneVideos(orgSlug);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
          <p className="text-text-muted">Loading videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">Failed to load videos</h2>
          <p className="text-text-muted">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Videos</h1>
          <p className="text-text-muted mt-1">
            {videos?.length || 0} video{videos?.length !== 1 ? 's' : ''} created
          </p>
        </div>
        <Link
          href={`/org/${orgSlug}/video/create`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-navy-dark font-medium rounded-lg hover:bg-gold/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Video
        </Link>
      </div>

      {/* Videos Grid */}
      {!videos || videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] border border-white-10 rounded-xl bg-white-5">
          <Video className="w-16 h-16 text-text-muted mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">No videos yet</h2>
          <p className="text-text-muted mb-6">Create your first standalone video to get started</p>
          <Link
            href={`/org/${orgSlug}/video/create`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-navy-dark font-medium rounded-lg hover:bg-gold/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Video
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-white-5 border border-white-10 rounded-xl overflow-hidden hover:border-white-20 transition-colors"
            >
              {/* Video Player or Placeholder */}
              {video.status === 'COMPLETED' && video.videoUrl ? (
                <PortraitVideoPlayer
                  videoUrl={video.videoUrl}
                  thumbnailUrl={video.thumbnailUrl}
                  title={video.title}
                  downloadUrl={`/api/org/${orgSlug}/videos/${video.id}/download`}
                />
              ) : (
                <div className="aspect-[9/16] bg-navy-dark flex flex-col items-center justify-center">
                  {video.status === 'PROCESSING' ? (
                    <>
                      <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-3" />
                      <p className="text-text-muted text-sm">Processing...</p>
                    </>
                  ) : video.status === 'FAILED' ? (
                    <>
                      <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
                      <p className="text-red-400 text-sm">Failed</p>
                      {video.error && (
                        <p className="text-text-muted text-xs mt-1 px-4 text-center line-clamp-2">
                          {video.error}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <Clock className="w-10 h-10 text-yellow-400 mb-3" />
                      <p className="text-text-muted text-sm">Pending</p>
                    </>
                  )}
                </div>
              )}

              {/* Video Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-text-primary line-clamp-1">
                    {video.title || 'Untitled Video'}
                  </h3>
                  {getStatusBadge(video.status)}
                </div>
                <p className="text-text-muted text-sm">
                  {formatDate(video.createdAt)}
                </p>
                {video.duration && video.status === 'COMPLETED' && (
                  <p className="text-text-muted text-xs mt-1">
                    Duration: {Math.round(video.duration)}s
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
