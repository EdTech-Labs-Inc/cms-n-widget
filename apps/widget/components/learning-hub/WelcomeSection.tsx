'use client';

import { motion } from 'framer-motion';

const sectionVariants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export default function WelcomeSection() {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  return (
    <motion.section className="welcome-section" variants={sectionVariants}>
      <div className="welcome-card">
        <h1 className="welcome-title">Good {getGreeting()}! 👋</h1>
        <p className="welcome-subtitle">Here's what we've curated for you today</p>
      </div>
    </motion.section>
  );
}
