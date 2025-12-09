import { Queue, QueueOptions } from 'bullmq';
import { Cluster } from 'ioredis';
import Redis from 'ioredis';
import { config } from './constants';

// Lazy initialization for Redis connections
let _redisConnection: Cluster | Redis | null = null;
let _workerRedisConnection: Cluster | Redis | null = null;
let _mediaGenerationQueue: Queue | null = null;

// Helper function to determine if we should use cluster mode
function shouldUseClusterMode(): boolean {
  // If running on Render, always use standalone mode
  if (process.env.IS_RENDER === 'true') {
    return false;
  }

  // Use cluster mode in production, or if explicitly set via REDIS_MODE
  const redisMode = process.env.REDIS_MODE;
  if (redisMode) {
    return redisMode.toLowerCase() === 'cluster';
  }
  // Default: cluster in production, standalone in development
  return config.nodeEnv === 'production';
}

// Getter for Redis connection - creates connection for Queue instances (backend-service)
// Uses shorter timeouts and fail-fast behavior for API endpoints
export function getRedisConnection(): Cluster | Redis {
  if (!_redisConnection) {
    // Parse the Redis URL to extract hostname and port for cluster configuration
    const url = new URL(config.redisUrl);
    const useTls = url.protocol === 'rediss:';
    const hostname = url.hostname;
    const port = Number(url.port) || 6379;
    const useCluster = shouldUseClusterMode();

    if (useCluster) {
      // Production: Use Redis Cluster
      console.log('📍 Initializing Redis connection in CLUSTER mode');
      _redisConnection = new Cluster([
        { host: hostname, port }
      ], {
        dnsLookup: (address, callback) => callback(null, address), // Avoid IPv6 lookup quirks
        redisOptions: {
          // Add password authentication if provided
          ...(config.redisPassword ? { password: config.redisPassword } : {}),
          // Enable TLS if rediss:// protocol is used
          ...(useTls ? { tls: {} } : {}),
          maxRetriesPerRequest: null,
          connectTimeout: 10000, // 10 seconds
          commandTimeout: 5000,  // 5 seconds for commands (OK for Queue operations)
        },
        lazyConnect: true,     // Don't connect immediately
        enableOfflineQueue: false, // Fail fast for Queue instances
        clusterRetryStrategy: (times: number) => {
          // Retry with exponential backoff, max 3 seconds between retries
          return Math.min(times * 50, 3000);
        },
        // NOTE: enableAutoPipelining is incompatible with BullMQ in cluster mode
        // It causes "All keys in pipeline must belong to same slot" errors
      });
    } else {
      // Local development or Render: Use standalone Redis
      console.log('📍 Initializing Redis connection in STANDALONE mode');
      _redisConnection = new Redis({
        host: hostname,
        port: port,
        password: config.redisPassword || undefined,
        username: config.redisUsername || undefined,
        tls: useTls ? {} : undefined,
        maxRetriesPerRequest: null,
        connectTimeout: 10000, // 10 seconds
        commandTimeout: 5000,  // 5 seconds for commands (OK for Queue operations)
        lazyConnect: true,     // Don't connect immediately
        enableOfflineQueue: false, // Fail fast for Queue instances
        retryStrategy: (times: number) => {
          // Retry with exponential backoff, max 3 seconds between retries
          return Math.min(times * 50, 3000);
        },
      });
    }
  }
  return _redisConnection;
}

// Getter for Worker Redis connection - creates connection optimized for Worker instances
// Uses longer timeouts and persistent connections for blocking operations
export function getWorkerRedisConnection(): Cluster | Redis {
  if (!_workerRedisConnection) {
    // Parse the Redis URL to extract hostname and port for cluster configuration
    const url = new URL(config.redisUrl);
    const useTls = url.protocol === 'rediss:';
    const hostname = url.hostname;
    const port = Number(url.port) || 6379;
    const useCluster = shouldUseClusterMode();

    if (useCluster) {
      // Production: Use Redis Cluster
      console.log('📍 Initializing Worker Redis connection in CLUSTER mode');
      _workerRedisConnection = new Cluster([
        { host: hostname, port }
      ], {
        dnsLookup: (address, callback) => callback(null, address), // Avoid IPv6 lookup quirks
        redisOptions: {
          // Add password authentication if provided
          ...(config.redisPassword ? { password: config.redisPassword } : {}),
          // Enable TLS if rediss:// protocol is used
          ...(useTls ? { tls: {} } : {}),
          maxRetriesPerRequest: null,
          connectTimeout: 30000, // 30 seconds (longer for workers)
          // NO commandTimeout for workers - blocking operations can take a long time
        },
        lazyConnect: true,     // Don't connect immediately
        enableOfflineQueue: true, // Wait indefinitely for workers (default, but explicit)
        clusterRetryStrategy: (times: number) => {
          // Retry with exponential backoff, max 3 seconds between retries
          return Math.min(times * 50, 3000);
        },
        // NOTE: enableAutoPipelining is incompatible with BullMQ in cluster mode
        // It causes "All keys in pipeline must belong to same slot" errors
      });
    } else {
      // Local development or Render: Use standalone Redis
      console.log('📍 Initializing Worker Redis connection in STANDALONE mode');
      _workerRedisConnection = new Redis({
        host: hostname,
        port: port,
        password: config.redisPassword || undefined,
        username: config.redisUsername || undefined,
        tls: useTls ? {} : undefined,
        maxRetriesPerRequest: null,
        connectTimeout: 30000, // 30 seconds (longer for workers)
        // NO commandTimeout for workers - blocking operations can take a long time
        lazyConnect: true,     // Don't connect immediately
        enableOfflineQueue: true, // Wait indefinitely for workers (default, but explicit)
        retryStrategy: (times: number) => {
          // Retry with exponential backoff, max 3 seconds between retries
          return Math.min(times * 50, 3000);
        },
      });
    }
  }
  return _workerRedisConnection;
}

// Getter for media generation queue - creates queue on first access
export function getMediaGenerationQueue(): Queue {
  if (!_mediaGenerationQueue) {
    const queueOptions: QueueOptions = {
      connection: getRedisConnection(),
      defaultJobOptions: config.queue.defaultJobOptions,
      // Use hash tag prefix to ensure all keys land in the same Redis Cluster slot
      // The {media} part is the hash tag - Redis uses it to determine the slot
      prefix: 'bull:{media}',
    };
    _mediaGenerationQueue = new Queue('media-generation', queueOptions);
  }
  return _mediaGenerationQueue;
}

// Queue names enum
export enum QueueNames {
  MEDIA_GENERATION = 'media-generation',
}

// Job types enum
export enum JobTypes {
  GENERATE_AUDIO = 'generate-audio',
  GENERATE_PODCAST = 'generate-podcast',
  GENERATE_VIDEO = 'generate-video', // Includes bubble generation automatically
  GENERATE_QUIZ = 'generate-quiz',
  GENERATE_INTERACTIVE_PODCAST = 'generate-interactive-podcast', // Requires podcast to exist
  GENERATE_ARTICLE_THUMBNAIL = 'generate-article-thumbnail', // Generate thumbnail for article
  PROCESS_VIDEO_COMPLETION = 'process-video-completion', // Process completed HeyGen video (transcribe, generate bubbles)

  // Script-only generation (new decoupled flow)
  GENERATE_VIDEO_SCRIPT = 'generate-video-script', // Generate video script only (no HeyGen)
  GENERATE_PODCAST_TRANSCRIPT = 'generate-podcast-transcript', // Generate podcast transcript only (no audio)
  GENERATE_INTERACTIVE_PODCAST_SCRIPT = 'generate-interactive-podcast-script', // Generate interactive podcast script only

  // Media generation from approved script
  GENERATE_VIDEO_FROM_SCRIPT = 'generate-video-from-script', // Generate HeyGen video from approved script
  GENERATE_PODCAST_FROM_TRANSCRIPT = 'generate-podcast-from-transcript', // Generate podcast audio from approved transcript
  GENERATE_INTERACTIVE_PODCAST_FROM_SCRIPT = 'generate-interactive-podcast-from-script', // Generate interactive podcast from approved script

  // Standalone video generation (no Article/Submission)
  GENERATE_STANDALONE_VIDEO = 'generate-standalone-video', // Generate video from standalone video create page
  POST_PROCESS_STANDALONE_VIDEO = 'post-process-standalone-video', // Add bumpers/music to standalone video
}
