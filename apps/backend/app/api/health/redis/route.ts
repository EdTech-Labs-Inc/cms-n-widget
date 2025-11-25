import { NextResponse } from 'next/server';
import { getRedisConnection } from '@/lib/config/queue';

export async function GET() {
  const start = Date.now();

  try {
    const redis = getRedisConnection();

    // Test basic connectivity with PING, with a 5 second timeout
    const pingResult = await Promise.race([
      redis.ping(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis ping timeout after 5s')), 5000)
      ),
    ]);

    const latency = Date.now() - start;

    return NextResponse.json({
      status: 'healthy',
      redis: 'connected',
      ping: pingResult,
      latency_ms: latency,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Health Check] Redis connection failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        redis: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
