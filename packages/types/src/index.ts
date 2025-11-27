/**
 * @repo/types
 * Consolidated type definitions for the CMS platform
 *
 * This package provides a single source of truth for all TypeScript types
 * used across the monorepo. Types are organized by domain for better
 * maintainability and tree-shaking.
 */

// ============================================
// MEDIA TYPES
// ============================================
export * from './media.types';

// ============================================
// ORGANIZATION TYPES
// ============================================
export * from './organization.types';

// ============================================
// PLAYER TYPES
// ============================================
export * from './player.types';

// ============================================
// API TYPES
// ============================================
export * from './api.types';

// ============================================
// COMMON TYPES
// ============================================
export * from './common.types';

// ============================================
// ZOD SCHEMAS (for AI structured outputs)
// ============================================
export * from './schemas';
