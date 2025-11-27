// Export all hooks from domain-specific files

// Article hooks
export * from './article-hooks';

// Submission hooks
export * from './submission-hooks';

// Tag hooks
export * from './tag-hooks';

// Audio tag hooks
export * from './audio-tag-hooks';

// Podcast tag hooks
export * from './podcast-tag-hooks';

// Video tag hooks
export * from './video-tag-hooks';

// Interactive podcast tag hooks
export * from './interactive-podcast-tag-hooks';

// Quiz tag hooks
export * from './quiz-tag-hooks';

// Approval hooks
export * from './approval-hooks';

// Video hooks
export * from './video-hooks';

// Podcast hooks
export * from './podcast-hooks';

// Script hooks
export * from './script-hooks';

// Media hooks
export * from './media-hooks';

// Thumbnail hooks
export * from './thumbnail-hooks';

// HeyGen hooks
export * from './heygen-hooks';

// Query Keys
export const queryKeys = {
  articles: ['articles'] as const,
  article: (id: string) => ['articles', id] as const,
  submissions: (page: number, limit: number, includeOutputs: boolean) => ['submissions', page, limit, includeOutputs] as const,
  submission: (id: string) => ['submissions', id] as const,
  tags: ['tags'] as const,
  tag: (id: string) => ['tags', id] as const,
  tagCategories: ['tags', 'categories'] as const,
};
