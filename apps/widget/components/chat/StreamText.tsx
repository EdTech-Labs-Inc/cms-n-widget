'use client'

import { useState, useEffect, memo } from 'react'
import './StreamText.css'

interface StreamTextProps {
  text: string
  speed?: number // milliseconds per character
  onComplete?: () => void
  className?: string
}

const StreamText = memo(function StreamText({ 
  text, 
  speed = 20, 
  onComplete, 
  className = '' 
}: StreamTextProps) {
  const [visibleLength, setVisibleLength] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (visibleLength >= text.length) {
      if (!isComplete) {
        setIsComplete(true)
        onComplete?.()
      }
      return
    }

    const timer = setTimeout(() => {
      setVisibleLength(prev => prev + 1)
    }, speed)

    return () => clearTimeout(timer)
  }, [visibleLength, text.length, speed, onComplete, isComplete])

  // Reset when text changes
  useEffect(() => {
    setVisibleLength(0)
    setIsComplete(false)
  }, [text])

  const visibleText = text.slice(0, visibleLength)

  return (
    <div className={`stream-text ${className}`}>
      {visibleText}
    </div>
  )
})

export default StreamText