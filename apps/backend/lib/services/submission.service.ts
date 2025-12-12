import { prisma } from '@/lib/config/database';
import { config } from '@/lib/config/constants';
import { queueService } from './core/queue.service';
import { aiTaggingService } from './ai-tagging.service';
import { logger } from '@repo/logging';

/**
 * Submission Service - Orchestrates media generation for submissions
 *
 * Responsibilities:
 * 1. Create submission record
 * 2. Create output records for each requested media type
 * 3. Enqueue jobs for async processing
 * 4. Track overall submission status
 */
export class SubmissionService {
  /**
   * Create a new submission and start media generation
   *
   * Script-first flow: Video, Podcast, and Interactive Podcast generate scripts first,
   * entering SCRIPT_READY status. User reviews scripts and triggers media generation separately.
   * Audio and Quiz continue with immediate full generation.
   */
  async createSubmission(params: {
    articleId: string;
    organizationId?: string; // Optional for now, will be required in Phase 5
    languages?: string[]; // Array of language codes: 'ENGLISH', 'MARATHI', 'HINDI', 'BENGALI'
    generateAudio?: boolean;
    generatePodcast?: boolean;
    generateVideo?: boolean; // Script-first: generates script, user triggers video later
    generateQuiz?: boolean;
    generateInteractivePodcast?: boolean;
    // Note: videoCustomization removed - now set on edit page after script review
  }) {
    try {
      // Verify article exists and get organizationId
      const article = await prisma.article.findUnique({
        where: { id: params.articleId },
      });

      if (!article) {
        throw new Error('Article not found');
      }

      // Use organizationId from article (required after Phase 1)
      const organizationId = article.organizationId;

      // Interactive Podcast is now standalone - no podcast dependency needed
      const generatePodcast = params.generatePodcast ?? true;
      const generateInteractivePodcast = params.generateInteractivePodcast ?? true;

      // Default to English if no languages specified
      const languages = params.languages && params.languages.length > 0 ? params.languages : ['ENGLISH'];

      logger.info('Creating submissions for article', {
        articleId: article.id,
        articleTitle: article.title,
        languages: languages.join(', '),
      });

      // Create one submission per language
      const submissions = [];
      for (const language of languages) {
        const submission = await prisma.submission.create({
          data: {
            articleId: params.articleId,
            status: 'PENDING',
            language: language as any, // Prisma enum
            generateAudio: params.generateAudio ?? true,
            generatePodcast: generatePodcast,
            generateVideo: params.generateVideo ?? true,
            generateQuiz: params.generateQuiz ?? true,
            generateInteractivePodcast: generateInteractivePodcast,
          },
        });

        logger.info('Created submission', {
          submissionId: submission.id,
          language,
          articleId: article.id,
          articleTitle: article.title,
        });

        // Create output records and enqueue jobs based on flags
        const jobPromises: Promise<any>[] = [];

        // Audio
        if (submission.generateAudio) {
          const audioOutput = await prisma.audioOutput.create({
            data: {
              submissionId: submission.id,
              status: 'PENDING',
            },
          });
          jobPromises.push(
            queueService.addAudioGenerationJob({
              articleId: params.articleId,
              submissionId: submission.id,
              outputId: audioOutput.id,
              language,
              organizationId,
            }),
          );
        }

        // Quiz
        if (submission.generateQuiz) {
          const quizOutput = await prisma.quizOutput.create({
            data: {
              submissionId: submission.id,
              status: 'PENDING',
              // questions is now a relation, not a JSON field
            },
          });
          jobPromises.push(
            queueService.addQuizGenerationJob({
              articleId: params.articleId,
              submissionId: submission.id,
              outputId: quizOutput.id,
              language,
              organizationId,
            }),
          );
        }

        // Podcast - Script-first flow: generate transcript only, user reviews before audio generation
        if (submission.generatePodcast) {
          const podcastOutput = await prisma.podcastOutput.create({
            data: {
              submissionId: submission.id,
              status: 'PENDING',
            },
          });
          jobPromises.push(
            queueService.addPodcastTranscriptGenerationJob({
              articleId: params.articleId,
              submissionId: submission.id,
              outputId: podcastOutput.id,
              language,
              organizationId,
            }),
          );
        }

        // Video - Script-first flow: generate script only, user reviews and configures character before video generation
        // Note: Video customization (character, voice, etc.) will be set on the edit page, not during submission
        if (submission.generateVideo) {
          const videoOutput = await prisma.videoOutput.create({
            data: {
              submissionId: submission.id,
              status: 'PENDING',
              // Video customization settings will be set when user triggers media generation
              // Default caption/broll settings that can be adjusted later
              enableCaptions: true,
              enableMagicZooms: true,
              enableMagicBrolls: true,
              magicBrollsPercentage: 40,
              environment: config.appEnvironment,
            },
          });

          jobPromises.push(
            queueService.addVideoScriptGenerationJob({
              articleId: params.articleId,
              submissionId: submission.id,
              outputId: videoOutput.id,
              language,
              organizationId,
            }),
          );
        }

        // Interactive Podcast - Script-first flow: generate script only, user reviews before audio generation
        if (submission.generateInteractivePodcast) {
          const interactivePodcastOutput = await prisma.interactivePodcastOutput.create({
            data: {
              submissionId: submission.id,
              status: 'PENDING',
            },
          });
          jobPromises.push(
            queueService.addInteractivePodcastScriptGenerationJob({
              articleId: params.articleId,
              submissionId: submission.id,
              outputId: interactivePodcastOutput.id,
              language,
              organizationId,
            }),
          );
        }

        // Enqueue all jobs
        await Promise.all(jobPromises);

        // Update submission status to PROCESSING
        await prisma.submission.update({
          where: { id: submission.id },
          data: { status: 'PROCESSING' },
        });

        logger.info('Enqueued media generation jobs', {
          submissionId: submission.id,
          language,
          jobCount: jobPromises.length,
        });

        submissions.push(submission);
      }

      return submissions;
    } catch (error) {
      logger.error('Create submission error', { error });
      throw error;
    }
  }

  /**
   * Get submission with all outputs (including tags)
   */
  async getSubmission(submissionId: string) {
    return await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        article: true,
        audioOutputs: {
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
        podcastOutputs: {
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
        videoOutputs: {
          include: {
            bubbles: {
              orderBy: { appearsAt: 'asc' },
            },
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
        quizOutputs: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
        interactivePodcastOutputs: {
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get all submissions (with pagination)
   */
  async getAllSubmissions(organizationId: string, page: number = 1, limit: number = 20, includeOutputs = false) {
    const skip = (page - 1) * limit;

    const inclusion = includeOutputs
      ? {
          audioOutputs: { include: { tags: { include: { tag: true } } } },
          podcastOutputs: { include: { tags: { include: { tag: true } } } },
          videoOutputs: { include: { tags: { include: { tag: true } } } },
          quizOutputs: { include: { tags: { include: { tag: true } } } },
          interactivePodcastOutputs: { include: { tags: { include: { tag: true } } } },
        }
      : {};

    // Filter by organizationId through article relation
    const where = {
      article: {
        organizationId,
      },
    };

    const [submissions, total, totalCompleted, totalProcessing, totalFailed] = await Promise.all([
      prisma.submission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          article: {
            select: {
              id: true,
              title: true,
              category: true,
            },
          },
          ...inclusion,
        },
      }),
      prisma.submission.count({ where }),
      prisma.submission.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.submission.count({ where: { ...where, status: { in: ['PROCESSING', 'PARTIAL_COMPLETE'] } } }),
      prisma.submission.count({ where: { ...where, status: 'FAILED' } }),
    ]);

    // if (includeOutputs) {
    //   submissions.forEach((submission) => {
    //     submission.audioOutputs = submission.audioOutputs || [];
    //     submission.podcastOutputs = submission.podcastOutputs || [];
    //     submission.videoOutputs = submission.videoOutputs || [];
    //     submission.quizOutputs = submission.quizOutputs || [];
    //     submission.interactivePodcastOutputs = submission.interactivePodcastOutputs || [];
    //   });
    // }

    return {
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalCompleted,
        totalProcessing,
        totalFailed,
      },
    };
  }

  /**
   * Update submission status based on output statuses
   * Called by workers after completing a job
   *
   * Status logic with script-first flow:
   * - COMPLETED: All outputs are COMPLETED
   * - PROCESSING: Any output is PROCESSING or PENDING
   * - PARTIAL_COMPLETE: Mix of COMPLETED/SCRIPT_READY/FAILED (no PROCESSING), or all scripts ready
   * - FAILED: All outputs that aren't PENDING are FAILED
   */
  async updateSubmissionStatus(submissionId: string) {
    const submission = await this.getSubmission(submissionId);

    if (!submission) {
      return;
    }

    // Collect all output statuses
    const allOutputs = [...submission.audioOutputs, ...submission.podcastOutputs, ...submission.videoOutputs, ...submission.quizOutputs, ...submission.interactivePodcastOutputs];

    const statuses = allOutputs.map((output) => output.status);
    const allCompleted = statuses.every((status) => status === 'COMPLETED');
    const anyFailed = statuses.some((status) => status === 'FAILED');
    const anyProcessing = statuses.some((status) => status === 'PROCESSING');
    const anyPending = statuses.some((status) => status === 'PENDING');
    const anyScriptReady = statuses.some((status) => status === 'SCRIPT_READY');
    const anyCompleted = statuses.some((status) => status === 'COMPLETED');

    let newStatus: 'COMPLETED' | 'FAILED' | 'PARTIAL_COMPLETE' | 'PROCESSING' = 'PROCESSING';

    if (allCompleted) {
      // All outputs fully completed
      newStatus = 'COMPLETED';
    } else if (anyProcessing || anyPending) {
      // Still processing or waiting to start
      newStatus = 'PROCESSING';
    } else if (anyFailed) {
      // Some failed, but nothing is still processing
      newStatus = (anyCompleted || anyScriptReady) ? 'PARTIAL_COMPLETE' : 'FAILED';
    } else if (anyScriptReady) {
      // All active outputs are either COMPLETED or SCRIPT_READY (scripts waiting for review)
      // This means immediate outputs (audio/quiz) are done, scripts are ready for review
      newStatus = 'PARTIAL_COMPLETE';
    }

    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: newStatus },
    });

    // If submission just completed, check for tag inheritance
    if (allCompleted) {
      await this.handleTagInheritance(submissionId);
    }
  }

  /**
   * Handle tag inheritance after submission completes
   * If this is an English submission, check for non-English siblings and inherit tags
   * If this is a non-English submission, inherit from English sibling if available
   */
  private async handleTagInheritance(submissionId: string) {
    try {
      const submission = await this.getSubmission(submissionId);

      if (!submission) {
        return;
      }

      // Get all submissions for the same article
      const allSubmissions = await prisma.submission.findMany({
        where: { articleId: submission.articleId },
        include: {
          audioOutputs: true,
          podcastOutputs: true,
          videoOutputs: true,
          quizOutputs: true,
          interactivePodcastOutputs: true,
        },
      });

      if (submission.language === 'ENGLISH') {
        // This is English submission - inherit to all completed non-English submissions
        logger.info('English submission completed - checking for non-English siblings', {
          submissionId,
        });

        const nonEnglishSubmissions = allSubmissions.filter((s: (typeof allSubmissions)[0]) => s.language !== 'ENGLISH' && s.status === 'COMPLETED' && s.id !== submissionId);

        for (const targetSubmission of nonEnglishSubmissions) {
          logger.info('Inheriting tags to non-English submission', {
            targetLanguage: targetSubmission.language,
            targetSubmissionId: targetSubmission.id,
            sourceSubmissionId: submissionId,
          });
          await aiTaggingService.inheritTags({
            sourceSubmissionId: submissionId,
            targetSubmissionId: targetSubmission.id,
          });
        }
      } else {
        // This is non-English submission - inherit from English if available
        logger.info('Non-English submission completed - looking for English source', {
          submissionId,
          language: submission.language,
        });

        const englishSubmission = allSubmissions.find((s) => s.language === 'ENGLISH' && s.status === 'COMPLETED');

        if (englishSubmission) {
          logger.info('Inheriting tags from English submission', {
            sourceSubmissionId: englishSubmission.id,
            targetSubmissionId: submissionId,
          });
          await aiTaggingService.inheritTags({
            sourceSubmissionId: englishSubmission.id,
            targetSubmissionId: submissionId,
          });
        } else {
          logger.warn('No completed English submission found yet - tags will be inherited later', {
            submissionId,
          });
        }
      }
    } catch (error) {
      logger.error('Error handling tag inheritance', { error, submissionId });
      // Don't throw - tagging is not critical
    }
  }
}

export const submissionService = new SubmissionService();
