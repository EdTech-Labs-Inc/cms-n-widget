import { useQuery } from '@tanstack/react-query';
import { submagicApi } from '../client';

// Podcast Hooks

/**
 * Fetch available Submagic caption templates
 */
export function useSubmagicTemplates() {
  return useQuery({
    queryKey: ['submagic', 'templates'],
    queryFn: submagicApi.getTemplates,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}
