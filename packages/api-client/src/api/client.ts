import axios from 'axios';
import { logger } from '@repo/logging';
import type {
  Article,
  Submission,
  Tag,
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
} from '../api.types';

// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const apiClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 30 seconds
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    logger.info('API request initiated', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      headers: config.headers,
    });
    // Add auth token here if needed in the future
    return config;
  },
  (error) => {
    logger.error('API request error', {
      error: error.message,
      stack: error.stack,
    });
    return Promise.reject(error);
  },
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    logger.info('API response received', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      dataPreview: typeof response.data === 'object' ? JSON.stringify(response.data).substring(0, 200) : String(response.data).substring(0, 200),
    });
    return response;
  },
  (error) => {
    logger.error('API response error', {
      error: error.message,
      stack: error.stack,
    });
    // Handle errors globally
    if (error.response) {
      // Server responded with error status
      logger.error('Server error response', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      // Request made but no response
      logger.error('No response received', {
        message: error.message,
        request: error.request,
      });
    } else {
      // Something else happened
      logger.error('Error setting up request', {
        message: error.message,
      });
    }
    return Promise.reject(error);
  },
);

// Articles API
export const articlesApi = {
  getAll: async (): Promise<Article[]> => {
    const { data } = await apiClient.get<ApiResponse<Article[]>>('/api/articles');
    return data.data || [];
  },

  getById: async (id: string): Promise<Article> => {
    const { data } = await apiClient.get<ApiResponse<Article>>(`/api/articles/${id}`);
    if (!data.data) throw new Error('Article not found');
    return data.data;
  },

  getByIdInOrg: async (id: string, orgSlug: string): Promise<Article> => {
    const { data } = await apiClient.get<ApiResponse<Article>>(`/api/org/${orgSlug}/articles/${id}`);
    if (!data.data) throw new Error('Article not found');
    return data.data;
  },

  create: async (payload: CreateArticleRequest): Promise<Article> => {
    const { data } = await apiClient.post<ApiResponse<Article>>('/api/articles', payload);
    if (!data.data) throw new Error('Failed to create article');
    return data.data;
  },

  regenerateThumbnail: async (id: string, prompt: string) => {
    const { data } = await apiClient.post<ApiResponse<{ thumbnailUrl: string }>>(`/api/articles/${id}/regenerate-thumbnail`, { prompt });
    return data.data;
  },

  regenerateThumbnailInOrg: async (id: string, orgSlug: string, prompt: string) => {
    const { data } = await apiClient.post<ApiResponse<{ thumbnailUrl: string }>>(`/api/org/${orgSlug}/articles/${id}/regenerate-thumbnail`, { prompt });
    return data.data;
  },

  uploadThumbnail: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<ApiResponse<{ thumbnailUrl: string }>>(`/api/articles/${id}/upload-thumbnail`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.data;
  },

  uploadThumbnailInOrg: async (id: string, orgSlug: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<ApiResponse<{ thumbnailUrl: string }>>(`/api/org/${orgSlug}/articles/${id}/upload-thumbnail`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.data;
  },

  approveArticle: async (articleId: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/articles/${articleId}/approve`);
    return data.data;
  },

  approveArticleInOrg: async (articleId: string, orgSlug: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/org/${orgSlug}/articles/${articleId}/approve`);
    return data.data;
  },

  unapproveArticle: async (articleId: string) => {
    const { data} = await apiClient.patch<ApiResponse<any>>(`/api/articles/${articleId}/unapprove`);
    return data.data;
  },

  unapproveArticleInOrg: async (articleId: string, orgSlug: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/org/${orgSlug}/articles/${articleId}/unapprove`);
    return data.data;
  },
};

// Submissions API
export const submissionsApi = {
  getAll: async (
    page: number = 1,
    limit: number = 20,
    includeOuputs = false,
  ): Promise<{
    submissions: Submission[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
    stats: { totalCompleted: number; totalProcessing: number; totalFailed: number };
  }> => {
    const { data } = await apiClient.get<any>(`/api/submissions?page=${page}&limit=${limit}&includeOutputs=${includeOuputs}`);
    return {
      submissions: data.submissions || [],
      pagination: data.pagination,
      stats: data.stats || { totalCompleted: 0, totalProcessing: 0, totalFailed: 0 },
    };
  },

  getById: async (id: string): Promise<Submission> => {
    const { data } = await apiClient.get<ApiResponse<Submission>>(`/api/submissions/${id}`);
    if (!data.data) throw new Error('Submission not found');
    return data.data;
  },

  create: async (payload: CreateSubmissionRequest): Promise<Submission> => {
    const { data } = await apiClient.post<any>('/api/submissions', payload);
    const payloadData = data?.data;
    if (!payloadData) throw new Error('Failed to create submission');
    // Server currently returns an array of submissions; pick the first when a single language is used
    return Array.isArray(payloadData) ? payloadData[0] : payloadData;
  },

  updateQuiz: async (submissionId: string, quizId: string, questions: any[]) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/submissions/${submissionId}/quiz/${quizId}`, { questions });
    return data.data;
  },

  // Tag Management - Audio
  addAudioTag: async (submissionId: string, audioId: string, payload: AddTagRequest): Promise<AudioOutputTag> => {
    const { data } = await apiClient.post<ApiResponse<AudioOutputTag>>(`/api/submissions/${submissionId}/audio/${audioId}/tags`, payload);
    if (!data.data) throw new Error('Failed to add tag');
    return data.data;
  },

  removeAudioTag: async (submissionId: string, audioId: string, tagId: string): Promise<void> => {
    await apiClient.delete(`/api/submissions/${submissionId}/audio/${audioId}/tags/${tagId}`);
  },

  // Tag Management - Podcast
  addPodcastTag: async (submissionId: string, podcastId: string, payload: AddTagRequest): Promise<PodcastOutputTag> => {
    const { data } = await apiClient.post<ApiResponse<PodcastOutputTag>>(`/api/submissions/${submissionId}/podcast/${podcastId}/tags`, payload);
    if (!data.data) throw new Error('Failed to add tag');
    return data.data;
  },

  removePodcastTag: async (submissionId: string, podcastId: string, tagId: string): Promise<void> => {
    await apiClient.delete(`/api/submissions/${submissionId}/podcast/${podcastId}/tags/${tagId}`);
  },

  // Tag Management - Video
  addVideoTag: async (submissionId: string, videoId: string, payload: AddTagRequest): Promise<VideoOutputTag> => {
    const { data } = await apiClient.post<ApiResponse<VideoOutputTag>>(`/api/submissions/${submissionId}/video/${videoId}/tags`, payload);
    if (!data.data) throw new Error('Failed to add tag');
    return data.data;
  },

  removeVideoTag: async (submissionId: string, videoId: string, tagId: string): Promise<void> => {
    await apiClient.delete(`/api/submissions/${submissionId}/video/${videoId}/tags/${tagId}`);
  },

  // Tag Management - Interactive Podcast
  addInteractivePodcastTag: async (submissionId: string, ipId: string, payload: AddTagRequest): Promise<InteractivePodcastOutputTag> => {
    const { data } = await apiClient.post<ApiResponse<InteractivePodcastOutputTag>>(`/api/submissions/${submissionId}/interactive-podcast/${ipId}/tags`, payload);
    if (!data.data) throw new Error('Failed to add tag');
    return data.data;
  },

  removeInteractivePodcastTag: async (submissionId: string, ipId: string, tagId: string): Promise<void> => {
    await apiClient.delete(`/api/submissions/${submissionId}/interactive-podcast/${ipId}/tags/${tagId}`);
  },

  // Tag Management - Quiz
  addQuizTag: async (submissionId: string, quizId: string, payload: AddTagRequest): Promise<QuizOutputTag> => {
    const { data } = await apiClient.post<ApiResponse<QuizOutputTag>>(`/api/submissions/${submissionId}/quiz/${quizId}/tags`, payload);
    if (!data.data) throw new Error('Failed to add tag');
    return data.data;
  },

  removeQuizTag: async (submissionId: string, quizId: string, tagId: string): Promise<void> => {
    await apiClient.delete(`/api/submissions/${submissionId}/quiz/${quizId}/tags/${tagId}`);
  },

  // Content Updates
  updateVideoOutput: async (submissionId: string, videoId: string, payload: any) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/submissions/${submissionId}/video/${videoId}`, payload);
    return data.data;
  },

  // Approval Methods
  approveAudio: async (submissionId: string, audioId: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/submissions/${submissionId}/audio/${audioId}/approve`);
    return data.data;
  },

  approvePodcast: async (submissionId: string, podcastId: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/submissions/${submissionId}/podcast/${podcastId}/approve`);
    return data.data;
  },

  approveVideo: async (submissionId: string, videoId: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/submissions/${submissionId}/video/${videoId}/approve`);
    return data.data;
  },

  approveQuiz: async (submissionId: string, quizId: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/submissions/${submissionId}/quiz/${quizId}/approve`);
    return data.data;
  },

  approveInteractivePodcast: async (submissionId: string, ipId: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/submissions/${submissionId}/interactive-podcast/${ipId}/approve`);
    return data.data;
  },

  // Unapproval Methods
  unapproveAudio: async (submissionId: string, audioId: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/submissions/${submissionId}/audio/${audioId}/unapprove`);
    return data.data;
  },

  unapprovePodcast: async (submissionId: string, podcastId: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/submissions/${submissionId}/podcast/${podcastId}/unapprove`);
    return data.data;
  },

  unapproveVideo: async (submissionId: string, videoId: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/submissions/${submissionId}/video/${videoId}/unapprove`);
    return data.data;
  },

  unapproveQuiz: async (submissionId: string, quizId: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/submissions/${submissionId}/quiz/${quizId}/unapprove`);
    return data.data;
  },

  unapproveInteractivePodcast: async (submissionId: string, ipId: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/submissions/${submissionId}/interactive-podcast/${ipId}/unapprove`);
    return data.data;
  },

  // Script Updates
  updatePodcastScript: async (submissionId: string, podcastId: string, transcript: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/submissions/${submissionId}/podcast/${podcastId}/script`, { transcript });
    return data.data;
  },

  updateInteractivePodcastScript: async (submissionId: string, ipId: string, script: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/api/submissions/${submissionId}/interactive-podcast/${ipId}/script`, { script });
    return data.data;
  },

  // AI Script Regeneration
  regenerateVideoScript: async (submissionId: string, videoId: string, promptGuidance: string) => {
    const { data } = await apiClient.post<ApiResponse<any>>(`/api/submissions/${submissionId}/video/${videoId}/regenerate-script`, { promptGuidance });
    return data.data;
  },

  regeneratePodcastScript: async (submissionId: string, podcastId: string, promptGuidance: string) => {
    const { data } = await apiClient.post<ApiResponse<any>>(`/api/submissions/${submissionId}/podcast/${podcastId}/regenerate-script`, { promptGuidance });
    return data.data;
  },

  regenerateInteractivePodcastScript: async (submissionId: string, ipId: string, promptGuidance: string) => {
    const { data } = await apiClient.post<ApiResponse<any>>(`/api/submissions/${submissionId}/interactive-podcast/${ipId}/regenerate-script`, { promptGuidance });
    return data.data;
  },

  // Media Regeneration
  regenerateVideoMedia: async (submissionId: string, videoId: string, videoCustomization?: any) => {
    const { data } = await apiClient.post<ApiResponse<any>>(
      `/api/submissions/${submissionId}/video/${videoId}/regenerate-media`,
      videoCustomization ? { videoCustomization } : {}
    );
    return data.data;
  },

  regeneratePodcastMedia: async (submissionId: string, podcastId: string) => {
    const { data } = await apiClient.post<ApiResponse<any>>(`/api/submissions/${submissionId}/podcast/${podcastId}/regenerate-media`);
    return data.data;
  },

  regenerateInteractivePodcastMedia: async (submissionId: string, ipId: string) => {
    const { data } = await apiClient.post<ApiResponse<any>>(`/api/submissions/${submissionId}/interactive-podcast/${ipId}/regenerate-media`);
    return data.data;
  },

  // Thumbnail management - Video
  regenerateVideoThumbnail: async (submissionId: string, videoId: string, prompt: string) => {
    const { data } = await apiClient.post<ApiResponse<{ thumbnailUrl: string }>>(`/api/submissions/${submissionId}/video/${videoId}/regenerate-thumbnail`, { prompt });
    return data.data;
  },

  uploadVideoThumbnail: async (submissionId: string, videoId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<ApiResponse<{ thumbnailUrl: string }>>(`/api/submissions/${submissionId}/video/${videoId}/upload-thumbnail`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.data;
  },

  // Thumbnail management - Podcast
  regeneratePodcastThumbnail: async (submissionId: string, podcastId: string, prompt: string) => {
    const { data } = await apiClient.post<ApiResponse<{ thumbnailUrl: string }>>(`/api/submissions/${submissionId}/podcast/${podcastId}/regenerate-thumbnail`, { prompt });
    return data.data;
  },

  uploadPodcastThumbnail: async (submissionId: string, podcastId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<ApiResponse<{ thumbnailUrl: string }>>(`/api/submissions/${submissionId}/podcast/${podcastId}/upload-thumbnail`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.data;
  },

  // Thumbnail management - Interactive Podcast
  regenerateInteractivePodcastThumbnail: async (submissionId: string, ipId: string, prompt: string) => {
    const { data } = await apiClient.post<ApiResponse<{ thumbnailUrl: string }>>(`/api/submissions/${submissionId}/interactive-podcast/${ipId}/regenerate-thumbnail`, { prompt });
    return data.data;
  },

  uploadInteractivePodcastThumbnail: async (submissionId: string, ipId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<ApiResponse<{ thumbnailUrl: string }>>(`/api/submissions/${submissionId}/interactive-podcast/${ipId}/upload-thumbnail`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.data;
  },
};

// HeyGen API
export const heygenApi = {
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
};

// Submagic API
export const submagicApi = {
  getTemplates: async (): Promise<string[]> => {
    const { data } = await apiClient.get<ApiResponse<string[]>>('/api/submagic/templates');
    return data.data || [];
  },
};

// Tags API
export const tagsApi = {
  getAll: async (): Promise<Tag[]> => {
    const { data } = await apiClient.get<ApiResponse<Tag[]>>('/api/tags');
    return data.data || [];
  },

  getById: async (id: string): Promise<Tag> => {
    const { data } = await apiClient.get<ApiResponse<Tag>>(`/api/tags/${id}`);
    if (!data.data) throw new Error('Tag not found');
    return data.data;
  },

  getCategories: async (): Promise<string[]> => {
    const { data } = await apiClient.get<ApiResponse<string[]>>('/api/tags/categories');
    return data.data || [];
  },

  create: async (payload: CreateTagRequest): Promise<Tag> => {
    const { data } = await apiClient.post<ApiResponse<Tag>>('/api/tags', payload);
    if (!data.data) throw new Error('Failed to create tag');
    return data.data;
  },

  bulkCreate: async (tags: CreateTagRequest[]): Promise<Tag[]> => {
    const { data } = await apiClient.post<ApiResponse<Tag[]>>('/api/tags/bulk', { tags });
    if (!data.data) throw new Error('Failed to create tags');
    return data.data;
  },

  update: async (id: string, payload: UpdateTagRequest): Promise<Tag> => {
    const { data } = await apiClient.patch<ApiResponse<Tag>>(`/api/tags/${id}`, payload);
    if (!data.data) throw new Error('Failed to update tag');
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/tags/${id}`);
  },
};

export default apiClient;
