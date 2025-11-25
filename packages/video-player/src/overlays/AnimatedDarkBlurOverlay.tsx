'use client'

import type { ReactNode } from 'react'
import './AnimatedDarkBlurOverlay.css'

interface AnimatedDarkBlurOverlayProps {
  isOpen: boolean
  children: ReactNode
}

function AnimatedDarkBlurOverlay({ isOpen, children }: AnimatedDarkBlurOverlayProps) {
  if (!isOpen) return null

  return (
    <div className="blur-overlay">
      <div className="blur-overlay__backdrop" />
      <div className="blur-overlay__content">
        {children}
      </div>
    </div>
  )
}

export default AnimatedDarkBlurOverlay