import { NextResponse } from 'next/server';
import { HEYGEN_CHARACTERS } from '@/lib/config/heygen-characters';

/**
 * GET /api/heygen/characters
 *
 * Returns the list of available HeyGen characters for video generation
 * Each character includes: id, name, type (talking_photo/avatar), characterId, voiceId, photoUrl
 */
export async function GET() {
  try {
    console.log('🎭 Fetching HeyGen characters...');

    return NextResponse.json({
      success: true,
      data: HEYGEN_CHARACTERS,
    });
  } catch (error) {
    console.error('❌ Error fetching HeyGen characters:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch characters',
      },
      { status: 500 }
    );
  }
}
