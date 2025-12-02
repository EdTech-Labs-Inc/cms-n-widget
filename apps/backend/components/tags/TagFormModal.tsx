'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCreateTag, useUpdateTag, useTagCategories } from '@/lib/api/hooks';
import { useToast } from '@/components/ui/ToastContainer';
import type { Tag } from '@repo/api-client/types';

interface TagFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgSlug: string;
  tag?: Tag | null; // If provided, edit mode; otherwise create mode
}

export function TagFormModal({ isOpen, onClose, orgSlug, tag }: TagFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const createTag = useCreateTag(orgSlug);
  const updateTag = useUpdateTag(orgSlug);
  const { data: categoriesData } = useTagCategories(orgSlug);
  const toast = useToast();

  const isEditMode = !!tag;
  const isLoading = createTag.isPending || updateTag.isPending;

  // Populate form when editing
  useEffect(() => {
    if (tag) {
      setName(tag.name);
      setDescription(tag.description || '');
      setCategory(tag.category || '');
    } else {
      setName('');
      setDescription('');
      setCategory('');
    }
  }, [tag, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Validation Error', 'Tag name is required');
      return;
    }

    try {
      if (isEditMode && tag) {
        await updateTag.mutateAsync({
          id: tag.id,
          data: {
            name: name.trim(),
            description: description.trim() || undefined,
            category: category.trim() || undefined,
          },
        });
        toast.success('Tag Updated', `"${name}" has been updated`);
      } else {
        await createTag.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          category: category.trim() || undefined,
        });
        toast.success('Tag Created', `"${name}" has been created`);
      }
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast.error(isEditMode ? 'Update Failed' : 'Create Failed', message);
    }
  };

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    setShowCategoryDropdown(false);
  };

  if (!isOpen) return null;

  const existingCategories: string[] = categoriesData || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-background-secondary rounded-xl shadow-2xl border border-white-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white-10">
          <h2 className="text-xl font-semibold text-text-primary">
            {isEditMode ? 'Edit Tag' : 'Create Tag'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-white-10 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="tag-name" className="block text-sm font-medium text-text-secondary mb-2">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              id="tag-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter tag name"
              className="input w-full"
              maxLength={200}
              required
            />
          </div>

          {/* Category */}
          <div className="relative">
            <label htmlFor="tag-category" className="block text-sm font-medium text-text-secondary mb-2">
              Category
            </label>
            <input
              id="tag-category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onFocus={() => setShowCategoryDropdown(true)}
              onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
              placeholder="Enter or select a category"
              className="input w-full"
            />
            {/* Category suggestions dropdown */}
            {showCategoryDropdown && existingCategories.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-background-primary border border-white-15 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {existingCategories
                  .filter((cat) => cat.toLowerCase().includes(category.toLowerCase()))
                  .map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onMouseDown={() => handleCategorySelect(cat)}
                      className="w-full px-4 py-2 text-left text-text-primary hover:bg-white-10 transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      {cat}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="tag-description" className="block text-sm font-medium text-text-secondary mb-2">
              Description
            </label>
            <textarea
              id="tag-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this tag"
              className="input w-full min-h-[80px] resize-y"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Tag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
