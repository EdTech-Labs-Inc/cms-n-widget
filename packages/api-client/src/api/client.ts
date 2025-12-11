import axios from 'axios';
import type {
  Article,
  Submission,
  Tag,
  Character,
  Voice,
  BackgroundMusic,
  VideoBumper,
  CaptionStyle,
  StandaloneVideo,
  CreateArticleRequest,
  CreateSubmissionRequest,
  CreateTagRequest,
  UpdateTagRequest,
  AddTagRequest,
  ApiResponse,
  PaginatedResponse,
  AudioOutputTag,
  PodcastOutputTag,
  VideoOutputTag,
  QuizOutputTag,
  InteractivePodcastOutputTag,
  Language,
} from '../api.types';

export const apiClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 5 minutes
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Browser-safe logging
    if (typeof window === 'undefined') {
      console.log('[API] Request:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error.message);
    return Promise.reject(error);
  },
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Browser-safe logging (minimal in browser)
    if (typeof window === 'undefined') {
      console.log('[API] Response:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    console.error('[API] Response error:', error.message);
    if (error.response) {
      console.error('[API] Server error:', error.response.status, error.response.statusText);
    }
    return Promise.reject(error);
  },
);

// Articles API - All methods require orgSlug for org-scoped routes
export const articlesApi = {
  getAll: async (orgSlug: string): Promise<Article[]> => {
    const { data } = await apiClient.get<ApiResponse<Article[]>>(`/api/org/${orgSlug}/articles`);
    return data.data || [];
  },

  getById: async (orgSlug: string, id: string): Promise<Article> => {
    const { data } = await apiClient.get<ApiResponse<Article>>(`/api/org/${orgSlug}/articles/${id}`);
    if (!data.data) throw new Error('Article not found');
    return data.data;
  },

  create: async (orgSlug: string, payload: CreateArticleRequest): Promise<Article> => {
    const { data } = await apiClient.post<ApiResponse<Article>>(`/api/org/${orgSlug}/articles`, payload);
    if (!data.data) throw new Error('Failed to create article');
    return data.data;
  },

  regenerateThumbnail: async (orgSlug: string, id: string, prompt: string) => {
    const { data } = await apiClient.post<ApiResponse<{ thumbnailUrl: string }>>(`/api/org/${orgSlug}/articles/${id}/regenerate-thumbnail`, { prompt });
    return data.data;
  },

  uploadThumbnail: async (orgSlug: string, id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<ApiResponse<{ thumbnailUrl: string }>>(`/api/org/${orgSlug}/articles/${id}/upload-thumbnail`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.data;
  },

  approveArticle: async (orgSlug: string, articleId: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/org/${orgSlug}/articles/${articleId}/approve`);
    return data.data;
  },

  unapproveArticle: async (orgSlug: string, articleId: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/org/${orgSlug}/articles/${articleId}/unapprove`);
    return data.data;
  },
};

// Submissions API - All methods require orgSlug for org-scoped routes
export const submissionsApi = {
  getAll: async (
    orgSlug: string,
    page: number = 1,
    limit: number = 20,
    includeOutputs = false,
  ): Promise<{
    submissions: Submission[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
    stats: { totalCompleted: number; totalProcessing: number; totalFailed: number };
  }> => {
    const { data } = await apiClient.get<any>(`/api/org/${orgSlug}/submissions?page=${page}&limit=${limit}&includeOutputs=${includeOutputs}`);
    return {
      submissions: data.submissions || [],
      pagination: data.pagination,
      stats: data.stats || { totalCompleted: 0, totalProcessing: 0, totalFailed: 0 },
    };
  },

  getById: async (orgSlug: string, id: string): Promise<Submission> => {
    const { data } = await apiClient.get<ApiResponse<Submission>>(`/api/org/${orgSlug}/submissions/${id}`);
    if (!data.data) throw new Error('Submission not found');
    return data.data;
  },

  create: async (orgSlug: string, payload: CreateSubmissionRequest): Promise<Submission> => {
    const { data } = await apiClient.post<any>(`/api/org/${orgSlug}/submissions`, payload);
    const payloadData = data?.data;
    if (!payloadData) throw new Error('Failed to create submission');
    // Server currently returns an array of submissions; pick the first when a single language is used
    return Array.isArray(payloadData) ? payloadData[0] : payloadData;
  },

  updateQuiz: async (orgSlug: string, submissionId: string, quizId: string, questions: any[]) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/org/${orgSlug}/submissions/${submissionId}/quiz/${quizId}`, { questions });
    return data.data;
  },

  // Tag Management - Audio
  addAudioTag: async (orgSlug: string, submissionId: string, audioId: string, payload: AddTagRequest): Promise<AudioOutputTag> => {
    const { data } = await apiClient.post<ApiResponse<AudioOutputTag>>(`/api/org/${orgSlug}/submissions/${submissionId}/audio/${audioId}/tags`, payload);
    if (!data.data) throw new Error('Failed to add tag');
    return data.data;
  },

  removeAudioTag: async (orgSlug: string, submissionId: string, audioId: string, tagId: string): Promise<void> => {
    await apiClient.delete(`/api/org/${orgSlug}/submissions/${submissionId}/audio/${audioId}/tags/${tagId}`);
  },

  // Tag Management - Podcast
  addPodcastTag: async (orgSlug: string, submissionId: string, podcastId: string, payload: AddTagRequest): Promise<PodcastOutputTag> => {
    const { data } = await apiClient.post<ApiResponse<PodcastOutputTag>>(`/api/org/${orgSlug}/submissions/${submissionId}/podcast/${podcastId}/tags`, payload);
    if (!data.data) throw new Error('Failed to add tag');
    return data.data;
  },

  removePodcastTag: async (orgSlug: string, submissionId: string, podcastId: string, tagId: string): Promise<void> => {
    await apiClient.delete(`/api/org/${orgSlug}/submissions/${submissionId}/podcast/${podcastId}/tags/${tagId}`);
  },

  // Tag Management - Video
  addVideoTag: async (orgSlug: string, submissionId: string, videoId: string, payload: AddTagRequest): Promise<VideoOutputTag> => {
    const { data } = await apiClient.post<ApiResponse<VideoOutputTag>>(`/api/org/${orgSlug}/submissions/${submissionId}/video/${videoId}/tags`, payload);
    if (!data.data) throw new Error('Failed to add tag');
    return data.data;
  },

  removeVideoTag: async (orgSlug: string, submissionId: string, videoId: string, tagId: string): Promise<void> => {
    await apiClient.delete(`/api/org/${orgSlug}/submissions/${submissionId}/video/${videoId}/tags/${tagId}`);
  },

  // Tag Management - Interactive Podcast
  addInteractivePodcastTag: async (orgSlug: string, submissionId: string, ipId: string, payload: AddTagRequest): Promise<InteractivePodcastOutputTag> => {
    const { data } = await apiClient.post<ApiResponse<InteractivePodcastOutputTag>>(`/api/org/${orgSlug}/submissions/${submissionId}/interactive-podcast/${ipId}/tags`, payload);
    if (!data.data) throw new Error('Failed to add tag');
    return data.data;
  },

  removeInteractivePodcastTag: async (orgSlug: string, submissionId: string, ipId: string, tagId: string): Promise<void> => {
    await apiClient.delete(`/api/org/${orgSlug}/submissions/${submissionId}/interactive-podcast/${ipId}/tags/${tagId}`);
  },

  // Tag Management - Quiz
  addQuizTag: async (orgSlug: string, submissionId: string, quizId: string, payload: AddTagRequest): Promise<QuizOutputTag> => {
    const { data } = await apiClient.post<ApiResponse<QuizOutputTag>>(`/api/org/${orgSlug}/submissions/${submissionId}/quiz/${quizId}/tags`, payload);
    if (!data.data) throw new Error('Failed to add tag');
    return data.data;
  },

  removeQuizTag: async (orgSlug: string, submissionId: string, quizId: string, tagId: string): Promise<void> => {
    await apiClient.delete(`/api/org/${orgSlug}/submissions/${submissionId}/quiz/${quizId}/tags/${tagId}`);
  },

  // Content Updates
  updateVideoOutput: async (orgSlug: string, submissionId: string, videoId: string, payload: any) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/org/${orgSlug}/submissions/${submissionId}/video/${videoId}`, payload);
    return data.data;
  },

  // Approval Methods
  approveAudio: async (orgSlug: string, submissionId: string, audioId: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/org/${orgSlug}/submissions/${submissionId}/audio/${audioId}/approve`);
    return data.data;
  },

  approvePodcast: async (orgSlug: string, submissionId: string, podcastId: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/org/${orgSlug}/submissions/${submissionId}/podcast/${podcastId}/approve`);
    return data.data;
  },

  approveVideo: async (orgSlug: string, submissionId: string, videoId: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/org/${orgSlug}/submissions/${submissionId}/video/${videoId}/approve`);
    return data.data;
  },

  approveQuiz: async (orgSlug: string, submissionId: string, quizId: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/org/${orgSlug}/submissions/${submissionId}/quiz/${quizId}/approve`);
    return data.data;
  },

  approveInteractivePodcast: async (orgSlug: string, submissionId: string, ipId: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/org/${orgSlug}/submissions/${submissionId}/interactive-podcast/${ipId}/approve`);
    return data.data;
  },

  // Unapproval Methods
  unapproveAudio: async (orgSlug: string, submissionId: string, audioId: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/org/${orgSlug}/submissions/${submissionId}/audio/${audioId}/unapprove`);
    return data.data;
  },

  unapprovePodcast: async (orgSlug: string, submissionId: string, podcastId: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/org/${orgSlug}/submissions/${submissionId}/podcast/${podcastId}/unapprove`);
    return data.data;
  },

  unapproveVideo: async (orgSlug: string, submissionId: string, videoId: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/org/${orgSlug}/submissions/${submissionId}/video/${videoId}/unapprove`);
    return data.data;
  },

  unapproveQuiz: async (orgSlug: string, submissionId: string, quizId: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/org/${orgSlug}/submissions/${submissionId}/quiz/${quizId}/unapprove`);
    return data.data;
  },

  unapproveInteractivePodcast: async (orgSlug: string, submissionId: string, ipId: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/org/${orgSlug}/submissions/${submissionId}/interactive-podcast/${ipId}/unapprove`);
    return data.data;
  },

  // Script Updates
  updatePodcastScript: async (orgSlug: string, submissionId: string, podcastId: string, transcript: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/org/${orgSlug}/submissions/${submissionId}/podcast/${podcastId}/script`, { transcript });
    return data.data;
  },

  updateInteractivePodcastScript: async (orgSlug: string, submissionId: string, ipId: string, script: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/org/${orgSlug}/submissions/${submissionId}/interactive-podcast/${ipId}/script`, { script });
    return data.data;
  },

  // AI Script Regeneration
  regenerateVideoScript: async (orgSlug: string, submissionId: string, videoId: string, promptGuidance: string) => {
    const { data } = await apiClient.post<ApiResponse<any>>(`/api/org/${orgSlug}/submissions/${submissionId}/video/${videoId}/regenerate-script`, { promptGuidance });
    return data.data;
  },

  regeneratePodcastScript: async (orgSlug: string, submissionId: string, podcastId: string, promptGuidance: string) => {
    const { data } = await apiClient.post<ApiResponse<any>>(`/api/org/${orgSlug}/submissions/${submissionId}/podcast/${podcastId}/regenerate-script`, { promptGuidance });
    return data.data;
  },

  regenerateInteractivePodcastScript: async (orgSlug: string, submissionId: string, ipId: string, promptGuidance: string) => {
    const { data } = await apiClient.post<ApiResponse<any>>(`/api/org/${orgSlug}/submissions/${submissionId}/interactive-podcast/${ipId}/regenerate-script`, { promptGuidance });
    return data.data;
  },

  // Media Regeneration (for COMPLETED outputs - regenerate with edited script)
  regenerateVideoMedia: async (orgSlug: string, submissionId: string, videoId: string, videoCustomization?: any) => {
    const { data } = await apiClient.post<ApiResponse<any>>(
      `/api/org/${orgSlug}/submissions/${submissionId}/video/${videoId}/regenerate-media`,
      videoCustomization ? { videoCustomization } : {}
    );
    return data.data;
  },

  regeneratePodcastMedia: async (orgSlug: string, submissionId: string, podcastId: string) => {
    const { data } = await apiClient.post<ApiResponse<any>>(`/api/org/${orgSlug}/submissions/${submissionId}/podcast/${podcastId}/regenerate-media`);
    return data.data;
  },

  regenerateInteractivePodcastMedia: async (orgSlug: string, submissionId: string, ipId: string) => {
    const { data } = await apiClient.post<ApiResponse<any>>(`/api/org/${orgSlug}/submissions/${submissionId}/interactive-podcast/${ipId}/regenerate-media`);
    return data.data;
  },

  // Media Generation from Script (for SCRIPT_READY outputs - first-time generation after script review)
  generateVideoMedia: async (
    orgSlug: string,
    submissionId: string,
    videoId: string,
    videoCustomization: {
      characterId: string;
      characterType: 'avatar' | 'talking_photo';
      voiceId?: string;
      enableMagicZooms?: boolean;
      enableMagicBrolls?: boolean;
      magicBrollsPercentage?: number;
      generateBubbles?: boolean;
    }
  ) => {
    const { data } = await apiClient.post<ApiResponse<any>>(
      `/api/org/${orgSlug}/submissions/${submissionId}/video/${videoId}/generate-media`,
      { videoCustomization }
    );
    return data.data;
  },

  generatePodcastMedia: async (
    orgSlug: string,
    submissionId: string,
    podcastId: string,
    voiceSelection?: {
      interviewerVoiceId?: string;
      guestVoiceId?: string;
    }
  ) => {
    const { data } = await apiClient.post<ApiResponse<any>>(
      `/api/org/${orgSlug}/submissions/${submissionId}/podcast/${podcastId}/generate-media`,
      voiceSelection ? { voiceSelection } : {}
    );
    return data.data;
  },

  generateInteractivePodcastMedia: async (
    orgSlug: string,
    submissionId: string,
    ipId: string,
    voiceSelection?: {
      voiceId?: string;
    }
  ) => {
    const { data } = await apiClient.post<ApiResponse<any>>(
      `/api/org/${orgSlug}/submissions/${submissionId}/interactive-podcast/${ipId}/generate-media`,
      voiceSelection ? { voiceSelection } : {}
    );
    return data.data;
  },

  // Thumbnail management - Video
  regenerateVideoThumbnail: async (orgSlug: string, submissionId: string, videoId: string, prompt: string) => {
    const { data } = await apiClient.post<ApiResponse<{ thumbnailUrl: string }>>(`/api/org/${orgSlug}/submissions/${submissionId}/video/${videoId}/regenerate-thumbnail`, { prompt });
    return data.data;
  },

  uploadVideoThumbnail: async (orgSlug: string, submissionId: string, videoId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<ApiResponse<{ thumbnailUrl: string }>>(`/api/org/${orgSlug}/submissions/${submissionId}/video/${videoId}/upload-thumbnail`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.data;
  },

  // Thumbnail management - Podcast
  regeneratePodcastThumbnail: async (orgSlug: string, submissionId: string, podcastId: string, prompt: string) => {
    const { data } = await apiClient.post<ApiResponse<{ thumbnailUrl: string }>>(`/api/org/${orgSlug}/submissions/${submissionId}/podcast/${podcastId}/regenerate-thumbnail`, { prompt });
    return data.data;
  },

  uploadPodcastThumbnail: async (orgSlug: string, submissionId: string, podcastId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<ApiResponse<{ thumbnailUrl: string }>>(`/api/org/${orgSlug}/submissions/${submissionId}/podcast/${podcastId}/upload-thumbnail`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.data;
  },

  // Thumbnail management - Interactive Podcast
  regenerateInteractivePodcastThumbnail: async (orgSlug: string, submissionId: string, ipId: string, prompt: string) => {
    const { data } = await apiClient.post<ApiResponse<{ thumbnailUrl: string }>>(`/api/org/${orgSlug}/submissions/${submissionId}/interactive-podcast/${ipId}/regenerate-thumbnail`, { prompt });
    return data.data;
  },

  uploadInteractivePodcastThumbnail: async (orgSlug: string, submissionId: string, ipId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<ApiResponse<{ thumbnailUrl: string }>>(`/api/org/${orgSlug}/submissions/${submissionId}/interactive-podcast/${ipId}/upload-thumbnail`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.data;
  },
};

// HeyGen Avatar Types
export interface ProcessedAvatar {
  id: string;
  name: string;
  type: 'avatar' | 'talking_photo';
  previewUrl: string;
  voiceId: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AvatarsResponse {
  avatars: ProcessedAvatar[];
  total: number;
}

// HeyGen API - No org scoping needed (global config)
export const heygenApi = {
  /**
   * @deprecated Use getAvatars() instead - fetches dynamic avatars from HeyGen API
   */
  getCharacters: async (): Promise<Array<{
    id: string;
    name: string;
    type: 'talking_photo' | 'avatar';
    characterId: string;
    voiceId: string;
    photoUrl: string;
    description?: string;
  }>> => {
    const { data } = await apiClient.get<ApiResponse<Array<{
      id: string;
      name: string;
      type: 'talking_photo' | 'avatar';
      characterId: string;
      voiceId: string;
      photoUrl: string;
      description?: string;
    }>>>('/api/heygen/characters');
    return data.data || [];
  },

  /**
   * Fetch all avatars from HeyGen (cached server-side for 24 hours)
   * Pagination and search is handled on the frontend
   */
  getAvatars: async (): Promise<AvatarsResponse> => {
    console.log('🎭 [API Client] getAvatars() called');
    try {
      const { data } = await apiClient.get<ApiResponse<AvatarsResponse>>('/api/heygen/avatars');
      console.log('🎭 [API Client] Response:', data);
      return data.data || { avatars: [], total: 0 };
    } catch (error) {
      console.error('🎭 [API Client] Error fetching avatars:', error);
      throw error;
    }
  },

  /**
   * Force refresh the avatar cache (admin use)
   */
  refreshAvatarCache: async (): Promise<{ totalAvatars: number }> => {
    const { data } = await apiClient.post<ApiResponse<{ totalAvatars: number }>>('/api/heygen/avatars');
    return data.data || { totalAvatars: 0 };
  },
};

// Submagic API - No org scoping needed (global config)
export const submagicApi = {
  getTemplates: async (): Promise<string[]> => {
    const { data } = await apiClient.get<ApiResponse<string[]>>('/api/submagic/templates');
    return data.data || [];
  },
};

// Tags API - All methods require orgSlug for org-scoped routes
export const tagsApi = {
  getAll: async (orgSlug: string): Promise<Tag[]> => {
    const { data } = await apiClient.get<ApiResponse<Tag[]>>(`/api/org/${orgSlug}/tags`);
    return data.data || [];
  },

  getById: async (orgSlug: string, id: string): Promise<Tag> => {
    const { data } = await apiClient.get<ApiResponse<Tag>>(`/api/org/${orgSlug}/tags/${id}`);
    if (!data.data) throw new Error('Tag not found');
    return data.data;
  },

  getCategories: async (orgSlug: string): Promise<string[]> => {
    const { data } = await apiClient.get<ApiResponse<string[]>>(`/api/org/${orgSlug}/tags/categories`);
    return data.data || [];
  },

  create: async (orgSlug: string, payload: CreateTagRequest): Promise<Tag> => {
    const { data } = await apiClient.post<ApiResponse<Tag>>(`/api/org/${orgSlug}/tags`, payload);
    if (!data.data) throw new Error('Failed to create tag');
    return data.data;
  },

  bulkCreate: async (orgSlug: string, tags: CreateTagRequest[]): Promise<Tag[]> => {
    const { data } = await apiClient.post<ApiResponse<Tag[]>>(`/api/org/${orgSlug}/tags/bulk`, { tags });
    if (!data.data) throw new Error('Failed to create tags');
    return data.data;
  },

  update: async (orgSlug: string, id: string, payload: UpdateTagRequest): Promise<Tag> => {
    const { data } = await apiClient.patch<ApiResponse<Tag>>(`/api/org/${orgSlug}/tags/${id}`, payload);
    if (!data.data) throw new Error('Failed to update tag');
    return data.data;
  },

  delete: async (orgSlug: string, id: string): Promise<void> => {
    await apiClient.delete(`/api/org/${orgSlug}/tags/${id}`);
  },
};

// Characters API - Organization-scoped
export const charactersApi = {
  getAll: async (orgSlug: string): Promise<Character[]> => {
    const { data } = await apiClient.get<ApiResponse<{ characters: Character[]; total: number }>>(`/api/org/${orgSlug}/characters`);
    return data.data?.characters || [];
  },
};

// Voices API - Organization-scoped
export const voicesApi = {
  getAll: async (orgSlug: string): Promise<Voice[]> => {
    const { data } = await apiClient.get<ApiResponse<{ voices: Voice[]; total: number }>>(`/api/org/${orgSlug}/voices`);
    return data.data?.voices || [];
  },
};

// Feature Flags API
export const featureFlagsApi = {
  getAll: async (): Promise<Record<string, boolean>> => {
    const { data } = await apiClient.get<{ flags: Record<string, boolean> }>('/api/feature-flags');
    return data.flags || {};
  },
};

// Background Music API - Organization-scoped
export const backgroundMusicApi = {
  getAll: async (orgSlug: string): Promise<BackgroundMusic[]> => {
    const { data } = await apiClient.get<ApiResponse<{ backgroundMusic: BackgroundMusic[]; total: number }>>(`/api/org/${orgSlug}/background-music`);
    return data.data?.backgroundMusic || [];
  },
};

// Video Bumpers API - Organization-scoped
export const videoBumpersApi = {
  getAll: async (orgSlug: string, position?: 'start' | 'end' | 'both'): Promise<VideoBumper[]> => {
    const url = position
      ? `/api/org/${orgSlug}/bumpers?position=${position}`
      : `/api/org/${orgSlug}/bumpers`;
    const { data } = await apiClient.get<ApiResponse<{ bumpers: VideoBumper[]; total: number }>>(url);
    return data.data?.bumpers || [];
  },
};

// Caption Styles API - Organization-scoped
export const captionStylesApi = {
  getAll: async (orgSlug: string): Promise<CaptionStyle[]> => {
    const { data } = await apiClient.get<ApiResponse<{ captionStyles: CaptionStyle[]; total: number }>>(`/api/org/${orgSlug}/caption-styles`);
    return data.data?.captionStyles || [];
  },
};

// Standalone Video Create API - Organization-scoped
export interface CreateStandaloneVideoRequest {
  // Multi-language support
  title: string;
  languages: Language[];
  translations?: Record<string, { script: string; title: string }>; // Per-language overrides (user-edited)
  // Content
  script: string;
  sourceType: 'prompt' | 'script_file' | 'content_file';
  characterId: string;
  // Legacy fields - optional for new characters using heygenImageKey from Character record
  heygenAvatarId?: string | null;
  heygenCharacterType?: 'avatar' | 'talking_photo' | null;
  voiceId: string;
  captionStyleId: string;
  enableMagicZooms: boolean;
  enableMagicBrolls: boolean;
  magicBrollsPercentage: number;
  backgroundMusicId?: string | null;
  backgroundMusicVolume?: number;
  startBumperId?: string | null;
  startBumperDuration?: number | null;
  endBumperId?: string | null;
  endBumperDuration?: number | null;
}

export interface CreateStandaloneVideoResponse {
  videos: Array<{
    id: string;
    language: Language;
    status: string;
    jobId: string;
  }>;
  batchId: string | null;
}

// Translation preview API
export interface TranslateScriptRequest {
  script: string;
  title: string;
  targetLanguage: Language;
}

export interface TranslateScriptResponse {
  translatedScript: string;
  translatedTitle: string;
}

export const standaloneVideoApi = {
  getAll: async (orgSlug: string): Promise<StandaloneVideo[]> => {
    const { data } = await apiClient.get<ApiResponse<{ videos: StandaloneVideo[]; total: number }>>(`/api/org/${orgSlug}/videos`);
    return data.data?.videos || [];
  },

  create: async (orgSlug: string, payload: CreateStandaloneVideoRequest): Promise<CreateStandaloneVideoResponse> => {
    const { data } = await apiClient.post<ApiResponse<CreateStandaloneVideoResponse>>(`/api/org/${orgSlug}/video/create`, payload);
    if (!data.data) throw new Error('Failed to create video');
    return data.data;
  },

  translateScript: async (orgSlug: string, payload: TranslateScriptRequest): Promise<TranslateScriptResponse> => {
    const { data } = await apiClient.post<ApiResponse<TranslateScriptResponse>>(`/api/org/${orgSlug}/video/translate-script`, payload);
    if (!data.data) throw new Error('Failed to translate script');
    return data.data;
  },
};

export default apiClient;
