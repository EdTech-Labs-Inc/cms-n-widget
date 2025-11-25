import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/database';
import { thumbnailService } from '@/lib/services/media/thumbnail.service';

/**
 * POST /api/admin/backfill-thumbnails
 *
 * Backfill thumbnails for all existing content that has null thumbnailUrl
 * Generates AI thumbnails for articles, podcasts, videos, and interactive podcasts
 *
 * Usage:
 * curl -X POST http://localhost:4000/api/admin/backfill-thumbnails
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting thumbnail backfill process...');

    const results = {
      articles: { total: 0, success: 0, failed: 0 },
      podcasts: { total: 0, success: 0, failed: 0 },
      videos: { total: 0, success: 0, failed: 0 },
      interactivePodcasts: { total: 0, success: 0, failed: 0 },
    };

    // Backfill Articles
    console.log('\n📄 Backfilling article thumbnails...');
    const articlesWithoutThumbnails = await prisma.article.findMany({
      where: {
        thumbnailUrl: null,
      },
      select: {
        id: true,
        title: true,
      },
    });

    results.articles.total = articlesWithoutThumbnails.length;
    console.log(`Found ${articlesWithoutThumbnails.length} articles without thumbnails`);

    for (const article of articlesWithoutThumbnails) {
      try {
        console.log(`  → Generating thumbnail for article: "${article.title}"`);
        const thumbnailUrl = await thumbnailService.generateThumbnailWithRetry(
          article.title,
          'article',
          article.id,
          2 // 2 retries
        );

        if (thumbnailUrl) {
          await prisma.article.update({
            where: { id: article.id },
            data: { thumbnailUrl },
          });
          results.articles.success++;
          console.log(`  ✅ Success: ${article.title}`);
        } else {
          results.articles.failed++;
          console.log(`  ❌ Failed: ${article.title}`);
        }

        // Rate limiting: wait 1 second between requests to avoid OpenAI rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        results.articles.failed++;
        console.error(`  ❌ Error for article "${article.title}":`, error);
      }
    }

    // Backfill Podcasts
    console.log('\n🎙️  Backfilling podcast thumbnails...');
    const podcastsWithoutThumbnails = await prisma.podcastOutput.findMany({
      where: {
        thumbnailUrl: null,
        title: { not: null }, // Only process podcasts with titles
      },
      select: {
        id: true,
        title: true,
      },
    });

    results.podcasts.total = podcastsWithoutThumbnails.length;
    console.log(`Found ${podcastsWithoutThumbnails.length} podcasts without thumbnails`);

    for (const podcast of podcastsWithoutThumbnails) {
      if (!podcast.title) continue;

      try {
        console.log(`  → Generating thumbnail for podcast: "${podcast.title}"`);
        const thumbnailUrl = await thumbnailService.generateThumbnailWithRetry(
          podcast.title,
          'podcast',
          podcast.id,
          2 // 2 retries
        );

        if (thumbnailUrl) {
          await prisma.podcastOutput.update({
            where: { id: podcast.id },
            data: { thumbnailUrl },
          });
          results.podcasts.success++;
          console.log(`  ✅ Success: ${podcast.title}`);
        } else {
          results.podcasts.failed++;
          console.log(`  ❌ Failed: ${podcast.title}`);
        }

        // Rate limiting: wait 1 second between requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        results.podcasts.failed++;
        console.error(`  ❌ Error for podcast "${podcast.title}":`, error);
      }
    }

    // Backfill Videos
    console.log('\n🎥 Backfilling video thumbnails...');
    const videosWithoutThumbnails = await prisma.videoOutput.findMany({
      where: {
        thumbnailUrl: null,
        title: { not: null }, // Only process videos with titles
      },
      select: {
        id: true,
        title: true,
      },
    });

    results.videos.total = videosWithoutThumbnails.length;
    console.log(`Found ${videosWithoutThumbnails.length} videos without thumbnails`);

    for (const video of videosWithoutThumbnails) {
      if (!video.title) continue;

      try {
        console.log(`  → Generating thumbnail for video: "${video.title}"`);
        const thumbnailUrl = await thumbnailService.generateThumbnailWithRetry(
          video.title,
          'video',
          video.id,
          2 // 2 retries
        );

        if (thumbnailUrl) {
          await prisma.videoOutput.update({
            where: { id: video.id },
            data: { thumbnailUrl },
          });
          results.videos.success++;
          console.log(`  ✅ Success: ${video.title}`);
        } else {
          results.videos.failed++;
          console.log(`  ❌ Failed: ${video.title}`);
        }

        // Rate limiting: wait 1 second between requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        results.videos.failed++;
        console.error(`  ❌ Error for video "${video.title}":`, error);
      }
    }

    // Backfill Interactive Podcasts
    console.log('\n🎮 Backfilling interactive podcast thumbnails...');
    const interactivePodcastsWithoutThumbnails = await prisma.interactivePodcastOutput.findMany({
      where: {
        thumbnailUrl: null,
        title: { not: null }, // Only process interactive podcasts with titles
      },
      select: {
        id: true,
        title: true,
      },
    });

    results.interactivePodcasts.total = interactivePodcastsWithoutThumbnails.length;
    console.log(`Found ${interactivePodcastsWithoutThumbnails.length} interactive podcasts without thumbnails`);

    for (const interactivePodcast of interactivePodcastsWithoutThumbnails) {
      if (!interactivePodcast.title) continue;

      try {
        console.log(`  → Generating thumbnail for interactive podcast: "${interactivePodcast.title}"`);
        const thumbnailUrl = await thumbnailService.generateThumbnailWithRetry(
          interactivePodcast.title,
          'interactive-podcast',
          interactivePodcast.id,
          2 // 2 retries
        );

        if (thumbnailUrl) {
          await prisma.interactivePodcastOutput.update({
            where: { id: interactivePodcast.id },
            data: { thumbnailUrl },
          });
          results.interactivePodcasts.success++;
          console.log(`  ✅ Success: ${interactivePodcast.title}`);
        } else {
          results.interactivePodcasts.failed++;
          console.log(`  ❌ Failed: ${interactivePodcast.title}`);
        }

        // Rate limiting: wait 1 second between requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        results.interactivePodcasts.failed++;
        console.error(`  ❌ Error for interactive podcast "${interactivePodcast.title}":`, error);
      }
    }

    console.log('\n✅ Thumbnail backfill complete!');
    console.log('Results:', JSON.stringify(results, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Thumbnail backfill completed',
      results,
      summary: {
        totalProcessed:
          results.articles.total + results.podcasts.total + results.videos.total + results.interactivePodcasts.total,
        totalSuccess:
          results.articles.success + results.podcasts.success + results.videos.success + results.interactivePodcasts.success,
        totalFailed:
          results.articles.failed + results.podcasts.failed + results.videos.failed + results.interactivePodcasts.failed,
      },
    });
  } catch (error) {
    console.error('Backfill Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to backfill thumbnails',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
