'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Upload } from 'lucide-react';
import { useTagCategories } from '@/lib/api/hooks';
import { TagGrid } from '@/components/tags/TagGrid';
import { TagFormModal } from '@/components/tags/TagFormModal';
import { BulkTagUpload } from '@/components/tags/BulkTagUpload';
import { FilterDropdown } from '@/components/ui/FilterDropdown';

export default function TagManagementPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const { data: categoriesData } = useTagCategories(orgSlug);
  const categories: string[] = categoriesData || [];

  // Build filter options
  const filterOptions = [
    { value: 'all', label: 'All Tags' },
    { value: 'uncategorized', label: 'Uncategorized' },
    ...categories.map((cat) => ({ value: cat, label: cat })),
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Tag Management</h1>
          <p className="text-text-secondary">Create and manage tags for organizing your content</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Bulk Upload Button */}
          <button onClick={() => setShowBulkUpload(true)} className="btn btn-secondary inline-flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Bulk Upload
          </button>

          {/* Add Tag Button */}
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Tag
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-6">
        <FilterDropdown
          singleSelect
          label="Category"
          options={filterOptions}
          value={categoryFilter}
          onChange={setCategoryFilter}
        />
      </div>

      {/* Tag Grid */}
      <TagGrid orgSlug={orgSlug} categoryFilter={categoryFilter} />

      {/* Create Modal */}
      <TagFormModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} orgSlug={orgSlug} tag={null} />

      {/* Bulk Upload Modal */}
      <BulkTagUpload isOpen={showBulkUpload} onClose={() => setShowBulkUpload(false)} orgSlug={orgSlug} />
    </div>
  );
}
