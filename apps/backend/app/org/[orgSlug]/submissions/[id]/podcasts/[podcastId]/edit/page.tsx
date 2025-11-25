'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import {
  useSubmission,
  useTags,
  useAddPodcastTag,
  useRemovePodcastTag,
  useUpdatePodcastScript,
  useRegeneratePodcastScript,
  useRegeneratePodcastMedia,
  useApprovePodcast,
  useUnapprovePodcast,
  useRegeneratePodcastThumbnail,
  useUploadPodcastThumbnail,
} from '@/lib/api/hooks';
import type { Tag } from '@/lib/api/types';
import { useToast } from '@/components/ui/ToastContainer';
import { MediaEditLayout } from '@/components/layout/MediaEditLayout';
import { PodcastPlayer } from '@/components/media/PodcastPlayer';
import { TranscriptEditor } from '@/components/script-editor/TranscriptEditor';
import { AIPromptBox } from '@/components/script-editor/AIPromptBox';
import { RegenerateMediaButton } from '@/components/script-editor/RegenerateMediaButton';
import { ThumbnailManager } from '@/components/media/ThumbnailManager';

interface TagManagerProps {
  tags: Tag[];
  availableTags: Tag[];
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
  isLoading?: boolean;
}

function TagManager({ tags, availableTags, onAddTag, onRemoveTag, isLoading }: TagManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTags = availableTags.filter(
    (tag) => !tags.find((t) => t.id === tag.id) && tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-gold/20 text-gold rounded-full text-xs sm:text-sm font-medium"
          >
            <span className="truncate max-w-[120px] sm:max-w-none">{tag.name}</span>
            <button
              onClick={() => onRemoveTag(tag.id)}
              className="hover:bg-gold/30 rounded-full p-0.5 transition-colors shrink-0"
              aria-label={`Remove ${tag.name}`}
              disabled={isLoading}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 border border-dashed border-gold/50 text-gold rounded-full text-xs sm:text-sm font-medium hover:bg-gold/10 transition-colors"
            disabled={isLoading}
          >
            <Plus className="w-3 h-3" />
            <span className="hidden xs:inline">Add Tag</span>
            <span className="inline xs:hidden">Add</span>
          </button>
        ) : (
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tags..."
              className="w-full sm:w-auto px-3 py-1 bg-white-10 border border-gold/50 text-text-primary rounded-full text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
              autoFocus
              onBlur={() => {
                setTimeout(() => {
                  setIsAdding(false);
                  setSearchQuery('');
                }, 200);
              }}
            />
            {searchQuery && filteredTags.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 sm:left-0 sm:right-auto bg-navy-dark border border-white-20 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10 sm:min-w-[200px]">
                {filteredTags.slice(0, 10).map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      onAddTag(tag.id);
                      setSearchQuery('');
                      setIsAdding(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-white-10 text-text-primary text-xs sm:text-sm transition-colors"
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrgPodcastEditPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const submissionId = params.id as string;
  const podcastId = params.podcastId as string;
  const toast = useToast();

  // Data fetching
  const { data: submission, isLoading: submissionLoading } = useSubmission(submissionId);
  const { data: allTags = [], isLoading: tagsLoading } = useTags();

  // Mutations
  const addPodcastTag = useAddPodcastTag();
  const removePodcastTag = useRemovePodcastTag();
  const updatePodcastScript = useUpdatePodcastScript();
  const regeneratePodcastScript = useRegeneratePodcastScript();
  const regeneratePodcastMedia = useRegeneratePodcastMedia();
  const approvePodcast = useApprovePodcast();
  const unapprovePodcast = useUnapprovePodcast();
  const regeneratePodcastThumbnail = useRegeneratePodcastThumbnail();
  const uploadPodcastThumbnail = useUploadPodcastThumbnail();

  // Loading state
  if (submissionLoading || tagsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col justify-center items-center py-12 gap-3">
          <Loader2 className="w-8 h-8 text-blue-accent animate-spin" />
          <div className="text-text-secondary">Loading podcast...</div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="card p-6">
          <p className="text-red-400">Podcast not found</p>
        </div>
      </div>
    );
  }

  const podcast = submission.podcastOutputs?.find((p) => p.id === podcastId);

  if (!podcast) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="card p-6">
          <p className="text-red-400">Podcast not found</p>
        </div>
      </div>
    );
  }

  const podcastTags = podcast.tags?.map((t) => t.tag) || [];

  // Tag handlers
  const handleAddTag = (tagId: string) => {
    const tag = allTags.find((t) => t.id === tagId);
    addPodcastTag.mutate(
      { submissionId, podcastId, tagId },
      {
        onSuccess: () => {
          toast.success('Tag added', `"${tag?.name || 'Tag'}" added to podcast`);
        },
        onError: (error: any) => {
          toast.error('Failed to add tag', error?.message || 'Please try again');
        },
      }
    );
  };

  const handleRemoveTag = (tagId: string) => {
    const tag = allTags.find((t) => t.id === tagId);
    removePodcastTag.mutate(
      { submissionId, podcastId, tagId },
      {
        onSuccess: () => {
          toast.success('Tag removed', `"${tag?.name || 'Tag'}" removed from podcast`);
        },
        onError: (error: any) => {
          toast.error('Failed to remove tag', error?.message || 'Please try again');
        },
      }
    );
  };

  // Approval handlers
  const handleApprove = () => {
    approvePodcast.mutate(
      { submissionId, podcastId },
      {
        onSuccess: () => toast.success('Podcast approved', 'Podcast output has been approved'),
        onError: (error: any) => toast.error('Failed to approve podcast', error?.message || 'Please try again'),
      }
    );
  };

  const handleUnapprove = () => {
    unapprovePodcast.mutate(
      { submissionId, podcastId },
      {
        onSuccess: () => toast.success('Approval withdrawn', 'Podcast approval has been withdrawn'),
        onError: (error: any) => toast.error('Failed to withdraw approval', error?.message || 'Please try again'),
      }
    );
  };

  // Transcript handlers
  const handleSaveTranscript = (newTranscript: string) => {
    updatePodcastScript.mutate(
      { submissionId, podcastId, transcript: newTranscript },
      {
        onSuccess: () => {
          toast.success('Transcript saved', 'Podcast transcript updated successfully');
        },
        onError: (error: any) => {
          toast.error('Failed to save transcript', error?.message || 'Please try again');
        },
      }
    );
  };

  const handleRegenerateScript = (promptGuidance: string) => {
    regeneratePodcastScript.mutate(
      { submissionId, podcastId, promptGuidance },
      {
        onSuccess: () => {
          toast.success('Transcript regenerated', 'AI has created an improved version of your transcript');
        },
        onError: (error: any) => {
          toast.error('Failed to regenerate transcript', error?.message || 'Please try again');
        },
      }
    );
  };

  const handleRegenerateMedia = () => {
    regeneratePodcastMedia.mutate(
      { submissionId, podcastId },
      {
        onSuccess: () => {
          toast.success('Podcast regeneration started', 'Your podcast audio is being regenerated. This may take 2-5 minutes.');
        },
        onError: (error: any) => {
          toast.error('Failed to regenerate podcast', error?.message || 'Please try again');
        },
      }
    );
  };

  return (
    <MediaEditLayout
      title={podcast.title || submission.article?.title || 'Podcast'}
      backUrl={`/org/${orgSlug}/submissions/${submissionId}`}
      isApproved={podcast.isApproved}
      approvedAt={podcast.approvedAt}
      onApprove={handleApprove}
      onUnapprove={handleUnapprove}
      isApproving={approvePodcast.isPending || unapprovePodcast.isPending}
      showPreviewButton={false}
    >
      <div className="space-y-6">
        {/* Tags Section */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Tags</h2>
          <TagManager
            tags={podcastTags}
            availableTags={allTags}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            isLoading={addPodcastTag.isPending || removePodcastTag.isPending}
          />
        </div>

        {/* Transcript Editor Section */}
        {podcast.transcript && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Podcast Transcript</h2>
            <p className="text-text-secondary text-sm mb-4">
              Edit the dialogue between the interviewer and guest. Save your changes and then regenerate the audio if needed.
            </p>
            <TranscriptEditor
              initialTranscript={podcast.transcript}
              onSave={handleSaveTranscript}
              isSaving={updatePodcastScript.isPending}
            />
            <AIPromptBox
              onRegenerate={handleRegenerateScript}
              isRegenerating={regeneratePodcastScript.isPending}
              label="AI Transcript Improvement"
              placeholder="Describe how you want to improve the podcast dialogue..."
            />
            <RegenerateMediaButton
              onRegenerate={handleRegenerateMedia}
              isRegenerating={regeneratePodcastMedia.isPending || podcast.status === 'PROCESSING' || podcast.status === 'PENDING'}
              mediaType="podcast"
              disabled={podcast.status === 'PROCESSING' || podcast.status === 'PENDING'}
            />
          </div>
        )}

        {/* Podcast Player */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Podcast Audio</h2>
          <PodcastPlayer output={podcast} />
        </div>

        {/* Thumbnail Manager */}
        <ThumbnailManager
          thumbnailUrl={podcast.thumbnailUrl}
          itemTitle={podcast.title || submission.article?.title || 'Podcast'}
          onRegenerateSuccess={(newThumbnailUrl) => {
            // Optimistically update will be handled by query invalidation
          }}
          onUploadSuccess={(newThumbnailUrl) => {
            // Optimistically update will be handled by query invalidation
          }}
          regenerateMutation={{
            mutate: (data: { prompt: string }, options?: any) =>
              regeneratePodcastThumbnail.mutate({ submissionId, podcastId, prompt: data.prompt }, options),
            isPending: regeneratePodcastThumbnail.isPending,
          }}
          uploadMutation={{
            mutate: (file: File, options?: any) =>
              uploadPodcastThumbnail.mutate({ submissionId, podcastId, file }, options),
            isPending: uploadPodcastThumbnail.isPending,
          }}
        />
      </div>
    </MediaEditLayout>
  );
}
