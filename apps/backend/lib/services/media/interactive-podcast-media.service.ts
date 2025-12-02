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
 * Interactive Podcast Media Service - Generate audio from approved script
 *
 * This is part of the decoupled generation flow where:
 * 1. Script was generated first (by interactive-podcast-script.service.ts)
 * 2. User reviewed and edited the script
 * 3. User optionally selected voice
 * 4. This service generates the actual audio with ElevenLabs, transcribes, and adds interactive questions
 */
export class InteractivePodcastMediaService {
  /**
   * Generate interactive podcast audio from an approved script
   * Called after user triggers "Generate Interactive Podcast" on the edit page
   *
   * @param ipOutputId - The InteractivePodcastOutput ID (must have script in segments field)
   * @param voiceSelection - Optional voice override
   */
  async generateFromScript(
    ipOutputId: string,
    voiceSelection?: {
      voiceId?: string;
    }
  ): Promise<void> {
    try {
      logger.info('Generating interactive podcast from approved script', { ipOutputId });

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

      // Extract script from segments field
      const segments = ipOutput.segments as any;
      let script = '';
      if (segments?.script) {
        script = segments.script;
      } else if (Array.isArray(segments)) {
        script = segments.map((seg: any) => seg.text || '').join(' ');
      }

      if (!script) {
        throw new Error('No script available - script generation may have failed');
      }

      // Update status to PROCESSING
      await prisma.interactivePodcastOutput.update({
        where: { id: ipOutputId },
        data: {
          status: 'PROCESSING',
          error: null,
        },
      });

      const article = ipOutput.submission.article;
      const orgId = article.organizationId;
      const languageToUse = ipOutput.submission.language || 'ENGLISH';

      logger.info('Processing interactive podcast', {
        scriptLength: script.length,
        language: languageToUse,
      });

      // Generate thumbnail if not already present
      let thumbnailUrl = ipOutput.thumbnailUrl;
      if (!thumbnailUrl && ipOutput.title) {
        try {
          thumbnailUrl = await thumbnailService.generateThumbnail(
            ipOutput.title,
            'interactive-podcast',
            ipOutputId,
            orgId
          );
          logger.info('Generated interactive podcast thumbnail', { thumbnailUrl });
        } catch (error) {
          logger.warn('Failed to generate interactive podcast thumbnail', {
            error: error instanceof Error ? error.message : error,
          });
        }
      }

      // Step 1: Generate audio with ElevenLabs
      const voiceId = voiceSelection?.voiceId || elevenlabsService.getGuestVoiceId();
      logger.info('Generating audio', { voiceId });

      const audioBuffer = await elevenlabsService.textToSpeech({
        text: script,
        voiceId,
      });
      logger.info('Generated audio', { audioSize: audioBuffer.length });

      // Step 2: Upload to S3
      const uploadResult = await storageService.uploadAudio(
        audioBuffer,
        ipOutput.submissionId,
        'interactive-podcast.mp3',
        orgId
      );
      logger.info('Uploaded to S3', {
        cloudfrontUrl: uploadResult.cloudfrontUrl,
      });

      // Step 3: Get transcript with word timings using AWS Transcribe
      const { wordTimings, transcript } = await transcriptionService.getAudioTranscript(
        uploadResult.s3Url,
        languageToUse
      );
      logger.info('Got word timings from AWS Transcribe', { wordCount: wordTimings.length });

      // Step 4: Parse into TranscriptSegments
      const parsedSegments = await segmentParserService.parseIntoSegments(wordTimings, script);
      logger.info('Created segments', { segmentCount: parsedSegments.length });

      // Step 5: Identify interactive words and add questions
      const segmentsWithInteractive = await wordMatchingService.addInteractiveQuestions(
        parsedSegments,
        article.content,
        languageToUse
      );
      logger.info('Added interactive questions', {
        interactiveSegmentCount: segmentsWithInteractive.filter((s) => s.interactive).length,
      });

      // Step 6: Calculate total duration
      const duration =
        wordTimings.length > 0 ? Math.ceil(wordTimings[wordTimings.length - 1].end_time) : 0;

      // Step 7: Save to database
      await prisma.interactivePodcastOutput.update({
        where: { id: ipOutputId },
        data: {
          thumbnailUrl,
          audioFileUrl: uploadResult.cloudfrontUrl,
          duration,
          segments: segmentsWithInteractive as any,
          status: 'COMPLETED',
        },
      });

      logger.info('Interactive podcast generated successfully from script', { ipOutputId });

      // Step 8: Auto-tag the interactive podcast output
      await aiTaggingService.tagInteractivePodcast(ipOutputId);
    } catch (error) {
      logger.error('Interactive Podcast Media Generation Error', {
        error: error instanceof Error ? error.message : error,
        ipOutputId,
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
export const interactivePodcastMediaService = new InteractivePodcastMediaService();
