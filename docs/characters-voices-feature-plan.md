# Characters & Voices Database Feature Plan

## Summary
Create database-backed Character and Voice tables to replace the current HeyGen API-based avatar fetching. Characters will be organization-scoped, linked to ElevenLabs voices, and used for video generation. Voices can also exist independently for podcast/audio generation. VoiceSelector will be updated to use database voices with audio preview support.

## Progress Tracking

| Step | Task | Status |
|------|------|--------|
| 1 | Add Voice and Character models to Prisma schema | DONE |
| 2 | Run database migration | DONE |
| 3 | Create seed file template for characters and voices | DONE |
| 4 | Create API route for Characters (GET /api/org/[orgSlug]/characters) | DONE |
| 5 | Create API route for Voices (GET /api/org/[orgSlug]/voices) | DONE |
| 6 | Add API client methods (getCharacters, getVoices) | DONE |
| 7 | Create React Query hooks (useCharacters, useVoices) | DONE |
| 8 | Update VideoCustomization component to use DB characters | DONE |
| 9 | Update VoiceSelector component with DB voices and audio preview | DONE |
| 10 | Update video-media.service.ts to use correct ElevenLabs voiceId | DONE |
| 11 | Update generate-media route to validate character | DONE |
| 12 | Update podcast and interactive-podcast services to use DB voices | DONE |
| 13 | Delete HeyGen avatar fetching code and hooks | DONE |
| 14 | Update page components to pass orgSlug to selectors | DONE |

---

## Key Design Decisions
1. **Voice preview**: VoiceSelector will include audio preview button using `previewAudioUrl`
2. **Podcast voices**: Keep existing host/guest selection pattern, but pull from database
3. **Default selection**: Podcasts/interactive podcasts auto-select defaults. Videos require explicit selection (no default)
4. **Character types**: Support both `avatar` and `talking_photo` types for flexibility

---

## Database Schema Changes

### File: `packages/database/prisma/schema.prisma`

```prisma
model Voice {
  id                String       @id @default(uuid())
  name              String
  elevenlabsVoiceId String
  description       String?      @db.Text
  previewAudioUrl   String?
  gender            String?      // 'male' | 'female' | 'neutral'

  // Organization scoping
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Reverse relation to characters using this voice
  characters Character[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([organizationId, elevenlabsVoiceId])
  @@index([organizationId])
  @@map("voices")
}

model Character {
  id          String  @id @default(uuid())
  name        String
  description String? @db.Text
  thumbnailUrl String?

  // HeyGen identifiers
  heygenAvatarId      String  // The actual avatar/talking_photo ID for HeyGen API
  heygenAvatarGroupId String? // The group ID for reference (optional, mainly for avatars)
  characterType       String  @default("avatar") // 'avatar' | 'talking_photo'

  gender String? // 'male' | 'female'

  // Linked voice (required for video generation)
  voiceId String
  voice   Voice  @relation(fields: [voiceId], references: [id], onDelete: Restrict)

  // Organization scoping
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([organizationId, heygenAvatarId])
  @@index([organizationId])
  @@index([voiceId])
  @@map("characters")
}
```

---

## Implementation Details

### Phase 1: Database & Schema (DONE)

1. **Added Prisma schema models** for `Voice` and `Character`
   - File: `packages/database/prisma/schema.prisma`

2. **Ran migration** via `prisma db push`

3. **Created seed file template** for manual population
   - File: `packages/database/prisma/seeds/characters-voices.ts`

---

### Phase 2: API Layer (DONE)

4. **Created API route for Characters**
   - File: `apps/backend/app/api/org/[orgSlug]/characters/route.ts`
   - `GET` - List all characters for organization with linked voice

5. **Created API route for Voices**
   - File: `apps/backend/app/api/org/[orgSlug]/voices/route.ts`
   - `GET` - List all voices for organization

6. **Added API client methods**
   - File: `packages/api-client/src/api/client.ts`
   - Added `charactersApi.getAll(orgSlug)` and `voicesApi.getAll(orgSlug)`

7. **Added types**
   - File: `packages/api-client/src/api.types.ts`
   - Added `Character` and `Voice` interfaces

---

### Phase 3: Frontend Components (DONE)

7. **Create React Query hooks** (DONE)
   - File: `packages/api-client/src/api/hooks/character-hooks.ts`
   ```typescript
   useCharacters(orgSlug: string)
   useVoices(orgSlug: string)
   ```

8. **Update VideoCustomization component**
   - File: `apps/backend/components/video/VideoCustomization.tsx`
   - Replace `useHeygenAvatars()` with `useCharacters(orgSlug)`
   - Display characters from database instead of HeyGen API
   - Character card shows thumbnail, name, linked voice name
   - **No default selection** - require user to explicitly select a character
   - Update `VideoCustomizationConfig` interface:
   ```typescript
   interface VideoCustomizationConfig {
     characterId: string;        // Our Character table ID
     heygenAvatarId: string;     // The actual HeyGen avatar/talking_photo ID
     characterType: 'avatar' | 'talking_photo';
     voiceId: string;            // ElevenLabs voice ID from linked Voice
     enableMagicZooms: boolean;
     enableMagicBrolls: boolean;
     magicBrollsPercentage: number;
     generateBubbles: boolean;
   }
   ```

9. **Update VoiceSelector component**
   - File: `apps/backend/components/audio/VoiceSelector.tsx`
   - Replace `ELEVENLABS_VOICES` import with `useVoices(orgSlug)` hook
   - Add audio preview button to each VoiceCard
   - Keep existing host/guest selection pattern (mode='podcast')
   - **Auto-select defaults** for podcasts/interactive podcasts

---

### Phase 4: Backend Services (DONE)

10. **Update video-media.service.ts**
    - File: `apps/backend/lib/services/media/video-media.service.ts`
    - Use ElevenLabs voiceId from customization directly (now correct ID)
    - Pass `heygenAvatarId` to HeyGen service
    - Remove logic that fetches voice from HeyGen avatar details

11. **Update generate-media route**
    - File: `apps/backend/app/api/org/[orgSlug]/submissions/[submissionId]/video/[videoId]/generate-media/route.ts`
    - Accept `heygenAvatarId` in addition to `characterId`
    - Validate character exists in organization

12. **Update podcast services to use DB voices**
    - File: `apps/backend/lib/services/media/podcast-media.service.ts`
    - File: `apps/backend/lib/services/media/interactive-podcast-media.service.ts`

---

### Phase 5: Cleanup (DONE)

13. **Remove HeyGen avatar fetching**
    - Delete: `apps/backend/app/api/heygen/avatars/route.ts`
    - Delete: `packages/api-client/src/api/hooks/heygen-hooks.ts`
    - Delete: `apps/backend/lib/services/cache/avatar-cache.service.ts`
    - Remove `listAvatars()` from `heygen.service.ts`

14. **Update page components to pass orgSlug**
    - File: `apps/backend/app/org/[orgSlug]/submissions/[id]/videos/[videoId]/edit/page.tsx`
    - File: `apps/backend/app/org/[orgSlug]/submissions/[id]/podcasts/[podcastId]/edit/page.tsx`
    - File: `apps/backend/app/org/[orgSlug]/submissions/[id]/interactive-podcasts/[ipId]/edit/page.tsx`

---

## Files Modified/Created So Far

| File | Action |
|------|--------|
| `packages/database/prisma/schema.prisma` | Added Voice and Character models |
| `packages/database/prisma/seeds/characters-voices.ts` | Created seed template |
| `apps/backend/app/api/org/[orgSlug]/characters/route.ts` | Created GET endpoint |
| `apps/backend/app/api/org/[orgSlug]/voices/route.ts` | Created GET endpoint |
| `packages/api-client/src/api/client.ts` | Added charactersApi, voicesApi |
| `packages/api-client/src/api.types.ts` | Added Character, Voice interfaces |

## Files To Delete (Phase 5)

| File | Reason |
|------|--------|
| `apps/backend/app/api/heygen/avatars/route.ts` | No longer fetching all HeyGen avatars |
| `apps/backend/lib/services/cache/avatar-cache.service.ts` | Avatar caching no longer needed |
| `packages/api-client/src/api/hooks/heygen-hooks.ts` | Replace with character-hooks |
| `packages/config/src/voices.ts` | Replace hardcoded voices with DB |

---

## Data Model Summary

```
Organization
    ├── Voice (many)
    │       └── elevenlabsVoiceId (for audio generation)
    │
    └── Character (many)
            ├── heygenAvatarId (for video generation)
            ├── heygenAvatarGroupId (reference)
            └── voiceId → Voice (foreign key)
```

## Generation Flow After Changes

### Video Generation
1. User selects Character on VideoCustomization page (required, no default)
2. Frontend sends: `{ characterId, heygenAvatarId, characterType, voiceId }` (all from Character record)
3. Backend:
   - Validates character belongs to organization
   - Generates audio with ElevenLabs using `voiceId` (correct ElevenLabs ID)
   - Uploads audio to S3
   - Calls HeyGen with `heygenAvatarId`, `characterType`, and `audioUrl`

### Podcast Generation
1. User reviews transcript, selects Host + Guest voices (defaults auto-selected from DB)
2. Frontend sends: `{ interviewerVoiceId, guestVoiceId }` (ElevenLabs IDs from Voice table)
3. Backend generates each segment with appropriate ElevenLabs voice

### Interactive Podcast Generation
1. User reviews script, selects Narrator voice (default auto-selected from DB)
2. Frontend sends: `{ voiceId }` (ElevenLabs ID from Voice table)
3. Backend generates audio with selected ElevenLabs voice

---

## Seed File Info

Location: `packages/database/prisma/seeds/characters-voices.ts`

Content team provided:
- **Vaibhav**: Group ID `145b79e93c224345900fbb52faa8c042`, Voice ID `UZ43nGa9SDlDnGtiiY5Q`
- **Kuldeep**: Group ID `b2ff33aec2664ce6a1cf269b6f7b4d56`, Voice ID `9f2lb1UszO7GDX3Md1QK`
- **Yash**: Group ID `9ee7e93455434301a7671188281938e5`, Voice ID `iZZ7Mcbyhw8wjwQ3HhEy`
- **Mumpy**: Group ID `f5a04ecab49d4cd49c456db1cd22f77e`, Voice ID `aeqiqPUmY3kTgXiu21cB`

To run seed: `npx tsx prisma/seeds/characters-voices.ts`
