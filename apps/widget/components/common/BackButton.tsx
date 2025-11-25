'use client'

import { memo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import './BackButton.css'
import { LuArrowLeft } from 'react-icons/lu'

interface BackButtonProps {
  onClick?: () => void
  className?: string
  position?: {
    top?: string
    left?: string
    right?: string
    bottom?: string
  }
  variant?: 'dark' | 'light'
  size?: 'small' | 'medium' | 'large'
  navigateTo?: string
}

const BackButton = memo(function BackButton({
  onClick,
  className = '',
  position = { top: '20px', left: '20px' },
  variant = 'dark',
  size = 'medium',
  navigateTo
}: BackButtonProps) {
  const router = useRouter()

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick()
    } else if (navigateTo) {
      router.push(navigateTo)
    } else {
      router.back()
    }
  }, [onClick, router, navigateTo])

  const positionStyles = {
    ...(position.top && { top: position.top }),
    ...(position.left && { left: position.left }),
    ...(position.right && { right: position.right }),
    ...(position.bottom && { bottom: position.bottom })
  }

  return (
    <button
      className={`back-button back-button--${variant} back-button--${size} ${className}`}
      onClick={handleClick}
      style={positionStyles}
      aria-label="Go back"
      type="button"
    >
      <LuArrowLeft className="back-button__icon" color="white" />
    </button>
  )
})

export default BackButton