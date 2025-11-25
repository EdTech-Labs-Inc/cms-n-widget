'use client';

import { motion } from 'framer-motion';

interface SearchResults {
  videos: any[];
  podcasts: any[];
  articles: any[];
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  searchResults: SearchResults;
  onVideoClick: (videoId: string) => void;
  onPodcastClick: (podcast: any) => void;
  onArticleClick: (route: string) => void;
}

export default function SearchModal({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  searchResults,
  onVideoClick,
  onPodcastClick,
  onArticleClick,
}: SearchModalProps) {
  if (!isOpen) return null;

  const hasSearchResults =
    searchQuery.trim() &&
    (searchResults.videos.length > 0 || searchResults.podcasts.length > 0 || searchResults.articles.length > 0);

  const handleVideoClick = (videoId: string) => {
    onVideoClick(videoId);
    onClose();
  };

  const handlePodcastClick = (podcast: any) => {
    onPodcastClick(podcast);
    onClose();
  };

  const handleArticleClick = (route: string) => {
    onArticleClick(route);
    onClose();
  };

  return (
    <motion.div
      className="search-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="search-modal"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <div className="search-modal-header">
          <div className="search-modal-input-wrapper">
            <svg className="search-modal-icon" width="20" height="20" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="2" />
              <path d="M11 11L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              className="search-modal-input"
              placeholder="Search videos, podcasts, articles..."
              value={searchQuery}
              onChange={onSearchChange}
              autoFocus
            />
          </div>
          <button className="search-modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="search-modal-content">
          {!searchQuery.trim() ? (
            <div className="search-modal-empty">
              <p>Search for videos, podcasts, or articles</p>
            </div>
          ) : !hasSearchResults ? (
            <div className="search-modal-empty">
              <p>No results found for "{searchQuery}"</p>
            </div>
          ) : (
            <>
              <div className="search-results-summary">
                Found {searchResults.videos.length + searchResults.podcasts.length + searchResults.articles.length}{' '}
                results
              </div>

              {/* Videos Results */}
              {searchResults.videos.length > 0 && (
                <div className="search-modal-category">
                  <h3 className="search-modal-category-title">
                    <span>📺</span> Videos ({searchResults.videos.length})
                  </h3>
                  <div className="search-modal-videos">
                    {searchResults.videos.map((video) => (
                      <div
                        key={video.id}
                        className="search-result-item"
                        onClick={() => handleVideoClick(video.id)}
                      >
                        <img src={video.thumbnailUrl} alt={video.title} className="search-result-thumbnail" />
                        <div className="search-result-info">
                          <h4 className="search-result-title">{video.title}</h4>
                          {video.duration && <p className="search-result-meta">{video.duration}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Podcasts Results */}
              {searchResults.podcasts.length > 0 && (
                <div className="search-modal-category">
                  <h3 className="search-modal-category-title">
                    <span>🎧</span> Podcasts ({searchResults.podcasts.length})
                  </h3>
                  <div className="search-modal-podcasts">
                    {searchResults.podcasts.map((podcast) => (
                      <div
                        key={podcast.id}
                        className="search-result-item"
                        onClick={() => handlePodcastClick(podcast)}
                      >
                        <img src={podcast.thumbnail} alt={podcast.title} className="search-result-thumbnail" />
                        <div className="search-result-info">
                          <h4 className="search-result-title">
                            {podcast.title}
                            {podcast.isInteractive && <span style={{ marginLeft: '8px' }}>🎮</span>}
                          </h4>
                          <p className="search-result-meta">{podcast.duration}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Articles Results */}
              {searchResults.articles.length > 0 && (
                <div className="search-modal-category">
                  <h3 className="search-modal-category-title">
                    <span>📚</span> Articles ({searchResults.articles.length})
                  </h3>
                  <div className="search-modal-articles">
                    {searchResults.articles.map((article) => (
                      <div
                        key={article.id}
                        className="search-result-item"
                        onClick={() => handleArticleClick(article.route)}
                      >
                        <img src={article.thumbnail} alt={article.title} className="search-result-thumbnail" />
                        <div className="search-result-info">
                          <h4 className="search-result-title">{article.title}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
