'use client'

import { useState, useEffect, useCallback } from 'react'
import AnimatedDarkBlurOverlay from './AnimatedDarkBlurOverlay'
import StatementBubble from './StatementBubble'
import DraggableBubble from './DraggableBubble'
import {
  type Position,
  checkCircleCollision
} from '../utils/bubble-physics'
import type { Bubble } from '../types'
import './BubbleOverlay.css'

interface BubbleOverlayProps {
  bubble: Bubble
  onClose: () => void
  onCorrect: () => void
  onIncorrect: () => void
  correctSoundUrl?: string
  incorrectSoundUrl?: string
}

const STATEMENT_SIZE = 120
const ANSWER_SIZE = 80
const COLLISION_THRESHOLD = 10 // Extra pixels for easier collision detection

function BubbleOverlay({
  bubble,
  onClose,
  onCorrect,
  onIncorrect,
  correctSoundUrl,
  incorrectSoundUrl
}: BubbleOverlayProps) {
  const [statementPosition, setStatementPosition] = useState<Position>({ x: 0, y: 0 })
  const [answer1Position, setAnswer1Position] = useState<Position>({ x: 0, y: 0 })
  const [answer2Position, setAnswer2Position] = useState<Position>({ x: 0, y: 0 })
  const [animatingBubble, setAnimatingBubble] = useState<string | null>(null)
  const [animationType, setAnimationType] = useState<'correct' | 'incorrect' | null>(null)

  // Initialize bubble positions
  useEffect(() => {

    // Fixed statement bubble position - 80px from top, 40px from left
    const statementPos = { x: 40, y: 80 }
    setStatementPosition(statementPos)

    // Two predefined positions that are guaranteed not to overlap
    const position1 = {
      x: 48,
      y: 520
    }
    const position2 = {
      x: 260,
      y: 360
    }

    // Randomly assign which answer goes to which position
    const randomAssignment = Math.random() < 0.5
    if (randomAssignment) {
      // answer_1 gets position1, answer_2 gets position2
      setAnswer1Position(position1)
      setAnswer2Position(position2)
    } else {
      // answer_1 gets position2, answer_2 gets position1
      setAnswer1Position(position2)
      setAnswer2Position(position1)
    }
  }, [])

  const checkCollisionWithStatement = useCallback((answerPos: Position) => {
    const statementCenter = {
      x: statementPosition.x + STATEMENT_SIZE / 2,
      y: statementPosition.y + STATEMENT_SIZE / 2
    }
    const answerCenter = {
      x: answerPos.x + ANSWER_SIZE / 2,
      y: answerPos.y + ANSWER_SIZE / 2
    }

    return checkCircleCollision(
      statementCenter,
      STATEMENT_SIZE / 2 + COLLISION_THRESHOLD,
      answerCenter,
      ANSWER_SIZE / 2
    )
  }, [statementPosition])

  const handleAnswerDragEnd = useCallback((answerText: string, position: Position) => {
    if (animatingBubble) return // Prevent multiple answers during animation

    if (checkCollisionWithStatement(position)) {
      // DEBUG: Log all bubble data
      console.log('🔍 BUBBLE DEBUG:', {
        question: bubble.question,
        options: bubble.options,
        correctAnswer: bubble.correctAnswer,
        correctAnswerType: typeof bubble.correctAnswer,
        draggedAnswer: answerText,
        fullBubble: bubble
      })

      // Find which index the dragged answer is
      const draggedIndex = bubble.options.indexOf(answerText)

      // Both MCQ and TRUE_FALSE use numeric index (0 or 1)
      const isCorrect = draggedIndex === bubble.correctAnswer

      console.log('🔍 Index comparison:', {
        draggedIndex,
        correctAnswer: bubble.correctAnswer,
        isCorrect
      })
      console.log('✅ Final result:', isCorrect ? 'CORRECT' : 'INCORRECT')

      setAnimatingBubble(answerText)
      setAnimationType(isCorrect ? 'correct' : 'incorrect')

      if (isCorrect) {
        // Animate to center of statement bubble
        setTimeout(() => {
          onCorrect()
          setTimeout(onClose, 400) // Close after animation
        }, 100)
      } else {
        // Flash red and close
        setTimeout(() => {
          onIncorrect()
          setTimeout(onClose, 600) // Close after flash animation
        }, 100)
      }
    }
  }, [bubble.correctAnswer, bubble.options, bubble.question, checkCollisionWithStatement, animatingBubble, onCorrect, onIncorrect, onClose])

  const handleAnswer1PositionChange = useCallback((position: Position) => {
    setAnswer1Position(position)
  }, [])

  const handleAnswer2PositionChange = useCallback((position: Position) => {
    setAnswer2Position(position)
  }, [])

  const handleAnswer1DragEnd = useCallback(() => {
    handleAnswerDragEnd(bubble.options[0], answer1Position)
  }, [handleAnswerDragEnd, answer1Position, bubble.options])

  const handleAnswer2DragEnd = useCallback(() => {
    handleAnswerDragEnd(bubble.options[1], answer2Position)
  }, [handleAnswerDragEnd, answer2Position, bubble.options])

  // Calculate target position for correct answer animation
  const getTargetPosition = (answerText: string) => {
    if (animationType === 'correct' && animatingBubble === answerText) {
      return {
        x: statementPosition.x + (STATEMENT_SIZE - ANSWER_SIZE) / 2,
        y: statementPosition.y + (STATEMENT_SIZE - ANSWER_SIZE) / 2
      }
    }
    return undefined
  }

  return (
    <AnimatedDarkBlurOverlay isOpen={true}>
      <div className="bubble-overlay">
        <StatementBubble
          statement={bubble.question}
          position={statementPosition}
          size={STATEMENT_SIZE}
        />

        <DraggableBubble
          text={bubble.options[0]}
          size={ANSWER_SIZE}
          initialPosition={answer1Position}
          onPositionChange={handleAnswer1PositionChange}
          onDragEnd={handleAnswer1DragEnd}
          isAnimating={animatingBubble === bubble.options[0]}
          animationType={animatingBubble === bubble.options[0] ? animationType || undefined : undefined}
          targetPosition={getTargetPosition(bubble.options[0])}
          correctSoundUrl={correctSoundUrl}
          incorrectSoundUrl={incorrectSoundUrl}
        />

        <DraggableBubble
          text={bubble.options[1]}
          size={ANSWER_SIZE}
          initialPosition={answer2Position}
          onPositionChange={handleAnswer2PositionChange}
          onDragEnd={handleAnswer2DragEnd}
          isAnimating={animatingBubble === bubble.options[1]}
          animationType={animatingBubble === bubble.options[1] ? animationType || undefined : undefined}
          targetPosition={getTargetPosition(bubble.options[1])}
          correctSoundUrl={correctSoundUrl}
          incorrectSoundUrl={incorrectSoundUrl}
        />
      </div>
    </AnimatedDarkBlurOverlay>
  )
}

export default BubbleOverlay
