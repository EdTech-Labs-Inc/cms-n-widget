# Video Create Page - Implementation Plan

## Overview
Build a comprehensive standalone video creation page at `/org/[orgSlug]/video/create` with a 70/30 split layout:
- **Left (70%)**: 7 collapsible step components for video customization
- **Right (30%)**: Live preview panel with timeline and generate button

**Key Design Decisions:**
- Videos are **standalone** (no Article/Submission relationship required)
- Bubbles always **disabled** (generateBubbles = false)
- B-roll + Magic Zooms combined into **"Special Effects"** section
- All resources (music, bumpers, caption styles) are **organization-specific**
- State persisted via **localStorage** (cleared on successful generation)

---

## Architecture Summary

### Video Dimensions
- **720x1280** (portrait 9:16) via HeyGen

### Processing Flow
```
Script → ElevenLabs Audio → HeyGen Video → Submagic AI Editing → FFmpeg (bumpers/music) → Final Video
```

### Existing Patterns to Leverage
- **FFmpeg**: `fluent-ffmpeg` in worker (see `apps/backend/lib/services/media/podcast.service.ts`)
- **File parsing**: `.doc, .docx, .txt` (add `.pdf` support)
- **Agenta prompts**: For script generation/modification
- **VideoCustomization**: Character selection patterns

---

## Stage 1: Database Schema Updates

### 1.1 New Tables

**File to modify**: `packages/database/prisma/schema.prisma`

```prisma
model BackgroundMusic {
  id              String        @id @default(uuid())
  name            String
  previewAudioUrl String        // Short preview for selection UI
  audioUrl        String        // Full audio for video overlay
  duration        Int?          // Duration in seconds

  organizationId  String
  organization    Organization  @relation(fields: [organizationId], references: [id])

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([organizationId])
  @@map("background_music")
}

model VideoBumper {
  id              String        @id @default(uuid())
  name            String
  type            String        // 'image' | 'video'
  position        String        // 'start' | 'end' | 'both'
  mediaUrl        String        // CloudFront URL
  thumbnailUrl    String?       // Preview thumbnail
  duration        Int?          // Videos: actual duration. Images: default duration suggestion

  organizationId  String
  organization    Organization  @relation(fields: [organizationId], references: [id])

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([organizationId])
  @@map("video_bumpers")
}

model CaptionStyle {
  id               String        @id @default(uuid())
  name             String
  submagicTemplate String        // Submagic template name (e.g., 'jblk')
  previewImageUrl  String?       // Preview of caption appearance
  logoUrl          String?       // Logo to overlay on video
  logoPosition     String?       // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

  organizationId   String
  organization     Organization  @relation(fields: [organizationId], references: [id])

  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  @@index([organizationId])
  @@map("caption_styles")
}

model StandaloneVideo {
  id                    String       @id @default(uuid())
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id])

  status                OutputStatus @default(PENDING)

  // Script & Content
  title                 String?
  script                String       @db.Text
  sourceType            String       // 'prompt' | 'script_file' | 'content_file'

  // Character/Voice
  characterId           String       // Our DB Character ID
  heygenAvatarId        String       // HeyGen avatar/talking_photo ID
  heygenCharacterType   String       // 'avatar' | 'talking_photo'
  voiceId               String       // ElevenLabs voice ID

  // Caption Style
  captionStyleId        String?
  captionStyle          CaptionStyle? @relation(fields: [captionStyleId], references: [id])

  // Special Effects
  enableMagicZooms      Boolean      @default(true)
  enableMagicBrolls     Boolean      @default(true)
  magicBrollsPercentage Int          @default(40)

  // Music
  backgroundMusicId     String?
  backgroundMusic       BackgroundMusic? @relation(fields: [backgroundMusicId], references: [id])
  backgroundMusicVolume Float        @default(0.15) // 15%

  // Bumpers
  startBumperId         String?
  startBumper           VideoBumper? @relation("StartBumper", fields: [startBumperId], references: [id])
  startBumperDuration   Int?         // For image bumpers: display duration in seconds
  endBumperId           String?
  endBumper             VideoBumper? @relation("EndBumper", fields: [endBumperId], references: [id])
  endBumperDuration     Int?

  // Processing IDs
  heygenVideoId         String?
  submagicProjectId     String?
  elevenlabsAudioUrl    String?

  // Output
  videoUrl              String?      // Final CloudFront URL
  thumbnailUrl          String?
  duration              Int?

  // Meta
  error                 String?      @db.Text
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt

  @@index([organizationId])
  @@index([heygenVideoId])
  @@index([submagicProjectId])
  @@map("standalone_videos")
}
```

### 1.2 Organization Relations Update

Add to Organization model:
```prisma
backgroundMusic   BackgroundMusic[]
videoBumpers      VideoBumper[]
captionStyles     CaptionStyle[]
standaloneVideos  StandaloneVideo[]
```

---

## Stage 2: Backend API Routes

### 2.1 Resource CRUD Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/org/[orgSlug]/background-music` | GET | List org's music |
| `/api/org/[orgSlug]/background-music` | POST | Upload new music |
| `/api/org/[orgSlug]/bumpers` | GET | List org's bumpers |
| `/api/org/[orgSlug]/bumpers` | POST | Upload new bumper |
| `/api/org/[orgSlug]/caption-styles` | GET | List org's caption styles |
| `/api/org/[orgSlug]/caption-styles` | POST | Create caption style |

**Files to create**:
- `apps/backend/app/api/org/[orgSlug]/background-music/route.ts`
- `apps/backend/app/api/org/[orgSlug]/bumpers/route.ts`
- `apps/backend/app/api/org/[orgSlug]/caption-styles/route.ts`

### 2.2 Script Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/org/[orgSlug]/video/upload-script` | POST | Upload file, extract text, return script |
| `/api/org/[orgSlug]/video/generate-script` | POST | Generate script from prompt OR content file |
| `/api/org/[orgSlug]/video/improve-script` | POST | AI-improve existing script with guidance |

**Files to create**:
- `apps/backend/app/api/org/[orgSlug]/video/upload-script/route.ts`
- `apps/backend/app/api/org/[orgSlug]/video/generate-script/route.ts`
- `apps/backend/app/api/org/[orgSlug]/video/improve-script/route.ts`

### 2.3 Video Create Route

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/org/[orgSlug]/video/create` | POST | Create StandaloneVideo, queue generation |

**Request body**:
```typescript
interface CreateVideoRequest {
  script: string;
  sourceType: 'prompt' | 'script_file' | 'content_file';
  characterId: string;
  heygenAvatarId: string;
  heygenCharacterType: 'avatar' | 'talking_photo';
  voiceId: string;
  captionStyleId: string;
  enableMagicZooms: boolean;
  enableMagicBrolls: boolean;
  magicBrollsPercentage: number;
  backgroundMusicId?: string;
  backgroundMusicVolume?: number;
  startBumperId?: string;
  startBumperDuration?: number;
  endBumperId?: string;
  endBumperDuration?: number;
}
```

**File to create**: `apps/backend/app/api/org/[orgSlug]/video/create/route.ts`

---

## Stage 3: Agenta Prompts

### 3.1 New Prompt: `generate_video_script_from_prompt`
- **Input**: User's prompt describing desired video topic/style
- **Output**: Single video script (ready for TTS)

### 3.2 New Prompt: `generate_single_video_script_from_content`
- **Input**: Full article/content text
- **Output**: Single comprehensive video script
- **Note**: Different from existing `generate_video_scripts_prompt` which creates multiple scripts

### 3.3 Existing Prompt to Reuse: `regenerate_video_script_prompt`
- Used for AI-powered script improvements with user guidance

---

## Stage 4: Frontend Components

### 4.1 Page Layout

**File**: `apps/backend/app/org/[orgSlug]/video/create/page.tsx`

```tsx
// 70/30 split layout
<div className="flex gap-6 min-h-screen">
  <div className="w-[70%]">
    {/* 7 Collapsible Steps */}
  </div>
  <div className="w-[30%] sticky top-0">
    {/* Preview Panel */}
  </div>
</div>
```

**State shape for localStorage**:
```typescript
interface VideoCreateDraft {
  script: string;
  scriptSource: 'prompt' | 'script_file' | 'content_file' | null;
  characterGroupId: string | null;
  characterId: string | null;
  heygenAvatarId: string | null;
  heygenCharacterType: 'avatar' | 'talking_photo' | null;
  voiceId: string | null;
  captionStyleId: string | null;
  enableMagicZooms: boolean;
  enableMagicBrolls: boolean;
  magicBrollsPercentage: number;
  backgroundMusicId: string | null;
  backgroundMusicVolume: number;
  startBumperId: string | null;
  startBumperDuration: number | null;
  endBumperId: string | null;
  endBumperDuration: number | null;
  lastUpdated: string;
}
```

### 4.2 Collapsible Step Component

**File**: `apps/backend/components/video-create/CollapsibleStep.tsx`

Props:
- `stepNumber: number`
- `title: string`
- `isExpanded: boolean`
- `onToggle: () => void`
- `isComplete: boolean`
- `isDisabled?: boolean`
- `children: ReactNode`

### 4.3 Step 1: Script

**File**: `apps/backend/components/video-create/ScriptStep.tsx`

Features:
- **Upload Script** button → file picker (`.doc, .docx, .txt, .pdf`) → extract text → populate textarea
- **Upload Content** button → file picker → send to AI → generate script → populate textarea
- **Generate from Prompt** → text input → send to AI → generate script → populate textarea
- **Script textarea** → editable, character count
- **AI Prompt box** → input for improvement instructions → send to AI → update script

Uses existing patterns from:
- `apps/backend/components/script-editor/ScriptEditor.tsx`
- `apps/backend/components/script-editor/AIPromptBox.tsx`

### 4.4 Step 2: Character

**File**: `apps/backend/components/video-create/CharacterStep.tsx`

- Group selection grid (paginated, 6 per page)
- Extract from `apps/backend/components/video/VideoCustomization.tsx` lines 290-325

### 4.5 Step 3: Background & Outfit (Look)

**File**: `apps/backend/components/video-create/LookStep.tsx`

- Character selection within selected group
- Empty state when no group selected in Step 2
- Sets `characterId`, `heygenAvatarId`, `heygenCharacterType`, `voiceId`

### 4.6 Step 4: Captions

**File**: `apps/backend/components/video-create/CaptionsStep.tsx`

- Grid of CaptionStyle options (from API)
- Each shows preview image
- Indicates if logo overlay included

### 4.7 Step 5: Special Effects (B-Roll + Zooms)

**File**: `apps/backend/components/video-create/SpecialEffectsStep.tsx`

- **Magic Zooms** checkbox
- **Magic B-Rolls** checkbox
- **B-Roll Percentage** slider (0-100%, only shown when B-rolls enabled)

### 4.8 Step 6: Music

**File**: `apps/backend/components/video-create/MusicStep.tsx`

- List of BackgroundMusic options (from API)
- Audio preview player for each
- "None" option
- Volume slider (when music selected)

### 4.9 Step 7: Bumpers

**File**: `apps/backend/components/video-create/BumpersStep.tsx`

- **Start Bumper** selection (grid of options + "None")
- **Start Duration** input (only for image bumpers)
- **End Bumper** selection (grid of options + "None")
- **End Duration** input (only for image bumpers)

### 4.10 Preview Panel

**File**: `apps/backend/components/video-create/PreviewPanel.tsx`

- **Preview area** (720x1280 aspect ratio container):
  - Placeholder state before look selected
  - Character thumbnail/preview when look selected
  - Caption style overlay preview when caption selected
- **Timeline** (simple buttons):
  - [Start] → shows start bumper preview
  - [Video] → shows character preview
  - [End] → shows end bumper preview
- **Generate button**:
  - Disabled until: script filled, character selected, look selected, caption selected
  - Shows loading state during submission

---

## Stage 5: Worker Updates (FFmpeg Integration)

### 5.1 New Service: Video Post-Processing

**File**: `apps/worker/src/services/video-postprocessing.service.ts`

Following pattern from `apps/backend/lib/services/media/podcast.service.ts`:

```typescript
import ffmpeg from 'fluent-ffmpeg';

class VideoPostProcessingService {
  /**
   * Add bumpers and music overlay to video
   */
  async processVideo(params: {
    videoUrl: string;
    startBumperUrl?: string;
    startBumperDuration?: number; // for images
    endBumperUrl?: string;
    endBumperDuration?: number;
    musicUrl?: string;
    musicVolume?: number; // 0-1
  }): Promise<string> {
    // 1. Download video
    // 2. If start bumper: convert image to video if needed, concatenate
    // 3. If end bumper: convert image to video if needed, concatenate
    // 4. If music: overlay at specified volume
    // 5. Upload to S3, return CloudFront URL
  }

  /**
   * Convert image to video with specified duration
   */
  private async imageToVideo(imageUrl: string, duration: number): Promise<string> {
    // Use ffmpeg to create video from image
  }

  /**
   * Concatenate videos
   */
  private async concatenateVideos(videoUrls: string[]): Promise<string> {
    // Use ffmpeg concat filter
  }

  /**
   * Overlay audio on video
   */
  private async overlayAudio(videoUrl: string, audioUrl: string, volume: number): Promise<string> {
    // Use ffmpeg audio mix filter
  }
}
```

### 5.2 Modified Webhook Handler

After Submagic completion, check if video is a StandaloneVideo:
- If yes and has bumpers/music → run post-processing
- Update StandaloneVideo with final URL

**File to modify**: `apps/backend/lib/services/media/video-webhook.service.ts`

### 5.3 New Job Type

Add to `apps/backend/lib/config/queue.ts`:
```typescript
GENERATE_STANDALONE_VIDEO = 'generate-standalone-video'
```

---

## Stage 6: API Hooks & State Management

### 6.1 New Hooks

**File**: `packages/api-client/src/api/hooks/video-create-hooks.ts`

```typescript
// Resource fetching
export function useBackgroundMusic(orgSlug: string)
export function useVideoBumpers(orgSlug: string)
export function useCaptionStyles(orgSlug: string)

// Script operations
export function useUploadScript(orgSlug: string)
export function useGenerateScript(orgSlug: string)
export function useImproveScript(orgSlug: string)

// Video creation
export function useCreateVideo(orgSlug: string)
```

### 6.2 localStorage Persistence

In page component:
```typescript
const STORAGE_KEY = `video-create-draft-${orgSlug}`;

// Load on mount
useEffect(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) setDraft(JSON.parse(saved));
}, []);

// Save on change
useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}, [draft]);

// Clear on success
const handleSuccess = () => {
  localStorage.removeItem(STORAGE_KEY);
  router.push(`/org/${orgSlug}/dashboard`);
};
```

---

## Stage 7: Success Flow

### 7.1 Success Modal

**File**: `apps/backend/components/video-create/SuccessModal.tsx`

- Title: "Video Queued for Generation"
- Message: "Your video has been queued. Generation typically takes ~20 minutes."
- "OK" button → redirect to dashboard

---

## Implementation Phases

### Phase A: Foundation (Database + Basic APIs)
- [ ] 1.1 Add Prisma schema for new tables
- [ ] 1.2 Run migration
- [ ] 2.1 Create CRUD routes for BackgroundMusic
- [ ] 2.1 Create CRUD routes for VideoBumper
- [ ] 2.1 Create CRUD routes for CaptionStyle
- [ ] Seed initial data (default caption styles, sample music/bumpers)

### Phase B: Script Generation
- [ ] 3.1 Create Agenta prompt: `generate_video_script_from_prompt`
- [ ] 3.2 Create Agenta prompt: `generate_single_video_script_from_content`
- [ ] 2.2 Create upload-script route (file → text extraction)
- [ ] 2.2 Create generate-script route (prompt/content → AI script)
- [ ] 2.2 Create improve-script route (reuse existing pattern)
- [ ] Add PDF parsing support

### Phase C: Core UI
- [ ] 4.1 Create page layout with 70/30 split
- [ ] 4.2 Create CollapsibleStep component
- [ ] 4.3 Create ScriptStep component
- [ ] 4.10 Create PreviewPanel component (basic version)
- [ ] 6.2 Implement localStorage persistence

### Phase D: Selection Steps
- [ ] 4.4 Create CharacterStep component
- [ ] 4.5 Create LookStep component
- [ ] 4.6 Create CaptionsStep component
- [ ] 4.7 Create SpecialEffectsStep component
- [ ] 4.8 Create MusicStep component
- [ ] 4.9 Create BumpersStep component
- [ ] 6.1 Create API hooks for all resources

### Phase E: Video Creation Flow
- [ ] 2.3 Create video/create route
- [ ] 5.3 Add GENERATE_STANDALONE_VIDEO job type
- [ ] Create standalone video generation service
- [ ] 7.1 Create SuccessModal component
- [ ] Wire up generate button

### Phase F: Post-Processing (FFmpeg)
- [ ] 5.1 Create video-postprocessing.service.ts
- [ ] 5.2 Modify webhook handler for StandaloneVideo
- [ ] Test bumper concatenation
- [ ] Test music overlay

### Phase G: Polish & Testing
- [ ] Preview panel: caption overlay preview
- [ ] Preview panel: timeline functionality
- [ ] Form validation
- [ ] Error handling
- [ ] E2E testing

---

## Critical Files Reference

| Purpose | Path |
|---------|------|
| Prisma Schema | `packages/database/prisma/schema.prisma` |
| Create Page | `apps/backend/app/org/[orgSlug]/video/create/page.tsx` |
| VideoCustomization (reference) | `apps/backend/components/video/VideoCustomization.tsx` |
| ScriptEditor (reference) | `apps/backend/components/script-editor/ScriptEditor.tsx` |
| AIPromptBox (reference) | `apps/backend/components/script-editor/AIPromptBox.tsx` |
| Podcast Service (FFmpeg pattern) | `apps/backend/lib/services/media/podcast.service.ts` |
| Video Webhook Service | `apps/backend/lib/services/media/video-webhook.service.ts` |
| HeyGen Service | `apps/backend/lib/services/external/heygen.service.ts` |
| Submagic Service | `apps/backend/lib/services/external/submagic.service.ts` |
| Worker Dockerfile | `apps/worker/Dockerfile` |
| Queue Config | `apps/backend/lib/config/queue.ts` |

---

## Progress Tracker

| Phase | Status | Notes |
|-------|--------|-------|
| A. Foundation | Not Started | |
| B. Script Generation | Not Started | |
| C. Core UI | Not Started | |
| D. Selection Steps | Not Started | |
| E. Video Creation Flow | Not Started | |
| F. Post-Processing | Not Started | |
| G. Polish & Testing | Not Started | |
