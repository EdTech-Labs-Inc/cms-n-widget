import { agentaOpenAIService } from '../external/agenta-openai.service';
import { elevenlabsService } from '../external/elevenlabs.service';
import { storageService } from '../core/storage.service';
import { aiTaggingService } from '../ai-tagging.service';
import { prisma } from '../../config/database';
import { logger } from '@repo/logging';

/**
 * Audio Service - Generate article audio narration
 *
 * Workflow:
 * 1. Convert article to speakable script (OpenAI)
 * 2. Generate audio from script (ElevenLabs TTS)
 * 3. Upload audio to storage (S3/R2)
 * 4. Save audio URL and metadata to database
 */
export class AudioService {
  /**
   * Generate audio narration for an article
   */
  async generateAudio(articleId: string, outputId: string, organizationId?: string): Promise<void> {
    try {
      // Update status to PROCESSING
      await prisma.audioOutput.update({
        where: { id: outputId },
        data: { status: 'PROCESSING' },
      });

      // Get article content
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        include: { submissions: { where: { audioOutputs: { some: { id: outputId } } } } },
      });

      if (!article) {
        throw new Error('Article not found');
      }

      const submission = article.submissions[0];
      if (!submission) {
        throw new Error('Submission not found');
      }

      // Use organizationId from parameter or article
      const orgId = organizationId || article.organizationId;

      const languageToUse = submission.language || 'ENGLISH';
      logger.info('Generating audio for article', {
        articleId: article.id,
        title: article.title,
        language: languageToUse
      });

      // Step 1: Convert article to speakable script
      const speakableScript = await this.generateSpeakableScript(article.title, article.content, languageToUse);

      // Step 2: Generate audio using ElevenLabs
      const audioBuffer = await elevenlabsService.textToSpeech({
        text: speakableScript,
      });

      // Step 3: Upload audio to storage (returns both CloudFront and S3 URLs)
      const uploadResult = await storageService.uploadAudio(
        audioBuffer,
        submission.id,
        'article-audio.mp3',
        orgId
      );

      // Estimate duration (very rough estimate: ~150 words per minute, ~2 bytes per char)
      const estimatedDuration = Math.ceil(speakableScript.split(' ').length / 150 * 60);

      // Step 4: Save to database (use CloudFront URL for user delivery)
      await prisma.audioOutput.update({
        where: { id: outputId },
        data: {
          speakableScript,
          audioFileUrl: uploadResult.cloudfrontUrl,
          voiceId: elevenlabsService['defaultVoiceId'], // Access default voice ID
          duration: estimatedDuration,
          status: 'COMPLETED',
        },
      });

      logger.info('Audio generated successfully', {
        articleId,
        outputId,
        duration: estimatedDuration
      });

      // Step 5: Auto-tag the audio output (only for English)
      await aiTaggingService.tagAudioOutput(outputId);
    } catch (error) {
      logger.error('Audio generation error', {
        articleId,
        outputId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Update status to FAILED with error message
      await prisma.audioOutput.update({
        where: { id: outputId },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Convert article content to a speakable script using Agenta prompts
   * Removes markdown formatting, fixes headings, ensures natural flow
   */
  private async generateSpeakableScript(title: string, content: string, language: string): Promise<string> {
    const languageMap: Record<string, string> = {
      ENGLISH: 'English',
      MARATHI: 'Marathi',
      HINDI: 'Hindi',
      BENGALI: 'Bengali',
    };
    const languageName = languageMap[language] || 'English';

    return await agentaOpenAIService.generateText({
      promptSlug: 'generate_speakable_script_prompt',
      variables: {
        articleTitle: title,
        articleContent: content,
        languageName,
      },
      temperature: 0.3, // Lower temperature for more consistent output
    });
  }
}

// Singleton instance
export const audioService = new AudioService();
