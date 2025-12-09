import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOrgFromSlug, validateOrgAccess } from '@/lib/context/org-context';
import { agentaOpenAIService } from '@/lib/services/external/agenta-openai.service';
import { z } from 'zod';
import { logger } from '@repo/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const ImproveScriptSchema = z.object({
  script: z.string().min(10, 'Script must be at least 10 characters'),
  guidance: z.string().min(5, 'Guidance must be at least 5 characters'),
  language: z.enum(['ENGLISH', 'MARATHI', 'HINDI', 'BENGALI', 'GUJARATI']).optional().default('ENGLISH'),
  // Optional context for better improvements
  context: z.string().optional(),
});

const languageMap: Record<string, string> = {
  ENGLISH: 'English',
  MARATHI: 'Marathi',
  HINDI: 'Hindi',
  BENGALI: 'Bengali',
  GUJARATI: 'Gujarati',
};

/**
 * POST /api/org/[orgSlug]/video/improve-script
 *
 * Improves an existing video script based on user guidance.
 *
 * Request body:
 * {
 *   script: string,      // The current script to improve
 *   guidance: string,    // Instructions for how to improve it
 *   language?: string,   // Target language (default: ENGLISH)
 *   context?: string,    // Optional: Original content for context
 * }
 *
 * Uses the existing 'regenerate_video_script_prompt' Agenta prompt.
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
    const validationResult = ImproveScriptSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const languageName = languageMap[data.language] || 'English';

    logger.info('Improving video script', {
      language: data.language,
      scriptLength: data.script.length,
      guidanceLength: data.guidance.length,
      hasContext: !!data.context,
      organizationId: org.id,
    });

    // Use the existing regenerate_video_script_prompt
    // For standalone videos without article context, we provide the script itself as context
    const improvedScript = await agentaOpenAIService.generateText({
      promptSlug: 'regenerate_video_script_prompt',
      variables: {
        originalScript: data.script,
        promptGuidance: data.guidance,
        // For standalone videos, use empty or provided context
        articleTitle: 'Standalone Video',
        articleContent: data.context || data.script,
        languageName,
      },
      temperature: 0.7,
    });

    logger.info('Video script improved successfully', {
      originalLength: data.script.length,
      improvedLength: improvedScript.length,
      organizationId: org.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        script: improvedScript,
        characterCount: improvedScript.length,
      },
    });
  } catch (error) {
    logger.error('Improve script error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      orgSlug: params.orgSlug,
    });

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to improve script' },
      { status: 500 }
    );
  }
}
