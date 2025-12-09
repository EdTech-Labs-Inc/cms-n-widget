# Video Create Page - Progress Tracker

> **Plan Document**: [VIDEO_CREATE_PAGE_PLAN.md](./VIDEO_CREATE_PAGE_PLAN.md)
> **Last Updated**: 2025-12-08

---

## Phase A: Foundation (Database + Basic APIs)

- [x] Add Prisma schema for BackgroundMusic table
- [x] Add Prisma schema for VideoBumper table
- [x] Add Prisma schema for CaptionStyle table
- [x] Add Prisma schema for StandaloneVideo table
- [x] Add Organization relations
- [x] Run migration
- [x] Create CRUD route: `/api/org/[orgSlug]/background-music`
- [x] Create CRUD route: `/api/org/[orgSlug]/bumpers`
- [x] Create CRUD route: `/api/org/[orgSlug]/caption-styles`
- [x] Seed initial data (default caption styles)

**Status**: COMPLETE

---

## Phase B: Script Generation

- [x] Create Agenta prompt: `generate_video_script_from_prompt`
- [x] Create Agenta prompt: `generate_single_video_script_from_content`
- [x] Create route: `/api/org/[orgSlug]/video/upload-script`
- [x] Create route: `/api/org/[orgSlug]/video/generate-script`
- [x] Create route: `/api/org/[orgSlug]/video/improve-script`
- [x] Add PDF parsing support (pdf-parse package)

**Status**: COMPLETE

---

## Phase C: Core UI

- [x] Create page layout (`app/org/[orgSlug]/video/create/page.tsx`)
- [x] Create CollapsibleStep component
- [x] Create ScriptStep component
- [x] Create PreviewPanel component (basic)
- [x] Implement localStorage persistence

**Status**: COMPLETE

---

## Phase D: Selection Steps

- [x] Create CharacterStep component
- [x] Create LookStep component
- [x] Create CaptionsStep component
- [x] Create SpecialEffectsStep component
- [x] Create MusicStep component
- [x] Create BumpersStep component
- [x] Create API hooks (`useBackgroundMusic`, `useVideoBumpers`, `useCaptionStyles`)
- [x] Integrate all step components into page

**Status**: COMPLETE

---

## Phase E: Video Creation Flow

- [x] Create route: `/api/org/[orgSlug]/video/create`
- [x] Add GENERATE_STANDALONE_VIDEO job type to queue config
- [x] Add queue method (`addStandaloneVideoGenerationJob`)
- [x] Create standalone video generation service
- [x] Add worker handler for GENERATE_STANDALONE_VIDEO
- [x] Create SuccessModal component
- [x] Wire up generate button to API

**Status**: COMPLETE

---

## Phase F: Post-Processing (FFmpeg)

- [x] Create `video-postprocessing.service.ts` in worker
- [x] Implement `imageToVideo()` method
- [x] Implement `concatenateVideos()` method
- [x] Implement `overlayAudio()` method
- [x] Modify webhook handler for StandaloneVideo (HeyGen + Submagic)
- [ ] Test bumper concatenation
- [ ] Test music overlay at 15-20% volume

**Status**: IN PROGRESS (implementation complete, testing pending)

---

## Phase G: Polish & Testing

- [x] Preview panel: caption overlay preview
- [x] Preview panel: timeline button functionality
- [x] Form validation (required fields)
- [x] Error handling & user feedback
- [x] Loading states
- [ ] E2E testing

**Status**: IN PROGRESS (implementation complete, E2E testing pending)

---

## Quick Status

| Phase | Progress |
|-------|----------|
| A. Foundation | 10/10 |
| B. Script Generation | 6/6 |
| C. Core UI | 5/5 |
| D. Selection Steps | 8/8 |
| E. Video Creation Flow | 7/7 |
| F. Post-Processing | 5/7 |
| G. Polish & Testing | 5/6 |
| **Total** | **46/49** |

---

## Notes

### Phase B Notes (2025-12-08)

**API Routes Created:**
- `POST /api/org/[orgSlug]/video/upload-script` - Extracts text from uploaded files (DOCX, DOC, TXT, PDF)
- `POST /api/org/[orgSlug]/video/generate-script` - Generates script via AI (two modes: 'prompt' or 'content')
- `POST /api/org/[orgSlug]/video/improve-script` - Improves script based on user guidance

**PDF Support:**
- Added `pdf-parse` package (pure JS, Docker-compatible)
- Updated `FileExtractionService` to handle PDF mime type (`application/pdf`)
- Added `extractRawText()` method for script uploads (no AI cleaning)

**Agenta Prompts Created:**

1. **`generate_video_script_from_prompt`** - Variables: `{{userPrompt}}`, `{{languageName}}`
2. **`generate_single_video_script_from_content`** - Variables: `{{articleContent}}`, `{{languageName}}`

The improve-script route uses the existing `regenerate_video_script_prompt`.

### Phase C Notes (2025-12-08)

**Components Created:**
- `CollapsibleStep.tsx` - Reusable accordion step component with completion indicator
- `ScriptStep.tsx` - Full script input UI with 3 modes: upload script, upload content (AI generates), prompt (AI generates)
- `PreviewPanel.tsx` - Right sidebar with 9:16 preview, timeline buttons, and generate button

**Page Features:**
- 70/30 split layout as per plan
- localStorage persistence with org-specific key
- Hydration handling to prevent mismatch
- 7 collapsible steps (placeholders for steps 2-7, will be implemented in Phase D)
- Step completion indicators
- Generate button disabled until required steps complete

### Phase D Notes (2025-12-08)

**Components Created:**
- `CharacterStep.tsx` - Character group selection with paginated grid and video hover previews
- `LookStep.tsx` - Character variant (look) selection within selected group, shows voice info
- `CaptionsStep.tsx` - Caption style grid with preview images and logo indicators
- `SpecialEffectsStep.tsx` - Magic Zooms and B-Rolls toggles with percentage slider
- `MusicStep.tsx` - Background music selection with audio preview, volume control
- `BumpersStep.tsx` - Start/end bumper selection with video preview and duration input for images

**API Hooks Created (`packages/api-client/src/api/hooks/video-create-hooks.ts`):**
- `useBackgroundMusic(orgSlug)` - Fetches background music for organization
- `useVideoBumpers(orgSlug, position?)` - Fetches video bumpers, optional position filter
- `useCaptionStyles(orgSlug)` - Fetches caption styles for organization

**API Types Added (`packages/api-client/src/api.types.ts`):**
- `BackgroundMusic` interface
- `VideoBumper` interface
- `CaptionStyle` interface

**API Client Functions Added (`packages/api-client/src/api/client.ts`):**
- `backgroundMusicApi.getAll(orgSlug)`
- `videoBumpersApi.getAll(orgSlug, position?)`
- `captionStylesApi.getAll(orgSlug)`

**Page Updates:**
- Expanded draft state to include thumbnail URLs for preview panel
- Integrated all selection step components
- Connected handlers for all draft state updates
- Preview panel now shows selected character/bumper thumbnails

### Phase E Notes (2025-12-08)

**API Route Created:**
- `POST /api/org/[orgSlug]/video/create` - Creates StandaloneVideo record and queues generation job

**Queue Config Updated (`apps/backend/lib/config/queue.ts`):**
- Added `GENERATE_STANDALONE_VIDEO` job type

**Queue Service Updated (`apps/backend/lib/services/core/queue.service.ts`):**
- Added `addStandaloneVideoGenerationJob()` method

**New Service Created (`apps/backend/lib/services/media/standalone-video.service.ts`):**
- `StandaloneVideoService.generateVideo()` - Handles video generation flow:
  1. Generates audio with ElevenLabs
  2. Uploads audio to S3
  3. Calls HeyGen with audio URL for lip-sync video generation
  4. Updates StandaloneVideo record with heygenVideoId

**Worker Handler Added (`apps/worker/src/index.ts`):**
- Added case for `JobTypes.GENERATE_STANDALONE_VIDEO`
- Calls `standaloneVideoService.generateVideo()`

**Frontend Components:**
- `SuccessModal.tsx` - Shows success message with options to create another or go to dashboard
- Updated `page.tsx` with:
  - `useCreateStandaloneVideo` hook integration
  - Toast notifications for validation errors
  - localStorage cleared on successful submission
  - Success modal displayed after API success

**API Client Updated (`packages/api-client/src/api/client.ts`):**
- Added `CreateStandaloneVideoRequest` interface
- Added `CreateStandaloneVideoResponse` interface
- Added `standaloneVideoApi.create()` method

**API Hooks Updated (`packages/api-client/src/api/hooks/video-create-hooks.ts`):**
- Added `useCreateStandaloneVideo()` mutation hook

### Phase F Notes (2025-12-08)

**New Service Created (`apps/backend/lib/services/media/video-postprocessing.service.ts`):**
- `VideoPostProcessingService.processVideo()` - Main method that orchestrates post-processing:
  1. Downloads main video from Submagic
  2. Prepares bumpers (images → video conversion, video re-encoding)
  3. Concatenates start bumper + video + end bumper
  4. Overlays background music at specified volume (loops if needed)
  5. Uploads final video to S3
  6. Returns CloudFront URL and duration

**Helper Methods:**
- `imageToVideo()` - Converts image bumper to video with specified duration, scales/pads to match main video dimensions
- `concatenateVideos()` - Uses FFmpeg concat demuxer for fast concatenation
- `overlayAudio()` - Mixes background music with original audio using amix filter
- `reencodeVideo()` - Re-encodes video bumpers to match main video specs
- `getVideoInfo()` - Gets video dimensions and duration via ffprobe

**HeyGen Webhook Updated (`apps/backend/app/api/webhooks/heygen/route.ts`):**
- Added `handleStandaloneVideoSuccess()` - Handles StandaloneVideo completion:
  - Looks up StandaloneVideo by heygenVideoId
  - Gets caption style's Submagic template
  - Uploads to Submagic for AI editing (captions, zooms, B-rolls)
  - Stores Submagic project ID
- Updated `handleVideoFailure()` - Also checks for StandaloneVideo if no VideoOutput found

**Submagic Webhook Updated (`apps/backend/app/api/webhooks/submagic/route.ts`):**
- Added `handleStandaloneVideoEditingSuccess()` - Handles StandaloneVideo completion from Submagic:
  - Checks if post-processing is needed (bumpers or music configured)
  - If yes: queues `POST_PROCESS_STANDALONE_VIDEO` job
  - If no: uploads edited video directly to S3 and marks COMPLETED
- Updated `handleEditingFailure()` - Also checks for StandaloneVideo

**Queue Config Updated (`apps/backend/lib/config/queue.ts`):**
- Added `POST_PROCESS_STANDALONE_VIDEO` job type

**Queue Service Updated (`apps/backend/lib/services/core/queue.service.ts`):**
- Added `addStandaloneVideoPostProcessingJob()` method

**Worker Handler Added (`apps/worker/src/index.ts`):**
- Added case for `JobTypes.POST_PROCESS_STANDALONE_VIDEO`
- Fetches StandaloneVideo with bumper and music details
- Builds post-processing params
- Calls `videoPostProcessingService.processVideo()`
- Updates StandaloneVideo with final URL and duration, marks as COMPLETED

**Complete Flow:**
1. StandaloneVideoService → Generates audio → Calls HeyGen
2. HeyGen webhook → Uploads to Submagic with caption style template
3. Submagic webhook → If bumpers/music: queue post-processing, else: upload directly
4. Worker post-processing → FFmpeg adds bumpers/music → Upload final video
5. StandaloneVideo marked COMPLETED with final videoUrl

### Phase G Notes (2025-12-08)

**Preview Panel Enhancements:**
- Caption preview image now overlays on character preview in the video section
- Caption style name shown with Type icon label
- Character name displayed at bottom of preview
- Video bumpers can now play inline in preview (autoplay, muted, looped)
- Timeline buttons show green dot indicators when bumpers are selected
- Start/End bumper type labels shown in preview

**Form Validation:**
- CollapsibleStep component updated with `isRequired` prop
- Required steps (1-4) show amber "Required" badge when incomplete
- Incomplete required steps have amber border highlight when collapsed
- Alert icon replaces step number for incomplete required steps
- PreviewPanel shows amber warning box listing missing required items

**Loading States:**
- Hydration loading state improved with spinner and message
- Full-screen generating overlay when video creation is in progress
- Overlay shows animated spinner, status message, and processing indicator
- Prevents user interaction during generation

**Error Handling:**
- Toast notifications for validation errors before generation
- Toast notifications for API errors during generation
- Step components have consistent error states for API failures
- Error messages include dismissible close buttons

**Draft State Additions:**
- `captionStyleName` - For displaying caption style label in preview
- `startBumperMediaUrl`, `startBumperType` - For video bumper preview playback
- `endBumperMediaUrl`, `endBumperType` - For video bumper preview playback

**Component Updates:**
- `PreviewPanel.tsx` - Enhanced with caption overlay, video bumper preview, timeline indicators
- `CollapsibleStep.tsx` - Added required field indicator and amber highlighting
- `CaptionsStep.tsx` - Now passes caption style name to parent
- `BumpersStep.tsx` - Now passes mediaUrl and type for video preview
- `page.tsx` - Added generating overlay, improved loading state, expanded draft state
