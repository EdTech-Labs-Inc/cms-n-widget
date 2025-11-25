'use client'

import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface MediaPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
}

export function MediaPreviewModal({ isOpen, onClose, children, title }: MediaPreviewModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Modal container with mobile viewport */}
      <div className="relative flex flex-col bg-background-secondary rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-background-primary border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            {title || 'Preview'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-secondary rounded-lg transition-colors"
            aria-label="Close preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile viewport frame - 360x680 */}
        <div className="flex items-center justify-center p-4 bg-gray-900">
          <div className="relative w-[360px] h-[680px] bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Mobile screen content */}
            <div className="w-full h-full overflow-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
