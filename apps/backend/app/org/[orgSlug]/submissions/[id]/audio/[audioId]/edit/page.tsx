'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import {
  useSubmission,
  useTags,
  useAddAudioTag,
  useRemoveAudioTag,
  useApproveAudio,
  useUnapproveAudio,
} from '@/lib/api/hooks';
import type { Tag } from '@/lib/api/types';
import { useToast } from '@/components/ui/ToastContainer';
import { MediaEditLayout } from '@/components/layout/MediaEditLayout';
import { AudioPlayer } from '@/components/media/AudioPlayer';

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

export default function OrgAudioEditPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const submissionId = params.id as string;
  const audioId = params.audioId as string;
  const toast = useToast();

  // Data fetching
  const { data: submission, isLoading: submissionLoading } = useSubmission(orgSlug, submissionId);
  const { data: allTags = [], isLoading: tagsLoading } = useTags(orgSlug);

  // Mutations
  const addAudioTag = useAddAudioTag(orgSlug);
  const removeAudioTag = useRemoveAudioTag(orgSlug);
  const approveAudio = useApproveAudio(orgSlug);
  const unapproveAudio = useUnapproveAudio(orgSlug);

  // Loading state
  if (submissionLoading || tagsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col justify-center items-center py-12 gap-3">
          <Loader2 className="w-8 h-8 text-blue-accent animate-spin" />
          <div className="text-text-secondary">Loading audio...</div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="card p-6">
          <p className="text-red-400">Audio not found</p>
        </div>
      </div>
    );
  }

  const audio = submission.audioOutputs?.find((a) => a.id === audioId);

  if (!audio) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="card p-6">
          <p className="text-red-400">Audio not found</p>
        </div>
      </div>
    );
  }

  const audioTags = audio.tags?.map((t) => t.tag) || [];

  // Tag handlers
  const handleAddTag = (tagId: string) => {
    const tag = allTags.find((t) => t.id === tagId);
    addAudioTag.mutate(
      { submissionId, audioId, tagId },
      {
        onSuccess: () => {
          toast.success('Tag added', `"${tag?.name || 'Tag'}" added to audio`);
        },
        onError: (error: any) => {
          toast.error('Failed to add tag', error?.message || 'Please try again');
        },
      }
    );
  };

  const handleRemoveTag = (tagId: string) => {
    const tag = allTags.find((t) => t.id === tagId);
    removeAudioTag.mutate(
      { submissionId, audioId, tagId },
      {
        onSuccess: () => {
          toast.success('Tag removed', `"${tag?.name || 'Tag'}" removed from audio`);
        },
        onError: (error: any) => {
          toast.error('Failed to remove tag', error?.message || 'Please try again');
        },
      }
    );
  };

  // Approval handlers
  const handleApprove = () => {
    approveAudio.mutate(
      { submissionId, audioId },
      {
        onSuccess: () => toast.success('Audio approved', 'Audio output has been approved'),
        onError: (error: any) => toast.error('Failed to approve audio', error?.message || 'Please try again'),
      }
    );
  };

  const handleUnapprove = () => {
    unapproveAudio.mutate(
      { submissionId, audioId },
      {
        onSuccess: () => toast.success('Approval withdrawn', 'Audio approval has been withdrawn'),
        onError: (error: any) => toast.error('Failed to withdraw approval', error?.message || 'Please try again'),
      }
    );
  };

  return (
    <MediaEditLayout
      title={submission.article?.title ? `${submission.article.title} - Audio` : 'Audio Narration'}
      backUrl={`/org/${orgSlug}/submissions/${submissionId}`}
      isApproved={audio.isApproved}
      approvedAt={audio.approvedAt}
      onApprove={handleApprove}
      onUnapprove={handleUnapprove}
      isApproving={approveAudio.isPending || unapproveAudio.isPending}
      showPreviewButton={false}
    >
      <div className="space-y-6">
        {/* Tags Section */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Tags</h2>
          <TagManager
            tags={audioTags}
            availableTags={allTags}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            isLoading={addAudioTag.isPending || removeAudioTag.isPending}
          />
        </div>

        {/* Audio Player */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Audio</h2>
          <AudioPlayer output={audio} />
        </div>
      </div>
    </MediaEditLayout>
  );
}
