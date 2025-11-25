'use client'

import { memo } from 'react'
import StreamText from './StreamText'
import './ChatMessage.css'

interface ChatMessageProps {
  message: string
  type: 'system' | 'user'
  isStreaming?: boolean
  onStreamComplete?: () => void
  className?: string
  isCorrect?: boolean
}

const ChatMessage = memo(function ChatMessage({ 
  message, 
  type, 
  isStreaming = false, 
  onStreamComplete,
  className = '',
  isCorrect
}: ChatMessageProps) {
  // Build className with answer correctness styling
  const answerClassName = type === 'user' && isCorrect !== undefined 
    ? (isCorrect ? 'answer-correct' : 'answer-incorrect')
    : ''
  
  return (
    <div className={`chat-message chat-message--${type} ${className} ${answerClassName}`}>
      <div className="chat-message__content">
        {isStreaming ? (
          <StreamText 
            text={message} 
            speed={30}
            onComplete={onStreamComplete}
            className="chat-message__text"
          />
        ) : (
          <div className="chat-message__text">{message}</div>
        )}
      </div>
    </div>
  )
})

export default ChatMessage