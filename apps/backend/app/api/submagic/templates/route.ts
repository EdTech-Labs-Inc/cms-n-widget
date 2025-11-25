import { NextResponse } from 'next/server';
import axios from 'axios';
import { config } from '@/lib/config/constants';

/**
 * GET /api/submagic/templates
 *
 * Fetch available caption templates from Submagic API
 * Returns an array of template names that can be used for video editing
 */
export async function GET() {
  try {
    console.log('🎨 Fetching Submagic templates...');

    const response = await axios.get('https://api.submagic.co/v1/templates', {
      headers: {
        'x-api-key': config.submagic.apiKey,
      },
    });

    const templates = response.data?.templates || [];

    console.log(`✅ Fetched ${templates.length} Submagic templates`);

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('❌ Error fetching Submagic templates:', error);

    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const message = error.response?.data?.message || error.message;

      return NextResponse.json(
        {
          success: false,
          error: `Submagic API error: ${message}`,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch templates',
      },
      { status: 500 }
    );
  }
}
