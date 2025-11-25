'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Loader2, Clock, Edit2, Save, XCircle, CheckCircle2, Plus, X } from 'lucide-react';
import {
  useSubmission,
  useTags,
  useAddVideoTag,
  useRemoveVideoTag,
  useUpdateVideoOutput,
  useUpdateVideoScript,
  useRegenerateVideoScript,
  useRegenerateVideoMedia,
  useApproveVideo,
  useUnapproveVideo,
  useRegenerateVideoThumbnail,
  useUploadVideoThumbnail,
} from '@/lib/api/hooks';
import type { Tag, VideoBubble } from '@/lib/api/types';
import { useToast } from '@/components/ui/ToastContainer';
import { MediaEditLayout } from '@/components/layout/MediaEditLayout';
import { MediaPreviewModal } from '@/components/preview/MediaPreviewModal';
import { VideoPlayer, type Video as VideoPlayerType, type Bubble } from '@repo/video-player';
import { ScriptEditor } from '@/components/script-editor/ScriptEditor';
import { AIPromptBox } from '@/components/script-editor/AIPromptBox';
import { RegenerateMediaButton } from '@/components/script-editor/RegenerateMediaButton';
import { VideoCustomizationConfig } from '@/components/video/VideoCustomization';
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

export default function OrgVideoEditPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const submissionId = params.id as string;
  const videoId = params.videoId as string;
  const toast = useToast();

  // State
  const [showPreview, setShowPreview] = useState(false);
  const [editingBubbleIndex, setEditingBubbleIndex] = useState<number | null>(null);
  const [editableBubbles, setEditableBubbles] = useState<VideoBubble[]>([]);
  const [videoCustomization, setVideoCustomization] = useState<VideoCustomizationConfig>({
    characterId: '',
    enableCaptions: true,
    captionTemplate: 'Ella',
    enableMagicZooms: true,
    enableMagicBrolls: true,
    magicBrollsPercentage: 40,
  });

  // Data fetching
  const { data: submission, isLoading: submissionLoading } = useSubmission(submissionId);
  const { data: allTags = [], isLoading: tagsLoading } = useTags();

  // Mutations
  const addVideoTag = useAddVideoTag();
  const removeVideoTag = useRemoveVideoTag();
  const updateVideoOutput = useUpdateVideoOutput();
  const updateVideoScript = useUpdateVideoScript();
  const regenerateVideoScript = useRegenerateVideoScript();
  const regenerateVideoMedia = useRegenerateVideoMedia();
  const approveVideo = useApproveVideo();
  const unapproveVideo = useUnapproveVideo();
  const regenerateVideoThumbnail = useRegenerateVideoThumbnail();
  const uploadVideoThumbnail = useUploadVideoThumbnail();

  // Initialize video customization from video record or defaults
  useEffect(() => {
    const video = submission?.videoOutputs?.find((v) => v.id === videoId);
    if (video) {
      setVideoCustomization({
        characterId: video.heygenCharacterId || '',
        enableCaptions: video.enableCaptions ?? true,
        captionTemplate: video.submagicTemplate || 'Ella',
        enableMagicZooms: video.enableMagicZooms ?? true,
        enableMagicBrolls: video.enableMagicBrolls ?? true,
        magicBrollsPercentage: video.magicBrollsPercentage ?? 40,
      });
    }
  }, [submission, videoId]);

  // Loading state
  if (submissionLoading || tagsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col justify-center items-center py-12 gap-3">
          <Loader2 className="w-8 h-8 text-blue-accent animate-spin" />
          <div className="text-text-secondary">Loading video...</div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="card p-6">
          <p className="text-red-400">Video not found</p>
        </div>
      </div>
    );
  }

  const video = submission.videoOutputs?.find((v) => v.id === videoId);

  if (!video) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="card p-6">
          <p className="text-red-400">Video not found</p>
        </div>
      </div>
    );
  }

  const videoTags = video.tags?.map((t) => t.tag) || [];
  const bubbles = (video.bubbles as VideoBubble[]) || [];

  // Tag handlers
  const handleAddTag = (tagId: string) => {
    const tag = allTags.find((t) => t.id === tagId);
    addVideoTag.mutate(
      { submissionId, videoId, tagId },
      {
        onSuccess: () => {
          toast.success('Tag added', `"${tag?.name || 'Tag'}" added to video`);
        },
        onError: (error: any) => {
          toast.error('Failed to add tag', error?.message || 'Please try again');
        },
      }
    );
  };

  const handleRemoveTag = (tagId: string) => {
    const tag = allTags.find((t) => t.id === tagId);
    removeVideoTag.mutate(
      { submissionId, videoId, tagId },
      {
        onSuccess: () => {
          toast.success('Tag removed', `"${tag?.name || 'Tag'}" removed from video`);
        },
        onError: (error: any) => {
          toast.error('Failed to remove tag', error?.message || 'Please try again');
        },
      }
    );
  };

  // Bubble handlers
  const handleEditBubble = (bubbleIndex: number) => {
    setEditableBubbles([...bubbles]);
    setEditingBubbleIndex(bubbleIndex);
  };

  const handleSaveBubble = () => {
    updateVideoOutput.mutate(
      {
        submissionId,
        videoId,
        payload: { bubbles: editableBubbles },
      },
      {
        onSuccess: () => {
          setEditingBubbleIndex(null);
          setEditableBubbles([]);
          toast.success('Bubble saved', 'Interactive bubble updated successfully');
        },
        onError: (error: any) => {
          toast.error('Failed to save bubble', error?.message || 'Please try again');
        },
      }
    );
  };

  const handleCancelBubbleEdit = () => {
    setEditingBubbleIndex(null);
    setEditableBubbles([]);
  };

  const handleBubbleFieldChange = (bubbleIndex: number, field: string, value: any) => {
    const newBubbles = [...editableBubbles];
    newBubbles[bubbleIndex] = { ...newBubbles[bubbleIndex], [field]: value };
    setEditableBubbles(newBubbles);
  };

  const handleBubbleOptionChange = (bubbleIndex: number, optionIndex: number, value: string) => {
    const bubble = editableBubbles[bubbleIndex];
    if (bubble.options) {
      const newOptions = [...bubble.options];
      newOptions[optionIndex] = value;
      const newBubbles = [...editableBubbles];
      newBubbles[bubbleIndex] = { ...bubble, options: newOptions };
      setEditableBubbles(newBubbles);
    }
  };

  // Approval handlers
  const handleApprove = () => {
    approveVideo.mutate(
      { submissionId, videoId },
      {
        onSuccess: () => toast.success('Video approved', 'Video output has been approved'),
        onError: (error: any) => toast.error('Failed to approve video', error?.message || 'Please try again'),
      }
    );
  };

  const handleUnapprove = () => {
    unapproveVideo.mutate(
      { submissionId, videoId },
      {
        onSuccess: () => toast.success('Approval withdrawn', 'Video approval has been withdrawn'),
        onError: (error: any) => toast.error('Failed to withdraw approval', error?.message || 'Please try again'),
      }
    );
  };

  // Script handlers
  const handleSaveScript = (newScript: string) => {
    updateVideoScript.mutate(
      { submissionId, videoId, script: newScript },
      {
        onSuccess: () => {
          toast.success('Script saved', 'Video script updated successfully');
        },
        onError: (error: any) => {
          toast.error('Failed to save script', error?.message || 'Please try again');
        },
      }
    );
  };

  const handleRegenerateScript = (promptGuidance: string) => {
    regenerateVideoScript.mutate(
      { submissionId, videoId, promptGuidance },
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

  const handleRegenerateMedia = (customization?: VideoCustomizationConfig) => {
    regenerateVideoMedia.mutate(
      { submissionId, videoId, videoCustomization: customization },
      {
        onSuccess: () => {
          toast.success('Video regeneration started', 'Your video is being regenerated. This may take several minutes.');
        },
        onError: (error: any) => {
          toast.error('Failed to regenerate video', error?.message || 'Please try again');
        },
      }
    );
  };

  // Transform data for preview
  const videoData: VideoPlayerType = {
    id: video.id,
    title: video.title || submission.article?.title || 'Video',
    videoUrl: video.videoUrl || '',
    thumbnailUrl: video.thumbnailUrl || '',
    duration: video.duration || undefined,
    bubbles: (video.bubbles as unknown as Bubble[]) || [],
  };

  return (
    <>
      <MediaEditLayout
        title={video.title || submission.article?.title || 'Video'}
        backUrl={`/org/${orgSlug}/submissions/${submissionId}`}
        isApproved={video.isApproved}
        approvedAt={video.approvedAt}
        onApprove={handleApprove}
        onUnapprove={handleUnapprove}
        isApproving={approveVideo.isPending || unapproveVideo.isPending}
      >
      <div className="space-y-6">
        {/* Tags Section */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Tags</h2>
          <TagManager
            tags={videoTags}
            availableTags={allTags}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            isLoading={addVideoTag.isPending || removeVideoTag.isPending}
          />
        </div>

        {/* Script Editor Section */}
        {video.script && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Video Script</h2>
            <p className="text-text-secondary text-sm mb-4">
              Edit the script that was used to generate this video. Save your changes and then regenerate the video if needed.
            </p>
            <ScriptEditor
              initialScript={video.script}
              onSave={handleSaveScript}
              isSaving={updateVideoScript.isPending}
              maxLength={1400}
              label="Script"
              placeholder="Enter video script (max 1400 characters for HeyGen)..."
              rows={10}
            />
            <AIPromptBox
              onRegenerate={handleRegenerateScript}
              isRegenerating={regenerateVideoScript.isPending}
              label="AI Script Improvement"
              placeholder="Describe how you want to improve the video script..."
            />
            <RegenerateMediaButton
              onRegenerate={handleRegenerateMedia}
              isRegenerating={regenerateVideoMedia.isPending || video.status === 'PROCESSING' || video.status === 'PENDING'}
              mediaType="video"
              disabled={video.status === 'PROCESSING' || video.status === 'PENDING'}
              videoCustomization={videoCustomization}
              onVideoCustomizationChange={setVideoCustomization}
            />
          </div>
        )}

        {/* Video Player */}
        {video.videoUrl && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Video</h2>
            <div className="relative max-w-3xl mx-auto">
              <video className="w-full rounded-lg sm:rounded-2xl" style={{ maxHeight: '50vh' }} controls src={video.videoUrl} />
            </div>
          </div>
        )}

        {/* Interactive Bubbles */}
        {bubbles.length > 0 && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Interactive Bubbles ({bubbles.length})
            </h2>
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              {bubbles.map((bubble, bubbleIndex) => {
                const isEditing = editingBubbleIndex === bubbleIndex;
                const editableBubble = isEditing && editableBubbles[bubbleIndex] ? editableBubbles[bubbleIndex] : bubble;

                return (
                  <div key={bubbleIndex} className="bg-white-10 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gold shrink-0" />
                        <span className="text-sm text-text-muted">{(bubble.appearsAt / 1000).toFixed(1)}s</span>
                      </div>
                      {!isEditing ? (
                        <button
                          onClick={() => handleEditBubble(bubbleIndex)}
                          className="p-1 hover:bg-white-20 rounded transition-colors"
                          aria-label="Edit bubble"
                        >
                          <Edit2 className="w-4 h-4 text-blue-accent" />
                        </button>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            onClick={handleSaveBubble}
                            className="p-1 hover:bg-success/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Save changes"
                            disabled={updateVideoOutput.isPending}
                          >
                            {updateVideoOutput.isPending ? (
                              <Loader2 className="w-4 h-4 text-success animate-spin" />
                            ) : (
                              <Save className="w-4 h-4 text-success" />
                            )}
                          </button>
                          <button
                            onClick={handleCancelBubbleEdit}
                            className="p-1 hover:bg-error/20 rounded transition-colors"
                            aria-label="Cancel editing"
                            disabled={updateVideoOutput.isPending}
                          >
                            <XCircle className="w-4 h-4 text-error" />
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <>
                        <textarea
                          value={editableBubble.question}
                          onChange={(e) => handleBubbleFieldChange(bubbleIndex, 'question', e.target.value)}
                          className="w-full p-2 bg-navy-dark border border-white-20 rounded-lg text-text-primary font-medium mb-3 focus:outline-none focus:ring-2 focus:ring-blue-accent/50"
                          rows={2}
                        />
                        <div className="space-y-2 mb-3">
                          {editableBubble.options?.map((option, optIdx) => (
                            <div key={optIdx} className="space-y-1">
                              <label className="text-xs text-text-muted">
                                {optIdx === editableBubble.correctAnswer ? '✓ Correct' : 'Answer'}
                              </label>
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => handleBubbleOptionChange(bubbleIndex, optIdx, e.target.value)}
                                className="w-full p-2 bg-navy-dark border border-white-20 rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-blue-accent/50"
                              />
                            </div>
                          ))}
                        </div>
                        {editableBubble.explanation && (
                          <div className="space-y-1">
                            <label className="text-xs text-text-muted">Explanation (optional)</label>
                            <textarea
                              value={editableBubble.explanation || ''}
                              onChange={(e) => handleBubbleFieldChange(bubbleIndex, 'explanation', e.target.value)}
                              className="w-full p-2 bg-navy-dark border border-white-20 rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-blue-accent/50"
                              rows={2}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-text-primary font-medium mb-3">{bubble.question}</p>
                        <div className="space-y-2 mb-3">
                          {bubble.options?.map((option, optIdx) => (
                            <div
                              key={optIdx}
                              className={`p-2 rounded-lg text-sm ${
                                optIdx === bubble.correctAnswer
                                  ? 'bg-success/20 text-success'
                                  : 'bg-white-10 text-text-secondary'
                              }`}
                            >
                              {option}
                              {optIdx === bubble.correctAnswer && <CheckCircle2 className="w-3 h-3 inline ml-2" />}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Thumbnail Manager */}
        <ThumbnailManager
          thumbnailUrl={video.thumbnailUrl}
          itemTitle={video.title || submission.article?.title || 'Video'}
          onRegenerateSuccess={(newThumbnailUrl) => {
            // Optimistically update will be handled by query invalidation
          }}
          onUploadSuccess={(newThumbnailUrl) => {
            // Optimistically update will be handled by query invalidation
          }}
          regenerateMutation={{
            mutate: (data: { prompt: string }, options?: any) =>
              regenerateVideoThumbnail.mutate({ submissionId, videoId, prompt: data.prompt }, options),
            isPending: regenerateVideoThumbnail.isPending,
          }}
          uploadMutation={{
            mutate: (file: File, options?: any) =>
              uploadVideoThumbnail.mutate({ submissionId, videoId, file }, options),
            isPending: uploadVideoThumbnail.isPending,
          }}
        />
      </div>
    </MediaEditLayout>

    {/* TEMPORARILY COMMENTED OUT */}
    {/* <MediaPreviewModal
      isOpen={showPreview}
      onClose={() => setShowPreview(false)}
      title="Video Preview"
    >
      <VideoPlayer
        video={videoData}
        bubbles={videoData.bubbles}
        showSidebar={false}
        showControls={true}
      />
    </MediaPreviewModal> */}
  </>
  );
}
