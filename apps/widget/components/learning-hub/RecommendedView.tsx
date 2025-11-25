'use client';

import { motion } from 'framer-motion';
import VideoTile from './VideoTile';
import MediaCard from '@/components/common/MediaCard';
import PodcastPlayer from '@/components/podcast-player/PodcastPlayer';
import NoDataState from './NoDataState';

interface RecommendedViewProps {
  featuredVideos: any[];
  formattedInteractivePodcasts: any[];
  formattedPodcasts: any[];
  formattedArticles: any[];
  activePodcast: string | null;
  onVideoClick: (videoId: string) => void;
  onPodcastClick: (podcast: any) => void;
  onArticleClick: (route: string) => void;
  onSetActivePodcast: (id: string) => void;
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

export default function RecommendedView({
  featuredVideos,
  formattedInteractivePodcasts,
  formattedPodcasts,
  formattedArticles,
  activePodcast,
  onVideoClick,
  onPodcastClick,
  onArticleClick,
  onSetActivePodcast,
}: RecommendedViewProps) {
  const hasContent = featuredVideos.length > 0 || formattedInteractivePodcasts.length > 0 || formattedPodcasts.length > 0 || formattedArticles.length > 0;

  if (!hasContent) {
    return (
      <NoDataState
        icon="📚"
        title="No content available"
        description="We're working on curating the perfect content for you. Check back soon!"
        actionText="Explore other sections"
      />
    );
  }

  return (
    <motion.div key="recommended-view" initial="hidden" animate="visible" exit="hidden" variants={containerVariants}>
      {/* Featured Videos */}
      {featuredVideos.length > 0 && (
        <motion.section className="explore-videos-section" variants={sectionVariants}>
          <div className="section-header">
            <div className="section-header-main">
              <h2 className="section-title">Picked for you this week</h2>
              <span className="section-badge">✨ For You</span>
            </div>
            <p className="section-subtitle">Based on your learning goals</p>
          </div>
          <motion.div className="video-tiles-grid" variants={containerVariants}>
            {featuredVideos.map((video, index) => (
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
      )}

      {/* Interactive Podcasts */}
      {formattedInteractivePodcasts.length > 0 && (
        <motion.section className="listen-learn-section" variants={sectionVariants}>
          <div className="section-header">
            <div className="section-header-main">
              <h2 className="section-title">Your interactive mix</h2>
              <span className="section-badge">🎮 Interactive</span>
            </div>
            <p className="section-subtitle">Learn by listening and playing</p>
          </div>

          {formattedInteractivePodcasts.slice(0, 3).map((podcast) => (
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

      {/* Regular Podcasts */}
      {formattedPodcasts.length > 0 && (
        <motion.section className="listen-learn-section" variants={sectionVariants}>
          <div className="section-header">
            <div className="section-header-main">
              <h2 className="section-title">Your podcast mix</h2>
              <span className="section-badge">🎧 Curated</span>
            </div>
            <p className="section-subtitle">Popular with learners like you</p>
          </div>

          {formattedPodcasts.map((podcast) => (
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
      )}

      {/* Articles */}
      {formattedArticles.length > 0 && (
        <motion.section className="listen-learn-section" variants={sectionVariants}>
          <div className="section-header">
            <div className="section-header-main">
              <h2 className="section-title">Recommended reads</h2>
              <span className="section-badge">📚 Trending</span>
            </div>
            <p className="section-subtitle">Handpicked articles for you</p>
          </div>

          {formattedArticles.map((article) => (
            <motion.div key={article.id} variants={gridItemVariants}>
              <MediaCard
                id={article.id}
                title={article.title}
                thumbnail={article.thumbnail}
                variant="article"
                onClick={() => onArticleClick(article.route)}
                showPlayIcon={false}
              />
            </motion.div>
          ))}
        </motion.section>
      )}
    </motion.div>
  );
}
