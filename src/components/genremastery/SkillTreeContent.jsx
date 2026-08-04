import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Clock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import SkillPathTree from './skilltree/SkillPathTree';

export default function SkillTreeContent({ genre }) {
  if (!genre) return null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-0 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={`bg-black/40 border-white/10 backdrop-blur-md ${genre.accent} px-2 py-0.5 text-xs`}>
                {genre.icon && React.createElement(genre.icon, { className: "w-3 h-3 mr-1" })}{genre.rank}
              </Badge>
              <Badge variant="outline" className="bg-black/40 border-white/10 text-white/60 px-2 py-0.5 text-xs">Lvl {genre.level}/20</Badge>
              <Badge variant="outline" className="bg-blue-500/20 border-blue-500/30 text-blue-300 px-2 py-0.5 text-xs">SEASON 0</Badge>
            </div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-white via-slate-300 to-slate-500 bg-clip-text text-transparent uppercase tracking-tighter">
              {genre.name} Skill Tree
            </h1>
          </div>
          <div className="text-right px-4 py-2 rounded-xl" style={{ background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.15)' }}>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">{genre.xpType}</div>
            <div className="text-xl font-black text-white">{genre.xp}/100</div>
          </div>
        </div>
        {/* XP Bar */}
        <div className="w-full h-2 rounded-full overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <motion.div className="h-full" style={{ background: `linear-gradient(90deg, ${genre.color.split(' ')[1].replace('to-', '')} 0%, white 100%)` }} initial={{ width: 0 }} animate={{ width: `${genre.xp}%` }} transition={{ duration: 1.5, ease: 'circOut' }} />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        {/* Progression Paths */}
        <div className="mb-10">
          <SkillPathTree genre={genre} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: TrendingUp, label: 'Genre Rank', value: genre.rank, color: 'text-blue-400' },
            { icon: Clock, label: 'Time Played', value: '127h', color: 'text-green-400' },
            { icon: Trophy, label: 'Unlocks', value: '12/20', color: 'text-yellow-400' },
            { icon: Users, label: 'Skill Points', value: genre.skillPoints, color: 'text-purple-400' }
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-2xl hover:bg-white/5 transition-all" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2 mb-1">
                {React.createElement(stat.icon, { className: `w-4 h-4 ${stat.color}` })}
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{stat.label}</span>
              </div>
              <div className="text-xl font-black text-white">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}