import {
    TranscribeClient,
    StartTranscriptionJobCommand,
    GetTranscriptionJobCommand,
    TranscriptionJobStatus,
    LanguageCode,
  } from '@aws-sdk/client-transcribe';
  import axios from 'axios';
  import { logger } from '@repo/logging';
  
  /**
   * AWS Transcribe Service - Generate word-level transcripts from videos
   *
   * Features:
   * - Start transcription jobs with S3 video URLs
   * - Word-level timestamps for precise bubble placement
   * - Multilingual support (English, Marathi, Hindi, Bengali)
   * - Poll for job completion with exponential backoff
   */
  export class AWSTranscribeService {
    private client: TranscribeClient;
  
    constructor() {
      // Use same credentials as S3 (from environment or IAM role)
      const config: any = {
        region: process.env.S3_REGION || 'ap-south-1',
      };
  
      // Only add credentials if provided (for local development)
      if (process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY) {
        config.credentials = {
          accessKeyId: process.env.S3_ACCESS_KEY,
          secretAccessKey: process.env.S3_SECRET_KEY,
        };
      }
  
      this.client = new TranscribeClient(config);
    }
  
    /**
     * Transcribe a video file with word-level timestamps
     *
     * @param s3VideoUrl - Full S3 URL to video file
     * @param language - Language code (ENGLISH, MARATHI, HINDI, BENGALI)
     * @returns Transcript with word timings
     */
    async transcribeVideo(
      s3VideoUrl: string,
      language: string = 'ENGLISH'
    ): Promise<{
      transcript: string;
      wordTimings: Array<{
        text: string;
        start_time: number;
        end_time: number;
      }>;
      duration: number;
    }> {
      try {
        logger.info('Starting AWS transcription job', {
          s3VideoUrl,
          language,
        });

        // Map our language enum to AWS language codes
        const languageCode = this.mapLanguageToAWSCode(language);
  
        // Generate unique job name
        const jobName = `video-transcribe-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
        // Start transcription job
        const startCommand = new StartTranscriptionJobCommand({
          TranscriptionJobName: jobName,
          LanguageCode: languageCode,
          Media: {
            MediaFileUri: s3VideoUrl,
          },
          MediaFormat: 'mp4',
          Settings: {
            ShowSpeakerLabels: false,
          },
          // Note: Word timestamps are enabled by default in AWS Transcribe
          // and returned in the transcript JSON results
        });
  
        await this.client.send(startCommand);
        logger.info('AWS transcription job started', {
          jobName,
          languageCode,
        });

        // Poll for completion
        const transcriptJson = await this.pollForCompletion(jobName);
  
        // Parse transcript JSON
        const { transcript, wordTimings, duration } = this.parseTranscript(transcriptJson);

        logger.info('AWS transcription complete', {
          wordCount: wordTimings.length,
          duration,
          transcriptLength: transcript.length,
        });

        return { transcript, wordTimings, duration };
      } catch (error) {
        logger.error('AWS transcription failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          s3VideoUrl,
          language,
        });
        throw new Error(`Failed to transcribe video: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  
    /**
     * Poll transcription job until complete
     * Uses exponential backoff
     */
    private async pollForCompletion(jobName: string): Promise<any> {
      const MAX_ATTEMPTS = 60; // 60 attempts = ~10 minutes max
      const INITIAL_DELAY = 5000; // Start with 5 seconds
      const MAX_DELAY = 30000; // Max 30 seconds between polls
  
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const getCommand = new GetTranscriptionJobCommand({
          TranscriptionJobName: jobName,
        });
  
        const response = await this.client.send(getCommand);
        const status = response.TranscriptionJob?.TranscriptionJobStatus;

        logger.debug('AWS transcription job status check', {
          jobName,
          status,
          attempt: attempt + 1,
          maxAttempts: MAX_ATTEMPTS,
        });

        if (status === TranscriptionJobStatus.COMPLETED) {
          // Get transcript JSON from URL
          const transcriptUrl = response.TranscriptionJob?.Transcript?.TranscriptFileUri;
          if (!transcriptUrl) {
            throw new Error('Transcript URL not found in response');
          }
  
          // Download transcript JSON
          const transcriptResponse = await axios.get(transcriptUrl);
          return transcriptResponse.data;
        }
  
        if (status === TranscriptionJobStatus.FAILED) {
          const failureReason = response.TranscriptionJob?.FailureReason;
          throw new Error(`Transcription job failed: ${failureReason}`);
        }
  
        // Calculate delay with exponential backoff
        const delay = Math.min(INITIAL_DELAY * Math.pow(1.5, attempt), MAX_DELAY);
        logger.debug('Waiting before next transcription poll', {
          jobName,
          delaySeconds: delay / 1000,
          attempt: attempt + 1,
        });
        await this.sleep(delay);
      }
  
      throw new Error(`Transcription job timed out after ${MAX_ATTEMPTS} attempts`);
    }
  
    /**
     * Parse AWS Transcribe JSON response
     */
    private parseTranscript(transcriptJson: any): {
      transcript: string;
      wordTimings: Array<{
        text: string;
        start_time: number;
        end_time: number;
      }>;
      duration: number;
    } {
      const results = transcriptJson.results;
  
      // Get full transcript text
      const transcript = results.transcripts[0]?.transcript || '';
  
      // Extract word-level timings (including punctuation)
      const wordTimings: Array<{
        text: string;
        start_time: number;
        end_time: number;
        isPunctuation?: boolean;
      }> = [];
  
      // AWS Transcribe returns items array with word-level data
      // Include both 'pronunciation' (words) and 'punctuation' items for accurate display
      for (const item of results.items || []) {
        if (item.type === 'pronunciation') {
          wordTimings.push({
            text: item.alternatives[0]?.content || '',
            start_time: parseFloat(item.start_time || '0'),
            end_time: parseFloat(item.end_time || '0'),
            isPunctuation: false,
          });
        } else if (item.type === 'punctuation') {
          // Punctuation items don't have timing in AWS, attach to previous word
          if (wordTimings.length > 0) {
            const lastWord = wordTimings[wordTimings.length - 1];
            lastWord.text += item.alternatives[0]?.content || '';
          }
        }
      }
  
      // Calculate duration from last word
      const duration = wordTimings.length > 0
        ? Math.ceil(wordTimings[wordTimings.length - 1].end_time)
        : 0;
  
      return { transcript, wordTimings, duration };
    }
  
    /**
     * Map our language enum to AWS Transcribe language codes
     */
    private mapLanguageToAWSCode(language: string): LanguageCode {
      const languageMap: Record<string, LanguageCode> = {
        ENGLISH: 'en-US' as LanguageCode,
        MARATHI: 'hi-IN' as LanguageCode, // AWS doesn't have Marathi, use Hindi
        HINDI: 'hi-IN' as LanguageCode,
        BENGALI: 'bn-IN' as LanguageCode,
      };
  
      return languageMap[language] || ('en-US' as LanguageCode);
    }
  
    /**
     * Sleep helper
     */
    private sleep(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }
  
  // Singleton instance
  export const awsTranscribeService = new AWSTranscribeService();
  