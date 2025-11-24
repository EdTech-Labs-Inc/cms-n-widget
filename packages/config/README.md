# @repo/config

Centralized configuration for the CMS Platform monorepo.

## Overview

This package provides all configuration values, constants, character limits, voice IDs, templates, and other settings used across the platform.

**IMPORTANT:** This package contains ONLY configuration values. AI prompts are NOT stored here - they should be managed separately in a prompt management system or environment variables.

## Structure

- **`characters.ts`** - HeyGen character configurations (avatars, talking photos)
- **`voices.ts`** - ElevenLabs voice IDs for different use cases
- **`templates.ts`** - Submagic video editing templates
- **`limits.ts`** - Character limits and constraints for all media types
- **`constants.ts`** - Application constants and environment configuration

## Usage

### Import Everything

```typescript
import {
  HEYGEN_CHARACTERS,
  DEFAULT_VOICE_ID,
  VIDEO_SCRIPT_LIMITS,
  OPENAI_CONFIG
} from '@repo/config';
```

### Import Specific Domain

```typescript
import { getCharacterById, HEYGEN_CHARACTERS } from '@repo/config/characters';
import { getDefaultVoice, PODCAST_VOICES } from '@repo/config/voices';
import { SUBMAGIC_TEMPLATES, getDefaultTemplate } from '@repo/config/templates';
import { VIDEO_SCRIPT_LIMITS, isValidVideoScriptLength } from '@repo/config/limits';
import { OPENAI_CONFIG, validateConfig } from '@repo/config/constants';
```

## Key Features

### Character Limits

All character limits are defined in `limits.ts`:

```typescript
import { VIDEO_SCRIPT_LIMITS, VIDEO_BUBBLE_LIMITS } from '@repo/config';

// Video scripts must be under 1400 characters (HeyGen limit)
const isValid = VIDEO_SCRIPT_LIMITS.MAX_SCRIPT_LENGTH; // 1400

// Bubble questions must be under 40 characters
const maxQuestion = VIDEO_BUBBLE_LIMITS.MAX_QUESTION_LENGTH; // 40

// Bubble options must be under 10 characters
const maxOption = VIDEO_BUBBLE_LIMITS.MAX_OPTION_LENGTH; // 10
```

### HeyGen Characters

Manage video generation characters:

```typescript
import { getCharacterById, getDefaultCharacter } from '@repo/config';

const kumar = getCharacterById('male-presenter');
// Returns: { id, name, type, characterId, voiceId, photoUrl, description }

const defaultChar = getDefaultCharacter();
// Returns first character in the list
```

### ElevenLabs Voices

Manage text-to-speech voices:

```typescript
import { getInterviewerVoice, getGuestVoice, DEFAULT_VOICE_ID } from '@repo/config';

const interviewer = getInterviewerVoice();
// Returns: { id: 'interviewer', voiceId: '...', name: 'Herin', ... }

const guest = getGuestVoice();
// Returns: { id: 'guest', voiceId: '...', name: 'Isha', ... }
```

### Submagic Templates

Video editing templates:

```typescript
import { getDefaultTemplate, getTemplateByName } from '@repo/config';

const defaultTemplate = getDefaultTemplate();
// Returns: { id: 'ella', name: 'Ella', ... }

const hormozi = getTemplateByName('Hormozi 1');
// Returns template with advanced effects
```

### Environment Configuration

Access environment-based configuration:

```typescript
import { OPENAI_CONFIG, HEYGEN_CONFIG, validateConfig } from '@repo/config';

// OpenAI settings
console.log(OPENAI_CONFIG.defaultModel); // 'gpt-4o-2024-08-06'
console.log(OPENAI_CONFIG.temperature); // 0.7

// HeyGen settings
console.log(HEYGEN_CONFIG.apiUrl); // 'https://api.heygen.com/v2'

// Validate required env vars in production
validateConfig();
```

## Character Limits Reference

### Video Scripts
- **Max:** 1400 characters (HeyGen limit with buffer)
- **Min:** 100 characters
- **Optimal:** 800 characters

### Video Bubbles (Quiz Questions)
- **Question:** Max 40 characters
- **Options:** Max 10 characters each
- **Per Video:** 3-15 bubbles (optimal: 5)

### Quiz Questions
- **Total Questions:** 5-15 (optimal: 10)
- **MCQ Options:** 2-6 options

### Podcast
- **Exchanges:** 8-12 (optimal: 10)
- **Sentences per exchange:** 2-4

### Interactive Podcast
- **Word Count:** 750-900 words (optimal: 800)
- **Interactive Words:** 8-10 fill-in-the-blank questions

## Language Support

The package supports multiple languages with adjustments:

```typescript
import { LANGUAGE_CODES, getAdjustedLimit } from '@repo/config';

// Get language-specific code
const marathiCode = LANGUAGE_CODES.MARATHI.awsTranscribe; // 'mr-IN'

// Get adjusted character limit for language
const adjustedLimit = getAdjustedLimit(1400, 'MARATHI'); // 1680 (20% increase)
```

## Validation Helpers

```typescript
import {
  isValidVideoScriptLength,
  isValidBubbleQuestionLength,
  isValidBubbleOptionLength,
  isValidBubbleCount
} from '@repo/config';

// Validate script length
isValidVideoScriptLength(1200); // true
isValidVideoScriptLength(1500); // false

// Validate bubble question
isValidBubbleQuestionLength(35); // true
isValidBubbleQuestionLength(45); // false

// Validate bubble option
isValidBubbleOptionLength(8); // true
isValidBubbleOptionLength(12); // false

// Validate bubble count
isValidBubbleCount(5); // true
isValidBubbleCount(20); // false
```

## Environment Variables

Required environment variables (see `.env.example`):

```bash
# OpenAI
OPENAI_API_KEY=

# ElevenLabs
ELEVENLABS_API_KEY=
ELEVENLABS_DEFAULT_VOICE_ID=
ELEVENLABS_INTERVIEWER_VOICE_ID=
ELEVENLABS_GUEST_VOICE_ID=

# HeyGen
HEYGEN_API_KEY=
HEYGEN_WEBHOOK_SECRET=
HEYGEN_DEFAULT_CHARACTER_TYPE=avatar
HEYGEN_DEFAULT_AVATAR_ID=
HEYGEN_DEFAULT_VOICE_ID=

# Submagic
SUBMAGIC_API_KEY=
SUBMAGIC_API_URL=
SUBMAGIC_WEBHOOK_URL=

# AWS/Storage
S3_BUCKET=
S3_REGION=ap-south-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Database
DATABASE_URL=

# Redis
REDIS_URL=
```

## Migration Notes

This package consolidates configuration from:
- `_old-code/apps/backend/lib/config/heygen-characters.ts`
- `_old-code/apps/backend/lib/config/constants.ts`
- Hardcoded limits scattered throughout service files

### Key Improvements

1. **Centralized Limits** - All character limits in one place (previously scattered)
2. **Type-Safe** - All configurations are typed with TypeScript
3. **Helper Functions** - Validation and getter functions provided
4. **Language Support** - Built-in language adjustments
5. **No Prompts** - AI prompts removed (should be managed separately)

## What's NOT Included

This package does NOT contain:
- ❌ AI prompt templates (should be in prompt management system)
- ❌ Database schemas (in `@repo/database`)
- ❌ Type definitions (in `@repo/types`)
- ❌ Business logic (in services)

## Best Practices

1. **Always use constants** - Don't hardcode limits in services
2. **Validate inputs** - Use validation helpers before processing
3. **Language awareness** - Use `getAdjustedLimit` for non-English content
4. **Environment safety** - Call `validateConfig()` on app startup
5. **Import specifically** - Import from submodules for better tree-shaking

## Example: Video Generation Service

```typescript
import {
  HEYGEN_CHARACTERS,
  VIDEO_SCRIPT_LIMITS,
  isValidVideoScriptLength,
  getCharacterById
} from '@repo/config';

export class VideoService {
  generateScript(articleContent: string) {
    const script = this.summarize(articleContent);

    // Validate script length
    if (!isValidVideoScriptLength(script.length)) {
      throw new Error(
        `Script must be ${VIDEO_SCRIPT_LIMITS.MIN_SCRIPT_LENGTH}-${VIDEO_SCRIPT_LIMITS.MAX_SCRIPT_LENGTH} characters`
      );
    }

    // Get character for video
    const character = getCharacterById('male-presenter');

    // Generate video with HeyGen
    return this.heygenService.generate({
      script,
      characterId: character.characterId,
      voiceId: character.voiceId,
    });
  }
}
```

## Contributing

When adding new configuration:

1. Determine the correct file (characters, voices, templates, limits, or constants)
2. Add TypeScript types for the configuration
3. Add validation/helper functions if applicable
4. Update this README with usage examples
5. **Never add AI prompts** to this package
