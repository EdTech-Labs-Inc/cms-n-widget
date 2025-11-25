/**
 * Simplified BubbleOverlay Component
 * Replaces complex physics-based implementation with simple text render
 *
 * NOTE: This is intentionally simplified from the original 203-line implementation.
 * The original included:
 * - AnimatedDarkBlurOverlay
 * - StatementBubble with physics
 * - DraggableBubble with collision detection
 * - Complex answer validation
 * - Sound effects support
 *
 * All of this has been replaced with a simple text display.
 */

'use client'

import type { Bubble } from '../types'

interface BubbleOverlayProps {
  bubble: Bubble
  onClose: () => void
  onCorrect: () => void
  onIncorrect: () => void
  correctSoundUrl?: string
  incorrectSoundUrl?: string
}

function BubbleOverlay({
  bubble,
  onClose,
  onCorrect,
  onIncorrect,
  correctSoundUrl,
  incorrectSoundUrl
}: BubbleOverlayProps) {
  return (
    <div className="bubble-overlay">
      Bubble Overlay
    </div>
  )
}

export default BubbleOverlay
