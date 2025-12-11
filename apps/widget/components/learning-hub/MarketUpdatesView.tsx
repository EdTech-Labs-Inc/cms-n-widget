'use client';

import { motion } from 'framer-motion';
import VideoTile from './VideoTile';
import MediaCard from '@/components/common/MediaCard';
import PodcastPlayer from '@/components/podcast-player/PodcastPlayer';
import NoDataState from './NoDataState';

interface MarketUpdatesViewProps {
  videos: any[];
  interactivePodcasts: any[];
  podcasts: any[];
  articles: any[];
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

export default function MarketUpdatesView({
  videos,
  interactivePodcasts,
  podcasts,
  articles,
  activePodcast,
  onVideoClick,
  onPodcastClick,
  onArticleClick,
  onSetActivePodcast,
}: MarketUpdatesViewProps) {
  const hasContent = videos.length > 0 || interactivePodcasts.length > 0 || podcasts.length > 0 || articles.length > 0;

  // Get first 2 videos for recommended section
  const recommendedVideos = videos.slice(0, 2);

  if (!hasContent) {
    return (
      <NoDataState
        icon="📈"
        title="No market updates yet"
        description="Stay tuned for the latest market insights and updates!"
        actionText="Check Fundamentals"
      />
    );
  }

  return (
    <motion.div key="market-updates-view" initial="hidden" animate="visible" exit="hidden" variants={containerVariants}>
      {/* Recommended Videos */}
      {recommendedVideos.length > 0 && (
        <motion.section className="explore-videos-section" variants={sectionVariants}>
          <div className="section-header">
            <div className="section-header-main">
              <h2 className="section-title">Latest updates</h2>
              <span className="section-badge">📈 Market</span>
            </div>
            <p className="section-subtitle">Stay informed with the latest market news</p>
          </div>
          <motion.div className="video-tiles-grid video-tiles-grid--two" variants={containerVariants}>
            {recommendedVideos.map((video, index) => (
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
      {interactivePodcasts.length > 0 && (
        <motion.section className="listen-learn-section" variants={sectionVariants}>
          <div className="section-header">
            <div className="section-header-main">
              <h2 className="section-title">Interactive updates</h2>
              <span className="section-badge">🎮 Interactive</span>
            </div>
            <p className="section-subtitle">Engage with the latest market insights</p>
          </div>

          {interactivePodcasts.slice(0, 3).map((podcast) => (
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
      {podcasts.length > 0 && (
        <motion.section className="listen-learn-section" variants={sectionVariants}>
          <div className="section-header">
            <div className="section-header-main">
              <h2 className="section-title">Market podcasts</h2>
              <span className="section-badge">🎧 Audio</span>
            </div>
            <p className="section-subtitle">Listen to expert market analysis</p>
          </div>

          {podcasts.map((podcast) => (
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
      {articles.length > 0 && (
        <motion.section className="listen-learn-section" variants={sectionVariants}>
          <div className="section-header">
            <div className="section-header-main">
              <h2 className="section-title">Market articles</h2>
              <span className="section-badge">📖 Read</span>
            </div>
            <p className="section-subtitle">In-depth market analysis</p>
          </div>

          {articles.map((article) => (
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
