import { agentaOpenAIService } from '../external/agenta-openai.service';
import { elevenlabsService } from '../external/elevenlabs.service';
import { storageService } from '../core/storage.service';
import { aiTaggingService } from '../ai-tagging.service';
import { thumbnailService } from './thumbnail.service';
import { transcriptionService } from './transcription.service';
import { segmentParserService } from './segment-parser.service';
import { wordMatchingService } from './word-matching.service';
import { prisma } from '../../config/database';
import { logger } from '@repo/logging';

/**
 * Interactive Podcast Generator Service - Generate single-speaker podcast with interactive fill-in-the-blank questions
 *
 * Workflow:
 * 1. Generate title using OpenAI
 * 2. Generate thumbnail using DALL-E 3
 * 3. Generate engaging single-speaker audio script from article
 * 4. Convert to audio with ElevenLabs (one voice)
 * 5. Upload to S3 and get transcript with word timings
 * 6. Parse transcript into TranscriptSegments
 * 7. Identify key words for interactive questions (1 per 3-4 sentences)
 * 8. Generate fill-in-the-blank questions for those words
 * 9. Save segments with embedded interactive questions and thumbnail URL
 */
export class InteractivePodcastGeneratorService {
  /**
   * Generate interactive podcast from an article
   */
  async generateInteractivePodcast(articleId: string, outputId: string, organizationId?: string): Promise<void> {
    try {
      // Update status to PROCESSING
      await prisma.interactivePodcastOutput.update({
        where: { id: outputId },
        data: { status: 'PROCESSING' },
      });

      // Get article content
      const interactivePodcast = await prisma.interactivePodcastOutput.findUnique({
        where: { id: outputId },
        include: {
          submission: {
            include: { article: true }
          }
        },
      });

      if (!interactivePodcast?.submission?.article) {
        throw new Error('Article not found');
      }

      const article = interactivePodcast.submission.article;
      const languageToUse = interactivePodcast.submission.language || 'ENGLISH';

      // Use organizationId from parameter or article
      const orgId = organizationId || article.organizationId;

      logger.info('Generating interactive podcast', {
        articleTitle: article.title,
        language: languageToUse
      });

      // Step 1: Generate title using OpenAI (reuse podcast title generation)
      const title = await this.generateInteractivePodcastTitle(article.title, article.content, languageToUse);
      logger.info('Generated title', { title });

      // Step 2: Generate thumbnail (non-blocking if it fails)
      let thumbnailUrl: string | null = null;
      try {
        thumbnailUrl = await thumbnailService.generateThumbnail(
          title,
          'interactive-podcast',
          outputId,
          orgId
        );
        logger.info('Generated thumbnail', { thumbnailUrl });
      } catch (error) {
        logger.warn('Failed to generate interactive podcast thumbnail', {
          error: error instanceof Error ? error.message : error
        });
        // Continue without thumbnail - it's not critical
      }

      // Step 3: Generate audio script (single speaker, engaging narrative)
      const script = await this.generateAudioScript(article.title, article.content, languageToUse);
      logger.info('Generated script', { scriptLength: script.length });

      // Step 3: Generate audio with ElevenLabs (single voice)
      const audioBuffer = await this.generateAudio(script, languageToUse);
      logger.info('Generated audio', { audioSize: audioBuffer.length });

      // Step 4: Upload to S3 (returns both CloudFront and S3 URLs)
      const uploadResult = await storageService.uploadAudio(
        audioBuffer,
        interactivePodcast.submissionId,
        'interactive-podcast.mp3',
        orgId
      );
      logger.info('Uploaded to S3', {
        cloudfrontUrl: uploadResult.cloudfrontUrl,
        s3Url: uploadResult.s3Url
      });

      // Step 5: Get transcript with word timings using AWS Transcribe
      // Use S3 URL (not CloudFront) as Transcribe requires direct S3 access
      const { wordTimings, transcript } = await transcriptionService.getAudioTranscript(uploadResult.s3Url, languageToUse);
      logger.info('Got word timings from AWS Transcribe', { wordCount: wordTimings.length });

      // Step 6: Parse into TranscriptSegments
      const segments = await segmentParserService.parseIntoSegments(wordTimings, script);
      logger.info('Created segments', { segmentCount: segments.length });

      // Step 7: Identify interactive words (1 per 3-4 sentences)
      const segmentsWithInteractive = await wordMatchingService.addInteractiveQuestions(
        segments,
        article.content,
        languageToUse
      );
      logger.info('Added interactive questions', {
        interactiveSegmentCount: segmentsWithInteractive.filter(s => s.interactive).length
      });

      // Step 8: Calculate total duration
      const duration = wordTimings.length > 0
        ? Math.ceil(wordTimings[wordTimings.length - 1].end_time)
        : 0;

      // Step 9: Save to database (use CloudFront URL for user delivery)
      await prisma.interactivePodcastOutput.update({
        where: { id: outputId },
        data: {
          title,
          thumbnailUrl,
          audioFileUrl: uploadResult.cloudfrontUrl,
          duration,
          segments: segmentsWithInteractive as any,
          status: 'COMPLETED',
        },
      });

      logger.info('Interactive podcast generated successfully');

      // Step 10: Auto-tag the interactive podcast output (only for English)
      await aiTaggingService.tagInteractivePodcast(outputId);
    } catch (error) {
      logger.error('Interactive Podcast Generation Error', {
        error: error instanceof Error ? error.message : error
      });

      await prisma.interactivePodcastOutput.update({
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
   * Generate title for interactive podcast (standalone educational podcast with questions)
   */
  private async generateInteractivePodcastTitle(
    articleTitle: string,
    articleContent: string,
    language: string
  ): Promise<string> {
    const languageMap: Record<string, string> = {
      ENGLISH: 'English',
      MARATHI: 'Marathi',
      HINDI: 'Hindi',
      BENGALI: 'Bengali',
    };
    const languageName = languageMap[language] || 'English';

    const title = await agentaOpenAIService.generateText({
      promptSlug: 'generate_interactive_podcast_title_prompt',
      variables: {
        articleTitle,
        articleContent,
        language: languageName,
      },
      temperature: 0.7,
      maxTokens: 50,
    });

    return title.trim();
  }

  /**
   * Generate single-speaker casual educational podcast script
   */
  private async generateAudioScript(
    articleTitle: string,
    articleContent: string,
    language: string
  ): Promise<string> {
    const languageMap: Record<string, string> = {
      ENGLISH: 'English',
      MARATHI: 'Marathi',
      HINDI: 'Hindi',
      BENGALI: 'Bengali',
    };
    const languageName = languageMap[language] || 'English';

    const script = await agentaOpenAIService.generateText({
      promptSlug: 'generate_interactive_podcast_script_prompt',
      variables: {
        articleTitle,
        articleContent,
        language: languageName,
      },
      temperature: 0.7,
      maxTokens: 1200,
    });

    return script.trim();
  }

  /**
   * Generate audio using ElevenLabs (single voice)
   */
  private async generateAudio(script: string, language: string): Promise<Buffer> {
    // Use guest voice for single-speaker narration
    const voiceId = elevenlabsService.getGuestVoiceId();

    const audioBuffer = await elevenlabsService.textToSpeech({text: script, voiceId});
    return audioBuffer;
  }

  /**
   * Regenerate interactive podcast with edited script
   * Re-generates audio and interactive questions with the updated script
   */
  async regenerateInteractivePodcast(ipOutputId: string): Promise<void> {
    try {
      logger.info('Regenerating interactive podcast', { ipOutputId });

      // Update status to PROCESSING
      await prisma.interactivePodcastOutput.update({
        where: { id: ipOutputId },
        data: { status: 'PROCESSING', error: null },
      });

      // Get the interactive podcast output with its script
      const ipOutput = await prisma.interactivePodcastOutput.findUnique({
        where: { id: ipOutputId },
        include: {
          submission: {
            include: {
              article: true,
            },
          },
        },
      });

      if (!ipOutput) {
        throw new Error('Interactive podcast output not found');
      }

      if (!ipOutput.segments) {
        throw new Error('No script available for regeneration');
      }

      // Extract script from segments
      const segments = ipOutput.segments as any;
      let script = '';
      if (Array.isArray(segments)) {
        script = segments.map((seg: any) => seg.text || '').join(' ');
      } else if (segments.script) {
        script = segments.script;
      }

      if (!script) {
        throw new Error('No script content found');
      }

      logger.info('Using edited script for regeneration', { scriptLength: script.length });

      const article = ipOutput.submission.article;
      const languageToUse = ipOutput.submission.language || 'ENGLISH';

      // Step 1: Convert script to audio with ElevenLabs
      logger.info('Generating audio from edited script');
      const audioBuffer = await this.generateAudio(script, languageToUse);

      // Get organizationId from article
      const orgId = article.organizationId;

      // Step 2: Upload audio to S3
      const uploadResult = await storageService.uploadAudio(
        audioBuffer,
        ipOutput.submissionId,
        'interactive_podcast.mp3',
        orgId
      );

      logger.info('Audio uploaded to S3', { cloudfrontUrl: uploadResult.cloudfrontUrl });

      // Step 3: Transcribe audio with word-level timings
      const { transcript, wordTimings } = await transcriptionService.getAudioTranscript(
        uploadResult.s3Url,
        languageToUse
      );

      // Calculate duration from word timings
      const duration = wordTimings.length > 0
        ? Math.ceil(wordTimings[wordTimings.length - 1].end_time)
        : 0;

      // Step 4: Parse into segments
      const parsedSegments = await segmentParserService.parseIntoSegments(wordTimings, script);

      // Step 5: Add interactive questions to segments (generates words internally)
      const finalSegments = await wordMatchingService.addInteractiveQuestions(
        parsedSegments,
        article.content,
        languageToUse
      );

      // Step 7: Update database with new audio and segments
      await prisma.interactivePodcastOutput.update({
        where: { id: ipOutputId },
        data: {
          audioFileUrl: uploadResult.cloudfrontUrl,
          duration: Math.ceil(duration),
          segments: finalSegments as any,
          status: 'COMPLETED',
        },
      });

      logger.info('Interactive podcast regenerated successfully', { ipOutputId });
    } catch (error) {
      logger.error('Interactive Podcast Regeneration Error', {
        error: error instanceof Error ? error.message : error
      });

      await prisma.interactivePodcastOutput.update({
        where: { id: ipOutputId },
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
export const interactivePodcastGeneratorService = new InteractivePodcastGeneratorService();
