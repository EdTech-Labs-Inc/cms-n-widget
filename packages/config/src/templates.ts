/**
 * Submagic Template Configuration
 *
 * Defines available caption templates for video editing
 */

export interface SubmagicTemplate {
  id: string;
  name: string;
  description?: string;
  features?: string[];
}

/**
 * Default Submagic template
 */
export const DEFAULT_SUBMAGIC_TEMPLATE = 'Ella';

/**
 * Available Submagic templates
 */
export const SUBMAGIC_TEMPLATES: SubmagicTemplate[] = [
  {
    id: 'ella',
    name: 'Ella',
    description: 'Default template with clean captions',
    features: ['captions', 'zooms', 'brolls'],
  },
  {
    id: 'sara',
    name: 'Sara',
    description: 'Professional template with emphasis on clarity',
    features: ['captions', 'zooms'],
  },
  {
    id: 'daniel',
    name: 'Daniel',
    description: 'Modern template with dynamic effects',
    features: ['captions', 'zooms', 'brolls'],
  },
  {
    id: 'tracy',
    name: 'Tracy',
    description: 'Engaging template with visual enhancements',
    features: ['captions', 'brolls'],
  },
  {
    id: 'hormozi-1',
    name: 'Hormozi 1',
    description: 'High-energy template inspired by Alex Hormozi',
    features: ['captions', 'zooms', 'brolls'],
  },
];

/**
 * Default video editing options
 */
export const DEFAULT_VIDEO_EDITING_OPTIONS = {
  enableCaptions: true,
  enableMagicZooms: true,
  enableMagicBrolls: true,
  magicBrollsPercentage: 40, // 0-100
};

/**
 * Get template by ID
 */
export function getTemplateById(id: string): SubmagicTemplate | undefined {
  return SUBMAGIC_TEMPLATES.find((template) => template.id === id);
}

/**
 * Get template by name
 */
export function getTemplateByName(name: string): SubmagicTemplate | undefined {
  return SUBMAGIC_TEMPLATES.find(
    (template) => template.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Get default template
 */
export function getDefaultTemplate(): SubmagicTemplate {
  return SUBMAGIC_TEMPLATES[0];
}

/**
 * Get all available templates
 */
export function getAllTemplates(): SubmagicTemplate[] {
  return SUBMAGIC_TEMPLATES;
}
