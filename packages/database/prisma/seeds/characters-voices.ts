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
// const ORGANIZATION_ID = '7f3c1e3a-8c1b-4bf5-9f92-2d8a21f7dabc';
const ORGANIZATION_ID = 'c428421a-c1ab-48da-998e-18bc76d4852a';

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
    previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1764933872/ElevenLabs_2025-12-05T11_24_09_Vaibhav_ivc_sp100_s50_sb75_v3_lxthbc.mp3', // TODO: Get from ElevenLabs GET /v1/voices
    gender: 'male',
    organizationId: ORGANIZATION_ID,
  },
  // {
  //   name: 'Kuldeep',
  //   elevenlabsVoiceId: '9f2lb1UszO7GDX3Md1QK',
  //   description: null,
  //   previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1764933949/ElevenLabs_2025-12-05T11_25_21_Kuldeep_ivc_sp100_s50_sb75_v3_jpmuys.mp3', // TODO: Get from ElevenLabs GET /v1/voices
  //   gender: 'male',
  //   organizationId: ORGANIZATION_ID,
  // },
  {
    name: 'Yash',
    elevenlabsVoiceId: 'iZZ7Mcbyhw8wjwQ3HhEy',
    description: null,
    previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1764933999/ElevenLabs_2025-12-05T11_26_19_Yash_ivc_sp100_s50_sb75_v3_opd4fg.mp3', // TODO: Get from ElevenLabs GET /v1/voices
    gender: 'male',
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Mumpy',
    elevenlabsVoiceId: 'aeqiqPUmY3kTgXiu21cB',
    description: null,
    previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1764933810/ElevenLabs_2025-12-05T11_22_40_Mumpy_ivc_sp100_s50_sb75_v3_vzzrib.mp3', // TODO: Get from ElevenLabs GET /v1/voices
    gender: 'female',
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Tanvi',
    elevenlabsVoiceId: 'bawxE4HcqqctPXcpzV00',
    description: null,
    previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765257626/ElevenLabs_2025-12-09T05_20_09_Tanvi_ivc_sp100_s50_sb75_v3_k7oi1i.mp3', // TODO: Get from ElevenLabs GET /v1/voices
    gender: 'female',
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Saurabh',
    elevenlabsVoiceId: 'GXSAGTHWBnukd9n07r2j',
    description: null,
    previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1765257581/ElevenLabs_2025-12-09T05_19_08_Saurabh1_ivc_sp100_s50_sb75_v3_fxxe8i.mp3', // TODO: Get from ElevenLabs GET /v1/voices
    gender: 'male',
    organizationId: ORGANIZATION_ID,
  }
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
    // Tanvi looks
    {
      name: 'Tanvi',
      description: null,
      thumbnailUrl:
        'https://files2.heygen.ai/talking_photo/28665474829645808fc8c314416519e0/c779d57bab7b434390539c3451040bca.WEBP?Expires=1765822599&Signature=EG1TDG61lLbGsBFG9a5vyh~V0q~PzWeVk94sK8OdKXk5ioHiu9BJMQ7sdxeGD7jn5hU7HbxMbHoxMSz5ceWTVT6UQpEf0R3hhA39gfnDLgg02GHlYiGF9A1F0R8hG7PTOycWJDiiLDu7zQ~z2PAnVsFR~eNZS~lmUHJipK7NhWkJiMKrjFSnVubKkfny6WJJQvZjbO8JDBlHNog2M9eL8JcvdeSqDkydbyxw8VymDx5ZvI8vmDa2HndcRg-p2MGLQItFAOz~d12yeOcd28KHKI-rFlLJnFShvE9u1tpGyUupaFm7hBoe8kHS729y7bBqhsItUemnVl1GRfVepCVXeQ__&Key-Pair-Id=K38HBHX5LX3X2H',
      previewUrl: null,
      heygenAvatarId: '28665474829645808fc8c314416519e0',
      heygenAvatarGroupId: '113fc202f1874864a23465e7ef207291',
      characterType: 'talking_photo',
      gender: 'female',
      voiceName: 'Tanvi',
      organizationId: ORGANIZATION_ID,
    },
    {
      name: 'Tanvi',
      description: null,
      thumbnailUrl:
        'https://files2.heygen.ai/talking_photo/113fc202f1874864a23465e7ef207291/3c9bb908606545d4a1f37dfc532ae7d7.WEBP?Expires=1765821832&Signature=Rd4BWk-nDgeaGIy307~lyxIgSaEQRhsBPXszzg37PMlBYB80iOV4vpuasLfaNuUJS1BN9sN27O3TUw-PQy6SOrrREHaE83fvK-8g45jSL~p0ybUSN9P6XqYdqf5UzEY1ipEmJuxpiWefhin8UM3vge9g0BHG3VlT2KUu95A7gV0223TBjiPcNgi70USNr-1uayxzF801yd3GwXpSz8XMgIKnw0AoAIIelKXvJ~TfVinX53OvQo69XBgtT5yTFuHN6iOaBB3Xr0QatbSIMfV9oQhGqaegOpVRUIprYTF5dw4i0Gy-lMavt6Z1M71Ly~~G9Bqn~aDFrZ37TWPBH-WoEA__&Key-Pair-Id=K38HBHX5LX3X2H',
      previewUrl: null,
      heygenAvatarId: '113fc202f1874864a23465e7ef207291',
      heygenAvatarGroupId: '113fc202f1874864a23465e7ef207291',
      characterType: 'talking_photo',
      gender: 'female',
      voiceName: 'Tanvi',
      organizationId: ORGANIZATION_ID,
    },
  
    // Saurabh looks
    {
      name: 'Saurabh',
      description: null,
      thumbnailUrl:
        'https://files2.heygen.ai/talking_photo/020df85249e144399d5200ce6f6a6686/d79f609c486742908e9b156a23f28387.WEBP?Expires=1765820688&Signature=UixeVA7BAIKYi7BqG2QcIa9H9qqrKD4AFrXrZojB3v2K0BhY3LkhsHpBOtCh3KXvze0kbkxy-oMMv443Vf23k0Qa5vWH87cH3bl-NmlfIB9xLz3XRKSWeEsH-KJbJxR2hV8h~wH5lY-Tx~n0aLjoYcw0oT7bpqG~q56U-nYR7wBDQw9-fuAbwyJ9MV59rHIEuu145XRU-43W-uxS-iattIAIn7ckGRkegg4YUDZg7e-ABh29oE6RjR1aiiJ9lTez6bt8-nXs5P6rdzZIwstwRbJ9k1Unl3uiUqgekyVcse7yGohZvAAnYddyeJ5LTiXXskg5cFk5DmafBwcpVFEWiA__&Key-Pair-Id=K38HBHX5LX3X2H',
      previewUrl: null,
      heygenAvatarId: '020df85249e144399d5200ce6f6a6686',
      heygenAvatarGroupId: '543555f7501b4a689a94db2435a0edc1',
      characterType: 'talking_photo',
      gender: 'male',
      voiceName: 'Saurabh',
      organizationId: ORGANIZATION_ID,
    },
    {
      name: 'Saurabh',
      description: null,
      thumbnailUrl:
        'https://files2.heygen.ai/talking_photo/f073870dc15f4d28b5934730cf94dc2b/f8c51e00d33d47898ec74eb1d2145731.WEBP?Expires=1765819999&Signature=Xz~jRupHX1BLzCLraYbNLRt4eumwN3ZB~rdnMUevrEIqhsW8baw9lBLYmTZhOBcFEMLPglkNFa5Q0qY1jrMh8-ZcNIQIGwGGZHv-I567hIxVN1iwsVH~AZyVXdPD-T5vZkYYuAK2Uc4-Lb8zyg9hh1cb0IauYPv90dnmTvAMxTIKFujkZr4U2ClDKf3ngNRC5B7xWhHs345aByUugnbKxp90bZsEmDyGPXg2prMHXfAswD95TqNFDeyZEZ-fJ4DOVgmRKH4mW-t7BRdrYqRge752Q057VpokGl9G9RWr~cQUSRB2aSLC3ag5z0XACrJ8Eo8CsFxa-ZNO4aqvYGFBIA__&Key-Pair-Id=K38HBHX5LX3X2H',
      previewUrl: null,
      heygenAvatarId: 'f073870dc15f4d28b5934730cf94dc2b',
      heygenAvatarGroupId: '543555f7501b4a689a94db2435a0edc1',
      characterType: 'talking_photo',
      gender: 'male',
      voiceName: 'Saurabh',
      organizationId: ORGANIZATION_ID,
    },
    {
      name: 'Saurabh',
      description: null,
      thumbnailUrl:
        'https://files2.heygen.ai/talking_photo/543555f7501b4a689a94db2435a0edc1/9a8b27928d4e4da6b6dc13be1f79157e.WEBP?Expires=1765819986&Signature=m5Jwvm2G-yxzTtl0FVEDaif4ex2BufxwYdm6QTNgFeZxaeCQkGgYFDbnzkm7hsEAbjENIEuKGB21AJcTbb0MiBBElDX~08RNjPrfmPrVOQg-cWx8fcRey~QcqHpAPqpPbqbZfQbmB98riilemDT3l15kvlvJ0WKhA1N260Ysb85TvZffwPBZbXvIMw2hFreSxuwvWW8giTq1Xg15WkW4wDboT3v7eDEO9PApKMfVDx5WRO8zDresIf7KHM1CQAQ-knEr78mdgGfEGiVgfuf7GRKaN44YcgngQvG0mmjXLuM6JcHwOVmI0Wa~b~TbNoJ8lRgET1RLY2x2xe7L4cinEQ__&Key-Pair-Id=K38HBHX5LX3X2H',
      previewUrl: null,
      heygenAvatarId: '543555f7501b4a689a94db2435a0edc1',
      heygenAvatarGroupId: '543555f7501b4a689a94db2435a0edc1',
      characterType: 'talking_photo',
      gender: 'male',
      voiceName: 'Saurabh',
      organizationId: ORGANIZATION_ID,
    },
  
    // Mumpy looks
    {
      name: 'Mumpy',
      description: null,
      thumbnailUrl:
        'https://files2.heygen.ai/talking_photo/8cc7ae4df4fe40309780db8fc8671d63/16255ff84f2f44cc9b337e6d951e1db2.WEBP?Expires=1765523783&Signature=a75Q3jALYrk7C~B6XVaovRQjNK7WJ4obhHE0RNz2KhAOhjesaGLBzilSztz4-lq1p8YB6Phc6nR2pre9X6-HofxO6XMnbdSehMJ4pnhrFXmbSGHT8rWo8iyHsa6cHiiJf4SIxjV6kvalWFQG5D9jyzLqWyWZOtlehXcaRbUTHB4Spx9UJpBslbx3Hd77XLhiRS0kNfmdI-RWF2Bh5hZ0njifRypFIRcmK8W-0fotXQsMFO-pbrmlW9IXmMRWJjm7oFJJWKa6u8XdsAW0Imrw3BNuh6wPCaSjc9smdEuAK75V-97G~3kgWGFj9B7Ft4s7qlsUp18~sK4hTFjKmwBn4w__&Key-Pair-Id=K38HBHX5LX3X2H',
      previewUrl:
        'https://resource2.heygen.ai/avatar/v3/8cc7ae4df4fe40309780db8fc8671d63/half/2.2/de6d71754be24378ab255fd5590a67ae/preview_video_target.mp4',
      heygenAvatarId: '8cc7ae4df4fe40309780db8fc8671d63',
      heygenAvatarGroupId: 'f5a04ecab49d4cd49c456db1cd22f77e',
      characterType: 'talking_photo',
      gender: 'female',
      voiceName: 'Mumpy',
      organizationId: ORGANIZATION_ID,
    },
    {
      name: 'Mumpy',
      description: null,
      thumbnailUrl:
        'https://files2.heygen.ai/talking_photo/f5a04ecab49d4cd49c456db1cd22f77e/7747cb24b00d49abb694256440f51a31.WEBP?Expires=1765517223&Signature=nq-Xl9Zk3~pGs9TFekQdXpiPuSOFIGyeMk~pF-r0I6Qdw03eKiobL0MEcoRasFCDByu0d2fAgtO7Ubr1D8WwrJGpCuIosTR6qc~xeN5bAJXJOXEx3bEIf3CKiRB9x1kUkkS01BnwHK98CGD7G~p9FHvw6LEMJ4OMssuwvhE4MYKB3WVWzs2o9D3DLinjyFJKtxgncOI1Bab9hCKsvNBLgDKfIY8hJpIZ0TTD2FkWV23eIXF-pUxtDYKOb9SwKcO5gyC~E~5~wEmXdRRzt038mkGLTyr6INLW-OtxD848smpIq17~a2nGdm~qSVZvnAwwtiDZe2fmpmwHKctcXPMFgw__&Key-Pair-Id=K38HBHX5LX3X2H',
      previewUrl: null,
      heygenAvatarId: 'f5a04ecab49d4cd49c456db1cd22f77e',
      heygenAvatarGroupId: 'f5a04ecab49d4cd49c456db1cd22f77e',
      characterType: 'talking_photo',
      gender: 'female',
      voiceName: 'Mumpy',
      organizationId: ORGANIZATION_ID,
    },
  
    // Vaibhav looks
    {
      name: 'Vaibhav',
      description: null,
      thumbnailUrl:
        'https://files2.heygen.ai/talking_photo/faf84d875a1f47ee9d38995e72214cd2/6e651d3a3d284d91a5ea15bf38fd5069.WEBP?Expires=1765461370&Signature=qLjJaRHuHmz1LMExdVRUdUrMYSAlu9hJYIgbTlBHizIQzRmZPsPy4Va2tachHOvWRwwJo2HmhV9XzHSyWmVZMzr~ushzEbm1eVFj6ZGdHraRV5ftkgkf3rmVODr5GPu35qOB4KYQUx91YUkW9zk3MLZA0dKGlYexq-HR78bCo-JJ5yAr4shXX82LmdEtbm9eMk8EMRvJ2OxJEmKr4bFBB9hlfjPgMCUhxI-cYWrOvvteMR0UKOdIvwBl3tY4pXO9gZCPeXg7~c38mJc8Eqta2mcIeRAnvcX9HpSkqibmmdfy4-Tz4Xju-XrXHTAszcFR1u7XeF~gR2RXEfZngyaoGA__&Key-Pair-Id=K38HBHX5LX3X2H',
      previewUrl:
        'https://resource2.heygen.ai/avatar/v3/faf84d875a1f47ee9d38995e72214cd2/half/2.2/7ceb5a48835c469096c80f066e594275/preview_video_target.mp4',
      heygenAvatarId: 'faf84d875a1f47ee9d38995e72214cd2',
      heygenAvatarGroupId: '145b79e93c224345900fbb52faa8c042',
      characterType: 'talking_photo',
      gender: 'male',
      voiceName: 'Vaibhav',
      organizationId: ORGANIZATION_ID,
    },
    {
      name: 'Vaibhav',
      description: null,
      thumbnailUrl:
        'https://files2.heygen.ai/talking_photo/0efaafd25deb4b68817e335d26e91603/271f0e484cad4f5f80b944d3f4eefbae.WEBP?Expires=1765461370&Signature=Hm9qZqQxM1xUXhN-ErgESudYBnGVFwAq6Zqr658nMfHsMs0T4uibWYb9~F7hzKwQ-qMLpyBWGg9T5ZcJ7RNZB7BRS1dXULgVm3RYb8Mjntn0u1FBNWsto74NVUeMK15Mkrv6rWS0RmoqdCfOiSyqmTFWRKdQ4yf4l6Pq2wZladvDHBL8ci6SnrSdP8E0ZBVn8Q1jwFVD-iDqgu4spd5TfdxiELbJuIi82ZTHqIiQCVq-S6cQOwx081aQrwzRTSBqxpxfplo5mlGXUmiGh8h76uDYdQzQlqQDqotNr6I1IbWDXlxrXgi3EepByTAQu1-HVDh5UqR51Vl2u9DTvwi-aw__&Key-Pair-Id=K38HBHX5LX3X2H',
      previewUrl: null,
      heygenAvatarId: '0efaafd25deb4b68817e335d26e91603',
      heygenAvatarGroupId: '145b79e93c224345900fbb52faa8c042',
      characterType: 'talking_photo',
      gender: 'male',
      voiceName: 'Vaibhav',
      organizationId: ORGANIZATION_ID,
    },
  
    // Yash looks
    {
      name: 'Yash',
      description: null,
      thumbnailUrl:
        'https://files2.heygen.ai/talking_photo/85c7a3ed7dc84b79ab247bfc34113c09/6ca2ec45ed014b8e976371aaed455e89.WEBP?Expires=1765818948&Signature=KYcClrBTk-NsZBJTX9YY18ahTPk17uEDU~P~DWGR5TCuxtzM6SDUfm8bbs1gkRnfODaDqkGgQq66uKsEVN35lyxp4u9vcT~zzBaJk0UeHqOI2yW-5QeK7KivgW1efUAplDYG4TbSUuU8pon65OOznpUbUCjxhQgBzOQBSsICuotSOkwXduY8Oi5Cf8w70lSugW2-OssSPGQn-AnvfxCQSavcmF30izouNHgNqFquxq~ZXFQsTptk9gG2DUpdhhweWGMLHd3seTiq1KsxzorNjsEZo5D9YPR77lAVtd3qCiz3wfdHgeXKHTi5GYFcLXEufnefO5kaswEd7BUTdcyGwQ__&Key-Pair-Id=K38HBHX5LX3X2H',
      previewUrl: null,
      heygenAvatarId: '85c7a3ed7dc84b79ab247bfc34113c09',
      heygenAvatarGroupId: '9ee7e93455434301a7671188281938e5',
      characterType: 'talking_photo',
      gender: 'male',
      voiceName: 'Yash',
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
        previewUrl: character.previewUrl || null,
        heygenAvatarGroupId: character.heygenAvatarGroupId,
        characterType: character.characterType,
        gender: character.gender,
        voiceId: voiceId,
      },
      create: {
        name: character.name,
        description: character.description,
        thumbnailUrl: character.thumbnailUrl || null,
        previewUrl: character.previewUrl || null,
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
