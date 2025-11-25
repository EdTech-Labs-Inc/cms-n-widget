'use client';

import { motion } from 'framer-motion';
import MediaCard from '@/components/common/MediaCard';
import PodcastPlayer from '@/components/podcast-player/PodcastPlayer';
import NoDataState from './NoDataState';

interface ListenViewProps {
  allPodcasts: any[];
  formattedInteractivePodcasts: any[];
  formattedPodcasts: any[];
  categories: Array<{ id: string; label: string; icon: string }>;
  activePodcast: string | null;
  onPodcastClick: (podcast: any) => void;
  onSetActivePodcast: (id: string) => void;
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

export default function ListenView({
  allPodcasts,
  formattedInteractivePodcasts,
  formattedPodcasts,
  categories,
  activePodcast,
  onPodcastClick,
  onSetActivePodcast,
  getContentByCategory,
}: ListenViewProps) {
  if (allPodcasts.length === 0) {
    return (
      <NoDataState
        icon="🎧"
        title="No podcasts available"
        description="We're working on adding more audio content for you to listen to and learn from."
        actionText="Check back later"
      />
    );
  }

  return (
    <motion.div key="listen-view" initial="hidden" animate="visible" exit="hidden" variants={containerVariants}>
      {/* Interactive Podcasts Section */}
      {formattedInteractivePodcasts.length > 0 && (
        <motion.section className="category-section listen-learn-section" variants={sectionVariants}>
          <div className="section-header">
            <div className="section-header-main">
              <h2 className="section-title">🎮 Interactive Podcasts</h2>
              <span className="section-badge">Play & Learn</span>
            </div>
            <p className="section-subtitle">Test your knowledge while you listen</p>
          </div>

          {formattedInteractivePodcasts.map((podcast) => (
            <motion.div key={podcast.id} variants={gridItemVariants}>
              <MediaCard
                id={podcast.id}
                title={podcast.title}
                thumbnail={podcast.thumbnail}
                variant="podcast"
                metadata={{ duration: podcast.duration }}
                onClick={() => onPodcastClick(podcast)}
                showPlayIcon={true}
              />
            </motion.div>
          ))}
        </motion.section>
      )}

      {/* Regular Podcasts by Category */}
      {categories.map((category) => {
        const categoryPodcasts = getContentByCategory(formattedPodcasts, category.id);
        if (categoryPodcasts.length === 0) return null;

        return (
          <motion.section key={category.id} className="category-section listen-learn-section" variants={sectionVariants}>
            <div className="section-header">
              <div className="section-header-main">
                <h2 className="section-title">
                  {category.icon} {category.label}
                </h2>
              </div>
            </div>

            {categoryPodcasts.map((podcast) => (
              <motion.div key={podcast.id} variants={gridItemVariants}>
                <PodcastPlayer
                  audioSrc={podcast.audioSrc}
                  title={podcast.title}
                  date={podcast.date}
                  duration={podcast.duration}
                  thumbnail={podcast.thumbnail}
                  isActive={activePodcast === podcast.id}
                  onPlay={() => onSetActivePodcast(podcast.id)}
                />
              </motion.div>
            ))}
          </motion.section>
        );
      })}
    </motion.div>
  );
}
