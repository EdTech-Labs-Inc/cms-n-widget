/**
 * Media-related types
 * Includes Article, Submission, and all Output types
 * Updated for normalized VideoBubble and QuizQuestion schema
 */

// ============================================
// ENUMS & BASE TYPES
// ============================================

export type Language = 'ENGLISH' | 'MARATHI' | 'HINDI' | 'BENGALI' | 'GUJARATI';
export type ContentCategory = 'EVERGREEN' | 'PERIODIC_UPDATES' | 'MARKET_UPDATES';
export type OutputStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type SubmissionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'PARTIAL_COMPLETE';

export type MediaType =
  | 'AUDIO'
  | 'PODCAST'
  | 'VIDEO'
  | 'QUIZ'
  | 'INTERACTIVE_PODCAST';

export type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'FILL_BLANK';

// ============================================
// ARTICLE
// ============================================

export interface Article {
  id: string;
  title: string;
  content: string;
  category: ContentCategory;
  thumbnailUrl?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  isApproved?: boolean;
  approvedAt?: string | Date | null;
  approvedBy?: string | null;
  userId: string;
  organizationId: string;
}

// ============================================
// SUBMISSION
// ============================================

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
  createdAt: string | Date;
  updatedAt: string | Date;
  article?: Article;
  audioOutputs?: AudioOutput[];
  podcastOutputs?: PodcastOutput[];
  videoOutputs?: VideoOutput[];
  quizOutputs?: QuizOutput[];
  interactivePodcastOutputs?: InteractivePodcastOutput[];
}

// ============================================
// TAG TYPES
// ============================================

export interface Tag {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  organizationId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AudioOutputTag {
  id: string;
  audioOutputId: string;
  tagId: string;
  tag?: Tag;
  sourceAudioOutputId?: string | null;
  isInherited: boolean;
  createdAt: string | Date;
}

export interface PodcastOutputTag {
  id: string;
  podcastOutputId: string;
  tagId: string;
  tag?: Tag;
  sourcePodcastOutputId?: string | null;
  isInherited: boolean;
  createdAt: string | Date;
}

export interface VideoOutputTag {
  id: string;
  videoOutputId: string;
  tagId: string;
  tag?: Tag;
  sourceVideoOutputId?: string | null;
  isInherited: boolean;
  createdAt: string | Date;
}

export interface InteractivePodcastOutputTag {
  id: string;
  interactivePodcastId: string;
  tagId: string;
  tag?: Tag;
  sourceInteractivePodcastId?: string | null;
  isInherited: boolean;
  createdAt: string | Date;
}

export interface QuizOutputTag {
  id: string;
  quizOutputId: string;
  tagId: string;
  tag?: Tag;
  sourceQuizOutputId?: string | null;
  isInherited: boolean;
  createdAt: string | Date;
}

// ============================================
// AUDIO OUTPUT
// ============================================

export interface AudioOutput {
  id: string;
  submissionId: string;
  status: OutputStatus;
  speakableScript?: string | null;
  audioFileUrl?: string | null;
  voiceId?: string | null;
  duration?: number | null;
  isApproved: boolean;
  approvedAt?: string | Date | null;
  approvedBy?: string | null;
  error?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  tags?: AudioOutputTag[];
}

// ============================================
// PODCAST OUTPUT
// ============================================

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
  title?: string | null;
  thumbnailUrl?: string | null;
  transcript?: string | null;
  audioFileUrl?: string | null;
  segments?: PodcastSegment[] | any; // JSON field in database
  wordTimings?: WordTiming[] | any; // JSON field in database
  duration?: number | null;
  isApproved: boolean;
  approvedAt?: string | Date | null;
  approvedBy?: string | null;
  error?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  tags?: PodcastOutputTag[];
}

// ============================================
// VIDEO OUTPUT (Updated for normalized schema)
// ============================================

/**
 * VideoBubble - Normalized table (replaces VideoOutput.bubbles JSON)
 * This matches the database VideoBubble model
 */
export interface VideoBubble {
  id: string;
  videoOutputId: string;
  appearsAt: number; // Timestamp in seconds or milliseconds
  order: number | null;
  question: string;
  options: any; // JSON field: string[] or object structure
  correctAnswer: any; // JSON field: number | boolean | string
  explanation: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * VideoOutput with normalized bubbles relation
 */
export interface VideoOutput {
  id: string;
  submissionId: string;
  status: OutputStatus;
  title?: string | null;
  script?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  heygenVideoId?: string | null;
  submagicProjectId?: string | null;
  duration?: number | null;
  transcript?: string | null;
  wordTimings?: any; // JSON field
  bubbles?: VideoBubble[]; // Relation to VideoBubble table
  heygenCharacterType?: string | null;
  heygenCharacterId?: string | null;
  heygenVoiceId?: string | null;
  submagicTemplate?: string | null;
  enableCaptions: boolean;
  enableMagicZooms: boolean;
  enableMagicBrolls: boolean;
  magicBrollsPercentage?: number | null;
  isApproved: boolean;
  approvedAt?: string | Date | null;
  approvedBy?: string | null;
  error?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  tags?: VideoOutputTag[];
}

// Legacy type for compatibility (without database fields)
export interface VideoScript {
  title: string;
  script: string;
}

export interface GeneratedVideo {
  title: string;
  videoUrl: string;
  heygenVideoId: string;
  duration?: number;
  transcript?: string;
  bubbles?: VideoBubble[];
}

// ============================================
// QUIZ OUTPUT (Updated for normalized schema)
// ============================================

/**
 * QuizQuestion - Normalized table (replaces QuizOutput.questions JSON)
 * This matches the database QuizQuestion model
 */
export interface QuizQuestion {
  id: string;
  quizOutputId: string;
  order: number;
  type: QuestionType; // 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK'
  prompt: string;
  stem?: string | null;
  options: any; // JSON field: string[] or object structure
  correctAnswer: any; // JSON field: number | boolean | string
  explanation?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * QuizOutput with normalized questions relation
 */
export interface QuizOutput {
  id: string;
  submissionId: string;
  status: OutputStatus;
  questions?: QuizQuestion[]; // Relation to QuizQuestion table
  isApproved: boolean;
  approvedAt?: string | Date | null;
  approvedBy?: string | null;
  error?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  tags?: QuizOutputTag[];
}

// Legacy question types for compatibility
export interface MCQQuestion {
  type: 'MCQ';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface TrueFalseQuestion {
  type: 'TRUE_FALSE';
  question: string;
  correctAnswer: boolean;
  explanation?: string;
}

export interface FillBlankQuestion {
  type: 'FILL_BLANK';
  question: string;
  correctAnswer: string;
  acceptableAnswers?: string[];
  explanation?: string;
}

export type Question = MCQQuestion | TrueFalseQuestion | FillBlankQuestion;

// ============================================
// INTERACTIVE PODCAST OUTPUT
// ============================================

export interface Word {
  text: string;
  start_time: number;
  end_time: number;
  isBlank?: boolean;
  correctAnswer?: string;
}

export interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  words?: Word[];
  wordsBeforeInteractive?: Word[];
  wordsAfterInteractive?: Word[];
  keywords?: string[];
  interactive?: {
    triggerTime: number;
    type: 'fill-blank';
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  };
}

export interface InteractiveWord {
  word: string;
  startTime: number; // Milliseconds
  endTime: number; // Milliseconds
  isQuestion: boolean;
  options?: [string, string];
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
  title?: string | null;
  thumbnailUrl?: string | null;
  audioFileUrl?: string | null;
  duration?: number | null;
  segments?: TranscriptSegment[] | any; // JSON field in database
  isApproved: boolean;
  approvedAt?: string | Date | null;
  approvedBy?: string | null;
  error?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  tags?: InteractivePodcastOutputTag[];
}

// ============================================
// EXTERNAL SERVICE TYPES
// ============================================

// OpenAI service types
export interface OpenAIGenerateParams {
  prompt: string;
  model?: string;
  temperature?: number;
}

export interface OpenAIStructuredParams<T> extends OpenAIGenerateParams {
  schema: any; // Zod schema
}

// ElevenLabs service types
export interface ElevenLabsTTSParams {
  text: string;
  voiceId?: string;
  model?: string;
}

export interface Voice {
  voice_id: string;
  name: string;
  category: string;
}

// HeyGen service types
export interface HeyGenVideoParams {
  script: string;
  avatarId?: string;
  voiceId?: string;
}

export interface HeyGenVideoStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
}
