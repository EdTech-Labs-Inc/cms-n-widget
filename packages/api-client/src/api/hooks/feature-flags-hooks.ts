import { useQuery } from '@tanstack/react-query';
import { featureFlagsApi } from '../client';

// Query Keys
export const featureFlagQueryKeys = {
  flags: () => ['feature-flags'] as const,
};

// Feature Flags Hook
export function useFeatureFlags() {
  return useQuery({
    queryKey: featureFlagQueryKeys.flags(),
    queryFn: () => featureFlagsApi.getAll(),
    staleTime: 30 * 1000, // 30 seconds - short stale time so changes propagate quickly
    refetchOnWindowFocus: true,
  });
}

// Helper hook to check a specific flag
export function useFeatureFlag(key: string) {
  const { data: flags, ...rest } = useFeatureFlags();
  return {
    ...rest,
    enabled: flags?.[key] ?? false,
  };
}
