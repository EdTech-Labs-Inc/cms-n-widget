'use client';

import { motion } from 'framer-motion';

interface Chapter {
  id: string;
  name: string;
  progress: number;
}

const chapters: Chapter[] = [
  { id: 'asset-allocation', name: 'Asset Allocation', progress: 100 },
  { id: 'risk-management', name: 'Risk Management', progress: 75 },
  { id: 'investing', name: 'Investing', progress: 50 },
  { id: 'compounding-returns', name: 'Compounding Returns', progress: 25 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

interface DonutChartProps {
  progress: number;
  isCompleted: boolean;
  name: string;
}

function DonutChart({ progress, isCompleted, name }: DonutChartProps) {
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`progress-wheel ${isCompleted ? 'progress-wheel--completed' : ''}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="progress-wheel__svg"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isCompleted ? '#10B981' : 'var(--gold-secondary)'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] as const, delay: 0.3 }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {/* Completed checkmark */}
        {isCompleted && (
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 1 }}
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={20}
              fill="#10B981"
            />
            <path
              d={`M ${size / 2 - 8} ${size / 2} L ${size / 2 - 2} ${size / 2 + 6} L ${size / 2 + 10} ${size / 2 - 6}`}
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.g>
        )}
      </svg>
      <div className="progress-wheel__info">
        <span className="progress-wheel__name">{name}</span>
        {!isCompleted && (
          <span className="progress-wheel__percentage">{progress}%</span>
        )}
        {isCompleted && (
          <span className="progress-wheel__completed-text">Complete</span>
        )}
      </div>
    </div>
  );
}

export default function ProgressWheels() {
  return (
    <motion.section
      className="progress-wheels-section"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="section-header">
        <div className="section-header-main">
          <h2 className="section-title">Your Progress</h2>
          <span className="section-badge">📊 Chapters</span>
        </div>
        <p className="section-subtitle">Track your learning journey</p>
      </div>
      <motion.div className="progress-wheels-grid" variants={containerVariants}>
        {chapters.map((chapter) => (
          <motion.div key={chapter.id} variants={itemVariants}>
            <DonutChart
              progress={chapter.progress}
              isCompleted={chapter.progress === 100}
              name={chapter.name}
            />
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}
