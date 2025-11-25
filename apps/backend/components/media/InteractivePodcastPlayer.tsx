'use client';

import { useRef, useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import type { InteractivePodcastOutput } from '@/lib/api/types';

interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  words?: Array<{ text: string; start_time: number; end_time: number }>;
  interactive?: {
    triggerTime: number;
    type: 'fill-blank';
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  };
}

interface InteractivePodcastPlayerProps {
  output: InteractivePodcastOutput;
}

export function InteractivePodcastPlayer({ output }: InteractivePodcastPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState<TranscriptSegment['interactive'] | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateDuration = () => setDuration(audio.duration);
    const updateBuffered = () => {
      if (audio.buffered.length > 0) {
        setBuffered(audio.buffered.end(audio.buffered.length - 1));
      }
    };

    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('progress', updateBuffered);

    return () => {
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('progress', updateBuffered);
    };
  }, []);

  if (output.status === 'PENDING' || output.status === 'PROCESSING') {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-text-secondary">
          {output.status === 'PENDING' ? 'Queued...' : 'Generating interactive podcast...'}
        </div>
      </div>
    );
  }

  if (output.status === 'FAILED') {
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
        <p className="text-red-400">Failed to generate interactive podcast</p>
        {output.error && <p className="text-sm text-text-muted mt-2">{output.error}</p>}
      </div>
    );
  }

  if (!output.segments || output.segments.length === 0) {
    return (
      <div className="text-text-muted">No interactive podcast available</div>
    );
  }

  const segments = output.segments as TranscriptSegment[];
  const questionsSegments = segments.filter(s => s.interactive);
  const audioUrl = output.audioFileUrl;

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - bounds.left) / bounds.width;
    audioRef.current.currentTime = percent * duration;
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const newTime = audioRef.current.currentTime;
    setCurrentTime(newTime);

    // Check if we've reached an unanswered question's trigger time
    const questionSegment = segments.find(s =>
      s.interactive &&
      newTime >= s.interactive.triggerTime &&
      !answeredQuestions.has(s.interactive.triggerTime) &&
      !activeQuestion
    );

    if (questionSegment?.interactive) {
      // Pause audio and show question
      audioRef.current.pause();
      setIsPlaying(false);
      setActiveQuestion(questionSegment.interactive);
    }
  };

  const handleQuestionClick = (question: TranscriptSegment['interactive'], triggerTime: number) => {
    if (!question || answeredQuestions.has(triggerTime)) return;

    // Pause audio
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    setActiveQuestion(question);
  };

  const handleAnswer = () => {
    if (!activeQuestion || userAnswer === null) return;
    setShowResult(true);
  };

  const handleContinue = () => {
    if (!activeQuestion) return;

    // Mark question as answered
    setAnsweredQuestions(prev => new Set([...prev, activeQuestion.triggerTime]));

    // Reset state and resume playback
    setActiveQuestion(null);
    setUserAnswer(null);
    setShowResult(false);

    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const isCorrect = () => {
    if (!activeQuestion || userAnswer === null) return false;
    const correctIndex = activeQuestion.options.indexOf(activeQuestion.correctAnswer);
    return userAnswer === correctIndex;
  };

  const getCurrentSegmentIndex = () => {
    return segments.findIndex(
      s => currentTime >= s.startTime && currentTime <= s.endTime
    ) ?? -1;
  };

  return (
    <div className="space-y-6">
      {/* Hidden audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          preload="metadata"
        />
      )}

      {/* Custom Audio Player */}
      {audioUrl && (
        <div className="bg-white-10 border-2 border-white-20 rounded-3xl p-4">
          <div className="flex items-center gap-4">
            {/* Play/Pause button */}
            <button
              onClick={togglePlay}
              className="w-12 h-12 bg-gradient-teal rounded-full flex items-center justify-center hover:shadow-glow-teal transition-all shrink-0"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" fill="white" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
              )}
            </button>

            {/* Progress and Time */}
            <div className="flex-1 space-y-2">
              {/* Progress Bar */}
              <div
                className="relative h-2 bg-white-10 rounded-full cursor-pointer group"
                onClick={handleSeek}
              >
                {/* Buffered progress (lighter) */}
                <div
                  className="absolute inset-y-0 left-0 bg-white-20 rounded-full transition-all"
                  style={{ width: `${(buffered / duration) * 100}%` }}
                />
                {/* Playback progress (teal gradient for interactive podcast) */}
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-teal rounded-full transition-all"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
                {/* Progress indicator */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-teal-accent rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `calc(${(currentTime / duration) * 100}% - 8px)` }}
                />
              </div>

              {/* Time display */}
              <div className="flex justify-between text-xs text-text-muted">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="bg-purple-light border border-purple-accent rounded-lg p-4">
        <p className="text-purple-accent font-medium mb-2">
          {questionsSegments.length} Interactive Questions
        </p>
        <div className="flex gap-2 flex-wrap mt-2">
          {questionsSegments.map((segment, idx) => {
            if (!segment.interactive) return null;
            const isAnswered = answeredQuestions.has(segment.interactive.triggerTime);
            return (
              <span
                key={idx}
                className={`badge ${
                  isAnswered ? 'badge-success' : 'badge-secondary'
                }`}
              >
                Q{idx + 1} {isAnswered && '✓'}
              </span>
            );
          })}
        </div>
      </div>

      {/* Transcript with Questions */}
      <div className="bg-white-10 rounded-lg p-6 max-h-96 overflow-y-auto">
        <h4 className="text-text-primary font-medium mb-4">Podcast Transcript</h4>
        <div className="space-y-4">
          {segments.map((segment, idx) => {
            const isCurrentSegment = idx === getCurrentSegmentIndex();
            const isQuestion = !!segment.interactive;
            const isAnswered = segment.interactive && answeredQuestions.has(segment.interactive.triggerTime);

            return (
              <div
                key={segment.id}
                className={`p-3 rounded-lg transition-all ${
                  isCurrentSegment && isPlaying ? 'bg-gold/20 border-l-4 border-gold' : 'bg-white-5'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="text-xs text-text-muted mt-1">
                    {Math.floor(segment.startTime)}s
                  </div>
                  <div className="flex-1">
                    <p className="text-text-primary leading-relaxed">{segment.text}</p>
                    {isQuestion && segment.interactive && (
                      <button
                        onClick={() => handleQuestionClick(segment.interactive!, segment.interactive!.triggerTime)}
                        disabled={isAnswered}
                        className={`mt-2 text-sm px-3 py-1 rounded-full ${
                          isAnswered
                            ? 'bg-green-500/20 text-green-400 cursor-default'
                            : 'bg-purple-light text-purple-accent hover:bg-purple-accent hover:text-white cursor-pointer'
                        }`}
                      >
                        {isAnswered ? '✓ Answered' : '❓ Question'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Question Modal */}
      {activeQuestion && (
        <div className="fixed inset-0 bg-navy-dark/95 flex items-center justify-center p-6 z-50">
          <div className="max-w-2xl w-full card p-6 space-y-4">
            {!showResult ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <span className="badge badge-purple">Interactive Question</span>
                  <span className="text-text-muted text-sm">
                    at {Math.floor(activeQuestion.triggerTime)}s
                  </span>
                </div>

                <h4 className="text-xl font-semibold text-text-primary mb-4">
                  {activeQuestion.question}
                </h4>

                <div className="space-y-3">
                  {activeQuestion.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => setUserAnswer(idx)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        userAnswer === idx
                          ? 'border-purple-accent bg-purple-light'
                          : 'border-white-20 bg-white-10 hover:border-purple-accent/50'
                      }`}
                    >
                      <span className="text-text-primary">{option}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleAnswer}
                  disabled={userAnswer === null}
                  className="btn btn-purple w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Answer
                </button>
              </>
            ) : (
              <>
                <div className={`p-4 rounded-lg border-2 ${
                  isCorrect()
                    ? 'bg-success/20 border-success'
                    : 'bg-red-500/20 border-red-500'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{isCorrect() ? '✓' : '✗'}</span>
                    <span className={`font-bold ${
                      isCorrect() ? 'text-success' : 'text-red-400'
                    }`}>
                      {isCorrect() ? 'Correct!' : 'Incorrect'}
                    </span>
                  </div>

                  {!isCorrect() && (
                    <p className="text-text-secondary mb-2">
                      The correct answer was:{' '}
                      <span className="text-success font-medium">
                        {activeQuestion.correctAnswer}
                      </span>
                    </p>
                  )}

                  {activeQuestion.explanation && (
                    <p className="text-text-secondary text-sm mt-3 p-3 bg-white-10 rounded">
                      {activeQuestion.explanation}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleContinue}
                  className="btn btn-primary w-full mt-4"
                >
                  Continue Listening
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {output.duration && (
        <div className="text-sm text-text-muted">
          Duration: {Math.floor(output.duration / 60)}:{(output.duration % 60).toString().padStart(2, '0')}
        </div>
      )}
    </div>
  );
}
