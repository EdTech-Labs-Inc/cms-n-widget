'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { getXPData } from '@/utils/xpManager';
import LearningHubHeader from './LearningHubHeader';
import SearchModal from './SearchModal';
import WelcomeSection from './WelcomeSection';
import FilterPills from './FilterPills';
import RecommendedView from './RecommendedView';
import WatchView from './WatchView';
import ListenView from './ListenView';
import ReadView from './ReadView';
import StreakModal from './StreakModal';
import XPModal from './XPModal';

import '../../app/LearningHub.css';

// Types for the server-fetched data
interface LearningHubContent {
  videos: any[];
  podcasts: any[];
  interactivePodcasts: any[];
  articles: any[];
  fetchTime: Date | string;
}

interface LearningHubClientProps {
  initialContent: LearningHubContent;
}

// Animation variants for container
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

function LearningHubClient({ initialContent }: LearningHubClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activePodcast, setActivePodcast] = useState<string | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showXPModal, setShowXPModal] = useState(false);
  const [streakCount, setStreakCount] = useState(3);
  const [xpData, setXPData] = useState(getXPData());
  const [activeFilter, setActiveFilter] = useState<'recommended' | 'watch' | 'listen' | 'read'>('recommended');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle webview authentication and first-time visit check
  useEffect(() => {
    const isWebview = searchParams?.get('webview') === 'true';

    if (isWebview) {
      localStorage.setItem('authToken', 'webview-token');
    }

    const hasSeenStreakModal = localStorage.getItem('hasSeenStreakModal');

    if (!hasSeenStreakModal) {
      setShowStreakModal(true);
      setStreakCount(1);
    } else {
      const savedStreak = localStorage.getItem('userStreak');
      if (savedStreak) {
        setStreakCount(parseInt(savedStreak, 10));
      }
    }

    // Load XP data
    setXPData(getXPData());
  }, [searchParams]);

  // Refresh XP data when returning to page
  useEffect(() => {
    const handleFocus = () => {
      setXPData(getXPData());
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setXPData(getXPData());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'userXP') {
        setXPData(getXPData());
      }
    };

    // Refresh periodically while page is active
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setXPData(getXPData());
      }
    }, 1000);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  // Test outbound IP
  useEffect(() => {
    fetch("https://<YOUR_REQUESTBIN_URL>")
      .then(() => console.log("Request sent to RequestBin"))
      .catch(console.error);
  }, []);

  // Refresh XP data when XP modal is closed
  const handleCloseXPModal = () => {
    setShowXPModal(false);
    setXPData(getXPData());
  };

  const handleCloseStreakModal = () => {
    setShowStreakModal(false);
    localStorage.setItem('hasSeenStreakModal', 'true');
    localStorage.setItem('userStreak', '1');
  };

  useAuth();

  // Helper to map ContentCategory to display category
  const mapContentCategory = (category: string) => {
    switch (category) {
      case 'EVERGREEN':
        return 'evergreen';
      case 'PERIODIC_UPDATES':
        return 'periodic-updates';
      case 'MARKET_UPDATES':
        return 'market-updates';
      default:
        return 'evergreen';
    }
  };

  // Transform database videos into UI format
  const allVideos = initialContent.videos.map((videoOutput: any) => ({
    id: videoOutput.id,
    title: videoOutput.title || videoOutput.submission?.article?.title || 'Untitled Video',
    videoUrl: videoOutput.videoUrl,
    thumbnailUrl: videoOutput.thumbnailUrl || '/assets/AssetAllocationThumb.png',
    duration: videoOutput.duration,
    transcript: videoOutput.transcript,
    bubbles: videoOutput.bubbles || [],
    category: mapContentCategory(videoOutput.submission?.article?.category || 'EVERGREEN'),
  }));

  const featuredVideos = allVideos.slice(0, 6);

  // Transform podcasts
  const formattedPodcasts = initialContent.podcasts.map((podcast, index) => ({
    id: `podcast-${podcast.id}`,
    audioSrc: podcast.audioFileUrl || '',
    title: podcast.title || podcast.submission?.article?.title || 'Untitled Podcast',
    date: new Date(podcast.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    duration: podcast.duration ? `${Math.round(podcast.duration / 60)} min` : '3 min',
    thumbnail: podcast.thumbnailUrl || '/assets/AssetAllocationThumb.png',
    category: mapContentCategory(podcast.submission?.article?.category || 'EVERGREEN'),
    isInteractive: false as const,
    interactivePodcastId: undefined,
  }));

  // Transform interactive podcasts
  const formattedInteractivePodcasts = initialContent.interactivePodcasts.map((podcast) => ({
    id: `interactive-podcast-${podcast.id}`,
    title: podcast.title || 'Untitled Interactive Podcast',
    date: new Date(podcast.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    duration: podcast.duration ? `${Math.round(podcast.duration / 60)} min` : '3 min',
    thumbnail: podcast.thumbnailUrl || '/assets/AssetAllocationThumb.png',
    category: podcast.tags?.[0]?.tag?.name || 'evergreen',
    isInteractive: true as const,
    interactivePodcastId: podcast.id,
  }));

  const allPodcasts = [...formattedPodcasts, ...formattedInteractivePodcasts];

  // Transform articles
  const formattedArticles = initialContent.articles.map((article) => ({
    id: article.id,
    title: article.title,
    content: article.content,
    thumbnail: article.thumbnailUrl || '/assets/AAarticlethumb.png',
    route: `/article/${article.id}`,
    category: mapContentCategory(article.category),
  }));

  // Category labels
  const categories = [
    { id: 'evergreen', label: 'Fundamentals of Finance', icon: '📚' },
    { id: 'periodic-updates', label: 'Periodic Updates', icon: '📅' },
    { id: 'market-updates', label: 'Market Updates', icon: '📈' },
  ];

  const getContentByCategory = <T extends { category?: string }>(content: T[], categoryId: string): T[] => {
    return content.filter((item) => item.category === categoryId);
  };

  const searchContent = (query: string) => {
    if (!query.trim()) return { videos: [], podcasts: [], articles: [] };

    const lowerQuery = query.toLowerCase();

    const matchedVideos = featuredVideos.filter((video) => video.title.toLowerCase().includes(lowerQuery));
    const matchedPodcasts = allPodcasts.filter((podcast) => podcast.title.toLowerCase().includes(lowerQuery));
    const matchedArticles = formattedArticles.filter((article) => article.title.toLowerCase().includes(lowerQuery));

    return {
      videos: matchedVideos,
      podcasts: matchedPodcasts,
      articles: matchedArticles,
    };
  };

  const searchResults = searchContent(searchQuery);

  const handleSearchToggle = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) {
      setSearchQuery('');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleVideoClick = (videoId: string) => {
    router.push(`/video/${videoId}?returnTo=/&skipQuestions=true`);
  };

  const handlePodcastClick = (podcast: any) => {
    if (podcast.isInteractive && podcast.interactivePodcastId) {
      router.push(`/interactive-podcasts?id=${podcast.interactivePodcastId}`);
    } else {
      setActivePodcast(podcast.id);
    }
  };

  const handleArticleClick = (route: string) => {
    router.push(route);
  };

  return (
    <div className="lh-page">
      {/* Header */}
      <LearningHubHeader
        onSearchToggle={handleSearchToggle}
        xpData={xpData}
        onXPClick={() => setShowXPModal(true)}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchExpanded}
        onClose={handleSearchToggle}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        searchResults={searchResults}
        onVideoClick={handleVideoClick}
        onPodcastClick={handlePodcastClick}
        onArticleClick={handleArticleClick}
      />

      <motion.div className="lh-page__content" initial="hidden" animate="visible" variants={containerVariants}>
        {/* Welcome Section */}
        <WelcomeSection />

        {/* Filter Pills */}
        <FilterPills activeFilter={activeFilter} onFilterChange={setActiveFilter} />

        {/* Recommended View */}
        {activeFilter === 'recommended' && (
          <RecommendedView
            featuredVideos={featuredVideos}
            formattedInteractivePodcasts={formattedInteractivePodcasts}
            formattedPodcasts={formattedPodcasts}
            formattedArticles={formattedArticles}
            activePodcast={activePodcast}
            onVideoClick={handleVideoClick}
            onPodcastClick={handlePodcastClick}
            onArticleClick={handleArticleClick}
            onSetActivePodcast={setActivePodcast}
          />
        )}

        {/* Watch View */}
        {activeFilter === 'watch' && (
          <WatchView
            allVideos={allVideos}
            categories={categories}
            onVideoClick={handleVideoClick}
            getContentByCategory={getContentByCategory}
          />
        )}

        {/* Listen View */}
        {activeFilter === 'listen' && (
          <ListenView
            allPodcasts={allPodcasts}
            formattedInteractivePodcasts={formattedInteractivePodcasts}
            formattedPodcasts={formattedPodcasts}
            categories={categories}
            activePodcast={activePodcast}
            onPodcastClick={handlePodcastClick}
            onSetActivePodcast={setActivePodcast}
            getContentByCategory={getContentByCategory}
          />
        )}

        {/* Read View */}
        {activeFilter === 'read' && (
          <ReadView
            formattedArticles={formattedArticles}
            categories={categories}
            onArticleClick={handleArticleClick}
            getContentByCategory={getContentByCategory}
          />
        )}
      </motion.div>

      {/* Streak Modal */}
      <StreakModal isOpen={showStreakModal} onClose={handleCloseStreakModal} />

      {/* XP Modal */}
      <XPModal isOpen={showXPModal} onClose={handleCloseXPModal} />
    </div>
  );
}

export default LearningHubClient;
