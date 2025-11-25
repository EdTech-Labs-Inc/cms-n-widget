'use client';

import { RefObject } from 'react';
import { Sparkles, Image as ImageIcon, X } from 'lucide-react';

interface ThumbnailOptionsProps {
  thumbnailMode: 'ai-generated' | 'custom-upload';
  customThumbnailFile: File | null;
  thumbnailPreview: string | null;
  onThumbnailModeChange: (mode: 'ai-generated' | 'custom-upload') => void;
  onCustomThumbnailChange: (file: File | null) => void;
  onClearThumbnail: () => void;
  thumbnailInputRef: RefObject<HTMLInputElement>;
  isDisabled: boolean;
}

export function ThumbnailOptions({
  thumbnailMode,
  customThumbnailFile,
  thumbnailPreview,
  onThumbnailModeChange,
  onCustomThumbnailChange,
  onClearThumbnail,
  thumbnailInputRef,
  isDisabled,
}: ThumbnailOptionsProps) {
  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(selectedFile.type)) {
      alert('Please upload a JPG or PNG image');
      return;
    }

    // Validate file size (5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    onCustomThumbnailChange(selectedFile);
  };

  const handleThumbnailDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(droppedFile.type)) {
      alert('Please upload a JPG or PNG image');
      return;
    }

    // Validate file size (5MB)
    if (droppedFile.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    onCustomThumbnailChange(droppedFile);
  };

  return (
    <div>
      <label className="block text-text-secondary text-sm font-medium mb-3">
        Thumbnail Options
      </label>
      <div className="space-y-3">
        {/* AI Generated Option */}
        <label
          className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
            thumbnailMode === 'ai-generated'
              ? 'bg-gold-light border-2 border-gold'
              : 'bg-white-10 border-2 border-transparent hover:bg-white-20'
          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            type="radio"
            name="thumbnailMode"
            value="ai-generated"
            checked={thumbnailMode === 'ai-generated'}
            onChange={(e) => {
              onThumbnailModeChange(e.target.value as 'ai-generated');
              onClearThumbnail();
            }}
            className="w-5 h-5 mt-0.5 rounded-full border-white-40 bg-transparent checked:bg-gold"
            disabled={isDisabled}
          />
          <div className="flex-1">
            <div className="text-text-primary font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" />
              AI Generated (Default)
            </div>
            <div className="text-sm text-text-muted">
              Automatically generate thumbnail based on article content
            </div>
          </div>
        </label>

        {/* Custom Upload Option */}
        <label
          className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
            thumbnailMode === 'custom-upload'
              ? 'bg-gold-light border-2 border-gold'
              : 'bg-white-10 border-2 border-transparent hover:bg-white-20'
          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            type="radio"
            name="thumbnailMode"
            value="custom-upload"
            checked={thumbnailMode === 'custom-upload'}
            onChange={(e) => onThumbnailModeChange(e.target.value as 'custom-upload')}
            className="w-5 h-5 mt-0.5 rounded-full border-white-40 bg-transparent checked:bg-gold"
            disabled={isDisabled}
          />
          <div className="flex-1">
            <div className="text-text-primary font-medium flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-gold" />
              Upload Custom Image
            </div>
            <div className="text-sm text-text-muted">
              Upload your own JPG or PNG image (max 5MB)
            </div>
          </div>
        </label>

        {/* Custom Thumbnail Upload Area */}
        {thumbnailMode === 'custom-upload' && (
          <div className="pl-8 pt-2">
            <input
              type="file"
              id="thumbnail-upload"
              ref={thumbnailInputRef}
              onChange={handleThumbnailFileChange}
              accept="image/jpeg,image/png"
              className="hidden"
              disabled={isDisabled}
            />
            {!customThumbnailFile ? (
              <label
                htmlFor="thumbnail-upload"
                onDrop={handleThumbnailDrop}
                onDragOver={(e) => e.preventDefault()}
                className={`flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 border-white-20 bg-white-10 hover:border-gold hover:bg-gold-light/50 ${
                  isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <ImageIcon className="w-10 h-10 text-text-muted mb-2" />
                <p className="text-text-primary font-medium mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-text-muted text-sm">JPG or PNG (max 5MB)</p>
              </label>
            ) : (
              <div className="space-y-3">
                {/* Thumbnail Preview */}
                {thumbnailPreview && (
                  <div className="relative rounded-xl overflow-hidden border-2 border-gold">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full max-w-sm mx-auto rounded-lg"
                    />
                  </div>
                )}
                {/* File Info and Clear Button */}
                <div className="flex items-center justify-between p-3 bg-gold-light rounded-lg border border-gold">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="w-5 h-5 text-gold" />
                    <div>
                      <p className="text-text-primary font-medium text-sm">
                        {customThumbnailFile.name}
                      </p>
                      <p className="text-text-muted text-xs">
                        {(customThumbnailFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClearThumbnail}
                    className="p-2 hover:bg-gold/30 rounded-lg transition-colors"
                    disabled={isDisabled}
                  >
                    <X className="w-4 h-4 text-gold" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
