import { NextResponse } from 'next/server';
import { prisma } from '@/lib/config/database';

/**
 * Database health check endpoint
 * Tests actual DB connectivity with a lightweight query
 * Used by external monitoring (BetterStack/UptimeRobot)
 */
export async function GET() {
  const start = Date.now();

  try {
    // Lightweight DB query to test connectivity
    await prisma.$queryRaw`SELECT 1 as health`;

    const latency = Date.now() - start;

    return NextResponse.json({
      status: 'healthy',
      db: 'connected',
      latency_ms: latency,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Health Check] DB connection failed:', error);

    return NextResponse.json({
      status: 'unhealthy',
      db: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
