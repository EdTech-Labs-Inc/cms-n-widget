import { z } from 'zod';
import { agentaClient } from '@repo/agenta';
import { openaiClientService } from './openai-client.service';
import { logger } from '@repo/logging';
import { config } from '../../config/constants';

/**
 * Agenta OpenAI Service
 *
 * Combines Agenta prompt management with OpenAI execution.
 * Fetches prompts from Agenta, interpolates variables, and executes with OpenAI.
 *
 * Features:
 * - Automatic prompt fetching from Agenta with caching
 * - Variable interpolation ({{variable}} syntax)
 * - Uses model configuration from Agenta
 * - Supports both structured (JSON) and text responses
 *
 * @example
 * const result = await agentaOpenAIService.generateStructured({
 *   promptSlug: 'generate_quiz_questions_prompt',
 *   variables: {
 *     articleTitle: 'My Article',
 *     articleContent: 'Content here...',
 *     language: 'English',
 *   },
 *   schema: QuizQuestionsSchema,
 *   schemaName: 'QuizQuestions',
 * });
 */
export class AgentaOpenAIService {
  /**
   * Generate structured output using an Agenta prompt
   *
   * @param params.promptSlug - The Agenta application slug (e.g., "generate_quiz_questions_prompt")
   * @param params.variables - Key-value pairs to interpolate into the prompt
   * @param params.schema - Zod schema for response validation
   * @param params.schemaName - Name for the schema (used by OpenAI)
   * @param params.temperature - Optional temperature override (defaults to Agenta/OpenAI defaults)
   */
  async generateStructured<T extends z.ZodType<any, any>>(params: {
    promptSlug: string;
    variables: Record<string, string>;
    schema: T;
    schemaName: string;
    temperature?: number;
  }): Promise<z.infer<T>> {
    try {
      // Fetch prompt configuration from Agenta
      const promptConfig = await agentaClient.getPrompt(params.promptSlug);

      // Interpolate variables into user prompt
      const interpolatedUserPrompt = agentaClient.interpolate(
        promptConfig.userPrompt,
        params.variables
      );

      // Interpolate variables into system prompt (in case it has variables too)
      const interpolatedSystemPrompt = agentaClient.interpolate(
        promptConfig.systemPrompt,
        params.variables
      );

      logger.debug('Executing Agenta prompt (structured)', {
        promptSlug: params.promptSlug,
        model: promptConfig.model,
        variableKeys: Object.keys(params.variables),
      });

      // Execute with OpenAI using Agenta's model
      const result = await openaiClientService.generateStructured({
        prompt: interpolatedUserPrompt,
        schema: params.schema,
        schemaName: params.schemaName,
        model: promptConfig.model,
        temperature: params.temperature,
        systemPrompt: interpolatedSystemPrompt,
      });

      return result;
    } catch (error) {
      logger.error('Agenta structured generation failed', {
        promptSlug: params.promptSlug,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate text output using an Agenta prompt
   *
   * @param params.promptSlug - The Agenta application slug
   * @param params.variables - Key-value pairs to interpolate into the prompt
   * @param params.temperature - Optional temperature override
   * @param params.maxTokens - Optional max tokens limit
   */
  async generateText(params: {
    promptSlug: string;
    variables: Record<string, string>;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    try {
      // Fetch prompt configuration from Agenta
      const promptConfig = await agentaClient.getPrompt(params.promptSlug);

      // Interpolate variables into user prompt
      const interpolatedUserPrompt = agentaClient.interpolate(
        promptConfig.userPrompt,
        params.variables
      );

      // Interpolate variables into system prompt (in case it has variables too)
      const interpolatedSystemPrompt = agentaClient.interpolate(
        promptConfig.systemPrompt,
        params.variables
      );

      logger.debug('Executing Agenta prompt (text)', {
        promptSlug: params.promptSlug,
        model: promptConfig.model,
        variableKeys: Object.keys(params.variables),
      });

      // Execute with OpenAI using Agenta's model
      const result = await openaiClientService.generateText({
        prompt: interpolatedUserPrompt,
        model: promptConfig.model,
        temperature: params.temperature,
        systemPrompt: interpolatedSystemPrompt,
        maxTokens: params.maxTokens,
      });

      return result;
    } catch (error) {
      logger.error('Agenta text generation failed', {
        promptSlug: params.promptSlug,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get raw prompt configuration from Agenta
   * Useful for debugging or custom handling
   */
  async getPromptConfig(promptSlug: string) {
    return agentaClient.getPrompt(promptSlug);
  }

  /**
   * Clear all cached prompts
   * Useful for forcing a refresh during development
   */
  clearCache() {
    agentaClient.clearCache();
  }

  /**
   * Clear a specific prompt from cache
   */
  clearPromptCache(promptSlug: string) {
    agentaClient.clearPromptCache(promptSlug);
  }
}

// Singleton instance
export const agentaOpenAIService = new AgentaOpenAIService();
