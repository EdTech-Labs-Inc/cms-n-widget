import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/database';
import { createClient } from '@/lib/supabase/server';
import { getOrgFromSlug, validateOrgAccess } from '@/lib/context/org-context';
import { storageService } from '@/lib/services/core/storage.service';
import { heygenService } from '@/lib/services/external/heygen.service';
import { z } from 'zod';

// Validation schema for character creation
const CreateCharacterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  voiceId: z.string().uuid('Invalid voice ID'),
  characterType: z.enum(['avatar', 'talking_photo']).default('avatar'),
  gender: z.enum(['male', 'female']).optional(),
  description: z.string().optional(),
  heygenAvatarGroupId: z.string().optional(),
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

/**
 * GET /api/org/[orgSlug]/characters - Get all characters for organization
 *
 * Returns characters with their linked voice information for video generation.
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ orgSlug: string }> }
) {
  const params = await props.params;
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    // Fetch all characters for the organization with their linked voice
    const characters = await prisma.character.findMany({
      where: {
        organizationId: org.id,
      },
      include: {
        voice: {
          select: {
            id: true,
            name: true,
            elevenlabsVoiceId: true,
            gender: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        characters,
        total: characters.length,
      },
    });
  } catch (error) {
    console.error('Get Characters Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch characters',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/org/[orgSlug]/characters - Create a new character
 *
 * Accepts multipart form data with:
 * - photo: Image file (JPG/PNG, max 5MB)
 * - name: Character name
 * - voiceId: UUID of linked voice
 * - characterType: 'avatar' or 'talking_photo' (default: 'avatar')
 * - gender: 'male' or 'female' (optional)
 * - description: Text description (optional)
 * - heygenAvatarGroupId: Group ID for multiple looks (optional)
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ orgSlug: string }> }
) {
  const params = await props.params;
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    // Parse multipart form data
    const formData = await request.formData();
    const photoFile = formData.get('photo') as File | null;
    const name = formData.get('name') as string;
    const voiceId = formData.get('voiceId') as string;
    const characterType = (formData.get('characterType') as string) || 'avatar';
    const gender = formData.get('gender') as string | null;
    const description = formData.get('description') as string | null;
    const heygenAvatarGroupId = formData.get('heygenAvatarGroupId') as string | null;

    // Validate photo file
    if (!photoFile) {
      return NextResponse.json(
        { success: false, error: 'Photo is required' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(photoFile.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPG and PNG are allowed.' },
        { status: 400 }
      );
    }

    if (photoFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Validate other fields
    const validationResult = CreateCharacterSchema.safeParse({
      name,
      voiceId,
      characterType,
      gender: gender || undefined,
      description: description || undefined,
      heygenAvatarGroupId: heygenAvatarGroupId || undefined,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Verify voice belongs to this organization
    const voice = await prisma.voice.findFirst({
      where: {
        id: validatedData.voiceId,
        organizationId: org.id,
      },
    });

    if (!voice) {
      return NextResponse.json(
        { success: false, error: 'Voice not found in this organization' },
        { status: 404 }
      );
    }

    // Convert file to buffer
    const bytes = await photoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Step 1: Upload photo to S3 for thumbnailUrl
    const timestamp = Date.now();
    const extension = photoFile.type === 'image/jpeg' ? 'jpg' : 'png';
    const s3Path = `organizations/${org.id}/characters/${timestamp}-${photoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const uploadResult = await storageService.uploadFile(
      buffer,
      s3Path,
      photoFile.type
    );
    const thumbnailUrl = uploadResult.cloudfrontUrl;

    // Step 2: Upload photo to HeyGen to get imageKey
    let heygenImageKey: string;
    try {
      const heygenResult = await heygenService.uploadAsset(
        buffer,
        photoFile.name,
        photoFile.type
      );
      heygenImageKey = heygenResult.imageKey;
    } catch (heygenError) {
      console.error('HeyGen upload failed:', heygenError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to upload to HeyGen: ${heygenError instanceof Error ? heygenError.message : 'Unknown error'}`,
        },
        { status: 500 }
      );
    }

    // Step 3: Create character in database
    const character = await prisma.character.create({
      data: {
        name: validatedData.name,
        voiceId: validatedData.voiceId,
        organizationId: org.id,
        characterType: validatedData.characterType,
        gender: validatedData.gender || null,
        description: validatedData.description || null,
        heygenAvatarGroupId: validatedData.heygenAvatarGroupId || null,
        heygenImageKey,
        thumbnailUrl,
      },
      include: {
        voice: {
          select: {
            id: true,
            name: true,
            elevenlabsVoiceId: true,
            gender: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: character,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create Character Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create character',
      },
      { status: 500 }
    );
  }
}
