'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './XPGainAnimation.css'

interface XPGainAnimationProps {
  amount: number
  isVisible: boolean
  onComplete?: () => void
  position?: 'center' | 'top' | 'bottom'
}

function XPGainAnimation({
  amount,
  isVisible,
  onComplete,
  position = 'center'
}: XPGainAnimationProps) {
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    console.log('[XP Animation Debug] isVisible changed:', isVisible, 'amount:', amount)
    if (isVisible) {
      console.log('[XP Animation Debug] Showing animation for', amount, 'XP')
      setShowAnimation(true)

      // Hide animation after duration
      const timer = setTimeout(() => {
        console.log('[XP Animation Debug] Hiding animation')
        setShowAnimation(false)
        onComplete?.()
      }, 2500)

      return () => clearTimeout(timer)
    }
  }, [isVisible, onComplete, amount])

  const containerVariants = {
    hidden: {
      opacity: 0,
      scale: 0.5,
      y: 50
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1] as any
      }
    },
    exit: {
      opacity: 0,
      scale: 1.2,
      y: -100,
      transition: {
        duration: 0.6,
        ease: "easeIn" as any
      }
    }
  }

  const starBurstVariants = {
    hidden: { scale: 0, rotate: 0 },
    visible: {
      scale: [0, 1.5, 1],
      rotate: [0, 180, 360],
      transition: {
        duration: 0.6,
        ease: "easeOut" as any,
        times: [0, 0.5, 1]
      }
    }
  }

  const pulseVariants = {
    pulse: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 0.5,
        repeat: 2,
        ease: "easeInOut" as any
      }
    }
  }

  return (
    <AnimatePresence>
      {showAnimation && (
        <motion.div
          className={`xp-gain-animation xp-gain-animation--${position}`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="xp-gain-content">
            <motion.div
              className="xp-gain-starburst"
              variants={starBurstVariants}
              initial="hidden"
              animate="visible"
            >
              ✨
            </motion.div>

            <motion.div
              className="xp-gain-text"
              variants={pulseVariants}
              animate="pulse"
            >
              <span className="xp-gain-plus">+{amount}</span>
              <span className="xp-gain-label">XP</span>
            </motion.div>

            <motion.div
              className="xp-gain-starburst xp-gain-starburst--secondary"
              variants={starBurstVariants}
              initial="hidden"
              animate="visible"
            >
              ✨
            </motion.div>
          </div>

          {/* Particle effects */}
          <motion.div
            className="xp-particle xp-particle-1"
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0.5],
              x: [-30, -60],
              y: [-20, -80]
            }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            ⭐
          </motion.div>

          <motion.div
            className="xp-particle xp-particle-2"
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0.5],
              x: [30, 60],
              y: [-20, -80]
            }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            ⭐
          </motion.div>

          <motion.div
            className="xp-particle xp-particle-3"
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0.5],
              x: [0, 0],
              y: [-30, -100]
            }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            ⭐
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default XPGainAnimation
