/**
 * Voices Seed Data
 *
 * Instructions:
 * 1. Fill in the organizationId for your organization
 * 2. For voices: Get preview audio URLs from ElevenLabs API (GET /v1/voices)
 * 3. Run: npx tsx prisma/seeds/characters-voices.ts
 *
 * Note: Characters are now created via the UI with photo upload (Avatar IV API)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Replace with your actual organization ID
const ORGANIZATION_ID = '044ed6c6-ac55-4653-848b-cd24383f75fe';

/**
 * Voices to seed
 *
 * From content team:
 * - Vaibhav: UZ43nGa9SDlDnGtiiY5Q
 * - Kuldeep: 9f2lb1UszO7GDX3Md1QK
 * - Yash: iZZ7Mcbyhw8wjwQ3HhEy
 * - Mumpy: aeqiqPUmY3kTgXiu21cB
 */
export const voicesToSeed = [
  // {
  //   name: 'Vaibhav',
  //   elevenlabsVoiceId: 'UZ43nGa9SDlDnGtiiY5Q',
  //   description: null,
  //   previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1764933872/ElevenLabs_2025-12-05T11_24_09_Vaibhav_ivc_sp100_s50_sb75_v3_lxthbc.mp3',
  //   gender: 'male',
  //   organizationId: ORGANIZATION_ID,
  // },
  // {
  //   name: 'Yash',
  //   elevenlabsVoiceId: 'iZZ7Mcbyhw8wjwQ3HhEy',
  //   description: null,
  //   previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1764933999/ElevenLabs_2025-12-05T11_26_19_Yash_ivc_sp100_s50_sb75_v3_opd4fg.mp3',
  //   gender: 'male',
  //   organizationId: ORGANIZATION_ID,
  // },
  // {
  //   name: 'Mumpy',
  //   elevenlabsVoiceId: 'aeqiqPUmY3kTgXiu21cB',
  //   description: null,
  //   previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1764933810/ElevenLabs_2025-12-05T11_22_40_Mumpy_ivc_sp100_s50_sb75_v3_vzzrib.mp3',
  //   gender: 'female',
  //   organizationId: ORGANIZATION_ID,
  // },
  {
    name: 'Vaibhav',
    elevenlabsVoiceId: 'UZ43nGa9SDlDnGtiiY5Q',
    description: null,
    previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1764933872/ElevenLabs_2025-12-05T11_24_09_Vaibhav_ivc_sp100_s50_sb75_v3_lxthbc.mp3',
    gender: 'male',
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'ManBlueShirt',
    elevenlabsVoiceId: '6X2abQeGWGz0rTnIhZjq',
    description: null,
    previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765437726/ElevenLabs_2025-12-11T07_21_49_ManBlueShirt_ivc_sp100_s50_sb75_v3_jpwcon.mp3',
    gender: 'male',
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'WomanBlackShirtGrayPants',
    elevenlabsVoiceId: 'xJBEZqUdulR1kJ9jha2k',
    description: null,
    previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765437648/ElevenLabs_2025-12-11T07_20_31_WomanBlackShirtGrayPants_ivc_sp100_s50_sb75_v3_cfddue.mp3',
    gender: 'female',
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'WomanColourfulBlouseBlackPants',
    elevenlabsVoiceId: 'oo10XjOXVR5vrPJmQSxz',
    description: null,
    previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765437582/ElevenLabs_2025-12-11T07_19_19_WomanColourfulBlouseBlackPants_ivc_sp100_s50_sb75_v3_kocyhn.mp3',
    gender: 'female',
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'WomanNavySuitSleeveless',
    elevenlabsVoiceId: 'q5Rz8tJTHBrg4WosvbF3',
    description: null,
    previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765437495/ElevenLabs_2025-12-11T07_17_24_WomanNavySuitSleeveless_ivc_sp100_s50_sb75_v3_nmhqgs.mp3',
    gender: 'female',
    organizationId: ORGANIZATION_ID,
  },
  // {
  //   name: 'Tanvi',
  //   elevenlabsVoiceId: 'bawxE4HcqqctPXcpzV00',
  //   description: null,
  //   previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765257626/ElevenLabs_2025-12-09T05_20_09_Tanvi_ivc_sp100_s50_sb75_v3_k7oi1i.mp3',
  //   gender: 'female',
  //   organizationId: ORGANIZATION_ID,
  // },
  // {
  //   name: 'Saurabh',
  //   elevenlabsVoiceId: 'GXSAGTHWBnukd9n07r2j',
  //   description: null,
  //   previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765257581/ElevenLabs_2025-12-09T05_19_08_Saurabh1_ivc_sp100_s50_sb75_v3_fxxe8i.mp3',
  //   gender: 'male',
  //   organizationId: ORGANIZATION_ID,
  // },
  // {
  //   name: 'Smita',
  //   elevenlabsVoiceId: 'LkQ6dVx5YwTly6tXEH1J',
  //   description: null,
  //   previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765375570/ElevenLabs_2025-12-10T14_05_28_Smita_ivc_sp100_s50_sb75_v3_grselc.mp3',
  //   gender: 'female',
  //   organizationId: ORGANIZATION_ID,
  // }
];

async function main() {
  console.log('Seeding voices...\n');

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

  // Seed voices
  console.log('Seeding voices...');
  let voiceCount = 0;

  for (const voice of voicesToSeed) {
    if (!voice.elevenlabsVoiceId) {
      console.log(`  - Skipping ${voice.name}: missing elevenlabsVoiceId`);
      continue;
    }

    await prisma.voice.upsert({
      where: {
        organizationId_elevenlabsVoiceId: {
          organizationId: voice.organizationId,
          elevenlabsVoiceId: voice.elevenlabsVoiceId,
        },
      },
      update: {
        name: voice.name,
        description: voice.description,
        previewAudioUrl: voice.previewAudioUrl || null,
        gender: voice.gender,
      },
      create: {
        name: voice.name,
        elevenlabsVoiceId: voice.elevenlabsVoiceId,
        description: voice.description,
        previewAudioUrl: voice.previewAudioUrl || null,
        gender: voice.gender,
        organizationId: voice.organizationId,
      },
    });

    voiceCount++;
    console.log(`  - ${voice.name} (${voice.elevenlabsVoiceId})`);
  }

  console.log(`\nSeeded ${voiceCount} voices.`);
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
