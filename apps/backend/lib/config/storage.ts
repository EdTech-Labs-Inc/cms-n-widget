import { S3Client } from '@aws-sdk/client-s3';

// S3 Client configuration
// Production (SST): Uses IAM role automatically, no credentials needed
// Development: Can optionally provide S3_ACCESS_KEY and S3_SECRET_KEY
const s3Config: any = {
  region: process.env.S3_REGION || 'ap-south-1',
};

// Only add credentials if provided (for local development)
// In production with SST, these won't be set and IAM role will be used
if (process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY) {
  s3Config.credentials = {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  };
}

// Support Cloudflare R2 or custom S3-compatible endpoints
if (process.env.S3_ENDPOINT) {
  s3Config.endpoint = process.env.S3_ENDPOINT;
}

export const s3Client = new S3Client(s3Config);

// Bucket name from environment
export const STORAGE_BUCKET = process.env.S3_BUCKET || '';
