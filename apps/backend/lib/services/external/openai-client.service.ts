import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { config } from '../../config/constants';

/**
 * OpenAI Service - Reusable wrapper for OpenAI API
 *
 * Features:
 * - Structured outputs with Zod schema validation
 * - Regular text generation
 * - Chat completions with message history
 * - Type-safe responses
 */
export class OpenAIService {
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
      // This ensures the return type matches the schema exactly
      const validated = params.schema.parse(response.parsed);
      return validated;
    } catch (error) {
      console.error('OpenAI Structured Generation Error:', error);
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
      console.error('OpenAI Text Generation Error:', error);
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
      console.error('OpenAI Chat Error:', error);
      throw new Error(`Failed to chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean article content by removing fluff and extract the actual title
   * Removes non-article content from the beginning and end (like headers, footers, metadata)
   * and extracts the most appropriate title from the article
   *
   * @example
   * const result = await openai.cleanArticleContent({
   *   rawContent: "...",
   * });
   * // Returns: { title: "The Real Article Title", cleanedContent: "The actual article content..." }
   */
  async cleanArticleContent(params: {
    rawContent: string;
    model?: string;
  }): Promise<{ title: string; cleanedContent: string }> {
    try {
      const schema = z.object({
        title: z.string().describe('The actual title of the article extracted from the content'),
        cleanedContent: z.string().describe('The article content with fluff removed from the top and bottom'),
      });

      const result = await this.generateStructured({
        prompt: `You are a document cleaning assistant. Your task is to:

1. Remove any fluff/non-article content from the beginning and end of the text (such as headers, footers, metadata, disclaimers, copyright notices, navigation elements, etc.)
2. Extract the actual title of the article (not just the first line, but the real title that best represents the article)
3. Return the cleaned article content

Here is the raw content:

${params.rawContent}

Important instructions:
- The title should be the most meaningful title that represents the article content
- Only remove content that is clearly not part of the main article
- Keep the core article content intact
- If there's no obvious fluff to remove, return the content as is
- Do not summarize or modify the article body itself`,
        schema: schema,
        schemaName: 'CleanedArticle',
        model: params.model,
        temperature: 0.3,
        systemPrompt: 'You are a document processing assistant that cleans articles and extracts accurate titles. Be conservative in removing content - only remove obvious non-article elements.',
      });

      return result as { title: string; cleanedContent: string };
    } catch (error) {
      console.error('OpenAI Article Cleaning Error:', error);
      throw new Error(`Failed to clean article content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Regenerate video script with user guidance
   * Takes the original script, user prompt guidance, and article context to create an improved version
   */
  async regenerateVideoScript(params: {
    originalScript: string;
    promptGuidance: string;
    articleTitle: string;
    articleContent: string;
    language?: string;
  }): Promise<string> {
    const language = params.language || 'ENGLISH';
    const languageMap: Record<string, string> = {
      ENGLISH: 'English',
      MARATHI: 'Marathi',
      HINDI: 'Hindi',
      BENGALI: 'Bengali',
    };
    const languageName = languageMap[language] || 'English';

    const prompt = `You are helping to improve a video script based on user feedback.

ORIGINAL SCRIPT:
${params.originalScript}

ARTICLE TITLE: ${params.articleTitle}

ARTICLE CONTEXT (for reference):
${params.articleContent.substring(0, 1000)}...

USER'S IMPROVEMENT REQUEST:
${params.promptGuidance}

REQUIREMENTS:
- The script MUST be in ${languageName}
- Keep it under 1400 characters (HeyGen limit)
- Maintain a conversational tone suitable for video narration
- Apply the user's requested improvements while staying true to the article content
- Keep the same general structure unless the user explicitly requests a different approach

Generate the improved video script in ${languageName}:`;

    return await this.generateText({
      prompt,
      systemPrompt: `You are an expert video script writer. You improve scripts based on user feedback while maintaining quality and staying within character limits. Always write in ${languageName}.`,
      temperature: 0.7,
      model: this.defaultModel,
    });
  }

  /**
   * Regenerate podcast transcript with user guidance
   * Takes the original transcript segments, user prompt guidance, and article context to create an improved version
   */
  async regeneratePodcastTranscript(params: {
    originalTranscript: string; // JSON string of segments
    promptGuidance: string;
    articleTitle: string;
    articleContent: string;
    language?: string;
  }): Promise<string> {
    const language = params.language || 'ENGLISH';
    const languageMap: Record<string, string> = {
      ENGLISH: 'English',
      MARATHI: 'Marathi',
      HINDI: 'Hindi',
      BENGALI: 'Bengali',
    };
    const languageName = languageMap[language] || 'English';

    // Parse the original transcript to show it in a readable format
    let readableTranscript = '';
    try {
      const segments = JSON.parse(params.originalTranscript) as Array<{ speaker: string; text: string }>;
      readableTranscript = segments
        .map((seg, i) => `${i + 1}. ${seg.speaker === 'interviewer' ? 'Interviewer (Herin)' : 'Guest (Isha)'}: ${seg.text}`)
        .join('\n\n');
    } catch {
      readableTranscript = params.originalTranscript;
    }

    const prompt = `You are helping to improve a podcast transcript based on user feedback.

ORIGINAL TRANSCRIPT:
${readableTranscript}

ARTICLE TITLE: ${params.articleTitle}

ARTICLE CONTEXT (for reference):
${params.articleContent.substring(0, 1000)}...

USER'S IMPROVEMENT REQUEST:
${params.promptGuidance}

REQUIREMENTS:
- The transcript MUST be in ${languageName}
- Maintain the two-speaker format: interviewer (Herin, male) and guest (Isha, female financial expert)
- Keep the conversational, interview style
- Apply the user's requested improvements
- Return as a JSON array of segments with structure: [{"speaker": "interviewer" or "guest", "text": "..."}]
- Each segment should be 2-4 sentences
- Aim for 8-12 exchanges total

Generate the improved podcast transcript in ${languageName} as JSON:`;

    const result = await this.generateText({
      prompt,
      systemPrompt: `You are an expert podcast producer. You improve podcast transcripts based on user feedback. Always write in ${languageName}. Return valid JSON only.`,
      temperature: 0.7,
      model: this.defaultModel,
    });

    // Extract JSON from the response (in case it's wrapped in markdown code blocks)
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return jsonMatch[0];
    }
    return result;
  }

  /**
   * Regenerate interactive podcast script with user guidance
   * Takes the original script, user prompt guidance, and article context to create an improved version
   */
  async regenerateInteractivePodcastScript(params: {
    originalScript: string;
    promptGuidance: string;
    articleTitle: string;
    articleContent: string;
    language?: string;
  }): Promise<string> {
    const language = params.language || 'ENGLISH';
    const languageMap: Record<string, string> = {
      ENGLISH: 'English',
      MARATHI: 'Marathi',
      HINDI: 'Hindi',
      BENGALI: 'Bengali',
    };
    const languageName = languageMap[language] || 'English';

    const prompt = `You are helping to improve an interactive podcast script based on user feedback.

ORIGINAL SCRIPT:
${params.originalScript}

ARTICLE TITLE: ${params.articleTitle}

ARTICLE CONTEXT (for reference):
${params.articleContent.substring(0, 1000)}...

USER'S IMPROVEMENT REQUEST:
${params.promptGuidance}

REQUIREMENTS:
- The script MUST be in ${languageName}
- Single speaker, casual educational style (like explaining to a friend)
- Target 750-900 words for approximately 5 minutes of audio
- Break down complex concepts simply
- Use a friendly, conversational tone
- Apply the user's requested improvements while maintaining educational value
- Suitable for embedding 10-15 interactive fill-in-the-blank questions

Generate the improved interactive podcast script in ${languageName}:`;

    return await this.generateText({
      prompt,
      systemPrompt: `You are an expert educational content creator. You improve scripts based on user feedback while maintaining a casual, friendly tone. Always write in ${languageName}.`,
      temperature: 0.7,
      model: this.defaultModel,
    });
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
   *   quality: "medium" // Will be converted to "standard" if fallback to dall-e-3
   * });
   * // Returns: "data:image/png;base64,..." for gpt-image-1
   * // Returns: "https://oaidalleapiprodscus.blob.core.windows.net/..." for dall-e-3
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
     * gpt-image-1: low, medium, high
     * dall-e-3: standard, hd
     */
    const getQualityForModel = (
      quality: 'low' | 'medium' | 'high' | 'standard' | 'hd' | undefined,
      model: string
    ): 'low' | 'medium' | 'high' | 'standard' | 'hd' => {
      if (model === 'gpt-image-1') {
        // Default for gpt-image-1
        if (!quality) return 'medium';
        // Convert dall-e-3 quality to gpt-image-1
        if (quality === 'standard') return 'medium';
        if (quality === 'hd') return 'high';
        return quality; // low, medium, high are valid
      } else {
        // dall-e-3 or other models
        if (!quality) return 'standard';
        // Convert gpt-image-1 quality to dall-e-3
        if (quality === 'low' || quality === 'medium') return 'standard';
        if (quality === 'high') return 'hd';
        return quality; // standard, hd are valid
      }
    };

    // Try with the requested model first (default: gpt-image-1)
    try {
      const qualityForModel = getQualityForModel(params.quality, requestedModel);

      // gpt-image-1 and dall-e-3 have different API signatures
      if (requestedModel === 'gpt-image-1') {
        // gpt-image-1 does NOT support response_format parameter
        // It always returns base64 data by default
        console.log(`🎨 Generating image with ${requestedModel} (quality: ${qualityForModel}): "${params.title}"`);

        const response = await this.client.images.generate({
          model: requestedModel,
          prompt: fullPrompt,
          n: 1,
          size: size,
          quality: qualityForModel,
          // Do NOT include response_format - it's not supported and will cause a 400 error
        });

        // gpt-image-1 always returns base64 data
        const base64Data = response.data?.[0]?.b64_json;
        if (!base64Data) {
          throw new Error('OpenAI did not return base64 image data');
        }

        // Convert base64 to data URL for consistency with URL-based responses
        const dataUrl = `data:image/png;base64,${base64Data}`;
        console.log(`✅ Image generated successfully with ${requestedModel} (base64 data URL)`);
        return dataUrl;
      } else {
        // dall-e-3 supports response_format and we prefer URLs
        console.log(`🎨 Generating image with ${requestedModel} (quality: ${qualityForModel}): "${params.title}"`);

        const response = await this.client.images.generate({
          model: requestedModel,
          prompt: fullPrompt,
          n: 1,
          size: size,
          quality: qualityForModel,
          response_format: 'url', // dall-e-3 supports URL format
        });

        const imageUrl = response.data?.[0]?.url;
        if (!imageUrl) {
          throw new Error('OpenAI did not return an image URL');
        }
        console.log(`✅ Image generated successfully with ${requestedModel}`);
        return imageUrl;
      }
    } catch (error) {
      console.error(`⚠️  Image generation with ${requestedModel} failed:`, error);

      // If the requested model was gpt-image-1, try falling back to dall-e-3
      if (requestedModel === 'gpt-image-1') {
        console.log(`🔄 Falling back to dall-e-3...`);
        try {
          const fallbackQuality = getQualityForModel(params.quality, 'dall-e-3');
          console.log(`🔄 Using quality '${fallbackQuality}' for dall-e-3`);

          const fallbackResponse = await this.client.images.generate({
            model: 'dall-e-3',
            prompt: fullPrompt,
            n: 1,
            size: size,
            quality: fallbackQuality,
            response_format: 'url', // dall-e-3 supports URL format
          });

          const fallbackImageUrl = fallbackResponse.data?.[0]?.url;

          if (!fallbackImageUrl) {
            throw new Error('OpenAI did not return an image URL');
          }

          console.log(`✅ Image generated successfully with dall-e-3 (fallback)`);
          return fallbackImageUrl;
        } catch (fallbackError) {
          console.error('❌ Fallback to dall-e-3 also failed:', fallbackError);
          throw new Error(`Failed to generate image with both gpt-image-1 and dall-e-3: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
        }
      }

      // If a custom model was requested and it failed, don't fallback
      throw new Error(`Failed to generate image with ${requestedModel}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Singleton instance
export const openaiService = new OpenAIService();
