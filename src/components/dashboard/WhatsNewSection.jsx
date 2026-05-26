import React from 'react';
import { motion } from 'framer-motion';
import { Star, Zap, Trophy, Swords, Radio, Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const UPDATES = [
  { icon: Swords, color: 'from-red-500 to-orange-500', glow: 'rgba(239,68,68,0.25)', tag: 'COMBAT', title: 'Boss Phase System', desc: 'Multi-phase bosses now feature dynamic difficulty scaling based on your level and party size.' },
  { icon: Radio, color: 'from-cyan-500 to-blue-500', glow: 'rgba(34,211,238,0.25)', tag: 'AURA', title: 'Aura Streams Live', desc: 'Watch and interact with live streams directly from the Aura hub. New streamer discovery features.' },
  { icon: Trophy, color: 'from-amber-500 to-yellow-500', glow: 'rgba(251,191,36,0.25)', tag: 'CARDS', title: 'Card Trading System', desc: 'Trade, auction, and collect genre mastery cards with the new trading post.' },
  { icon: Users, color: 'from-emerald-500 to-green-500', glow: 'rgba(52,211,153,0.25)', tag: 'SOCIAL', title: 'Clan Hall Upgrades', desc: 'Clan halls now support custom decorations, upgrade lanes, and aetherium currency.' },
  { icon: Zap, color: 'from-purple-500 to-pink-500', glow: 'rgba(168,85,247,0.25)', tag: 'SKILLS', title: 'Weapon Mastery Trees', desc: 'Fully overhauled weapon mastery system with synergy paths and soul essence upgrades.' },
];

export default function WhatsNewSection() {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full flex flex-col gap-4 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
          <Star className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-white font-bold text-xl tracking-wider">What's New</h2>
          <p className="text-white/40 text-xs">Latest updates & platform highlights</p>
        </div>
      </motion.div>

      {/* Update cards */}
      <div className="flex flex-col gap-3">
        {UPDATES.map((u, i) => {
          const Icon = u.icon;
          return (
            <motion.div
              key={u.title}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
              className="rounded-2xl p-4 border border-white/10 backdrop-blur-md flex gap-4 items-center group cursor-pointer hover:border-white/20 transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                boxShadow: `0 4px 20px ${u.glow}`,
              }}>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${u.color} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{u.tag}</span>
                </div>
                <p className="text-white font-semibold text-sm">{u.title}</p>
                <p className="text-white/50 text-xs mt-0.5 leading-relaxed truncate">{u.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/60 flex-shrink-0 transition-colors" />
            </motion.div>
          );
        })}
      </div>

      {/* Quick nav shortcuts */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55 }}
        className="grid grid-cols-3 gap-3 flex-shrink-0 pb-4">
        {[
          { label: 'Explore Store', route: 'Store', color: 'cyan' },
          { label: 'View Cards', route: 'GenreMastery', color: 'purple' },
          { label: 'Aura Streams', route: 'Aura', color: 'amber' },
        ].map(({ label, route, color }) => (
          <button
            key={label}
            onClick={() => navigate(createPageUrl(route))}
            className={`py-3 rounded-xl border text-sm font-medium transition-all
              ${color === 'cyan' ? 'bg-cyan-500/10 border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/20' :
                color === 'purple' ? 'bg-purple-500/10 border-purple-400/30 text-purple-300 hover:bg-purple-500/20' :
                'bg-amber-500/10 border-amber-400/30 text-amber-300 hover:bg-amber-500/20'}`}>
            {label}
          </button>
        ))}
      </motion.div>
    </div>
  );
}