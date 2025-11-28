import React from 'react';
import { motion } from 'framer-motion';

export default function StoryText({ scene, isActive }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="max-w-2xl"
    >
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight"
      >
        {scene.headline}
      </motion.h2>
      
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
        className="text-lg md:text-xl text-gray-300 leading-relaxed"
      >
        {scene.body}
      </motion.p>
      
      {scene.poseName && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
          className="mt-6 text-sm text-gray-500 uppercase tracking-wider"
        >
          Pose: {scene.poseName}
        </motion.div>
      )}
    </motion.div>
  );
}