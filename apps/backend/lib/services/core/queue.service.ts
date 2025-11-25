import { getMediaGenerationQueue, JobTypes } from '../../config/queue';

/**
 * Queue Service - Manage background jobs with BullMQ
 *
 * Features:
 * - Add jobs to queue for async processing
 * - Track job status
 * - Handle retries and failures
 */
export class QueueService {
  /**
   * Add a job to generate audio
   */
  async addAudioGenerationJob(data: {
    articleId: string;
    submissionId: string;
    outputId: string;
    language: string;
    organizationId: string;
  }) {
    return await getMediaGenerationQueue().add(
      JobTypes.GENERATE_AUDIO,
      data,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );
  }

  /**
   * Add a job to generate quiz
   */
  async addQuizGenerationJob(data: {
    articleId: string;
    submissionId: string;
    outputId: string;
    language: string;
    organizationId: string;
  }) {
    return await getMediaGenerationQueue().add(
      JobTypes.GENERATE_QUIZ,
      data,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );
  }

  /**
   * Add a job to generate podcast
   */
  async addPodcastGenerationJob(data: {
    articleId: string;
    submissionId: string;
    outputId: string;
    language: string;
    organizationId: string;
  }) {
    return await getMediaGenerationQueue().add(
      JobTypes.GENERATE_PODCAST,
      data,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );
  }

  /**
   * Add a job to generate video
   */
  async addVideoGenerationJob(data: {
    articleId: string;
    submissionId: string;
    language: string;
    organizationId: string;
  }) {
    return await getMediaGenerationQueue().add(
      JobTypes.GENERATE_VIDEO,
      data,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    );
  }

  /**
   * Add a job to generate interactive podcast
   */
  async addInteractivePodcastGenerationJob(data: {
    articleId: string;
    submissionId: string;
    outputId: string;
    language: string;
    organizationId: string;
  }) {
    return await getMediaGenerationQueue().add(
      JobTypes.GENERATE_INTERACTIVE_PODCAST,
      data,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );
  }

  /**
   * Add a job to generate article thumbnail
   */
  async addArticleThumbnailGenerationJob(data: {
    articleId: string;
    title: string;
    organizationId: string;
  }) {
    return await getMediaGenerationQueue().add(
      JobTypes.GENERATE_ARTICLE_THUMBNAIL,
      data,
      {
        attempts: 2, // Retry once if it fails
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );
  }

  /**
   * Add a job to process completed HeyGen video
   * (transcribe, generate bubbles)
   */
  async addVideoCompletionJob(data: {
    heygenVideoId: string;
    videoUrl: string;
  }) {
    return await getMediaGenerationQueue().add(
      JobTypes.PROCESS_VIDEO_COMPLETION,
      data,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    );
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string) {
    const job = await getMediaGenerationQueue().getJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    return {
      id: job.id,
      name: job.name,
      data: job.data,
      state,
      progress: job.progress,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
    };
  }

  /**
   * Remove a job
   */
  async removeJob(jobId: string) {
    const job = await getMediaGenerationQueue().getJob(jobId);
    if (job) {
      await job.remove();
    }
  }
}

// Singleton instance
export const queueService = new QueueService();
