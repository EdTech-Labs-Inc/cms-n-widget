# Add Background Music & Bumpers to Edu Video Generation Flow

## Overview
Add background music options (selection + volume control) AND bumper support (start/end video clips) to the edu video generation flow, mirroring the functionality already available in the standalone/socials video creation flow.

## Current State

### Standalone Flow (has music + bumpers)
- `StandaloneVideo` model has `backgroundMusicId`, `backgroundMusicVolume`, `startBumperId`, `startBumperDuration`, `endBumperId`, `endBumperDuration` fields
- `MusicStep.tsx` - music selection UI with preview and volume slider (0-50%, default 15%)
- `BumpersStep.tsx` - bumper selection with start/end sections, duration input for image bumpers
- `POST_PROCESS_STANDALONE_VIDEO` worker job runs FFmpeg to concatenate bumpers and overlay music

### Edu Flow (needs music + bumpers)
- `VideoOutput` model does NOT have music or bumper fields
- `VideoCustomization.tsx` has character, captions, zooms, brolls, bubbles - but no music or bumpers

**Current Edu Flow:**
```
ElevenLabs → HeyGen → HeyGen webhook → Submagic → Submagic webhook → Video Completion Job → COMPLETED
```

**New Edu Flow (with music + bumpers):**
```
ElevenLabs → HeyGen → HeyGen webhook → Submagic → Submagic webhook
    → IF music/bumpers: Post-Processing Job → Video Completion Job → COMPLETED
    → IF no music/bumpers: Video Completion Job → COMPLETED (unchanged)
```

## Implementation Plan

### 1. Database Schema Changes
**File:** `packages/database/prisma/schema.prisma`

Add to `VideoOutput` model:
```prisma
// Music
backgroundMusicId     String?
backgroundMusic       BackgroundMusic? @relation(fields: [backgroundMusicId], references: [id])
backgroundMusicVolume Float            @default(0.15)

// Bumpers
startBumperId         String?
startBumper           VideoBumper?     @relation("StartBumper", fields: [startBumperId], references: [id])
startBumperDuration   Int?             // For image bumpers (seconds)
endBumperId           String?
endBumper             VideoBumper?     @relation("EndBumper", fields: [endBumperId], references: [id])
endBumperDuration     Int?             // For image bumpers (seconds)
```

Run migration after schema change.

### 2. Type Updates
**File:** `packages/api-client/src/api.types.ts`

Update `VideoCustomizationConfig`:
```typescript
export interface VideoCustomizationConfig {
  characterId: string;
  captionStyleId: string;
  enableMagicZooms: boolean;
  enableMagicBrolls: boolean;
  magicBrollsPercentage: number;
  generateBubbles: boolean;
  // Music (NEW)
  backgroundMusicId?: string | null;
  backgroundMusicVolume?: number;         // 0-1, default 0.15
  // Bumpers (NEW)
  startBumperId?: string | null;
  startBumperDuration?: number | null;    // seconds, for image bumpers
  endBumperId?: string | null;
  endBumperDuration?: number | null;      // seconds, for image bumpers
}
```

### 3. UI Changes - VideoCustomization.tsx
**File:** `apps/backend/components/video/VideoCustomization.tsx`

**Add Music Section** (reuse patterns from `MusicStep.tsx`):
- Import `useBackgroundMusic` hook from `@/lib/api/hooks`
- Add music card list with play/pause audio preview
- Add "No Background Music" default option
- Add volume slider (0-50%, default 15%) - shown only when music selected
- Wire up `onChange` with `backgroundMusicId` and `backgroundMusicVolume`

**Add Bumpers Section** (reuse patterns from `BumpersStep.tsx`):
- Import `useVideoBumpers` hook from `@/lib/api/hooks`
- Add Start Bumper subsection with grid of available bumpers
- Add End Bumper subsection with grid of available bumpers
- Add duration input for image bumpers (1-10 seconds)
- Add "No bumper" default options for each
- Wire up `onChange` with bumper fields

### 4. API Route Updates
**File:** `apps/backend/app/api/org/[orgSlug]/submissions/[submissionId]/video/[videoId]/generate-media/route.ts`

Update `VideoCustomizationSchema` (line 8-15):
```typescript
const VideoCustomizationSchema = z.object({
  characterId: z.string(),
  captionStyleId: z.string(),
  enableMagicZooms: z.boolean().optional().default(true),
  enableMagicBrolls: z.boolean().optional().default(true),
  magicBrollsPercentage: z.number().min(0).max(100).optional().default(40),
  generateBubbles: z.boolean().optional().default(true),
  // Music
  backgroundMusicId: z.string().nullable().optional(),
  backgroundMusicVolume: z.number().min(0).max(1).optional(),
  // Bumpers
  startBumperId: z.string().nullable().optional(),
  startBumperDuration: z.number().min(1).max(10).nullable().optional(),
  endBumperId: z.string().nullable().optional(),
  endBumperDuration: z.number().min(1).max(10).nullable().optional(),
});
```

Add validation (after captionStyle validation ~line 152):
```typescript
// Validate background music belongs to organization
if (videoCustomization.backgroundMusicId) {
  const music = await prisma.backgroundMusic.findFirst({
    where: { id: videoCustomization.backgroundMusicId, organizationId: org.id },
  });
  if (!music) {
    return NextResponse.json({ success: false, error: 'Background music not found' }, { status: 404 });
  }
}

// Validate start bumper belongs to organization
if (videoCustomization.startBumperId) {
  const bumper = await prisma.videoBumper.findFirst({
    where: { id: videoCustomization.startBumperId, organizationId: org.id },
  });
  if (!bumper) {
    return NextResponse.json({ success: false, error: 'Start bumper not found' }, { status: 404 });
  }
}

// Validate end bumper belongs to organization
if (videoCustomization.endBumperId) {
  const bumper = await prisma.videoBumper.findFirst({
    where: { id: videoCustomization.endBumperId, organizationId: org.id },
  });
  if (!bumper) {
    return NextResponse.json({ success: false, error: 'End bumper not found' }, { status: 404 });
  }
}
```

Update `prisma.videoOutput.update()` (line 155-168) to include:
```typescript
backgroundMusicId: videoCustomization.backgroundMusicId || null,
backgroundMusicVolume: videoCustomization.backgroundMusicVolume ?? 0.15,
startBumperId: videoCustomization.startBumperId || null,
startBumperDuration: videoCustomization.startBumperDuration || null,
endBumperId: videoCustomization.endBumperId || null,
endBumperDuration: videoCustomization.endBumperDuration || null,
```

### 5. Backend Post-Processing for Edu Videos
Add a post-processing step after HeyGen completion (queued job pattern, matching standalone flow).

### 6. Worker Job Implementation
**File:** `apps/worker/src/index.ts`

Add handler for `VIDEO_OUTPUT_POST_PROCESSING` job:
- Fetch VideoOutput with `backgroundMusic`, `startBumper`, `endBumper` relations
- Call `videoPostProcessingService.processVideo()` with:
  - `mainVideoUrl`: The edited video URL from Submagic
  - `startBumper`: `{ mediaUrl, type, duration }` if configured
  - `endBumper`: `{ mediaUrl, type, duration }` if configured
  - `music`: `{ audioUrl, volume }` if configured
  - `organizationId`: For S3 path
- Store processed video URL in VideoOutput
- **Queue the video completion job** (for transcription + bubbles):
  ```typescript
  await queueService.addVideoCompletionJob({
    heygenVideoId: videoOutput.heygenVideoId,
    videoUrl: processedVideoUrl,  // Use the post-processed URL
  });
  ```

### 7. Submagic Webhook Handler Updates
**File:** `apps/backend/app/api/webhooks/submagic/route.ts`

In `handleVideoOutputEditingSuccess()` function (around line 9-50), modify to:
- Fetch VideoOutput with `backgroundMusic`, `startBumper`, `endBumper` relations
- Check if any post-processing is needed
- If yes: queue post-processing job first (which will then queue video completion job when done)
- If no: queue video completion job directly (current behavior)

```typescript
async function handleVideoOutputEditingSuccess(projectId: string, videoUrl: string): Promise<boolean> {
  const videoOutput = await prisma.videoOutput.findFirst({
    where: { submagicProjectId: projectId },
    include: {
      submission: true,
      backgroundMusic: true,  // NEW
      startBumper: true,      // NEW
      endBumper: true,        // NEW
    },
  });

  // ... existing validation ...

  const needsPostProcessing = videoOutput.backgroundMusicId ||
                              videoOutput.startBumperId ||
                              videoOutput.endBumperId;

  if (needsPostProcessing) {
    // Queue post-processing job (bumpers + music)
    // The post-processing job will queue the video completion job when done
    await queueService.addVideoOutputPostProcessingJob({
      videoOutputId: videoOutput.id,
      editedVideoUrl: videoUrl,
    });
  } else {
    // No post-processing needed - queue video completion directly (current behavior)
    await queueService.addVideoCompletionJob({
      heygenVideoId: videoOutput.heygenVideoId,
      videoUrl: videoUrl,
    });
  }

  return true;
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `packages/database/prisma/schema.prisma` | Add music + bumper fields to VideoOutput |
| `packages/api-client/src/api.types.ts` | Add music + bumper fields to `VideoCustomizationConfig` |
| `apps/backend/components/video/VideoCustomization.tsx` | Add music + bumper selection UI sections |
| `apps/backend/app/org/[orgSlug]/submissions/[id]/videos/[videoId]/edit/page.tsx` | Update initial state, pass all new fields in mutate call |
| `apps/backend/app/api/org/[orgSlug]/submissions/[submissionId]/video/[videoId]/generate-media/route.ts` | Update schema, validation, and prisma update |
| `apps/backend/lib/config/queue.ts` | Add `VIDEO_OUTPUT_POST_PROCESSING` job type |
| `apps/worker/src/index.ts` | Add handler for new job type |
| `apps/backend/app/api/webhooks/submagic/route.ts` | Conditionally queue post-processing in `handleVideoOutputEditingSuccess()` |

## Existing Code to Reuse

- **MusicStep.tsx**: Music card UI patterns, audio preview, volume slider
- **BumpersStep.tsx**: Bumper card UI patterns, start/end sections, duration input
- **useBackgroundMusic hook**: Already available via `@/lib/api/hooks`
- **useVideoBumpers hook**: Already available via `@/lib/api/hooks`
- **videoPostProcessingService.processVideo()**: Already handles bumper concatenation + music overlay via FFmpeg
- **BackgroundMusic API**: `/api/org/[orgSlug]/background-music` endpoint exists
- **VideoBumper API**: `/api/org/[orgSlug]/video-bumpers` endpoint exists

## Post-Processing Flow (existing in standalone, reuse for edu)

The `videoPostProcessingService.processVideo()` method already handles:
1. **Bumper concatenation**: Converts image bumpers to video, concatenates start + main + end
2. **Music overlay**: Loops music to video duration, applies volume, mixes with original audio via FFmpeg `amix` filter
3. **Final upload**: Uploads processed video to S3, returns CloudFront URL
