'use client';

import Link from 'next/link';
import { Clock, CheckCircle2, XCircle, Loader2, FileStack, Calendar, ChevronRight, Mic, Headphones, Video, FileCheck, Target, Plus, AlertCircle } from 'lucide-react';
import { useSubmissions } from '@/lib/api/hooks';

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

interface SubmissionListProps {
  orgSlug: string;
}

export function SubmissionList({ orgSlug }: SubmissionListProps) {
  const { data, isLoading, error } = useSubmissions(orgSlug, 1, 20);
  const basePath = orgSlug ? `/org/${orgSlug}` : '';

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-gradient-blue flex items-center justify-center mb-4 shadow-glow-blue">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        <p className="text-text-secondary">Loading your articles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-error" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-text-primary mb-1">Failed to load articles</h3>
          <p className="text-text-muted">Please refresh the page or try again later</p>
        </div>
      </div>
    );
  }

  if (!data?.submissions || data.submissions.length === 0) {
    return (
      <div className="card p-12 text-center">
        <FileStack className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-text-primary mb-2">No articles yet</h3>
        <p className="text-text-muted mb-6">
          Start creating multimedia content from your articles
        </p>
        <Link href={`${basePath}/articles/new`} className="btn btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Upload Article
        </Link>
      </div>
    );
  }

  const mediaIcons = {
    audio: <Mic className="w-3.5 h-3.5" />,
    podcast: <Headphones className="w-3.5 h-3.5" />,
    video: <Video className="w-3.5 h-3.5" />,
    quiz: <FileCheck className="w-3.5 h-3.5" />,
    interactive: <Target className="w-3.5 h-3.5" />,
  };

  const getLanguageLabel = (language: string) => {
    switch (language) {
      case 'ENGLISH':
        return 'English';
      case 'MARATHI':
        return 'Marathi';
      case 'HINDI':
        return 'Hindi';
      case 'BENGALI':
        return 'Bengali';
      default:
        return language;
    }
  };

  return (
    <div className="grid gap-3">
      {data.submissions.map((submission) => {
        // Add edit_mode query param for processing/pending submissions
        const isProcessing = submission.status === 'PROCESSING' || submission.status === 'PENDING';
        const href = isProcessing
          ? `${basePath}/submissions/${submission.id}?edit_mode=true`
          : `${basePath}/submissions/${submission.id}`;

        return (
          <Link
            key={submission.id}
            href={href}
            className="card p-5 group"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-base font-semibold text-text-primary group-hover:text-blue-accent transition-colors">
                    {submission.article?.title || 'Article'}
                  </h3>
                  <StatusBadge status={submission.status} />
                </div>
                <div className="flex flex-wrap gap-2 text-xs mb-2">
                  {submission.generateAudio && (
                    <span className="px-2.5 py-1 bg-white-10 text-text-secondary rounded-full font-medium">
                      Audio
                    </span>
                  )}
                  {submission.generatePodcast && (
                    <span className="px-2.5 py-1 bg-white-10 text-text-secondary rounded-full font-medium">
                      Podcast
                    </span>
                  )}
                  {submission.generateVideo && (
                    <span className="px-2.5 py-1 bg-white-10 text-text-secondary rounded-full font-medium">
                      Video
                    </span>
                  )}
                  {submission.generateQuiz && (
                    <span className="px-2.5 py-1 bg-white-10 text-text-secondary rounded-full font-medium">
                      Quiz
                    </span>
                  )}
                  {submission.generateInteractivePodcast && (
                    <span className="px-2.5 py-1 bg-white-10 text-text-secondary rounded-full font-medium">
                      Interactive
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span>
                    {new Date(submission.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  {submission.language && (
                    <span className="px-2.5 py-1 bg-white-10 text-text-secondary rounded-full font-medium">
                      {getLanguageLabel(submission.language)}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-blue-accent transition-colors shrink-0" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
