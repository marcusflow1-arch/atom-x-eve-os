import React from 'react';
import { motion } from 'framer-motion';

const rarityClass = (r) => r === 'legendary' ? 'from-amber-400/50 to-pink-400/40' : r === 'rare' ? 'from-cyan-400/40 to-blue-400/30' : 'from-white/15 to-white/5';

export default function AvatarAchievementWall({ achievements = [] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="font-bold mb-3 text-white/90">Trophy Wall</div>
      {achievements.length === 0 ? (
        <p className="text-white/40 text-sm">No achievements yet.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {achievements.map((a) => (
            <motion.div
              key={a.id}
              whileHover={{ scale: 1.05 }}
              className={`h-24 rounded-xl bg-gradient-to-br ${rarityClass(a.rarity)} border border-white/10 p-2 flex items-end`}
              title={a.title}
            >
              <div className="text-xs text-white/80 truncate w-full">{a.title}</div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}