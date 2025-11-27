'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useChatContext } from '@/hooks/useChatContext'
import { VideoPlayer, type Video } from '@repo/video-player'
import BackButton from '@/components/common/BackButton'
import XPGainAnimation from '@/components/learning-hub/XPGainAnimation'
import { addXP, XP_REWARDS } from '@/utils/xpManager'
import { markContentCompleted, areAllBubblesCorrect, isContentCompleted, recordBubbleAnswer } from '@/utils/completionTracker'
import '../../app/single-video/SingleVideoPlayer.css'

interface VideoPlayerWrapperProps {
  video: Video
}

function VideoPlayerWrapper({ video }: VideoPlayerWrapperProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { addWatchedVideo, resetForNewVideo } = useChatContext()

  useAuth()

  const returnTo = searchParams?.get('returnTo') || '/'
  const skipQuestions = searchParams?.get('skipQuestions') === 'true'
  const [hasCompleted, setHasCompleted] = useState(false)
  const [showXPAnimation, setShowXPAnimation] = useState(false)
  const [xpEarned, setXPEarned] = useState(0)

  // Check if video was already completed
  useEffect(() => {
    if (video && isContentCompleted(video.id)) {
      setHasCompleted(true)
    }
  }, [video])

  const handleComplete = (completedVideoId: string) => {
    if (!hasCompleted) {
      setHasCompleted(true)
      console.log('[XP Debug] Video completed:', completedVideoId)

      // Mark video as watched
      addWatchedVideo(completedVideoId)

      // Prepare chat context for video questions
      resetForNewVideo(completedVideoId)

      // Check if video is already completed
      const alreadyCompleted = isContentCompleted(completedVideoId)
      console.log('[XP Debug] Video already completed:', alreadyCompleted)

      // Check if all bubbles were answered correctly
      const allBubblesCorrect = areAllBubblesCorrect(completedVideoId)
      console.log('[XP Debug] All bubbles correct:', allBubblesCorrect)

      if (!alreadyCompleted) {
        console.log('[XP Debug] Awarding video XP')

        // Award XP for completing video
        // Note: For now we award XP regardless of bubble correctness
        // Later we can change this to: if (allBubblesCorrect) { ... }
        const xpResult = addXP(XP_REWARDS.VIDEO_COMPLETE)
        setXPEarned(XP_REWARDS.VIDEO_COMPLETE)
        setShowXPAnimation(true)

        // Mark content as completed
        markContentCompleted(completedVideoId, 'video', XP_REWARDS.VIDEO_COMPLETE, allBubblesCorrect)

        console.log('[XP Debug] Video XP awarded:', XP_REWARDS.VIDEO_COMPLETE, 'New level:', xpResult.newLevel)
        console.log('[XP Debug] Animation state - xpEarned:', XP_REWARDS.VIDEO_COMPLETE, 'showXPAnimation:', true)
      } else {
        console.log('[XP Debug] Video already completed, no XP awarded')
      }

      // Navigate back with completion indicator (with delay for XP animation)
      const delay = showXPAnimation ? 2500 : 500
      console.log('[XP Debug] Navigating back in', delay, 'ms')

      setTimeout(() => {
        const params = new URLSearchParams({ videoCompleted: completedVideoId })
        if (skipQuestions) {
          params.set('skipQuestions', 'true')
        }
        router.push(`${returnTo}?${params.toString()}`)
      }, delay)
    }
  }

  const handleLike = (videoId: string) => {
    console.log('Video liked:', videoId)
  }

  const handleBookmark = (videoId: string) => {
    console.log('Video bookmarked:', videoId)
  }

  const handleShare = (videoId: string) => {
    console.log('Share video:', videoId)
    if (navigator.share) {
      navigator.share({
        title: video?.title || 'Check out this video',
        url: window.location.href
      }).catch(err => console.log('Error sharing:', err))
    }
  }

  const handleBubbleAnswer = (bubbleId: string, isCorrect: boolean) => {
    console.log('[XP Debug] Bubble answered:', bubbleId, 'correct:', isCorrect)
    if (video?.id) {
      recordBubbleAnswer(video.id, bubbleId, isCorrect)
    }
  }

  const handleBack = () => {
    // Navigate immediately, marking as complete if not already done
    if (video && !hasCompleted) {
      setHasCompleted(true)
      addWatchedVideo(video.id)
      resetForNewVideo(video.id)
    }
    router.push(returnTo)
  }

  return (
    <div className="svp-container">
      <BackButton onClick={handleBack} />
      <div className="svp-video-wrapper">
        <VideoPlayer
          video={video}
          bubbles={video.bubbles}
          isActive={true}
          onComplete={handleComplete}
          onLike={handleLike}
          onBookmark={handleBookmark}
          onShare={handleShare}
          onBubbleAnswer={handleBubbleAnswer}
        />
      </div>

      {/* XP Gain Animation */}
      <XPGainAnimation
        amount={xpEarned}
        isVisible={showXPAnimation}
        onComplete={() => setShowXPAnimation(false)}
        position="center"
      />
    </div>
  )
}

export default VideoPlayerWrapper
