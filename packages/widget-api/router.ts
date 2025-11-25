import { z } from 'zod';
import { prisma } from '@repo/database';
import { router, publicProcedure, createCallerFactory } from './trpc';

export const widgetRouter = router({
  // Query to get test submission (similar to test/page.tsx)
  getTestSubmission: publicProcedure.query(async () => {
    const submissions = await prisma.submission.findMany({
      include: {
        article: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1, // Get just one submission for testing
    });

    const fetchTime = new Date();

    return {
      submission: submissions[0] || null,
      message: 'Test submission fetched successfully',
      fetchTime,
    };
  }),

  // Mutation that console logs
  submitTestData: publicProcedure
    .input(
      z.object({
        testInput: z.string().min(1, 'Input is required'),
      }),
    )
    .mutation(async ({ input }) => {
      console.log('=== tRPC Mutation Called ===');
      console.log('Input received:', input.testInput);
      console.log('Timestamp:', new Date().toISOString());
      console.log('===========================');

      return {
        success: true,
        message: `Received: ${input.testInput}`,
        timestamp: new Date().toISOString(),
      };
    }),

  // Query to get all learning hub content
  getLearningHubContent: publicProcedure.query(async () => {
    console.log('=== getLearningHubContent called ===', new Date().toISOString());
    // Fetch all approved content from the database

    const videos = await prisma.videoOutput.findMany({
      where: {
        status: 'COMPLETED',
        isApproved: true,
      },
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        createdAt: true,
        duration: true,

        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const podcasts = await prisma.podcastOutput.findMany({
      where: {
        status: 'COMPLETED',
        isApproved: true,
      },
      select: {
        id: true,
        audioFileUrl: true,
        title: true,
        thumbnailUrl: true,
        createdAt: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const interactivePodcasts = await prisma.interactivePodcastOutput.findMany({
      where: {
        status: 'COMPLETED',
        isApproved: true,
      },
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        duration: true,
        createdAt: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get all approved articles
    const articles = await prisma.article.findMany({
      select: {
        id: true,
        category: true,
        content: false,
        title: true,
        thumbnailUrl: true,
      },
      where: {
        isApproved: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      videos,
      podcasts,
      interactivePodcasts,
      articles,
      fetchTime: new Date(),
    };
  }),

  // Query to get a single article by ID
  getArticle: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const article = await prisma.article.findUnique({
      where: {
        id: input.id,
      },
    });

    if (!article) {
      throw new Error('Article not found');
    }

    return article;
  }),

  // Query to get audio reading for an article
  getArticleAudio: publicProcedure.input(z.object({ articleId: z.string() })).query(async ({ input }) => {
    // Find the audio output linked to this article via submission
    const audioOutput = await prisma.audioOutput.findFirst({
      where: {
        submission: {
          articleId: input.articleId,
        },
        status: 'COMPLETED',
      },
      orderBy: {
        createdAt: 'desc', // Get the most recent one if multiple exist
      },
    });

    if (!audioOutput || !audioOutput.audioFileUrl) {
      return null;
    }

    return {
      audioUrl: audioOutput.audioFileUrl,
      duration: audioOutput.duration,
    };
  }),

  // Query to get quiz questions for an article
  getArticleQuiz: publicProcedure.input(z.object({ articleId: z.string() })).query(async ({ input }) => {
    // Find the quiz output linked to this article via submission
    const quizOutput = await prisma.quizOutput.findFirst({
      where: {
        submission: {
          articleId: input.articleId,
        },
        status: 'COMPLETED',
      },
      include: {
        questions: {
          orderBy: { order: 'asc' }, // Order questions by their order field
        },
      },
      orderBy: {
        createdAt: 'desc', // Get the most recent one if multiple exist
      },
    });

    if (!quizOutput || !quizOutput.questions || quizOutput.questions.length === 0) {
      return null;
    }

    return {
      questions: quizOutput.questions,
    };
  }),

  // Query to get full interactive podcast details
  getInteractivePodcast: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const interactivePodcast = await prisma.interactivePodcastOutput.findUnique({
      where: {
        id: input.id,
      },
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        audioFileUrl: true,
        duration: true,
        segments: true,
        createdAt: true,
      },
    });

    if (!interactivePodcast) {
      throw new Error('Interactive podcast not found');
    }

    if (!interactivePodcast.audioFileUrl) {
      throw new Error('Interactive podcast audio not available');
    }

    return {
      id: interactivePodcast.id,
      title: interactivePodcast.title,
      thumbnailUrl: interactivePodcast.thumbnailUrl,
      audioFileUrl: interactivePodcast.audioFileUrl,
      duration: interactivePodcast.duration,
      segments: interactivePodcast.segments as any,
    };
  }),

  // Query to get a specific video with bubbles from database
  getVideoWithBubbles: publicProcedure
    .input(
      z.object({
        videoOutputId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const videoOutput = await prisma.videoOutput.findUnique({
        where: { id: input.videoOutputId },
        include: {
          submission: {
            include: {
              article: true,
            },
          },
          bubbles: {
            orderBy: { appearsAt: 'asc' }, // Order bubbles by when they appear
          },
        },
      });

      if (!videoOutput || !videoOutput.videoUrl) {
        throw new Error('Video not found');
      }

      // VideoOutput now represents a single video directly
      return {
        id: videoOutput.id,
        title: videoOutput.title || videoOutput.submission?.article?.title || 'Untitled Video',
        videoUrl: videoOutput.videoUrl,
        thumbnailUrl: videoOutput.thumbnailUrl || '/assets/AssetAllocationThumb.png',
        heygenVideoId: videoOutput.heygenVideoId,
        duration: videoOutput.duration,
        transcript: videoOutput.transcript,
        bubbles: videoOutput.bubbles || [],
      };
    }),
});

// Export type definition of API
export type WidgetRouter = typeof widgetRouter;

// Create server-side caller factory for SSR (no HTTP roundtrip)
export const createCaller = createCallerFactory(widgetRouter);
