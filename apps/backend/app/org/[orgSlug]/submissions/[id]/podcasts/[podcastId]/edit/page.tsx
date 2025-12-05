'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import {
  useSubmission,
  useTags,
  useVoices,
  useAddPodcastTag,
  useRemovePodcastTag,
  useUpdatePodcastScript,
  useRegeneratePodcastScript,
  useRegeneratePodcastMedia,
  useGeneratePodcastMedia,
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
import { VoiceSelector, getDefaultPodcastVoicesFromList, type PodcastVoiceSelection } from '@/components/audio/VoiceSelector';

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

  // State for voice selection
  const [voiceSelection, setVoiceSelection] = useState<PodcastVoiceSelection>({
    interviewerVoiceId: '',
    guestVoiceId: '',
  });

  // Data fetching
  const { data: submission, isLoading: submissionLoading } = useSubmission(orgSlug, submissionId);
  const { data: allTags = [], isLoading: tagsLoading } = useTags(orgSlug);
  const { data: voices = [] } = useVoices(orgSlug);

  // Set default voice selection when voices load
  useEffect(() => {
    if (voices.length > 0 && !voiceSelection.interviewerVoiceId) {
      setVoiceSelection(getDefaultPodcastVoicesFromList(voices));
    }
  }, [voices, voiceSelection.interviewerVoiceId]);

  // Mutations
  const addPodcastTag = useAddPodcastTag(orgSlug);
  const removePodcastTag = useRemovePodcastTag(orgSlug);
  const updatePodcastScript = useUpdatePodcastScript(orgSlug);
  const regeneratePodcastScript = useRegeneratePodcastScript(orgSlug);
  const regeneratePodcastMedia = useRegeneratePodcastMedia(orgSlug);
  const generatePodcastMedia = useGeneratePodcastMedia(orgSlug);
  const approvePodcast = useApprovePodcast(orgSlug);
  const unapprovePodcast = useUnapprovePodcast(orgSlug);
  const regeneratePodcastThumbnail = useRegeneratePodcastThumbnail(orgSlug);
  const uploadPodcastThumbnail = useUploadPodcastThumbnail(orgSlug);

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

  // Handler for generating podcast from transcript (SCRIPT_READY → PROCESSING)
  const handleGeneratePodcast = () => {
    generatePodcastMedia.mutate(
      {
        submissionId,
        podcastId,
        voiceSelection: {
          interviewerVoiceId: voiceSelection.interviewerVoiceId,
          guestVoiceId: voiceSelection.guestVoiceId,
        },
      },
      {
        onSuccess: () => {
          toast.success('Podcast generation started', 'Your podcast audio is being generated. This may take 2-5 minutes.');
        },
        onError: (error: any) => {
          toast.error('Failed to generate podcast', error?.message || 'Please try again');
        },
      }
    );
  };

  // Status helpers
  const isScriptReady = podcast.status === 'SCRIPT_READY';
  const isProcessing = podcast.status === 'PROCESSING' || podcast.status === 'PENDING';
  const isCompleted = podcast.status === 'COMPLETED';

  return (
    <MediaEditLayout
      title={podcast.title || submission.article?.title || 'Podcast'}
      backUrl={`/org/${orgSlug}/submissions/${submissionId}`}
      isApproved={podcast.isApproved}
      approvedAt={podcast.approvedAt}
      onApprove={isCompleted ? handleApprove : undefined}
      onUnapprove={isCompleted ? handleUnapprove : undefined}
      isApproving={approvePodcast.isPending || unapprovePodcast.isPending}
      showPreviewButton={false}
    >
      <div className="space-y-6">
        {/* Status Banner for SCRIPT_READY */}
        {isScriptReady && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-amber-500 rounded-full" />
              <div>
                <h3 className="text-amber-500 font-medium">Transcript Ready for Review</h3>
                <p className="text-text-secondary text-sm">
                  Review and edit the transcript below, then generate the podcast audio.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Processing Banner */}
        {isProcessing && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              <div>
                <h3 className="text-blue-500 font-medium">Podcast Processing</h3>
                <p className="text-text-secondary text-sm">
                  Your podcast audio is being generated. This may take 2-5 minutes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tags Section - Only show for COMPLETED */}
        {isCompleted && (
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
        )}

        {/* Transcript Editor Section */}
        {podcast.transcript && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Podcast Transcript</h2>
            <p className="text-text-secondary text-sm mb-4">
              {isScriptReady
                ? 'Review and edit the generated transcript. Once satisfied, configure voice settings below and generate the podcast.'
                : 'Edit the dialogue between the interviewer and guest. Save your changes and then regenerate the audio if needed.'}
            </p>
            <TranscriptEditor
              initialTranscript={podcast.transcript}
              onSave={handleSaveTranscript}
              isSaving={updatePodcastScript.isPending}
              disabled={isProcessing}
            />
            {!isProcessing && (
              <AIPromptBox
                onRegenerate={handleRegenerateScript}
                isRegenerating={regeneratePodcastScript.isPending}
                label="AI Transcript Improvement"
                placeholder="Describe how you want to improve the podcast dialogue..."
              />
            )}

            {/* For COMPLETED podcasts - show regenerate media button */}
            {isCompleted && (
              <RegenerateMediaButton
                onRegenerate={handleRegenerateMedia}
                isRegenerating={regeneratePodcastMedia.isPending || isProcessing}
                mediaType="podcast"
                disabled={isProcessing}
              />
            )}
          </div>
        )}

        {/* Voice Selection for SCRIPT_READY */}
        {isScriptReady && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Voice Settings</h2>
            <p className="text-text-secondary text-sm mb-4">
              Choose voices for the interviewer and guest speakers.
            </p>
            <VoiceSelector
              orgSlug={orgSlug}
              mode="podcast"
              value={voiceSelection}
              onChange={(value) => setVoiceSelection(value as PodcastVoiceSelection)}
              disabled={isProcessing || generatePodcastMedia.isPending}
            />

            {/* Generate Podcast Button */}
            <div className="mt-6 pt-6 border-t border-white-10">
              <button
                onClick={handleGeneratePodcast}
                disabled={generatePodcastMedia.isPending}
                className="w-full py-3 px-4 bg-gradient-purple text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generatePodcastMedia.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Podcast...
                  </>
                ) : (
                  'Generate Podcast'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Podcast Player - Only show when COMPLETED */}
        {isCompleted && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Podcast Audio</h2>
            <PodcastPlayer output={podcast} />
          </div>
        )}

        {/* Thumbnail Manager - Only show when COMPLETED */}
        {isCompleted && (
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
        )}
      </div>
    </MediaEditLayout>
  );
}
