import { agentaOpenAIService } from '../external/agenta-openai.service';
import { aiTaggingService } from '../ai-tagging.service';
import { prisma } from '../../config/database';
import { QuizQuestionsSchema } from '@repo/types';
import { logger } from '@repo/logging';

/**
 * Quiz Service - Generate quiz questions from articles
 *
 * Workflow:
 * 1. Take article content
 * 2. Use OpenAI to generate quiz questions (MCQ, TRUE_FALSE)
 * 3. Save questions to database
 */
export class QuizService {
  /**
   * Generate quiz questions for an article
   */
  async generateQuiz(articleId: string, outputId: string, language: string = 'ENGLISH', organizationId?: string): Promise<void> {
    try {
      // Update status to PROCESSING
      await prisma.quizOutput.update({
        where: { id: outputId },
        data: { status: 'PROCESSING' },
      });

      // Get article and submission to get language
      const quizOutput = await prisma.quizOutput.findUnique({
        where: { id: outputId },
        include: {
          submission: {
            include: { article: true }
          }
        }
      });

      if (!quizOutput?.submission?.article) {
        throw new Error('Article not found');
      }

      const article = quizOutput.submission.article;
      const languageToUse = quizOutput.submission.language || language;

      // Use organizationId from parameter or article
      const orgId = organizationId || article.organizationId;

      const languageMap: Record<string, string> = {
        ENGLISH: 'English',
        MARATHI: 'Marathi',
        HINDI: 'Hindi',
        BENGALI: 'Bengali',
        GUJARATI: 'Gujarati',
      };
      const languageName = languageMap[languageToUse] || 'English';

      // Generate quiz questions using Agenta + OpenAI
      const result = await agentaOpenAIService.generateStructured({
        promptSlug: 'generate_quiz_questions_prompt',
        variables: {
          articleTitle: article.title,
          articleContent: article.content,
          languageName, // Agenta prompt uses {{languageName}}
        },
        schema: QuizQuestionsSchema,
        schemaName: 'QuizQuestions',
        temperature: 0.7,
      });

      // 🔴 CRITICAL SCHEMA UPDATE: Create QuizQuestion rows (not JSON)
      // Note: Zod schema uses 'question' field, Prisma uses 'prompt'
      await prisma.quizQuestion.createMany({
        data: result.questions.map((q: any, index: number) => ({
          quizOutputId: outputId,
          order: index,
          type: q.type === 'MCQ' ? 'MULTIPLE_CHOICE' : q.type, // Map MCQ -> MULTIPLE_CHOICE for Prisma enum
          prompt: q.question, // Zod schema returns 'question', Prisma expects 'prompt'
          stem: null,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        }))
      });

      // Update quiz status to COMPLETED
      await prisma.quizOutput.update({
        where: { id: outputId },
        data: {
          status: 'COMPLETED',
        },
      });

      logger.info('Quiz generated successfully', {
        articleId,
        outputId,
        questionCount: result.questions.length
      });

      // Auto-tag the quiz output (only for English)
      await aiTaggingService.tagQuizOutput(outputId);
    } catch (error) {
      logger.error('Quiz generation error', {
        articleId,
        outputId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Update status to FAILED with error message
      await prisma.quizOutput.update({
        where: { id: outputId },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }
}

// Singleton instance
export const quizService = new QuizService();
