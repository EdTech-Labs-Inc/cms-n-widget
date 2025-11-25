'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { InteractivePodcastPlayer, type PodcastData } from '@repo/interactive-podcast-player'
import { trpcReact, TRPCProvider } from '@/lib/trpc-react'
import XPGainAnimation from '@/components/learning-hub/XPGainAnimation'
import { addXP, XP_REWARDS } from '@/utils/xpManager'
import {
  markContentCompleted,
  recordInteractivePromptAnswer,
  areAllPromptsCorrect,
  isContentCompleted
} from '@/utils/completionTracker'
import './InteractivePodcasts.css'

function InteractivePodcastContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const podcastId = searchParams?.get('id')
  const [showXPAnimation, setShowXPAnimation] = useState(false)
  const [xpEarned, setXPEarned] = useState(0)
  const [promptIndex, setPromptIndex] = useState(0)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  // Fetch interactive podcast data from tRPC
  const { data: podcastData, isLoading, error } = trpcReact.getInteractivePodcast.useQuery(
    { id: podcastId || '' },
    { enabled: !!podcastId }
  )

  if (!podcastId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>No podcast selected</h2>
        <p>Please select an interactive podcast from the learning hub.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Loading interactive podcast...</h2>
      </div>
    )
  }

  if (error || !podcastData) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Error loading podcast</h2>
        <p>{error?.message || 'Could not load the interactive podcast.'}</p>
      </div>
    )
  }

  // Debug: Log the actual segments structure
  console.log('[InteractivePodcast Page] Raw data from tRPC:', podcastData)
  console.log('[InteractivePodcast Page] First segment:', podcastData.segments?.[0])
  const firstInteractive = podcastData.segments?.find((s: any) => s.interactive)
  console.log('[InteractivePodcast Page] First interactive segment:', firstInteractive)
  if (firstInteractive) {
    console.log('[InteractivePodcast Page] Interactive words:', firstInteractive.words)
    console.log('[InteractivePodcast Page] Interactive object:', firstInteractive.interactive)
  }

  // Transform the data to match the expected format
  const transformedData: PodcastData = {
    podcastId: podcastData.id,
    title: podcastData.title || 'Untitled Interactive Podcast',
    thumbnailUrl: podcastData.thumbnailUrl || undefined,
    audioFile: podcastData.audioFileUrl,
    duration: podcastData.duration || 0,
    segments: podcastData.segments || [],
  }

  // Handler for when user answers a prompt
  const handlePromptAnswer = (isCorrect: boolean) => {
    if (podcastId) {
      recordInteractivePromptAnswer(podcastId, promptIndex, isCorrect)
      setPromptIndex(prev => prev + 1)
    }
  }

  // Handler for podcast completion
  const handleComplete = () => {
    console.log('[XP Debug] Podcast completion triggered, podcastId:', podcastId)

    if (!podcastId) {
      router.push('/')
      return
    }

    // For now, just award XP on completion without checking prompts
    // since the InteractivePodcastPlayer doesn't integrate with our tracking yet
    if (!isContentCompleted(podcastId)) {
      console.log('[XP Debug] Awarding XP for podcast completion')

      // Award XP for completing interactive podcast
      const xpResult = addXP(XP_REWARDS.INTERACTIVE_PODCAST_COMPLETE)
      setXPEarned(XP_REWARDS.INTERACTIVE_PODCAST_COMPLETE)
      setShowXPAnimation(true)

      // Mark content as completed
      markContentCompleted(
        podcastId,
        'interactive-podcast',
        XP_REWARDS.INTERACTIVE_PODCAST_COMPLETE,
        true
      )

      console.log('[XP Debug] Interactive Podcast XP awarded:', XP_REWARDS.INTERACTIVE_PODCAST_COMPLETE, 'New level:', xpResult.newLevel)
      console.log('[XP Debug] Showing animation, xpEarned:', XP_REWARDS.INTERACTIVE_PODCAST_COMPLETE, 'showXPAnimation:', true)

      // Navigate back with delay for XP animation
      setTimeout(() => {
        router.push('/')
      }, 2500)
    } else {
      console.log('[XP Debug] Podcast already completed, no XP awarded')
      router.push('/')
    }
  }

  // Render the interactive podcast player
  return (
    <>
      <InteractivePodcastPlayer
        podcastData={transformedData}
        onBack={() => router.push('/')}
        onComplete={handleComplete}
        onPromptAnswer={handlePromptAnswer}
      />

      {/* XP Gain Animation */}
      <XPGainAnimation
        amount={xpEarned}
        isVisible={showXPAnimation}
        onComplete={() => setShowXPAnimation(false)}
        position="center"
      />
    </>
  )
}

export default function InteractivePodcasts() {
  return (
    <TRPCProvider>
      <InteractivePodcastContent />
    </TRPCProvider>
  )
}
