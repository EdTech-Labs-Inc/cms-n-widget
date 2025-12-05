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
    previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1764933872/ElevenLabs_2025-12-05T11_24_09_Vaibhav_ivc_sp100_s50_sb75_v3_lxthbc.mp3', // TODO: Get from ElevenLabs GET /v1/voices
    gender: 'male',
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Kuldeep',
    elevenlabsVoiceId: '9f2lb1UszO7GDX3Md1QK',
    description: null,
    previewAudioUrl: 'https://res.cloudinary.com/dphekriyz/video/upload/v1764933949/ElevenLabs_2025-12-05T11_25_21_Kuldeep_ivc_sp100_s50_sb75_v3_jpmuys.mp3', // TODO: Get from ElevenLabs GET /v1/voices
    gender: 'male',
    organizationId: ORGANIZATION_ID,
  },
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
      'https://files2.heygen.ai/talking_photo/63bae30f206c4632975e20dbc6ae8a6d/8f46b26ba4974d4091590ae2a96ca4ec.WEBP?Expires=1765461370&Signature=LXIhYxUp5GMB1L9YWHHAiJ40xWln3oRUGpWC52CWl3laAxPrMNCdlSSRyUA4kmnb3nJZuwckZeelTqjV53bvM9HcR4S~lMSZ5L6~pqnV~ArIRbQtirzIuxp8I-hWzzzRTIyfI-cyC1eZcvlHFiewCn~9lbGj4tCaApDmGu2nnk9H1InarKEmQQ4cxCrYWFiVttLNFEgxvIij9RckhlnmQhKpMkdo4u7idrW0kp3p6~1yINepdNCkJCqze~u9109VkMXTzvwxvjv08kaWEGMPY3WJ5P0VovKt0S-zowQqATnzsr6o0jQUDe5ZZimojwSEeCFcGLa1GBOg2iumsP6pDQ__&Key-Pair-Id=K38HBHX5LX3X2H',
    previewUrl: null,
    heygenAvatarId: '63bae30f206c4632975e20dbc6ae8a6d',
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
      'https://files2.heygen.ai/talking_photo/988a066554a94e8699d00bfd0dbc11b5/d5b58f8a7458477b84fb169d33fc62b3.WEBP?Expires=1765461370&Signature=WCRy60a1pXdz4VfDYPDsoTBE9PZjKIQis1GatK28uf1acMgmJZyCKT3ZWg-lv04Qx-Sy1zHWfAoVtnEZXgowZ9w3ZzLz3ElVsRSPU3lYtFbLCCeVvGEWWtxq34EyHMU-MYZc8BI7LIjY-Fa6waaEConxom2cr~djw41jXDLdVaFLdZc4zzUnp~0mbDpk5csz2~dDZ6Ni-fL70G2g8WaM~~B7jk4qywuxH5VJltoNxCxxuf61sRhyNJJ1JYwPClAqHci85Vt5Z59hvhNy3aYriX6A7XkqpkiJXdBMnurXCX5INn75x7QVNgDq2g~JMaBkcxoh8f4KgIiNy11wT8ORWg__&Key-Pair-Id=K38HBHX5LX3X2H',
    previewUrl: null,
    heygenAvatarId: '988a066554a94e8699d00bfd0dbc11b5',
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
      'https://files2.heygen.ai/talking_photo/6cb5ed335fc34244ad9bc5193c87c8cf/d3b2149ca08b4a78bfed8337f4173986.WEBP?Expires=1765461370&Signature=fZTxaDMs0wyR~WNvE7lnuJWEjTLczb1VvqeWAU5oAFSzxhvZeoeWBPszrZQK~bQ7nCDgiOSnLBx4KWH4S6jyWQO6MMTmzh49m0kgXs5QlaSq5Hle5nRS9AcDiaEgEfREZrt6IgndRZXnzxOO~rOllrhPipLQHBnBxQCN8B3teQ6t3k9BXWiIpBIiwpLaerCRcHN11kp1~Hrfa~6d5mZV3I8RnHvWwZiloARB8rOk7UioVHzQLYdw7N0yVxo4RiZ~Rxd0fkFkjkbiTRnXsgx~X45rDsXOJDZEjOXXwBAF8sok8~yBzBh6b-8HSjJO~T~7fxP7OygTL3kv3Vz8un8L-w__&Key-Pair-Id=K38HBHX5LX3X2H',
    previewUrl: null,
    heygenAvatarId: '6cb5ed335fc34244ad9bc5193c87c8cf',
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
  {
    name: 'Vaibhav',
    description: null,
    thumbnailUrl:
      'https://files2.heygen.ai/talking_photo/145b79e93c224345900fbb52faa8c042/13dd594bd75044179798e17243ad6f36.WEBP?Expires=1765461370&Signature=qQiSp2Z2vpgRqMseJ04182xu9Fmiy1b-HvYRBGrAUsqi~UHqA7JShorqZlBKOExWRykjKWlhvyzjxXvNZBKhFinWgZ06C08ftf12Ysfa-WVppmSdMhpqQvvRuqz-S42-CpJ0Uzz2RgfhiQ98DT8vaO9GEMl2AlB7OVC9HH5rehi9qU6tsKFDq8C0hFJWcm0gIAPFcdlMXgehuZueTSVK3Mrmju3jGOx1FsW1xIrtJl9BZDjOCQOQ1qYqFGIPvqtLHUuUTRB-3tKv0UMotO~xEbOxN-NcQajy9GCItAhVwdGH-qDK8mrbhWDZ9Nx3mYUH-6dv5hJdNGc0NVA30aP3Yw__&Key-Pair-Id=K38HBHX5LX3X2H',
    previewUrl: null,
    heygenAvatarId: '145b79e93c224345900fbb52faa8c042',
    heygenAvatarGroupId: '145b79e93c224345900fbb52faa8c042',
    characterType: 'talking_photo',
    gender: 'male',
    voiceName: 'Vaibhav',
    organizationId: ORGANIZATION_ID,
  },

  // Kuldeep looks
  {
    name: 'Kuldeep',
    description: null,
    thumbnailUrl:
      'https://files2.heygen.ai/talking_photo/5768ab19cb8d43c58dacdc66d9bb149a/3a5ea95c15654bacb299763a2325cae7.WEBP?Expires=1765459128&Signature=IBoeruXUvxdDMe5VQcAqxt-bznODHdDJnC3Dis1amDE58fC1D7JELoAP37BJ0k-Cj80FQezqwW0sJYWV6HQpNd~e5b7drW2tbzQBq4WuAHRxqJTIAk5CC-OnRjWEYxy3SxjfZxcm~Gp94TtmT5p4qaTb~C4-0yZymDvsWQN9M2Irw1R~Jnv5cX3oVkTrOK5w7uP8mNgVvFIPS1Z96gevSV4m9Z7f40CoAyDMYSP15ZEu1QmLQ14~odnACblkSWxZE6ACUDPxMPJ6oz4H19Ivo9LiYUK6BX~t~PMzaI-elQUwjtTg-BWQgrL-iKBP9JGLtRY~JY2AN5m7bYoNy4GQfg__&Key-Pair-Id=K38HBHX5LX3X2H',
    previewUrl:
      'https://resource2.heygen.ai/avatar/v3/5768ab19cb8d43c58dacdc66d9bb149a/half/2.2/2a59d2dd596a4216b026850f71b8ca66/preview_video_target.mp4',
    heygenAvatarId: '5768ab19cb8d43c58dacdc66d9bb149a',
    heygenAvatarGroupId: 'b2ff33aec2664ce6a1cf269b6f7b4d56',
    characterType: 'talking_photo', // motion = true, still talking_photo
    gender: 'male',
    voiceName: 'Kuldeep',
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Kuldeep',
    description: null,
    thumbnailUrl:
      'https://files2.heygen.ai/talking_photo/35acc5e01fae48cba89b074d78db892e/230d657a82f84123a91e545b4ad8050a.WEBP?Expires=1765457245&Signature=bur9FP~0wivXXLNjU3~yWwEJJurscHy1GbC4u8zGNzzip3AVaY~dXUjCUtQVi82dxdIr5Dh~GSYkadN2kZccum0vPtWZgf0o6CnkW8~O9Vap7XT2rsenlKp1I3PfK4USmciG6S9dPFFrq~ZkoFG-0DUEAPtffRAPvYJft66mD-P0RkF6TAnrpfhM6j1QNnGH5okZ-yfP8rk6fgBRvPLFnczKfcLuP26Lj-JInKEt1CYtLjPprbMopIFkz8OpcZKs7gQ4s-ylKWRx2bf~-Glw4vwlfcNEkomxyAT-~ARJbWeqE3HBNf63rK1aWGpC612vvmPRqc2kZ6GOgBskLFcngw__&Key-Pair-Id=K38HBHX5LX3X2H',
    previewUrl:
      'https://resource2.heygen.ai/avatar/v3/35acc5e01fae48cba89b074d78db892e/half/2.2/7fb3497e64b9470d9f89eefd3495ac41/preview_video_target.mp4',
    heygenAvatarId: '35acc5e01fae48cba89b074d78db892e',
    heygenAvatarGroupId: 'b2ff33aec2664ce6a1cf269b6f7b4d56',
    characterType: 'talking_photo',
    gender: 'male',
    voiceName: 'Kuldeep',
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Kuldeep',
    description: null,
    thumbnailUrl:
      'https://files2.heygen.ai/talking_photo/7c90eec4135b4260a7d21699394547bd/5c1bf7340f21495f893f007ae40779bf.WEBP?Expires=1765436613&Signature=A0ke3PX0VZZTmFvJIOTJTKgGsmfleOn3FGRfQkKvDm2sRSh46bJ4~NDBr6gSSQbhzjWO9v1LG7K9vlLiGVh7MfA9rzYSu27Vu6GLLSnqY86XmjLF1WFVMpwytkFpOQCH7Pfwmnltzlp-FMLWr-fgppXftNXi7cMZf7WxSou6pH0kB0zLBb-RG7y~WTXZWAsTZHYfrzlhw9r7q9FLJ7jmyd0GS3v5Rj3ixa2B2AvRTFXv4ITPqTsEbH1k39P0UBFd6YgLocwGkWfBQCwyfvqwUNwEZlyiDzwDLwnHda0FJFtsc7pU7aZnErKiixlWPjiM6LhikHCWnPU1A5pHEOmqHg__&Key-Pair-Id=K38HBHX5LX3X2H',
    previewUrl: null,
    heygenAvatarId: '7c90eec4135b4260a7d21699394547bd',
    heygenAvatarGroupId: 'b2ff33aec2664ce6a1cf269b6f7b4d56',
    characterType: 'talking_photo',
    gender: 'male',
    voiceName: 'Kuldeep',
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Kuldeep',
    description: null,
    thumbnailUrl:
      'https://files2.heygen.ai/talking_photo/76beb16874f34104b2a09bc74a3098b2/038ce7d52d804eaca422b0fe1d8ed67f.WEBP?Expires=1765436604&Signature=ASHORxHsxhC3rG6uS5gVR8-LQ9Z2h4qcK8RXa8B1Yduvp4Bj2OF6SlaXwpjUqcQdQaO-dcQnBHevowiAGIMmbb7KXQslyQ3SEFGmlZwLFeqDScjtcHv9uz3SeOd16yIgZo9t5p7fvZx4RQHY7lHmfv29NYZiF5sUkoSUUNuSxid3QZVqtlUToDwYvT8rSSRBitN-VXG1dKvcQkVdaqZ-rt9fUQ0Et9jdj8I453KUC2VDI3PUJEDMpZG4J29sjL65NMU36rBo3Pa4u-u4GF56ZTTySoJYUNSi-RoQxbGWxZt82SzQuikp1~~5OysLYFM5smQ6LiOBUBERAW3qg4J-lA__&Key-Pair-Id=K38HBHX5LX3X2H',
    previewUrl: null,
    heygenAvatarId: '76beb16874f34104b2a09bc74a3098b2',
    heygenAvatarGroupId: 'b2ff33aec2664ce6a1cf269b6f7b4d56',
    characterType: 'talking_photo',
    gender: 'male',
    voiceName: 'Kuldeep',
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Kuldeep',
    description: null,
    thumbnailUrl:
      'https://files2.heygen.ai/talking_photo/8aff94ce2b3940199403fc21ef147d5c/312f66d669b64fe895f28818de16ab8e.WEBP?Expires=1765436613&Signature=G5e2Q2uVgfnuwaVgolC1z41aUe6n8~PqiTh545rNNrXFfDtin2ckBUJmrSCai28T2v~f2Qx7sTFjHpGWZID63ZXEK16PLupWNc~bpBsMIgWcsePV7XNJIY9Rbt61iX1vUXvZhKiY22TbPsY-nkTBCP4bq1wwNxBrGS79MihbFg1L2qEzwzjbbewxoWN07220fPLBrPfEVl~A-Pec-MTCOj8WobppmwQMNbIXR9WqNimfIfVDBngN318hVJ--jSVCMaZoBW~Qs6H5Ly-pLOy7NlROr4ZrAgHtC0p7ztZrLAjgmMtePlEALxYNVOEKrKKh9k0BJw8QFBF8eaqBhQgX1Q__&Key-Pair-Id=K38HBHX5LX3X2H',
    previewUrl: null,
    heygenAvatarId: '8aff94ce2b3940199403fc21ef147d5c',
    heygenAvatarGroupId: 'b2ff33aec2664ce6a1cf269b6f7b4d56',
    characterType: 'talking_photo',
    gender: 'male',
    voiceName: 'Kuldeep',
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Kuldeep',
    description: null,
    thumbnailUrl:
      'https://files2.heygen.ai/talking_photo/06875547563e45c8a5f6498cc95c3667/06a5ac6b32114fc6be8cb0fe989e7b6a.WEBP?Expires=1765436613&Signature=a87CXW1rWJFLsCgIA9P44ggUPykll9v9heKQedsurrZfpn7caohchqDGNH1VZnYZ2U0dek~BaNGpjB4Qu2phVUlq7-403u7N1ZJkxPhegkwheavwFxkINsTluZ2z5Z3ZDVCv9yltB~SanOaZSy-0yY0jXfDojt2M9u5Ii-jnkyG7UacTFDcMiLn77QSg07h8UCBH5o1nJu5X15-Rh--Cki1wkH3O~MDr-rhG8QCifH3U-oiLEN9OpuHxtncO8GinG3vWVhZQkPonseKFKzzOtH7-xHQfG2Sd7Xphwo4fFPDdBtjJnAPAgcXD-LNRMa4Sku0-RPHGabJie6THIqo4xQ__&Key-Pair-Id=K38HBHX5LX3X2H',
    previewUrl: null,
    heygenAvatarId: '06875547563e45c8a5f6498cc95c3667',
    heygenAvatarGroupId: 'b2ff33aec2664ce6a1cf269b6f7b4d56',
    characterType: 'talking_photo',
    gender: 'male',
    voiceName: 'Kuldeep',
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Kuldeep',
    description: null,
    thumbnailUrl:
      'https://files2.heygen.ai/talking_photo/72e29f46f49841349f0269459b423746/eda2edb0aba34f3fa0684150dc0954b3.WEBP?Expires=1765436603&Signature=ZA158M5zvYN5oo2jbnz-N5Q5x3wF~cXYSZGMWnQqleLxmxUpkF6i4~Zhsd5ik4ZOklNot4fVLTI5U2Sx7JFhfyFpFjSuZaopGcibj15zh2Fnu11Zi1NY96Vx4f2t88~CcByQhC-b7GlHXPE5roMYexFr0oQEqHTUimkxi24f-Mlqt9tDTAlXl1-a~99fBPZY~zCVcr58r25tL3Lzl8IWSFRoWbkAAg0xprvzLkpp1dj9BT9yYSo7ybw0Cdk3I5q~BAMa060AST0kJytxdz7LkNUlr7uD8K2uNG5X-mCYlaIVBY3d6QP3T3z~9cRk4h95f3ki-RWreGb0mbtIK0E-pw__&Key-Pair-Id=K38HBHX5LX3X2H',
    previewUrl: null,
    heygenAvatarId: '72e29f46f49841349f0269459b423746',
    heygenAvatarGroupId: 'b2ff33aec2664ce6a1cf269b6f7b4d56',
    characterType: 'talking_photo',
    gender: 'male',
    voiceName: 'Kuldeep',
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Kuldeep',
    description: null,
    thumbnailUrl:
      'https://files2.heygen.ai/talking_photo/b2ff33aec2664ce6a1cf269b6f7b4d56/bc1ae15cbbf544bf8ef235bf03a66fe6.WEBP?Expires=1765436603&Signature=Weqi4KWHTd9LgYt3y~z5FRkv5ymq3AOQo7qn03brPFsz5-~B~a23O4rlqTE4yeBUEPVXKiODJQB-V-wJF0Kwe4mEStXEFAoWwlvi1rur~znNvquJEe1AJ9ypNtC~6gNFFXcglSxfk5Fw8bTwLiwFSASCzRc1ZzFXwf5Cyjr1P-5o2tpdF-cCsz1xDs3RJkypZ31p33S~sWiuJwrlpu3Z25XTgNSeOwrhetQqlhPVe2hefHP5GL~3u3BvVWaGvkJma2CqOuwoWIn~VlsU1pNQpedWzqB0kcaR760oRUW~DAl33QqzDJdYWmtEbW38iXzsKQNZhDXBXaMQ-FL7RY4dOA__&Key-Pair-Id=K38HBHX5LX3X2H',
    previewUrl: null,
    heygenAvatarId: 'b2ff33aec2664ce6a1cf269b6f7b4d56',
    heygenAvatarGroupId: 'b2ff33aec2664ce6a1cf269b6f7b4d56',
    characterType: 'talking_photo',
    gender: 'male',
    voiceName: 'Kuldeep',
    organizationId: ORGANIZATION_ID,
  },

  // Yash looks
  {
    name: 'Yash',
    description: null,
    thumbnailUrl:
      'https://files2.heygen.ai/talking_photo/62c2c6273e3c4c92a294709ccd154cf8/bd14ab34daf648e5b178d861b36f0684.WEBP?Expires=1765362357&Signature=aBIS72Rh402fIVFc3JUBkAupG4C5sRADMSUfot3gaq9aZCTJlTdmXZiYF8QBiSJICfsMC6DiLVa6VVPfwlwbaJRiWdfCok98BGUnHlgIBrD88iLZUIp7X37DOlkxSuIJZC2qZdLkukfEvxe4PEG08YiqmoeF2R4rq5CHbFnoXC9G8urRiiZrcQe5KTEDfiE28CL5RW0wt4dxbe1fJbBblJDmekt96mrnqpmTTufrSxKzrp8PEsq39y5BeUVbGd5bC-S2iQ90~DW9g6px1jo4j2RDH2Ly83XLqg3KCgmKi97EqSAzOk8RcuMZ03IHRiRSXOJYNH6SDEEGzAcQHAd79A__&Key-Pair-Id=K38HBHX5LX3X2H',
    previewUrl:
      'https://resource2.heygen.ai/avatar/v3/62c2c6273e3c4c92a294709ccd154cf8/half/2.2/d40c0eb3f7b7482795e2917becdd393b/preview_video_target.mp4',
    heygenAvatarId: '62c2c6273e3c4c92a294709ccd154cf8',
    heygenAvatarGroupId: '9ee7e93455434301a7671188281938e5',
    characterType: 'talking_photo', // motion = true
    gender: 'male',
    voiceName: 'Yash',
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Yash',
    description: null,
    thumbnailUrl:
      'https://files2.heygen.ai/talking_photo/585b9f99047e46f8a69473b6e93011d4/9fc44238da3040748d342d9ea239c7fc.WEBP?Expires=1765360738&Signature=TTrxFPk8PikOds9vLyzxmQZDNFpJ12DSbfkiaqV0KZHnL9-rvNScUayo5St3CC6TsWHQZneT53L3bS7xW~Wu8G5-0OEBWFNyyscnl7s8okhGBPR6Dg3DDfsLlBz65YxyhYmYju5-vQZmP99e3hoRkfeDAsymTgk6bpUX8SLR0K7lOQO6qh-xGKLb16Ov6CBy-gC65jhwYso3v3NgMfu8JgHITwOmbtv-TdOXVfR1zLYZigMAetluXnhY6ZmukiP0sO27hTKp~nrrisR8RFVCn8qeqZXcJXW6xp2wrB1cxBMiEYESkHV-ZAyTBi7fSCfyaKojFlF5TJdOsVobkuGr5g__&Key-Pair-Id=K38HBHX5LX3X2H',
    previewUrl: null,
    heygenAvatarId: '585b9f99047e46f8a69473b6e93011d4',
    heygenAvatarGroupId: '9ee7e93455434301a7671188281938e5',
    characterType: 'talking_photo',
    gender: 'male',
    voiceName: 'Yash',
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Yash',
    description: null,
    thumbnailUrl:
      'https://files2.heygen.ai/talking_photo/998360437df34d22a5983a221de14609/6ae88cf4a48b4c6381a0b9d57830cfb4.WEBP?Expires=1765360717&Signature=DRSyWM5zPUsp97Pdt497Q8fTUVt6Cp7eZzJrDWAjDHN0fpf2wm92xRT4XQFCYT9OOvRnmcIVmP1tMZI1xzjVBDpXCTDxDf~dcdQIXLQkzJCZNUsbmdI7GDiLhKLnnPc5zaPUeVCuof42MzRrAcFS9N5JAdQW~dNqnm0nBuxytPZubFGgZmp34jf2srhIcd0zzW45FRmnwoJjEGuvvpQ9Qyebwt1MQ4zjwUbIwjcXTGzXq7K4mYvmBevphFx5DSmtXzfRO490i8Yg3SOyVz0i2Buh2gqa5xxDQQLIVDksMGCytEGgSWK9B4lPgx5deh1ejEIF~nF8rGa2tOy4Qkt9RA__&Key-Pair-Id=K38HBHX5LX3X2H',
    previewUrl: null,
    heygenAvatarId: '998360437df34d22a5983a221de14609',
    heygenAvatarGroupId: '9ee7e93455434301a7671188281938e5',
    characterType: 'talking_photo',
    gender: 'male',
    voiceName: 'Yash',
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Yash',
    description: null,
    thumbnailUrl:
      'https://files2.heygen.ai/talking_photo/6afe29179d0f4640b8fbf7376e14fffe/e31a56dfab924201af9386db2bcfe5e7.WEBP?Expires=1765360717&Signature=ear-6HjyooPsz4qvEYsVu6ca~tD0DSdGNyptGVIbj8zqv279EiW~-T41GgpVmGTOPJWEUWQL~jlq9ncbFT4kA96f0lUOxzK3otHnaEGiQj2EqVoEIujpGF-iEt5Qe8ACEY1tudUc7k6hoq6PH71JE3qa3N0uqGv6VrQldhETUAm0HcxYXONN9HykDo3V-IM2jb-eIBM7Ghrgp4TR9xam9Ce-6fPpgtAX1Go~Iq4RBGAVi3S9U-dyhgMML-ULNTlv1hEmsj687lQaBgcf8382-ieQA6s9vR63hcWS0YeMDAuagK84gUwfSRzVfaswBF24TWe3au2LtMPUSg7l6H2JsQ__&Key-Pair-Id=K38HBHX5LX3X2H',
    previewUrl: null,
    heygenAvatarId: '6afe29179d0f4640b8fbf7376e14fffe',
    heygenAvatarGroupId: '9ee7e93455434301a7671188281938e5',
    characterType: 'talking_photo',
    gender: 'male',
    voiceName: 'Yash',
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Yash',
    description: null,
    thumbnailUrl:
      'https://files2.heygen.ai/talking_photo/6833f55528fa40b2b69a2536f25c7190/b3ac4ea18fff4b95bf42b76f88ff08cb.WEBP?Expires=1765360709&Signature=iiDqyYSaEkwW7LGO02lwK5lcrxYlLEAXoos4XoDbPqvZBtcDXgWWoCWDi4Z-s7vLzZSs7zcEDs8gAzuYxzIQbPMEa7DyOH~or-aevhyMVQs3PKM7djy4V6MBoOuDk~DOSpsBAs~BaDWjmncupLI2VQO~RWlmqvi7VPMLjNmY~x2PBTiI01vzY8DMeMK4SR9RtMhGMeCLWievdzdPfG5aKmmoQ1a7hA8ClumMyfV9qfVuhphZbat8fMNiHBKJJFwC6O9nN41NMoUOzEI5L6kG8I2KNk4UPXnbKyIJdklOO~yYZErVHvWkCy7IWSsQnZz70qnITEMcurotmCSLzjKYfA__&Key-Pair-Id=K38HBHX5LX3X2H',
    previewUrl: null,
    heygenAvatarId: '6833f55528fa40b2b69a2536f25c7190',
    heygenAvatarGroupId: '9ee7e93455434301a7671188281938e5',
    characterType: 'talking_photo',
    gender: 'male',
    voiceName: 'Yash',
    organizationId: ORGANIZATION_ID,
  },
  {
    name: 'Yash',
    description: null,
    thumbnailUrl:
      'https://files2.heygen.ai/talking_photo/9ee7e93455434301a7671188281938e5/5db8347aa50e4d92b287b7c0f73f2428.WEBP?Expires=1765360706&Signature=AWeSRrbX6SDsfhbZzH9YxelsMeCgJ9DKMxRJjn-5h00eUnB26vb4SmJiSYDq4AzXOwtuyKkk~xAi54ht8jb1Q5PIfUN68TPpWXEIhooD~4fpNI07A-6~-UysK~QtDtSm45eDtvZlYMQ40oyQMNv1CvzCRlaF7IPJFxZ8K9C0sCsjtIRa9BIznl3tGbciFBKFFpKjzlA60Eoo5mIdx8BNw-rmSQZ3HuRn5aXw9zr9L7NnDuXRjEDAjr~4D8zoqYXekhkO4ktdAw3L0l0gX2RyuzmOTG4-TKKSteu5ISXTx4z615tSYwhO0CwwiDhlkpWal-aV~XxOZEdtuRf4QAb4vQ__&Key-Pair-Id=K38HBHX5LX3X2H',
    previewUrl: null,
    heygenAvatarId: '9ee7e93455434301a7671188281938e5',
    heygenAvatarGroupId: '9ee7e93455434301a7671188281938e5',
    characterType: 'talking_photo',
    gender: 'male',
    voiceName: 'Yash',
    organizationId: ORGANIZATION_ID,
  },

  // Mumpy looks
  {
    name: 'Mumpy',
    description: null,
    thumbnailUrl:
      'https://files2.heygen.ai/talking_photo/9a41078dada04a18beedc648d2cae448/473bb7cd39234956bc1d7a2bd640815b.WEBP?Expires=1765517230&Signature=cxGCaYOiw765ke2eWJAuVdUFyDqqbVB6m8VKqLk01Ed-Uwp4lKoqE-b~VjiMbPNuc4aXaB7IerrdB4yw-EGS6F-Zx7zs6Q0GgG3Fmg5rt6b2OjO1mYEcDE2AWtqlaxW2Tbjpd~MGnXpvUwctI9t9N09GKGJXj0T2uHrqRd5tZ79rfWCOH9ZhFecEM8Gomtf5cPjHnjGYynxWOLblTC8EXP7LMT4-bQ-bNbJwWpGHMW8haa5F6X5tLjyCfQt7FnxIkGbaR1HUgMbejzEaqc-Rm466v2Zowyv1zFz7sJrTRgdV2NI2M~2KKn33VDycW-OjLHpcmStVSr6Sx~aRCEEvpg__&Key-Pair-Id=K38HBHX5LX3X2H',
    previewUrl: null,
    heygenAvatarId: '9a41078dada04a18beedc648d2cae448',
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
      'https://files2.heygen.ai/talking_photo/4508b158a064441ebd03e5f9c133dfdd/283dbc6259574ee2b0b6663f0f1ee73b.WEBP?Expires=1765517230&Signature=N8nZ8Dl85RwpHaar9WAgF-T0Ufs-IrdpdAX~IgovOXP0XJwhPtMISkw22thEiFvHvkLoN2JqHhAPPa3c7iKwQo2R0I1rDtmgdj2HYPyhmw~40oVuzCAapaCrPk2Cs38ra5gFlt3GprGX5MuCguykQT4W~tIICMy5-xV~EJbNqtMZF-q-jZqnCnNW33s0iPJTpEXgRNRH3cpM~0xQ91jAD-98tDRCyYHHyRkPvxYg7UXxlzM08fr0Hq7kjKRxG4nCtvklvU8bZhzH0TArnc8UxDX-lwOT8ASMhmoeI3lRUxwHv~KLo88QFty5B9kTQWEm1daBjV9oY3Co7njfu2CrBA__&Key-Pair-Id=K38HBHX5LX3X2H',
    previewUrl: null,
    heygenAvatarId: '4508b158a064441ebd03e5f9c133dfdd',
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
      'https://files2.heygen.ai/talking_photo/f4183e3087f945028102903ca594b54b/0472eb05c9df4d969c1c7bfe043a5b3a.WEBP?Expires=1765517230&Signature=jh2hQpden~LAhCxgE4VTGTMGHB-l2i1Ct884P6Dp34xITsf6KUCZ7btXWy6et0XlJQ-EFRuzwTt~iPYIiqHLsCMArX4L0R9n23nsVT8fqY~gecnc62uz8u2C7x2F0HyNQDHF-HTdWc923v-QC6z-qs0hMpNDMYI3kQt9nuFk2WP9TPJtVl3Xx8klgTbdqCfJA1OcgA8i0FbW3xE9UpwhCfM01HKglwHnBqtveMdN1AOVOxdZVv-0nMzsZo17jJDpEUVNcXmUXEXv4vo56qQxBsqFyW5VUYW3yk1U0Hv5igmD6rKYrqNGr2OpdqPVTtYTU1XA4EyKLIDPkoP~B4A9SQ__&Key-Pair-Id=K38HBHX5LX3X2H',
    previewUrl: null,
    heygenAvatarId: 'f4183e3087f945028102903ca594b54b',
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
      'https://files2.heygen.ai/talking_photo/cd6fef58a8034745922015bff6a167e0/95387a39853d4b9ba17a23203acdda33.WEBP?Expires=1765517230&Signature=RWu8TR5CGK0S1rMmVPEfxjgwhk2OiVn1larImg5U1S2j4FvFVqy9jVpKZL9Xcfo41KaZP9qUE8WW0gQ-V~xbn6qXm5OpnkmM9IhtejfAVQqJFssM5SYSLeVx10PWYQmKlEn7zaHE8GCOQZJ4v1D-SiyWcukz2U4AH-oYS2QhK17t1YyWi7quVz4RQxQFqteg19xtqghMWRRCeaaHXcaQiWMdlHyf6fU09lsZDJPJ0Wtfja4oxAwyZ3DEI0wlQTuqAo~74pfJPX2yl-hg3J4fm4yUREMPTsALVa7XL1jyz1WYow8Qf~KqxAE9WZ9bQvQ5WXdQxUkuLA3bWoz9uJfYYg__&Key-Pair-Id=K38HBHX5LX3X2H',
    previewUrl: null,
    heygenAvatarId: 'cd6fef58a8034745922015bff6a167e0',
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
