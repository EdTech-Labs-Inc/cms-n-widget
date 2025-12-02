import { NextResponse } from 'next/server';
import { prisma } from '@repo/database';

/**
 * GET /api/feature-flags
 * Returns all feature flags as a key-value object
 * Public endpoint - no auth required (flags are not sensitive)
 */
export async function GET() {
  try {
    const featureFlags = await prisma.featureFlag.findMany({
      select: {
        key: true,
        enabled: true,
      },
    });

    // Convert array to object for easier consumption
    const flags = featureFlags.reduce(
      (acc, flag) => {
        acc[flag.key] = flag.enabled;
        return acc;
      },
      {} as Record<string, boolean>
    );

    return NextResponse.json({ flags });
  } catch (error) {
    console.error('[API] Error fetching feature flags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature flags', flags: {} },
      { status: 500 }
    );
  }
}
