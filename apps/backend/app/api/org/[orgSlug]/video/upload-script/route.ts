import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOrgFromSlug, validateOrgAccess } from '@/lib/context/org-context';
import { fileExtractionService } from '@/lib/services/core/file-extraction.service';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';
import { logger } from '@repo/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/org/[orgSlug]/video/upload-script
 *
 * Uploads a script file and extracts text content.
 * Supports: DOCX, DOC, TXT, PDF
 *
 * This endpoint extracts raw text without AI cleaning (unlike article upload).
 * The user can then edit the script directly in the UI.
 *
 * Request: FormData with 'file' field
 * Response: { success: true, data: { script: string } }
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ orgSlug: string }> }
) {
  const params = await props.params;
  let filePath: string | null = null;

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

    // Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'text/plain', // .txt
      'application/pdf', // .pdf
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported file type. Supported: DOCX, DOC, TXT, PDF' },
        { status: 400 }
      );
    }

    // Save file temporarily
    const uploadsDir = path.join(process.cwd(), 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    filePath = path.join(uploadsDir, `${uniqueSuffix}-${file.name}`);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    logger.info('Extracting text from uploaded script file', {
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      organizationId: org.id,
    });

    // Extract raw text (no AI cleaning for script uploads)
    const script = await fileExtractionService.extractRawText(filePath, file.type);

    logger.info('Script text extracted successfully', {
      fileName: file.name,
      scriptLength: script.length,
      organizationId: org.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        script,
        fileName: file.name,
        characterCount: script.length,
      },
    });
  } catch (error) {
    logger.error('Upload script error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      orgSlug: params.orgSlug,
    });

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to extract script from file' },
      { status: 500 }
    );
  } finally {
    // Clean up temp file
    if (filePath) {
      try {
        await unlink(filePath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}
