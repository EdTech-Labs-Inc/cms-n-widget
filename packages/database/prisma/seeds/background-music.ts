/**
 * Background Music Seed Data
 *
 * Instructions:
 * 1. Fill in the organizationId for your organization
 * 2. Add music entries with:
 *    - name: Display name for the track
 *    - previewAudioUrl: Short preview URL for selection UI
 *    - audioUrl: Full audio URL for video overlay
 *    - duration: Duration in seconds (optional)
 * 3. Run: npx tsx prisma/seeds/background-music.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Replace with your actual organization ID
const ORGANIZATION_ID = 'c428421a-c1ab-48da-998e-18bc76d4852a';

/**
 * Background music tracks to seed
 *
 * Add your music tracks here with the following structure:
 * - name: Display name for the track
 * - previewAudioUrl: Short preview for selection UI (e.g., first 15-30 seconds)
 * - audioUrl: Full audio file URL for video overlay
 * - duration: Duration in seconds (optional, but recommended)
 */
export const musicToSeed = [
  {
    name: 'Soft Inspiring',
    previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765272059/soft-inspiring-corporate-background-music-409687_vdmpz3.mp3', // TODO: Replace with actual preview URL
    audioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765272059/soft-inspiring-corporate-background-music-409687_vdmpz3.mp3', // TODO: Replace with actual full track URL
    duration: 149, // Duration in seconds
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Soft Corporate Presentation',
    previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765272059/soft-corporate-presentation-background-music-434437_ik0whj.mp3', // TODO: Replace with actual preview URL
    audioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765272059/soft-corporate-presentation-background-music-434437_ik0whj.mp3', // TODO: Replace with actual full track URL
    duration: 153, // Duration in seconds
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Soft Corporate Background 1',
    previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765272058/soft-corporate-background-music-441931_wfpsuw.mp3', // TODO: Replace with actual preview URL
    audioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765272058/soft-corporate-background-music-441931_wfpsuw.mp3', // TODO: Replace with actual full track URL
    duration: 107, // Duration in seconds
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Romantic Background 1',
    previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765272058/mixkit-romantic-05-759_koa46w.mp3', // TODO: Replace with actual preview URL
    audioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765272058/mixkit-romantic-05-759_koa46w.mp3', // TODO: Replace with actual full track URL
    duration: 112, // Duration in seconds
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Romantic Background 2',
    previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765272057/mixkit-romantic-659_g3svjb.mp3', // TODO: Replace with actual preview URL
    audioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765272057/mixkit-romantic-659_g3svjb.mp3', // TODO: Replace with actual full track URL
    duration: 158, // Duration in seconds
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Soft Corporate Background 2',
    previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765272058/soft-corporate-background-music-441931_2_xkwcme.mp3', // TODO: Replace with actual preview URL
    audioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765272058/soft-corporate-background-music-441931_2_xkwcme.mp3', // TODO: Replace with actual full track URL
    duration: 107, // Duration in seconds
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Soft Corporate Background 3',
    previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765272057/soft-corporate-background-music-441931_1_f9nfwr.mp3', // TODO: Replace with actual preview URL
    audioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765272057/soft-corporate-background-music-441931_1_f9nfwr.mp3', // TODO: Replace with actual full track URL
    duration: 107, // Duration in seconds
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Corporate Soft Background',
    previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765272057/corporate-soft-background-music-394961_t1tv4h.mp3', // TODO: Replace with actual preview URL
    audioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765272057/corporate-soft-background-music-394961_t1tv4h.mp3', // TODO: Replace with actual full track URL
    duration: 179, // Duration in seconds
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Pop Background',
    previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765272057/mixkit-pop-05-695_bzuk0k.mp3', // TODO: Replace with actual preview URL
    audioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765272057/mixkit-pop-05-695_bzuk0k.mp3', // TODO: Replace with actual full track URL
    duration: 154, // Duration in seconds
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Driving Ambition Background',
    previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765272057/mixkit-driving-ambition-32_wguadn.mp3', // TODO: Replace with actual preview URL
    audioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765272057/mixkit-driving-ambition-32_wguadn.mp3', // TODO: Replace with actual full track URL
    duration: 102, // Duration in seconds
    organizationId: ORGANIZATION_ID,
  },
];

async function main() {
  console.log('Seeding background music...\n');

  // Validate organization exists
  const org = await prisma.organization.findUnique({
    where: { id: ORGANIZATION_ID },
  });

  if (!org) {
    console.error(`Error: Organization with ID "${ORGANIZATION_ID}" not found.`);
    console.error('Please update ORGANIZATION_ID with a valid organization ID.');
    process.exit(1);
  }

  console.log(`Using organization: ${org.name} (${org.id})\n`);

  // Seed background music
  console.log('Seeding tracks...');
  let trackCount = 0;

  for (const music of musicToSeed) {
    if (!music.audioUrl || !music.previewAudioUrl) {
      console.log(`  - Skipping ${music.name}: missing audioUrl or previewAudioUrl`);
      continue;
    }

    // Check if track with same name exists for this org
    const existing = await prisma.backgroundMusic.findFirst({
      where: {
        organizationId: music.organizationId,
        name: music.name,
      },
    });

    if (existing) {
      // Update existing
      await prisma.backgroundMusic.update({
        where: { id: existing.id },
        data: {
          previewAudioUrl: music.previewAudioUrl,
          audioUrl: music.audioUrl,
          duration: music.duration ?? null,
        },
      });
      console.log(`  - Updated: ${music.name}`);
    } else {
      // Create new
      await prisma.backgroundMusic.create({
        data: {
          name: music.name,
          previewAudioUrl: music.previewAudioUrl,
          audioUrl: music.audioUrl,
          duration: music.duration ?? null,
          organizationId: music.organizationId,
        },
      });
      console.log(`  - Created: ${music.name}`);
    }

    trackCount++;
  }

  console.log(`\nSeeded ${trackCount} background music tracks.`);
  console.log('\nSeeding complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
