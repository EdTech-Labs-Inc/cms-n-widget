'use client';

import { motion } from 'framer-motion';
import VideoTile from './VideoTile';
import NoDataState from './NoDataState';

interface WatchViewProps {
  allVideos: any[];
  categories: Array<{ id: string; label: string; icon: string }>;
  onVideoClick: (videoId: string) => void;
  getContentByCategory: <T extends { category?: string }>(content: T[], categoryId: string) => T[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

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

const gridItemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut' as const,
    },
  },
};

export default function WatchView({ allVideos, categories, onVideoClick, getContentByCategory }: WatchViewProps) {
  if (allVideos.length === 0) {
    return (
      <NoDataState
        icon="📺"
        title="No videos available"
        description="We're working on adding more video content for you to watch and learn from."
        actionText="Check back later"
      />
    );
  }

  return (
    <motion.div key="watch-view" initial="hidden" animate="visible" exit="hidden" variants={containerVariants}>
      {categories.map((category) => {
        const categoryVideos = getContentByCategory(allVideos, category.id);
        if (categoryVideos.length === 0) return null;

        return (
          <motion.section key={category.id} className="category-section" variants={sectionVariants}>
            <div className="section-header">
              <div className="section-header-main">
                <h2 className="section-title">
                  {category.icon} {category.label}
                </h2>
              </div>
            </div>
            <motion.div className="video-tiles-grid" variants={containerVariants}>
              {categoryVideos.map((video, index) => (
                <VideoTile
                  key={video.id}
                  video={video}
                  variants={gridItemVariants}
                  index={index}
                  onClick={() => onVideoClick(video.id)}
                />
              ))}
            </motion.div>
          </motion.section>
        );
      })}
    </motion.div>
  );
}
