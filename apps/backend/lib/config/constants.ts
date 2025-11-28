// Configuration constants
// Environment variables should be loaded by the entry point (Next.js or worker)

export const config = {
  // Server
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  // Database
  databaseUrl: process.env.DATABASE_URL || "",

  // Redis
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  redisPassword: process.env.REDIS_PASSWORD || "",
  redisUsername: process.env.REDIS_USERNAME || "",

  // API Keys
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    defaultModel: "gpt-4o-2024-08-06", // Supports structured outputs
    temperature: 0.7,
  },

  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY || "",
    defaultVoiceId:
      process.env.ELEVENLABS_DEFAULT_VOICE_ID || "EXAVITQu4vr4xnSDxMaL", // Default voice
    defaultModel: "eleven_multilingual_v2",
    interviewerVoiceId:
      process.env.ELEVENLABS_INTERVIEWER_VOICE_ID || "EXAVITQu4vr4xnSDxMaL",
    guestVoiceId:
      process.env.ELEVENLABS_GUEST_VOICE_ID || "ErXwobaYiN019PkySvjV",
  },

  heygen: {
    apiKey: process.env.HEYGEN_API_KEY || "",
    webhookSecret: process.env.HEYGEN_WEBHOOK_SECRET || "",
    // Character type determines which ID to use by default
    defaultCharacterType: (process.env.HEYGEN_DEFAULT_CHARACTER_TYPE === 'avatar' ? 'avatar' : 'talking_photo') as 'avatar' | 'talking_photo',
    defaultTalkingPhotoId: process.env.HEYGEN_DEFAULT_TALKING_PHOTO_ID || "", // Used when defaultCharacterType is 'talking_photo'
    defaultAvatarId:
      process.env.HEYGEN_DEFAULT_AVATAR_ID ||
      "a6a1ccb97a674c12be76a0c9adac4244", // Used when defaultCharacterType is 'avatar'
    defaultVoiceId:
      process.env.HEYGEN_DEFAULT_VOICE_ID || "f9676c23ad3c41e989f546a2746c1ea9",
    apiUrl: "https://api.heygen.com/v2",
  },

  submagic: {
    apiKey: process.env.SUBMAGIC_API_KEY || "",
    apiUrl: process.env.SUBMAGIC_API_URL || "https://api.submagic.co/v1",
    webhookUrl: process.env.SUBMAGIC_WEBHOOK_URL || "https://snoopy-moonishly-robbin.ngrok-free.dev",
  },

  // Agenta (Prompt Management)
  agenta: {
    apiKey: process.env.AGENTA_API_KEY || "",
    baseUrl: process.env.AGENTA_BASE_URL || "https://cloud.agenta.ai",
    environment: process.env.AGENTA_ENVIRONMENT || "production",
    cacheTTL: parseInt(process.env.AGENTA_CACHE_TTL || "900000", 10), // 15 minutes
  },

  // Storage (S3/R2)
  // Note: In production with SST, credentials are not needed (uses IAM role)
  // For local development, you can set S3_ACCESS_KEY and S3_SECRET_KEY in .env
  storage: {
    bucket: process.env.S3_BUCKET || "",
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
    region: process.env.S3_REGION || "ap-south-1",
    endpoint: process.env.S3_ENDPOINT, // For Cloudflare R2
    cloudfrontBaseUrl: process.env.CLOUDFRONT_BASE_URL, // CloudFront distribution URL (e.g., https://d1234567890abc.cloudfront.net)
  },

  // BullMQ
  queue: {
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential" as const,
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
  },
};

// Validate required environment variables in production
export function validateConfig() {
  const required = [
    "DATABASE_URL",
    "OPENAI_API_KEY",
    "ELEVENLABS_API_KEY",
    "HEYGEN_API_KEY",
    "SUBMAGIC_API_KEY",
    "AGENTA_API_KEY",
  ];

  if (config.nodeEnv === "production") {
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`
      );
    }
  }
}
