'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import {
  useSubmission,
  useTags,
  useAddInteractivePodcastTag,
  useRemoveInteractivePodcastTag,
  useUpdateInteractivePodcastScript,
  useRegenerateInteractivePodcastScript,
  useRegenerateInteractivePodcastMedia,
  useGenerateInteractivePodcastMedia,
  useApproveInteractivePodcast,
  useUnapproveInteractivePodcast,
  useRegenerateInteractivePodcastThumbnail,
  useUploadInteractivePodcastThumbnail,
} from '@/lib/api/hooks';
import type { Tag } from '@/lib/api/types';
import { useToast } from '@/components/ui/ToastContainer';
import { MediaEditLayout } from '@/components/layout/MediaEditLayout';
import { MediaPreviewModal } from '@/components/preview/MediaPreviewModal';
import { InteractivePodcastPlayer, type PodcastData } from '@repo/interactive-podcast-player';
import { ScriptEditor } from '@/components/script-editor/ScriptEditor';
import { AIPromptBox } from '@/components/script-editor/AIPromptBox';
import { RegenerateMediaButton } from '@/components/script-editor/RegenerateMediaButton';
import { ThumbnailManager } from '@/components/media/ThumbnailManager';
import { InteractivePodcastAudioPlayer } from '@/components/media/InteractivePodcastAudioPlayer';
import { VoiceSelector, getDefaultInteractivePodcastVoice, type SingleVoiceSelection } from '@/components/audio/VoiceSelector';

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

export default function OrgInteractivePodcastEditPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const submissionId = params.id as string;
  const ipId = params.ipId as string;
  const toast = useToast();
  const [showPreview, setShowPreview] = useState(false);

  // State for voice selection
  const [voiceSelection, setVoiceSelection] = useState<SingleVoiceSelection>(getDefaultInteractivePodcastVoice);

  // Data fetching
  const { data: submission, isLoading: submissionLoading } = useSubmission(orgSlug, submissionId);
  const { data: allTags = [], isLoading: tagsLoading } = useTags(orgSlug);

  // Mutations
  const addInteractivePodcastTag = useAddInteractivePodcastTag(orgSlug);
  const removeInteractivePodcastTag = useRemoveInteractivePodcastTag(orgSlug);
  const updateInteractivePodcastScript = useUpdateInteractivePodcastScript(orgSlug);
  const regenerateInteractivePodcastScript = useRegenerateInteractivePodcastScript(orgSlug);
  const regenerateInteractivePodcastMedia = useRegenerateInteractivePodcastMedia(orgSlug);
  const generateInteractivePodcastMedia = useGenerateInteractivePodcastMedia(orgSlug);
  const approveInteractivePodcast = useApproveInteractivePodcast(orgSlug);
  const unapproveInteractivePodcast = useUnapproveInteractivePodcast(orgSlug);
  const regenerateInteractivePodcastThumbnail = useRegenerateInteractivePodcastThumbnail(orgSlug);
  const uploadInteractivePodcastThumbnail = useUploadInteractivePodcastThumbnail(orgSlug);

  // Loading state
  if (submissionLoading || tagsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col justify-center items-center py-12 gap-3">
          <Loader2 className="w-8 h-8 text-blue-accent animate-spin" />
          <div className="text-text-secondary">Loading interactive podcast...</div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="card p-6">
          <p className="text-red-400">Interactive podcast not found</p>
        </div>
      </div>
    );
  }

  const interactivePodcast = submission.interactivePodcastOutputs?.find((ip) => ip.id === ipId);

  if (!interactivePodcast) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="card p-6">
          <p className="text-red-400">Interactive podcast not found</p>
        </div>
      </div>
    );
  }

  const interactivePodcastTags = interactivePodcast.tags?.map((t) => t.tag) || [];

  // Tag handlers
  const handleAddTag = (tagId: string) => {
    const tag = allTags.find((t) => t.id === tagId);
    addInteractivePodcastTag.mutate(
      { submissionId, ipId, tagId },
      {
        onSuccess: () => {
          toast.success('Tag added', `"${tag?.name || 'Tag'}" added to interactive podcast`);
        },
        onError: (error: any) => {
          toast.error('Failed to add tag', error?.message || 'Please try again');
        },
      }
    );
  };

  const handleRemoveTag = (tagId: string) => {
    const tag = allTags.find((t) => t.id === tagId);
    removeInteractivePodcastTag.mutate(
      { submissionId, ipId, tagId },
      {
        onSuccess: () => {
          toast.success('Tag removed', `"${tag?.name || 'Tag'}" removed from interactive podcast`);
        },
        onError: (error: any) => {
          toast.error('Failed to remove tag', error?.message || 'Please try again');
        },
      }
    );
  };

  // Approval handlers
  const handleApprove = () => {
    approveInteractivePodcast.mutate(
      { submissionId, ipId },
      {
        onSuccess: () => toast.success('Interactive podcast approved', 'Interactive podcast output has been approved'),
        onError: (error: any) => toast.error('Failed to approve interactive podcast', error?.message || 'Please try again'),
      }
    );
  };

  const handleUnapprove = () => {
    unapproveInteractivePodcast.mutate(
      { submissionId, ipId },
      {
        onSuccess: () => toast.success('Approval withdrawn', 'Interactive podcast approval has been withdrawn'),
        onError: (error: any) => toast.error('Failed to withdraw approval', error?.message || 'Please try again'),
      }
    );
  };

  // Script handlers
  // Extract the full script from segments
  const extractScript = (segments: any): string => {
    if (!segments) return '';

    // If segments is stored as { script: "..." } (after manual edit)
    if (segments.script && typeof segments.script === 'string') {
      return segments.script;
    }

    // If segments is an array (original format with text segments)
    if (Array.isArray(segments)) {
      return segments.map((seg) => seg.text || '').join(' ');
    }

    return '';
  };

  const currentScript = extractScript(interactivePodcast.segments as any);

  const handleSaveScript = (newScript: string) => {
    updateInteractivePodcastScript.mutate(
      { submissionId, ipId, script: newScript },
      {
        onSuccess: () => {
          toast.success('Script saved', 'Interactive podcast script updated successfully');
        },
        onError: (error: any) => {
          toast.error('Failed to save script', error?.message || 'Please try again');
        },
      }
    );
  };

  const handleRegenerateScript = (promptGuidance: string) => {
    regenerateInteractivePodcastScript.mutate(
      { submissionId, ipId, promptGuidance },
      {
        onSuccess: () => {
          toast.success('Script regenerated', 'AI has created an improved version of your script');
        },
        onError: (error: any) => {
          toast.error('Failed to regenerate script', error?.message || 'Please try again');
        },
      }
    );
  };

  const handleRegenerateMedia = () => {
    regenerateInteractivePodcastMedia.mutate(
      { submissionId, ipId },
      {
        onSuccess: () => {
          toast.success('Interactive podcast regeneration started', 'Your audio and interactive questions are being regenerated. This may take 3-6 minutes.');
        },
        onError: (error: any) => {
          toast.error('Failed to regenerate interactive podcast', error?.message || 'Please try again');
        },
      }
    );
  };

  // Handler for generating interactive podcast from script (SCRIPT_READY → PROCESSING)
  const handleGenerateInteractivePodcast = () => {
    generateInteractivePodcastMedia.mutate(
      {
        submissionId,
        ipId,
        voiceSelection: {
          voiceId: voiceSelection.voiceId,
        },
      },
      {
        onSuccess: () => {
          toast.success('Interactive podcast generation started', 'Your audio and interactive questions are being generated. This may take 3-6 minutes.');
        },
        onError: (error: any) => {
          toast.error('Failed to generate interactive podcast', error?.message || 'Please try again');
        },
      }
    );
  };

  // Status helpers
  const isScriptReady = interactivePodcast.status === 'SCRIPT_READY';
  const isProcessing = interactivePodcast.status === 'PROCESSING' || interactivePodcast.status === 'PENDING';
  const isCompleted = interactivePodcast.status === 'COMPLETED';

  // Transform data for preview
  const podcastData: PodcastData = {
    podcastId: interactivePodcast.id,
    title: interactivePodcast.title || submission.article?.title || 'Interactive Podcast',
    thumbnailUrl: interactivePodcast.thumbnailUrl || undefined,
    audioFile: interactivePodcast.audioFileUrl || '',
    duration: interactivePodcast.duration || 0,
    segments: (interactivePodcast.segments as any) || [],
  };

  return (
    <>
      <MediaEditLayout
        title={interactivePodcast.title || submission.article?.title || 'Interactive Podcast'}
        backUrl={`/org/${orgSlug}/submissions/${submissionId}`}
        isApproved={interactivePodcast.isApproved}
        approvedAt={interactivePodcast.approvedAt}
        onApprove={isCompleted ? handleApprove : undefined}
        onUnapprove={isCompleted ? handleUnapprove : undefined}
        isApproving={approveInteractivePodcast.isPending || unapproveInteractivePodcast.isPending}
      >
      <div className="space-y-6">
        {/* Status Banner for SCRIPT_READY */}
        {isScriptReady && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-amber-500 rounded-full" />
              <div>
                <h3 className="text-amber-500 font-medium">Script Ready for Review</h3>
                <p className="text-text-secondary text-sm">
                  Review and edit the script below, then generate the interactive podcast.
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
                <h3 className="text-blue-500 font-medium">Interactive Podcast Processing</h3>
                <p className="text-text-secondary text-sm">
                  Your audio and interactive questions are being generated. This may take 3-6 minutes.
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
              tags={interactivePodcastTags}
              availableTags={allTags}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              isLoading={addInteractivePodcastTag.isPending || removeInteractivePodcastTag.isPending}
            />
          </div>
        )}

        {/* Script Editor Section */}
        {currentScript && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Interactive Podcast Script</h2>
            <p className="text-text-secondary text-sm mb-4">
              {isScriptReady
                ? 'Review and edit the generated script. Once satisfied, configure voice settings below and generate the interactive podcast.'
                : 'Edit the narration script. Save your changes and then regenerate the audio with interactive questions if needed.'}
            </p>
            <ScriptEditor
              initialScript={currentScript}
              onSave={handleSaveScript}
              isSaving={updateInteractivePodcastScript.isPending}
              label="Script"
              placeholder="Enter interactive podcast script..."
              rows={12}
              disabled={isProcessing}
            />
            {!isProcessing && (
              <AIPromptBox
                onRegenerate={handleRegenerateScript}
                isRegenerating={regenerateInteractivePodcastScript.isPending}
                label="AI Script Improvement"
                placeholder="Describe how you want to improve the interactive podcast script..."
              />
            )}

            {/* For COMPLETED interactive podcasts - show regenerate media button */}
            {isCompleted && (
              <RegenerateMediaButton
                onRegenerate={handleRegenerateMedia}
                isRegenerating={regenerateInteractivePodcastMedia.isPending || isProcessing}
                mediaType="interactive-podcast"
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
              Choose a voice for the podcast narrator.
            </p>
            <VoiceSelector
              mode="single"
              value={voiceSelection}
              onChange={(value) => setVoiceSelection(value as SingleVoiceSelection)}
              disabled={isProcessing || generateInteractivePodcastMedia.isPending}
            />

            {/* Generate Interactive Podcast Button */}
            <div className="mt-6 pt-6 border-t border-white-10">
              <button
                onClick={handleGenerateInteractivePodcast}
                disabled={generateInteractivePodcastMedia.isPending}
                className="w-full py-3 px-4 bg-gradient-purple text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generateInteractivePodcastMedia.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Interactive Podcast...
                  </>
                ) : (
                  'Generate Interactive Podcast'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Interactive Podcast Audio - Only show when COMPLETED */}
        {isCompleted && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Interactive Audio</h2>
            <p className="text-text-secondary mb-3">
              Audio narration with interactive segments for enhanced learning
            </p>
            <InteractivePodcastAudioPlayer output={interactivePodcast} />
          </div>
        )}

        {/* Thumbnail Manager - Only show when COMPLETED */}
        {isCompleted && (
          <ThumbnailManager
            thumbnailUrl={interactivePodcast.thumbnailUrl}
            itemTitle={interactivePodcast.title || submission.article?.title || 'Interactive Podcast'}
            onRegenerateSuccess={(newThumbnailUrl) => {
              // Optimistically update will be handled by query invalidation
            }}
            onUploadSuccess={(newThumbnailUrl) => {
              // Optimistically update will be handled by query invalidation
            }}
            regenerateMutation={{
              mutate: (data: { prompt: string }, options?: any) =>
                regenerateInteractivePodcastThumbnail.mutate({ submissionId, ipId, prompt: data.prompt }, options),
              isPending: regenerateInteractivePodcastThumbnail.isPending,
            }}
            uploadMutation={{
              mutate: (file: File, options?: any) =>
                uploadInteractivePodcastThumbnail.mutate({ submissionId, ipId, file }, options),
              isPending: uploadInteractivePodcastThumbnail.isPending,
            }}
          />
        )}
      </div>
    </MediaEditLayout>

    {/* TEMPORARILY COMMENTED OUT */}
    {/* <MediaPreviewModal
      isOpen={showPreview}
      onClose={() => setShowPreview(false)}
      title="Interactive Podcast Preview"
    >
      <InteractivePodcastPlayer
        podcastData={podcastData}
        showBackButton={false}
        showHeader={false}
      />
    </MediaPreviewModal> */}
  </>
  );
}
