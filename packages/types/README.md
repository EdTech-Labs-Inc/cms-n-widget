# @repo/types

Consolidated TypeScript type definitions for the CMS Platform monorepo.

## Structure

This package provides domain-based type organization:

- **`media.types.ts`** - Article, Submission, and all Output types (Audio, Podcast, Video, Quiz, Interactive Podcast)
- **`organization.types.ts`** - Organization, Profile, Member types
- **`player.types.ts`** - Player-specific interfaces for video, quiz, and podcast players
- **`api.types.ts`** - API request/response types
- **`common.types.ts`** - Shared utility types

## Key Updates for Normalized Schema

### VideoBubble (Normalized)

Previously, video bubbles were stored as JSON in `VideoOutput.bubbles`. Now they are a proper relation:

```typescript
// OLD (don't use):
interface VideoOutput {
  bubbles: any; // JSON array
}

// NEW (use this):
interface VideoOutput {
  bubbles?: VideoBubble[]; // Relation to VideoBubble table
}

interface VideoBubble {
  id: string;
  videoOutputId: string;
  appearsAt: number;
  order: number | null;
  question: string;
  options: any;
  correctAnswer: any;
  explanation: string | null;
  // ... timestamps
}
```

### QuizQuestion (Normalized)

Previously, quiz questions were stored as JSON in `QuizOutput.questions`. Now they are a proper relation:

```typescript
// OLD (don't use):
interface QuizOutput {
  questions: any; // JSON array
}

// NEW (use this):
interface QuizOutput {
  questions?: QuizQuestion[]; // Relation to QuizQuestion table
}

interface QuizQuestion {
  id: string;
  quizOutputId: string;
  order: number;
  type: QuestionType;
  prompt: string;
  stem?: string | null;
  options: any;
  correctAnswer: any;
  explanation?: string | null;
  // ... timestamps
}
```

## Usage

### Import Everything

```typescript
import { VideoOutput, VideoBubble, QuizQuestion, Article } from '@repo/types';
```

### Import Specific Domain

```typescript
import { VideoOutput, VideoBubble } from '@repo/types/media';
import { Organization, Profile } from '@repo/types/organization';
import { BubblePlayerData } from '@repo/types/player';
import { ApiResponse, CreateArticleRequest } from '@repo/types/api';
import { Nullable, Result } from '@repo/types/common';
```

## Type Guards

Common type guards are provided in `common.types.ts`:

```typescript
import { isDefined, isString, isArray } from '@repo/types';

if (isDefined(value)) {
  // value is not null or undefined
}

if (isString(value)) {
  // value is string
}
```

## Benefits

1. **Single Source of Truth** - All types defined once, used everywhere
2. **Domain Organization** - Easy to find types by domain
3. **Better Tree-Shaking** - Import only what you need
4. **Type Safety** - Catch schema changes at compile time
5. **No Duplicates** - Consolidated from 10+ type files across old-code

## Migration from Old Code

This package consolidates types from:

- `_old-code/apps/backend/types/*.ts`
- `_old-code/apps/backend/frontend-lib/types.ts`
- `_old-code/apps/backend/frontend-lib/api/types.ts`
- `_old-code/apps/widget/types/*.ts`
- `_old-code/packages/video-player/src/types.ts`
- `_old-code/packages/quiz-player/src/types.ts`
- `_old-code/packages/interactive-podcast-player/src/types.ts`

All duplicates have been removed, and types have been updated to reflect the normalized database schema.
