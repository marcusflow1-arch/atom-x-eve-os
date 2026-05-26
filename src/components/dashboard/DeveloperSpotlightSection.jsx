import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Star, ArrowRight, Code2, Rocket, Zap, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import DevSpotlightShowcase from './DevSpotlightShowcase';
import DevSpotlightRibbon from './DevSpotlightRibbon';

const HIGHLIGHTS = [
  {
    icon: Rocket,
    color: 'from-purple-500 to-indigo-500',
    glow: 'rgba(168,85,247,0.3)',
    title: 'New Features Coming',
    desc: 'Expanded multiplayer rooms, AI companion upgrades, and new boss encounters.',
  },
  {
    icon: Code2,
    color: 'from-cyan-500 to-blue-500',
    glow: 'rgba(34,211,238,0.3)',
    title: 'Engine Updates',
    desc: 'Physics improvements, terrain streaming enhancements, and reduced load times.',
  },
  {
    icon: Zap,
    color: 'from-amber-500 to-orange-500',
    glow: 'rgba(251,191,36,0.3)',
    title: 'Combat Overhaul',
    desc: 'Reworked skill trees, new weapon masteries, and boss phase controllers.',
  },
  {
    icon: BookOpen,
    color: 'from-emerald-500 to-green-500',
    glow: 'rgba(52,211,153,0.3)',
    title: 'Storyline Expansion',
    desc: 'New AI-generated story arcs and branching dialogue trees are underway.',
  },
];

export default function DeveloperSpotlightSection({ onOpenOverlay }) {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full flex flex-col gap-4 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-xl tracking-wider">Developer Spotlight</h2>
            <p className="text-white/40 text-xs">What's being built for you</p>
          </div>
        </div>
        <button
          onClick={onOpenOverlay}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300 hover:bg-purple-500/30 transition-all text-sm font-medium">
          Full Spotlight
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Ribbon */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex-shrink-0">
        <DevSpotlightRibbon />
      </motion.div>

      {/* Highlight cards */}
      <div className="grid grid-cols-2 gap-3 flex-shrink-0">
        {HIGHLIGHTS.map((h, i) => {
          const Icon = h.icon;
          return (
            <motion.div
              key={h.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.07 }}
              className="rounded-2xl p-4 border border-white/10 backdrop-blur-md flex gap-3 items-start"
              style={{
                background: 'rgba(255,255,255,0.04)',
                boxShadow: `0 4px 20px ${h.glow}`,
              }}>
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${h.color} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{h.title}</p>
                <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{h.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main showcase */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
        className="flex-1 min-h-[240px]">
        <DevSpotlightShowcase onOpenOverlay={onOpenOverlay} />
      </motion.div>
    </div>
  );
}