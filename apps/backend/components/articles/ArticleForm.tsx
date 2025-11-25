'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';
import { useArticles, useCreateSubmission } from '@/lib/api/hooks';
import { VideoCustomization, VideoCustomizationConfig } from '@/components/video/VideoCustomization';
import { UploadLoadingModal } from './UploadLoadingModal';
import { FileUploadSection } from './FileUploadSection';
import { CategorySelector } from './CategorySelector';
import { ThumbnailOptions } from './ThumbnailOptions';
import { LanguageSelector } from './LanguageSelector';
import { ContentTypeSelector } from './ContentTypeSelector';

interface ArticleFormProps {
  orgSlug?: string;
}

export function ArticleForm({ orgSlug }: ArticleFormProps) {
  const router = useRouter();
  const basePath = orgSlug ? `/org/${orgSlug}` : '';
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'upload' | 'existing'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['ENGLISH']);
  const [selectedCategory, setSelectedCategory] = useState<string>('EVERGREEN');
  const [thumbnailMode, setThumbnailMode] = useState<'ai-generated' | 'custom-upload'>('ai-generated');
  const [customThumbnailFile, setCustomThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [contentOptions, setContentOptions] = useState({
    generateVideo: true,
    generateAudio: true,
    generatePodcast: true,
    generateQuiz: true,
    generateInteractivePodcast: true,
  });
  const [videoCustomization, setVideoCustomization] = useState<VideoCustomizationConfig>({
    characterId: '',
    enableCaptions: true,
    captionTemplate: 'Ella',
    enableMagicZooms: true,
    enableMagicBrolls: true,
    magicBrollsPercentage: 40,
  });

  const { data: articles, isLoading: articlesLoading } = useArticles();
  const createSubmission = useCreateSubmission();

  // Check for article query parameter
  useEffect(() => {
    const articleId = searchParams.get('article');
    if (articleId) {
      setSelectedArticleId(articleId);
      setMode('existing');
    }
  }, [searchParams]);

  const handleFileChange = (file: File | null) => {
    setFile(file);
    setMode('upload');
    setSelectedArticleId('');
  };

  const handleArticleSelect = (articleId: string) => {
    setSelectedArticleId(articleId);
    setMode('existing');
    setFile(null);
  };

  const handleLanguageToggle = (code: string) => {
    setSelectedLanguages((prev) => {
      if (prev.includes(code)) {
        // Don't allow deselecting if it's the last one
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== code);
      }
      return [...prev, code];
    });
  };

  const handleContentToggle = (key: keyof typeof contentOptions) => {
    setContentOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCustomThumbnailChange = (file: File | null) => {
    setCustomThumbnailFile(file);

    if (file) {
      // Generate preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearCustomThumbnail = () => {
    setCustomThumbnailFile(null);
    setThumbnailPreview(null);
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 [ArticleForm] Form submitted');

    if (mode === 'upload' && !file) {
      console.error('❌ [ArticleForm] No file selected');
      alert('Please upload a file');
      return;
    }

    if (mode === 'existing' && !selectedArticleId) {
      console.error('❌ [ArticleForm] No article selected');
      alert('Please select an article');
      return;
    }

    if (selectedLanguages.length === 0) {
      console.error('❌ [ArticleForm] No languages selected');
      alert('Please select at least one language');
      return;
    }

    setIsUploading(true);

    try {
      if (mode === 'upload') {
        // Upload new article and create submissions
        console.log('📝 [ArticleForm] Preparing upload:', {
          fileName: file!.name,
          fileSize: file!.size,
          fileType: file!.type,
          languages: selectedLanguages,
          category: selectedCategory,
          contentOptions,
        });

        const formData = new FormData();
        formData.append('file', file!);
        formData.append('languages', JSON.stringify(selectedLanguages));
        formData.append('category', selectedCategory);
        formData.append('generateVideo', String(contentOptions.generateVideo));
        formData.append('generateAudio', String(contentOptions.generateAudio));
        formData.append('generatePodcast', String(contentOptions.generatePodcast));
        formData.append('generateQuiz', String(contentOptions.generateQuiz));
        formData.append('generateInteractivePodcast', String(contentOptions.generateInteractivePodcast));

        // Add custom thumbnail if provided
        if (thumbnailMode === 'custom-upload' && customThumbnailFile) {
          formData.append('customThumbnail', customThumbnailFile);
          formData.append('skipThumbnailGeneration', 'true');
        }

        // Add video customization if video generation is enabled
        if (contentOptions.generateVideo) {
          formData.append('videoCustomization', JSON.stringify(videoCustomization));
        }

        console.log('📤 [ArticleForm] Making POST request to /api/articles/upload');

        // Await the response to get the submission ID
        const response = await axios.post('/api/articles/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 300000, // 5 minutes
        });

        console.log('✅ [ArticleForm] Upload completed:', response.data);

        // Extract the first submission ID from the response
        const submissions = response.data.data?.submissions || [];
        if (submissions.length > 0) {
          const submissionId = submissions[0].id;
          console.log('🔀 [ArticleForm] Navigating to submission detail page:', submissionId);
          router.push(`${basePath}/submissions/${submissionId}`);
        } else {
          // Fallback to articles list if no submissions were created
          console.log('⚠️ [ArticleForm] No submissions created, navigating to articles list');
          router.push(`${basePath}/articles`);
        }
      } else {
        // Create submissions for existing article
        console.log('📝 [ArticleForm] Creating submission for existing article:', {
          articleId: selectedArticleId,
          languages: selectedLanguages,
          contentOptions,
        });

        // Create first submission and get its ID, then navigate immediately
        const firstLanguage = selectedLanguages[0];

        // Create first submission and get its ID
        const firstSubmission = await createSubmission.mutateAsync({
          articleId: selectedArticleId,
          language: firstLanguage as any,
          generateAudio: contentOptions.generateAudio,
          generatePodcast: contentOptions.generatePodcast,
          generateVideo: contentOptions.generateVideo,
          generateQuiz: contentOptions.generateQuiz,
          generateInteractivePodcast: contentOptions.generateInteractivePodcast,
          videoCustomization: contentOptions.generateVideo ? videoCustomization : undefined,
        } as any);

        console.log('✅ [ArticleForm] First submission created:', firstSubmission);

        // Create remaining submissions in the background (don't await)
        for (let i = 1; i < selectedLanguages.length; i++) {
          const language = selectedLanguages[i];
          createSubmission.mutateAsync({
            articleId: selectedArticleId,
            language: language as any,
            generateAudio: contentOptions.generateAudio,
            generatePodcast: contentOptions.generatePodcast,
            generateVideo: contentOptions.generateVideo,
            generateQuiz: contentOptions.generateQuiz,
            generateInteractivePodcast: contentOptions.generateInteractivePodcast,
            videoCustomization: contentOptions.generateVideo ? videoCustomization : undefined,
          } as any).catch((error) => {
            console.error(`❌ [ArticleForm] Failed to create submission for ${language}:`, error);
          });
        }

        // Navigate to the first submission's detail page
        console.log('🔀 [ArticleForm] Navigating to submission detail page:', firstSubmission.data.id);
        router.push(`${basePath}/submissions/${firstSubmission.data.id}`);
      }
    } catch (error) {
      console.error('❌ [ArticleForm] Error:', error);
      if (error && typeof error === 'object') {
        console.error('❌ [ArticleForm] Error details:', {
          message: (error as any).message,
          response: (error as any).response,
          status: (error as any).response?.status,
          data: (error as any).response?.data,
        });
      }
      alert(error instanceof Error ? error.message : 'Failed to process request. Please try again.');
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Article Source Selection */}
      <FileUploadSection
        file={file}
        selectedArticleId={selectedArticleId}
        articles={articles}
        articlesLoading={articlesLoading}
        isUploading={isUploading}
        onFileChange={handleFileChange}
        onArticleSelect={handleArticleSelect}
        fileInputRef={fileInputRef}
      />

      {/* Category Selection - Only show for new uploads */}
      {mode === 'upload' && (
        <CategorySelector
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          isDisabled={isUploading}
        />
      )}

      {/* Thumbnail Options - Only show for new uploads */}
      {mode === 'upload' && (
        <ThumbnailOptions
          thumbnailMode={thumbnailMode}
          customThumbnailFile={customThumbnailFile}
          thumbnailPreview={thumbnailPreview}
          onThumbnailModeChange={setThumbnailMode}
          onCustomThumbnailChange={handleCustomThumbnailChange}
          onClearThumbnail={clearCustomThumbnail}
          thumbnailInputRef={thumbnailInputRef}
          isDisabled={isUploading}
        />
      )}

      {/* Language Selection */}
      <LanguageSelector
        selectedLanguages={selectedLanguages}
        onLanguageToggle={handleLanguageToggle}
        isDisabled={isUploading}
      />

      {/* Content Type Selection */}
      <ContentTypeSelector
        contentOptions={contentOptions}
        onContentToggle={handleContentToggle}
        isDisabled={isUploading}
      />

      {/* Video Customization - Only show if video generation is checked */}
      {contentOptions.generateVideo && (
        <div>
          <label className="block text-text-secondary text-sm font-medium mb-3">
            Video Customization
          </label>
          <div className="p-6 rounded-2xl bg-white-10 border-2 border-white-20">
            <VideoCustomization
              value={videoCustomization}
              onChange={setVideoCustomization}
              disabled={isUploading}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-secondary inline-flex items-center gap-2"
          disabled={isUploading}
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-gold inline-flex items-center gap-2"
          disabled={isUploading || (mode === 'upload' ? !file : !selectedArticleId)}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {mode === 'upload' ? 'Uploading...' : 'Creating...'}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              {mode === 'upload' ? 'Upload & Generate' : 'Generate Media'}
            </>
          )}
        </button>
      </div>

      {/* Upload Loading Modal */}
      <UploadLoadingModal isOpen={isUploading} />
    </form>
  );
}
