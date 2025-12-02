'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Upload, ChevronDown } from 'lucide-react';
import { useTagCategories } from '@/lib/api/hooks';
import { TagGrid } from '@/components/tags/TagGrid';
import { TagFormModal } from '@/components/tags/TagFormModal';
import { BulkTagUpload } from '@/components/tags/BulkTagUpload';

export default function TagManagementPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const { data: categoriesData } = useTagCategories(orgSlug);
  const categories: string[] = categoriesData || [];

  const getCategoryLabel = (value: string) => {
    if (value === 'all') return 'All Tags';
    if (value === 'uncategorized') return 'Uncategorized';
    return value;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Tag Management</h1>
          <p className="text-text-secondary">
            Create and manage tags for organizing your content
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Bulk Upload Button */}
          <button
            onClick={() => setShowBulkUpload(true)}
            className="btn btn-secondary inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Bulk Upload
          </button>

          {/* Add Tag Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Tag
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-6">
        <div className="relative inline-block">
          <button
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
            className="btn btn-ghost inline-flex items-center gap-2 min-w-[180px] justify-between"
          >
            <span>{getCategoryLabel(categoryFilter)}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showCategoryDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-black/90 backdrop-blur-xl border border-white-15 rounded-lg shadow-lg overflow-hidden">
              <button
                type="button"
                onMouseDown={() => {
                  setCategoryFilter('all');
                  setShowCategoryDropdown(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-purple-accent/20 text-purple-accent'
                    : 'text-text-primary hover:bg-white-10'
                }`}
              >
                All Tags
              </button>
              <button
                type="button"
                onMouseDown={() => {
                  setCategoryFilter('uncategorized');
                  setShowCategoryDropdown(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                  categoryFilter === 'uncategorized'
                    ? 'bg-purple-accent/20 text-purple-accent'
                    : 'text-text-primary hover:bg-white-10'
                }`}
              >
                Uncategorized
              </button>
              {categories.length > 0 && (
                <div className="border-t border-white-10">
                  {categories.map((cat: string) => (
                    <button
                      key={cat}
                      type="button"
                      onMouseDown={() => {
                        setCategoryFilter(cat);
                        setShowCategoryDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                        categoryFilter === cat
                          ? 'bg-purple-accent/20 text-purple-accent'
                          : 'text-text-primary hover:bg-white-10'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tag Grid */}
      <TagGrid orgSlug={orgSlug} categoryFilter={categoryFilter} />

      {/* Create Modal */}
      <TagFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        orgSlug={orgSlug}
        tag={null}
      />

      {/* Bulk Upload Modal */}
      <BulkTagUpload
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        orgSlug={orgSlug}
      />
    </div>
  );
}
