# @repo/logging

Structured logging for the CMS Platform monorepo using Winston.

## Overview

This package provides structured logging to replace all `console.log` statements throughout the codebase with proper, queryable, structured logs.

**Replaces:** 272+ console.log statements across the codebase

## Features

- ✅ **Multiple log levels**: error, warn, info, http, verbose, debug, silly
- ✅ **Structured metadata**: Add contextual data to every log
- ✅ **Correlation IDs**: Track requests across services
- ✅ **Environment-aware formatting**: Pretty colored logs in dev, JSON in production
- ✅ **File transports**: Automatic log file rotation in production
- ✅ **Performance timing**: Built-in timers for measuring operations
- ✅ **Helper functions**: Common logging patterns pre-built
- ✅ **Type-safe**: Full TypeScript support with typed metadata

## Installation

```bash
npm install @repo/logging
```

## Basic Usage

### Replace console.log

```typescript
// OLD (don't use):
console.log('Processing video:', videoId);
console.log('Video created:', video);

// NEW (use this):
import { logger } from '@repo/logging';

logger.info('Processing video', { videoId });
logger.info('Video created', {
  videoId: video.id,
  duration: video.duration,
  status: video.status
});
```

### Log Levels

```typescript
import { logger } from '@repo/logging';

// Error - critical errors that need attention
logger.error('Failed to generate video', {
  error: error.message,
  videoId,
  stack: error.stack
});

// Warn - warning conditions
logger.warn('Video generation taking longer than expected', {
  videoId,
  duration: 120000
});

// Info - informational messages (default level in production)
logger.info('Video generation started', { videoId });

// HTTP - HTTP request logs
logger.http('POST /api/video', {
  method: 'POST',
  url: '/api/video',
  statusCode: 200
});

// Debug - detailed debugging info (default level in development)
logger.debug('HeyGen API response', {
  response: data,
  videoId
});

// Verbose - very detailed logs
logger.verbose('Processing frame', { frameNumber: 42 });

// Silly - extremely detailed trace logs
logger.silly('Pixel data', { x: 100, y: 200, color: '#fff' });
```

## Structured Metadata

Always add structured metadata instead of string concatenation:

```typescript
// BAD - unstructured
logger.info(`Processing video ${videoId} for user ${userId}`);

// GOOD - structured
logger.info('Processing video', { videoId, userId });

// BETTER - with more context
logger.info('Processing video', {
  videoId,
  userId,
  organizationId,
  submissionId,
  duration: 120,
  status: 'processing'
});
```

## Helper Functions

### Request Logging

```typescript
import { logRequestStart, logRequestEnd } from '@repo/logging';

// At request start
logRequestStart('POST', '/api/submissions', { correlationId });

// At request end
const duration = Date.now() - startTime;
logRequestEnd('POST', '/api/submissions', 200, duration, {
  correlationId,
  userId
});
```

### Job Logging (BullMQ)

```typescript
import { logJobStart, logJobComplete, logJobFailure } from '@repo/logging';

// Job start
logJobStart(job.id, job.name, {
  videoId,
  submissionId,
  correlationId
});

// Job complete
const duration = Date.now() - startTime;
logJobComplete(job.id, job.name, duration, { videoId });

// Job failure
logJobFailure(job.id, job.name, error, {
  videoId,
  attempt: job.attemptsMade
});
```

### Media Processing

```typescript
import {
  logMediaProcessingStart,
  logMediaProcessingComplete,
  logMediaProcessingError
} from '@repo/logging';

// Start
logMediaProcessingStart('video', videoId, { submissionId });

// Complete
logMediaProcessingComplete('video', videoId, duration, {
  submissionId,
  url: videoUrl
});

// Error
logMediaProcessingError('video', videoId, error, { submissionId });
```

### External Service Calls

```typescript
import { logServiceCall, logServiceResponse } from '@repo/logging';

// Before calling service
logServiceCall('HeyGen', 'generateVideo', { videoId });

// After service responds
const success = response.status === 200;
logServiceResponse('HeyGen', 'generateVideo', success, duration, {
  videoId,
  heygenVideoId: response.data.id
});
```

### Performance Timing

```typescript
import { startTimer } from '@repo/logging';

// Start a timer
const timer = startTimer('Video generation');

// ... do work ...

// End timer (automatically logs duration)
const duration = timer.end({ videoId });

// Or get duration without logging
const currentDuration = timer.getDuration();
```

## Correlation IDs

Track requests across services with correlation IDs:

```typescript
import { createCorrelatedLogger, generateCorrelationId } from '@repo/logging';

// Generate correlation ID
const correlationId = generateCorrelationId();

// Create logger with correlation ID
const log = createCorrelatedLogger(correlationId);

// All logs from this logger will include the correlation ID
log.info('Processing started', { videoId });
log.info('Calling HeyGen API', { videoId });
log.info('Processing complete', { videoId });

// Output:
// [info] [abc-123-def] Processing started { videoId: 'vid_123' }
// [info] [abc-123-def] Calling HeyGen API { videoId: 'vid_123' }
// [info] [abc-123-def] Processing complete { videoId: 'vid_123' }
```

## Child Loggers

Create child loggers with default metadata:

```typescript
import { logger } from '@repo/logging';

// Create child logger for a specific submission
const submissionLogger = logger.child({
  submissionId: 'sub_123',
  organizationId: 'org_456'
});

// All logs include default metadata
submissionLogger.info('Starting video generation');
// Logs: { submissionId: 'sub_123', organizationId: 'org_456' }

submissionLogger.info('Video generated', { videoId: 'vid_789' });
// Logs: { submissionId: 'sub_123', organizationId: 'org_456', videoId: 'vid_789' }
```

## Environment Configuration

### Log Levels by Environment

```bash
# Development (default: debug)
NODE_ENV=development

# Production (default: info)
NODE_ENV=production

# Custom log level
LOG_LEVEL=verbose
```

### Development Output (Pretty)

```
2024-11-24 21:00:00 [info] [cms-platform] [abc-123]: Video generation started
{
  "videoId": "vid_123",
  "submissionId": "sub_456",
  "duration": 120
}
```

### Production Output (JSON)

```json
{
  "level": "info",
  "message": "Video generation started",
  "service": "cms-platform",
  "correlationId": "abc-123",
  "videoId": "vid_123",
  "submissionId": "sub_456",
  "duration": 120,
  "timestamp": "2024-11-24 21:00:00"
}
```

## Common Patterns

### Worker Job Processing

```typescript
import { logger, logJobStart, logJobComplete, logJobFailure } from '@repo/logging';

worker.on('active', (job) => {
  logJobStart(job.id, job.name, {
    correlationId: job.data.correlationId,
    videoId: job.data.videoId,
  });
});

worker.on('completed', (job) => {
  logJobComplete(job.id, job.name, undefined, {
    videoId: job.data.videoId,
  });
});

worker.on('failed', (job, error) => {
  logJobFailure(job.id, job.name, error, {
    videoId: job.data.videoId,
    attempt: job.attemptsMade,
  });
});
```

### Service Layer

```typescript
import { logger, startTimer } from '@repo/logging';

export class VideoService {
  async generateVideo(submissionId: string) {
    const timer = startTimer('Video generation');
    const log = logger.child({ submissionId });

    try {
      log.info('Starting video generation');

      // Generate script
      log.debug('Generating script');
      const script = await this.generateScript();

      // Call HeyGen
      log.info('Calling HeyGen API', { scriptLength: script.length });
      const video = await this.heygenService.generate(script);

      // Success
      const duration = timer.end({ videoId: video.id });
      log.info('Video generation complete', {
        videoId: video.id,
        durationMs: duration,
      });

      return video;
    } catch (error) {
      log.error('Video generation failed', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}
```

### API Route/Controller

```typescript
import { logger, logRequestStart, logRequestEnd } from '@repo/logging';

export async function POST(req: Request) {
  const startTime = Date.now();
  const correlationId = generateCorrelationId();

  logRequestStart('POST', '/api/submissions', { correlationId });

  try {
    const submission = await createSubmission(req.body);

    const duration = Date.now() - startTime;
    logRequestEnd('POST', '/api/submissions', 200, duration, {
      correlationId,
      submissionId: submission.id,
    });

    return Response.json(submission);
  } catch (error) {
    logger.error('Request failed', {
      correlationId,
      error: error.message,
      stack: error.stack,
    });

    const duration = Date.now() - startTime;
    logRequestEnd('POST', '/api/submissions', 500, duration, {
      correlationId,
    });

    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

## Security

### Sanitizing Sensitive Data

```typescript
import { sanitizeLogData } from '@repo/logging';

const data = {
  email: 'user@example.com',
  password: 'secret123',  // Will be redacted
  apiKey: 'key_abc123',   // Will be redacted
};

const sanitized = sanitizeLogData(data);
logger.info('User data', sanitized);
// Logs: { email: 'user@example.com', password: '[REDACTED]', apiKey: '[REDACTED]' }
```

Automatically redacted fields:
- `password`
- `apiKey`, `api_key`
- `accessToken`, `access_token`
- `refreshToken`, `refresh_token`
- `secret`
- `privateKey`, `private_key`
- `authorization`

## File Logging (Production Only)

In production, logs are automatically written to files:

```
logs/
├── error.log      # Error level only
└── combined.log   # All levels
```

Files automatically rotate when they reach 5MB (keeps last 5 files).

## Custom Logger Instance

Create a custom logger for a specific service:

```typescript
import { createLogger } from '@repo/logging';

const workerLogger = createLogger({
  level: 'debug',
  service: 'worker-service',
  prettyPrint: false, // Force JSON output
});

workerLogger.info('Worker started');
```

## Migration from console.log

Replace all console.log patterns:

```typescript
// Pattern 1: Simple message
console.log('Video created');
// Replace with:
logger.info('Video created');

// Pattern 2: With variable
console.log('Video created:', videoId);
// Replace with:
logger.info('Video created', { videoId });

// Pattern 3: Multiple variables
console.log('Processing video', videoId, 'for user', userId);
// Replace with:
logger.info('Processing video', { videoId, userId });

// Pattern 4: Object logging
console.log('Video data:', video);
// Replace with:
logger.debug('Video data', { video });

// Pattern 5: Error logging
console.error('Failed:', error);
// Replace with:
logger.error('Operation failed', {
  error: error.message,
  stack: error.stack
});
```

## Best Practices

1. **Always use structured metadata** instead of string interpolation
2. **Use appropriate log levels** (don't log everything as info)
3. **Include correlation IDs** for request tracking
4. **Add context** (submissionId, userId, organizationId, etc.)
5. **Use child loggers** when processing entities with consistent metadata
6. **Use timers** for performance-sensitive operations
7. **Log errors with stack traces** for debugging
8. **Sanitize sensitive data** before logging
9. **Don't log passwords, API keys, or tokens**
10. **Use debug/verbose** for detailed traces, not info

## TypeScript Support

All functions are fully typed:

```typescript
import { logger, LogMeta } from '@repo/logging';

const meta: LogMeta = {
  correlationId: 'abc-123',
  videoId: 'vid_456',
  submissionId: 'sub_789',
  userId: 'user_012',
  duration: 1200,
  error: new Error('Something failed'),
};

logger.info('Operation complete', meta);
```

## Querying Logs

In production, JSON logs can be easily queried:

```bash
# Find all errors for a specific video
cat logs/error.log | jq 'select(.videoId == "vid_123")'

# Find slow operations (>5 seconds)
cat logs/combined.log | jq 'select(.durationMs > 5000)'

# Find all logs for a correlation ID
cat logs/combined.log | jq 'select(.correlationId == "abc-123")'

# Count errors by service
cat logs/error.log | jq -r '.service' | sort | uniq -c
```

## Performance

The logging package has minimal performance impact:
- Logs are written asynchronously
- JSON serialization is optimized
- File rotation is handled by Winston
- Log level filtering happens before serialization

## Summary

This package replaces **272+ console.log statements** with:
- Structured, queryable logs
- Correlation ID tracking
- Proper log levels
- Environment-aware formatting
- Performance timing
- Type safety
- Security (sensitive data redaction)

Always use `logger` instead of `console.log` for production code!
