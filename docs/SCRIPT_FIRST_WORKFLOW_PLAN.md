# Plan: Decoupled Content Generation Flow (Script-First Workflow)

> **Created:** 2025-12-01
> **Last Updated:** 2025-12-01
> **Status:** IN PROGRESS

## Progress Summary

| Phase | Status | Description |
|-------|--------|-------------|
| **A** | ✅ Complete | Database schema + Queue configuration |
| **B** | ✅ Complete | Script generation services |
| **C** | ✅ Complete | Worker handlers for script generation |
| **D** | ✅ Complete | Media-from-script services |
| **E** | ✅ Complete | API endpoints + client hooks |
| **F** | ✅ Complete | Worker handlers for media generation |
| **G** | ✅ Complete | Frontend core components |
| **H** | ✅ Complete | Frontend edit pages |
| **I** | ⏳ TODO | Testing & verification |

### Next Steps (Phase I)
1. Test Video flow: Upload → SCRIPT_READY → Edit script → Configure character → Generate → COMPLETED
2. Test Podcast flow: Upload → SCRIPT_READY → Edit transcript → Select voices → Generate → COMPLETED
3. Test Interactive Podcast flow: Upload → SCRIPT_READY → Edit script → Select voice → Generate → COMPLETED
4. Test mixed content types and error handling

---

## Overview

Decouple the content generation flow so that video, podcast, and interactive podcast outputs go through a **script review phase** before triggering expensive media generation (HeyGen, ElevenLabs, etc.).

### Current Flow
1. ArticleForm → Upload + select content types + video customization
2. Submit → ALL content generated immediately (scripts + media)
3. Edit page → Review/edit scripts, regenerate if needed

### New Flow
1. ArticleForm → Upload + select content types (NO video customization)
2. Submit → For video/podcast/interactive podcast, ONLY generate scripts
3. New status: `SCRIPT_READY`
4. Edit page → Review/edit scripts + configure media settings
5. User triggers full media generation when satisfied
6. Status → `PROCESSING` → `COMPLETED`

---

## Phase 1: Database Schema Changes

### File: `packages/database/prisma/schema.prisma`

Add new status to `OutputStatus` enum:

```prisma
enum OutputStatus {
  PENDING
  PROCESSING
  SCRIPT_READY    // NEW
  COMPLETED
  FAILED
}
```

Run migration: `npx prisma migrate dev --name add_script_ready_status`

---

## Phase 2: Queue Configuration

### File: `apps/backend/lib/config/queue.ts`

Add new job types:

```typescript
export enum JobTypes {
  // Existing...

  // Script-only generation
  GENERATE_VIDEO_SCRIPT = 'generate-video-script',
  GENERATE_PODCAST_TRANSCRIPT = 'generate-podcast-transcript',
  GENERATE_INTERACTIVE_PODCAST_SCRIPT = 'generate-interactive-podcast-script',

  // Media from approved script
  GENERATE_VIDEO_FROM_SCRIPT = 'generate-video-from-script',
  GENERATE_PODCAST_FROM_TRANSCRIPT = 'generate-podcast-from-transcript',
  GENERATE_INTERACTIVE_PODCAST_FROM_SCRIPT = 'generate-interactive-podcast-from-script',
}
```

### File: `apps/backend/lib/services/core/queue.service.ts`

Add methods:
- `addVideoScriptGenerationJob()`
- `addPodcastTranscriptGenerationJob()`
- `addInteractivePodcastScriptGenerationJob()`
- `addVideoMediaGenerationJob()`
- `addPodcastMediaGenerationJob()`
- `addInteractivePodcastMediaGenerationJob()`

---

## Phase 3: New Script Generation Services

### New Files in `apps/backend/lib/services/media/`:

**1. `video-script.service.ts`**
- Extract script generation logic from `video-generator.service.ts`
- Generate script using OpenAI
- Update VideoOutput: `status = 'SCRIPT_READY'`, store `title` and `script`
- NO HeyGen call

**2. `podcast-script.service.ts`**
- Extract transcript generation from `podcast.service.ts`
- Generate title + transcript using OpenAI
- Update PodcastOutput: `status = 'SCRIPT_READY'`, store `title` and `transcript`
- NO ElevenLabs/audio call

**3. `interactive-podcast-script.service.ts`**
- Extract script generation from `interactive-podcast-generator.service.ts`
- Generate title + script using OpenAI
- Update InteractivePodcastOutput: `status = 'SCRIPT_READY'`, store script in segments field
- NO audio generation

---

## Phase 4: New Media Generation Services

### New Files in `apps/backend/lib/services/media/`:

**1. `video-media.service.ts`**
- Takes approved script + video customization settings
- Validates customization (character selected)
- Calls HeyGen to generate video
- Status: `SCRIPT_READY` → `PROCESSING`
- Webhook-based completion (existing flow)

**2. `podcast-media.service.ts`**
- Takes approved transcript + voice settings
- Generates audio segments using ElevenLabs
- Stitches with FFmpeg
- Status: `SCRIPT_READY` → `PROCESSING` → `COMPLETED`

**3. `interactive-podcast-media.service.ts`**
- Takes approved script + voice setting
- Generates audio, transcribes, generates questions
- Status: `SCRIPT_READY` → `PROCESSING` → `COMPLETED`

---

## Phase 5: Modify Submission Service

### File: `apps/backend/lib/services/submission.service.ts`

**Changes to `createSubmission()`:**

For video/podcast/interactive podcast:
- Queue script-only jobs instead of full generation jobs
- Remove video customization from submission creation (will be set on edit page)

```typescript
// Video - script only
if (submission.generateVideo) {
  const videoOutput = await prisma.videoOutput.create({
    data: { submissionId: submission.id, status: 'PENDING' }
  });
  await queueService.addVideoScriptGenerationJob({ ... });
}
```

**Changes to `updateSubmissionStatus()`:**

Handle `SCRIPT_READY` status:
- If all outputs are `SCRIPT_READY` or `COMPLETED` with no processing → `PARTIAL_COMPLETE`
- Audio and Quiz still complete immediately (no script review needed)

---

## Phase 6: Worker Updates

### File: `apps/worker/src/index.ts`

Add handlers for new job types:

```typescript
case JobTypes.GENERATE_VIDEO_SCRIPT:
  await videoScriptService.generateVideoScript(...)
  break;

case JobTypes.GENERATE_PODCAST_TRANSCRIPT:
  await podcastScriptService.generatePodcastTranscript(...)
  break;

case JobTypes.GENERATE_INTERACTIVE_PODCAST_SCRIPT:
  await interactivePodcastScriptService.generateScript(...)
  break;

case JobTypes.GENERATE_VIDEO_FROM_SCRIPT:
  await videoMediaService.generateVideoFromScript(...)
  break;

case JobTypes.GENERATE_PODCAST_FROM_TRANSCRIPT:
  await podcastMediaService.generatePodcastFromTranscript(...)
  break;

case JobTypes.GENERATE_INTERACTIVE_PODCAST_FROM_SCRIPT:
  await interactivePodcastMediaService.generateFromScript(...)
  break;
```

---

## Phase 7: New API Endpoints

### 1. Video Media Generation
**File:** `apps/backend/app/api/org/[orgSlug]/submissions/[submissionId]/video/[videoId]/generate-media/route.ts`

```typescript
POST /api/org/{orgSlug}/submissions/{submissionId}/video/{videoId}/generate-media
Body: { videoCustomization: VideoCustomizationConfig }
```

- Validate status is `SCRIPT_READY`
- Save video customization to VideoOutput
- Queue `GENERATE_VIDEO_FROM_SCRIPT` job

### 2. Podcast Media Generation
**File:** `apps/backend/app/api/org/[orgSlug]/submissions/[submissionId]/podcast/[podcastId]/generate-media/route.ts`

```typescript
POST /api/org/{orgSlug}/submissions/{submissionId}/podcast/{podcastId}/generate-media
Body: { voiceSelection?: { interviewerVoiceId, guestVoiceId } } // Optional, uses defaults
```

### 3. Interactive Podcast Media Generation
**File:** `apps/backend/app/api/org/[orgSlug]/submissions/[submissionId]/interactive-podcast/[ipId]/generate-media/route.ts`

```typescript
POST /api/org/{orgSlug}/submissions/{submissionId}/interactive-podcast/{ipId}/generate-media
Body: { voiceSelection?: { voiceId } } // Optional, uses default
```

---

## Phase 8: API Client Updates

### File: `packages/api-client/src/api/client.ts`

Add to `submissionsApi`:
- `generateVideoMedia(orgSlug, submissionId, videoId, videoCustomization)`
- `generatePodcastMedia(orgSlug, submissionId, podcastId, voiceSelection?)`
- `generateInteractivePodcastMedia(orgSlug, submissionId, ipId, voiceSelection?)`

### File: `packages/api-client/src/api/hooks/media-hooks.ts`

Add hooks:
- `useGenerateVideoMedia(orgSlug)`
- `useGeneratePodcastMedia(orgSlug)`
- `useGenerateInteractivePodcastMedia(orgSlug)`

---

## Phase 9: Frontend Changes

### 1. ArticleForm
**File:** `apps/backend/components/articles/ArticleForm.tsx`

- **Remove** VideoCustomization component from form
- **Remove** videoCustomization state and validation
- Keep content type selection as-is

### 2. MediaCard
**File:** `apps/backend/components/media/MediaCard.tsx`

- Add `SCRIPT_READY` status badge (yellow/amber "Script Ready")
- Make card clickable for `SCRIPT_READY` status (navigate to edit page)

### 3. Video Edit Page
**File:** `apps/backend/app/org/[orgSlug]/submissions/[id]/videos/[videoId]/edit/page.tsx`

Conditional rendering based on status:

**When `SCRIPT_READY`:**
- Show ScriptEditor (editable)
- Show AIPromptBox for regeneration
- Show VideoCustomization component
- Show "Generate Video" button
- Hide video player (no video yet)
- Hide bubbles section (no bubbles yet)
- Hide approval buttons

**When `PROCESSING`:**
- Show script (read-only)
- Show video customization (read-only)
- Show processing indicator
- Disable all actions

**When `COMPLETED`:**
- Existing UI (video player, bubbles, approval, etc.)

### 4. Podcast Edit Page
**File:** `apps/backend/app/org/[orgSlug]/submissions/[id]/podcasts/[podcastId]/edit/page.tsx`

**When `SCRIPT_READY`:**
- Show TranscriptEditor (editable)
- Show AIPromptBox
- Show voice selection (defaults pre-selected, optional to change)
- Show "Generate Podcast" button
- Hide audio player

**When `COMPLETED`:**
- Existing UI

### 5. Interactive Podcast Edit Page
**File:** `apps/backend/app/org/[orgSlug]/submissions/[id]/interactive-podcasts/[ipId]/edit/page.tsx`

**When `SCRIPT_READY`:**
- Show ScriptEditor (editable)
- Show AIPromptBox
- Show voice selection (default pre-selected)
- Show "Generate Interactive Podcast" button
- Hide audio player

**When `COMPLETED`:**
- Existing UI

---

## Phase 10: Voice Selection Component

### New File: `apps/backend/components/audio/VoiceSelector.tsx`

Voice picker component showing available voices with defaults pre-selected:

**For Podcasts (dual voice):**
```typescript
interface PodcastVoiceSelectorProps {
  value: { interviewerVoiceId: string; guestVoiceId: string };
  onChange: (voices: { interviewerVoiceId: string; guestVoiceId: string }) => void;
  disabled?: boolean;
}
```
- Shows interviewer voice selector (default: Herin)
- Shows guest voice selector (default: Isha)
- Initially populated with defaults from `packages/config/src/voices.ts`
- UI similar to VideoCustomization character grid (but simpler)

**For Interactive Podcast (single voice):**
```typescript
interface SingleVoiceSelectorProps {
  value: string;
  onChange: (voiceId: string) => void;
  disabled?: boolean;
}
```
- Single voice selector (default: Isha voice)
- Same component can be reused

**Initial implementation:** Show defaults as selected, allow selection from available voices. Can be expanded with more voices later.

---

## Implementation Phases

### Phase A: Database & Core Infrastructure ✅ COMPLETED
**Goal:** Establish the new status and job types

| # | Task | Files | Status |
|---|------|-------|--------|
| A1 | Add `SCRIPT_READY` to OutputStatus enum | `packages/database/prisma/schema.prisma` | ✅ Done |
| A2 | Run Prisma migration | CLI (`prisma db push`) | ✅ Done |
| A3 | Add new job types to JobTypes enum | `apps/backend/lib/config/queue.ts` | ✅ Done |
| A4 | Add queue service methods for script-only jobs | `apps/backend/lib/services/core/queue.service.ts` | ✅ Done |
| A5 | Add queue service methods for media-from-script jobs | `apps/backend/lib/services/core/queue.service.ts` | ✅ Done |

---

### Phase B: Script Generation Services ✅ COMPLETED
**Goal:** Create services that generate scripts without media

| # | Task | Files | Status |
|---|------|-------|--------|
| B1 | Create VideoScriptService | `apps/backend/lib/services/media/video-script.service.ts` | ✅ Done |
| B2 | Create PodcastScriptService | `apps/backend/lib/services/media/podcast-script.service.ts` | ✅ Done |
| B3 | Create InteractivePodcastScriptService | `apps/backend/lib/services/media/interactive-podcast-script.service.ts` | ✅ Done |
| B4 | Modify submission service to queue script-only jobs | `apps/backend/lib/services/submission.service.ts` | ✅ Done |
| B5 | Update submission status logic for SCRIPT_READY | `apps/backend/lib/services/submission.service.ts` | ✅ Done |

---

### Phase C: Worker Handlers (Script Generation) ✅ COMPLETED
**Goal:** Worker can process script-only jobs

| # | Task | Files | Status |
|---|------|-------|--------|
| C1 | Add GENERATE_VIDEO_SCRIPT handler | `apps/worker/src/index.ts` | ✅ Done |
| C2 | Add GENERATE_PODCAST_TRANSCRIPT handler | `apps/worker/src/index.ts` | ✅ Done |
| C3 | Add GENERATE_INTERACTIVE_PODCAST_SCRIPT handler | `apps/worker/src/index.ts` | ✅ Done |

**Checkpoint:** At this point, new submissions should generate scripts and enter SCRIPT_READY status.

---

### Phase D: Media Generation Services ✅ COMPLETED
**Goal:** Create services that generate media from approved scripts

| # | Task | Files | Status |
|---|------|-------|--------|
| D1 | Create VideoMediaService | `apps/backend/lib/services/media/video-media.service.ts` | ✅ Done |
| D2 | Create PodcastMediaService | `apps/backend/lib/services/media/podcast-media.service.ts` | ✅ Done |
| D3 | Create InteractivePodcastMediaService | `apps/backend/lib/services/media/interactive-podcast-media.service.ts` | ✅ Done |

---

### Phase E: API Endpoints & Client ✅ COMPLETED
**Goal:** Frontend can trigger media generation

| # | Task | Files | Status |
|---|------|-------|--------|
| E1 | Create video generate-media endpoint | `apps/backend/app/api/org/[orgSlug]/submissions/[submissionId]/video/[videoId]/generate-media/route.ts` | ✅ Done |
| E2 | Create podcast generate-media endpoint | `apps/backend/app/api/org/[orgSlug]/submissions/[submissionId]/podcast/[podcastId]/generate-media/route.ts` | ✅ Done |
| E3 | Create interactive-podcast generate-media endpoint | `apps/backend/app/api/org/[orgSlug]/submissions/[submissionId]/interactive-podcast/[ipId]/generate-media/route.ts` | ✅ Done |
| E4 | Add API client methods | `packages/api-client/src/api/client.ts` | ✅ Done |
| E5 | Add React hooks for media generation | `packages/api-client/src/api/hooks/media-hooks.ts` | ✅ Done |

---

### Phase F: Worker Handlers (Media Generation) ✅ COMPLETED
**Goal:** Worker can process media-from-script jobs

| # | Task | Files | Status |
|---|------|-------|--------|
| F1 | Add GENERATE_VIDEO_FROM_SCRIPT handler | `apps/worker/src/index.ts` | ✅ Done |
| F2 | Add GENERATE_PODCAST_FROM_TRANSCRIPT handler | `apps/worker/src/index.ts` | ✅ Done |
| F3 | Add GENERATE_INTERACTIVE_PODCAST_FROM_SCRIPT handler | `apps/worker/src/index.ts` | ✅ Done |

---

### Phase G: Frontend - Core Components ✅ COMPLETED
**Goal:** Update shared components for new flow

| # | Task | Files | Status |
|---|------|-------|--------|
| G1 | Update ArticleForm - remove VideoCustomization | `apps/backend/components/articles/ArticleForm.tsx` | ⏳ Skipped (optional - form already works) |
| G2 | Update MediaCard - add SCRIPT_READY status | `apps/backend/components/media/MediaCard.tsx` | ✅ Done |
| G3 | Create VoiceSelector component | `apps/backend/components/audio/VoiceSelector.tsx` | ✅ Done |

---

### Phase H: Frontend - Edit Pages ✅ COMPLETED
**Goal:** Edit pages handle SCRIPT_READY state with customization UI

| # | Task | Files | Status |
|---|------|-------|--------|
| H1 | Update Video Edit Page - conditional UI + VideoCustomization | `apps/backend/app/org/[orgSlug]/submissions/[id]/videos/[videoId]/edit/page.tsx` | ✅ Done |
| H2 | Update Podcast Edit Page - conditional UI + VoiceSelector | `apps/backend/app/org/[orgSlug]/submissions/[id]/podcasts/[podcastId]/edit/page.tsx` | ✅ Done |
| H3 | Update Interactive Podcast Edit Page - conditional UI + VoiceSelector | `apps/backend/app/org/[orgSlug]/submissions/[id]/interactive-podcasts/[ipId]/edit/page.tsx` | ✅ Done |

---

### Phase I: Testing & Verification ⏳ TODO
**Goal:** Ensure everything works end-to-end

| # | Task | Description | Status |
|---|------|-------------|--------|
| I1 | Test Video flow | Upload → SCRIPT_READY → Edit script → Configure character → Generate → COMPLETED | ⏳ TODO |
| I2 | Test Podcast flow | Upload → SCRIPT_READY → Edit transcript → Select voices → Generate → COMPLETED | ⏳ TODO |
| I3 | Test Interactive Podcast flow | Upload → SCRIPT_READY → Edit script → Select voice → Generate → COMPLETED | ⏳ TODO |
| I4 | Test mixed content types | Quiz + Video in same submission (Quiz completes, Video awaits) | ⏳ TODO |
| I5 | Test error handling | Failed script generation, failed media generation | ⏳ TODO |
| I6 | Test existing content | Ensure COMPLETED outputs still work normally | ⏳ TODO |

---

## Critical Files Summary

| Area | File |
|------|------|
| Schema | `packages/database/prisma/schema.prisma` |
| Queue Config | `apps/backend/lib/config/queue.ts` |
| Queue Service | `apps/backend/lib/services/core/queue.service.ts` |
| Submission Service | `apps/backend/lib/services/submission.service.ts` |
| Worker | `apps/worker/src/index.ts` |
| Video Edit Page | `apps/backend/app/org/[orgSlug]/submissions/[id]/videos/[videoId]/edit/page.tsx` |
| Podcast Edit Page | `apps/backend/app/org/[orgSlug]/submissions/[id]/podcasts/[podcastId]/edit/page.tsx` |
| Interactive Podcast Edit | `apps/backend/app/org/[orgSlug]/submissions/[id]/interactive-podcasts/[ipId]/edit/page.tsx` |
| ArticleForm | `apps/backend/components/articles/ArticleForm.tsx` |
| MediaCard | `apps/backend/components/media/MediaCard.tsx` |
| VideoCustomization | `apps/backend/components/video/VideoCustomization.tsx` |

---

## Notes

- **Audio** and **Quiz** outputs continue with existing immediate generation (no script review needed)
- Existing outputs remain unaffected - only new submissions use script-first flow
- Voice selection uses defaults initially; can be enhanced later
- Video webhooks (HeyGen → Submagic → completion) remain unchanged
