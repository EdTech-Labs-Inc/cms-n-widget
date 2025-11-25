'use client';

import { useState, useRef } from 'react';
import { Sparkles, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/components/ui/ToastContainer';

interface ThumbnailManagerProps {
  thumbnailUrl: string | null;
  itemTitle: string;
  onRegenerateSuccess: (newThumbnailUrl: string) => void;
  onUploadSuccess: (newThumbnailUrl: string) => void;
  regenerateMutation: {
    mutate: (data: { prompt: string }, options?: any) => void;
    isPending: boolean;
  };
  uploadMutation: {
    mutate: (file: File, options?: any) => void;
    isPending: boolean;
  };
}

export function ThumbnailManager({
  thumbnailUrl,
  itemTitle,
  onRegenerateSuccess,
  onUploadSuccess,
  regenerateMutation,
  uploadMutation,
}: ThumbnailManagerProps) {
  const [promptGuidance, setPromptGuidance] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const isLoading = regenerateMutation.isPending || uploadMutation.isPending;

  const handleRegenerate = () => {
    if (promptGuidance.trim() && !isLoading) {
      regenerateMutation.mutate(
        { prompt: promptGuidance.trim() },
        {
          onSuccess: (data: any) => {
            const newThumbnailUrl = data.data?.thumbnailUrl;
            if (newThumbnailUrl) {
              onRegenerateSuccess(newThumbnailUrl);
              toast.success('Thumbnail regenerated', 'Your new thumbnail has been generated successfully');
              setPromptGuidance('');
            }
          },
          onError: (error: any) => {
            toast.error('Failed to regenerate thumbnail', error?.message || 'Please try again');
          },
        }
      );
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Invalid file type', 'Only JPG and PNG files are allowed');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', 'Maximum file size is 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadMutation.mutate(file, {
      onSuccess: (data: any) => {
        const newThumbnailUrl = data.data?.thumbnailUrl;
        if (newThumbnailUrl) {
          onUploadSuccess(newThumbnailUrl);
          toast.success('Thumbnail uploaded', 'Your custom thumbnail has been uploaded successfully');
          setPreviewUrl(null);
        }
      },
      onError: (error: any) => {
        toast.error('Failed to upload thumbnail', error?.message || 'Please try again');
        setPreviewUrl(null);
      },
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleRegenerate();
    }
  };

  const displayThumbnail = previewUrl || thumbnailUrl;

  return (
    <div className="card p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <ImageIcon className="w-5 h-5 text-gold" />
        <h3 className="text-lg font-semibold text-text-primary">Thumbnail</h3>
      </div>

      {/* Thumbnail Display */}
      {displayThumbnail ? (
        <div className="relative">
          <img
            src={displayThumbnail}
            alt={itemTitle}
            className="w-full max-w-md rounded-xl border border-white-20"
          />
          {uploadMutation.isPending && (
            <div className="absolute inset-0 flex items-center justify-center bg-navy-dark/80 rounded-xl">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
                <p className="text-sm text-text-secondary">Uploading...</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full max-w-md h-48 flex items-center justify-center bg-navy-dark border border-dashed border-white-20 rounded-xl">
          <div className="text-center text-text-muted">
            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No thumbnail available</p>
          </div>
        </div>
      )}

      {/* AI Regeneration Section */}
      <div className="border-t border-white-20 pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold" />
          <label className="text-sm font-medium text-text-primary">Regenerate with AI</label>
        </div>

        <p className="text-xs text-text-secondary">
          Describe what you want in the thumbnail and AI will generate a new one.
        </p>

        <textarea
          value={promptGuidance}
          onChange={(e) => setPromptGuidance(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="e.g., 'Make it more vibrant with charts and graphs', 'Add Indian finance imagery', 'Use warmer colors'..."
          rows={3}
          className="w-full p-3 bg-navy-dark border border-white-20 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm resize-y"
          disabled={isLoading}
        />

        <div className="flex items-center justify-between">
          <p className="text-xs text-text-muted">
            {regenerateMutation.isPending ? 'AI is generating...' : 'Press Cmd/Ctrl+Enter or click the button'}
          </p>
          <button
            onClick={handleRegenerate}
            disabled={!promptGuidance.trim() || isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold/90 disabled:bg-gold/30 disabled:cursor-not-allowed text-navy-dark rounded-lg font-medium text-sm transition-colors"
          >
            {regenerateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Regenerate Thumbnail
              </>
            )}
          </button>
        </div>

        {regenerateMutation.isPending && (
          <div className="flex items-center gap-2 p-3 bg-gold/10 border border-gold/30 rounded-lg">
            <Loader2 className="w-4 h-4 text-gold animate-spin" />
            <p className="text-sm text-gold">
              AI is generating your custom thumbnail. This may take 10-30 seconds...
            </p>
          </div>
        )}
      </div>

      {/* Manual Upload Section */}
      <div className="border-t border-white-20 pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-gold" />
          <label className="text-sm font-medium text-text-primary">Upload Custom Image</label>
        </div>

        <p className="text-xs text-text-secondary">
          Upload your own thumbnail image (JPG or PNG, max 5MB).
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isLoading}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-navy-dark border border-gold/50 hover:bg-white-10 disabled:bg-navy-dark disabled:border-white-20 disabled:cursor-not-allowed text-gold disabled:text-text-muted rounded-lg font-medium text-sm transition-colors"
        >
          <Upload className="w-4 h-4" />
          Choose File
        </button>
      </div>
    </div>
  );
}
