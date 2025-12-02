'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useDeleteTag } from '@/lib/api/hooks';
import { useToast } from '@/components/ui/ToastContainer';
import type { Tag } from '@repo/api-client/types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgSlug: string;
  tag: Tag | null;
}

export function DeleteConfirmModal({ isOpen, onClose, orgSlug, tag }: DeleteConfirmModalProps) {
  const deleteTag = useDeleteTag(orgSlug);
  const toast = useToast();

  const handleDelete = async () => {
    if (!tag) return;

    try {
      await deleteTag.mutateAsync(tag.id);
      toast.success('Tag Deleted', `"${tag.name}" has been deleted`);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast.error('Delete Failed', message);
    }
  };

  if (!isOpen || !tag) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-background-secondary rounded-xl shadow-2xl border border-white-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary">Delete Tag</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-white-10 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-text-secondary mb-4">
            Are you sure you want to delete the tag <span className="font-semibold text-text-primary">"{tag.name}"</span>?
          </p>

          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-6">
            <p className="text-sm text-text-secondary">
              <strong className="text-text-primary">Warning:</strong> This will remove this tag from all content it's attached to. This action cannot be undone.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={deleteTag.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="btn bg-red-500/20 text-red-400 hover:bg-red-500/30"
              disabled={deleteTag.isPending}
            >
              {deleteTag.isPending ? 'Deleting...' : 'Delete Tag'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
