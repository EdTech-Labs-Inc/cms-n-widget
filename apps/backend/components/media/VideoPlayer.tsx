'use client';

import { useRef, useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle2, XCircle, Lightbulb, Clock } from 'lucide-react';
import type { VideoOutput, VideoBubble } from '@/lib/api/types';

interface VideoPlayerProps {
  output: VideoOutput;
}

function SingleVideoPlayer({ video }: { video: VideoOutput }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeBubble, setActiveBubble] = useState<VideoBubble | null>(null);
  const [answeredBubbles, setAnsweredBubbles] = useState<Set<number>>(new Set());
  const [userAnswer, setUserAnswer] = useState<number | string | boolean | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      const time = videoElement.currentTime * 1000; // Convert to milliseconds
      setCurrentTime(time);

      // Check if we need to show a bubble
      if (video.bubbles && !activeBubble) {
        const bubble = video.bubbles.find(
          (b, idx) =>
            Math.abs(b.appearsAt - time) < 500 && // 500ms tolerance
            !answeredBubbles.has(idx)
        );

        if (bubble) {
          videoElement.pause();
          setActiveBubble(bubble);
        }
      }
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    return () => videoElement.removeEventListener('timeupdate', handleTimeUpdate);
  }, [video.bubbles, activeBubble, answeredBubbles]);

  const handleAnswer = () => {
    if (!activeBubble || userAnswer === null) return;

    setShowResult(true);
  };

  const handleContinue = () => {
    if (!activeBubble) return;

    // Mark bubble as answered
    const bubbleIndex = video.bubbles?.findIndex(b => b === activeBubble);
    if (bubbleIndex !== undefined && bubbleIndex >= 0) {
      setAnsweredBubbles(prev => new Set([...prev, bubbleIndex]));
    }

    // Reset state and resume playback
    setActiveBubble(null);
    setUserAnswer(null);
    setShowResult(false);
    videoRef.current?.play();
  };

  const isCorrect = () => {
    if (!activeBubble || userAnswer === null) return false;
    return userAnswer === activeBubble.correctAnswer;
  };

  return (
    <div className="space-y-4 relative">
      <h3 className="text-lg font-semibold text-text-primary">{video.title}</h3>

      <div className="relative">
        <video
          ref={videoRef}
          controls
          className="w-full rounded-lg"
          src={video.videoUrl}
        >
          Your browser does not support the video element.
        </video>

        {/* Question Overlay */}
        {activeBubble && (
          <div className="absolute inset-0 bg-navy-dark/95 flex items-center justify-center p-6 rounded-lg">
            <div className="max-w-2xl w-full card p-6 space-y-4">
              {!showResult ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="badge badge-gold">Question</span>
                    <span className="text-text-muted text-sm">
                      at {Math.floor(activeBubble.appearsAt)}s
                    </span>
                  </div>

                  <h4 className="text-xl font-semibold text-text-primary mb-4">
                    {activeBubble.question}
                  </h4>

                  {activeBubble.type === 'MCQ' && activeBubble.options && (
                    <div className="space-y-2">
                      {activeBubble.options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => setUserAnswer(idx)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                            userAnswer === idx
                              ? 'border-gold bg-gold-light'
                              : 'border-white-20 bg-white-10 hover:border-gold/50'
                          }`}
                        >
                          <span className="text-text-primary">{option}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {activeBubble.type === 'TRUE_FALSE' && (
                    <div className="flex gap-4">
                      <button
                        onClick={() => setUserAnswer(true)}
                        className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                          userAnswer === true
                            ? 'border-gold bg-gold-light'
                            : 'border-white-20 bg-white-10 hover:border-gold/50'
                        }`}
                      >
                        <span className="text-text-primary font-medium">True</span>
                      </button>
                      <button
                        onClick={() => setUserAnswer(false)}
                        className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                          userAnswer === false
                            ? 'border-gold bg-gold-light'
                            : 'border-white-20 bg-white-10 hover:border-gold/50'
                        }`}
                      >
                        <span className="text-text-primary font-medium">False</span>
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleAnswer}
                    disabled={userAnswer === null}
                    className="btn btn-gold w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Answer
                  </button>
                </>
              ) : (
                <>
                  <div className={`p-4 rounded-xl border-2 ${
                    isCorrect()
                      ? 'bg-success/20 border-success'
                      : 'bg-red-500/20 border-red-500'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {isCorrect() ? (
                        <CheckCircle2 className="w-6 h-6 text-success" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-400" />
                      )}
                      <span className={`font-bold ${
                        isCorrect() ? 'text-success' : 'text-red-400'
                      }`}>
                        {isCorrect() ? 'Correct!' : 'Incorrect'}
                      </span>
                    </div>

                    {!isCorrect() && (
                      <p className="text-text-secondary">
                        The correct answer was:{' '}
                        <span className="text-success font-medium">
                          {activeBubble.type === 'MCQ' && activeBubble.options
                            ? activeBubble.options[activeBubble.correctAnswer as number]
                            : String(activeBubble.correctAnswer)}
                        </span>
                      </p>
                    )}
                  </div>

                  {activeBubble.explanation && (
                    <div className="bg-blue-light rounded-xl p-4 flex items-start gap-2">
                      <Lightbulb className="w-5 h-5 text-blue-accent shrink-0 mt-0.5" />
                      <p className="text-sm text-text-secondary">
                        <span className="text-blue-accent font-medium">Explanation:</span>{' '}
                        {activeBubble.explanation}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleContinue}
                    className="btn btn-primary w-full mt-4"
                  >
                    Continue Watching
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {video.bubbles && video.bubbles.length > 0 && (
        <div className="bg-gold-light rounded-xl p-4">
          <p className="text-gold font-medium mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {video.bubbles.length} Interactive Questions
          </p>
          <div className="flex gap-2 flex-wrap">
            {video.bubbles.map((_, idx) => (
              <span
                key={idx}
                className={`badge ${
                  answeredBubbles.has(idx) ? 'badge-success' : 'badge-secondary'
                }`}
              >
                Q{idx + 1} {answeredBubbles.has(idx) && <CheckCircle2 className="w-3 h-3 inline ml-1" />}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function VideoPlayer({ output }: VideoPlayerProps) {
  if (output.status === 'PENDING' || output.status === 'PROCESSING') {
    return (
      <div className="flex items-center justify-center py-8 gap-3">
        <Loader2 className="w-5 h-5 text-blue-accent animate-spin" />
        <div className="text-text-secondary">
          {output.status === 'PENDING' ? 'Queued...' : 'Generating videos...'}
        </div>
      </div>
    );
  }

  if (output.status === 'FAILED') {
    return (
      <div className="bg-red-500/20 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
        <div>
          <p className="text-red-400">Failed to generate videos</p>
          {output.error && <p className="text-sm text-text-muted mt-2">{output.error}</p>}
        </div>
      </div>
    );
  }

  // Now VideoOutput represents a single video directly
  if (!output.videoUrl) {
    return (
      <div className="text-text-muted flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        No video available
      </div>
    );
  }

  return <SingleVideoPlayer video={output} />;
}
