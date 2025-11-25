// Consolidated API Types
// Merged from frontend-lib/api/types.ts and frontend-lib/types.ts
// Updated for normalized schema (VideoBubble and QuizQuestion as separate tables)

// ============================================================================
// ENUMS & STATUS TYPES
// ============================================================================

export type Language = 'ENGLISH' | 'MARATHI' | 'HINDI' | 'BENGALI';
export type ContentCategory = 'EVERGREEN' | 'PERIODIC_UPDATES' | 'MARKET_UPDATES';

export type SubmissionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'PARTIAL_COMPLETE';

export type OutputStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK';

// ============================================================================
// ARTICLE & SUBMISSION
// ============================================================================

export interface Article {
  id: string;
  title: string;
  content: string;
  category: ContentCategory;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
  isApproved?: boolean;
  approvedAt?: string | null;
  approvedBy?: string | null;
}

export interface Submission {
  id: string;
  articleId: string;
  status: SubmissionStatus;
  language: Language;
  generateAudio: boolean;
  generatePodcast: boolean;
  generateVideo: boolean;
  generateQuiz: boolean;
  generateInteractivePodcast: boolean;
  createdAt: string;
  updatedAt: string;
  article?: Article;
  audioOutputs?: AudioOutput[];
  podcastOutputs?: PodcastOutput[];
  videoOutputs?: VideoOutput[];
  quizOutputs?: QuizOutput[];
  interactivePodcastOutputs?: InteractivePodcastOutput[];
}

// ============================================================================
// TAG TYPES
// ============================================================================

export interface Tag {
  id: string;
  name: string;
  description?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AudioOutputTag {
  id: string;
  audioOutputId: string;
  tagId: string;
  tag: Tag;
  sourceAudioOutputId?: string;
  isInherited: boolean;
  createdAt: string;
}

export interface PodcastOutputTag {
  id: string;
  podcastOutputId: string;
  tagId: string;
  tag: Tag;
  sourcePodcastOutputId?: string;
  isInherited: boolean;
  createdAt: string;
}

export interface VideoOutputTag {
  id: string;
  videoOutputId: string;
  tagId: string;
  tag: Tag;
  sourceVideoOutputId?: string;
  isInherited: boolean;
  createdAt: string;
}

export interface InteractivePodcastOutputTag {
  id: string;
  interactivePodcastId: string;
  tagId: string;
  tag: Tag;
  sourceInteractivePodcastId?: string;
  isInherited: boolean;
  createdAt: string;
}

export interface QuizOutputTag {
  id: string;
  quizOutputId: string;
  tagId: string;
  tag: Tag;
  sourceQuizOutputId?: string;
  isInherited: boolean;
  createdAt: string;
}

// ============================================================================
// OUTPUT TYPES
// ============================================================================

export interface AudioOutput {
  id: string;
  submissionId: string;
  status: OutputStatus;
  speakableScript?: string;
  audioFileUrl?: string;
  voiceId?: string;
  duration?: number;
  isApproved?: boolean;
  approvedAt?: string;
  approvedBy?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  tags?: AudioOutputTag[];
}

export interface PodcastSegment {
  speaker: 'interviewer' | 'guest';
  text: string;
  audioUrl?: string;
  startTime?: number;
  endTime?: number;
}

export interface WordTiming {
  word: string;
  startTime: number; // Milliseconds
  endTime: number; // Milliseconds
}

export interface PodcastOutput {
  id: string;
  submissionId: string;
  status: OutputStatus;
  title?: string;
  thumbnailUrl?: string;
  transcript?: any;
  audioFileUrl?: string;
  segments?: any;
  wordTimings?: any;
  duration?: number;
  isApproved?: boolean;
  approvedAt?: string;
  approvedBy?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  tags?: PodcastOutputTag[];
}

// ============================================================================
// VIDEO TYPES (NORMALIZED SCHEMA)
// ============================================================================

/**
 * VideoBubble - Normalized table (not JSON column)
 * Matches packages/database Prisma schema
 */
export interface VideoBubble {
  id: string;
  videoOutputId: string;
  appearsAt: number; // Milliseconds into video when bubble appears
  order: number | null; // Display order
  question: string;
  options: any; // JSON field: string[] for MCQ
  correctAnswer: any; // JSON field: number | boolean | string
  explanation: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * VideoOutput with normalized bubbles relation
 */
export interface VideoOutput {
  id: string;
  submissionId: string;
  status: OutputStatus;
  title?: string;
  script?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  heygenVideoId?: string;
  duration?: number;
  transcript?: string;
  bubbles?: VideoBubble[]; // Relation to VideoBubble table (not JSON)
  isApproved?: boolean;
  approvedAt?: string;
  approvedBy?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  tags?: VideoOutputTag[];
}

// ============================================================================
// QUIZ TYPES (NORMALIZED SCHEMA)
// ============================================================================

/**
 * QuizQuestion - Normalized table (not JSON column)
 * Matches packages/database Prisma schema
 */
export interface QuizQuestion {
  id: string;
  quizOutputId: string;
  order: number;
  type: QuestionType;
  prompt: string; // Main question text
  stem: string | null;
  options: any; // JSON field: [{id, text}] for MCQ
  correctAnswer: any; // JSON field: number | boolean | string
  explanation: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Frontend-friendly question union types
 * Used for type-safe question rendering
 */
export interface MCQQuestion {
  type: 'MULTIPLE_CHOICE';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  hint?: string;
}

export interface TrueFalseQuestion {
  type: 'TRUE_FALSE';
  question: string;
  correctAnswer: boolean;
  explanation?: string;
  hint?: string;
}

export interface FillBlankQuestion {
  type: 'FILL_BLANK';
  question: string;
  correctAnswer: string;
  acceptableAnswers?: string[];
  explanation?: string;
  hint?: string;
}

export type Question = MCQQuestion | TrueFalseQuestion | FillBlankQuestion;

/**
 * QuizOutput with normalized questions relation
 */
export interface QuizOutput {
  id: string;
  submissionId: string;
  status: OutputStatus;
  questions?: QuizQuestion[]; // Relation to QuizQuestion table (not JSON)
  isApproved?: boolean;
  approvedAt?: string;
  approvedBy?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  tags?: QuizOutputTag[];
}

// ============================================================================
// INTERACTIVE PODCAST TYPES
// ============================================================================

export interface InteractiveWord {
  word: string;
  startTime: number; // Milliseconds
  endTime: number; // Milliseconds
  isQuestion: boolean;
  options?: [string, string]; // [optionA, optionB]
  correctAnswer?: number; // 0 or 1
}

export interface PodcastChapter {
  title: string;
  startTime: number; // Milliseconds
  endTime: number; // Milliseconds
}

export interface InteractivePodcastOutput {
  id: string;
  submissionId: string;
  status: OutputStatus;
  title?: string;
  thumbnailUrl?: string;
  audioFileUrl?: string;
  duration?: number;
  segments?: any; // TranscriptSegment[] with interactive questions
  isApproved?: boolean;
  approvedAt?: string;
  approvedBy?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  tags?: InteractivePodcastOutputTag[];
}

// ============================================================================
// API REQUEST TYPES
// ============================================================================

export interface CreateArticleRequest {
  title: string;
  content: string;
}

export interface CreateSubmissionRequest {
  articleId: string;
  language?: Language;
  generateAudio?: boolean;
  generatePodcast?: boolean;
  generateVideo?: boolean;
  generateQuiz?: boolean;
  generateInteractivePodcast?: boolean;
}

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

export interface UpdateQuizRequest {
  questions: QuizQuestion[];
}

export interface UpdateVideoOutputRequest {
  bubbles?: VideoBubble[];
  title?: string;
  script?: string;
}

export interface UpdateVideoBubbleRequest {
  bubbles: VideoBubble[];
}

// ============================================================================
// API RESPONSE WRAPPERS
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
