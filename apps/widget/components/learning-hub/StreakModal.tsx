'use client'

import { motion, AnimatePresence } from 'framer-motion'
import './StreakModal.css'

interface StreakModalProps {
    isOpen: boolean
    onClose: () => void
}

function StreakModal({ isOpen, onClose }: StreakModalProps) {
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

    const fireVariants = {
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
                    className="streak-modal-overlay"
                    variants={overlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    onClick={onClose}
                >
                    <motion.div
                        className="streak-modal"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
                    >
                        <motion.div
                            className="streak-modal-content"
                            variants={contentVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.div 
                                className="streak-icon-container"
                                variants={fireVariants}
                                animate="pulse"
                                whileHover="pulse"
                            >
                                <motion.span 
                                    className="streak-fire-icon"
                                    variants={pulseVariants}
                                    animate="pulse"
                                >
                                    🔥
                                </motion.span>
                                <motion.span 
                                    className="streak-number"
                                    variants={itemVariants}
                                >
                                    1
                                </motion.span>
                            </motion.div>

                            <motion.h2 
                                className="streak-title"
                                variants={itemVariants}
                            >
                                You've Started a Streak! 🎉
                            </motion.h2>

                            <motion.div 
                                className="streak-description"
                                variants={itemVariants}
                            >
                                <p>
                                    Welcome to your financial learning journey! You've just started your very first learning streak.
                                </p>
                                <p>
                                    Come back to the Learning Hub every day to keep your streak alive and watch your financial knowledge grow. 
                                    Each day you return, you'll unlock new insights, build lasting habits, and move closer to your financial goals.
                                </p>
                                <p className="streak-motivation">
                                    <strong>Your future self will thank you for this commitment! 💪</strong>
                                </p>
                            </motion.div>

                            <motion.button
                                className="streak-commit-button"
                                variants={itemVariants}
                                whileHover={{ 
                                    scale: 1.05,
                                    boxShadow: "0 8px 20px rgba(223, 159, 57, 0.4)"
                                }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                            >
                                I'm Committed! 🚀
                            </motion.button>

                            <motion.p 
                                className="streak-reminder"
                                variants={itemVariants}
                            >
                                Remember: Consistency is the key to mastering your finances
                            </motion.p>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default StreakModal