// Consolidated API Types
// Merged from frontend-lib/api/types.ts and frontend-lib/types.ts
// Updated for normalized schema (VideoBubble and QuizQuestion as separate tables)

// ============================================================================
// ENUMS & STATUS TYPES
// ============================================================================

export type Language = 'ENGLISH' | 'MARATHI' | 'HINDI' | 'BENGALI' | 'GUJARATI';
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
// VOICE & CHARACTER TYPES
// ============================================================================

export interface Voice {
  id: string;
  name: string;
  elevenlabsVoiceId: string;
  description?: string | null;
  previewAudioUrl?: string | null;
  gender?: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  id: string;
  name: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  previewUrl?: string | null; // HeyGen motion preview video URL
  heygenAvatarId?: string | null; // Legacy: for old avatar-based characters
  heygenImageKey: string; // Required: for Avatar IV API
  heygenAvatarGroupId?: string | null;
  characterType: 'avatar' | 'talking_photo';
  gender?: string | null;
  voiceId: string;
  voice: {
    id: string;
    name: string;
    elevenlabsVoiceId: string;
    gender?: string | null;
  };
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

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

export interface VideoCustomizationConfig {
  characterId: string; // Our DB Character ID - heygenImageKey and voiceId are looked up from Character
  captionStyleId: string; // Our DB CaptionStyle ID - submagicTemplate is looked up from CaptionStyle
  enableMagicZooms: boolean;
  enableMagicBrolls: boolean;
  magicBrollsPercentage: number;
  generateBubbles: boolean;
  // Background Music
  backgroundMusicId?: string | null;
  backgroundMusicVolume?: number; // 0-1, default 0.15
  // Bumpers
  startBumperId?: string | null;
  startBumperDuration?: number | null; // seconds, for image bumpers
  endBumperId?: string | null;
  endBumperDuration?: number | null; // seconds, for image bumpers
}

export interface CreateSubmissionRequest {
  articleId: string;
  language?: Language;
  generateAudio?: boolean;
  generatePodcast?: boolean;
  generateVideo?: boolean;
  generateQuiz?: boolean;
  generateInteractivePodcast?: boolean;
  videoCustomization?: VideoCustomizationConfig;
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
// VIDEO CREATE RESOURCE TYPES
// ============================================================================

export interface BackgroundMusic {
  id: string;
  name: string;
  previewAudioUrl: string;
  audioUrl: string;
  duration?: number | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoBumper {
  id: string;
  name: string;
  type: 'image' | 'video';
  position: 'start' | 'end' | 'both';
  mediaUrl: string;
  thumbnailUrl?: string | null;
  duration?: number | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaptionStyle {
  id: string;
  name: string;
  submagicTemplate: string;
  previewImageUrl?: string | null;
  logoUrl?: string | null;
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StandaloneVideo {
  id: string;
  organizationId: string;
  createdByProfileId?: string | null;
  createdByProfile?: {
    id: string;
    fullName?: string | null;
    email: string;
  } | null;
  status: OutputStatus;
  // Multi-language support
  language: Language;
  batchId?: string | null;
  // Content
  title?: string | null;
  script: string;
  sourceType: 'prompt' | 'script_file' | 'content_file';
  characterId: string;
  heygenAvatarId: string;
  heygenCharacterType: 'avatar' | 'talking_photo';
  voiceId: string;
  captionStyleId?: string | null;
  enableMagicZooms: boolean;
  enableMagicBrolls: boolean;
  magicBrollsPercentage: number;
  backgroundMusicId?: string | null;
  backgroundMusicVolume: number;
  startBumperId?: string | null;
  startBumperDuration?: number | null;
  endBumperId?: string | null;
  endBumperDuration?: number | null;
  heygenVideoId?: string | null;
  submagicProjectId?: string | null;
  elevenlabsAudioUrl?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  duration?: number | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
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
