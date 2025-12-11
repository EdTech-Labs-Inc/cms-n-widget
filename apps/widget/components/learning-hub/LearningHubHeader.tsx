'use client';

import { motion } from 'framer-motion';
import { UserXPData } from '@/utils/xpManager';

interface LearningHubHeaderProps {
  onSearchToggle: () => void;
  xpData: UserXPData;
  onXPClick: () => void;
}

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut' as const,
    },
  },
};

export default function LearningHubHeader({ onSearchToggle, xpData, onXPClick }: LearningHubHeaderProps) {
  return (
    <motion.header className="lh-page__header" initial="hidden" animate="visible" variants={headerVariants}>
      <div className="header-content">
        <div className="header-top">
          <div className="logo-section">
            <img src="/assets/jio-logo.png" alt="Jio" className="jio-logo-img" />
          </div>
          <div className="header-actions">
            <button className="search-icon-button" onClick={onSearchToggle} aria-label="Search">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="2" />
                <path d="M11 11L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
