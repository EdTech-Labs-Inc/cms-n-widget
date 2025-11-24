// Media generation types

export type MediaType =
  | 'AUDIO'
  | 'PODCAST'
  | 'VIDEO' // Includes video quiz bubbles
  | 'QUIZ'
  | 'INTERACTIVE_PODCAST';

export type OutputStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type SubmissionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'PARTIAL_COMPLETE';

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

// Podcast types
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

// Video types
export interface VideoScript {
  title: string;
  script: string;
}

export interface VideoBubble {
  appearsAt: number; // Milliseconds into video when bubble appears
  type: 'MCQ' | 'TRUE_FALSE' | 'FILL_BLANK';
  question: string;
  options?: string[]; // For MCQ
  correctAnswer: number | boolean | string; // Index for MCQ, boolean for T/F, string for fill blank
  explanation?: string;
}

export interface GeneratedVideo {
  title: string;
  videoUrl: string;
  heygenVideoId: string;
  duration?: number; // Seconds
  transcript?: string; // Full video transcript from AWS
  bubbles: VideoBubble[]; // Quiz questions that appear during video
}

// Interactive Podcast types
export interface InteractiveWord {
  word: string;
  startTime: number; // Milliseconds
  endTime: number; // Milliseconds
  isQuestion: boolean;
  options?: [string, string]; // [optionA, optionB]
  correctAnswer?: number; // 0 or 1
}
