import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Users, Calendar, TrendingUp, Globe, Twitter, Sparkles, Package, Clock, ChevronRight } from 'lucide-react';

const ACCENT_STYLES = {
  cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', glow: 'shadow-cyan-500/20', gradient: 'from-cyan-500/30 to-transparent', bar: 'bg-cyan-400', hex: '#22d3ee' },
  orange: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', glow: 'shadow-orange-500/20', gradient: 'from-orange-500/30 to-transparent', bar: 'bg-orange-400', hex: '#fb923c' },
  purple: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', glow: 'shadow-purple-500/20', gradient: 'from-purple-500/30 to-transparent', bar: 'bg-purple-400', hex: '#c084fc' },
  blue: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', glow: 'shadow-blue-500/20', gradient: 'from-blue-500/30 to-transparent', bar: 'bg-blue-400', hex: '#60a5fa' },
  red: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', glow: 'shadow-red-500/20', gradient: 'from-red-500/30 to-transparent', bar: 'bg-red-400', hex: '#f87171' },
  green: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', glow: 'shadow-green-500/20', gradient: 'from-green-500/30 to-transparent', bar: 'bg-green-400', hex: '#4ade80' },
};

const STATUS_COLORS = {
  Beta: 'text-green-400 bg-green-500/10',
  Alpha: 'text-cyan-400 bg-cyan-500/10',
  'Pre-Alpha': 'text-yellow-400 bg-yellow-500/10',
  Concept: 'text-purple-400 bg-purple-500/10',
};

const RARITY_COLORS = {
  Mythic: 'text-red-400',
  Legendary: 'text-orange-400',
  Epic: 'text-purple-400',
  Rare: 'text-blue-400',
  Uncommon: 'text-green-400',
  Common: 'text-slate-400',
};

export default function DeveloperProfilePage({ dev, onBack }) {
  const a = ACCENT_STYLES[dev.accentColor] || ACCENT_STYLES.cyan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full overflow-y-auto custom-scrollbar pb-12"
    >
      {/* ─── HERO ─── */}
      <div className="relative h-72 sm:h-80 overflow-hidden">
        <img src={dev.heroImage} alt={dev.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30" />
        <div className={`absolute inset-0 bg-gradient-to-r ${a.gradient} opacity-20 mix-blend-overlay`} />

        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-10 flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-black/60 transition-all text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Developers
        </button>

        {/* Logo + identity */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 flex items-end gap-6">
          <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-2 ${a.border} shadow-2xl flex-shrink-0`}
            style={{ boxShadow: `0 0 40px ${a.hex}30` }}
          >
            <img src={dev.logo} alt={dev.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0 pb-2">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-2">{dev.name}</h1>
            <p className={`text-base ${a.text} font-medium mb-3`}>{dev.tagline}</p>
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-white/50"><MapPin className="w-3.5 h-3.5" /> {dev.location}</span>
              <span className="flex items-center gap-1.5 text-xs text-white/50"><Users className="w-3.5 h-3.5" /> {dev.teamSize} members</span>
              <span className="flex items-center gap-1.5 text-xs text-white/50"><Calendar className="w-3.5 h-3.5" /> Founded {dev.founded}</span>
              <span className="flex items-center gap-1.5 text-xs text-white/50"><TrendingUp className="w-3.5 h-3.5" /> {dev.gamesReleased} shipped</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MILESTONE STRIP ─── */}
      <div className="max-w-6xl mx-auto px-6 -mt-6 relative z-10 mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {dev.milestones.map((m) => (
            <div key={m.label} className={`rounded-2xl border ${a.border} ${a.bg} backdrop-blur-sm p-4 text-center`}>
              <p className={`text-2xl font-black ${a.text}`}>{m.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold mt-1">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── ABOUT ─── */}
      <div className="max-w-6xl mx-auto px-6 mb-10">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-white/40">About the Studio</h2>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <p className="text-sm sm:text-base text-white/70 leading-relaxed">{dev.description}</p>
        <div className="flex items-center gap-4 mt-4">
          {dev.socials.website && (
            <a href={dev.socials.website} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 text-xs ${a.text} hover:underline`}>
              <Globe className="w-3.5 h-3.5" /> {dev.socials.website.replace('https://', '')}
            </a>
          )}
          {dev.socials.twitter && (
            <a href={`https://twitter.com/${dev.socials.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 text-xs ${a.text} hover:underline`}>
              <Twitter className="w-3.5 h-3.5" /> {dev.socials.twitter}
            </a>
          )}
        </div>
      </div>

      {/* ─── IN DEVELOPMENT ─── */}
      <div className="max-w-6xl mx-auto px-6 mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className={`w-4 h-4 ${a.text}`} />
          <h2 className="text-sm font-black uppercase tracking-widest text-white/40">Games In Development</h2>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.bg} ${a.text}`}>{dev.inDevelopment.length}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {dev.inDevelopment.map((proj) => (
            <div key={proj.title} className="group rounded-3xl overflow-hidden border border-white/10 bg-slate-900/40 hover:border-white/20 transition-all">
              <div className="flex gap-0">
                {/* Cover */}
                <div className="w-32 sm:w-40 flex-shrink-0 relative overflow-hidden">
                  <img src={proj.cover} alt={proj.title} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/80" />
                </div>
                {/* Details */}
                <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${STATUS_COLORS[proj.status]}`}>{proj.status}</span>
                      <span className={`text-[9px] uppercase tracking-wider font-bold ${a.text}`}>{proj.genre}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1 truncate">{proj.title}</h3>
                    <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed">{proj.description}</p>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] text-white/30 font-mono">Progress</span>
                      <span className={`text-[9px] font-bold ${a.text}`}>{proj.progress}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                      <div className={`h-full ${a.bar} rounded-full`} style={{ width: `${proj.progress}%` }} />
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <Clock className="w-3 h-3 text-white/30" />
                      <span className="text-[9px] text-white/40">{proj.releaseWindow}</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Feature tags */}
              <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                {proj.features.map((f) => (
                  <span key={f} className="text-[9px] px-2 py-0.5 rounded-md bg-white/5 text-white/40 border border-white/5">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── CUSTOM CARDS ─── */}
      {dev.customCards.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Package className={`w-4 h-4 ${a.text}`} />
            <h2 className="text-sm font-black uppercase tracking-widest text-white/40">Custom Cards</h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.bg} ${a.text}`}>{dev.customCards.length}</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {dev.customCards.map((card) => (
              <div key={card.name} className="group cursor-pointer">
                <div className="relative rounded-2xl overflow-hidden border border-white/10 group-hover:border-white/30 transition-all">
                  <img src={card.art} alt={card.name} className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                  <span className={`absolute top-2 left-2 text-[8px] font-bold px-1.5 py-0.5 rounded bg-black/60 ${RARITY_COLORS[card.rarity]}`}>
                    {card.rarity}
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-[10px] font-bold text-white truncate">{card.name}</p>
                    <p className={`text-[9px] font-mono ${a.text}`}>{card.power.toLocaleString()} AGP</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── UPDATES / DEV LOG ─── */}
      <div className="max-w-6xl mx-auto px-6 mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Clock className={`w-4 h-4 ${a.text}`} />
          <h2 className="text-sm font-black uppercase tracking-widest text-white/40">Dev Log & Updates</h2>
        </div>
        <div className="space-y-3">
          {dev.updates.map((update, idx) => (
            <div key={idx} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.05] transition-all">
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${a.bg} ${a.text}`}>{update.date}</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{update.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{update.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── FOOTER CTA ─── */}
      <div className="max-w-6xl mx-auto px-6 flex justify-center">
        <button
          onClick={onBack}
          className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold ${a.bg} ${a.text} border ${a.border} hover:bg-white/10 transition-all`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Developers
        </button>
      </div>
    </motion.div>
  );
}