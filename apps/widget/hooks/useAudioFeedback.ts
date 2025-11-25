import { useRef, useEffect, useCallback } from 'react'

export function useAudioFeedback() {
    const correctAudioRef = useRef<HTMLAudioElement | null>(null)
    const incorrectAudioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        // Create and preload audio elements
        const duolingoCorrect = '/assets/duolingo-correct.mp3'
        const duolingoIncorrect = '/assets/duolingo-incorrect.mp3'

        correctAudioRef.current = new Audio(duolingoCorrect)
        incorrectAudioRef.current = new Audio(duolingoIncorrect)

        correctAudioRef.current.load()
        incorrectAudioRef.current.load()

        // Cleanup on unmount
        return () => {
            if (correctAudioRef.current) {
                correctAudioRef.current.pause()
                correctAudioRef.current.src = ''
                correctAudioRef.current = null
            }
            if (incorrectAudioRef.current) {
                incorrectAudioRef.current.pause()
                incorrectAudioRef.current.src = ''
                incorrectAudioRef.current = null
            }
        }
    }, [])

    const playCorrectSound = useCallback(() => {
        try {
            const audio = correctAudioRef.current
            if (audio) {
                audio.currentTime = 0 // Reset to start
                audio.play().catch(() => {
                    // Ignore play errors (e.g., user hasn't interacted with page yet)
                })
            }
        } catch {
            // Silent fail - audio is not critical
        }
    }, [])

    const playIncorrectSound = useCallback(() => {
        try {
            const audio = incorrectAudioRef.current
            if (audio) {
                audio.currentTime = 0 // Reset to start
                audio.play().catch(() => {
                    // Ignore play errors (e.g., user hasn't interacted with page yet)
                })
            }
        } catch {
            // Silent fail - audio is not critical
        }
    }, [])

    const playFeedbackSound = useCallback((isCorrect: boolean) => {
        if (isCorrect) {
            playCorrectSound()
        } else {
            playIncorrectSound()
        }
    }, [playCorrectSound, playIncorrectSound])

    return {
        playCorrectSound,
        playIncorrectSound,
        playFeedbackSound
    }
}

