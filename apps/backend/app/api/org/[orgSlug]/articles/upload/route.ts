import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/database';
import { z } from 'zod';
import { fileExtractionService } from '@/lib/services/core/file-extraction.service';
import { submissionService } from '@/lib/services/submission.service';
import { profileService } from '@/lib/services/profile.service';
import { queueService } from '@/lib/services/core/queue.service';
import { storageService } from '@/lib/services/core/storage.service';
import { createClient } from '@/lib/supabase/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { getOrgFromSlug, validateOrgAccess } from '@/lib/context/org-context';

// Configure route to handle larger payloads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Increase body size limit to 50MB for file uploads
export const maxDuration = 60; // 60 seconds timeout

// Schema for file upload with media configuration
const CreateArticleWithUploadSchema = z.object({
  skipThumbnailGeneration: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (typeof val === 'boolean') return val;
      return val === 'true';
    }),
  languages: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return val.split(',').map(l => l.trim().toUpperCase());
        }
      }
      return val.map(l => l.toUpperCase());
    }),
  generateAudio: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (typeof val === 'boolean') return val;
      return val === 'true';
    }),
  generatePodcast: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (typeof val === 'boolean') return val;
      return val === 'true';
    }),
  generateVideo: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (typeof val === 'boolean') return val;
      return val === 'true';
    }),
  generateQuiz: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (typeof val === 'boolean') return val;
      return val === 'true';
    }),
  generateInteractivePodcast: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (typeof val === 'boolean') return val;
      return val === 'true';
    }),
  category: z
    .union([z.string(), z.enum(['EVERGREEN', 'PERIODIC_UPDATES', 'MARKET_UPDATES'])])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      if (typeof val === 'string') return val.toUpperCase();
      return val;
    }),
  videoCustomization: z
    .union([z.string(), z.object({
      characterId: z.string(),
      enableCaptions: z.boolean(),
      captionTemplate: z.string(),
      enableMagicZooms: z.boolean(),
      enableMagicBrolls: z.boolean(),
      magicBrollsPercentage: z.number(),
    })])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return undefined;
        }
      }
      return val;
    }),
});

/**
 * POST /api/org/[orgSlug]/articles/upload - Create article from file upload with automatic submission
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ orgSlug: string }> }
) {
  const params = await props.params;
  console.log('🔵 [API /api/org/[orgSlug]/articles/upload] POST request received');
  console.log('🔵 [API] Request URL:', request.url);
  console.log('🔵 [API] Org Slug:', params.orgSlug);

  let filePath: string | undefined;

  try {
    // Get authenticated user
    console.log('🔐 [API] Authenticating user...');
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ [API] Authentication failed:', authError);
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    console.log('✅ [API] User authenticated:', user.id);

    // Validate user has access to this organization
    const hasAccess = await validateOrgAccess(user.id, params.orgSlug);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this organization' },
        { status: 403 }
      );
    }

    // Get organization
    const org = await getOrgFromSlug(params.orgSlug);
    if (!org) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    console.log('✅ [API] Organization validated:', org.id);

    // Upsert profile to ensure it exists
    console.log('👤 [API] Upserting profile...');
    await profileService.upsertProfile(user);

    console.log('📦 [API] Parsing form data...');
    console.log('📦 [API] Content-Type:', request.headers.get('content-type'));
    console.log('📦 [API] Content-Length:', request.headers.get('content-length'));

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (formDataError) {
      console.error('❌ [API] FormData parsing failed:', formDataError);
      console.error('❌ [API] Request details:', {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
      });
      throw new Error(`Failed to parse FormData: ${formDataError instanceof Error ? formDataError.message : 'Unknown error'}`);
    }

    const file = formData.get('file') as File | null;

    console.log('📄 [API] File received:', file ? {
      name: file.name,
      size: file.size,
      type: file.type,
    } : 'null');

    if (!file) {
      console.error('❌ [API] No file in form data');
      return NextResponse.json(
        {
          success: false,
          error: 'No file uploaded',
        },
        { status: 400 }
      );
    }

    // Extract configuration from form data
    console.log('⚙️ [API] Extracting configuration...');
    const configData: any = {};
    const bodyField = formData.get('body');

    if (bodyField && typeof bodyField === 'string') {
      try {
        const bodyStr = bodyField
          .replace(/(\w+):/g, '"$1":')
          .replace(/'/g, '"');
        Object.assign(configData, JSON.parse(bodyStr));
      } catch (e) {
        console.error('Failed to parse body field:', e);
        const body = bodyField;
        configData.generateAudio = /generateAudio:\s*true/.test(body);
        configData.generatePodcast = /generatePodcast:\s*true/.test(body);
        configData.generateVideo = /generateVideo:\s*true/.test(body);
        configData.generateQuiz = /generateQuiz:\s*true/.test(body);
        configData.generateInteractivePodcast = /generateInteractivePodcast:\s*true/.test(body);
      }
    } else {
      // Extract individual fields
      for (const [key, value] of formData.entries()) {
        if (key !== 'file') {
          configData[key] = value;
        }
      }
    }

    console.log('📝 [API] Config data before parsing:', configData);
    const mediaConfig = CreateArticleWithUploadSchema.parse(configData);
    console.log('✅ [API] Media config parsed:', mediaConfig);

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    console.log('📂 [API] Uploads directory:', uploadsDir);
    if (!existsSync(uploadsDir)) {
      console.log('📁 [API] Creating uploads directory...');
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save file temporarily
    console.log('💾 [API] Saving file temporarily...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    filePath = path.join(uploadsDir, `${uniqueSuffix}-${file.name}`);
    await writeFile(filePath, buffer);
    console.log('✅ [API] File saved to:', filePath);

    // Extract text from uploaded file
    console.log('📖 [API] Extracting text from file...');
    const { title, content } = await fileExtractionService.extractText(filePath, file.type);
    console.log('✅ [API] Text extracted. Title:', title, 'Content length:', content.length);

    // Create article with organizationId
    console.log('📄 [API] Creating article in database...');
    const article = await prisma.article.create({
      data: {
        title,
        content,
        category: mediaConfig.category as any || 'EVERGREEN',
        userId: user.id,
        organizationId: org.id, // Always set organizationId
      },
    });

    console.log(`📄 Created article ${article.id} from uploaded file: ${file.name} for org ${org.id}`);

    // Handle custom thumbnail if provided
    const customThumbnailFile = formData.get('customThumbnail') as File | null;

    if (customThumbnailFile && !mediaConfig.skipThumbnailGeneration) {
      console.log('==========================================');
      console.log('🖼️  CUSTOM THUMBNAIL UPLOAD - STARTING');
      console.log(`Article ID: ${article.id}`);
      console.log(`File name: ${customThumbnailFile.name}`);
      console.log(`File size: ${customThumbnailFile.size} bytes`);
      console.log(`File type: ${customThumbnailFile.type}`);
      console.log('==========================================');

      try {
        // Validate file type
        if (!['image/jpeg', 'image/png'].includes(customThumbnailFile.type)) {
          throw new Error('Invalid thumbnail file type. Only JPG and PNG are allowed.');
        }

        // Validate file size (5MB)
        if (customThumbnailFile.size > 5 * 1024 * 1024) {
          throw new Error('Thumbnail file too large. Maximum size is 5MB.');
        }

        // Convert file to buffer
        const thumbnailBytes = await customThumbnailFile.arrayBuffer();
        const thumbnailBuffer = Buffer.from(thumbnailBytes);

        // Upload to S3 using storage service
        console.log('📤 [API] Uploading custom thumbnail to S3...');
        const thumbnailUrl = await storageService.uploadCustomThumbnail(
          thumbnailBuffer,
          'article',
          article.id,
          customThumbnailFile.type as 'image/jpeg' | 'image/png'
        );

        // Update article with thumbnail URL
        console.log('💾 [API] Updating article with thumbnail URL...');
        await prisma.article.update({
          where: { id: article.id },
          data: { thumbnailUrl },
        });

        console.log('✅ CUSTOM THUMBNAIL UPLOAD - SUCCESS');
        console.log(`Thumbnail URL: ${thumbnailUrl}`);
        console.log('==========================================');
      } catch (error) {
        console.error('❌ CUSTOM THUMBNAIL UPLOAD - FAILED');
        console.error(`Error:`, error);
        console.error('==========================================');
        // Continue without custom thumbnail - not critical
        // Fall back to AI generation
        console.log('⚠️  Falling back to AI-generated thumbnail...');

        try {
          const job = await queueService.addArticleThumbnailGenerationJob({
            articleId: article.id,
            title: article.title,
            organizationId: org.id,
          });
          console.log('✅ Fallback thumbnail job enqueued:', job.id);
        } catch (fallbackError) {
          console.error('❌ Fallback thumbnail job also failed:', fallbackError);
        }
      }
    } else if (mediaConfig.skipThumbnailGeneration && customThumbnailFile) {
      // User provided custom thumbnail, skip AI generation completely
      console.log('🖼️  Custom thumbnail mode - Skipping AI generation job');

      try {
        // Validate file type
        if (!['image/jpeg', 'image/png'].includes(customThumbnailFile.type)) {
          throw new Error('Invalid thumbnail file type. Only JPG and PNG are allowed.');
        }

        // Validate file size (5MB)
        if (customThumbnailFile.size > 5 * 1024 * 1024) {
          throw new Error('Thumbnail file too large. Maximum size is 5MB.');
        }

        // Convert file to buffer
        const thumbnailBytes = await customThumbnailFile.arrayBuffer();
        const thumbnailBuffer = Buffer.from(thumbnailBytes);

        // Upload to S3
        const thumbnailUrl = await storageService.uploadCustomThumbnail(
          thumbnailBuffer,
          'article',
          article.id,
          customThumbnailFile.type as 'image/jpeg' | 'image/png'
        );

        // Update article with thumbnail URL
        await prisma.article.update({
          where: { id: article.id },
          data: { thumbnailUrl },
        });

        console.log('✅ Custom thumbnail uploaded successfully:', thumbnailUrl);
      } catch (error) {
        console.error('❌ Custom thumbnail upload failed:', error);
        // Continue without thumbnail - not critical
      }
    } else {
      // No custom thumbnail, use AI generation (default behavior)
      console.log('==========================================');
      console.log('🚀 ARTICLE THUMBNAIL JOB - STARTING ENQUEUE (UPLOAD)');
      console.log(`Article ID: ${article.id}`);
      console.log(`Article Title: ${article.title}`);
      console.log(`Organization ID: ${org.id}`);
      console.log('==========================================');

      try {
        const job = await queueService.addArticleThumbnailGenerationJob({
          articleId: article.id,
          title: article.title,
          organizationId: org.id,
        });
        console.log('✅ ARTICLE THUMBNAIL JOB - ENQUEUED SUCCESSFULLY (UPLOAD)');
        console.log(`Job ID: ${job.id}`);
        console.log(`Job Name: ${job.name}`);
        console.log(`Job Data:`, job.data);
        console.log('==========================================');
      } catch (error) {
        console.error('❌ ARTICLE THUMBNAIL JOB - ENQUEUE FAILED (UPLOAD)');
        console.error(`Error:`, error);
        console.error('==========================================');
        // Continue without thumbnail job - not critical
      }
    }

    // Auto-create submissions with selected media types and languages
    console.log('🎬 [API] Creating submissions...');
    const submissions = await submissionService.createSubmission({
      articleId: article.id,
      organizationId: org.id, // Pass organizationId to submission service
      languages: mediaConfig.languages,
      generateAudio: mediaConfig.generateAudio,
      generatePodcast: mediaConfig.generatePodcast,
      generateVideo: mediaConfig.generateVideo,
      generateQuiz: mediaConfig.generateQuiz,
      generateInteractivePodcast: mediaConfig.generateInteractivePodcast,
      videoCustomization: mediaConfig.videoCustomization,
    });

    console.log(`🚀 Auto-created ${submissions.length} submission(s) for article ${article.id}`);

    // Clean up uploaded file
    console.log('🗑️ [API] Cleaning up uploaded file...');
    await unlink(filePath);

    console.log('✅ [API] Upload complete, sending response');
    return NextResponse.json(
      {
        success: true,
        data: {
          article,
          submissions,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ [API] ERROR in POST /api/org/[orgSlug]/articles/upload:', error);
    console.error('❌ [API] Error stack:', error instanceof Error ? error.stack : 'N/A');
    // Clean up file if it exists
    if (filePath) {
      try {
        await unlink(filePath);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Create Article with Upload Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create article from upload',
      },
      { status: 500 }
    );
  }
}
