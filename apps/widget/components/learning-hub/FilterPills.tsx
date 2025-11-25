'use client';

import { motion } from 'framer-motion';

interface FilterPillsProps {
  activeFilter: 'recommended' | 'watch' | 'listen' | 'read';
  onFilterChange: (filter: 'recommended' | 'watch' | 'listen' | 'read') => void;
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
        className={`filter-pill ${activeFilter === 'recommended' ? 'active' : ''}`}
        onClick={() => onFilterChange('recommended')}
      >
        Recommended
      </button>
      <button
        className={`filter-pill ${activeFilter === 'watch' ? 'active' : ''}`}
        onClick={() => onFilterChange('watch')}
      >
        Watch
      </button>
      <button
        className={`filter-pill ${activeFilter === 'listen' ? 'active' : ''}`}
        onClick={() => onFilterChange('listen')}
      >
        Listen
      </button>
      <button
        className={`filter-pill ${activeFilter === 'read' ? 'active' : ''}`}
        onClick={() => onFilterChange('read')}
      >
        Read
      </button>
    </motion.div>
  );
}
