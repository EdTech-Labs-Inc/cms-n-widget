import { z } from 'zod';
import { submissionService } from '@/lib/services/submission.service';
import { tagService } from '@/lib/services/tag.service';
import { openaiService } from '@/lib/services/external/openai.service';
import { prisma } from '@/lib/config/database';

// Validation schemas
export const VideoCustomizationSchema = z.object({
  characterId: z.string(),
  characterType: z.enum(['avatar', 'talking_photo']),
  voiceId: z.string(),
  enableCaptions: z.boolean(),
  captionTemplate: z.string(),
  enableMagicZooms: z.boolean(),
  enableMagicBrolls: z.boolean(),
  magicBrollsPercentage: z.number().min(0).max(100),
  generateBubbles: z.boolean().optional(),
}).optional();

export const CreateSubmissionSchema = z.object({
  articleId: z.string().uuid('Invalid article ID'),
  organizationId: z.string().uuid('Invalid organization ID').optional(),
  generateAudio: z.boolean().optional(),
  generatePodcast: z.boolean().optional(),
  generateVideo: z.boolean().optional(),
  generateQuiz: z.boolean().optional(),
  generateInteractivePodcast: z.boolean().optional(),
  videoCustomization: VideoCustomizationSchema,
});

export const UpdateQuizSchema = z.object({
  questions: z.array(z.any()),
});

export const AddTagSchema = z.object({
  tagId: z.string().uuid('Invalid tag ID'),
});

export const SubmissionsController = {
  async create(data: z.infer<typeof CreateSubmissionSchema>) {
    const validatedData = CreateSubmissionSchema.parse(data);
    return await submissionService.createSubmission(validatedData);
  },

  async getAll(organizationId: string, page: number = 1, limit: number = 20, includeOutputs = false) {
    return await submissionService.getAllSubmissions(organizationId, page, limit, includeOutputs);
  },

  async getById(id: string) {
    return await submissionService.getSubmission(id);
  },

  async getVideoOutput(videoId: string) {
    return await prisma.videoOutput.findUnique({
      where: { id: videoId },
      include: {
        bubbles: {
          orderBy: { appearsAt: 'asc' },
        },
        tags: {
          include: { tag: true },
        },
        submission: {
          include: { article: true },
        },
      },
    });
  },

  async getQuizOutput(quizId: string) {
    return await prisma.quizOutput.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        tags: {
          include: { tag: true },
        },
        submission: {
          include: { article: true },
        },
      },
    });
  },

  async updateQuiz(submissionId: string, quizId: string, questions: any[]) {
    const quizOutput = await prisma.quizOutput.findFirst({
      where: {
        id: quizId,
        submissionId: submissionId,
      },
    });

    if (!quizOutput) {
      throw new Error('Quiz not found');
    }

    // Delete existing questions (normalized schema - questions are in separate table)
    await prisma.quizQuestion.deleteMany({
      where: { quizOutputId: quizId },
    });

    // Create new questions
    return await prisma.quizOutput.update({
      where: { id: quizId },
      data: {
        questions: {
          create: questions.map((q, index) => ({
            order: index,
            type: q.type,
            prompt: q.prompt,
            stem: q.stem || null,
            options: q.options || null,
            correctAnswer: q.correctAnswer || null,
            explanation: q.explanation || null,
          })),
        },
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });
  },

  async updateVideoOutput(submissionId: string, videoId: string, payload: { title?: string, script?: string }) {
    const videoOutput = await prisma.videoOutput.findFirst({
      where: { id: videoId, submissionId },
    });

    if (!videoOutput) {
      throw new Error('Video output not found');
    }

    // Note: Bubbles are managed through separate VideoBubble table and should be updated via dedicated bubble endpoints
    return await prisma.videoOutput.update({
      where: { id: videoId },
      data: payload,
      include: {
        bubbles: {
          orderBy: { appearsAt: 'asc' },
        },
      },
    });
  },

  // Tag management methods
  async getAudioTags(audioId: string) {
    return await prisma.audioOutputTag.findMany({
      where: { audioOutputId: audioId },
      include: { tag: true },
    });
  },

  async addAudioTag(submissionId: string, audioId: string, tagId: string) {
    const audio = await prisma.audioOutput.findFirst({
      where: { id: audioId, submissionId },
    });
    if (!audio) throw new Error('Audio not found');

    const tag = await tagService.getTagById(tagId);
    if (!tag) throw new Error('Tag not found');

    return await prisma.audioOutputTag.create({
      data: { audioOutputId: audioId, tagId, isInherited: false },
      include: { tag: true },
    });
  },

  async removeAudioTag(audioId: string, tagId: string) {
    await prisma.audioOutputTag.deleteMany({
      where: { audioOutputId: audioId, tagId },
    });
  },

  async addPodcastTag(submissionId: string, podcastId: string, tagId: string) {
    const podcast = await prisma.podcastOutput.findFirst({
      where: { id: podcastId, submissionId },
    });
    if (!podcast) throw new Error('Podcast not found');

    const tag = await tagService.getTagById(tagId);
    if (!tag) throw new Error('Tag not found');

    return await prisma.podcastOutputTag.create({
      data: { podcastOutputId: podcastId, tagId, isInherited: false },
      include: { tag: true },
    });
  },

  async removePodcastTag(podcastId: string, tagId: string) {
    await prisma.podcastOutputTag.deleteMany({
      where: { podcastOutputId: podcastId, tagId },
    });
  },

  async addVideoTag(submissionId: string, videoId: string, tagId: string) {
    const video = await prisma.videoOutput.findFirst({
      where: { id: videoId, submissionId },
    });
    if (!video) throw new Error('Video not found');

    const tag = await tagService.getTagById(tagId);
    if (!tag) throw new Error('Tag not found');

    return await prisma.videoOutputTag.create({
      data: {
        videoOutputId: videoId,
        tagId,
        isInherited: false,
      },
      include: { tag: true },
    });
  },

  async removeVideoTag(videoId: string, tagId: string) {
    await prisma.videoOutputTag.deleteMany({
      where: { videoOutputId: videoId, tagId },
    });
  },

  async addInteractivePodcastTag(submissionId: string, ipId: string, tagId: string) {
    const ip = await prisma.interactivePodcastOutput.findFirst({
      where: { id: ipId, submissionId },
    });
    if (!ip) throw new Error('Interactive podcast not found');

    const tag = await tagService.getTagById(tagId);
    if (!tag) throw new Error('Tag not found');

    return await prisma.interactivePodcastOutputTag.create({
      data: { interactivePodcastId: ipId, tagId, isInherited: false },
      include: { tag: true },
    });
  },

  async removeInteractivePodcastTag(ipId: string, tagId: string) {
    await prisma.interactivePodcastOutputTag.deleteMany({
      where: { interactivePodcastId: ipId, tagId },
    });
  },

  async addQuizTag(submissionId: string, quizId: string, tagId: string) {
    const quiz = await prisma.quizOutput.findFirst({
      where: { id: quizId, submissionId },
    });
    if (!quiz) throw new Error('Quiz not found');

    const tag = await tagService.getTagById(tagId);
    if (!tag) throw new Error('Tag not found');

    return await prisma.quizOutputTag.create({
      data: { quizOutputId: quizId, tagId, isInherited: false },
      include: { tag: true },
    });
  },

  async removeQuizTag(quizId: string, tagId: string) {
    await prisma.quizOutputTag.deleteMany({
      where: { quizOutputId: quizId, tagId },
    });
  },

  // Approval methods
  async approveAudioOutput(submissionId: string, audioId: string) {
    const audio = await prisma.audioOutput.findFirst({
      where: { id: audioId, submissionId },
    });
    if (!audio) throw new Error('Audio not found');

    return await prisma.audioOutput.update({
      where: { id: audioId },
      data: {
        isApproved: true,
        approvedAt: new Date(),
      },
    });
  },

  async approvePodcastOutput(submissionId: string, podcastId: string) {
    const podcast = await prisma.podcastOutput.findFirst({
      where: { id: podcastId, submissionId },
    });
    if (!podcast) throw new Error('Podcast not found');

    return await prisma.podcastOutput.update({
      where: { id: podcastId },
      data: {
        isApproved: true,
        approvedAt: new Date(),
      },
    });
  },

  async approveVideoOutput(submissionId: string, videoId: string) {
    const video = await prisma.videoOutput.findFirst({
      where: { id: videoId, submissionId },
    });
    if (!video) throw new Error('Video not found');

    return await prisma.videoOutput.update({
      where: { id: videoId },
      data: {
        isApproved: true,
        approvedAt: new Date(),
      },
      include: {
        bubbles: {
          orderBy: { appearsAt: 'asc' },
        },
      },
    });
  },

  async approveQuizOutput(submissionId: string, quizId: string) {
    const quiz = await prisma.quizOutput.findFirst({
      where: { id: quizId, submissionId },
    });
    if (!quiz) throw new Error('Quiz not found');

    return await prisma.quizOutput.update({
      where: { id: quizId },
      data: {
        isApproved: true,
        approvedAt: new Date(),
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });
  },

  async approveInteractivePodcastOutput(submissionId: string, ipId: string) {
    const ip = await prisma.interactivePodcastOutput.findFirst({
      where: { id: ipId, submissionId },
    });
    if (!ip) throw new Error('Interactive podcast not found');

    return await prisma.interactivePodcastOutput.update({
      where: { id: ipId },
      data: {
        isApproved: true,
        approvedAt: new Date(),
      },
    });
  },

  // Unapprove methods
  async unapproveAudioOutput(submissionId: string, audioId: string) {
    const audio = await prisma.audioOutput.findFirst({
      where: { id: audioId, submissionId },
    });
    if (!audio) throw new Error('Audio not found');

    return await prisma.audioOutput.update({
      where: { id: audioId },
      data: {
        isApproved: false,
        approvedAt: null,
      },
    });
  },

  async unapprovePodcastOutput(submissionId: string, podcastId: string) {
    const podcast = await prisma.podcastOutput.findFirst({
      where: { id: podcastId, submissionId },
    });
    if (!podcast) throw new Error('Podcast not found');

    return await prisma.podcastOutput.update({
      where: { id: podcastId },
      data: {
        isApproved: false,
        approvedAt: null,
      },
    });
  },

  async unapproveVideoOutput(submissionId: string, videoId: string) {
    const video = await prisma.videoOutput.findFirst({
      where: { id: videoId, submissionId },
    });
    if (!video) throw new Error('Video not found');

    return await prisma.videoOutput.update({
      where: { id: videoId },
      data: {
        isApproved: false,
        approvedAt: null,
      },
      include: {
        bubbles: {
          orderBy: { appearsAt: 'asc' },
        },
      },
    });
  },

  async unapproveQuizOutput(submissionId: string, quizId: string) {
    const quiz = await prisma.quizOutput.findFirst({
      where: { id: quizId, submissionId },
    });
    if (!quiz) throw new Error('Quiz not found');

    return await prisma.quizOutput.update({
      where: { id: quizId },
      data: {
        isApproved: false,
        approvedAt: null,
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });
  },

  async unapproveInteractivePodcastOutput(submissionId: string, ipId: string) {
    const ip = await prisma.interactivePodcastOutput.findFirst({
      where: { id: ipId, submissionId },
    });
    if (!ip) throw new Error('Interactive podcast not found');

    return await prisma.interactivePodcastOutput.update({
      where: { id: ipId },
      data: {
        isApproved: false,
        approvedAt: null,
      },
    });
  },

  // Script update methods
  async updatePodcastScript(submissionId: string, podcastId: string, transcript: string) {
    const podcast = await prisma.podcastOutput.findFirst({
      where: { id: podcastId, submissionId },
    });
    if (!podcast) throw new Error('Podcast not found');

    return await prisma.podcastOutput.update({
      where: { id: podcastId },
      data: { transcript },
    });
  },

  async updateInteractivePodcastScript(submissionId: string, ipId: string, script: string) {
    const ip = await prisma.interactivePodcastOutput.findFirst({
      where: { id: ipId, submissionId },
    });
    if (!ip) throw new Error('Interactive podcast not found');

    // For interactive podcasts, we need to update the script stored in segments
    // We'll store the raw script in a new field or update segments appropriately
    // For now, we'll just update segments to preserve structure
    return await prisma.interactivePodcastOutput.update({
      where: { id: ipId },
      data: {
        // Store script in a temporary format - will be regenerated with proper segments
        segments: { script },
      },
    });
  },

  // AI Script Regeneration methods
  async regenerateVideoScript(submissionId: string, videoId: string, promptGuidance: string) {
    const video = await prisma.videoOutput.findFirst({
      where: { id: videoId, submissionId },
      include: {
        submission: {
          include: {
            article: true,
          },
        },
        bubbles: {
          orderBy: { appearsAt: 'asc' },
        },
      },
    });
    if (!video) throw new Error('Video not found');
    if (!video.script) throw new Error('No script available to regenerate');
    if (!video.submission?.article) throw new Error('Article not found');

    const article = video.submission.article;
    const language = video.submission.language || 'ENGLISH';

    const improvedScript = await openaiService.regenerateVideoScript({
      originalScript: video.script,
      promptGuidance,
      articleTitle: article.title,
      articleContent: article.content,
      language,
    });

    // Update the video with the new script
    return await prisma.videoOutput.update({
      where: { id: videoId },
      data: { script: improvedScript },
      include: {
        bubbles: {
          orderBy: { appearsAt: 'asc' },
        },
      },
    });
  },

  async regeneratePodcastScript(submissionId: string, podcastId: string, promptGuidance: string) {
    const podcast = await prisma.podcastOutput.findFirst({
      where: { id: podcastId, submissionId },
      include: {
        submission: {
          include: {
            article: true,
          },
        },
      },
    });
    if (!podcast) throw new Error('Podcast not found');
    if (!podcast.transcript) throw new Error('No transcript available to regenerate');
    if (!podcast.submission?.article) throw new Error('Article not found');

    const article = podcast.submission.article;
    const language = podcast.submission.language || 'ENGLISH';

    const improvedTranscript = await openaiService.regeneratePodcastTranscript({
      originalTranscript: podcast.transcript,
      promptGuidance,
      articleTitle: article.title,
      articleContent: article.content,
      language,
    });

    // Update the podcast with the new transcript
    return await prisma.podcastOutput.update({
      where: { id: podcastId },
      data: { transcript: improvedTranscript },
    });
  },

  async regenerateInteractivePodcastScript(submissionId: string, ipId: string, promptGuidance: string) {
    const ip = await prisma.interactivePodcastOutput.findFirst({
      where: { id: ipId, submissionId },
      include: {
        submission: {
          include: {
            article: true,
          },
        },
      },
    });
    if (!ip) throw new Error('Interactive podcast not found');
    if (!ip.segments) throw new Error('No script available to regenerate');
    if (!ip.submission?.article) throw new Error('Article not found');

    // Extract script from segments
    const segments = ip.segments as any;
    let originalScript = '';
    if (Array.isArray(segments)) {
      originalScript = segments.map((seg: any) => seg.text || '').join(' ');
    } else if (segments.script) {
      originalScript = segments.script;
    }

    if (!originalScript) throw new Error('No script content found');

    const article = ip.submission.article;
    const language = ip.submission.language || 'ENGLISH';

    const improvedScript = await openaiService.regenerateInteractivePodcastScript({
      originalScript,
      promptGuidance,
      articleTitle: article.title,
      articleContent: article.content,
      language,
    });

    // Update with the new script (stored temporarily in segments)
    return await prisma.interactivePodcastOutput.update({
      where: { id: ipId },
      data: {
        segments: { script: improvedScript },
      },
    });
  },

  // Media Regeneration methods
  async regenerateVideoMedia(submissionId: string, videoId: string, videoCustomization?: any) {
    const video = await prisma.videoOutput.findFirst({
      where: { id: videoId, submissionId },
    });
    if (!video) throw new Error('Video not found');

    // Prevent regeneration if already processing
    if (video.status === 'PROCESSING' || video.status === 'PENDING') {
      throw new Error('Video is already being generated. Please wait for the current generation to complete.');
    }

    // Update video customization settings if provided
    if (videoCustomization) {
      await prisma.videoOutput.update({
        where: { id: videoId },
        data: {
          heygenCharacterId: videoCustomization.characterId || null,
          submagicTemplate: videoCustomization.captionTemplate || null,
          enableCaptions: videoCustomization.enableCaptions ?? true,
          enableMagicZooms: videoCustomization.enableMagicZooms ?? true,
          enableMagicBrolls: videoCustomization.enableMagicBrolls ?? true,
          magicBrollsPercentage: videoCustomization.magicBrollsPercentage ?? 40,
          generateBubbles: videoCustomization.generateBubbles ?? true,
        },
      });
    }

    // Dynamic import to avoid circular dependencies
    const { videoService } = await import('@/lib/services/media/video.service');
    await videoService.regenerateVideo(videoId);
    return { message: 'Video regeneration initiated' };
  },

  async regeneratePodcastMedia(submissionId: string, podcastId: string) {
    const podcast = await prisma.podcastOutput.findFirst({
      where: { id: podcastId, submissionId },
    });
    if (!podcast) throw new Error('Podcast not found');

    // Prevent regeneration if already processing
    if (podcast.status === 'PROCESSING' || podcast.status === 'PENDING') {
      throw new Error('Podcast is already being generated. Please wait for the current generation to complete.');
    }

    // Dynamic import to avoid circular dependencies
    const { podcastService } = await import('@/lib/services/media/podcast.service');
    await podcastService.regeneratePodcast(podcastId);
    return { message: 'Podcast regeneration completed' };
  },

  async regenerateInteractivePodcastMedia(submissionId: string, ipId: string) {
    const ip = await prisma.interactivePodcastOutput.findFirst({
      where: { id: ipId, submissionId },
    });
    if (!ip) throw new Error('Interactive podcast not found');

    // Prevent regeneration if already processing
    if (ip.status === 'PROCESSING' || ip.status === 'PENDING') {
      throw new Error('Interactive podcast is already being generated. Please wait for the current generation to complete.');
    }

    // Dynamic import to avoid circular dependencies
    const { interactivePodcastService } = await import('@/lib/services/media/interactive-podcast.service');
    await interactivePodcastService.regenerateInteractivePodcast(ipId);
    return { message: 'Interactive podcast regeneration completed' };
  },
};
