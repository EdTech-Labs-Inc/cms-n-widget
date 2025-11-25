'use client'

import type { Position } from '../utils/bubble-physics'
import './StatementBubble.css'

interface StatementBubbleProps {
  statement: string
  position: Position
  size: number
}

function StatementBubble({ statement, position, size }: StatementBubbleProps) {
  const bubbleStyle = {
    left: position.x,
    top: position.y,
    width: size,
    height: size
  }

  return (
    <div 
      className="statement-bubble"
      style={bubbleStyle}
    >
      <div className="statement-bubble__content">
        {statement}
      </div>
      <div className="statement-bubble__drop-zone" />
    </div>
  )
}

export default StatementBubble