'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle2, XCircle, Loader2, Edit, Video, Mic, Headphones, FileCheck, Target } from 'lucide-react';
import { useSubmission } from '@/lib/api/hooks';
import { AudioPlayer } from '@/components/media/AudioPlayer';
import { PodcastPlayer } from '@/components/media/PodcastPlayer';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { QuizDisplay } from '@/components/media/QuizDisplay';
import { InteractivePodcastPlayer } from '@/components/media/InteractivePodcastPlayer';
import { useState } from 'react';

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

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [activeTab, setActiveTab] = useState<'overview' | 'outputs' | 'source'>('overview');

  const { data: submission, isLoading, error } = useSubmission(projectId);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center items-center py-12">
          <div className="text-text-secondary">Loading project...</div>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="card p-6">
          <p className="text-red-400 mb-4">Project not found</p>
          <Link href="/projects" className="btn btn-secondary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const videosCount = submission.videoOutputs?.length || 0;
  const podcastsCount = submission.podcastOutputs?.length || 0;
  const audiosCount = submission.audioOutputs?.length || 0;
  const quizzesCount = submission.quizOutputs?.length || 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/projects" className="text-blue-accent hover:underline mb-4 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>
        <div className="flex justify-between items-start gap-4 mt-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              {submission.article?.title || 'Project Details'}
            </h1>
            <p className="text-text-muted">
              Created {new Date(submission.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={submission.status} />
            {(submission.status === 'COMPLETED' || submission.status === 'PARTIAL_COMPLETE') && (
              <Link
                href={`/submissions/${projectId}/result`}
                className="btn btn-gold inline-flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit & Manage
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white-10 mb-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'text-gold border-gold'
                : 'text-text-muted border-transparent hover:text-text-secondary'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('outputs')}
            className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'outputs'
                ? 'text-gold border-gold'
                : 'text-text-muted border-transparent hover:text-text-secondary'
            }`}
          >
            All Media
          </button>
          <button
            onClick={() => setActiveTab('source')}
            className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'source'
                ? 'text-gold border-gold'
                : 'text-text-muted border-transparent hover:text-text-secondary'
            }`}
          >
            Source Article
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {videosCount > 0 && (
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-gold rounded-2xl flex items-center justify-center">
                  <Video className="w-5 h-5 text-navy-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Videos</h3>
                  <p className="text-text-muted text-sm">{videosCount} video{videosCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('outputs')}
                className="text-blue-accent hover:underline text-sm"
              >
                View all →
              </button>
            </div>
          )}

          {podcastsCount > 0 && (
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-purple rounded-2xl flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Podcasts</h3>
                  <p className="text-text-muted text-sm">{podcastsCount} podcast{podcastsCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('outputs')}
                className="text-blue-accent hover:underline text-sm"
              >
                Listen →
              </button>
            </div>
          )}

          {audiosCount > 0 && (
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-blue rounded-2xl flex items-center justify-center">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Audio</h3>
                  <p className="text-text-muted text-sm">{audiosCount} audio narration{audiosCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('outputs')}
                className="text-blue-accent hover:underline text-sm"
              >
                Play →
              </button>
            </div>
          )}

          {quizzesCount > 0 && (
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-blue rounded-2xl flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Quizzes</h3>
                  <p className="text-text-muted text-sm">{quizzesCount} quiz{quizzesCount !== 1 ? 'zes' : ''}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('outputs')}
                className="text-blue-accent hover:underline text-sm"
              >
                View →
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'outputs' && (
        <div className="space-y-6">
          {/* Audio */}
          {submission.generateAudio && submission.audioOutputs && submission.audioOutputs.length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Audio Narration</h2>
              <AudioPlayer output={submission.audioOutputs[0]} />
            </div>
          )}

          {/* Podcast */}
          {submission.generatePodcast && submission.podcastOutputs && submission.podcastOutputs.length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Podcast</h2>
              <PodcastPlayer output={submission.podcastOutputs[0]} />
            </div>
          )}

          {/* Video */}
          {submission.generateVideo && submission.videoOutputs && submission.videoOutputs.length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Videos with Bubbles</h2>
              <VideoPlayer output={submission.videoOutputs[0]} />
            </div>
          )}

          {/* Quiz */}
          {submission.generateQuiz && submission.quizOutputs && submission.quizOutputs.length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Quiz</h2>
              <QuizDisplay output={submission.quizOutputs[0]} />
            </div>
          )}

          {/* Interactive Podcast */}
          {submission.generateInteractivePodcast && submission.interactivePodcastOutputs && submission.interactivePodcastOutputs.length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Interactive Podcast</h2>
              <InteractivePodcastPlayer
                output={submission.interactivePodcastOutputs[0]}
                podcastOutput={submission.podcastOutputs?.find(
                  p => p.id === submission.interactivePodcastOutputs![0].podcastOutputId
                )}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'source' && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Source Article</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-text-secondary whitespace-pre-wrap">
              {submission.article?.content || 'No article content available'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
