/**
 * Video Bumpers Seed Data
 *
 * Instructions:
 * 1. Fill in the organizationId for your organization
 * 2. Add bumper entries with:
 *    - name: Display name for the bumper
 *    - type: 'image' or 'video'
 *    - position: 'start', 'end', or 'both'
 *    - mediaUrl: CloudFront/Cloudinary URL of the bumper media
 *    - thumbnailUrl: Preview thumbnail URL (optional)
 *    - duration: For videos: actual duration. For images: default duration suggestion (optional)
 * 3. Run: npx tsx prisma/seeds/video-bumpers.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Replace with your actual organization ID
const ORGANIZATION_ID = 'c428421a-c1ab-48da-998e-18bc76d4852a';

/**
 * Video bumpers to seed
 *
 * Add your bumpers here with the following structure:
 * - name: Display name for the bumper
 * - type: 'image' or 'video'
 * - position: 'start' (intro), 'end' (outro), or 'both'
 * - mediaUrl: URL to the bumper media file
 * - thumbnailUrl: Preview thumbnail (optional, recommended for video bumpers)
 * - duration: Duration in seconds (required for videos, suggested default for images)
 */
export const bumpersToSeed = [
  {
    name: 'AMC Intro 1',
    type: 'video',
    position: 'start',
    mediaUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765273849/Intro_krcccq.mp4', // TODO: Replace with actual URL
    thumbnailUrl: null,
    duration: 2, // Default display duration for images
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Flexi Cap AMC Outro',
    type: 'video',
    position: 'end',
    mediaUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765273787/FlexiCapAMCOutro_mbcxw6.mp4', // TODO: Replace with actual URL
    thumbnailUrl: null,
    duration: 15, // Default display duration for images
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'AMC Outro Gujarati',
    type: 'video',
    position: 'end',
    mediaUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765273786/AMCgujOutro_mab9yz.mp4', // TODO: Replace with actual URL
    thumbnailUrl: null,
    duration: 9, // Default display duration for images
    organizationId: ORGANIZATION_ID,
  }
];

async function main() {
  console.log('Seeding video bumpers...\n');

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

  // Seed video bumpers
  console.log('Seeding bumpers...');
  let bumperCount = 0;

  for (const bumper of bumpersToSeed) {
    if (!bumper.mediaUrl) {
      console.log(`  - Skipping ${bumper.name}: missing mediaUrl`);
      continue;
    }

    // Check if bumper with same name and position exists for this org
    const existing = await prisma.videoBumper.findFirst({
      where: {
        organizationId: bumper.organizationId,
        name: bumper.name,
        position: bumper.position,
      },
    });

    if (existing) {
      // Update existing
      await prisma.videoBumper.update({
        where: { id: existing.id },
        data: {
          type: bumper.type,
          mediaUrl: bumper.mediaUrl,
          thumbnailUrl: bumper.thumbnailUrl ?? null,
          duration: bumper.duration ?? null,
        },
      });
      console.log(`  - Updated: ${bumper.name} (${bumper.position})`);
    } else {
      // Create new
      await prisma.videoBumper.create({
        data: {
          name: bumper.name,
          type: bumper.type,
          position: bumper.position,
          mediaUrl: bumper.mediaUrl,
          thumbnailUrl: bumper.thumbnailUrl ?? null,
          duration: bumper.duration ?? null,
          organizationId: bumper.organizationId,
        },
      });
      console.log(`  - Created: ${bumper.name} (${bumper.position})`);
    }

    bumperCount++;
  }

  console.log(`\nSeeded ${bumperCount} video bumpers.`);
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
