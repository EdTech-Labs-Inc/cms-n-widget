# Environment Setup Guide

**Last Updated:** 2025-11-25

This guide covers local development environment setup for the CMS platform. For production deployment configuration, see separate deployment documentation.

---

## Quick Start

1. Copy the root `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your actual values in `.env`

3. For package-specific configuration, copy their example files:
   ```bash
   cp packages/database/.env.example packages/database/.env
   cp apps/backend/.env.example apps/backend/.env
   cp apps/widget/.env.local.example apps/widget/.env.local
   ```

4. See [Required Environment Variables](#required-environment-variables) below for details on each variable

---

## Required Environment Variables

### Database

#### `DATABASE_URL`
**Required:** Yes
**Used by:** Backend, Worker, Database package
**Example:** `postgresql://user:password@localhost:5432/cms_platform`

PostgreSQL connection string for the main application database.

**Local development:**
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cms_platform
```

**Note:** Make sure PostgreSQL is running locally or use a cloud database provider

---

### Authentication (Supabase)

#### `NEXT_PUBLIC_SUPABASE_URL`
**Required:** Yes
**Used by:** Backend, Widget
**Example:** `https://your-project.supabase.co`

Your Supabase project URL. This is safe to expose publicly (hence the `NEXT_PUBLIC_` prefix).

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
**Required:** Yes
**Used by:** Backend, Widget
**Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

Supabase anonymous (public) key for client-side authentication. Safe to expose publicly.

#### `SUPABASE_SERVICE_ROLE_KEY`
**Required:** Yes (Backend only)
**Used by:** Backend
**Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

Supabase service role key for server-side operations. **Keep this secret!** Never expose in client-side code.

**Where to find these:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the URL and keys

---

### AI Services

#### `OPENAI_API_KEY`
**Required:** Yes
**Used by:** Backend, Worker
**Example:** `sk-proj-...`

OpenAI API key for GPT-4, DALL-E, and other AI models used in content generation.

**Used for:**
- Article content generation
- Video script generation
- Podcast transcript generation
- Quiz question generation
- Image generation (DALL-E)

**Get your key:** https://platform.openai.com/api-keys

---

#### `ELEVENLABS_API_KEY`
**Required:** Yes
**Used by:** Backend, Worker
**Example:** `abc123...`

ElevenLabs API key for text-to-speech audio generation.

**Used for:**
- Podcast audio generation
- Interactive podcast audio
- Video voiceovers

**Get your key:** https://elevenlabs.io/app/settings/api-keys

---

#### `HEYGEN_API_KEY`
**Required:** Yes
**Used by:** Backend, Worker
**Example:** `hg_...`

HeyGen API key for AI video generation with avatars.

**Used for:**
- Video generation with AI avatars
- Character-based video content

**Get your key:** https://app.heygen.com/settings/api-keys

---

#### `SUBMAGIC_API_KEY`
**Required:** Yes
**Used by:** Backend, Worker
**Example:** `sm_...`

Submagic API key for automatic video editing and captioning.

**Used for:**
- Adding captions to videos
- Video post-processing
- Visual effects

**Get your key:** Contact Submagic support for API access

---

### AWS Services

#### `AWS_ACCESS_KEY_ID`
**Required:** Yes
**Used by:** Backend, Worker
**Example:** `AKIAIOSFODNN7EXAMPLE`

AWS access key ID for S3 storage and Transcribe services.

#### `AWS_SECRET_ACCESS_KEY`
**Required:** Yes
**Used by:** Backend, Worker
**Example:** `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

AWS secret access key (keep secure!).

#### `AWS_REGION`
**Required:** Yes
**Used by:** Backend, Worker
**Default:** `ap-south-1`
**Example:** `us-east-1`, `eu-west-1`, `ap-south-1`

AWS region for your services.

#### `AWS_S3_BUCKET_NAME`
**Required:** Yes
**Used by:** Backend, Worker
**Example:** `my-cms-media-bucket`

S3 bucket name for storing generated media files (videos, audio, images).

**Used for:**
- Video storage
- Audio file storage
- Image storage
- Transcript storage

**Setup:**
1. Create an IAM user with S3 and Transcribe permissions
2. Generate access keys for the user
3. Create an S3 bucket in your preferred region
4. Configure bucket CORS for frontend access

---

### Queue/Cache

#### `REDIS_URL`
**Required:** Yes
**Used by:** Backend, Worker
**Example:** `redis://localhost:6379`

Redis connection URL for BullMQ job queue management.

**Used for:**
- Background job processing
- Video generation queue
- Audio generation queue
- Queue monitoring

**Local development:**
```bash
# Install Redis locally (macOS)
brew install redis
brew services start redis

# Use default local Redis
REDIS_URL=redis://localhost:6379
```

**Cloud options:**
- Upstash Redis
- Redis Cloud
- AWS ElastiCache

---

### Application Configuration

#### `NODE_ENV`
**Required:** No
**Default:** `development`
**Options:** `development`, `production`, `test`

Node.js environment mode.

---

## Environment File Structure

```
cms-n-widget/
├── .env                              # Root environment (all services)
├── .env.example                      # Root template (tracked in git)
├── packages/
│   └── database/
│       ├── .env                      # Database-specific (ignored)
│       └── .env.example             # Database template (tracked)
├── apps/
│   ├── backend/
│   │   ├── .env                     # Backend-specific (ignored)
│   │   └── .env.example            # Backend template (tracked)
│   ├── widget/
│   │   ├── .env.local               # Widget-specific (ignored)
│   │   └── .env.local.example      # Widget template (tracked)
│   └── worker/
│       └── .env                     # Worker uses root .env
```

---

## Setup Checklist

Before running the application, ensure you have:

- [ ] PostgreSQL database running
- [ ] Redis server running
- [ ] Supabase project created and keys configured
- [ ] OpenAI API key obtained
- [ ] ElevenLabs API key obtained
- [ ] HeyGen API key obtained
- [ ] Submagic API key obtained
- [ ] AWS account with S3 bucket created
- [ ] AWS IAM user with appropriate permissions
- [ ] All `.env` files created from `.env.example` templates
- [ ] All environment variables filled in with actual values

---

## Testing Your Configuration

After setting up your environment variables:

1. **Test database connection:**
   ```bash
   cd packages/database
   npx prisma db push
   ```

2. **Test Prisma client generation:**
   ```bash
   cd packages/database
   npx prisma generate
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Run development servers:**
   ```bash
   npm run dev
   ```

---

## Security Best Practices

1. **Never commit actual `.env` files** - Only commit `.env.example` templates
2. **Keep service role keys secret** - Especially Supabase service role key
3. **Rotate keys regularly** - Especially if they're exposed
4. **Use different keys for development and production**
5. **Limit AWS IAM permissions** - Follow principle of least privilege
6. **Enable MFA on AWS accounts**
7. **Monitor API usage** - Set up billing alerts

---

## Troubleshooting

### Database Connection Issues

**Error:** `connection refused` or `ECONNREFUSED`

**Solution:**
- Ensure PostgreSQL is running
- Check connection string format
- Verify database exists
- Check firewall settings

### Redis Connection Issues

**Error:** `ECONNREFUSED localhost:6379`

**Solution:**
- Ensure Redis is running: `redis-cli ping` (should return "PONG")
- Start Redis: `brew services start redis` (macOS)
- Check Redis logs for errors

### Supabase Auth Issues

**Error:** `Invalid API key`

**Solution:**
- Verify you're using the correct project keys
- Check for trailing spaces in environment variables
- Ensure keys are not expired

### AWS S3 Issues

**Error:** `Access Denied` or `InvalidAccessKeyId`

**Solution:**
- Verify IAM user has S3 permissions
- Check access key and secret are correct
- Ensure bucket exists in specified region
- Check bucket CORS configuration

---

## Production Deployment

⏸️ **Production deployment configuration (SST, AWS secrets, etc.) has been deferred.**

For production deployment:
- Environment variables will be managed differently
- Secrets will use secure secret management systems
- Configuration will be handled in Phase 12 (Infrastructure & Deployment)

See `SST_SECRETS.md` and `DEPLOYMENT_CHECKLIST.md` when ready for production deployment.

---

## Additional Resources

- **Supabase Documentation:** https://supabase.com/docs
- **OpenAI API Documentation:** https://platform.openai.com/docs
- **ElevenLabs Documentation:** https://elevenlabs.io/docs
- **AWS S3 Documentation:** https://docs.aws.amazon.com/s3/
- **Redis Documentation:** https://redis.io/docs/
- **BullMQ Documentation:** https://docs.bullmq.io/

---

**Need help?** Check the main README.md or create an issue in the project repository.
