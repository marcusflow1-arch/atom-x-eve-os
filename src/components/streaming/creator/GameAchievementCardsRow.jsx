import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const RARITY_STYLES = {
  Common: { glow: 'rgba(148,163,184,.22)', edge: 'rgba(226,232,240,.38)', accent: '#cbd5e1' },
  Rare: { glow: 'rgba(59,130,246,.34)', edge: 'rgba(96,165,250,.72)', accent: '#93c5fd' },
  Epic: { glow: 'rgba(168,85,247,.38)', edge: 'rgba(216,180,254,.76)', accent: '#d8b4fe' },
  Legendary: { glow: 'rgba(245,158,11,.42)', edge: 'rgba(253,186,116,.86)', accent: '#fdba74' }
};

const ACHIEVEMENT_LIBRARY = {
  'The Elder Scrolls': ['Dragonborn', 'Dwemer Centurion', 'Flame Atronach', 'Daedric Prince', 'Nightblade', 'Ancient Hero'],
  'SMITE 2': ['Divine Warrior', 'Storm Caller', 'Shadow Hunter', 'Battle Mage', 'Titan Slayer', 'Arena Champion'],
  'Fallout': ['Wasteland Survivor', 'Vault Dweller', 'Brotherhood Knight', 'Deathclaw Hunter', 'Rad Runner', 'Overseer'],
  'Cyberpunk 2077': ['Night City Legend', 'Chrome Runner', 'Netrunner', 'Street Samurai', 'Fixer', 'Afterlife Icon'],
  'Destiny 2': ['Guardian', 'Vanguard', 'Crucible Ace', 'Hive Slayer', 'Arc Walker', 'Voidwalker']
};

const GENERIC_ACHIEVEMENTS = ['First Blood', 'Untouchable', 'Treasure Hunter', 'Master Tactician', 'Arena Legend', 'Chain Breaker'];

// Horizontal, height-filling row of achievement cards for a single game.
// Matches the Achievement Cards collector style used across the streaming pages.
export default function GameAchievementCardsRow({ game }) {
  const [hovered, setHovered] = useState(null);
  const names = ACHIEVEMENT_LIBRARY[game.title] || GENERIC_ACHIEVEMENTS;

  return (
    <div className="h-full min-w-max flex items-center gap-4 pr-2">
      {names.map((name, index) => {
        const rarity = index % 5 === 0 ? 'Legendary' : index % 3 === 0 ? 'Epic' : index % 2 === 0 ? 'Rare' : 'Common';
        const style = RARITY_STYLES[rarity];
        const id = `${game.title}-${name}-${index}`;
        const isHovered = hovered === id;
        return (
          <button
            key={id}
            type="button"
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered(null)}
            className="h-full text-left outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/60"
            aria-label={`${name} achievement card`}
          >
            <motion.div
              animate={{ y: isHovered ? -6 : 0, scale: isHovered ? 1.03 : 1 }}
              transition={{ type: 'spring', stiffness: 250, damping: 23 }}
              className="relative h-full overflow-hidden border bg-slate-950/90"
              style={{
                aspectRatio: '3 / 4',
                maxWidth: '150px',
                borderColor: isHovered ? style.edge : 'rgba(255,255,255,.14)',
                boxShadow: isHovered
                  ? `0 14px 34px ${style.glow}, 0 0 26px ${style.glow}, inset 0 0 20px ${style.glow}`
                  : `0 0 16px ${style.glow}`
              }}
            >
              <div
                className="absolute -inset-8 opacity-90"
                style={{
                  background: `radial-gradient(circle at 72% 20%, ${style.glow}, transparent 36%), linear-gradient(145deg, rgba(255,255,255,.09), transparent 28%, rgba(124,58,237,.12) 75%, rgba(15,23,42,.95))`
                }}
              />
              <div className="absolute inset-[3px] border border-white/[0.07] pointer-events-none" />
              <div className="absolute inset-x-0 top-0 h-[55%] overflow-hidden">
                <img src={game.image} alt="" className="w-full h-full object-cover opacity-75 mix-blend-screen" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/10 to-slate-950" />
              </div>
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2">
                <span
                  className="px-1.5 py-0.5 text-[7px] uppercase tracking-[0.16em] font-bold border bg-black/45"
                  style={{ color: style.accent, borderColor: style.edge }}
                >
                  {rarity}
                </span>
                <Sparkles className="w-3 h-3" style={{ color: style.accent }} />
              </div>
              <div className="absolute left-2 right-2 bottom-2">
                <div className="text-[7px] uppercase tracking-[0.18em] text-white/35 mb-0.5 truncate">{game.title}</div>
                <div className="text-[12px] font-extrabold text-white leading-tight truncate">{name}</div>
                <div className="mt-1.5 h-px bg-gradient-to-r from-white/30 via-white/10 to-transparent" />
                <div className="text-[7px] uppercase tracking-wider text-white/30 mt-1">Collectible achievement</div>
              </div>
              {isHovered && (
                <motion.div
                  initial={{ x: '-120%', opacity: 0 }}
                  animate={{ x: '120%', opacity: [0, 0.7, 0] }}
                  transition={{ duration: 0.9, ease: 'easeInOut' }}
                  className="absolute top-0 bottom-0 w-8 -skew-x-12 bg-gradient-to-r from-transparent via-white/85 to-transparent blur-[2px] pointer-events-none"
                />
              )}
            </motion.div>
          </button>
        );
      })}
    </div>
  );
}