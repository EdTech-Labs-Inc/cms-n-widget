'use client';

import { motion } from 'framer-motion';
import MediaCard from '@/components/common/MediaCard';
import NoDataState from './NoDataState';

interface ReadViewProps {
  formattedArticles: any[];
  categories: Array<{ id: string; label: string; icon: string }>;
  onArticleClick: (route: string) => void;
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

export default function ReadView({ formattedArticles, categories, onArticleClick, getContentByCategory }: ReadViewProps) {
  if (formattedArticles.length === 0) {
    return (
      <NoDataState
        icon="📖"
        title="No articles available"
        description="We're working on adding more written content for you to read and learn from."
        actionText="Check back later"
      />
    );
  }

  return (
    <motion.div key="read-view" initial="hidden" animate="visible" exit="hidden" variants={containerVariants}>
      {categories.map((category) => {
        const categoryArticles = getContentByCategory(formattedArticles, category.id);
        if (categoryArticles.length === 0) return null;

        return (
          <motion.section key={category.id} className="category-section listen-learn-section" variants={sectionVariants}>
            <div className="section-header">
              <div className="section-header-main">
                <h2 className="section-title">
                  {category.icon} {category.label}
                </h2>
              </div>
            </div>

            {categoryArticles.map((article) => (
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
        );
      })}
    </motion.div>
  );
}
