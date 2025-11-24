// API Request/Response types

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
  }
  
  export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }
  
  export interface CreateArticleRequest {
    title: string;
    content: string;
  }
  
  export interface CreateSubmissionRequest {
    articleId: string;
    generateAudio?: boolean;
    generatePodcast?: boolean;
    generateVideo?: boolean;
    generateQuiz?: boolean;
    generateVideoQuiz?: boolean;
    generateInteractivePodcast?: boolean;
  }
  
  export interface UpdateQuizRequest {
    questions: any[]; // Will be typed properly with Zod schemas
  }
  