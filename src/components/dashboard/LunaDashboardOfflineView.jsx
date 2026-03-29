import React from 'react';
import { motion } from 'framer-motion';
import FriendsNetworkWidget from './FriendsNetworkWidget';

export default function LunaDashboardOfflineView() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="absolute z-10 pointer-events-auto"
      style={{
        left: '440px',
        top: '190px',
        width: '247px',
        height: '380px'
      }}
    >
      <FriendsNetworkWidget />
    </motion.div>
  );
}