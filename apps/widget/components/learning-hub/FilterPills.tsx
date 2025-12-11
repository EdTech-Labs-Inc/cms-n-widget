'use client';

import { motion } from 'framer-motion';

interface FilterPillsProps {
  activeFilter: 'fundamentals' | 'market-updates';
  onFilterChange: (filter: 'fundamentals' | 'market-updates') => void;
}

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

export default function FilterPills({ activeFilter, onFilterChange }: FilterPillsProps) {
  return (
    <motion.div className="filter-pills" variants={sectionVariants}>
      <button
        className={`filter-pill ${activeFilter === 'fundamentals' ? 'active' : ''}`}
        onClick={() => onFilterChange('fundamentals')}
      >
        Fundamentals
      </button>
      <button
        className={`filter-pill ${activeFilter === 'market-updates' ? 'active' : ''}`}
        onClick={() => onFilterChange('market-updates')}
      >
        Market Updates
      </button>
    </motion.div>
  );
}
