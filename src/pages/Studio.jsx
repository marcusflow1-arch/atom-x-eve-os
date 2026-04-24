import React, { useState } from 'react';
import { motion } from 'framer-motion';
import DevZoneSection from '@/components/game/DevZoneSection';

export default function Studio() {
  const [game, setGame] = useState({
    title: 'Cyberpunk 2088',
    cover_image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80',
    description: 'Experience a world transformed by technology and ancient power.',
    developer: 'Studio Unknown',
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1419] to-[#1a1f2e] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-black text-white mb-2">Developer Studio</h1>
          <p className="text-white/60 text-lg">Development insights, roadmap, and studio updates</p>
        </div>

        {/* Developer Zone Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="border border-white/10 rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(10, 14, 20, 0.5)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div className="p-8">
            <DevZoneSection game={game} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}