/**
 * API Request and Response types
 */

import type { Language, QuestionType } from './media.types';

// ============================================
// GENERIC API RESPONSE WRAPPERS
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success?: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// ARTICLE REQUESTS
// ============================================

export interface CreateArticleRequest {
  title: string;
  content: string;
  category?: string;
  thumbnailUrl?: string;
}

export interface UpdateArticleRequest {
  title?: string;
  content?: string;
  category?: string;
  thumbnailUrl?: string;
}

// ============================================
// SUBMISSION REQUESTS
// ============================================

export interface CreateSubmissionRequest {
  articleId: string;
  language?: Language;
  generateAudio?: boolean;
  generatePodcast?: boolean;
  generateVideo?: boolean;
  generateQuiz?: boolean;
  generateInteractivePodcast?: boolean;
}

export interface UpdateSubmissionRequest {
  status?: string;
  generateAudio?: boolean;
  generatePodcast?: boolean;
  generateVideo?: boolean;
  generateQuiz?: boolean;
  generateInteractivePodcast?: boolean;
}

// ============================================
// TAG REQUESTS
// ============================================

export interface CreateTagRequest {
  name: string;
  description?: string;
  category?: string;
}

export interface UpdateTagRequest {
  name?: string;
  description?: string;
  category?: string;
}

export interface AddTagRequest {
  tagId: string;
}

// ============================================
// QUIZ REQUESTS (Updated for normalized schema)
// ============================================

export interface QuizQuestionRequest {
  order: number;
  type: QuestionType;
  prompt: string;
  stem?: string;
  options?: any; // JSON: string[] or structured
  correctAnswer: any; // JSON: number | boolean | string
  explanation?: string;
}

export interface UpdateQuizRequest {
  questions: QuizQuestionRequest[];
}

export interface CreateQuizQuestionRequest {
  quizOutputId: string;
  order: number;
  type: QuestionType;
  prompt: string;
  stem?: string;
  options?: any;
  correctAnswer: any;
  explanation?: string;
}

export interface UpdateQuizQuestionRequest {
  order?: number;
  type?: QuestionType;
  prompt?: string;
  stem?: string;
  options?: any;
  correctAnswer?: any;
  explanation?: string;
}

// ============================================
// VIDEO REQUESTS (Updated for normalized schema)
// ============================================

export interface VideoBubbleRequest {
  appearsAt: number;
  order?: number;
  question: string;
  options: any; // JSON
  correctAnswer: any; // JSON
  explanation?: string;
}

export interface UpdateVideoOutputRequest {
  title?: string;
  script?: string;
  bubbles?: VideoBubbleRequest[];
}

export interface CreateVideoBubbleRequest {
  videoOutputId: string;
  appearsAt: number;
  order?: number;
  question: string;
  options: any;
  correctAnswer: any;
  explanation?: string;
}

export interface UpdateVideoBubbleRequest {
  appearsAt?: number;
  order?: number;
  question?: string;
  options?: any;
  correctAnswer?: any;
  explanation?: string;
}

// Legacy request type for compatibility
export interface UpdateVideoBubblesRequest {
  bubbles: VideoBubbleRequest[];
}

// ============================================
// ORGANIZATION REQUESTS
// ============================================

export interface CreateOrganizationRequest {
  name: string;
  slug?: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  slug?: string;
}

export interface InviteMemberRequest {
  email?: string;
  expiresAt?: string;
}

export interface UpdateMemberRoleRequest {
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
}

export interface ReviewJoinRequestRequest {
  status: 'APPROVED' | 'DENIED';
}

// ============================================
// AUTHENTICATION REQUESTS
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  fullName?: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface UpdatePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// ============================================
// PROFILE REQUESTS
// ============================================

export interface UpdateProfileRequest {
  fullName?: string;
  email?: string;
}

// ============================================
// MEDIA GENERATION REQUESTS
// ============================================

export interface RegenerateMediaRequest {
  feedback?: string;
  prompt?: string;
}

export interface ApproveMediaRequest {
  isApproved: boolean;
}
