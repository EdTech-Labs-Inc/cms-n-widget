'use client';

import { Video, Mic, Headphones, FileCheck, Loader2, CheckCircle2, FileText, Edit3 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MediaCardProps {
  id: string;
  type: 'video' | 'audio' | 'podcast' | 'quiz' | 'interactive-podcast' | 'article';
  title: string;
  thumbnailUrl?: string | null;
  status?: 'PENDING' | 'PROCESSING' | 'SCRIPT_READY' | 'COMPLETED' | 'FAILED';
  isApproved?: boolean;
  submissionId?: string;
  articleId?: string;
  duration?: string | null;
  language?: 'ENGLISH' | 'MARATHI' | 'HINDI' | 'BENGALI';
  orgSlug?: string;
  onClick?: () => void;
}

export function MediaCard({
  id,
  type,
  title,
  thumbnailUrl,
  status,
  isApproved,
  submissionId,
  articleId,
  duration,
  language,
  orgSlug,
  onClick,
}: MediaCardProps) {
  const router = useRouter();
  const isArticle = type === 'article';
  const isCompleted = isArticle || status === 'COMPLETED';
  const isScriptReady = !isArticle && status === 'SCRIPT_READY';
  const isProcessing = !isArticle && (status === 'PENDING' || status === 'PROCESSING');
  const isFailed = !isArticle && status === 'FAILED';
  // Script ready or completed cards are clickable
  const isClickable = isCompleted || isScriptReady;

  const getIcon = () => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'podcast':
        return <Headphones className="w-5 h-5" />;
      case 'audio':
        return <Mic className="w-5 h-5" />;
      case 'quiz':
        return <FileCheck className="w-5 h-5" />;
      case 'interactive-podcast':
        return <Headphones className="w-5 h-5" />;
      case 'article':
        return <FileText className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'video':
        return 'bg-gradient-gold';
      case 'podcast':
        return 'bg-gradient-purple';
      case 'audio':
        return 'bg-gradient-blue';
      case 'quiz':
        return 'bg-gradient-blue';
      case 'interactive-podcast':
        return 'bg-gradient-purple';
      case 'article':
        return 'bg-gradient-blue';
      default:
        return 'bg-white-20';
    }
  };

  const getEditUrl = () => {
    const orgPrefix = orgSlug ? `/org/${orgSlug}` : '';
    switch (type) {
      case 'video':
        return `${orgPrefix}/submissions/${submissionId}/videos/${id}/edit`;
      case 'audio':
        return `${orgPrefix}/submissions/${submissionId}/audio/${id}/edit`;
      case 'podcast':
        return `${orgPrefix}/submissions/${submissionId}/podcasts/${id}/edit`;
      case 'quiz':
        return `${orgPrefix}/submissions/${submissionId}/quizzes/${id}/edit`;
      case 'interactive-podcast':
        return `${orgPrefix}/submissions/${submissionId}/interactive-podcasts/${id}/edit`;
      case 'article':
        return `${orgPrefix}/articles/${articleId || id}/edit`;
      default:
        return submissionId ? `${orgPrefix}/submissions/${submissionId}` : `${orgPrefix}/articles/${id}`;
    }
  };

  const handleClick = () => {
    if (isClickable) {
      if (onClick) {
        onClick();
      } else {
        router.push(getEditUrl());
      }
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'video':
        return 'Video';
      case 'audio':
        return 'Audio';
      case 'podcast':
        return 'Podcast';
      case 'quiz':
        return 'Quiz';
      case 'interactive-podcast':
        return 'Interactive Podcast';
      case 'article':
        return 'Article';
      default:
        return 'Media';
    }
  };

  const getLanguageLabel = () => {
    if (!language) return null;
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
    <div
      className={`card p-4 transition-all duration-300 ${
        isClickable
          ? 'hover:scale-[1.02] cursor-pointer group'
          : 'opacity-75'
      } ${isApproved ? 'ring-2 ring-success/30' : ''} ${isScriptReady ? 'ring-2 ring-amber-400/50' : ''}`}
      onClick={handleClick}
    >
      {/* Icon/Thumbnail Area */}
      <div className="w-full aspect-video rounded-2xl mb-3 relative overflow-hidden">
        {thumbnailUrl ? (
          /* Show actual thumbnail image */
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          /* Fallback to gradient + icon */
          <div className={`w-full h-full flex items-center justify-center ${getGradient()}`}>
            <div className="text-white">
              {isProcessing ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                getIcon()
              )}
            </div>
          </div>
        )}

        {/* Approval Badge Overlay */}
        {isApproved && (
          <div className="absolute top-2 right-2 bg-success/90 backdrop-blur-sm rounded-full p-1.5">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Title */}
      <h3
        className={`font-semibold text-text-primary mb-1 line-clamp-2 ${
          isClickable ? 'group-hover:text-blue-accent transition-colors' : ''
        }`}
      >
        {title}
      </h3>

      {/* Type and Language Labels */}
      <div className="flex items-center gap-2 mb-2">
        <p className="text-text-muted text-xs">{getTypeLabel()}</p>
        {language && (
          <span className="px-2 py-0.5 bg-blue-light text-blue-accent rounded-full text-xs">
            {getLanguageLabel()}
          </span>
        )}
      </div>

      {/* Footer: Duration and Status */}
      <div className="flex items-center justify-between text-xs gap-2">
        {duration && <span className="text-text-muted truncate">{duration}</span>}

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Status Badge */}
          {isProcessing && (
            <span className="badge badge-processing">
              <Loader2 className="w-3 h-3 animate-spin" />
              Processing
            </span>
          )}
          {isFailed && (
            <span className="badge badge-failed">Failed</span>
          )}
          {isScriptReady && (
            <span className="badge bg-amber-100 text-amber-700 border border-amber-300">
              <Edit3 className="w-3 h-3 mr-1" />
              Script Ready
            </span>
          )}
          {isCompleted && !isApproved && (
            <span className="badge badge-pending">Pending Approval</span>
          )}
          {isCompleted && isApproved && (
            <span className="badge badge-success">Approved</span>
          )}
        </div>
      </div>
    </div>
  );
}
