export interface Word {
  text: string
  start_time: number
  end_time: number
  isBlank?: boolean
  correctAnswer?: string
}

export interface TranscriptSegment {
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

export interface PodcastData {
  podcastId: string
  title: string
  thumbnailUrl?: string
  audioFile: string
  duration: number
  segments: TranscriptSegment[]
}
