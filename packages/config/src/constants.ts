/**
 * Application Constants
 *
 * General configuration constants used across the application
 * Environment-specific values are loaded from process.env
 */

import { loadEnvConfig } from '@next/env';

// Load environment variables
const projectDir = process.cwd();
loadEnvConfig(projectDir);

/**
 * Server configuration
 */
export const SERVER_CONFIG = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
} as const;

/**
 * Database configuration
 */
export const DATABASE_CONFIG = {
  databaseUrl: process.env.DATABASE_URL || '',
} as const;

/**
 * Redis configuration
 */
export const REDIS_CONFIG = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD || '',
  username: process.env.REDIS_USERNAME || '',
} as const;

/**
 * OpenAI configuration
 */
export const OPENAI_CONFIG = {
  apiKey: process.env.OPENAI_API_KEY || '',
  defaultModel: 'gpt-4o-2024-08-06', // Supports structured outputs
  temperature: 0.7,
  maxTokens: 4000,
} as const;

/**
 * ElevenLabs configuration
 */
export const ELEVENLABS_CONFIG = {
  apiKey: process.env.ELEVENLABS_API_KEY || '',
  defaultVoiceId: process.env.ELEVENLABS_DEFAULT_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL',
  defaultModel: 'eleven_v3',
  interviewerVoiceId: process.env.ELEVENLABS_INTERVIEWER_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL',
  guestVoiceId: process.env.ELEVENLABS_GUEST_VOICE_ID || 'ErXwobaYiN019PkySvjV',
  apiUrl: 'https://api.elevenlabs.io/v1',
} as const;

/**
 * HeyGen configuration
 */
export const HEYGEN_CONFIG = {
  apiKey: process.env.HEYGEN_API_KEY || '',
  webhookSecret: process.env.HEYGEN_WEBHOOK_SECRET || '',
  defaultCharacterType: (process.env.HEYGEN_DEFAULT_CHARACTER_TYPE === 'avatar' ? 'avatar' : 'talking_photo') as 'avatar' | 'talking_photo',
  defaultTalkingPhotoId: process.env.HEYGEN_DEFAULT_TALKING_PHOTO_ID || '',
  defaultAvatarId: process.env.HEYGEN_DEFAULT_AVATAR_ID || 'a6a1ccb97a674c12be76a0c9adac4244',
  defaultVoiceId: process.env.HEYGEN_DEFAULT_VOICE_ID || 'f9676c23ad3c41e989f546a2746c1ea9',
  apiUrl: 'https://api.heygen.com/v2',
} as const;

/**
 * Submagic configuration
 */
export const SUBMAGIC_CONFIG = {
  apiKey: process.env.SUBMAGIC_API_KEY || '',
  apiUrl: process.env.SUBMAGIC_API_URL || 'https://api.submagic.co/v1',
  webhookUrl: process.env.SUBMAGIC_WEBHOOK_URL || '',
} as const;

/**
 * AWS Storage configuration (S3/R2)
 * Note: In production with SST, credentials are not needed (uses IAM role)
 */
export const STORAGE_CONFIG = {
  bucket: process.env.S3_BUCKET || '',
  accessKeyId: process.env.S3_ACCESS_KEY || '',
  secretAccessKey: process.env.S3_SECRET_KEY || '',
  region: process.env.S3_REGION || 'ap-south-1',
  endpoint: process.env.S3_ENDPOINT, // For Cloudflare R2
  cloudfrontBaseUrl: process.env.CLOUDFRONT_BASE_URL,
} as const;

/**
 * BullMQ Queue configuration
 */
export const QUEUE_CONFIG = {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // 1 hour
      count: 100,
    },
    removeOnFail: {
      age: 86400, // 24 hours
    },
  },
} as const;

/**
 * AWS Transcribe configuration
 */
export const AWS_TRANSCRIBE_CONFIG = {
  region: process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
} as const;

/**
 * Language codes for different services
 */
export const LANGUAGE_CODES = {
  ENGLISH: {
    name: 'English',
    code: 'en',
    awsTranscribe: 'en-US',
    elevenlabs: 'en',
  },
  MARATHI: {
    name: 'Marathi',
    code: 'mr',
    awsTranscribe: 'mr-IN',
    elevenlabs: 'mr',
  },
  HINDI: {
    name: 'Hindi',
    code: 'hi',
    awsTranscribe: 'hi-IN',
    elevenlabs: 'hi',
  },
  BENGALI: {
    name: 'Bengali',
    code: 'bn',
    awsTranscribe: 'bn-IN',
    elevenlabs: 'bn',
  },
  GUJARATI: {
    name: 'Gujarati',
    code: 'gu',
    awsTranscribe: 'gu-IN',
    elevenlabs: 'gu',
  },
} as const;

/**
 * Supabase configuration
 */
export const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
} as const;

/**
 * Timeout configurations (milliseconds)
 */
export const TIMEOUT_CONFIG = {
  heygenGeneration: 300000, // 5 minutes
  submagicProcessing: 300000, // 5 minutes
  audioGeneration: 120000, // 2 minutes
  transcription: 180000, // 3 minutes
  apiRequest: 30000, // 30 seconds
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION_CONFIG = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,
} as const;

/**
 * Content categories
 */
export const CONTENT_CATEGORIES = {
  EVERGREEN: 'EVERGREEN',
  PERIODIC_UPDATES: 'PERIODIC_UPDATES',
  MARKET_UPDATES: 'MARKET_UPDATES',
} as const;

/**
 * Validate required environment variables
 */
export function validateConfig() {
  const required = [
    'DATABASE_URL',
    'OPENAI_API_KEY',
    'ELEVENLABS_API_KEY',
    'HEYGEN_API_KEY',
    'SUBMAGIC_API_KEY',
  ];

  if (SERVER_CONFIG.nodeEnv === 'production') {
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`
      );
    }
  }
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return SERVER_CONFIG.nodeEnv === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return SERVER_CONFIG.nodeEnv === 'production';
}
