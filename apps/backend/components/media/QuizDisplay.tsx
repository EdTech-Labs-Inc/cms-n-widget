'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Lightbulb, Loader2, AlertCircle, Trophy, Star, Award } from 'lucide-react';
import type { QuizOutput, QuizQuestion } from '@/lib/api/types';

interface QuizDisplayProps {
  output: QuizOutput;
}

type UserAnswer = number | boolean | string | null;

interface QuizAnswer {
  questionIndex: number;
  userAnswer: UserAnswer;
  isCorrect: boolean;
}

export function QuizDisplay({ output }: QuizDisplayProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<UserAnswer>(null);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  if (output.status === 'PENDING' || output.status === 'PROCESSING') {
    return (
      <div className="flex items-center justify-center py-8 gap-3">
        <Loader2 className="w-5 h-5 text-blue-accent animate-spin" />
        <div className="text-text-secondary">
          {output.status === 'PENDING' ? 'Queued...' : 'Generating quiz...'}
        </div>
      </div>
    );
  }

  if (output.status === 'FAILED') {
    return (
      <div className="bg-red-500/20 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
        <div>
          <p className="text-red-400">Failed to generate quiz</p>
          {output.error && <p className="text-sm text-text-muted mt-2">{output.error}</p>}
        </div>
      </div>
    );
  }

  if (!output.questions || output.questions.length === 0) {
    return (
      <div className="text-text-muted flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        No quiz questions available
      </div>
    );
  }

  const currentQuestion = output.questions[currentQuestionIndex];
  const totalQuestions = output.questions.length;
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const score = Math.round((correctAnswers / totalQuestions) * 100);

  const checkAnswer = (question: QuizQuestion, answer: UserAnswer): boolean => {
    if (answer === null) return false;

    if (question.type === 'FILL_BLANK') {
      const correctAnswer = String(question.correctAnswer).toLowerCase().trim();
      const userAnswerStr = String(answer).toLowerCase().trim();
      return userAnswerStr === correctAnswer;
    }

    return answer === question.correctAnswer;
  };

  const handleSubmitAnswer = () => {
    if (userAnswer === null) return;

    const isCorrect = checkAnswer(currentQuestion, userAnswer);
    setAnswers([...answers, { questionIndex: currentQuestionIndex, userAnswer, isCorrect }]);
    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer(null);
      setShowFeedback(false);
    } else {
      setQuizComplete(true);
    }
  };

  const handleRetakeQuiz = () => {
    setCurrentQuestionIndex(0);
    setUserAnswer(null);
    setAnswers([]);
    setShowFeedback(false);
    setQuizComplete(false);
    setReviewMode(false);
  };

  // Review Mode
  if (reviewMode) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-text-primary">Quiz Review</h3>
          <button onClick={() => setReviewMode(false)} className="btn btn-secondary">
            Back to Results
          </button>
        </div>

        <div className="space-y-4">
          {output.questions.map((question, index) => {
            const answer = answers.find(a => a.questionIndex === index);
            return (
              <div key={index} className="bg-white-10 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-accent font-bold">{index + 1}.</span>
                    {answer && (
                      answer.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="text-text-primary font-medium mb-3">{question.prompt}</p>

                    {question.type === 'MCQ' && question.options && (
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => {
                          const isCorrect = optIndex === question.correctAnswer;
                          const isUserAnswer = answer && answer.userAnswer === optIndex;

                          return (
                            <div
                              key={optIndex}
                              className={`p-3 rounded-lg border ${
                                isCorrect
                                  ? 'bg-success/20 border-success/50'
                                  : isUserAnswer
                                  ? 'bg-red-500/20 border-red-500/50'
                                  : 'bg-white-10 border-white-20'
                              }`}
                            >
                              <span className={isCorrect ? 'text-success' : 'text-text-secondary'}>
                                {option}
                              </span>
                              {isCorrect && (
                                <span className="ml-2 text-success inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Correct
                                </span>
                              )}
                              {isUserAnswer && !isCorrect && <span className="ml-2 text-red-400">Your answer</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {question.type === 'TRUE_FALSE' && (
                      <div className="flex gap-3">
                        <div
                          className={`px-4 py-2 rounded-lg border inline-flex items-center gap-1 ${
                            question.correctAnswer === true
                              ? 'bg-success/20 border-success/50 text-success'
                              : answer && answer.userAnswer === true
                              ? 'bg-red-500/20 border-red-500/50 text-red-400'
                              : 'bg-white-10 border-white-20 text-text-secondary'
                          }`}
                        >
                          True {question.correctAnswer === true && <CheckCircle2 className="w-3.5 h-3.5 ml-1" />}
                          {answer && answer.userAnswer === true && question.correctAnswer !== true && ' (Your answer)'}
                        </div>
                        <div
                          className={`px-4 py-2 rounded-lg border inline-flex items-center gap-1 ${
                            question.correctAnswer === false
                              ? 'bg-success/20 border-success/50 text-success'
                              : answer && answer.userAnswer === false
                              ? 'bg-red-500/20 border-red-500/50 text-red-400'
                              : 'bg-white-10 border-white-20 text-text-secondary'
                          }`}
                        >
                          False {question.correctAnswer === false && <CheckCircle2 className="w-3.5 h-3.5 ml-1" />}
                          {answer && answer.userAnswer === false && question.correctAnswer !== false && ' (Your answer)'}
                        </div>
                      </div>
                    )}

                    {question.type === 'FILL_BLANK' && (
                      <div className="space-y-2">
                        <div className="bg-success/20 border border-success/50 rounded-lg p-3">
                          <span className="text-success font-medium">Correct: {question.correctAnswer}</span>
                        </div>
                        {answer && !answer.isCorrect && (
                          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                            <span className="text-red-400 font-medium">Your answer: {answer.userAnswer}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {question.explanation && (
                      <div className="mt-3 bg-blue-light rounded-xl p-3 flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-blue-accent shrink-0 mt-0.5" />
                        <p className="text-sm text-text-secondary">
                          <span className="text-blue-accent font-medium">Explanation:</span>{' '}
                          {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Results Screen
  if (quizComplete) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <h3 className="text-3xl font-bold text-text-primary mb-4">Quiz Complete!</h3>
          <div className="mb-6">
            <div className="text-6xl font-bold mb-2" style={{ color: score >= 70 ? '#4CAF50' : score >= 50 ? '#D99C57' : '#F44336' }}>
              {score}%
            </div>
            <p className="text-text-secondary">
              {correctAnswers} out of {totalQuestions} correct
            </p>
          </div>

          {score >= 90 && (
            <div className="bg-success/20 rounded-xl p-4 mb-4 flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5 text-success" />
              <p className="text-success font-semibold">Excellent work!</p>
            </div>
          )}
          {score >= 70 && score < 90 && (
            <div className="bg-gold-light rounded-xl p-4 mb-4 flex items-center justify-center gap-2">
              <Star className="w-5 h-5 text-gold" />
              <p className="text-gold font-semibold">Great job!</p>
            </div>
          )}
          {score >= 50 && score < 70 && (
            <div className="bg-blue-light rounded-xl p-4 mb-4 flex items-center justify-center gap-2">
              <Award className="w-5 h-5 text-blue-accent" />
              <p className="text-blue-accent font-semibold">Good effort! Keep practicing.</p>
            </div>
          )}
          {score < 50 && (
            <div className="bg-red-500/20 rounded-xl p-4 mb-4 flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400 font-semibold">Keep trying! Review the material and try again.</p>
            </div>
          )}

          <div className="flex gap-4 justify-center mt-6">
            <button onClick={() => setReviewMode(true)} className="btn btn-primary">
              Review Answers
            </button>
            <button onClick={handleRetakeQuiz} className="btn btn-secondary">
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Question Screen
  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex justify-between items-center">
        <div className="text-text-secondary">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </div>
        <div className="flex gap-2">
          {Array.from({ length: totalQuestions }).map((_, idx) => (
            <div
              key={idx}
              className={`w-3 h-3 rounded-full ${
                idx < currentQuestionIndex
                  ? 'bg-success'
                  : idx === currentQuestionIndex
                  ? 'bg-gold'
                  : 'bg-white-20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white-10 rounded-lg p-6 border border-white-20">
        <h3 className="text-xl font-semibold text-text-primary mb-6">
          {currentQuestion.prompt}
        </h3>

        {!showFeedback ? (
          <>
            {/* MCQ */}
            {currentQuestion.type === 'MCQ' && currentQuestion.options && (
              <div className="space-y-3 mb-6">
                {currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => setUserAnswer(idx)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      userAnswer === idx
                        ? 'border-blue-accent bg-blue-light'
                        : 'border-white-20 bg-white-10 hover:border-blue-accent/50'
                    }`}
                  >
                    <span className="text-text-primary">{option}</span>
                  </button>
                ))}
              </div>
            )}

            {/* True/False */}
            {currentQuestion.type === 'TRUE_FALSE' && (
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setUserAnswer(true)}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    userAnswer === true
                      ? 'border-blue-accent bg-blue-light'
                      : 'border-white-20 bg-white-10 hover:border-blue-accent/50'
                  }`}
                >
                  <span className="text-text-primary font-medium">True</span>
                </button>
                <button
                  onClick={() => setUserAnswer(false)}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    userAnswer === false
                      ? 'border-blue-accent bg-blue-light'
                      : 'border-white-20 bg-white-10 hover:border-blue-accent/50'
                  }`}
                >
                  <span className="text-text-primary font-medium">False</span>
                </button>
              </div>
            )}

            {/* Fill in the Blank */}
            {currentQuestion.type === 'FILL_BLANK' && (
              <div className="mb-6">
                <input
                  type="text"
                  value={userAnswer as string || ''}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  className="input w-full"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && userAnswer !== null && userAnswer !== '') {
                      handleSubmitAnswer();
                    }
                  }}
                />
              </div>
            )}

            <button
              onClick={handleSubmitAnswer}
              disabled={userAnswer === null || (currentQuestion.type === 'FILL_BLANK' && userAnswer === '')}
              className="btn btn-gold w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Answer
            </button>
          </>
        ) : (
          <>
            {/* Feedback */}
            <div className={`p-6 rounded-xl border-2 mb-6 ${
              checkAnswer(currentQuestion, userAnswer)
                ? 'bg-success/20 border-success'
                : 'bg-red-500/20 border-red-500'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                {checkAnswer(currentQuestion, userAnswer) ? (
                  <CheckCircle2 className="w-8 h-8 text-success" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-400" />
                )}
                <span className={`text-xl font-bold ${
                  checkAnswer(currentQuestion, userAnswer) ? 'text-success' : 'text-red-400'
                }`}>
                  {checkAnswer(currentQuestion, userAnswer) ? 'Correct!' : 'Incorrect'}
                </span>
              </div>

              {!checkAnswer(currentQuestion, userAnswer) && (
                <p className="text-text-secondary mb-2">
                  The correct answer is:{' '}
                  <span className="text-success font-medium">
                    {currentQuestion.type === 'MCQ' && currentQuestion.options
                      ? currentQuestion.options[currentQuestion.correctAnswer as number]
                      : String(currentQuestion.correctAnswer)}
                  </span>
                </p>
              )}

              {currentQuestion.explanation && (
                <div className="bg-navy-dark/50 rounded-xl p-4 mt-4 flex items-start gap-2">
                  <Lightbulb className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <p className="text-sm text-text-secondary">
                    <span className="text-gold font-medium">Explanation:</span>{' '}
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleNextQuestion}
              className="btn btn-primary w-full"
            >
              {currentQuestionIndex < totalQuestions - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
