'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react'
import { fisherYatesShuffle } from '@/utils/arrayUtils'
import './TranscriptDisplay.css'

interface Word {
  text: string
  start_time: number
  end_time: number
  isBlank?: boolean
  correctAnswer?: string
}

interface TranscriptSegment {
  id: string
  startTime: number
  endTime: number
  text: string
  words?: Word[]
  wordsBeforeInteractive?: Word[]  // Words that appear before the interactive question
  wordsAfterInteractive?: Word[]   // Words that appear after the interactive question (continue animating after answer)
  keywords?: string[]
  interactive?: {
    triggerTime: number
    type: 'fill-blank'
    question: string
    options: string[]
    correctAnswer: string
    explanation: string
  }
}

interface TranscriptDisplayProps {
  segments: TranscriptSegment[]
  currentTime: number
  isPlaying: boolean
  onInteractiveAnswer: (isCorrect: boolean, triggerTime: number) => void
  completedPrompts: Set<number>
  isPausedForInteraction: boolean
}

function TranscriptDisplay({ segments, currentTime, isPlaying, onInteractiveAnswer, completedPrompts, isPausedForInteraction }: TranscriptDisplayProps) {
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0)
  const [displayedSegments, setDisplayedSegments] = useState<number[]>([0])
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, {answer: string, isCorrect: boolean}>>({})
  const [showFeedback, setShowFeedback] = useState<Record<number, boolean>>({})
  const [hiddenElements, setHiddenElements] = useState<Record<number, boolean>>({})
  const [shuffledOptions, setShuffledOptions] = useState<Record<number, string[]>>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([])

  // Create audio elements for sound feedback
  const duolingoCorrect = '/assets/duolingo-correct.mp3'
  const duolingoIncorrect = '/assets/duolingo-incorrect.mp3'
  const correctAudio = useMemo(() => new Audio(duolingoCorrect), [])
  const incorrectAudio = useMemo(() => new Audio(duolingoIncorrect), [])

  // Cleanup audio objects on unmount
  useEffect(() => {
    return () => {
      correctAudio.pause()
      correctAudio.src = ''
      incorrectAudio.pause()
      incorrectAudio.src = ''
    }
  }, [correctAudio, incorrectAudio])

  // Generate shuffled options for interactive segments when they're first encountered
  useEffect(() => {
    segments.forEach(segment => {
      if (segment.interactive && 
          currentTime >= segment.interactive.triggerTime && 
          !shuffledOptions[segment.interactive.triggerTime]) {
        const randomizedOptions = fisherYatesShuffle(segment.interactive!.options)
        setShuffledOptions(prev => ({
          ...prev,
          [segment.interactive!.triggerTime]: randomizedOptions
        }))
      }
    })
  }, [segments, currentTime, shuffledOptions])

  useEffect(() => {
    // Check if there's a segment with an unanswered interaction that should remain active
    const segmentWithUnansweredInteraction = segments.find(s => 
      s.interactive && 
      currentTime >= s.interactive.triggerTime &&
      !completedPrompts.has(s.interactive.triggerTime)
    )
    
    let currentSegmentIndex
    if (segmentWithUnansweredInteraction) {
      // Keep the segment with unanswered interaction active
      currentSegmentIndex = segments.findIndex(s => s.id === segmentWithUnansweredInteraction.id)
    } else {
      // Normal segment progression
      currentSegmentIndex = segments.findIndex(
        segment => currentTime >= segment.startTime && currentTime < segment.endTime
      )
    }
    
    if (currentSegmentIndex !== -1 && currentSegmentIndex !== activeSegmentIndex) {
      setActiveSegmentIndex(currentSegmentIndex)
      
      // Show all segments up to and including the current one (past + current)
      const segmentsToShow = [...Array(currentSegmentIndex + 1).keys()]
      setDisplayedSegments(segmentsToShow)
      
      // Center the current segment
      setTimeout(() => {
        const element = segmentRefs.current[currentSegmentIndex]
        if (element && containerRef.current) {
          const containerHeight = containerRef.current.clientHeight
          const elementTop = element.offsetTop
          const scrollPosition = elementTop - containerHeight / 2 + element.clientHeight / 2
          
          containerRef.current.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          })
        }
      }, 100)
    }
  }, [currentTime, segments, activeSegmentIndex, completedPrompts])

  const processSegmentText = (segment: TranscriptSegment) => {
    // Debug: Log segment structure when we hit an interactive
    if (segment.interactive && currentTime >= segment.interactive.triggerTime) {
      console.log('[TranscriptDisplay] Processing interactive segment:', {
        hasWords: !!segment.words,
        hasWordsBeforeInteractive: !!segment.wordsBeforeInteractive,
        hasWordsAfterInteractive: !!segment.wordsAfterInteractive,
        interactive: segment.interactive,
        text: segment.text,
        startTime: segment.startTime,
        endTime: segment.endTime,
        currentTime: currentTime
      })
    }

    // Check if this segment has an interactive element that should be shown
    if (segment.interactive && currentTime >= segment.interactive.triggerTime) {
      const interactive = segment.interactive
      const isAnswered = completedPrompts.has(interactive.triggerTime)

      // Simple approach: Split question by '____' blank placeholder
      // Backend now guarantees this format is present
      const parts = interactive.question.split('____')

      if (parts.length !== 2) {
        console.warn('⚠️  Interactive question missing ____ blank:', interactive.question)
        // Fallback: treat entire question as beforeBlank
        return {
          beforeBlank: interactive.question,
          afterBlank: '',
          interactive: interactive,
          hasInteractive: true,
          wordsBeforeInteractive: segment.wordsBeforeInteractive || [],
          wordsAfterInteractive: segment.wordsAfterInteractive || [],
          isAnswered: isAnswered
        }
      }

      // Get visible words before and after the interactive question
      const visibleWordsBefore = segment.wordsBeforeInteractive?.filter(w => currentTime >= w.start_time) || []
      const visibleWordsAfter = segment.wordsAfterInteractive?.filter(w => currentTime >= w.start_time) || []

      return {
        beforeBlank: parts[0],
        afterBlank: parts[1],
        interactive: interactive,
        hasInteractive: true,
        wordsBeforeInteractive: visibleWordsBefore,
        wordsAfterInteractive: visibleWordsAfter,
        isAnswered: isAnswered
      }
    }

    // If no word-level data is available, fall back to old behavior
    if (!segment.words) {
      const text = segment.text

      // For non-interactive segments without word data, create word objects with proper timing
      // Split text into words and distribute them across the segment duration
      const wordsArray = text.split(' ')
      const segmentDuration = segment.endTime - segment.startTime
      const timePerWord = segmentDuration / wordsArray.length

      const words = wordsArray.map((word, index) => ({
        text: word + (index < wordsArray.length - 1 ? ' ' : ''), // Add space except for last word
        start_time: segment.startTime + (index * timePerWord),
        end_time: segment.startTime + ((index + 1) * timePerWord)
      }))

      return { words, hasInteractive: false }
    }

    // Word-by-word streaming for segments with word-level data (no interactive handling here)
    const visibleWords: Word[] = []

    // Process all words that should be visible at current time
    for (let i = 0; i < segment.words.length; i++) {
      const word = segment.words[i]
      if (currentTime >= word.start_time) {
        visibleWords.push(word)
      }
    }

    // Return the streamed words for animation
    return { words: visibleWords, hasInteractive: false }
  }



  return (
    <div className={`transcript-display ${isPausedForInteraction ? 'paused-for-interaction' : ''}`} ref={containerRef}>
      <div className="transcript-content">
        {segments.map((segment, index) => {
          const isActive = index === activeSegmentIndex
          const isPast = index < activeSegmentIndex
          const isFuture = index > activeSegmentIndex
          const isVisible = displayedSegments.includes(index)
          
          // Only show past segments and current segment, hide future segments
          if (isFuture) {
            return null
          }
          
          return (
            <div
              key={segment.id}
              ref={el => { segmentRefs.current[index] = el }}
              className={`transcript-segment ${isActive ? 'active' : ''} ${isPast ? 'past' : ''} ${isVisible ? 'visible' : ''}`}
              style={{
                opacity: isPast ? 0.5 : isActive ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s ease-out'
              }}
            >

              {(() => {
                const processedText = processSegmentText(segment)
                
                if (processedText.hasInteractive && processedText.interactive) {
                  const triggerTime = processedText.interactive.triggerTime
                  const hasSelected = selectedAnswers[triggerTime]
                  const showingFeedback = showFeedback[triggerTime]
                  const isCurrentInteraction = currentTime >= triggerTime && !completedPrompts.has(triggerTime)
                  
                  return (
                    <div className="segment-text">
                      {/* Render animated words BEFORE the interactive question */}
                      {(processedText as any).wordsBeforeInteractive?.map((word: Word, wordIndex: number) => (
                        <span
                          key={`before-${wordIndex}`}
                          className="streaming-word"
                          style={{
                            animationDelay: `${Math.max(0, (word.start_time - segment.startTime)) * 100}ms`
                          }}
                        >
                          {word.text}{' '}
                        </span>
                      ))}

                      {/* Render the interactive question inline */}
                      <span className={`interactive-blank-container ${isCurrentInteraction ? 'awaiting-choice' : ''}`}>
                        {(() => {
                          // Use the pre-shuffled options or fall back to original order
                          const optionsToUse = shuffledOptions[triggerTime] || processedText.interactive!.options
                          
                          return optionsToUse.map((option: string, optionIndex: number) => {
                            const isCorrect = option === processedText.interactive!.correctAnswer
                            const isSelected = hasSelected?.answer === option
                            const wasCorrectAnswer = hasSelected?.isCorrect
                          
                            // Determine visibility and styling based on feedback state
                            const shouldHideOption = hiddenElements[triggerTime] && wasCorrectAnswer && !isCorrect
                            const shouldShowStrikethrough = showingFeedback && !wasCorrectAnswer && isSelected && !isCorrect
                            const shouldHighlightCorrect = showingFeedback && !wasCorrectAnswer && isCorrect
                            const shouldFadeOut = showingFeedback && wasCorrectAnswer && !isCorrect && !hiddenElements[triggerTime]
                            
                            return (
                              <React.Fragment key={optionIndex}>
                                <button
                                  className={`inline-option ${
                                    isSelected && showingFeedback 
                                      ? (isCorrect ? 'correct' : 'incorrect')
                                      : ''
                                  } ${isCurrentInteraction ? 'awaiting' : ''} ${
                                    shouldFadeOut ? 'fade-out' : ''
                                  } ${
                                    shouldShowStrikethrough ? 'strikethrough' : ''
                                  } ${
                                    shouldHighlightCorrect ? 'highlight-correct' : ''
                                  }`}
                                  onClick={() => {
                                    if (!hasSelected) {
                                      // Play appropriate sound based on correctness
                                      try {
                                        if (isCorrect) {
                                          correctAudio.currentTime = 0 // Reset to start
                                          correctAudio.play()
                                        } else {
                                          incorrectAudio.currentTime = 0 // Reset to start
                                          incorrectAudio.play()
                                        }
                                      } catch (error) {
                                        console.warn('Could not play audio:', error)
                                      }
                                      
                                      // Immediately show the selection
                                      setSelectedAnswers(prev => ({ ...prev, [triggerTime]: { answer: option, isCorrect } }))
                                      // Show feedback immediately
                                      setShowFeedback(prev => ({ ...prev, [triggerTime]: true }))
                                      
                                      // If correct answer, set timer to hide elements after fade animation
                                      if (isCorrect) {
                                        setTimeout(() => {
                                          setHiddenElements(prev => ({ ...prev, [triggerTime]: true }))
                                        }, 800) // 0.3s delay + 0.5s animation = 0.8s total
                                      }
                                      
                                      // Wait for feedback to be visible, then proceed
                                      setTimeout(() => {
                                        onInteractiveAnswer(isCorrect, triggerTime)
                                      }, 500)
                                    }
                                  }}
                                  disabled={!!hasSelected}
                                  style={{
                                    display: shouldHideOption ? 'none' : 'inline-flex'
                                  }}
                                >
                                  {option}
                                </button>
                                {optionIndex < optionsToUse.length - 1 && (
                                  <span 
                                    className={`option-separator ${
                                      shouldFadeOut ? 'fade-out' : ''
                                    }`}
                                    style={{
                                      display: hiddenElements[triggerTime] && wasCorrectAnswer ? 'none' : 'inline-flex'
                                    }}
                                  >
                                    /
                                  </span>
                                )}
                              </React.Fragment>
                            )
                          })
                        })()}
                      </span>

                      {/* Render animated words AFTER the interactive question (only after user answers) */}
                      {(processedText as any).wordsAfterInteractive?.map((word: Word, wordIndex: number) => (
                        <span
                          key={`after-${wordIndex}`}
                          className="streaming-word"
                          style={{
                            animationDelay: `${Math.max(0, (word.start_time - segment.startTime)) * 100}ms`
                          }}
                        >
                          {word.text}{' '}
                        </span>
                      ))}
                    </div>
                  )
                }
                
                return (
                  <div className="segment-text">
                    {processedText.words?.map((word: Word, wordIndex: number) => (
                      <span
                        key={wordIndex}
                        className="streaming-word"
                        style={{
                          animationDelay: `${Math.max(0, (word.start_time - segment.startTime)) * 100}ms`
                        }}
                      >
                        {word.text}{' '}
                      </span>
                    ))}

                  </div>
                )
              })()}
            </div>
          )
        })}
      </div>
      
      {!isPlaying && displayedSegments.length === 0 && (
        <div className="transcript-placeholder">
          <p>Press play to begin the interactive experience</p>
        </div>
      )}
    </div>
  )
}

export default TranscriptDisplay