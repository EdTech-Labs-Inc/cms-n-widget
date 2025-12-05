/**
 * Characters & Voices Seed Data
 *
 * Instructions:
 * 1. Fill in the organizationId for your organization
 * 2. For voices: Get preview audio URLs from ElevenLabs API (GET /v1/voices)
 * 3. For characters:
 *    - Get individual avatar IDs from HeyGen API: GET https://api.heygen.com/v2/avatars?avatar_group_id=GROUP_ID
 *    - Get thumbnail URLs from avatar details
 * 4. Run: npx tsx prisma/seeds/characters-voices.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Replace with your actual organization ID
const ORGANIZATION_ID = 'YOUR_ORG_ID';

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
  {
    name: 'Vaibhav',
    elevenlabsVoiceId: 'UZ43nGa9SDlDnGtiiY5Q',
    description: null,
    previewAudioUrl: '', // TODO: Get from ElevenLabs GET /v1/voices
    gender: 'male',
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Kuldeep',
    elevenlabsVoiceId: '9f2lb1UszO7GDX3Md1QK',
    description: null,
    previewAudioUrl: '', // TODO: Get from ElevenLabs GET /v1/voices
    gender: 'male',
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Yash',
    elevenlabsVoiceId: 'iZZ7Mcbyhw8wjwQ3HhEy',
    description: null,
    previewAudioUrl: '', // TODO: Get from ElevenLabs GET /v1/voices
    gender: 'male',
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Mumpy',
    elevenlabsVoiceId: 'aeqiqPUmY3kTgXiu21cB',
    description: null,
    previewAudioUrl: '', // TODO: Get from ElevenLabs GET /v1/voices
    gender: 'female',
    organizationId: ORGANIZATION_ID,
  },
];

/**
 * Characters to seed
 *
 * Avatar Group IDs from content team:
 * - Vaibhav: 145b79e93c224345900fbb52faa8c042
 * - Kuldeep: b2ff33aec2664ce6a1cf269b6f7b4d56
 * - Yash: 9ee7e93455434301a7671188281938e5
 * - Mumpy: f5a04ecab49d4cd49c456db1cd22f77e
 *
 * Each "look" from an avatar group should be a separate character entry.
 * Get individual avatar IDs from: GET https://api.heygen.com/v2/avatars?avatar_group_id=GROUP_ID
 */
export const charactersToSeed = [
  // Vaibhav looks
  {
    name: 'Vaibhav', // Update with specific look name if multiple
    description: null,
    thumbnailUrl: '', // TODO: Get from HeyGen avatar details
    heygenAvatarId: '', // TODO: Individual avatar ID from the group
    heygenAvatarGroupId: '145b79e93c224345900fbb52faa8c042',
    characterType: 'avatar', // or 'talking_photo'
    gender: 'male',
    voiceName: 'Vaibhav', // Links to voice above by name
    organizationId: ORGANIZATION_ID,
  },
  // Kuldeep looks
  {
    name: 'Kuldeep',
    description: null,
    thumbnailUrl: '',
    heygenAvatarId: '',
    heygenAvatarGroupId: 'b2ff33aec2664ce6a1cf269b6f7b4d56',
    characterType: 'avatar',
    gender: 'male',
    voiceName: 'Kuldeep',
    organizationId: ORGANIZATION_ID,
  },
  // Yash looks
  {
    name: 'Yash',
    description: null,
    thumbnailUrl: '',
    heygenAvatarId: '',
    heygenAvatarGroupId: '9ee7e93455434301a7671188281938e5',
    characterType: 'avatar',
    gender: 'male',
    voiceName: 'Yash',
    organizationId: ORGANIZATION_ID,
  },
  // Mumpy looks
  {
    name: 'Mumpy',
    description: null,
    thumbnailUrl: '',
    heygenAvatarId: '',
    heygenAvatarGroupId: 'f5a04ecab49d4cd49c456db1cd22f77e',
    characterType: 'avatar',
    gender: 'female',
    voiceName: 'Mumpy',
    organizationId: ORGANIZATION_ID,
  },
];

async function main() {
  console.log('Seeding voices and characters...\n');

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
  const voiceMap = new Map<string, string>(); // name -> id

  for (const voice of voicesToSeed) {
    if (!voice.elevenlabsVoiceId) {
      console.log(`  - Skipping ${voice.name}: missing elevenlabsVoiceId`);
      continue;
    }

    const created = await prisma.voice.upsert({
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

    voiceMap.set(voice.name, created.id);
    console.log(`  - ${voice.name} (${voice.elevenlabsVoiceId})`);
  }

  console.log(`\nSeeded ${voiceMap.size} voices.\n`);

  // Seed characters
  console.log('Seeding characters...');
  let characterCount = 0;

  for (const character of charactersToSeed) {
    if (!character.heygenAvatarId) {
      console.log(`  - Skipping ${character.name}: missing heygenAvatarId`);
      continue;
    }

    const voiceId = voiceMap.get(character.voiceName);
    if (!voiceId) {
      console.log(`  - Skipping ${character.name}: voice "${character.voiceName}" not found`);
      continue;
    }

    await prisma.character.upsert({
      where: {
        organizationId_heygenAvatarId: {
          organizationId: character.organizationId,
          heygenAvatarId: character.heygenAvatarId,
        },
      },
      update: {
        name: character.name,
        description: character.description,
        thumbnailUrl: character.thumbnailUrl || null,
        heygenAvatarGroupId: character.heygenAvatarGroupId,
        characterType: character.characterType,
        gender: character.gender,
        voiceId: voiceId,
      },
      create: {
        name: character.name,
        description: character.description,
        thumbnailUrl: character.thumbnailUrl || null,
        heygenAvatarId: character.heygenAvatarId,
        heygenAvatarGroupId: character.heygenAvatarGroupId,
        characterType: character.characterType,
        gender: character.gender,
        voiceId: voiceId,
        organizationId: character.organizationId,
      },
    });

    characterCount++;
    console.log(`  - ${character.name} (${character.heygenAvatarId})`);
  }

  console.log(`\nSeeded ${characterCount} characters.`);
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
