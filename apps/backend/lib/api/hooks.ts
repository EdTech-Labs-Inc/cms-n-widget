/**
 * Re-export all hooks from @repo/api-client
 * This file provides backwards compatibility for imports from '@/lib/api/hooks'
 * We import from the hooks subpath to avoid pulling in the client/logging dependencies
 */
export * from '@repo/api-client/hooks';
