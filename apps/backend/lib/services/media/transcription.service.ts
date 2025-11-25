import { awsTranscribeService } from '../external/aws-transcribe.service';
import { logger } from '@repo/logging';

/**
 * Transcription Service - AWS Transcribe integration for audio/video
 *
 * Handles:
 * - Audio transcription with word-level timings
 * - Language-specific transcription
 */
export class TranscriptionService {
  /**
   * Get audio transcript with word timings using AWS Transcribe
   */
  async getAudioTranscript(
    audioUrl: string,
    language: string
  ): Promise<{
    transcript: string;
    wordTimings: Array<{ text: string; start_time: number; end_time: number }>;
  }> {
    try {
      logger.info('Starting AWS Transcribe for audio', { language });

      // Use AWS Transcribe to get detailed transcript with word-level timings
      const { transcript, wordTimings } = await awsTranscribeService.transcribeVideo(
        audioUrl,
        language
      );

      logger.info('Transcription complete', { wordCount: wordTimings.length });

      return { transcript, wordTimings };
    } catch (error) {
      logger.error('Error getting audio transcript', {
        language,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Return empty arrays if transcription fails - will cause generation to fail gracefully
      throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Singleton instance
export const transcriptionService = new TranscriptionService();
