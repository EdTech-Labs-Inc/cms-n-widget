'use client';

import { useState } from 'react';
import { Trash2, Loader2, AlertCircle, Tag as TagIcon } from 'lucide-react';
import { useTags } from '@/lib/api/hooks';
import { TagFormModal } from './TagFormModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import type { Tag } from '@repo/api-client/types';

interface TagGridProps {
  orgSlug: string;
  categoryFilter: string; // 'all' | 'uncategorized' | category name
}

export function TagGrid({ orgSlug, categoryFilter }: TagGridProps) {
  const { data, isLoading, error } = useTags(orgSlug);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);

  // Filter tags based on category
  const filteredTags = (data || []).filter((tag: Tag) => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'uncategorized') return !tag.category;
    return tag.category === categoryFilter;
  });

  if (isLoading) {
    return (
      <div className="card p-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-accent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 bg-red-500/10 border border-red-500/20">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <div>
            <p className="font-medium text-red-400">Failed to load tags</p>
            <p className="text-sm text-text-secondary mt-1">Please try refreshing the page</p>
          </div>
        </div>
      </div>
    );
  }

  if (filteredTags.length === 0) {
    return (
      <>
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-white-10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TagIcon className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">
            {categoryFilter === 'all' ? 'No tags yet' : 'No tags in this category'}
          </h3>
          <p className="text-text-secondary">
            {categoryFilter === 'all'
              ? 'Create your first tag to start organizing your content.'
              : 'Try selecting a different category or create a new tag.'}
          </p>
        </div>

        {/* Modals - always render to handle close animations */}
        <TagFormModal
          isOpen={!!editingTag}
          onClose={() => setEditingTag(null)}
          orgSlug={orgSlug}
          tag={editingTag}
        />
      </>
    );
  }

  return (
    <>
      <div className="card p-6">
        <div className="flex flex-wrap gap-2">
          {filteredTags.map((tag: Tag) => (
            <div
              key={tag.id}
              className="relative group"
              onMouseEnter={() => setHoveredTag(tag.id)}
              onMouseLeave={() => setHoveredTag(null)}
            >
              {/* Tag chip */}
              <button
                onClick={() => setEditingTag(tag)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white-10 hover:bg-white-15 border border-white-15 rounded-full text-sm text-text-primary transition-colors cursor-pointer"
              >
                <span>{tag.name}</span>
                {tag.category && (
                  <span className="text-xs text-text-muted bg-white-10 px-1.5 py-0.5 rounded">
                    {tag.category}
                  </span>
                )}
              </button>

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingTag(tag);
                }}
                className="absolute -top-1 -right-1 p-1 bg-red-500/80 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Delete ${tag.name}`}
              >
                <Trash2 className="w-3 h-3 text-white" />
              </button>

              {/* Hover tooltip */}
              {hoveredTag === tag.id && (tag.description || tag.category) && (
                <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-black border border-white-15 rounded-lg shadow-xl pointer-events-none">
                  <div className="text-sm">
                    <p className="font-medium text-text-primary mb-1">{tag.name}</p>
                    {tag.category && (
                      <p className="text-text-muted text-xs mb-1">Category: {tag.category}</p>
                    )}
                    {tag.description && (
                      <p className="text-text-secondary text-xs">{tag.description}</p>
                    )}
                    <p className="text-text-muted text-xs mt-2">
                      Created: {new Date(tag.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {/* Tooltip arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                    <div className="border-8 border-transparent border-t-background-primary" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-white-10">
          <p className="text-sm text-text-muted">
            {filteredTags.length} tag{filteredTags.length !== 1 ? 's' : ''}
            {categoryFilter !== 'all' && ` in "${categoryFilter === 'uncategorized' ? 'Uncategorized' : categoryFilter}"`}
          </p>
        </div>
      </div>

      {/* Edit Modal */}
      <TagFormModal
        isOpen={!!editingTag}
        onClose={() => setEditingTag(null)}
        orgSlug={orgSlug}
        tag={editingTag}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingTag}
        onClose={() => setDeletingTag(null)}
        orgSlug={orgSlug}
        tag={deletingTag}
      />
    </>
  );
}
