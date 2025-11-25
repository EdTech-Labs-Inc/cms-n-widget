'use client';

import { useState, useEffect } from 'react';
import { useSubmagicTemplates } from '@/lib/api/hooks';
import { Loader2, ChevronDown, Sparkles } from 'lucide-react';

export interface VideoCustomizationConfig {
  characterId: string;
  enableCaptions: boolean;
  captionTemplate: string;
  enableMagicZooms: boolean;
  enableMagicBrolls: boolean;
  magicBrollsPercentage: number;
}

const HEYGEN_CHARACTERS = [
  {
    id: 'male-presenter1',
    name: 'Kumar',
    type: 'avatar' as const,
    characterId: 'e69958ae5fa94733ba44a81ccf677ec4',
    voiceId: '4ecb08e33f7f4259bd544aaeae2fd946',
    photoUrl: 'https://res.cloudinary.com/dphekriyz/image/upload/v1761123680/kumar_pmhhyp.webp',
    description: 'Professional male voice and character',
  },
  // {
  //   id: 'male-presenter2',
  //   name: 'Ethan',
  //   type: 'avatar' as const,
  //   characterId: '3e6f29c4a3f049dd99812da4c1254959',
  //   voiceId: '4ecb08e33f7f4259bd544aaeae2fd946',
  //   photoUrl: 'https://res.cloudinary.com/dphekriyz/image/upload/v1763735732/Screenshot_2025-11-21_at_14.35.11_gg6k4l.png',
  //   description: 'Professional male voice and character',
  // },
  // {
  //   id: 'male-presenter3',
  //   name: 'Marcus',
  //   type: 'avatar' as const,
  //   characterId: 'd5952141d0304493a21a5b28acf715b1',
  //   voiceId: '4ecb08e33f7f4259bd544aaeae2fd946',
  //   photoUrl: 'https://res.cloudinary.com/dphekriyz/image/upload/v1763735732/Screenshot_2025-11-21_at_14.35.18_knh3ub.png',
  //   description: 'Professional male voice and character',
  // },
  // {
  //   id: 'male-presenter4',
  //   name: 'Eric',
  //   type: 'avatar' as const,
  //   characterId: '1e4fea90e8f64ca5b8e248962ea58e3a',
  //   voiceId: '4ecb08e33f7f4259bd544aaeae2fd946',
  //   photoUrl: 'https://res.cloudinary.com/dphekriyz/image/upload/v1763735731/Screenshot_2025-11-21_at_14.34.28_rctdft.png',
  //   description: 'Professional male voice and character',
  // },
  {
    id: 'female-presenter1',
    name: 'Isha',
    type: 'avatar' as const,
    characterId: 'e97bd13f43bd460c8fb5fa27eeb294f9',
    voiceId: 'GTSr2w7ea6G4HPatP97G',
    photoUrl: 'https://res.cloudinary.com/dphekriyz/image/upload/v1761123680/isha_ltch9d.webp',
    description: 'Professional female voice and character',
  },
  // {
  //   id: 'female-presenter2',
  //   name: 'Diana',
  //   type: 'avatar' as const,
  //   characterId: '39b3a236040140ffa0371ad9235cdeb9',
  //   voiceId: 'GTSr2w7ea6G4HPatP97G',
  //   photoUrl: 'https://res.cloudinary.com/dphekriyz/image/upload/v1763735559/Screenshot_2025-11-21_at_14.32.06_m3dxmz.png',
  //   description: 'Professional female voice and character',
  // },
  // {
  //   id: 'female-presenter3',
  //   name: 'Silvia',
  //   type: 'avatar' as const,
  //   characterId: '4a7f8e301cf14a76bfdda1f5cc68edff',
  //   voiceId: 'GTSr2w7ea6G4HPatP97G',
  //   photoUrl: 'https://res.cloudinary.com/dphekriyz/image/upload/v1763735558/Screenshot_2025-11-21_at_14.32.00_jcvupi.png',
  //   description: 'Professional female voice and character',
  // },
  // {
  //   id: 'female-presenter4',
  //   name: 'Mary',
  //   type: 'avatar' as const,
  //   characterId: '6b6137f23d3c494f9edd28b6902163ac',
  //   voiceId: 'GTSr2w7ea6G4HPatP97G',
  //   photoUrl: 'https://res.cloudinary.com/dphekriyz/image/upload/v1763735558/Screenshot_2025-11-21_at_14.31.50_nybmvg.png',
  //   description: 'Professional female voice and character',
  // },
];

const BACKGROUND_TEMPLATES = [
  {
    id: 'Background 1',
    displayName: 'Boardroom',
    type: 'Indoors' as const,
    thumbnailUrl: 'https://res.cloudinary.com/dphekriyz/image/upload/v1763735732/Screenshot_2025-11-21_at_14.35.11_gg6k4l.png'
  },
  {
    id: 'Background 2',
    displayName: 'Office',
    type: 'Indoors' as const,
    thumbnailUrl: 'https://res.cloudinary.com/dphekriyz/image/upload/v1763735732/Screenshot_2025-11-21_at_14.35.11_gg6k4l.png'
  },
  {
    id: 'Background 3',
    displayName: 'Mountain Top',
    type: 'Outdoors' as const,
    thumbnailUrl: 'https://res.cloudinary.com/dphekriyz/image/upload/v1763735732/Screenshot_2025-11-21_at_14.35.11_gg6k4l.png'
  },
  {
    id: 'Background 4',
    displayName: 'Brick Wall',
    type: 'Outdoors' as const,
    thumbnailUrl: 'https://res.cloudinary.com/dphekriyz/image/upload/v1763735732/Screenshot_2025-11-21_at_14.35.11_gg6k4l.png'
  }
];

const CAPTION_TEMPLATES = [
  {
    id: 'Ella',
    displayName: 'ELLA',
    thumbnailUrl: 'https://res.cloudinary.com/dphekriyz/image/upload/v1761151032/Screenshot_2025-10-22_at_17.36.40_xy4hgc.png'
  },
  {
    id: 'Sara',
    displayName: 'Sara',
    thumbnailUrl: 'https://res.cloudinary.com/dphekriyz/image/upload/v1761151032/Screenshot_2025-10-22_at_17.36.21_fmbyw7.png'
  },
  {
    id: 'Daniel',
    displayName: 'Daniel',
    thumbnailUrl: 'https://res.cloudinary.com/dphekriyz/image/upload/v1761151032/Screenshot_2025-10-22_at_17.36.33_nupjf3.png'
  },
  {
    id: 'Tracy',
    displayName: 'TRACY',
    thumbnailUrl: 'https://res.cloudinary.com/dphekriyz/image/upload/v1761151033/Screenshot_2025-10-22_at_17.36.45_odmkrg.png'
  }
];

interface VideoCustomizationProps {
  value: VideoCustomizationConfig;
  onChange: (config: VideoCustomizationConfig) => void;
  disabled?: boolean;
}

export function VideoCustomization({ value, onChange, disabled = false }: VideoCustomizationProps) {
  const { data: templates, isLoading: templatesLoading } = useSubmagicTemplates();
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');

  // Set default character when component mounts (if no character is set)
  useEffect(() => {
    if (HEYGEN_CHARACTERS.length > 0 && !value.characterId) {
      onChange({ ...value, characterId: HEYGEN_CHARACTERS[0].characterId });
    }
  }, [value.characterId]);

  const handleCharacterChange = (characterId: string) => {
    onChange({ ...value, characterId });
  };

  const handleCaptionsToggle = () => {
    onChange({ ...value, enableCaptions: !value.enableCaptions });
  };

  const handleTemplateChange = (template: string) => {
    onChange({ ...value, captionTemplate: template });
  };

  const handleZoomsToggle = () => {
    onChange({ ...value, enableMagicZooms: !value.enableMagicZooms });
  };

  const handleBrollsToggle = () => {
    onChange({ ...value, enableMagicBrolls: !value.enableMagicBrolls });
  };

  const handleBrollsPercentageChange = (percentage: number) => {
    onChange({ ...value, magicBrollsPercentage: percentage });
  };

  const charactersToDisplay = HEYGEN_CHARACTERS.filter((character) => {
    if (genderFilter === 'all') return true;
    if (genderFilter === 'male') return character.id.startsWith('male-');
    return character.id.startsWith('female-');
  });

  return (
    <div className="space-y-6">
      {/* Character Selection */}
      <div>
        <label className="block text-text-secondary text-sm font-medium mb-3">
          Character
        </label>
        <div className="flex items-center justify-end mb-3">
          <div className="inline-flex items-center gap-1 rounded-lg bg-white-10 p-1">
            <button
              type="button"
              onClick={() => setGenderFilter('all')}
              className={`px-3 py-1 rounded-md text-sm border-2 transition-colors ${
                genderFilter === 'all'
                  ? 'bg-gold-light border-gold text-text-primary'
                  : 'bg-transparent border-transparent hover:bg-white-20 text-text-secondary'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter('male')}
              className={`px-3 py-1 rounded-md text-sm border-2 transition-colors ${
                genderFilter === 'male'
                  ? 'bg-gold-light border-gold text-text-primary'
                  : 'bg-transparent border-transparent hover:bg-white-20 text-text-secondary'
              }`}
            >
              Male
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter('female')}
              className={`px-3 py-1 rounded-md text-sm border-2 transition-colors ${
                genderFilter === 'female'
                  ? 'bg-gold-light border-gold text-text-primary'
                  : 'bg-transparent border-transparent hover:bg-white-20 text-text-secondary'
              }`}
            >
              Female
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {charactersToDisplay.map((character) => (
              <label
                key={character.id}
                className={`flex flex-col gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                  value.characterId === character.characterId
                    ? 'bg-gold-light border-gold'
                    : 'bg-white-10 border-transparent hover:bg-white-20'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="character"
                  value={character.characterId}
                  checked={value.characterId === character.characterId}
                  onChange={() => handleCharacterChange(character.characterId)}
                  className="sr-only"
                  disabled={disabled}
                />
                <div className="flex items-center gap-3">
                  {character.photoUrl ? (
                    <img
                      src={character.photoUrl}
                      alt={character.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-purple flex items-center justify-center text-white font-bold">
                      {character.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-text-primary font-medium">{character.name}</div>
                    <div className="text-xs text-text-muted capitalize">{character.type.replace('_', ' ')}</div>
                  </div>
                </div>
              </label>
          ))}
        </div>
      </div>

      {/* Captions Toggle */}
      <div>
        <label className="flex items-center gap-3 p-4 rounded-xl bg-white-10 hover:bg-white-20 cursor-pointer transition-all duration-200">
          <input
            type="checkbox"
            checked={value.enableCaptions}
            onChange={handleCaptionsToggle}
            className="w-5 h-5 rounded border-white-40 bg-transparent checked:bg-blue-accent"
            disabled={disabled}
          />
          <div className="flex-1">
            <div className="font-medium text-text-primary">Enable Captions</div>
            <div className="text-sm text-text-muted">Add AI-generated captions to the video</div>
          </div>
        </label>
      </div>

      {/* Caption Template Selection */}
      {value.enableCaptions && (
        <div>
          <label className="block text-text-secondary text-sm font-medium mb-3">
            Caption Style
          </label>
          {templatesLoading ? (
            <div className="flex items-center justify-center p-8 bg-white-10 rounded-xl">
              <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
            </div>
          ) : (() => {
            // Filter templates to only show those available in API response
            const availableTemplates = CAPTION_TEMPLATES.filter(template =>
              templates?.includes(template.id)
            );
            // Fallback to all templates if API fails or returns empty
            const displayTemplates = availableTemplates.length > 0 ? availableTemplates : CAPTION_TEMPLATES;

            return (
              <div className="grid grid-cols-2 gap-3">
                {displayTemplates.map((template) => (
                  <label
                    key={template.id}
                    className={`flex flex-col gap-2 p-3 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                      value.captionTemplate === template.id
                        ? 'bg-gold-light border-gold'
                        : 'bg-white-10 border-transparent hover:bg-white-20'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      name="captionTemplate"
                      value={template.id}
                      checked={value.captionTemplate === template.id}
                      onChange={() => handleTemplateChange(template.id)}
                      className="sr-only"
                      disabled={disabled}
                    />
                    {/* <div className="text-text-primary font-medium text-sm text-center">
                      {template.displayName}
                    </div> */}
                    <div className="flex justify-center">
                      <img
                        src={template.thumbnailUrl}
                        alt={template.displayName}
                        className="w-1/2 h-auto object-cover"
                      />
                    </div>
                  </label>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Magic Zooms Toggle */}
      <div>
        <label className="flex items-center gap-3 p-4 rounded-xl bg-white-10 hover:bg-white-20 cursor-pointer transition-all duration-200">
          <input
            type="checkbox"
            checked={value.enableMagicZooms}
            onChange={handleZoomsToggle}
            className="w-5 h-5 rounded border-white-40 bg-transparent checked:bg-blue-accent"
            disabled={disabled}
          />
          <div className="flex-1">
            <div className="font-medium text-text-primary flex items-center gap-2">
              Magic Zooms <Sparkles className="w-4 h-4 text-gold" />
            </div>
            <div className="text-sm text-text-muted">Automatic zoom effects for emphasis</div>
          </div>
        </label>
      </div>

      {/* Magic B-rolls Toggle and Percentage */}
      <div className="space-y-3">
        <label className="flex items-center gap-3 p-4 rounded-xl bg-white-10 hover:bg-white-20 cursor-pointer transition-all duration-200">
          <input
            type="checkbox"
            checked={value.enableMagicBrolls}
            onChange={handleBrollsToggle}
            className="w-5 h-5 rounded border-white-40 bg-transparent checked:bg-blue-accent"
            disabled={disabled}
          />
          <div className="flex-1">
            <div className="font-medium text-text-primary flex items-center gap-2">
              Magic B-Rolls <Sparkles className="w-4 h-4 text-gold" />
            </div>
            <div className="text-sm text-text-muted">Add relevant B-roll footage automatically</div>
          </div>
        </label>

        {/* B-roll Percentage Slider */}
        {value.enableMagicBrolls && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-secondary">B-Roll Coverage</label>
              <span className="text-sm font-medium text-text-primary">{value.magicBrollsPercentage}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={value.magicBrollsPercentage}
              onChange={(e) => handleBrollsPercentageChange(Number(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-white-20 rounded-lg appearance-none cursor-pointer accent-gold disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
