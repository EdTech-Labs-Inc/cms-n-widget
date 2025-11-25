// Main export file for @repo/api-client package

// Re-export API client and all endpoint namespaces
export {
  apiClient,
  articlesApi,
  submissionsApi,
  heygenApi,
  submagicApi,
  tagsApi,
} from './api/client';

// Re-export all hooks
export * from './api/hooks';

// Re-export all types
export * from './api.types';

// Re-export utilities
export * from './utils';

// Re-export providers
export { QueryProvider } from './providers/QueryProvider';
