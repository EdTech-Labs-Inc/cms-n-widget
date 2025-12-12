import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/database';
import { config } from '@/lib/config/constants';
import { createClient } from '@/lib/supabase/server';
import { getOrgFromSlug, validateOrgAccess } from '@/lib/context/org-context';
import { queueService } from '@/lib/services/core/queue.service';
import { translationService } from '@/lib/services/media/translation.service';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@repo/logging';

const LanguageEnum = z.enum(['ENGLISH', 'MARATHI', 'HINDI', 'BENGALI', 'GUJARATI']);
type Language = z.infer<typeof LanguageEnum>;

const TranslationOverrideSchema = z.object({
  script: z.string(),
  title: z.string(),
});

const CreateVideoSchema = z.object({
  // Multi-language support
  title: z.string().min(1, 'Title is required'),
  languages: z.array(LanguageEnum).min(1, 'At least one language is required'),
  translations: z.record(z.string(), TranslationOverrideSchema).optional(), // Per-language overrides
  // Content
  script: z.string().min(1, 'Script is required'),
  sourceType: z.enum(['prompt', 'script_file', 'content_file']),
  characterId: z.string().uuid('Invalid character ID'),
  // Legacy fields - optional for backwards compatibility (new characters use heygenImageKey from Character record)
  heygenAvatarId: z.string().nullable().optional(),
  heygenCharacterType: z.enum(['avatar', 'talking_photo']).nullable().optional(),
  voiceId: z.string().min(1, 'Voice ID is required'),
  captionStyleId: z.string().uuid('Invalid caption style ID'),
  enableMagicZooms: z.boolean().default(true),
  enableMagicBrolls: z.boolean().default(true),
  magicBrollsPercentage: z.number().int().min(0).max(100).default(40),
  backgroundMusicId: z.string().uuid().nullable().optional(),
  backgroundMusicVolume: z.number().min(0).max(1).default(0.15),
  startBumperId: z.string().uuid().nullable().optional(),
  startBumperDuration: z.number().int().positive().nullable().optional(),
  endBumperId: z.string().uuid().nullable().optional(),
  endBumperDuration: z.number().int().positive().nullable().optional(),
});

/**
 * POST /api/org/[orgSlug]/video/create - Create a standalone video and queue generation
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ orgSlug: string }> }
) {
  const params = await props.params;
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('Video create auth failed', {
        organizationSlug: params.orgSlug,
        authError: authError?.message,
      });
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const hasAccess = await validateOrgAccess(user.id, params.orgSlug);
    if (!hasAccess) {
      logger.warn('Video create access denied', {
        organizationSlug: params.orgSlug,
        userId: user.id,
      });
      return NextResponse.json(
        { success: false, error: 'Access denied to this organization' },
        { status: 403 }
      );
    }

    const org = await getOrgFromSlug(params.orgSlug);
    if (!org) {
      logger.warn('Video create org not found', {
        organizationSlug: params.orgSlug,
      });
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch (jsonError) {
      logger.error('Video create invalid JSON body', {
        organizationSlug: params.orgSlug,
        error: jsonError instanceof Error ? jsonError.message : 'Unknown JSON parse error',
      });
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Debug logging to diagnose validation failures
    const languages = body.languages as unknown[] | undefined;
    logger.info('Video create request received', {
      organizationSlug: params.orgSlug,
      hasTitle: !!body.title,
      hasLanguages: !!languages,
      languagesCount: languages?.length,
      hasScript: !!body.script,
      sourceType: body.sourceType,
      characterId: body.characterId,
      heygenAvatarId: body.heygenAvatarId,
      heygenCharacterType: body.heygenCharacterType,
      voiceId: body.voiceId,
      captionStyleId: body.captionStyleId,
    });

    const validationResult = CreateVideoSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn('Video create validation failed', {
        organizationSlug: params.orgSlug,
        errors: validationResult.error.errors,
      });
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.errors[0].message,
          // Include all validation errors for debugging
          validationErrors: validationResult.error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Validate that character belongs to this organization
    const character = await prisma.character.findFirst({
      where: {
        id: data.characterId,
        organizationId: org.id,
      },
    });

    if (!character) {
      return NextResponse.json(
        { success: false, error: 'Character not found in this organization' },
        { status: 400 }
      );
    }

    // Validate caption style belongs to this organization
    const captionStyle = await prisma.captionStyle.findFirst({
      where: {
        id: data.captionStyleId,
        organizationId: org.id,
      },
    });

    if (!captionStyle) {
      return NextResponse.json(
        { success: false, error: 'Caption style not found in this organization' },
        { status: 400 }
      );
    }

    // Validate background music if provided
    if (data.backgroundMusicId) {
      const music = await prisma.backgroundMusic.findFirst({
        where: {
          id: data.backgroundMusicId,
          organizationId: org.id,
        },
      });

      if (!music) {
        return NextResponse.json(
          { success: false, error: 'Background music not found in this organization' },
          { status: 400 }
        );
      }
    }

    // Validate bumpers if provided
    if (data.startBumperId) {
      const bumper = await prisma.videoBumper.findFirst({
        where: {
          id: data.startBumperId,
          organizationId: org.id,
          position: { in: ['start', 'both'] },
        },
      });

      if (!bumper) {
        return NextResponse.json(
          { success: false, error: 'Start bumper not found or not valid for start position' },
          { status: 400 }
        );
      }
    }

    if (data.endBumperId) {
      const bumper = await prisma.videoBumper.findFirst({
        where: {
          id: data.endBumperId,
          organizationId: org.id,
          position: { in: ['end', 'both'] },
        },
      });

      if (!bumper) {
        return NextResponse.json(
          { success: false, error: 'End bumper not found or not valid for end position' },
          { status: 400 }
        );
      }
    }

    // Generate batchId if multiple languages
    const batchId = data.languages.length > 1 ? uuidv4() : null;

    logger.info('Creating standalone videos', {
      languages: data.languages,
      batchId,
      organizationId: org.id,
    });

    // Create videos for each language
    const createdVideos: Array<{
      id: string;
      language: Language;
      status: string;
      jobId: string;
    }> = [];

    for (const language of data.languages) {
      let videoScript = data.script;
      let videoTitle = data.title;

      // For non-English languages, get translation
      if (language !== 'ENGLISH') {
        // Check if user provided an override
        const override = data.translations?.[language];
        if (override) {
          videoScript = override.script;
          videoTitle = override.title;
          logger.info('Using user-provided translation', { language });
        } else {
          // Translate using the service
          logger.info('Translating content', { language });
          const translated = await translationService.translateScriptAndTitle(
            data.script,
            data.title,
            language
          );
          videoScript = translated.translatedScript;
          videoTitle = translated.translatedTitle;
        }
      }

      // Create the standalone video record
      const standaloneVideo = await prisma.standaloneVideo.create({
        data: {
          organizationId: org.id,
          createdByProfileId: user.id,
          status: 'PENDING',
          language,
          batchId,
          title: videoTitle,
          script: videoScript,
          sourceType: data.sourceType,
          characterId: data.characterId,
          heygenAvatarId: data.heygenAvatarId || character.heygenAvatarId || '',
          heygenCharacterType: data.heygenCharacterType || character.characterType || 'avatar',
          voiceId: data.voiceId,
          captionStyleId: data.captionStyleId,
          enableMagicZooms: data.enableMagicZooms,
          enableMagicBrolls: data.enableMagicBrolls,
          magicBrollsPercentage: data.magicBrollsPercentage,
          backgroundMusicId: data.backgroundMusicId || null,
          backgroundMusicVolume: data.backgroundMusicVolume,
          startBumperId: data.startBumperId || null,
          startBumperDuration: data.startBumperDuration || null,
          endBumperId: data.endBumperId || null,
          endBumperDuration: data.endBumperDuration || null,
          environment: config.appEnvironment,
        },
      });

      // Queue the generation job
      const job = await queueService.addStandaloneVideoGenerationJob({
        standaloneVideoId: standaloneVideo.id,
        organizationId: org.id,
      });

      createdVideos.push({
        id: standaloneVideo.id,
        language,
        status: standaloneVideo.status,
        jobId: job.id ?? standaloneVideo.id,
      });

      logger.info('Created standalone video', {
        id: standaloneVideo.id,
        language,
        batchId,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        videos: createdVideos,
        batchId,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create Standalone Video Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create video' },
      { status: 500 }
    );
  }
}
