import React from 'react';
import { motion } from 'framer-motion';
import { Star, User, Zap, Trophy, Bot, TrendingUp, Shield, Sparkles } from 'lucide-react';

// Mock community data per DLC
const DLC_COMMUNITY_DATA = {
  dlc_1: {
    rating: 4.6,
    owners: '12.4K',
    comments: [
      { user: 'NeuralHunter', text: 'The Neural Shock ability completely changed my playstyle. Must-have expansion.' },
      { user: 'CyberVet88', text: 'Story missions are top-tier. The Architect quest alone is worth the price.' }
    ],
    tags: ['Abilities', 'AI Avatar', 'Story', 'Progression']
  },
  dlc_2: {
    rating: 4.3,
    owners: '8.7K',
    comments: [
      { user: 'ShadowRunn3r', text: 'Stealth builds are finally viable. The Void Walker form is insane.' },
      { user: 'GhostOps', text: 'Seven equipment sets and each one feels unique. Great variety.' }
    ],
    tags: ['Equipment', 'Stealth', 'Combat', 'Progression']
  },
  dlc_3: {
    rating: 4.8,
    owners: '21.1K',
    comments: [
      { user: 'SeasonKing', text: 'Best value in gaming. Every DLC drop has been quality so far.' },
      { user: 'CompletionistX', text: 'The exclusive avatar skin alone makes this worth it. Plus the XP boost is huge.' }
    ],
    tags: ['All Content', 'AI Avatar', 'Progression', 'Exclusive Rewards']
  }
};

const TAG_STYLES = {
  'Abilities': { icon: Zap, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  'AI Avatar': { icon: Bot, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  'Story': { icon: Sparkles, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  'Progression': { icon: TrendingUp, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  'Equipment': { icon: Shield, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  'Stealth': { icon: Shield, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
  'Combat': { icon: Zap, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  'All Content': { icon: Trophy, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  'Exclusive Rewards': { icon: Star, color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
};

export default function DLCInfoPanel({ dlc }) {
  const community = DLC_COMMUNITY_DATA[dlc.id] || {
    rating: 4.0,
    owners: '1.2K',
    comments: [{ user: 'Player', text: 'Great content addition.' }],
    tags: ['Content']
  };

  return (
    <motion.div
      key={dlc.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col gap-5 h-full"
    >
      {/* DLC Title */}
      <div>
        <h4 className="text-lg font-bold text-white leading-tight mb-1">{dlc.name}</h4>
        <p className="text-xs text-white/50 leading-relaxed line-clamp-2">{dlc.description}</p>
      </div>

      {/* Rating & Owners */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${i <= Math.round(community.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`}
              />
            ))}
          </div>
          <span className="text-sm font-bold text-white ml-1">{community.rating}</span>
        </div>
        <div className="flex items-center gap-1.5 text-white/50 text-xs">
          <User className="w-3 h-3" />
          <span>{community.owners} owners</span>
        </div>
      </div>

      {/* Highlighted Comments */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Community Highlights</span>
        {community.comments.map((comment, i) => (
          <div key={i} className="bg-white/5 border border-white/5 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[9px] font-bold text-white">
                {comment.user.charAt(0)}
              </div>
              <span className="text-[11px] font-semibold text-white/70">{comment.user}</span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">"{comment.text}"</p>
          </div>
        ))}
      </div>

      {/* Impact Tags */}
      <div className="space-y-2 mt-auto">
        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">DLC Impact</span>
        <div className="flex flex-wrap gap-1.5">
          {community.tags.map((tag) => {
            const style = TAG_STYLES[tag] || { icon: Zap, color: 'text-white/60 bg-white/5 border-white/10' };
            const TagIcon = style.icon;
            return (
              <span key={tag} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border ${style.color}`}>
                <TagIcon className="w-3 h-3" />
                {tag}
              </span>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}