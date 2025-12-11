import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOrgFromSlug, validateOrgAccess } from '@/lib/context/org-context';
import { translationService } from '@/lib/services/media/translation.service';
import { z } from 'zod';
import { logger } from '@repo/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Translation should be faster than generation

const TranslateScriptSchema = z.object({
  script: z.string().min(1, 'Script is required'),
  title: z.string().min(1, 'Title is required'),
  targetLanguage: z.enum(['ENGLISH', 'MARATHI', 'HINDI', 'BENGALI', 'GUJARATI']),
});

/**
 * POST /api/org/[orgSlug]/video/translate-script
 *
 * Translates a video script and title to the target language.
 *
 * Request body:
 * {
 *   script: string,      // The English script to translate
 *   title: string,       // The English title to translate
 *   targetLanguage: 'ENGLISH' | 'MARATHI' | 'HINDI' | 'BENGALI' | 'GUJARATI'
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     translatedScript: string,
 *     translatedTitle: string
 *   }
 * }
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ orgSlug: string }> }
) {
  const params = await props.params;

  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Org access check
    const hasAccess = await validateOrgAccess(user.id, params.orgSlug);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this organization' },
        { status: 403 }
      );
    }

    const org = await getOrgFromSlug(params.orgSlug);
    if (!org) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const validationResult = TranslateScriptSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { script, title, targetLanguage } = validationResult.data;

    logger.info('Translating script and title', {
      targetLanguage,
      scriptLength: script.length,
      titleLength: title.length,
      organizationId: org.id,
    });

    // If target is English, just return the original
    if (targetLanguage === 'ENGLISH') {
      return NextResponse.json({
        success: true,
        data: {
          translatedScript: script,
          translatedTitle: title,
        },
      });
    }

    // Translate both script and title
    const { translatedScript, translatedTitle } = await translationService.translateScriptAndTitle(
      script,
      title,
      targetLanguage
    );

    logger.info('Translation completed', {
      targetLanguage,
      originalScriptLength: script.length,
      translatedScriptLength: translatedScript.length,
      organizationId: org.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        translatedScript,
        translatedTitle,
      },
    });
  } catch (error) {
    logger.error('Translate script error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      orgSlug: params.orgSlug,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to translate script',
      },
      { status: 500 }
    );
  }
}
