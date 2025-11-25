'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  getXPData,
  getProgressToNextLevel,
  getXPToNextLevel,
  getLevelTitle,
  XP_REWARDS
} from '@/utils/xpManager'
import './XPModal.css'

interface XPModalProps {
  isOpen: boolean
  onClose: () => void
}

function XPModal({ isOpen, onClose }: XPModalProps) {
  const xpData = getXPData()
  const progressPercent = getProgressToNextLevel(xpData.totalXP)
  const xpToNextLevel = getXPToNextLevel(xpData.totalXP)
  const levelTitle = getLevelTitle(xpData.level)

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut" as const }
    }
  }

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      rotate: -2
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      rotate: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1] as const,
        type: "spring" as const,
        damping: 25,
        stiffness: 300
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 20,
      transition: { duration: 0.2, ease: "easeIn" as const }
    }
  }

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.2,
        duration: 0.4,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  }

  const starVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        delay: 0.1,
        duration: 0.6,
        ease: "backOut" as const
      }
    }
  }

  const pulseVariants = {
    pulse: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="xp-modal-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
        >
          <motion.div
            className="xp-modal"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            <motion.div
              className="xp-modal-content"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                className="xp-icon-container"
                variants={starVariants}
                animate="pulse"
                whileHover="pulse"
              >
                <motion.svg
                  className="xp-star-icon"
                  variants={pulseVariants}
                  animate="pulse"
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
                </motion.svg>
                <motion.span
                  className="xp-level-number"
                  variants={itemVariants}
                >
                  {xpData.level}
                </motion.span>
              </motion.div>

              <motion.h2
                className="xp-title"
                variants={itemVariants}
              >
                Level {xpData.level} • {levelTitle}
              </motion.h2>

              <motion.div
                className="xp-stats"
                variants={itemVariants}
              >
                <div className="xp-stat-item">
                  <div className="stat-value">{xpData.totalXP.toLocaleString()}</div>
                  <div className="stat-label">Total XP</div>
                </div>
                <div className="xp-stat-item">
                  <div className="stat-value">{xpToNextLevel.toLocaleString()}</div>
                  <div className="stat-label">XP to Level {xpData.level + 1}</div>
                </div>
              </motion.div>

              <motion.div
                className="xp-progress-container"
                variants={itemVariants}
              >
                <div className="xp-progress-header">
                  <span>Level {xpData.level}</span>
                  <span>{progressPercent.toFixed(0)}%</span>
                  <span>Level {xpData.level + 1}</span>
                </div>
                <div className="xp-progress-bar">
                  <motion.div
                    className="xp-progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                  />
                </div>
              </motion.div>

              <motion.div
                className="xp-rewards-section"
                variants={itemVariants}
              >
                <h3 className="xp-rewards-title">How to Earn XP</h3>
                <div className="xp-rewards-list">
                  <div className="xp-reward-item">
                    <svg className="reward-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="10" r="2" fill="currentColor"/>
                    </svg>
                    <div className="reward-details">
                      <div className="reward-name">Complete a Video</div>
                      <div className="reward-description">Answer all bubbles correctly</div>
                    </div>
                    <div className="reward-xp">+{XP_REWARDS.VIDEO_COMPLETE}</div>
                  </div>
                  <div className="xp-reward-item">
                    <svg className="reward-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <circle cx="12" cy="12" r="3" fill="currentColor"/>
                    </svg>
                    <div className="reward-details">
                      <div className="reward-name">Complete Interactive Podcast</div>
                      <div className="reward-description">Answer all questions correctly</div>
                    </div>
                    <div className="reward-xp">+{XP_REWARDS.INTERACTIVE_PODCAST_COMPLETE}</div>
                  </div>
                  <div className="xp-reward-item">
                    <svg className="reward-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <div className="reward-details">
                      <div className="reward-name">Correct Quiz Answer</div>
                      <div className="reward-description">Each question you get right</div>
                    </div>
                    <div className="reward-xp">+{XP_REWARDS.QUIZ_QUESTION_CORRECT}</div>
                  </div>
                </div>
              </motion.div>

              <motion.button
                className="xp-close-button"
                variants={itemVariants}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 8px 20px rgba(223, 159, 57, 0.4)"
                }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
              >
                Keep Learning
              </motion.button>

              <motion.p
                className="xp-reminder"
                variants={itemVariants}
              >
                Level up by completing lessons and answering questions correctly
              </motion.p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default XPModal
