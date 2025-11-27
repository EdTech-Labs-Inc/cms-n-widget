'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useSubmission } from '@/lib/api/hooks';
import { MediaCard } from '@/components/media/MediaCard';

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { className: string; icon: React.ReactNode }> = {
    PENDING: {
      className: 'badge badge-pending',
      icon: <Clock className="w-3 h-3" />,
    },
    PROCESSING: {
      className: 'badge badge-processing',
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    COMPLETED: {
      className: 'badge badge-completed',
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    FAILED: {
      className: 'badge badge-failed',
      icon: <XCircle className="w-3 h-3" />,
    },
    PARTIAL_COMPLETE: {
      className: 'badge badge-processing',
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
  };

  const { className, icon } = config[status] || config.PENDING;

  return (
    <span className={className}>
      {icon}
      {status}
    </span>
  );
}

export default function OrgSubmissionDetailPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const submissionId = params.id as string;

  const { data: submission, isLoading: submissionLoading, error: submissionError } = useSubmission(orgSlug, submissionId);

  // Loading state
  if (submissionLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col justify-center items-center py-12 gap-3">
          <Loader2 className="w-8 h-8 text-blue-accent animate-spin" />
          <div className="text-text-secondary">Loading submission...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (submissionError || !submission) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="card p-6">
          <p className="text-red-400 mb-4">Submission not found</p>
          <Link href={`/org/${orgSlug}/articles`} className="btn btn-secondary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Articles
          </Link>
        </div>
      </div>
    );
  }

  // Extract all media outputs
  const videoOutputs = submission.videoOutputs || [];
  const audioOutputs = submission.audioOutputs || [];
  const podcastOutputs = submission.podcastOutputs || [];
  const quizOutputs = submission.quizOutputs || [];
  const interactivePodcastOutputs = submission.interactivePodcastOutputs || [];

  // Build media cards array
  const mediaCards: Array<{
    id: string;
    type: 'video' | 'audio' | 'podcast' | 'quiz' | 'interactive-podcast' | 'article';
    title: string;
    thumbnailUrl?: string | null;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    isApproved?: boolean;
    duration: string | null;
    articleId?: string;
  }> = [];

  // Article (if available)
  if (submission.article) {
    mediaCards.push({
      id: submission.article.id,
      type: 'article' as const,
      title: submission.article.title,
      thumbnailUrl: submission.article.thumbnailUrl,
      status: 'COMPLETED',
      isApproved: submission.article.isApproved,
      duration: null,
      articleId: submission.article.id,
    });
  }

  // Videos
  videoOutputs.forEach((video) => {
    mediaCards.push({
      id: video.id,
      type: 'video' as const,
      title: video.title || submission.article?.title || 'Untitled Video',
      thumbnailUrl: video.thumbnailUrl,
      status: video.status,
      isApproved: video.isApproved,
      duration: video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : null,
    });
  });

  // Audio
  audioOutputs.forEach((audio) => {
    mediaCards.push({
      id: audio.id,
      type: 'audio' as const,
      title: submission.article?.title || 'Audio Narration',
      status: audio.status,
      isApproved: audio.isApproved,
      duration: audio.duration ? `${Math.floor(audio.duration / 60)} min` : null,
    });
  });

  // Podcasts
  podcastOutputs.forEach((podcast) => {
    mediaCards.push({
      id: podcast.id,
      type: 'podcast' as const,
      title: podcast.title || submission.article?.title || 'Podcast',
      thumbnailUrl: podcast.thumbnailUrl,
      status: podcast.status,
      isApproved: podcast.isApproved,
      duration: podcast.duration ? `${Math.floor(podcast.duration / 60)} min` : null,
    });
  });

  // Quizzes
  quizOutputs.forEach((quiz) => {
    mediaCards.push({
      id: quiz.id,
      type: 'quiz' as const,
      title: submission.article?.title ? `${submission.article.title} - Quiz` : 'Quiz',
      status: quiz.status,
      isApproved: quiz.isApproved,
      duration: quiz.questions ? `${quiz.questions.length} questions` : null,
    });
  });

  // Interactive Podcasts
  interactivePodcastOutputs.forEach((ip) => {
    mediaCards.push({
      id: ip.id,
      type: 'interactive-podcast' as const,
      title: ip.title || (submission.article?.title ? `${submission.article.title} - Interactive` : 'Interactive Podcast'),
      status: ip.status,
      isApproved: ip.isApproved,
      duration: ip.duration ? `${Math.floor(ip.duration / 60)} min` : null,
      thumbnailUrl: ip.thumbnailUrl,
    });
  });

  const hasMediaOutputs = mediaCards.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Link
          href={`/org/${orgSlug}/articles`}
          className="text-blue-accent hover:underline mb-4 inline-flex items-center gap-1 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Articles
        </Link>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2 break-words">
              {submission.article?.title || 'Submission Details'}
            </h1>
            <p className="text-text-secondary text-sm sm:text-base">
              Created {new Date(submission.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={submission.status} />
          </div>
        </div>
      </div>

      {/* Media Cards Grid */}
      {hasMediaOutputs ? (
        <div>
          <p className="text-text-muted text-sm mb-4">
            {mediaCards.length} media output{mediaCards.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mediaCards.map((card) => (
              <MediaCard
                key={card.id}
                id={card.id}
                type={card.type}
                title={card.title}
                thumbnailUrl={card.thumbnailUrl}
                status={card.status}
                isApproved={card.isApproved}
                submissionId={submissionId}
                articleId={card.articleId}
                duration={card.duration}
                orgSlug={orgSlug}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Loader2 className="w-8 h-8 text-blue-accent animate-spin mx-auto mb-4" />
          <p className="text-text-muted">Generating media outputs...</p>
          <p className="text-text-secondary text-sm mt-2">
            This may take a few minutes. Check back shortly.
          </p>
        </div>
      )}
    </div>
  );
}
