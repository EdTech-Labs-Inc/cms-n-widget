'use client'

import { createContext, useState, type ReactNode } from 'react'
import type { Question } from '@/types'

export interface ChatMessageType {
  id: string
  message: string
  type: 'system' | 'user'
  isStreaming?: boolean
  flashType?: 'correct' | 'incorrect'
  isCorrect?: boolean
  hidden?: boolean
  videoRecommendation?: {
    id: string
    title: string
    video_thumbnail_url: string
  }
}

export type ChatPhase = 'initial' | 'video-questions' | 'next-recommendation'

interface VideoQuestionState {
  videoId: string
  questions: Question[]
  currentQuestionIndex: number
  wronglyAnsweredIndexes: number[]
}

interface ChatContextType {
  // Conversation history
  messages: ChatMessageType[]
  setMessages: (messages: ChatMessageType[] | ((prev: ChatMessageType[]) => ChatMessageType[])) => void
  
  // Current assessment state
  currentPhase: ChatPhase
  setCurrentPhase: (phase: ChatPhase) => void
  
  // Video and question management
  currentVideoId: string | null
  setCurrentVideoId: (videoId: string | null) => void
  videoQuestionState: VideoQuestionState | null
  setVideoQuestionState: (state: VideoQuestionState | null) => void
  
  // Tracking
  watchedVideos: string[]
  addWatchedVideo: (videoId: string) => void
  askedQuestions: string[]
  addAskedQuestion: (questionId: string) => void
  
  // State management
  resetForNewVideo: (videoId: string) => void
  clearContext: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)



interface ChatProviderProps {
  children: ReactNode
}

export function ChatProvider({ children }: ChatProviderProps) {
  // Core state
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [currentPhase, setCurrentPhase] = useState<ChatPhase>('initial')
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null)
  const [videoQuestionState, setVideoQuestionState] = useState<VideoQuestionState | null>(null)
  const [watchedVideos, setWatchedVideos] = useState<string[]>([])
  const [askedQuestions, setAskedQuestions] = useState<string[]>([])

  const addWatchedVideo = (videoId: string) => {
    if (!watchedVideos.includes(videoId)) {
      setWatchedVideos(prev => [...prev, videoId])
    }
  }

  const addAskedQuestion = (questionId: string) => {
    if (!askedQuestions.includes(questionId)) {
      setAskedQuestions(prev => [...prev, questionId])
    }
  }

  const resetForNewVideo = (videoId: string) => {
    setCurrentVideoId(videoId)
    setCurrentPhase('video-questions')
    setVideoQuestionState(null)
  }

  const clearContext = () => {
    setMessages([])
    setCurrentPhase('initial')
    setCurrentVideoId(null)
    setVideoQuestionState(null)
    setWatchedVideos([])
    setAskedQuestions([])
  }

  const contextValue: ChatContextType = {
    messages,
    setMessages,
    currentPhase,
    setCurrentPhase,
    currentVideoId,
    setCurrentVideoId,
    videoQuestionState,
    setVideoQuestionState,
    watchedVideos,
    addWatchedVideo,
    askedQuestions,
    addAskedQuestion,
    resetForNewVideo,
    clearContext
  }

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  )
}

export default ChatContext