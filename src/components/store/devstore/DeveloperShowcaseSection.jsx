import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, MapPin, Users, Calendar, TrendingUp, Sparkles } from 'lucide-react';

const ACCENT_STYLES = {
  cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', glow: 'shadow-cyan-500/20', gradient: 'from-cyan-500/30 to-transparent', bar: 'bg-cyan-400' },
  orange: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', glow: 'shadow-orange-500/20', gradient: 'from-orange-500/30 to-transparent', bar: 'bg-orange-400' },
  purple: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', glow: 'shadow-purple-500/20', gradient: 'from-purple-500/30 to-transparent', bar: 'bg-purple-400' },
  blue: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', glow: 'shadow-blue-500/20', gradient: 'from-blue-500/30 to-transparent', bar: 'bg-blue-400' },
  red: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', glow: 'shadow-red-500/20', gradient: 'from-red-500/30 to-transparent', bar: 'bg-red-400' },
  green: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', glow: 'shadow-green-500/20', gradient: 'from-green-500/30 to-transparent', bar: 'bg-green-400' },
};

const STATUS_COLORS = {
  Beta: 'text-green-400 bg-green-500/10',
  Alpha: 'text-cyan-400 bg-cyan-500/10',
  'Pre-Alpha': 'text-yellow-400 bg-yellow-500/10',
  Concept: 'text-purple-400 bg-purple-500/10',
};

export default function DeveloperShowcaseSection({ dev, onSelect, index }) {
  const a = ACCENT_STYLES[dev.accentColor] || ACCENT_STYLES.cyan;

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
      className="relative w-full"
    >
      {/* Hero band */}
      <div className="relative h-56 sm:h-64 rounded-3xl overflow-hidden mb-5">
        <img src={dev.heroImage} alt={dev.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className={`absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent`} />
        <div className={`absolute inset-0 bg-gradient-to-r ${a.gradient} opacity-30 mix-blend-overlay`} />

        {/* Logo + name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end gap-5">
          <div className={`w-20 h-20 rounded-2xl overflow-hidden border-2 ${a.border} ${a.glow} shadow-xl flex-shrink-0`}>
            <img src={dev.logo} alt={dev.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-black tracking-tight text-white mb-1">{dev.name}</h2>
            <p className={`text-sm ${a.text} font-medium`}>{dev.tagline}</p>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-right">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Followers</p>
              <p className="text-lg font-bold text-white">{(dev.followers / 1000).toFixed(0)}K</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info strip */}
      <div className="flex flex-wrap items-center gap-4 mb-5 px-1">
        <span className="flex items-center gap-1.5 text-xs text-white/50"><MapPin className="w-3.5 h-3.5" /> {dev.location}</span>
        <span className="flex items-center gap-1.5 text-xs text-white/50"><Users className="w-3.5 h-3.5" /> {dev.teamSize} members</span>
        <span className="flex items-center gap-1.5 text-xs text-white/50"><Calendar className="w-3.5 h-3.5" /> Founded {dev.founded}</span>
        <span className="flex items-center gap-1.5 text-xs text-white/50"><TrendingUp className="w-3.5 h-3.5" /> {dev.gamesReleased} games shipped</span>
      </div>

      {/* Description */}
      <p className="text-sm text-white/60 leading-relaxed mb-6 px-1 max-w-3xl">{dev.description}</p>

      {/* In-development games */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Sparkles className={`w-4 h-4 ${a.text}`} />
          <h3 className="text-sm font-black uppercase tracking-widest text-white/50">In Development</h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.bg} ${a.text}`}>{dev.inDevelopment.length} active</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {dev.inDevelopment.map((proj) => (
            <div key={proj.title} className="group relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900/50 hover:border-white/20 transition-all">
              <div className="aspect-[4/5] relative">
                <img src={proj.cover} alt={proj.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                <span className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-md ${STATUS_COLORS[proj.status] || STATUS_COLORS.Concept}`}>
                  {proj.status}
                </span>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className={`text-[9px] uppercase tracking-wider font-bold ${a.text} mb-1`}>{proj.genre}</p>
                  <h4 className="text-white text-xs font-bold leading-tight mb-2 line-clamp-2">{proj.title}</h4>
                  {/* Progress bar */}
                  <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                    <div className={`h-full ${a.bar} rounded-full`} style={{ width: `${proj.progress}%` }} />
                  </div>
                  <p className="text-[9px] text-white/40 mt-1 font-mono">{proj.progress}% · {proj.releaseWindow}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom cards preview */}
      {dev.customCards.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Sparkles className={`w-4 h-4 ${a.text}`} />
            <h3 className="text-sm font-black uppercase tracking-widest text-white/50">Custom Cards</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.bg} ${a.text}`}>{dev.customCards.length} cards</span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {dev.customCards.map((card) => (
              <div key={card.name} className="flex-shrink-0 w-28 group cursor-pointer">
                <div className="relative rounded-xl overflow-hidden border border-white/10 group-hover:border-white/30 transition-all">
                  <img src={card.art} alt={card.name} className="w-full aspect-[3/4] object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  <p className="absolute bottom-1 left-1 right-1 text-[9px] font-bold text-white truncate">{card.name}</p>
                </div>
                <p className={`text-[9px] text-center mt-1 font-bold ${a.text}`}>{card.rarity}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latest update preview */}
      {dev.updates.length > 0 && (
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${a.bg} ${a.text}`}>Latest Update</span>
            <span className="text-[10px] text-white/30">{dev.updates[0].date}</span>
          </div>
          <h4 className="text-sm font-bold text-white mb-1">{dev.updates[0].title}</h4>
          <p className="text-xs text-white/50 line-clamp-2">{dev.updates[0].body}</p>
        </div>
      )}

      {/* View profile button */}
      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(dev)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider ${a.bg} ${a.text} border ${a.border} hover:bg-white/10 transition-all`}
        >
          View {dev.name}
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Section separator */}
      <div className="mt-10 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </motion.section>
  );
}