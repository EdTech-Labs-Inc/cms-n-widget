# CMS Platform Migration Plan
## From `/old-code` to New Turbo Monorepo Structure

**Last Updated:** 2025-11-24
**Total Phases:** 14
**Git Commits:** One per phase

---

## Table of Contents
1. [Overview](#overview)
2. [Pre-Migration Setup](#pre-migration-setup)
3. [Phase-by-Phase Plan](#phase-by-phase-plan)
4. [Critical Flags & Reminders](#critical-flags--reminders)
5. [Schema Normalization Updates](#schema-normalization-updates)
6. [Types Package Structure](#types-package-structure)

---

## Overview

This migration plan moves code from `/old-code` (existing CMS platform) to a new Turbo monorepo structure with the following improvements:

### Key Improvements
- **Normalized Database Schema:** VideoBubble and QuizQuestion tables (no more large JSON columns)
- **Externalized AI Prompts:** 15+ hardcoded prompts moved to configuration
- **Structured Logging:** Replacing 272+ console.log statements
- **Refactored Large Services:** Breaking down 500+ line service files
- **Consolidated Types:** Removing duplicate type definitions across 10+ files
- **Simplified BubbleOverlay:** Widget component replaced with simple text render
- **Removed Demo Code:** Excluding 1000+ lines of demo/test code

### Critical Rules
- ⚠️ **NO hardcoded AI prompts** in migrated code
- ⚠️ **NO console.log** in production services
- ⚠️ **NO demo code** from `/apps/backend/app/demo/`
- ⚠️ **BubbleOverlay** must render only "Bubble Overlay" text
- ✅ **Git commit** after EACH phase

---

## Pre-Migration Setup

### Step 1: Prepare Directory
```bash
cd /Users/matthewfoster/src/cms-n-widget

# Temporarily rename .gitignore
mv .gitignore .gitignore.backup

# Run create-turbo
npx create-turbo@latest .

# Merge gitignore files
cat .gitignore.backup >> .gitignore
rm .gitignore.backup
```

### Step 2: Initialize Git
```bash
git init
git add .
git commit -m "Initial Turbo monorepo setup"
```

---

## Phase-by-Phase Plan

### PHASE 1: Foundation & Shared Packages
**Goal:** Set up base structure and create consolidated shared packages

#### Tasks:

1. **Root Configuration Files**
   ```bash
   # Copy from old-code
   cp old-code/turbo.json .
   cp old-code/tsconfig.json .
   cp old-code/.prettierrc .
   cp old-code/.dockerignore .
   ```

2. **Create `packages/database`**
   - ✅ Already created with normalized schema
   - Contains `VideoBubble` table (replaces VideoOutput.bubbles JSON)
   - Contains `QuizQuestion` table (replaces QuizOutput.questions JSON)
   - **Schema Improvements:**
     - Added index on `VideoBubble(videoOutputId, appearsAt)`
     - Added index on `QuizQuestion(quizOutputId, order)`
     - Proper relations with cascade deletes

3. **Create `packages/types`** (NEW - consolidate duplicates)

   **Directory Structure:**
   ```
   packages/types/
   ├── src/
   │   ├── index.ts              # Re-exports everything
   │   ├── media.types.ts        # Article, Submission, outputs
   │   ├── organization.types.ts # Org, Profile, Members
   │   ├── player.types.ts       # Bubble, Quiz, Podcast player types
   │   ├── api.types.ts          # API request/response types
   │   └── common.types.ts       # Shared utility types
   ├── package.json
   └── tsconfig.json
   ```

   **Source Files to Consolidate:**
   - `/old-code/apps/backend/types/*.ts`
   - `/old-code/apps/backend/lib/types/`
   - `/old-code/apps/backend/frontend-lib/types.ts`
   - `/old-code/apps/backend/frontend-lib/api/types.ts`
   - `/old-code/apps/widget/types/`
   - `/old-code/packages/video-player/src/types.ts`
   - `/old-code/packages/interactive-podcast-player/src/types.ts`
   - `/old-code/packages/quiz-player/src/types.ts`

   **Process:**
   - Group types by domain (media, org, player, API, common)
   - Remove duplicates (keep most complete version)
   - **🔴 CRITICAL UPDATE:** Update `Bubble` types to reference `VideoBubble` model
   - **🔴 CRITICAL UPDATE:** Update `Quiz` types to reference `QuizQuestion` model
   - Export all from `index.ts` for convenience

4. **Create `packages/config`** (NEW - externalize hardcoded values)

   **Structure:**
   ```
   packages/config/
   ├── src/
   │   ├── index.ts
   │   ├── characters.ts        # HeyGen character IDs
   │   ├── voices.ts            # ElevenLabs voice IDs
   │   ├── templates.ts         # Submagic templates
   │   ├── limits.ts            # Character limits (1400, 40, 10)
   │   └── constants.ts         # Other constants
   ├── package.json
   └── tsconfig.json
   ```

   **Extract from:**
   - `/old-code/apps/backend/lib/config/heygen-characters.ts`
   - Hardcoded limits throughout services
   - **⚠️ DO NOT COPY:** Actual AI prompt strings yet

5. **Create `packages/logging`** (NEW - structured logging)

   **Setup:**
   ```bash
   cd packages/logging
   npm install winston
   ```

   **Structure:**
   ```
   packages/logging/
   ├── src/
   │   ├── index.ts
   │   ├── logger.ts            # Winston configuration
   │   └── types.ts             # Log level types
   ├── package.json
   └── tsconfig.json
   ```

   **Purpose:** Replace all console.log statements across codebase

**🔴 Audit Points:**
- Database schema has proper indexes
- No duplicate type definitions
- Config package has NO prompt strings
- Logging package is ready for use

**Git Commit:**
```bash
git add .
git commit -m "Phase 1: Foundation - shared packages and configuration"
```

---

### PHASE 2: Database Schema Migration & Review
**Goal:** Set up database with normalized, audited schema

#### Tasks:

1. **Review Schema Improvements**
   - ✅ VideoBubble table created (lines 303-321)
   - ✅ QuizQuestion table created (lines 358-377)
   - ✅ Indexes added on foreign keys and query patterns
   - ✅ Proper cascade deletes configured

2. **Additional Schema Improvements to Consider**

   **Missing Indexes (Add if not present):**
   ```prisma
   // In VideoOutput model
   @@index([heygenVideoId])
   @@index([submagicProjectId])

   // In Submission model
   @@index([articleId, language])
   ```

3. **Generate Prisma Client**
   ```bash
   cd packages/database
   npm install
   npx prisma generate
   ```

4. **Create Migration Scripts** (for production data migration)

   Create `packages/database/migrations/normalize-json-columns.ts`:
   ```typescript
   // Script to migrate existing VideoOutput.bubbles JSON → VideoBubble rows
   // Script to migrate existing QuizOutput.questions JSON → QuizQuestion rows
   ```

   **⚠️ Important:** If you have existing production data in old-code, you'll need to run these migration scripts to move JSON data to new tables.

**🔴 Flagged Issues (Resolved):**
- ✅ JSON columns for bubbles/questions normalized
- ⚠️ Soft delete functionality still not implemented (future enhancement)
- ⚠️ Inconsistent `userId` vs `profileId` naming (Article uses userId, others use profileId)

**Decision Point:** Do you want to:
- [ ] Standardize to `profileId` everywhere? (requires changing Article model)
- [ ] Keep as-is for now?

**Git Commit:**
```bash
git add .
git commit -m "Phase 2: Database schema with normalized VideoBubble and QuizQuestion tables"
```

---

### PHASE 3: Core Service Infrastructure (Refactored)
**Goal:** Migrate service layer WITHOUT hardcoded prompts

#### Tasks:

1. **External Services** (4 services - COPY AS-IS)

   Copy from `/old-code/apps/backend/lib/services/external/`:
   ```bash
   mkdir -p apps/backend/lib/services/external

   # These have NO prompts - safe to copy
   cp old-code/apps/backend/lib/services/external/heygen.service.ts apps/backend/lib/services/external/
   cp old-code/apps/backend/lib/services/external/submagic.service.ts apps/backend/lib/services/external/
   cp old-code/apps/backend/lib/services/external/elevenlabs.service.ts apps/backend/lib/services/external/
   cp old-code/apps/backend/lib/services/external/aws-transcribe.service.ts apps/backend/lib/services/external/
   ```

2. **OpenAI Service** (REQUIRES SPLITTING)

   **🔴 CRITICAL:** `openai.service.ts` (538 lines) MUST be split into 2 files:

   **File 1: `openai-client.service.ts`** (Generic OpenAI wrapper)
   - Keep: `generateCompletion()`, `generateImage()`, basic API calls
   - Remove: All regeneration methods (lines 217-386)
   - Remove: All embedded prompts (5+ locations)

   **File 2: `content-regeneration.service.ts`** (Domain-specific)
   - Move: `regenerateVideoScript()`, `regeneratePodcastTranscript()`, etc.
   - **⚠️ Replace prompts with:** References to `@repo/config` or `@repo/prompts`
   - Use OpenAI client service for API calls

   **Prompts to Remove:**
   - Lines 187-201: Article cleaning prompt
   - Lines 237-256: Video script regeneration
   - Lines 298-319: Podcast transcript regeneration
   - Lines 356-378: Interactive podcast script regeneration
   - Lines 420-421: Image generation prompt

3. **Core Services** (4 services - COPY AS-IS)

   ```bash
   mkdir -p apps/backend/lib/services/core

   cp old-code/apps/backend/lib/services/core/storage.service.ts apps/backend/lib/services/core/
   cp old-code/apps/backend/lib/services/core/queue.service.ts apps/backend/lib/services/core/
   cp old-code/apps/backend/lib/services/core/timeout-monitor.service.ts apps/backend/lib/services/core/
   cp old-code/apps/backend/lib/services/core/file-extraction.service.ts apps/backend/lib/services/core/
   ```

4. **Replace console.log with Structured Logging**

   In ALL copied services:
   ```typescript
   // Replace this:
   console.log('Processing video:', videoId);

   // With this:
   import { logger } from '@repo/logging';
   logger.info('Processing video', { videoId });
   ```

**🔴 Audit Checklist:**
- [ ] OpenAI service split into 2 files
- [ ] All 5+ prompts removed from OpenAI service
- [ ] All console.log replaced with logger
- [ ] All services import from `@repo/logging`

**Git Commit:**
```bash
git add .
git commit -m "Phase 3: Core infrastructure services (refactored, prompts removed)"
```

---

### PHASE 4: Media Services (Refactored - NO PROMPTS)
**Goal:** Migrate media generation services with prompts externalized and schema updates

#### 🔴 CRITICAL: Schema Updates Required

**All video and quiz services MUST be updated to:**
- Query `VideoBubble` table instead of `VideoOutput.bubbles` JSON
- Query `QuizQuestion` table instead of `QuizOutput.questions` JSON
- Use proper Prisma relations and includes

#### Tasks:

1. **Audio Service** (145 lines - REFACTOR)

   **Copy:** `/old-code/apps/backend/lib/services/media/audio.service.ts`

   **Changes Required:**
   - **⚠️ REMOVE PROMPT:** Lines 113-134 (speakable script conversion)
   - **Replace with:** `import { prompts } from '@repo/config'`
   - **Replace:** 13 console.log → structured logging
   - Use `@repo/database` for Prisma client

2. **Quiz Service** (116 lines - REFACTOR + SCHEMA UPDATE)

   **Copy:** `/old-code/apps/backend/lib/services/media/quiz.service.ts`

   **Changes Required:**
   - **⚠️ REMOVE PROMPT:** Lines 55-75 (quiz generation)
   - **Replace with:** Config reference
   - **🔴 CRITICAL SCHEMA UPDATE:**
     ```typescript
     // OLD CODE (don't copy):
     await prisma.quizOutput.create({
       data: {
         submissionId,
         questions: questionArray, // JSON column
       }
     });

     // NEW CODE (use this):
     const quizOutput = await prisma.quizOutput.create({
       data: { submissionId }
     });

     // Create QuizQuestion rows
     await prisma.quizQuestion.createMany({
       data: questionArray.map((q, index) => ({
         quizOutputId: quizOutput.id,
         order: index,
         type: q.type,
         prompt: q.prompt,
         stem: q.stem,
         options: q.options,
         correctAnswer: q.correctAnswer,
         explanation: q.explanation,
       }))
     });
     ```

3. **Podcast Service** (444 lines - REFACTOR)

   **Copy:** `/old-code/apps/backend/lib/services/media/podcast.service.ts`

   **Changes Required:**
   - **⚠️ REMOVE PROMPTS:**
     - Lines 137-150: Title generation
     - Lines 174-206: Transcript generation (Herin/Isha characters)
   - **Replace:** 13 console.log → structured logging
   - Use config for character names and prompt templates

4. **Video Service** (625 lines - MAJOR REFACTOR + SCHEMA UPDATE)

   **🔴 SPLIT INTO 3 FILES:**

   **File 1: `video-generator.service.ts`**
   - Core video generation logic
   - HeyGen API integration
   - AWS Transcribe integration

   **File 2: `bubble-generator.service.ts`**
   - Bubble creation and validation
   - **🔴 CRITICAL SCHEMA UPDATE:**
     ```typescript
     // OLD CODE (don't copy):
     await prisma.videoOutput.update({
       where: { id },
       data: {
         bubbles: bubblesArray, // JSON column
       }
     });

     // NEW CODE (use this):
     // Delete existing bubbles if regenerating
     await prisma.videoBubble.deleteMany({
       where: { videoOutputId: id }
     });

     // Create new VideoBubble rows
     await prisma.videoBubble.createMany({
       data: bubblesArray.map((bubble, index) => ({
         videoOutputId: id,
         appearsAt: bubble.timestamp,
         order: index,
         question: bubble.question,
         options: bubble.options,
         correctAnswer: bubble.correctAnswer,
         explanation: bubble.explanation,
       }))
     });

     // When querying video with bubbles:
     const video = await prisma.videoOutput.findUnique({
       where: { id },
       include: {
         bubbles: {
           orderBy: { appearsAt: 'asc' }
         }
       }
     });
     ```

   **File 3: `video-webhook.service.ts`**
   - HeyGen webhook handler
   - Submagic webhook handler

   **Prompts to Remove:**
   - Lines 148-171: Video script generation
   - Lines 407-428: Single bubble regeneration
   - Lines 479-506: Bubble questions generation

   **Complex Logic to Extract:**
   - Lines 367-457: Bubble validation → Move to bubble-generator service

5. **Interactive Podcast Service** (688 lines - CRITICAL REFACTOR)

   **🔴 SPLIT INTO 4 FILES:**

   **File 1: `interactive-podcast-generator.service.ts`**
   - Main orchestration logic
   - Uses other services

   **File 2: `segment-parser.service.ts`**
   - Extract lines 312-406 (complex segment parsing)
   - Clean up nested conditionals

   **File 3: `transcription.service.ts`**
   - AWS Transcribe integration
   - Word timing extraction

   **File 4: `word-matching.service.ts`**
   - Extract lines 474-567 (word matching logic)
   - Educational word selection

   **Prompts to Remove:**
   - Lines 179-193: Title generation
   - Lines 221-256: Audio script generation (750-900 words)
   - Lines 425-456: AI-based word selection

   **Console Logs:** 31 statements to replace

6. **Thumbnail Service** (COPY AS-IS)

   ```bash
   cp old-code/apps/backend/lib/services/media/thumbnail.service.ts apps/backend/lib/services/media/
   ```

#### 🔴 Critical Schema Update Checklist:

- [ ] Quiz service creates `QuizQuestion` rows (not JSON)
- [ ] Video service creates `VideoBubble` rows (not JSON)
- [ ] Bubble regeneration updates `VideoBubble` table
- [ ] Quiz queries include `questions` relation
- [ ] Video queries include `bubbles` relation ordered by `appearsAt`
- [ ] All bubble validation updated for new schema
- [ ] All quiz question access updated for new schema

#### Files Created This Phase:
```
apps/backend/lib/services/
├── media/
│   ├── audio.service.ts              (refactored)
│   ├── quiz.service.ts               (refactored + schema updates)
│   ├── podcast.service.ts            (refactored)
│   ├── video-generator.service.ts    (split from video.service.ts)
│   ├── bubble-generator.service.ts   (split + schema updates)
│   ├── video-webhook.service.ts      (split from video.service.ts)
│   ├── interactive-podcast-generator.service.ts  (split)
│   ├── segment-parser.service.ts     (split)
│   ├── transcription.service.ts      (split)
│   ├── word-matching.service.ts      (split)
│   └── thumbnail.service.ts          (as-is)
└── external/
    └── content-regeneration.service.ts (from openai.service.ts)
```

**Git Commit:**
```bash
git add .
git commit -m "Phase 4: Media services (refactored, prompts removed, schema updated for VideoBubble/QuizQuestion)"
```

---

### PHASE 5: Backend App Structure
**Goal:** Migrate backend app folders (non-service code)

#### Tasks:

1. **Configuration Files**
   ```bash
   mkdir -p apps/backend/lib/config

   cp old-code/apps/backend/lib/config/database.ts apps/backend/lib/config/
   cp old-code/apps/backend/lib/config/queue.ts apps/backend/lib/config/
   cp old-code/apps/backend/lib/config/constants.ts apps/backend/lib/config/
   ```

   **⚠️ Heygen Characters:** Review old-code version (8 TODOs), copy selectively

2. **Controllers**
   ```bash
   mkdir -p apps/backend/lib/controllers
   cp -r old-code/apps/backend/lib/controllers/* apps/backend/lib/controllers/
   ```

   **🔴 UPDATE:** Any controllers that query VideoOutput or QuizOutput must include new relations:
   ```typescript
   // Add to video queries:
   include: {
     bubbles: {
       orderBy: { appearsAt: 'asc' }
     }
   }

   // Add to quiz queries:
   include: {
     questions: {
       orderBy: { order: 'asc' }
     }
   }
   ```

3. **React Contexts**
   ```bash
   mkdir -p apps/backend/lib/context
   cp -r old-code/apps/backend/lib/context/* apps/backend/lib/context/
   ```

4. **Supabase Integration**
   ```bash
   mkdir -p apps/backend/lib/supabase
   cp -r old-code/apps/backend/lib/supabase/* apps/backend/lib/supabase/
   ```

5. **Components**
   ```bash
   mkdir -p apps/backend/components
   cp -r old-code/apps/backend/components/* apps/backend/components/
   ```

   **🔴 FLAG:** `ArticleForm.tsx` (750 lines) - Consider splitting later

   **🔴 UPDATE:** Any components rendering videos or quizzes must handle new structure:
   ```typescript
   // Video component update:
   {video.bubbles.map(bubble => (
     <BubbleComponent
       key={bubble.id}
       appearsAt={bubble.appearsAt}
       question={bubble.question}
       // ... other props
     />
   ))}
   ```

6. **Frontend Library**

   **API Client:**
   ```bash
   mkdir -p apps/backend/frontend-lib/api
   cp old-code/apps/backend/frontend-lib/api/client.ts apps/backend/frontend-lib/api/
   ```
   - **Replace:** 7 console.log statements

   **API Hooks** (REQUIRES SPLITTING):

   **🔴 CRITICAL:** `hooks.ts` (987 lines) is TOO LARGE

   **Split into:**
   ```
   frontend-lib/api/hooks/
   ├── index.ts              # Re-exports all hooks
   ├── article-hooks.ts      # useArticles, useArticle, etc.
   ├── submission-hooks.ts   # useSubmissions, useCreateSubmission
   ├── video-hooks.ts        # useVideos, useVideoOutput
   ├── quiz-hooks.ts         # useQuizzes, useQuizOutput
   ├── podcast-hooks.ts      # usePodcasts, usePodcastOutput
   ├── organization-hooks.ts # useOrganization, useMembers
   └── auth-hooks.ts         # useProfile, useAuth
   ```

   **🔴 SCHEMA UPDATES:** Video and quiz hooks must request new relations:
   ```typescript
   // In video-hooks.ts:
   export const useVideoOutput = (id: string) => {
     return trpc.video.getById.useQuery({
       id,
       include: { bubbles: true } // Include VideoBubble rows
     });
   };

   // In quiz-hooks.ts:
   export const useQuizOutput = (id: string) => {
     return trpc.quiz.getById.useQuery({
       id,
       include: { questions: true } // Include QuizQuestion rows
     });
   };
   ```

   **Providers:**
   ```bash
   mkdir -p apps/backend/frontend-lib/providers
   cp -r old-code/apps/backend/frontend-lib/providers/* apps/backend/frontend-lib/providers/
   ```

   **Utils:**
   ```bash
   cp old-code/apps/backend/frontend-lib/utils.ts apps/backend/frontend-lib/
   ```

7. **Consider Moving to Shared Package** (Optional)

   The `frontend-lib` could become `@repo/api-client` for reuse in widget:
   ```
   packages/api-client/
   ├── src/
   │   ├── client.ts
   │   ├── hooks/  (all hook files)
   │   └── types.ts
   └── package.json
   ```

**🔴 Schema Update Checklist:**
- [ ] All controllers include video bubbles when querying VideoOutput
- [ ] All controllers include quiz questions when querying QuizOutput
- [ ] All hooks request proper relations
- [ ] All components handle new structure (bubbles as array of objects, not JSON)
- [ ] Types updated to reflect VideoBubble[] and QuizQuestion[] relations

**Git Commit:**
```bash
git add .
git commit -m "Phase 5: Backend app structure with schema updates for normalized tables"
```

---

### PHASE 6: Backend Routes & API
**Goal:** Migrate Next.js app router and API routes

#### Tasks:

1. **API Routes**
   ```bash
   mkdir -p apps/backend/app/api
   cp -r old-code/apps/backend/app/api/* apps/backend/app/api/
   ```

   **🔴 SCHEMA UPDATES:** Review these API routes for VideoOutput/QuizOutput queries:
   - `app/api/video/*` - Add bubble includes
   - `app/api/quiz/*` - Add question includes
   - `app/api/submissions/*` - Include relations when returning outputs

   **Example updates:**
   ```typescript
   // In video API routes:
   const video = await prisma.videoOutput.findUnique({
     where: { id },
     include: {
       bubbles: {
         orderBy: { appearsAt: 'asc' }
       },
       tags: true,
       submission: true
     }
   });

   // In quiz API routes:
   const quiz = await prisma.quizOutput.findUnique({
     where: { id },
     include: {
       questions: {
         orderBy: { order: 'asc' }
       },
       tags: true,
       submission: true
     }
   });
   ```

2. **Feature Routes**
   ```bash
   mkdir -p apps/backend/app

   # Copy feature directories
   for dir in admin articles auth create library org; do
     cp -r old-code/apps/backend/app/$dir apps/backend/app/
   done
   ```

   **❌ EXCLUDE:** `demo/` folder (1008 lines of demo code)

   ```bash
   # Verify demo folder is NOT copied:
   ls apps/backend/app/demo  # Should not exist
   ```

3. **Scripts**
   ```bash
   mkdir -p apps/backend/scripts
   cp old-code/apps/backend/scripts/make-admin.ts apps/backend/scripts/
   cp old-code/apps/backend/scripts/backfill-organizations.ts apps/backend/scripts/
   cp old-code/apps/backend/scripts/verify-organizations.ts apps/backend/scripts/
   ```

4. **Styles**
   ```bash
   mkdir -p apps/backend/styles
   cp -r old-code/apps/backend/styles/* apps/backend/styles/
   ```

5. **Root Files**
   ```bash
   cp old-code/apps/backend/package.json apps/backend/
   cp old-code/apps/backend/next.config.js apps/backend/
   cp old-code/apps/backend/tailwind.config.js apps/backend/
   cp old-code/apps/backend/Dockerfile apps/backend/
   ```

   **Update package.json dependencies:**
   ```json
   {
     "dependencies": {
       "@repo/database": "workspace:*",
       "@repo/types": "workspace:*",
       "@repo/config": "workspace:*",
       "@repo/logging": "workspace:*"
     }
   }
   ```

   **❌ DO NOT COPY:** `.env`, `.env.local` files

6. **API Route Audit for Schema Changes**

   Create a checklist file: `apps/backend/SCHEMA_MIGRATION_CHECKLIST.md`
   ```markdown
   # Schema Migration Checklist for API Routes

   ## Routes Requiring VideoBubble Updates:
   - [ ] /api/video/[id] - GET video with bubbles
   - [ ] /api/video/[id]/bubbles - POST new bubble
   - [ ] /api/video/[id]/bubbles/[bubbleId] - PATCH update bubble
   - [ ] /api/submissions/[id] - GET submission with video bubbles

   ## Routes Requiring QuizQuestion Updates:
   - [ ] /api/quiz/[id] - GET quiz with questions
   - [ ] /api/quiz/[id]/questions - POST new question
   - [ ] /api/quiz/[id]/questions/[questionId] - PATCH update question
   - [ ] /api/submissions/[id] - GET submission with quiz questions

   ## TRPC Routes Requiring Updates:
   - [ ] video.getById - Include bubbles relation
   - [ ] video.list - Include bubbles relation
   - [ ] quiz.getById - Include questions relation
   - [ ] quiz.list - Include questions relation
   ```

**🔴 Critical Schema Updates:**
- [ ] All video API routes include `bubbles` relation
- [ ] All quiz API routes include `questions` relation
- [ ] Webhook handlers updated to create VideoBubble rows
- [ ] TRPC routers updated with proper includes
- [ ] Response types updated for new structure

**🔴 Excluded:**
- ❌ `/apps/backend/app/demo/` (1008 lines demo code)

**Git Commit:**
```bash
git add .
git commit -m "Phase 6: Backend API routes with VideoBubble/QuizQuestion schema support"
```

---

### PHASE 7: Worker App
**Goal:** Migrate background worker with structured logging and schema updates

#### Tasks:

1. **Worker Entry Point** (MAJOR REFACTOR)

   **Copy:** `/old-code/apps/worker/src/index.ts`

   **Changes Required:**
   - **🔴 CRITICAL:** Replace ALL 41 console.log statements
   - Update to use `@repo/database`
   - Update to use refactored services
   - Update to use `@repo/logging`

   **Before:**
   ```typescript
   console.log('Processing video job:', jobId);
   console.log('Video created:', video);
   ```

   **After:**
   ```typescript
   import { logger } from '@repo/logging';
   logger.info('Processing video job', { jobId, videoId: video.id });
   ```

2. **BullMQ Queue Processor** (MAJOR REFACTOR)

   **Copy:** `/old-code/apps/backend/worker.ts`

   **Changes Required:**
   - **🔴 CRITICAL:** Replace ALL 59 console.log statements
   - Use structured logging with correlation IDs:

   ```typescript
   import { logger } from '@repo/logging';
   import { v4 as uuidv4 } from 'uuid';

   worker.on('active', (job) => {
     const correlationId = uuidv4();
     logger.info('Job started', {
       jobId: job.id,
       jobName: job.name,
       correlationId,
       data: job.data
     });
   });
   ```

3. **🔴 SCHEMA UPDATES for Worker Jobs:**

   **Video Processing Jobs:**
   ```typescript
   // When creating bubbles in worker:
   async function processBubbles(videoOutputId: string, bubbles: any[]) {
     // Create VideoBubble rows (not JSON)
     await prisma.videoBubble.createMany({
       data: bubbles.map((bubble, index) => ({
         videoOutputId,
         appearsAt: bubble.timestamp,
         order: index,
         question: bubble.question,
         options: bubble.options,
         correctAnswer: bubble.correctAnswer,
         explanation: bubble.explanation,
       }))
     });
   }
   ```

   **Quiz Generation Jobs:**
   ```typescript
   // When creating quiz in worker:
   async function processQuiz(quizOutputId: string, questions: any[]) {
     // Create QuizQuestion rows (not JSON)
     await prisma.quizQuestion.createMany({
       data: questions.map((q, index) => ({
         quizOutputId,
         order: index,
         type: q.type,
         prompt: q.prompt,
         stem: q.stem,
         options: q.options,
         correctAnswer: q.correctAnswer,
         explanation: q.explanation,
       }))
     });
   }
   ```

4. **Package Configuration**
   ```bash
   cp old-code/apps/worker/package.json apps/worker/
   cp old-code/apps/worker/Dockerfile apps/worker/
   cp old-code/apps/worker/tsconfig.json apps/worker/
   ```

   **Update package.json:**
   ```json
   {
     "dependencies": {
       "@repo/database": "workspace:*",
       "@repo/types": "workspace:*",
       "@repo/config": "workspace:*",
       "@repo/logging": "workspace:*",
       "bullmq": "^5.13.2",
       "openai": "^4.67.3"
     }
   }
   ```

5. **Build Configuration**
   ```bash
   mkdir -p apps/worker/src
   # Copy any additional worker source files
   ```

**🔴 Critical Checklist:**
- [ ] ALL 100+ console.logs replaced with structured logging
- [ ] Video jobs create VideoBubble rows (not JSON)
- [ ] Quiz jobs create QuizQuestion rows (not JSON)
- [ ] Worker uses `@repo/database` for Prisma client
- [ ] Worker uses refactored services from backend
- [ ] Correlation IDs added for job tracking
- [ ] Error handling uses structured logging

**Git Commit:**
```bash
git add .
git commit -m "Phase 7: Worker app with structured logging and normalized schema support"
```

---

### PHASE 8: Video Player Package (BubbleOverlay Special Handling)
**Goal:** Migrate video player with simplified BubbleOverlay

#### ⚠️ SPECIAL HANDLING: BubbleOverlay

**User Request:** Replace complex BubbleOverlay component with simple text render "Bubble Overlay"

#### Tasks:

1. **Copy Video Player Files**
   ```bash
   mkdir -p packages/video-player/src
   cp old-code/packages/video-player/src/VideoPlayer.tsx packages/video-player/src/
   cp old-code/packages/video-player/src/index.ts packages/video-player/src/
   cp old-code/packages/video-player/src/types.ts packages/video-player/src/
   cp old-code/packages/video-player/package.json packages/video-player/
   ```

2. **Copy Utilities**
   ```bash
   mkdir -p packages/video-player/src/utils
   cp old-code/packages/video-player/src/utils/bubble-physics.ts packages/video-player/src/utils/
   ```

3. **Copy Overlay Components (EXCEPT BubbleOverlay)**
   ```bash
   mkdir -p packages/video-player/src/overlays
   cp old-code/packages/video-player/src/overlays/DraggableBubble.tsx packages/video-player/src/overlays/
   # Copy other overlay components if they exist
   ```

4. **🔴 CREATE NEW BubbleOverlay.tsx** (DO NOT COPY FROM OLD-CODE)

   Create `packages/video-player/src/overlays/BubbleOverlay.tsx`:
   ```typescript
   /**
    * Simplified BubbleOverlay Component
    * Replaces complex physics-based implementation with simple text render
    */

   interface BubbleOverlayProps {
     // Keep existing prop interface for compatibility
     videoId?: string;
     bubbles?: any[];
     onAnswer?: (bubbleId: string, answer: any) => void;
     // ... other props as needed
   }

   export function BubbleOverlay(props: BubbleOverlayProps) {
     return (
       <div className="bubble-overlay">
         Bubble Overlay
       </div>
     );
   }
   ```

   **⚠️ CRITICAL:**
   - **DO NOT** copy the 203-line implementation from old-code
   - **DO NOT** include physics, collision detection, or drag logic
   - **DO NOT** copy DraggableBubble usage
   - **ONLY** render the text "Bubble Overlay"

5. **Update VideoPlayer.tsx**

   Ensure VideoPlayer imports the new simplified BubbleOverlay:
   ```typescript
   import { BubbleOverlay } from './overlays/BubbleOverlay';
   ```

6. **🔴 SCHEMA UPDATE for Video Player Types**

   Update `packages/video-player/src/types.ts`:
   ```typescript
   // Update Bubble type to match VideoBubble model
   export interface Bubble {
     id: string;
     videoOutputId: string;
     appearsAt: number;        // Replaces 'timestamp'
     order: number | null;
     question: string;
     options: any;             // JSON field
     correctAnswer: any;       // JSON field
     explanation: string | null;
     createdAt: Date;
     updatedAt: Date;
   }

   // Update VideoOutput type
   export interface VideoOutput {
     id: string;
     // ... other fields
     bubbles: Bubble[];        // Array of VideoBubble objects, not JSON
   }
   ```

**🔴 Files in packages/video-player:**
```
packages/video-player/
├── src/
│   ├── VideoPlayer.tsx           (copied, updated imports)
│   ├── index.ts                  (copied)
│   ├── types.ts                  (updated for VideoBubble schema)
│   ├── overlays/
│   │   ├── BubbleOverlay.tsx     (NEW - simple version)
│   │   └── DraggableBubble.tsx   (copied but unused)
│   └── utils/
│       └── bubble-physics.ts     (copied but unused)
├── package.json
└── tsconfig.json
```

**📝 REMINDER:**
The old BubbleOverlay (203 lines) included:
- AnimatedDarkBlurOverlay
- StatementBubble with physics
- DraggableBubble with collision detection
- Complex answer validation (lines 89-134)
- Sound effects support

**All of this is REPLACED with simple text: "Bubble Overlay"**

**Git Commit:**
```bash
git add .
git commit -m "Phase 8: Video player package with simplified BubbleOverlay (text only)"
```

---

### PHASE 9: Other Player Packages
**Goal:** Migrate remaining player packages with schema updates

#### Tasks:

1. **Interactive Podcast Player**
   ```bash
   mkdir -p packages/interactive-podcast-player/src
   cp -r old-code/packages/interactive-podcast-player/src/* packages/interactive-podcast-player/src/
   cp old-code/packages/interactive-podcast-player/package.json packages/interactive-podcast-player/
   ```

   **Review for console.logs and replace if found**

2. **Quiz Player** (SCHEMA UPDATES REQUIRED)

   **Copy:**
   ```bash
   mkdir -p packages/quiz-player/src
   cp -r old-code/packages/quiz-player/src/* packages/quiz-player/src/
   cp old-code/packages/quiz-player/package.json packages/quiz-player/
   ```

   **🔴 CRITICAL UPDATES:**

   **Update quiz player types** (`packages/quiz-player/src/types.ts`):
   ```typescript
   // Update to match QuizQuestion model
   export interface Question {
     id: string;
     quizOutputId: string;
     order: number;
     type: QuestionType;       // 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK'
     prompt: string;
     stem: string | null;
     options: any;             // JSON field: [{id, text}]
     correctAnswer: any;       // JSON field
     explanation: string | null;
     createdAt: Date;
     updatedAt: Date;
   }

   export interface QuizOutput {
     id: string;
     // ... other fields
     questions: Question[];     // Array of QuizQuestion objects, not JSON
   }
   ```

   **Update quiz player component** to handle new structure:
   ```typescript
   // OLD CODE (don't use):
   const questions = quiz.questions; // Was JSON

   // NEW CODE (use this):
   const questions = quiz.questions.sort((a, b) => a.order - b.order);

   // Access question properties:
   questions.map(q => (
     <QuestionComponent
       key={q.id}
       prompt={q.prompt}
       type={q.type}
       options={q.options}
       correctAnswer={q.correctAnswer}
     />
   ))
   ```

3. **Widget API Package**

   ```bash
   mkdir -p packages/widget-api/src
   cp old-code/packages/widget-api/router.ts packages/widget-api/src/
   cp old-code/packages/widget-api/package.json packages/widget-api/
   ```

   **🔴 UPDATE TRPC ROUTER** for schema changes:
   ```typescript
   // In packages/widget-api/src/router.ts

   // Video routes - include bubbles
   video: {
     getById: publicProcedure
       .input(z.object({ id: z.string() }))
       .query(async ({ input }) => {
         return await prisma.videoOutput.findUnique({
           where: { id: input.id },
           include: {
             bubbles: {
               orderBy: { appearsAt: 'asc' }
             }
           }
         });
       }),
   },

   // Quiz routes - include questions
   quiz: {
     getById: publicProcedure
       .input(z.object({ id: z.string() }))
       .query(async ({ input }) => {
         return await prisma.quizOutput.findUnique({
           where: { id: input.id },
           include: {
             questions: {
               orderBy: { order: 'asc' }
             }
           }
         });
       }),
   },
   ```

**🔴 Schema Update Checklist:**
- [ ] Quiz player types match QuizQuestion model
- [ ] Quiz player component sorts by `order` field
- [ ] Quiz player accesses questions as array (not JSON)
- [ ] Widget API includes bubbles relation for videos
- [ ] Widget API includes questions relation for quizzes
- [ ] All player packages use `@repo/types`

**Git Commit:**
```bash
git add .
git commit -m "Phase 9: Player packages with QuizQuestion schema support"
```

---

### PHASE 10: Widget App
**Goal:** Migrate widget frontend with schema updates

#### Tasks:

1. **Widget App Routes**
   ```bash
   mkdir -p apps/widget/app
   cp -r old-code/apps/widget/app/* apps/widget/app/
   ```

   **🔴 SCHEMA UPDATES:** Review widget pages that render videos/quizzes:
   - `app/video/*` - Update to use `video.bubbles` array
   - `app/single-video/*` - Update bubble rendering
   - `app/catalog/*` - Update quiz question access
   - `app/interactive-podcasts/*` - Check for any quiz interactions

2. **Widget Components**
   ```bash
   mkdir -p apps/widget/components
   cp -r old-code/apps/widget/components/* apps/widget/components/
   ```

   **🔴 CHECK FOR DUPLICATE BubbleOverlay:**
   ```bash
   # Check if widget has its own BubbleOverlay
   ls apps/widget/components/video-scroll/overlays/BubbleOverlay.tsx
   ```

   **If found:**
   - ❌ Delete the widget's version
   - ✅ Use `@repo/video-player` package version instead

   **🔴 UPDATE VIDEO COMPONENTS:**
   ```typescript
   // In video rendering components:

   // OLD (don't use):
   const bubbles = video.bubbles; // Was JSON array

   // NEW (use this):
   const bubbles = video.bubbles || []; // Array of VideoBubble objects

   // Render bubbles:
   {bubbles.map(bubble => (
     <BubbleComponent
       key={bubble.id}
       appearsAt={bubble.appearsAt}  // Updated field name
       question={bubble.question}
       options={bubble.options}
       correctAnswer={bubble.correctAnswer}
     />
   ))}
   ```

   **🔴 UPDATE QUIZ COMPONENTS:**
   ```typescript
   // In quiz rendering components:

   // OLD (don't use):
   const questions = quiz.questions; // Was JSON array

   // NEW (use this):
   const questions = quiz.questions?.sort((a, b) => a.order - b.order) || [];

   // Render questions:
   {questions.map(question => (
     <QuizQuestionComponent
       key={question.id}
       prompt={question.prompt}
       type={question.type}
       options={question.options}
       correctAnswer={question.correctAnswer}
     />
   ))}
   ```

   **🔴 FLAG:** `LearningHubClient.tsx` (789 lines) - Consider splitting later

3. **Widget Contexts**
   ```bash
   mkdir -p apps/widget/contexts
   cp -r old-code/apps/widget/contexts/* apps/widget/contexts/
   ```

4. **Widget Hooks**
   ```bash
   mkdir -p apps/widget/hooks
   cp -r old-code/apps/widget/hooks/* apps/widget/hooks/
   ```

   **🔴 UPDATE:** Hooks that fetch videos/quizzes must request relations:
   ```typescript
   // In useVideo hook:
   const { data: video } = trpc.video.getById.useQuery({
     id,
     include: { bubbles: true }
   });

   // In useQuiz hook:
   const { data: quiz } = trpc.quiz.getById.useQuery({
     id,
     include: { questions: true }
   });
   ```

5. **Widget Lib & Utils**
   ```bash
   mkdir -p apps/widget/lib
   cp -r old-code/apps/widget/lib/* apps/widget/lib/

   mkdir -p apps/widget/utils
   cp old-code/apps/widget/utils/completionTracker.ts apps/widget/utils/
   cp old-code/apps/widget/utils/xpManager.ts apps/widget/utils/
   ```

   **Replace console.logs:**
   - `completionTracker.ts` - 3 console.logs
   - `xpManager.ts` - 1 console.log

6. **Widget Types**
   ```bash
   mkdir -p apps/widget/types
   # Review old-code/apps/widget/types/
   # Only copy types NOT in @repo/types
   ```

   **🔴 PREFER:** Use `@repo/types` for shared types

   **Update widget-specific types:**
   ```typescript
   // Import from shared types
   import { VideoOutput, QuizOutput, VideoBubble, QuizQuestion } from '@repo/types';

   // Only define widget-specific types here
   export interface WidgetConfig {
     // widget-specific types
   }
   ```

7. **Widget Configuration**
   ```bash
   cp old-code/apps/widget/package.json apps/widget/
   cp old-code/apps/widget/next.config.js apps/widget/
   cp old-code/apps/widget/tailwind.config.js apps/widget/
   ```

   **Update package.json:**
   ```json
   {
     "dependencies": {
       "@repo/database": "workspace:*",
       "@repo/types": "workspace:*",
       "@repo/config": "workspace:*",
       "@repo/logging": "workspace:*",
       "@repo/video-player": "workspace:*",
       "@repo/quiz-player": "workspace:*",
       "@repo/widget-api": "workspace:*"
     }
   }
   ```

   **❌ DO NOT COPY:** `.env.local`

8. **Widget Public Assets**
   ```bash
   mkdir -p apps/widget/public
   cp -r old-code/apps/widget/public/* apps/widget/public/
   ```

**🔴 Critical Schema Update Checklist:**
- [ ] Video components access `bubbles` as array with `appearsAt` field
- [ ] Quiz components access `questions` as array with `order` field
- [ ] Duplicate BubbleOverlay removed (use package version)
- [ ] All video/quiz hooks include proper relations
- [ ] Widget types import from `@repo/types`
- [ ] All console.logs replaced in utils

**🔴 Component Updates Required:**
Create `apps/widget/COMPONENT_MIGRATION_CHECKLIST.md`:
```markdown
# Widget Component Migration Checklist

## Video Components:
- [ ] components/video/VideoPlayer.tsx - Use video.bubbles array
- [ ] components/video-scroll/VideoScroll.tsx - Update bubble access
- [ ] components/video-scroll/overlays/* - Remove duplicate BubbleOverlay

## Quiz Components:
- [ ] components/quiz/QuizPlayer.tsx - Use quiz.questions array
- [ ] components/learning-hub/QuizSection.tsx - Sort by order field

## Pages:
- [ ] app/video/[id]/page.tsx - Include bubbles relation
- [ ] app/catalog/page.tsx - Include questions relation
- [ ] app/single-video/[id]/page.tsx - Update bubble rendering
```

**Git Commit:**
```bash
git add .
git commit -m "Phase 10: Widget app with normalized schema support and deduplicated code"
```

---

### PHASE 11: Frontend App (Decision Required)
**Goal:** Migrate or consolidate quiz/learning frontend

#### ⚠️ DECISION NEEDED

The `/old-code/apps/frontend/` directory appears to be a separate quiz/learning frontend with:
- Netlify deployment configuration
- Quiz/leaderboard/schools features
- Different tech stack from widget

#### Options:

**Option 1: Keep as Separate App**
```bash
mkdir -p apps/frontend
cp -r old-code/apps/frontend/* apps/frontend/
```

**Option 2: Merge with Widget**
- Evaluate feature overlap
- Move unique features to widget
- Deprecate separate frontend

**Option 3: Deprecate**
- If no longer needed, skip migration

#### If Migrating (Option 1):

1. **Copy Frontend App**
   ```bash
   mkdir -p apps/frontend/src
   cp -r old-code/apps/frontend/src/* apps/frontend/src/
   cp old-code/apps/frontend/package.json apps/frontend/
   ```

2. **Review for Duplicates**
   - Compare with widget features
   - Check for duplicate API clients
   - Check for duplicate components

3. **🔴 SCHEMA UPDATES**

   If frontend uses quizzes:
   ```typescript
   // Update quiz queries to include questions
   const quiz = await prisma.quizOutput.findUnique({
     where: { id },
     include: {
       questions: {
         orderBy: { order: 'asc' }
       }
     }
   });
   ```

4. **Update Dependencies**
   ```json
   {
     "dependencies": {
       "@repo/database": "workspace:*",
       "@repo/types": "workspace:*",
       "@repo/quiz-player": "workspace:*"
     }
   }
   ```

#### Recommendation:
Review feature overlap with widget before deciding. If there's significant duplication, consider merging.

**Git Commit (if migrating):**
```bash
git add .
git commit -m "Phase 11: Frontend app [or skip if deprecated]"
```

**Git Commit (if skipping):**
```bash
# Add note to migration log
echo "Phase 11: Frontend app skipped - deprecated/merged with widget" >> MIGRATION_LOG.md
git add MIGRATION_LOG.md
git commit -m "Phase 11: Document frontend app decision (skipped)"
```

---

### PHASE 12: Infrastructure & Deployment
**Goal:** Set up deployment configuration

#### Tasks:

1. **SST Configuration** (CLEAN UP)

   **Copy:** `/old-code/sst.config.ts`

   **🔴 CLEAN UP REQUIRED:**
   ```bash
   cp old-code/sst.config.ts .
   ```

   **Remove from sst.config.ts:**
   - Lines 3-13: Commented code block (old imports)
   - Lines 289-306: Commented code block (old configuration)

   **Review:**
   - Line 24: TODO about AWS accounts

   **Update paths for new structure:**
   ```typescript
   // Update backend path if changed
   backend: {
     path: "apps/backend",
     // ... config
   }

   // Update worker path if changed
   worker: {
     path: "apps/worker",
     // ... config
   }

   // Update widget path if changed
   widget: {
     path: "apps/widget",
     // ... config
   }
   ```

   **Verify:**
   - VPC configuration (2-3 AZs)
   - ECS Cluster settings
   - Redis (Valkey) configuration
   - S3 + CloudFront CDN
   - ALB with HTTPS/ACM
   - Backend: 0.5-1 vCPU, 1-2 GB memory
   - Worker: 1-2 vCPU, 2-4 GB memory

2. **SST Type Definitions**
   ```bash
   cp old-code/sst-env.d.ts .
   ```

3. **Documentation**
   ```bash
   cp old-code/README.md .
   # Update README for new structure

   cp old-code/DEPLOYMENT_CHECKLIST.md .
   cp old-code/RENDER_DEPLOYMENT.md .
   cp old-code/SST_SECRETS.md .
   cp old-code/TURBOREPO_MIGRATION.md .
   ```

   **Update README.md** with new structure:
   ```markdown
   # CMS Platform

   ## Architecture

   ### Normalized Database Schema
   - VideoBubble table (replaces VideoOutput.bubbles JSON)
   - QuizQuestion table (replaces QuizOutput.questions JSON)

   ### Shared Packages
   - `@repo/database` - Prisma client and schema
   - `@repo/types` - Consolidated TypeScript types
   - `@repo/config` - Configuration (NO hardcoded prompts)
   - `@repo/logging` - Structured logging (Winston)
   - `@repo/video-player` - Video player with simplified BubbleOverlay
   - `@repo/quiz-player` - Quiz player
   - `@repo/widget-api` - TRPC API for widget

   ### Apps
   - `apps/backend` - Next.js 15 API backend
   - `apps/widget` - Next.js 15 widget frontend
   - `apps/worker` - BullMQ background worker

   ## Key Improvements
   - ✅ Normalized schema (no large JSON columns)
   - ✅ Externalized AI prompts
   - ✅ Structured logging (no console.log)
   - ✅ Refactored large services
   - ✅ Consolidated types
   - ✅ Removed demo code
   ```

4. **Scripts**
   ```bash
   mkdir -p scripts
   cp -r old-code/scripts/* scripts/
   ```

5. **Root Package.json**

   Ensure workspace configuration:
   ```json
   {
     "name": "cms-n-widget",
     "version": "1.0.0",
     "private": true,
     "workspaces": [
       "apps/*",
       "packages/*"
     ],
     "scripts": {
       "build": "turbo build",
       "dev": "turbo dev",
       "lint": "turbo lint",
       "db:generate": "turbo db:generate",
       "db:push": "turbo db:push",
       "db:migrate": "turbo db:migrate"
     },
     "devDependencies": {
       "turbo": "^2.5.8"
     },
     "dependencies": {
       "sst": "^3.17.23",
       "typescript": "^5.9.3"
     },
     "packageManager": "npm@10.9.2",
     "engines": {
       "node": ">=22.0.0",
       "npm": ">=10.0.0"
     }
   }
   ```

**🔴 Clean-up Checklist:**
- [ ] Commented code removed from sst.config.ts
- [ ] Paths updated for new structure
- [ ] README updated with new architecture
- [ ] Documentation reflects schema normalization

**❌ EXCLUDE:**
- `.sst/` folder (build artifacts)
- `.turbo/` folder (cache)
- `node_modules/`
- All `.env` files

**Git Commit:**
```bash
git add .
git commit -m "Phase 12: Infrastructure and deployment configuration (cleaned)"
```

---

### PHASE 13: Environment & Secrets Setup
**Goal:** Configure environment variables (DO NOT COPY .env FILES)

#### ⚠️ CRITICAL: Create New .env Files

**DO NOT** copy existing `.env` files from old-code. Create new ones based on the structure.

#### Tasks:

1. **Root .env.example**

   Create `.env.example`:
   ```bash
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/cms_platform

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=

   # OpenAI
   OPENAI_API_KEY=

   # ElevenLabs
   ELEVENLABS_API_KEY=

   # HeyGen
   HEYGEN_API_KEY=

   # Submagic
   SUBMAGIC_API_KEY=

   # AWS
   AWS_ACCESS_KEY_ID=
   AWS_SECRET_ACCESS_KEY=
   AWS_REGION=ap-south-1
   AWS_S3_BUCKET_NAME=

   # Redis/BullMQ
   REDIS_URL=

   # App Config
   NODE_ENV=development
   ```

2. **Package-Specific .env Files**

   **Backend:**
   ```bash
   # Create apps/backend/.env.example
   touch apps/backend/.env.example
   ```

   **Widget:**
   ```bash
   # Create apps/widget/.env.local.example
   touch apps/widget/.env.local.example
   ```

   **Database:**
   ```bash
   # Create packages/database/.env.example
   echo "DATABASE_URL=postgresql://user:password@localhost:5432/cms_platform" > packages/database/.env.example
   ```

3. **Update .gitignore**

   Ensure these are in `.gitignore`:
   ```
   # Environment
   .env
   .env.local
   .env*.local

   # But track examples:
   !.env.example
   !.env*.example
   ```

4. **Document Required Variables**

   Create `ENVIRONMENT_SETUP.md`:
   ```markdown
   # Environment Setup Guide

   ## Required Environment Variables

   ### Database
   - `DATABASE_URL` - PostgreSQL connection string

   ### Authentication (Supabase)
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key (backend only)

   ### AI Services
   - `OPENAI_API_KEY` - OpenAI API key (GPT-4, DALL-E)
   - `ELEVENLABS_API_KEY` - ElevenLabs TTS API key
   - `HEYGEN_API_KEY` - HeyGen video generation API key
   - `SUBMAGIC_API_KEY` - Submagic video editing API key

   ### AWS Services
   - `AWS_ACCESS_KEY_ID` - AWS access key
   - `AWS_SECRET_ACCESS_KEY` - AWS secret key
   - `AWS_REGION` - AWS region (default: ap-south-1)
   - `AWS_S3_BUCKET_NAME` - S3 bucket for media storage

   ### Queue/Cache
   - `REDIS_URL` - Redis connection string for BullMQ

   ## Setup Instructions

   1. Copy `.env.example` to `.env`
   2. Fill in your actual values
   3. For SST secrets, use: `sst secret set KEY value`
   4. See `SST_SECRETS.md` for SST-specific secret management
   ```

5. **SST Secrets Reference**

   Review `SST_SECRETS.md` for secrets that should be set via SST:
   ```bash
   # Example SST secret commands (don't run yet):
   sst secret set OPENAI_API_KEY "your-key"
   sst secret set HEYGEN_API_KEY "your-key"
   # ... etc
   ```

**🔴 Critical Reminders:**
- ❌ DO NOT commit actual .env files
- ✅ DO commit .env.example files
- ✅ Document all required variables
- ✅ Use SST secrets for production

**Git Commit:**
```bash
git add .env.example apps/*/.env*.example packages/*/.env.example ENVIRONMENT_SETUP.md .gitignore
git commit -m "Phase 13: Environment configuration templates and documentation"
```

---

### PHASE 14: Final Audit & Testing
**Goal:** Review migration, test builds, verify all critical changes

#### Tasks:

1. **Install Dependencies**
   ```bash
   # From root
   npm install
   ```

2. **Generate Prisma Client**
   ```bash
   cd packages/database
   npx prisma generate
   ```

3. **Run Turbo Build**
   ```bash
   # From root
   turbo build
   ```

   **Expected outputs:**
   - `apps/backend/.next/` - Backend build
   - `apps/widget/.next/` - Widget build
   - `apps/worker/dist/` - Worker compiled
   - `packages/*/dist/` - Package builds

4. **Verify No Hardcoded Prompts**
   ```bash
   # Search for potential prompt strings
   grep -r "You are an expert" apps/backend/lib/services/
   grep -r "expert.*writer" apps/backend/lib/services/
   grep -r "Generate.*questions" apps/backend/lib/services/
   ```

   **Should return:** No matches (or only in config files)

5. **Verify No Console.logs in Services**
   ```bash
   # Check services for console.log
   grep -r "console\.log" apps/backend/lib/services/
   grep -r "console\.log" apps/worker/src/
   ```

   **Should return:** No matches in production services

6. **Verify Schema Updates**
   ```bash
   # Check for old JSON access patterns
   grep -r "video\.bubbles\[" apps/
   grep -r "quiz\.questions\[" apps/
   ```

   **Review results:** Ensure they're accessing array of objects, not JSON parsing

7. **Verify BubbleOverlay Simplification**
   ```bash
   # Check BubbleOverlay implementation
   cat packages/video-player/src/overlays/BubbleOverlay.tsx
   ```

   **Should contain:** Only simple "Bubble Overlay" text, no physics logic

8. **Review Flagged Files**

   **Large files to consider splitting (future work):**
   - `apps/backend/frontend-lib/api/hooks/*` (was 987 lines, now split)
   - `apps/backend/components/articles/ArticleForm.tsx` (750 lines)
   - `apps/widget/components/learning-hub/LearningHubClient.tsx` (789 lines)

9. **Database Schema Validation**
   ```bash
   cd packages/database
   npx prisma validate
   npx prisma format
   ```

10. **Create Migration Summary Document**

    Create `MIGRATION_SUMMARY.md`:
    ```markdown
    # Migration Summary

    **Completed:** [Date]
    **Total Phases:** 14
    **Total Commits:** 14

    ## Key Changes

    ### Schema Normalization
    - ✅ Created VideoBubble table (replaced VideoOutput.bubbles JSON)
    - ✅ Created QuizQuestion table (replaced QuizOutput.questions JSON)
    - ✅ Added indexes on videoOutputId, quizOutputId, appearsAt, order

    ### Code Quality Improvements
    - ✅ Removed 15+ hardcoded AI prompts
    - ✅ Replaced 272+ console.log with structured logging
    - ✅ Split 3 large service files (625, 688, 538 lines)
    - ✅ Split 987-line hooks file into domain-specific hooks
    - ✅ Removed 1008 lines of demo code

    ### Architecture Improvements
    - ✅ Created 5 shared packages (@repo/*)
    - ✅ Consolidated duplicate types from 10+ locations
    - ✅ Externalized configuration and constants
    - ✅ Structured logging infrastructure

    ### Component Simplification
    - ✅ Simplified BubbleOverlay (203 lines → 10 lines)

    ## Files Excluded
    - ❌ `/apps/backend/app/demo/` (demo code)
    - ❌ All `.env` files (created new templates)
    - ❌ Build artifacts (`.next/`, `dist/`, `.turbo/`)

    ## Schema Migration Notes

    ### For Existing Production Data

    If you have existing data in old-code database with JSON columns:

    1. **Backup database first**
    2. **Run migration script:** `packages/database/migrations/normalize-json-columns.ts`
    3. **Verify data integrity**
    4. **Update application code references**

    ### Migration Script Outline

    ```typescript
    // Pseudo-code for data migration:

    // 1. Migrate VideoOutput.bubbles → VideoBubble rows
    const videos = await prisma.videoOutput.findMany({
      where: { bubbles: { not: null } }
    });

    for (const video of videos) {
      const bubbles = video.bubbles as any[];
      await prisma.videoBubble.createMany({
        data: bubbles.map((b, i) => ({
          videoOutputId: video.id,
          appearsAt: b.timestamp,
          order: i,
          question: b.question,
          options: b.options,
          correctAnswer: b.correctAnswer,
          explanation: b.explanation,
        }))
      });
    }

    // 2. Migrate QuizOutput.questions → QuizQuestion rows
    const quizzes = await prisma.quizOutput.findMany({
      where: { questions: { not: null } }
    });

    for (const quiz of quizzes) {
      const questions = quiz.questions as any[];
      await prisma.quizQuestion.createMany({
        data: questions.map((q, i) => ({
          quizOutputId: quiz.id,
          order: i,
          type: q.type,
          prompt: q.prompt,
          stem: q.stem,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        }))
      });
    }
    ```

    ## Testing Checklist

    - [ ] All turbo builds succeed
    - [ ] Prisma client generates successfully
    - [ ] No hardcoded prompts in services
    - [ ] No console.logs in production code
    - [ ] BubbleOverlay renders simple text
    - [ ] Video queries include bubbles relation
    - [ ] Quiz queries include questions relation
    - [ ] All services use structured logging
    - [ ] All services use @repo packages

    ## Known Issues / Future Work

    - [ ] Soft delete not implemented (all deletes are hard cascades)
    - [ ] Inconsistent userId vs profileId naming
    - [ ] No test coverage (should add tests)
    - [ ] Some large components could be split further
    - [ ] Prompt management system needs implementation (currently config-based)

    ## Next Steps

    1. Set up environment variables (see ENVIRONMENT_SETUP.md)
    2. Configure SST secrets (see SST_SECRETS.md)
    3. Run database migrations if coming from old-code data
    4. Test all features in development
    5. Deploy to staging for validation
    6. Deploy to production
    ```

11. **Final Verification Commands**
    ```bash
    # Verify workspace structure
    npm run build

    # Check for common issues
    echo "Checking for console.log in services..."
    grep -r "console\.log" apps/backend/lib/services/ apps/worker/src/ || echo "✅ No console.logs found"

    echo "Checking for hardcoded prompts..."
    grep -r "You are an expert" apps/ || echo "✅ No hardcoded prompts found"

    echo "Verifying BubbleOverlay..."
    grep -q "Bubble Overlay" packages/video-player/src/overlays/BubbleOverlay.tsx && echo "✅ BubbleOverlay simplified"

    echo "Verifying schema..."
    cd packages/database && npx prisma validate && echo "✅ Schema valid"
    ```

**Git Commit:**
```bash
git add .
git commit -m "Phase 14: Final audit, build verification, and migration summary"
```

---

## Critical Flags & Reminders

### 🔴 MUST REFACTOR BEFORE/DURING MIGRATION:

1. **`interactive-podcast.service.ts`** (688 lines) → Split into 4 services ✅
2. **`video.service.ts`** (625 lines) → Split into 3 services ✅
3. **`openai.service.ts`** (538 lines) → Split into 2 services ✅
4. **`hooks.ts`** (987 lines) → Split by domain ✅
5. **BubbleOverlay.tsx** → Replace with simple "Bubble Overlay" text ✅

### ⚠️ MUST REMOVE/EXTERNALIZE:

1. **15+ hardcoded AI prompts** across 6 files → Move to config ✅
2. **272+ console.log statements** → Replace with structured logging ✅
3. **Demo code** (`app/demo/`) → DO NOT MIGRATE ✅

### 🔴 DATABASE SCHEMA UPDATES:

1. **VideoBubble table created** ✅
   - Replaces VideoOutput.bubbles JSON column
   - Indexed on (videoOutputId, appearsAt)
   - All video services updated to create/query rows

2. **QuizQuestion table created** ✅
   - Replaces QuizOutput.questions JSON column
   - Indexed on (quizOutputId, order)
   - All quiz services updated to create/query rows

3. **Additional Improvements:**
   - Add index on VideoOutput(heygenVideoId)
   - Add index on VideoOutput(submagicProjectId)
   - Add composite index on Submission(articleId, language)

4. **Known Issues (Future Work):**
   - No soft delete functionality
   - Inconsistent `userId` vs `profileId` naming
   - InteractivePodcastOutput.segments still JSON (consider normalizing)
   - PodcastOutput.segments still JSON (consider normalizing)

### ❌ FILES TO EXCLUDE:

- `/apps/backend/app/demo/` (1008 lines demo code) ✅
- All `.env` files (create new templates) ✅
- `node_modules/`, `.turbo/`, `.sst/`, `.next/` ✅
- Commented code blocks in sst.config.ts ✅

### ⚠️ SPECIAL HANDLING:

- **BubbleOverlay (Phase 8):** Simple text render only, NO complex physics ✅
- **Prompts:** None should be hardcoded in migrated code ✅
- **Git commit:** After EACH phase (14 total) ✅

---

## Schema Normalization Updates

### Overview

The original schema stored bubbles and quiz questions as JSON columns:
```prisma
// OLD (don't use):
model VideoOutput {
  bubbles Json?  // Array of bubble objects
}

model QuizOutput {
  questions Json?  // Array of question objects
}
```

The new schema normalizes these into proper relational tables:
```prisma
// NEW (current):
model VideoOutput {
  bubbles VideoBubble[]  // Relation to VideoBubble table
}

model VideoBubble {
  id            String      @id @default(uuid())
  videoOutputId String
  videoOutput   VideoOutput @relation(fields: [videoOutputId], references: [id])
  appearsAt     Int
  order         Int?
  question      String
  options       Json?
  correctAnswer Json?
  explanation   String?
}

model QuizOutput {
  questions QuizQuestion[]  // Relation to QuizQuestion table
}

model QuizQuestion {
  id           String     @id @default(uuid())
  quizOutputId String
  quizOutput   QuizOutput @relation(fields: [quizOutputId], references: [id])
  order        Int
  type         QuestionType
  prompt       String
  options      Json?
  correctAnswer Json?
  explanation  String?
}
```

### Benefits of Normalization

1. **Better Query Performance:**
   - Can query specific bubbles/questions without loading entire JSON
   - Can add indexes on bubble timestamps, question order
   - Can filter bubbles by criteria efficiently

2. **Data Integrity:**
   - Foreign key constraints ensure referential integrity
   - Cascade deletes properly handled
   - Can't have orphaned bubbles/questions

3. **Easier Updates:**
   - Update individual bubbles/questions without JSON parsing
   - Atomic updates with proper transactions
   - Can track changes at bubble/question level

4. **Scalability:**
   - Large videos with many bubbles don't load entire JSON
   - Can paginate bubbles/questions
   - Database can optimize joins and queries

### Migration Impact

**Files Updated for Schema Changes:**

1. **Services (Phase 4):**
   - `quiz.service.ts` - Creates QuizQuestion rows
   - `video-generator.service.ts` - Creates VideoBubble rows
   - `bubble-generator.service.ts` - Manages VideoBubble CRUD

2. **Controllers (Phase 5):**
   - Video controllers include `bubbles` relation
   - Quiz controllers include `questions` relation

3. **API Routes (Phase 6):**
   - `/api/video/*` routes include bubbles
   - `/api/quiz/*` routes include questions
   - TRPC routers updated with includes

4. **Worker (Phase 7):**
   - Video jobs create VideoBubble rows
   - Quiz jobs create QuizQuestion rows

5. **Player Packages (Phase 9):**
   - Quiz player types match QuizQuestion model
   - Video player types match VideoBubble model

6. **Widget (Phase 10):**
   - Video components access `video.bubbles` array
   - Quiz components access `quiz.questions` array

### Code Pattern Changes

**OLD Pattern (Don't Use):**
```typescript
// Creating video with bubbles
await prisma.videoOutput.create({
  data: {
    script: "...",
    bubbles: [
      { timestamp: 5, question: "...", options: [...] },
      { timestamp: 10, question: "...", options: [...] }
    ]
  }
});

// Querying
const video = await prisma.videoOutput.findUnique({ where: { id } });
const bubbles = video.bubbles as any[]; // JSON parsing
```

**NEW Pattern (Use This):**
```typescript
// Creating video with bubbles
const video = await prisma.videoOutput.create({
  data: { script: "..." }
});

await prisma.videoBubble.createMany({
  data: [
    { videoOutputId: video.id, appearsAt: 5, order: 0, question: "...", options: {...} },
    { videoOutputId: video.id, appearsAt: 10, order: 1, question: "...", options: {...} }
  ]
});

// Querying
const video = await prisma.videoOutput.findUnique({
  where: { id },
  include: {
    bubbles: {
      orderBy: { appearsAt: 'asc' }
    }
  }
});
// video.bubbles is now properly typed VideoBubble[]
```

---

## Types Package Structure

### Recommended Structure

```
packages/types/
├── src/
│   ├── index.ts              # Re-exports all types
│   ├── media.types.ts        # Article, Submission, Output models
│   ├── organization.types.ts # Organization, Profile, Members
│   ├── player.types.ts       # Bubble, Quiz, Podcast player interfaces
│   ├── api.types.ts          # API request/response types
│   └── common.types.ts       # Shared utility types
├── package.json
└── tsconfig.json
```

### Domain Breakdown

**media.types.ts:**
```typescript
// Article and submission types
export interface Article { ... }
export interface Submission { ... }

// Output types (updated for normalized schema)
export interface VideoOutput {
  id: string;
  // ... other fields
  bubbles: VideoBubble[];  // Not JSON anymore
}

export interface VideoBubble {
  id: string;
  videoOutputId: string;
  appearsAt: number;
  order: number | null;
  question: string;
  options: any;
  correctAnswer: any;
  explanation: string | null;
}

export interface QuizOutput {
  id: string;
  // ... other fields
  questions: QuizQuestion[];  // Not JSON anymore
}

export interface QuizQuestion {
  id: string;
  quizOutputId: string;
  order: number;
  type: QuestionType;
  prompt: string;
  stem: string | null;
  options: any;
  correctAnswer: any;
  explanation: string | null;
}

// ... AudioOutput, PodcastOutput, etc.
```

**organization.types.ts:**
```typescript
export interface Organization { ... }
export interface Profile { ... }
export interface OrganizationMember { ... }
export interface JoinRequest { ... }
```

**player.types.ts:**
```typescript
// Player-specific interfaces (not database models)
export interface VideoPlayerConfig { ... }
export interface QuizPlayerConfig { ... }
export interface BubbleInteraction { ... }
```

**api.types.ts:**
```typescript
// API request/response types
export interface CreateSubmissionRequest { ... }
export interface VideoGenerationResponse { ... }
// ... etc
```

**common.types.ts:**
```typescript
// Shared utilities
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
// ... etc
```

**index.ts:**
```typescript
// Re-export everything for convenience
export * from './media.types';
export * from './organization.types';
export * from './player.types';
export * from './api.types';
export * from './common.types';
```

### Usage

```typescript
// Import specific domain
import { VideoOutput, VideoBubble } from '@repo/types/media';

// Or import from index
import { VideoOutput, Organization, VideoPlayerConfig } from '@repo/types';
```

### Benefits

1. **Clear organization** - Easy to find types by domain
2. **Better tree-shaking** - Import only what you need
3. **Easier maintenance** - Changes scoped to domain files
4. **Type safety** - Catch schema changes at compile time
5. **Single source of truth** - No duplicate definitions

### Migration Process

1. **Collect all type files** from old-code
2. **Group by domain** (media, org, player, API, common)
3. **Remove duplicates** (keep most complete version)
4. **Update for schema changes:**
   - VideoBubble as array, not JSON
   - QuizQuestion as array, not JSON
5. **Export from index.ts**
6. **Update imports** across codebase to use `@repo/types`

---

## Final Notes

### Testing Strategy

After completing all 14 phases:

1. **Unit Tests** (Future work - no tests currently exist)
   - Add tests for media services
   - Add tests for bubble/quiz generation
   - Add tests for schema validation

2. **Integration Tests**
   - Test video generation end-to-end
   - Test quiz generation end-to-end
   - Test bubble interactions

3. **Manual Testing Checklist**
   ```markdown
   - [ ] Create new article
   - [ ] Generate video with bubbles
   - [ ] Verify bubbles appear at correct times
   - [ ] Generate quiz with questions
   - [ ] Verify questions display correctly
   - [ ] Test podcast generation
   - [ ] Test interactive podcast
   - [ ] Test all widget features
   - [ ] Test admin features
   - [ ] Test organization management
   ```

### Performance Considerations

**Before (JSON columns):**
- Loading video = loading all bubbles (even if not needed)
- Updating one bubble = rewriting entire JSON
- Querying by bubble criteria = full table scan with JSON parsing

**After (Normalized tables):**
- Loading video without bubbles = faster
- Loading specific bubbles = efficient with indexes
- Updating one bubble = single row update
- Querying by bubble criteria = indexed lookups

**Indexes Added:**
```prisma
@@index([videoOutputId, appearsAt])  // VideoBubble
@@index([quizOutputId, order])       // QuizQuestion
```

### Rollback Plan

If you need to rollback to old-code structure:

1. **Code:** Git revert to old-code branch
2. **Database:** Restore from backup before migration
3. **Verify:** Check that JSON columns still have data

**Prevention:**
- Always backup database before schema changes
- Test migration on staging first
- Keep old-code directory until migration fully validated

### Support & Documentation

- **Migration issues:** Review specific phase in this document
- **Schema questions:** See `packages/database/prisma/schema.prisma`
- **Type questions:** See `packages/types/src/`
- **Environment setup:** See `ENVIRONMENT_SETUP.md`
- **Deployment:** See `DEPLOYMENT_CHECKLIST.md`
- **SST config:** See `SST_SECRETS.md`

---

## Completion Checklist

Use this checklist to track migration progress:

- [ ] Phase 1: Foundation & Shared Packages
- [ ] Phase 2: Database Schema Migration & Review
- [ ] Phase 3: Core Service Infrastructure
- [ ] Phase 4: Media Services (Refactored)
- [ ] Phase 5: Backend App Structure
- [ ] Phase 6: Backend Routes & API
- [ ] Phase 7: Worker App
- [ ] Phase 8: Video Player Package (BubbleOverlay)
- [ ] Phase 9: Other Player Packages
- [ ] Phase 10: Widget App
- [ ] Phase 11: Frontend App (Decision)
- [ ] Phase 12: Infrastructure & Deployment
- [ ] Phase 13: Environment & Secrets
- [ ] Phase 14: Final Audit & Testing

**Migration Started:** [Date]
**Migration Completed:** [Date]
**Total Time:** [Duration]

---

**End of Migration Plan**
