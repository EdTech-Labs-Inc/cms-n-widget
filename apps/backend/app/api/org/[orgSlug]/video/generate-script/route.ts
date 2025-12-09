import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOrgFromSlug, validateOrgAccess } from '@/lib/context/org-context';
import { agentaOpenAIService } from '@/lib/services/external/agenta-openai.service';
import { fileExtractionService } from '@/lib/services/core/file-extraction.service';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { logger } from '@repo/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120; // AI generation can take time

const GenerateFromPromptSchema = z.object({
  mode: z.literal('prompt'),
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
  language: z.enum(['ENGLISH', 'MARATHI', 'HINDI', 'BENGALI', 'GUJARATI']).optional().default('ENGLISH'),
});

const GenerateFromContentSchema = z.object({
  mode: z.literal('content'),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  language: z.enum(['ENGLISH', 'MARATHI', 'HINDI', 'BENGALI', 'GUJARATI']).optional().default('ENGLISH'),
});

const GenerateScriptSchema = z.discriminatedUnion('mode', [
  GenerateFromPromptSchema,
  GenerateFromContentSchema,
]);

const languageMap: Record<string, string> = {
  ENGLISH: 'English',
  MARATHI: 'Marathi',
  HINDI: 'Hindi',
  BENGALI: 'Bengali',
  GUJARATI: 'Gujarati',
};

/**
 * POST /api/org/[orgSlug]/video/generate-script
 *
 * Generates a video script using AI.
 *
 * Two modes:
 * 1. From prompt: Generate script based on user's topic/description
 *    { mode: 'prompt', prompt: 'Create a video about...' }
 *
 * 2. From content: Generate script from article/content text
 *    { mode: 'content', content: 'Full article text here...' }
 *
 * Note: For file upload, use /upload-script first to extract text,
 * then call this endpoint with mode='content' and the extracted text.
 *
 * Requires Agenta prompts:
 * - generate_video_script_from_prompt (for mode='prompt')
 * - generate_single_video_script_from_content (for mode='content')
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
    const validationResult = GenerateScriptSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const languageName = languageMap[data.language] || 'English';

    logger.info('Generating video script', {
      mode: data.mode,
      language: data.language,
      organizationId: org.id,
    });

    let script: string;

    if (data.mode === 'prompt') {
      // Generate script from user prompt
      script = await agentaOpenAIService.generateText({
        promptSlug: 'generate_video_script_from_prompt',
        variables: {
          userPrompt: data.prompt,
          languageName,
        },
        temperature: 0.7,
      });
    } else {
      // Generate script from content
      script = await agentaOpenAIService.generateText({
        promptSlug: 'generate_single_video_script_from_content',
        variables: {
          articleContent: data.content,
          languageName,
        },
        temperature: 0.7,
      });
    }

    logger.info('Video script generated successfully', {
      mode: data.mode,
      scriptLength: script.length,
      organizationId: org.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        script,
        characterCount: script.length,
        sourceType: data.mode === 'prompt' ? 'prompt' : 'content_file',
      },
    });
  } catch (error) {
    logger.error('Generate script error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      orgSlug: params.orgSlug,
    });

    // Check if it's an Agenta prompt not found error
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate script';
    const isPromptError = errorMessage.includes('prompt') || errorMessage.includes('Agenta');

    return NextResponse.json(
      {
        success: false,
        error: isPromptError
          ? 'Script generation is not configured. Please ensure the Agenta prompts are set up.'
          : errorMessage,
      },
      { status: 500 }
    );
  }
}
