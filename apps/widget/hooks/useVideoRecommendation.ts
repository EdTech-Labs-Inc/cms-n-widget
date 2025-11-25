import { useCallback } from 'react'
import type { ChatMessageType } from '../contexts/ChatContext'

interface Video {
  id: string
  title: string
  video_thumbnail_url: string
  video_url?: string
  uploading?: boolean
  section_id?: string
}

export function useVideoRecommendation(
  validVideos: Video[],
  watchedVideos: string[],
  sectionId: string | null,
  addStreamingMessage: (message: ChatMessageType) => void,
  setCurrentVideoId: (videoId: string | null) => void,
  setCurrentPhase: (phase: 'initial' | 'video-questions' | 'next-recommendation') => void
) {
  const recommendNextVideo = useCallback(() => {
    // If we have a section with limited videos (3 per section), cycle through them
    if (sectionId && validVideos.length > 0) {
      // Filter out watched videos
      const unwatchedVideos = validVideos.filter(v => !watchedVideos.includes(v.id))
      
      let nextVideo: Video
      if (unwatchedVideos.length > 0) {
        // Pick first unwatched video
        nextVideo = unwatchedVideos[0]
      } else {
        // All videos watched, pick randomly from all section videos
        nextVideo = validVideos[Math.floor(Math.random() * validVideos.length)]
      }
      
      const message: ChatMessageType = {
        id: `recommendation-${Date.now()}`,
        message: `Based on your responses, I recommend watching "${nextVideo.title}". This video will help reinforce the concepts we've covered.`,
        type: 'system',
        isStreaming: true,
        videoRecommendation: {
          id: nextVideo.id,
          title: nextVideo.title,
          video_thumbnail_url: nextVideo.video_thumbnail_url
        }
      }
      
      addStreamingMessage(message)
      setCurrentVideoId(nextVideo.id)
      setCurrentPhase('video-questions')
      return
    }
    
    // Non-section mode logic
    const unwatchedVideos = validVideos.filter(v => !watchedVideos.includes(v.id))
    
    if (unwatchedVideos.length === 0) {
      // All videos watched
      const message: ChatMessageType = {
        id: `all-watched-${Date.now()}`,
        message: 'You\'ve watched all available videos! Great job on completing your learning journey.',
        type: 'system',
        isStreaming: true
      }
      addStreamingMessage(message)
      return
    }
    
    const randomVideo = unwatchedVideos[Math.floor(Math.random() * unwatchedVideos.length)]
    
    const message: ChatMessageType = {
      id: `recommendation-${Date.now()}`,
      message: `Based on your responses, I recommend watching "${randomVideo.title}". This video will help reinforce the concepts we've covered.`,
      type: 'system',
      isStreaming: true,
      videoRecommendation: {
        id: randomVideo.id,
        title: randomVideo.title,
        video_thumbnail_url: randomVideo.video_thumbnail_url
      }
    }
    
    addStreamingMessage(message)
    setCurrentVideoId(randomVideo.id)
    setCurrentPhase('video-questions')
  }, [validVideos, watchedVideos, sectionId, addStreamingMessage, setCurrentVideoId, setCurrentPhase])

  return { recommendNextVideo }
}