import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOrgFromSlug, validateOrgAccess } from '@/lib/context/org-context';
import { agentaOpenAIService } from '@/lib/services/external/agenta-openai.service';
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

const GenerateFromScriptWithPromptSchema = z.object({
  mode: z.literal('script_with_prompt'),
  script: z.string().min(10, 'Script must be at least 10 characters'),
  prompt: z.string().min(5, 'Guidance must be at least 5 characters'),
  language: z.enum(['ENGLISH', 'MARATHI', 'HINDI', 'BENGALI', 'GUJARATI']).optional().default('ENGLISH'),
});

const GenerateFromContentWithPromptSchema = z.object({
  mode: z.literal('content_with_prompt'),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  prompt: z.string().min(5, 'Guidance must be at least 5 characters'),
  language: z.enum(['ENGLISH', 'MARATHI', 'HINDI', 'BENGALI', 'GUJARATI']).optional().default('ENGLISH'),
});

const GenerateScriptSchema = z.discriminatedUnion('mode', [
  GenerateFromPromptSchema,
  GenerateFromContentSchema,
  GenerateFromScriptWithPromptSchema,
  GenerateFromContentWithPromptSchema,
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
 * Four modes:
 * 1. From prompt: Generate script based on user's topic/description
 *    { mode: 'prompt', prompt: 'Create a video about...' }
 *
 * 2. From content: Generate script from article/content text
 *    { mode: 'content', content: 'Full article text here...' }
 *
 * 3. Script with prompt: Apply user guidance to an existing script
 *    { mode: 'script_with_prompt', script: 'existing script', prompt: 'make it shorter' }
 *
 * 4. Content with prompt: Generate script from content with user guidance
 *    { mode: 'content_with_prompt', content: 'article text', prompt: 'focus on benefits' }
 *
 * Note: For file upload, use /upload-script first to extract text,
 * then call this endpoint with the extracted text.
 *
 * Requires Agenta prompts:
 * - generate_video_script_from_prompt (for mode='prompt')
 * - generate_single_video_script_from_content (for mode='content')
 * - generate_video_script_from_script_with_guidance (for mode='script_with_prompt')
 * - generate_video_script_from_content_with_guidance (for mode='content_with_prompt')
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
    let sourceType: string;

    switch (data.mode) {
      case 'prompt':
        // Generate script from user prompt
        script = await agentaOpenAIService.generateText({
          promptSlug: 'generate_video_script_from_prompt',
          variables: {
            userPrompt: data.prompt,
            languageName,
          },
          temperature: 0.7,
        });
        sourceType = 'prompt';
        break;

      case 'content':
        // Generate script from content
        script = await agentaOpenAIService.generateText({
          promptSlug: 'generate_single_video_script_from_content',
          variables: {
            articleContent: data.content,
            languageName,
          },
          temperature: 0.7,
        });
        sourceType = 'content_file';
        break;

      case 'script_with_prompt':
        // Apply user guidance to existing script
        script = await agentaOpenAIService.generateText({
          promptSlug: 'generate_video_script_from_script_with_guidance',
          variables: {
            existingScript: data.script,
            userGuidance: data.prompt,
            languageName,
          },
          temperature: 0.7,
        });
        sourceType = 'script_file';
        break;

      case 'content_with_prompt':
        // Generate script from content with user guidance
        script = await agentaOpenAIService.generateText({
          promptSlug: 'generate_video_script_from_content_with_guidance',
          variables: {
            articleContent: data.content,
            userGuidance: data.prompt,
            languageName,
          },
          temperature: 0.7,
        });
        sourceType = 'content_file';
        break;
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
        sourceType,
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
