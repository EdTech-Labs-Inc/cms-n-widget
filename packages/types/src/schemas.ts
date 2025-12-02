/**
 * Zod Schemas for AI Structured Outputs
 * Used with OpenAI's structured outputs feature for type-safe AI generation
 */
import { z } from 'zod';

// ============================================
// QUESTION SCHEMAS
// ============================================

export const MCQQuestionSchema = z.object({
  type: z.literal('MCQ'),
  question: z.string().min(1),
  options: z.array(z.string()).min(2).max(6),
  correctAnswer: z.number().int().min(0),
  explanation: z.string().optional(),
});

export const TrueFalseQuestionSchema = z.object({
  type: z.literal('TRUE_FALSE'),
  question: z.string().min(1),
  correctAnswer: z.boolean(),
  explanation: z.string().optional(),
});

export const FillBlankQuestionSchema = z.object({
  type: z.literal('FILL_BLANK'),
  question: z.string().min(1),
  correctAnswer: z.string().min(1),
  acceptableAnswers: z.array(z.string()).optional(),
  explanation: z.string().optional(),
});

export const QuestionSchema = z.discriminatedUnion('type', [
  MCQQuestionSchema,
  TrueFalseQuestionSchema,
  FillBlankQuestionSchema,
]);

export const VideoQuestionSchema = z.intersection(
  QuestionSchema,
  z.object({
    timestamp: z.number().min(0),
  })
);

export const QuizQuestionsSchema = z.object({
  questions: z.array(QuestionSchema).min(1),
});

export const VideoQuizQuestionsSchema = z.object({
  questions: z.array(VideoQuestionSchema).min(1),
});

// ============================================
// MEDIA GENERATION SCHEMAS
// ============================================

export const VideoScriptsSchema = z.object({
  videos: z.array(z.object({
    title: z.string().min(1),
    script: z.string().min(1),
  })).min(1).max(5),
});

// Video bubble (quiz question) schema
export const VideoBubbleSchema = z.object({
  appearsAt: z.number().min(0), // Milliseconds
  type: z.enum(['MCQ', 'TRUE_FALSE']),
  question: z.string().min(1),
  options: z.array(z.string()).optional(), // For MCQ
  correctAnswer: z.union([z.number(), z.boolean(), z.string()]),
  explanation: z.string().optional(),
});

export const VideoBubblesSchema = z.object({
  bubbles: z.array(VideoBubbleSchema).min(3).max(15),
});

export const PodcastTranscriptSchema = z.object({
  segments: z.array(z.object({
    speaker: z.enum(['interviewer', 'guest']),
    text: z.string().min(1),
  })).min(1),
});

// Interactive podcast schema - words with embedded questions
export const InteractiveWordSchema = z.object({
  word: z.string().min(1),
  startTime: z.number().min(0), // Milliseconds
  endTime: z.number().min(0), // Milliseconds
  isQuestion: z.boolean(),
  options: z.tuple([z.string(), z.string()]).optional(), // [optionA, optionB]
  correctAnswer: z.number().min(0).max(1).optional(), // 0 or 1
});

export const InteractiveTranscriptSchema = z.object({
  words: z.array(InteractiveWordSchema).min(1),
});

// ============================================
// TYPE EXPORTS (inferred from schemas)
// ============================================

export type MCQQuestionZod = z.infer<typeof MCQQuestionSchema>;
export type TrueFalseQuestionZod = z.infer<typeof TrueFalseQuestionSchema>;
export type FillBlankQuestionZod = z.infer<typeof FillBlankQuestionSchema>;
export type QuestionZod = z.infer<typeof QuestionSchema>;
export type VideoQuestionZod = z.infer<typeof VideoQuestionSchema>;
export type QuizQuestionsZod = z.infer<typeof QuizQuestionsSchema>;
export type VideoQuizQuestionsZod = z.infer<typeof VideoQuizQuestionsSchema>;
export type VideoScripts = z.infer<typeof VideoScriptsSchema>;
export type VideoBubbleZod = z.infer<typeof VideoBubbleSchema>;
export type VideoBubblesZod = z.infer<typeof VideoBubblesSchema>;
export type PodcastTranscript = z.infer<typeof PodcastTranscriptSchema>;
export type InteractiveWordZod = z.infer<typeof InteractiveWordSchema>;
export type InteractiveTranscriptZod = z.infer<typeof InteractiveTranscriptSchema>;
