'use client';

import { motion } from 'framer-motion';

interface NoDataStateProps {
  icon: string;
  title: string;
  description: string;
  actionText?: string;
}

export default function NoDataState({ icon, title, description, actionText }: NoDataStateProps) {
  return (
    <motion.div
      className="no-data-state"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="no-data-icon">{icon}</div>
      <h3 className="no-data-title">{title}</h3>
      <p className="no-data-description">{description}</p>
      {actionText && <p className="no-data-hint">{actionText}</p>}
    </motion.div>
  );
}
