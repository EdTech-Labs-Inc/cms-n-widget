'use client'

import { useState, useEffect, useRef } from 'react'
import BackButton from '@/components/common/BackButton'
import AudioArticlePlayer from './AudioArticlePlayer'
import { QuizPlayer, type Question } from '@repo/quiz-player'
import { formatArticleContent, enhanceArticleReadability } from '@/utils/articleFormatting'
import './ArticleDisplay.css'

interface Article {
  id: string
  title: string
  content: string
  category: string
  createdAt: string | Date
  updatedAt: string | Date
  image?: string // Optional image URL
}

interface AudioData {
  audioUrl: string
  duration: number | null
}

interface QuizData {
  questions: Question[]
}

interface ArticleDisplayProps {
  article: Article
  audioData?: AudioData | null
  quizData?: QuizData | null
}

function ArticleDisplay({ article, audioData, quizData }: ArticleDisplayProps) {
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false)
  const [formattedContent, setFormattedContent] = useState(article.content)
  const articleTextRef = useRef<HTMLDivElement>(null)

  // Format article content on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // First break up long paragraphs (this also converts plain text to HTML)
        let formatted = formatArticleContent(article.content)

        // Then enhance readability with classes
        formatted = enhanceArticleReadability(formatted)

        setFormattedContent(formatted)
      } catch (error) {
        console.error('Error formatting article content:', error)
        // Fall back to original content
        setFormattedContent(article.content)
      }
    }
  }, [article.content])

  return (
    <div className="article-reader">
      <BackButton className="back-button--floating" />

      <article className="article-content">
        {article.image && (
          <div className="article-hero">
            <img
              src={article.image}
              alt={article.title}
              className="hero-image"
            />
          </div>
        )}

        <div className="article-body">
          <h1 className="article-title">{article.title}</h1>

          <div className="article-meta">
            <span className="article-category">
              {article.category === 'EVERGREEN' && '📚 Fundamentals'}
              {article.category === 'PERIODIC_UPDATES' && '📅 Periodic Update'}
              {article.category === 'MARKET_UPDATES' && '📈 Market Update'}
            </span>
            <span className="article-date">
              {new Date(article.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>

          {/* Audio player - positioned after meta, before content */}
          {audioData && (
            <AudioArticlePlayer audioUrl={audioData.audioUrl} />
          )}

          <div
            ref={articleTextRef}
            className="article-text"
            dangerouslySetInnerHTML={{ __html: formattedContent }}
          />

          {/* Quiz button - only show if quiz exists */}
          {quizData && quizData.questions.length > 0 && (
            <div className="article-quiz-section">
              <button
                className="article-quiz-button"
                onClick={() => setIsQuizModalOpen(true)}
              >
                <span className="article-quiz-button-icon">📝</span>
                <span className="article-quiz-button-text">Take Quiz</span>
                <span className="article-quiz-button-count">
                  {quizData.questions.length} questions
                </span>
              </button>
            </div>
          )}
        </div>
      </article>

      {/* Quiz Modal */}
      {isQuizModalOpen && quizData && (
        <QuizPlayer
          questions={quizData.questions}
          onClose={() => setIsQuizModalOpen(false)}
        />
      )}
    </div>
  )
}

export default ArticleDisplay
