/**
 * HeyGen Character Configuration
 *
 * Defines available characters (avatars or talking photos) for video generation.
 * Each character has a specific type, character ID, and voice ID from HeyGen.
 */

export interface HeyGenCharacter {
  id: string; // Unique identifier (e.g., 'male-presenter', 'female-presenter')
  name: string; // Display name shown to users
  type: 'talking_photo' | 'avatar'; // HeyGen character type
  characterId: string; // talking_photo_id or avatar_id from HeyGen
  voiceId: string; // voice_id from HeyGen
  photoUrl: string; // URL to character thumbnail
  description?: string; // Optional description
}

/**
 * Available HeyGen characters for video generation
 */
export const HEYGEN_CHARACTERS: HeyGenCharacter[] = [
  {
    id: 'male-presenter',
    name: 'Kumar',
    type: 'avatar',
    characterId: 'e69958ae5fa94733ba44a81ccf677ec4',
    voiceId: '4ecb08e33f7f4259bd544aaeae2fd946',
    photoUrl: 'https://res.cloudinary.com/dphekriyz/image/upload/v1761123680/kumar_pmhhyp.webp',
    description: 'Professional male voice and character',
  },
  {
    id: 'female-presenter',
    name: 'Isha',
    type: 'avatar',
    characterId: 'e97bd13f43bd460c8fb5fa27eeb294f9',
    voiceId: 'GTSr2w7ea6G4HPatP97G',
    photoUrl: 'https://res.cloudinary.com/dphekriyz/image/upload/v1761123680/isha_ltch9d.webp',
    description: 'Professional female voice and character',
  },
];

/**
 * Get a character by ID
 */
export function getCharacterById(id: string): HeyGenCharacter | undefined {
  return HEYGEN_CHARACTERS.find((char) => char.id === id);
}

/**
 * Get the default character (first in the list)
 */
export function getDefaultCharacter(): HeyGenCharacter {
  return HEYGEN_CHARACTERS[0];
}

/**
 * Get all available characters
 */
export function getAllCharacters(): HeyGenCharacter[] {
  return HEYGEN_CHARACTERS;
}
