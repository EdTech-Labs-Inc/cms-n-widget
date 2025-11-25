'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { Position, BubblePhysics } from '../utils/bubble-physics'
import { updateBubblePosition, calculateFlickVelocity } from '../utils/bubble-physics'
import './DraggableBubble.css'

interface DraggableBubbleProps {
  text: string
  size: number
  initialPosition: Position
  onPositionChange: (position: Position) => void
  onDragEnd: () => void
  isAnimating?: boolean
  animationType?: 'correct' | 'incorrect'
  targetPosition?: Position
  correctSoundUrl?: string
  incorrectSoundUrl?: string
}

function DraggableBubble({
  text,
  size,
  initialPosition,
  onPositionChange,
  onDragEnd,
  isAnimating = false,
  animationType,
  targetPosition,
  correctSoundUrl = '/assets/bubble-correct3.wav',
  incorrectSoundUrl = '/assets/bubble-incorrect.wav'
}: DraggableBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null)
  const [bubble, setBubble] = useState<BubblePhysics>({
    position: initialPosition,
    velocity: { x: 0, y: 0 },
    isMoving: false
  })

  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ position: Position; time: number } | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const correctAudioRef = useRef<HTMLAudioElement | null>(null)
  const incorrectAudioRef = useRef<HTMLAudioElement | null>(null)

  // Physics animation loop
  const animate = useCallback(() => {
    setBubble(prevBubble => {
      if (!prevBubble.isMoving) return prevBubble

      // Get container dimensions instead of window dimensions
      const container = bubbleRef.current?.closest('.vs-player') || bubbleRef.current?.closest('.blur-overlay')
      const screenWidth = container?.clientWidth || window.innerWidth
      const screenHeight = container?.clientHeight || window.innerHeight

      const newBubble = updateBubblePosition(prevBubble, size, screenWidth, screenHeight)

      if (newBubble.isMoving) {
        animationFrameRef.current = requestAnimationFrame(animate)
      }

      return newBubble
    })
  }, [size])

  // Notify parent of position changes (separate from render)
  useEffect(() => {
    onPositionChange(bubble.position)
  }, [bubble.position.x, bubble.position.y, onPositionChange])

  // Initialize audio elements
  useEffect(() => {
    correctAudioRef.current = new Audio(correctSoundUrl)
    incorrectAudioRef.current = new Audio(incorrectSoundUrl)

    // Preload the audio files
    correctAudioRef.current.preload = 'auto'
    incorrectAudioRef.current.preload = 'auto'

    // Set volume to a reasonable level
    correctAudioRef.current.volume = 0.6
    incorrectAudioRef.current.volume = 0.6

    return () => {
      // Cleanup on unmount
      if (correctAudioRef.current) {
        correctAudioRef.current.pause()
        correctAudioRef.current = null
      }
      if (incorrectAudioRef.current) {
        incorrectAudioRef.current.pause()
        incorrectAudioRef.current = null
      }
    }
  }, [correctSoundUrl, incorrectSoundUrl])

  // Sync internal position with initialPosition prop changes
  useEffect(() => {
    setBubble(prev => ({ ...prev, position: initialPosition }))
  }, [initialPosition])

  // Start animation loop when bubble starts moving
  useEffect(() => {
    if (bubble.isMoving && !animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [bubble.isMoving, animate])

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isAnimating) return

    e.preventDefault()
    e.stopPropagation()

    setIsDragging(true)
    dragStartRef.current = {
      position: { x: e.clientX, y: e.clientY },
      time: Date.now()
    }

    setBubble(prev => ({ ...prev, velocity: { x: 0, y: 0 }, isMoving: false }))

    if (bubbleRef.current) {
      bubbleRef.current.setPointerCapture(e.pointerId)
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || isAnimating) return

    e.preventDefault()

    // Get position relative to the video player container
    const target = e.currentTarget as HTMLElement
    const container = target.closest('.vs-player') || target.closest('.blur-overlay')

    if (container) {
      const rect = container.getBoundingClientRect()
      const newPosition = {
        x: e.clientX - rect.left - size / 2,
        y: e.clientY - rect.top - size / 2
      }
      setBubble(prev => ({ ...prev, position: newPosition }))
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging || isAnimating) return

    e.preventDefault()
    setIsDragging(false)

    if (dragStartRef.current) {
      const endPos = { x: e.clientX, y: e.clientY }
      const timeDelta = Date.now() - dragStartRef.current.time
      const velocity = calculateFlickVelocity(dragStartRef.current.position, endPos, timeDelta)

      setBubble(prev => ({
        ...prev,
        velocity,
        isMoving: Math.abs(velocity.x) > 1 || Math.abs(velocity.y) > 1
      }))
    }

    dragStartRef.current = null
    onDragEnd()

    if (bubbleRef.current) {
      bubbleRef.current.releasePointerCapture(e.pointerId)
    }
  }

  // Handle animation updates and play sounds
  useEffect(() => {
    if (isAnimating && animationType) {
      // Play appropriate sound effect
      if (animationType === 'correct' && correctAudioRef.current) {
        correctAudioRef.current.currentTime = 0 // Reset to start
        correctAudioRef.current.play().catch(error => {
          console.warn('Could not play correct sound:', error)
        })
      } else if (animationType === 'incorrect' && incorrectAudioRef.current) {
        incorrectAudioRef.current.currentTime = 0 // Reset to start
        incorrectAudioRef.current.play().catch(error => {
          console.warn('Could not play incorrect sound:', error)
        })
      }

      // Handle visual animations
      if (animationType === 'correct' && targetPosition) {
        // Position will be animated via CSS, just update state to match
        setBubble(prev => ({ ...prev, position: targetPosition, isMoving: false }))
      } else if (animationType === 'incorrect') {
        // For incorrect, just stop movement and let CSS handle the flash
        setBubble(prev => ({ ...prev, velocity: { x: 0, y: 0 }, isMoving: false }))
      }
    }
  }, [isAnimating, animationType, targetPosition])

  const bubbleStyle = {
    left: bubble.position.x,
    top: bubble.position.y,
    width: size,
    height: size,
    transform: isAnimating && animationType === 'correct' && targetPosition
      ? `translate(${targetPosition.x - bubble.position.x}px, ${targetPosition.y - bubble.position.y}px) scale(0)`
      : 'none'
  }

  return (
    <div
      ref={bubbleRef}
      className={`draggable-bubble ${isDragging ? 'draggable-bubble--dragging' : ''} ${isAnimating ? `draggable-bubble--${animationType}` : ''}`}
      style={bubbleStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="draggable-bubble__content">
        {text}
      </div>
    </div>
  )
}

export default DraggableBubble
