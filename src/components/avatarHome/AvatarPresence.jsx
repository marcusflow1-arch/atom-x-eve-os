import React from 'react';
import { motion } from 'framer-motion';

export default function AvatarPresence({ avatarData, isOwner }) {
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  return (
    <motion.div
      className="flex items-center gap-4"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.div
        className="w-20 h-20 rounded-2xl bg-white/10 border border-white/10 overflow-hidden"
        animate={{ scale: hovered || focused ? 1.03 : 1, rotate: hovered ? -0.75 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
      >
        <div className="w-full h-full flex items-center justify-center text-2xl font-black">
          {avatarData?.name?.charAt(0) || 'A'}
        </div>
      </motion.div>
      <div>
        <div className="text-2xl font-black tracking-tight">
          {avatarData?.name} {isOwner && <span className="text-white/40 text-base">(you)</span>}
        </div>
        <div className="text-white/50 text-sm">
          Level {avatarData?.level || 1} • {avatarData?.mood || 'calm'}
        </div>
      </div>
    </motion.div>
  );
}