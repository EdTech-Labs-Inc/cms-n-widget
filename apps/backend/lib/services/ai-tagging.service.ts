import { prisma } from "@/lib/config/database";
import { openaiService } from "./external/openai.service";
import { tagService } from "./tag.service";
import { z } from "zod";
import { logger } from '@repo/logging';

/**
 * AI Tagging Service - Automatically tag content using AI
 *
 * Responsibilities:
 * - Generate appropriate tags for content using OpenAI
 * - Apply tags to all content types (audio, podcast, video, quiz, etc.)
 * - Handle language inheritance (copy tags from English to other languages)
 * - Always work in English regardless of source content language
 */

// Schema for AI tag selection response
const TagSelectionSchema = z.object({
  tagIds: z
    .array(z.string())
    .describe("Array of tag IDs that are relevant to this content"),
  reasoning: z
    .string()
    .optional()
    .describe("Brief explanation of why these tags were selected"),
});

export class AITaggingService {
  /**
   * Core method: Generate tags for content using AI
   * Always operates in English regardless of content language
   */
  async generateTags(params: {
    content: string;
    contentType: string;
    availableTags: Array<{
      id: string;
      name: string;
      category: string | null;
      description: string | null;
    }>;
  }): Promise<string[]> {
    const { content, contentType, availableTags } = params;

    // Build tag list for AI
    const tagList = availableTags
      .map((tag) => {
        const parts = [`- ${tag.name} (ID: ${tag.id})`];
        if (tag.category) parts.push(`Category: ${tag.category}`);
        if (tag.description) parts.push(`- ${tag.description}`);
        return parts.join(" ");
      })
      .join("\n");

    const prompt = `You are a content tagging expert. Analyze the following ${contentType} content and select the most relevant tags from the provided list.

IMPORTANT:
- Select 3-8 tags that best describe the content
- Focus on the main topics, themes, and subject matter
- Consider both explicit topics and implicit themes
- Prioritize accuracy over quantity
- Only select tags that are truly relevant

Content to analyze:
${content.substring(0, 3000)} ${content.length > 3000 ? "...(truncated)" : ""}

Available tags:
${tagList}

Select the tag IDs that are most relevant to this content.`;

    try {
      const result = await openaiService.generateStructured({
        prompt,
        schema: TagSelectionSchema,
        schemaName: "TagSelection",
        systemPrompt:
          "You are an expert content analyzer specializing in accurate content categorization and tagging.",
        temperature: 0.3, // Lower temperature for more consistent tagging
      });

      // Validate that all returned IDs exist in available tags
      const validTagIds = result.tagIds.filter((id) =>
        availableTags.some((tag) => tag.id === id)
      );

      logger.info('AI selected tags', {
        contentType,
        tagCount: validTagIds.length,
        reasoning: result.reasoning,
      });

      return validTagIds;
    } catch (error) {
      logger.error("AI tagging error", { error, contentType });
      throw new Error(
        `Failed to generate tags: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Tag an audio output
   */
  async tagAudioOutput(audioOutputId: string): Promise<void> {
    try {
      const audioOutput = await prisma.audioOutput.findUnique({
        where: { id: audioOutputId },
        include: {
          submission: {
            include: { article: true },
          },
        },
      });

      if (!audioOutput || !audioOutput.speakableScript) {
        logger.warn('Skipping audio tagging - no script available', { audioOutputId });
        return;
      }

      // Only auto-tag English content
      if (audioOutput.submission.language !== "ENGLISH") {
        logger.info('Skipping non-English audio - tags will be inherited', {
          audioOutputId,
          language: audioOutput.submission.language,
        });
        return;
      }

      // Get available tags
      const { tags: availableTags } = await tagService.getAllTags();

      // Generate tags
      const content = `Title: ${audioOutput.submission.article.title}\n\nScript: ${audioOutput.speakableScript}`;
      const selectedTagIds = await this.generateTags({
        content,
        contentType: "audio script",
        availableTags,
      });

      // Apply tags
      for (const tagId of selectedTagIds) {
        await prisma.audioOutputTag.create({
          data: {
            audioOutputId,
            tagId,
            isInherited: false,
          },
        });
      }

      logger.info('Tagged audio output', {
        audioOutputId,
        tagCount: selectedTagIds.length,
      });
    } catch (error) {
      logger.error('Error tagging audio output', { error, audioOutputId });
      // Don't throw - tagging is not critical to content generation
    }
  }

  /**
   * Tag a podcast output
   */
  async tagPodcastOutput(podcastOutputId: string): Promise<void> {
    try {
      const podcastOutput = await prisma.podcastOutput.findUnique({
        where: { id: podcastOutputId },
        include: {
          submission: {
            include: { article: true },
          },
        },
      });

      if (!podcastOutput || !podcastOutput.transcript) {
        logger.warn('Skipping podcast tagging - no transcript available', { podcastOutputId });
        return;
      }

      // Only auto-tag English content
      if (podcastOutput.submission.language !== "ENGLISH") {
        logger.info('Skipping non-English podcast - tags will be inherited', {
          podcastOutputId,
          language: podcastOutput.submission.language,
        });
        return;
      }

      const { tags: availableTags } = await tagService.getAllTags();

      // Parse the transcript JSON and extract text content
      let transcriptText = '';
      try {
        const segments = JSON.parse(podcastOutput.transcript as string) as Array<{
          speaker: string;
          text: string;
        }>;
        transcriptText = segments
          .map((seg) => `${seg.speaker}: ${seg.text}`)
          .join('\n');
      } catch (parseError) {
        // If parsing fails, use the raw transcript
        logger.warn('Failed to parse podcast transcript JSON, using raw value', {
          podcastOutputId,
        });
        transcriptText = podcastOutput.transcript as string;
      }

      const content = `Title: ${podcastOutput.submission.article.title}\n\nTranscript:\n${transcriptText}`;
      const selectedTagIds = await this.generateTags({
        content,
        contentType: "podcast transcript",
        availableTags,
      });

      for (const tagId of selectedTagIds) {
        await prisma.podcastOutputTag.create({
          data: {
            podcastOutputId,
            tagId,
            isInherited: false,
          },
        });
      }

      logger.info('Tagged podcast output', {
        podcastOutputId,
        tagCount: selectedTagIds.length,
      });
    } catch (error) {
      logger.error('Error tagging podcast output', { error, podcastOutputId });
    }
  }

  /**
   * Tag a video output (including individual videos and bubbles)
   */
  async tagVideoOutput(videoOutputId: string): Promise<void> {
    try {
      const videoOutput = await prisma.videoOutput.findUnique({
        where: { id: videoOutputId },
        include: {
          submission: {
            include: { article: true },
          },
        },
      });

      if (!videoOutput || !videoOutput.videoUrl) {
        logger.warn('Skipping video tagging - no video available', { videoOutputId });
        return;
      }

      // Only auto-tag English content
      if (videoOutput.submission.language !== "ENGLISH") {
        logger.info('Skipping non-English video - tags will be inherited', {
          videoOutputId,
          language: videoOutput.submission.language,
        });
        return;
      }

      const { tags: availableTags } = await tagService.getAllTags();

      // Tag the video itself (VideoOutput now represents a single video)
      const videoContent = `Title: ${videoOutput.title || "Untitled"}\n\nScript: ${
        videoOutput.transcript || "No transcript"
      }`;
      const videoTagIds = await this.generateTags({
        content: videoContent,
        contentType: "video",
        availableTags,
      });

      for (const tagId of videoTagIds) {
        await prisma.videoOutputTag.create({
          data: {
            videoOutputId,
            tagId,
            isInherited: false,
          },
        });
      }

      logger.info('Tagged video output', {
        videoOutputId,
        tagCount: videoTagIds.length,
      });

      // Note: We no longer tag individual bubbles separately - the bubbles are part of the video
      // and tags apply to the entire VideoOutput record including its bubbles
    } catch (error) {
      logger.error('Error tagging video output', { error, videoOutputId });
    }
  }

  /**
   * Tag an interactive podcast output
   */
  async tagInteractivePodcast(interactivePodcastId: string): Promise<void> {
    try {
      const interactivePodcast =
        await prisma.interactivePodcastOutput.findUnique({
          where: { id: interactivePodcastId },
          include: {
            submission: {
              include: { article: true },
            },
            // podcastOutput: true,
          },
        });

      if (!interactivePodcast || !interactivePodcast.segments) {
        logger.warn('Skipping interactive podcast tagging - no transcript available', {
          interactivePodcastId,
        });
        return;
      }

      // Only auto-tag English content
      if (interactivePodcast.submission.language !== "ENGLISH") {
        logger.info('Skipping non-English interactive podcast - tags will be inherited', {
          interactivePodcastId,
          language: interactivePodcast.submission.language,
        });
        return;
      }

      const { tags: availableTags } = await tagService.getAllTags();

      const content = `Title: ${interactivePodcast.submission.article.title}\n\nTranscript: ${interactivePodcast.segments}`;
      const selectedTagIds = await this.generateTags({
        content,
        contentType: "interactive podcast",
        availableTags,
      });

      for (const tagId of selectedTagIds) {
        await prisma.interactivePodcastOutputTag.create({
          data: {
            interactivePodcastId,
            tagId,
            isInherited: false,
          },
        });
      }

      logger.info('Tagged interactive podcast', {
        interactivePodcastId,
        tagCount: selectedTagIds.length,
      });
    } catch (error) {
      logger.error('Error tagging interactive podcast', { error, interactivePodcastId });
    }
  }

  /**
   * Tag a quiz output
   */
  async tagQuizOutput(quizOutputId: string): Promise<void> {
    try {
      const quizOutput = await prisma.quizOutput.findUnique({
        where: { id: quizOutputId },
        include: {
          submission: {
            include: { article: true },
          },
          questions: {
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!quizOutput || !quizOutput.questions || quizOutput.questions.length === 0) {
        logger.warn('Skipping quiz tagging - no questions available', { quizOutputId });
        return;
      }

      // Only auto-tag English content
      if (quizOutput.submission.language !== "ENGLISH") {
        logger.info('Skipping non-English quiz - tags will be inherited', {
          quizOutputId,
          language: quizOutput.submission.language,
        });
        return;
      }

      const { tags: availableTags } = await tagService.getAllTags();

      // Extract questions text for analysis
      const questions = quizOutput.questions;
      const questionsText = questions
        .map(
          (q, i) =>
            `${i + 1}. ${q.prompt} ${
              q.explanation ? `(${q.explanation})` : ""
            }`
        )
        .join("\n");

      const content = `Title: ${quizOutput.submission.article.title}\n\nQuestions:\n${questionsText}`;
      const selectedTagIds = await this.generateTags({
        content,
        contentType: "quiz",
        availableTags,
      });

      for (const tagId of selectedTagIds) {
        await prisma.quizOutputTag.create({
          data: {
            quizOutputId,
            tagId,
            isInherited: false,
          },
        });
      }

      logger.info('Tagged quiz output', {
        quizOutputId,
        tagCount: selectedTagIds.length,
      });
    } catch (error) {
      logger.error('Error tagging quiz output', { error, quizOutputId });
    }
  }

  /**
   * Inherit tags from English content to translated content
   */
  async inheritTags(params: {
    sourceSubmissionId: string; // English submission
    targetSubmissionId: string; // Non-English submission
  }): Promise<void> {
    try {
      logger.info('Inheriting tags between submissions', {
        sourceSubmissionId: params.sourceSubmissionId,
        targetSubmissionId: params.targetSubmissionId,
      });

      const [sourceSubmission, targetSubmission] = await Promise.all([
        prisma.submission.findUnique({
          where: { id: params.sourceSubmissionId },
          include: {
            audioOutputs: { include: { tags: true } },
            podcastOutputs: { include: { tags: true } },
            videoOutputs: { include: { tags: true } },
            quizOutputs: { include: { tags: true } },
            interactivePodcastOutputs: { include: { tags: true } },
          },
        }),
        prisma.submission.findUnique({
          where: { id: params.targetSubmissionId },
          include: {
            audioOutputs: true,
            podcastOutputs: true,
            videoOutputs: true,
            quizOutputs: true,
            interactivePodcastOutputs: true,
          },
        }),
      ]);

      if (!sourceSubmission || !targetSubmission) {
        throw new Error("Source or target submission not found");
      }

      // Inherit audio tags
      for (let i = 0; i < sourceSubmission.audioOutputs.length; i++) {
        const sourceAudio = sourceSubmission.audioOutputs[i];
        const targetAudio = targetSubmission.audioOutputs[i];

        if (targetAudio) {
          for (const tagRelation of sourceAudio.tags) {
            await prisma.audioOutputTag.create({
              data: {
                audioOutputId: targetAudio.id,
                tagId: tagRelation.tagId,
                sourceAudioOutputId: sourceAudio.id,
                isInherited: true,
              },
            });
          }
          logger.info('Inherited tags for audio', {
            targetAudioId: targetAudio.id,
            tagCount: sourceAudio.tags.length,
          });
        }
      }

      // Inherit podcast tags
      for (let i = 0; i < sourceSubmission.podcastOutputs.length; i++) {
        const sourcePodcast = sourceSubmission.podcastOutputs[i];
        const targetPodcast = targetSubmission.podcastOutputs[i];

        if (targetPodcast) {
          for (const tagRelation of sourcePodcast.tags) {
            await prisma.podcastOutputTag.create({
              data: {
                podcastOutputId: targetPodcast.id,
                tagId: tagRelation.tagId,
                sourcePodcastOutputId: sourcePodcast.id,
                isInherited: true,
              },
            });
          }
          logger.info('Inherited tags for podcast', {
            targetPodcastId: targetPodcast.id,
            tagCount: sourcePodcast.tags.length,
          });
        }
      }

      // Inherit video tags
      for (let i = 0; i < sourceSubmission.videoOutputs.length; i++) {
        const sourceVideo = sourceSubmission.videoOutputs[i];
        const targetVideo = targetSubmission.videoOutputs[i];

        if (targetVideo) {
          for (const tagRelation of sourceVideo.tags) {
            await prisma.videoOutputTag.create({
              data: {
                videoOutputId: targetVideo.id,
                tagId: tagRelation.tagId,
                sourceVideoOutputId: sourceVideo.id,
                isInherited: true,
              },
            });
          }
          logger.info('Inherited tags for video', {
            targetVideoId: targetVideo.id,
            tagCount: sourceVideo.tags.length,
          });
        }
      }

      // Inherit quiz tags
      for (let i = 0; i < sourceSubmission.quizOutputs.length; i++) {
        const sourceQuiz = sourceSubmission.quizOutputs[i];
        const targetQuiz = targetSubmission.quizOutputs[i];

        if (targetQuiz) {
          for (const tagRelation of sourceQuiz.tags) {
            await prisma.quizOutputTag.create({
              data: {
                quizOutputId: targetQuiz.id,
                tagId: tagRelation.tagId,
                sourceQuizOutputId: sourceQuiz.id,
                isInherited: true,
              },
            });
          }
          logger.info('Inherited tags for quiz', {
            targetQuizId: targetQuiz.id,
            tagCount: sourceQuiz.tags.length,
          });
        }
      }

      // Inherit interactive podcast tags
      for (
        let i = 0;
        i < sourceSubmission.interactivePodcastOutputs.length;
        i++
      ) {
        const sourceIP = sourceSubmission.interactivePodcastOutputs[i];
        const targetIP = targetSubmission.interactivePodcastOutputs[i];

        if (targetIP) {
          for (const tagRelation of sourceIP.tags) {
            await prisma.interactivePodcastOutputTag.create({
              data: {
                interactivePodcastId: targetIP.id,
                tagId: tagRelation.tagId,
                sourceInteractivePodcastId: sourceIP.id,
                isInherited: true,
              },
            });
          }
          logger.info('Inherited tags for interactive podcast', {
            targetInteractivePodcastId: targetIP.id,
            tagCount: sourceIP.tags.length,
          });
        }
      }

      logger.info('Tag inheritance complete', {
        sourceSubmissionId: params.sourceSubmissionId,
        targetSubmissionId: params.targetSubmissionId,
      });
    } catch (error) {
      logger.error('Error inheriting tags', {
        error,
        sourceSubmissionId: params.sourceSubmissionId,
        targetSubmissionId: params.targetSubmissionId,
      });
      // Don't throw - tagging is not critical
    }
  }
}

export const aiTaggingService = new AITaggingService();
