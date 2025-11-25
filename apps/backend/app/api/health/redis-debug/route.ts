import { NextResponse } from 'next/server';
import { getRedisConnection } from '@/lib/config/queue';

export async function GET() {
  const start = Date.now();
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {
      redisUrl: process.env.REDIS_URL || 'NOT SET',
      nodeEnv: process.env.NODE_ENV,
    },
    tests: {},
  };

  try {
    // Test 1: Get Redis connection
    diagnostics.tests.getConnection = { status: 'attempting' };
    const redis = getRedisConnection();

    // For cluster mode, get nodes info instead of single host/port
    const nodes = redis.nodes('master');
    diagnostics.tests.getConnection = {
      status: 'success',
      clusterMode: true,
      nodeCount: nodes.length,
      nodes: nodes.map(node => ({
        host: node.options.host,
        port: node.options.port,
      })),
    };

    // Test 2: Check connection status
    diagnostics.tests.connectionStatus = {
      status: redis.status,
      message: `Redis client is in ${redis.status} state`,
    };

    // Test 3: Try to connect explicitly
    if (redis.status !== 'ready' && redis.status !== 'connecting') {
      diagnostics.tests.explicitConnect = { status: 'attempting' };
      try {
        await redis.connect();
        diagnostics.tests.explicitConnect = { status: 'success' };
      } catch (err) {
        diagnostics.tests.explicitConnect = {
          status: 'failed',
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }

    // Test 4: Ping with timeout
    diagnostics.tests.ping = { status: 'attempting' };
    try {
      const pingResult = await Promise.race([
        redis.ping(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Ping timeout after 5s')), 5000)
        ),
      ]);
      diagnostics.tests.ping = {
        status: 'success',
        result: pingResult,
        latency_ms: Date.now() - start,
      };
    } catch (err) {
      diagnostics.tests.ping = {
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
        latency_ms: Date.now() - start,
      };
    }

    // Test 5: Try a simple SET/GET
    if (diagnostics.tests.ping.status === 'success') {
      diagnostics.tests.setGet = { status: 'attempting' };
      try {
        const testKey = `health-check-${Date.now()}`;
        await redis.set(testKey, 'test-value', 'EX', 60);
        const value = await redis.get(testKey);
        await redis.del(testKey);
        diagnostics.tests.setGet = {
          status: 'success',
          verified: value === 'test-value',
        };
      } catch (err) {
        diagnostics.tests.setGet = {
          status: 'failed',
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }

    // Overall status
    const allTestsPassed = Object.values(diagnostics.tests).every(
      (test: any) => test.status === 'success' || test.status === 'ready'
    );

    return NextResponse.json(
      {
        status: allTestsPassed ? 'healthy' : 'unhealthy',
        ...diagnostics,
      },
      { status: allTestsPassed ? 200 : 503 }
    );
  } catch (error) {
    console.error('[Redis Debug] Error:', error);

    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        ...diagnostics,
      },
      { status: 500 }
    );
  }
}
