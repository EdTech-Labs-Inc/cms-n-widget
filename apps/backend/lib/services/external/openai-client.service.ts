import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { logger } from '@repo/logging';
import { config } from '../../config/constants';

/**
 * OpenAI Client Service - Generic OpenAI API wrapper
 *
 * This is a lightweight wrapper around the OpenAI API providing:
 * - Structured outputs with Zod schema validation
 * - Regular text generation
 * - Chat completions with message history
 * - Image generation
 * - Type-safe responses
 *
 * For domain-specific content generation (video scripts, podcasts, etc.),
 * use the ContentRegenerationService instead.
 */
export class OpenAIClientService {
  private client: OpenAI;
  private defaultModel: string;
  private defaultTemperature: number;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
    });
    this.defaultModel = config.openai.defaultModel;
    this.defaultTemperature = config.openai.temperature;
  }

  /**
   * Generate structured output with JSON schema validation
   * Uses OpenAI's Structured Outputs feature with Zod schemas
   *
   * @example
   * const schema = z.object({ name: z.string(), age: z.number() });
   * const result = await openai.generateStructured({
   *   prompt: "Generate a person's data",
   *   schema: schema,
   *   schemaName: 'Person'
   * });
   */
  async generateStructured<T extends z.ZodType<any, any>>(params: {
    prompt: string;
    schema: T;
    schemaName: string;
    model?: string;
    temperature?: number;
    systemPrompt?: string;
  }): Promise<z.infer<T>> {
    try {
      const model = params.model || this.defaultModel;
      const temperature = params.temperature ?? this.defaultTemperature;
      const systemPrompt = params.systemPrompt || 'You are a helpful assistant that generates accurate, well-formatted responses.';

      const completion = await this.client.beta.chat.completions.parse({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: params.prompt },
        ],
        response_format: zodResponseFormat(params.schema, params.schemaName),
        temperature: temperature,
      });

      const response = completion.choices[0]?.message;

      if (!response?.parsed) {
        throw new Error('OpenAI did not return parsed content');
      }

      // Validate the parsed response against the schema to ensure type safety
      const validated = params.schema.parse(response.parsed);
      return validated;
    } catch (error) {
      logger.error('OpenAI structured generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        schemaName: params.schemaName,
        model: params.model || this.defaultModel,
      });
      throw new Error(`Failed to generate structured output: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate unstructured text response
   *
   * @example
   * const text = await openai.generateText({
   *   prompt: "Convert this article to a speakable script: ...",
   * });
   */
  async generateText(params: {
    prompt: string;
    model?: string;
    temperature?: number;
    systemPrompt?: string;
    maxTokens?: number;
  }): Promise<string> {
    try {
      const model = params.model || this.defaultModel;
      const temperature = params.temperature ?? this.defaultTemperature;
      const systemPrompt = params.systemPrompt || 'You are a helpful assistant.';

      const completion = await this.client.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: params.prompt },
        ],
        temperature: temperature,
        max_tokens: params.maxTokens,
      });

      const response = completion.choices[0]?.message?.content;

      if (!response) {
        throw new Error('OpenAI did not return content');
      }

      return response;
    } catch (error) {
      logger.error('OpenAI text generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        model: params.model || this.defaultModel,
      });
      throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Chat completion with message history
   *
   * @example
   * const response = await openai.chat({
   *   messages: [
   *     { role: 'user', content: 'Hello!' },
   *     { role: 'assistant', content: 'Hi there!' },
   *     { role: 'user', content: 'How are you?' }
   *   ]
   * });
   */
  async chat(params: {
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    try {
      const model = params.model || this.defaultModel;
      const temperature = params.temperature ?? this.defaultTemperature;

      const completion = await this.client.chat.completions.create({
        model: model,
        messages: params.messages,
        temperature: temperature,
        max_tokens: params.maxTokens,
      });

      const response = completion.choices[0]?.message?.content;

      if (!response) {
        throw new Error('OpenAI did not return content');
      }

      return response;
    } catch (error) {
      logger.error('OpenAI chat completion failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        model: params.model || this.defaultModel,
        messageCount: params.messages.length,
      });
      throw new Error(`Failed to chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate an image using GPT-Image-1 (with DALL-E 3 fallback)
   * Creates a thumbnail image based on a title and custom prompt
   * Attempts to use gpt-image-1 first, falls back to dall-e-3 if there's an error
   *
   * Note: Response format and quality parameters differ between models:
   * - gpt-image-1: Always returns base64 (no response_format parameter supported)
   *                Returns base64 as data URL: "data:image/png;base64,..."
   *                Quality: 'low', 'medium', 'high' (default: 'medium')
   * - dall-e-3: Supports 'url' response_format (returns temporary HTTPS URL)
   *             Quality: 'standard', 'hd' (default: 'standard')
   *
   * @example
   * const imageData = await openai.generateImage({
   *   title: "Understanding Stock Markets",
   *   customPrompt: "for an Indian finance app",
   *   quality: "medium"
   * });
   */
  async generateImage(params: {
    title: string;
    customPrompt?: string;
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd' | 'high' | 'medium' | 'low';
    model?: string;
  }): Promise<string> {
    const size = params.size || '1024x1024';
    const requestedModel = params.model || 'gpt-image-1';

    // Build the prompt
    const contextPrompt = params.customPrompt || 'for an Indian finance app';
    const fullPrompt = `Create a professional, visually appealing thumbnail image about: "${params.title}". This is ${contextPrompt}. The image should be appropriate for financial education content, modern, clean, and culturally relevant to India. Use professional design elements, appropriate colors, and ensure it's suitable for a finance/education context.`;

    /**
     * Convert quality parameter based on the model
     */
    const getQualityForModel = (
      quality: 'low' | 'medium' | 'high' | 'standard' | 'hd' | undefined,
      model: string
    ): 'low' | 'medium' | 'high' | 'standard' | 'hd' => {
      if (model === 'gpt-image-1') {
        if (!quality) return 'medium';
        if (quality === 'standard') return 'medium';
        if (quality === 'hd') return 'high';
        return quality;
      } else {
        if (!quality) return 'standard';
        if (quality === 'low' || quality === 'medium') return 'standard';
        if (quality === 'high') return 'hd';
        return quality;
      }
    };

    try {
      const qualityForModel = getQualityForModel(params.quality, requestedModel);

      if (requestedModel === 'gpt-image-1') {
        logger.info('Generating image with OpenAI', {
          model: requestedModel,
          quality: qualityForModel,
          title: params.title,
          size,
        });

        const response = await this.client.images.generate({
          model: requestedModel,
          prompt: fullPrompt,
          n: 1,
          size: size,
          quality: qualityForModel,
        });

        const base64Data = response.data?.[0]?.b64_json;
        if (!base64Data) {
          throw new Error('OpenAI did not return base64 image data');
        }

        const dataUrl = `data:image/png;base64,${base64Data}`;
        logger.info('Image generated successfully', {
          model: requestedModel,
          format: 'base64',
        });
        return dataUrl;
      } else {
        logger.info('Generating image with OpenAI', {
          model: requestedModel,
          quality: qualityForModel,
          title: params.title,
          size,
        });

        const response = await this.client.images.generate({
          model: requestedModel,
          prompt: fullPrompt,
          n: 1,
          size: size,
          quality: qualityForModel,
          response_format: 'url',
        });

        const imageUrl = response.data?.[0]?.url;
        if (!imageUrl) {
          throw new Error('OpenAI did not return an image URL');
        }
        logger.info('Image generated successfully', {
          model: requestedModel,
          format: 'url',
        });
        return imageUrl;
      }
    } catch (error) {
      logger.warn('Image generation failed, attempting fallback', {
        model: requestedModel,
        error: error instanceof Error ? error.message : 'Unknown error',
        title: params.title,
      });

      if (requestedModel === 'gpt-image-1') {
        logger.info('Falling back to dall-e-3 for image generation');
        try {
          const fallbackQuality = getQualityForModel(params.quality, 'dall-e-3');

          const fallbackResponse = await this.client.images.generate({
            model: 'dall-e-3',
            prompt: fullPrompt,
            n: 1,
            size: size,
            quality: fallbackQuality,
            response_format: 'url',
          });

          const fallbackImageUrl = fallbackResponse.data?.[0]?.url;
          if (!fallbackImageUrl) {
            throw new Error('OpenAI did not return an image URL');
          }

          logger.info('Image generated successfully with fallback model', {
            model: 'dall-e-3',
            format: 'url',
          });
          return fallbackImageUrl;
        } catch (fallbackError) {
          logger.error('Fallback image generation also failed', {
            fallbackModel: 'dall-e-3',
            originalModel: requestedModel,
            error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error',
          });
          throw new Error(`Failed to generate image: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
        }
      }

      throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Singleton instance
export const openaiClientService = new OpenAIClientService();
