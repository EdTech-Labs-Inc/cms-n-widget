/**
 * @repo/config
 * Centralized configuration for the CMS platform
 *
 * This package provides configuration values, character limits,
 * voice IDs, templates, and other constants used across the monorepo.
 *
 * NO AI PROMPTS ARE STORED HERE - only configuration values.
 */

// ============================================
// HEYGEN CHARACTERS
// ============================================
export * from './characters';

// ============================================
// ELEVENLABS VOICES
// ============================================
export * from './voices';

// ============================================
// SUBMAGIC TEMPLATES
// ============================================
export * from './templates';

// ============================================
// CHARACTER LIMITS & CONSTRAINTS
// ============================================
export * from './limits';

// ============================================
// APPLICATION CONSTANTS
// ============================================
export * from './constants';
