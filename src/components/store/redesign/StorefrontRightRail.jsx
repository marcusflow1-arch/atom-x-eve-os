// StorefrontRightRail.jsx — Right column: personalized, daily deal, trending, mega deal
import React from 'react';
import { Star, Clock } from 'lucide-react';
import { PERSONALIZED, DAILY_DEAL, TRENDING_NOW, MEGA_DEAL } from './storefrontData';

const Card = ({ children, className = '' }) => (
  <div
    className={`relative rounded-2xl p-4 border border-white/[0.12] overflow-hidden ${className}`}
    style={{
      background: 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
      backdropFilter: 'blur(16px) saturate(160%)',
      WebkitBackdropFilter: 'blur(16px) saturate(160%)',
      boxShadow: '0 8px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10)',
    }}
  >
    {/* subtle top sheen for glass texture */}
    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
    {children}
  </div>
);

// Vibrant per-rank colors (1 → 4+) for the Trending list
const RANK_COLORS = [
  { text: 'text-yellow-300', glow: 'rgba(253,224,71,0.9)', star: 'text-yellow-400' },
  { text: 'text-cyan-300', glow: 'rgba(34,211,238,0.9)', star: 'text-cyan-400' },
  { text: 'text-fuchsia-300', glow: 'rgba(232,121,249,0.9)', star: 'text-fuchsia-400' },
  { text: 'text-emerald-300', glow: 'rgba(52,211,153,0.9)', star: 'text-emerald-400' },
  { text: 'text-orange-300', glow: 'rgba(253,186,116,0.9)', star: 'text-orange-400' },
];

export default function StorefrontRightRail({ onSelect }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Personalized */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-bold text-xs uppercase tracking-widest">Personalized for You</h3>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">AI</span>
        </div>
        <p className="text-white/35 text-[10px] mb-3">Based on your playstyle</p>
        <div className="flex gap-3">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/20 border border-cyan-400/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🧠</span>
          </div>
          <div className="flex-1 space-y-1.5 text-[10px]">
            <div><span className="text-white/40">Playstyle: </span>{PERSONALIZED.playstyle.map((p, i) => <span key={p} className="text-cyan-300 font-semibold">{p}{i < 2 ? ' • ' : ''}</span>)}</div>
            <div><span className="text-white/40">Genres: </span>{PERSONALIZED.genres.map((g, i) => <span key={g} className="text-purple-300 font-semibold">{g}{i < 2 ? ' • ' : ''}</span>)}</div>
            <div><span className="text-white/40">Last Played: </span><span className="text-white/70">{PERSONALIZED.lastPlayed}</span></div>
          </div>
        </div>
      </Card>

      {/* Daily Deal */}
      <Card className="!p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-3">
          <h3 className="text-yellow-400 font-bold text-xs uppercase tracking-widest">Daily Deal</h3>
          <span className="flex items-center gap-1 text-[10px] text-white/50"><Clock className="w-3 h-3" />{DAILY_DEAL.timer}</span>
        </div>
        <div className="flex gap-3 p-4">
          <img src={DAILY_DEAL.image} alt={DAILY_DEAL.title} className="w-20 h-14 rounded-lg object-cover border border-white/10" />
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-bold truncate">{DAILY_DEAL.title}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 text-[10px] font-bold">{DAILY_DEAL.discount}</span>
              <span className="text-white/30 text-[10px] line-through">{DAILY_DEAL.oldPrice}</span>
              <span className="text-white font-bold text-sm">{DAILY_DEAL.price}</span>
            </div>
          </div>
        </div>
        <div className="px-4 pb-4">
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${DAILY_DEAL.claimed}%`, background: 'linear-gradient(90deg,#ec4899,#a855f7)' }} />
          </div>
          <div className="text-[9px] text-white/40 mt-1">{DAILY_DEAL.claimed}% Claimed</div>
        </div>
      </Card>

      {/* Trending Now */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold text-xs uppercase tracking-widest">Trending Now</h3>
          <button className="text-cyan-300 text-[10px] font-semibold uppercase tracking-wider">View All</button>
        </div>
        <div className="space-y-2.5">
          {TRENDING_NOW.map((t, i) => {
            const c = RANK_COLORS[i] || RANK_COLORS[RANK_COLORS.length - 1];
            return (
              <button key={t.rank} onClick={() => onSelect?.(t.title)} className="flex items-center gap-2.5 w-full text-left group">
                <span className={`font-black text-base w-6 flex-shrink-0 text-center ${c.text}`} style={{ textShadow: `0 0 10px ${c.glow}` }}>{t.rank}</span>
                <img src={t.image} alt={t.title} className="w-9 h-9 rounded-lg object-cover border border-white/10 flex-shrink-0 group-hover:border-cyan-400/30 transition-colors" />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs font-semibold truncate group-hover:text-cyan-300 transition-colors">{t.title}</div>
                  <span className={`flex items-center gap-0.5 text-[9px] font-bold ${c.star}`}><Star className="w-2.5 h-2.5 fill-current" />{t.rating}</span>
                </div>
                <span className="text-white/70 text-[10px] font-bold flex-shrink-0">${t.price}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Mega Deals */}
      <Card className="!p-0 overflow-hidden relative h-[150px]">
        <img src={MEGA_DEAL.image} alt="Mega Deal" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(110deg, rgba(8,10,18,0.95) 30%, rgba(168,85,247,0.3) 100%)' }} />
        <div className="relative z-10 p-4 flex flex-col h-full justify-center">
          <h3 className="text-cyan-300 font-bold text-xs uppercase tracking-widest">Mega Deals</h3>
          <div className="text-white/60 text-[10px]">Save up to</div>
          <div className="text-white font-black text-4xl leading-none">{MEGA_DEAL.save}</div>
          <div className="text-white/40 text-[9px] mb-2">Limited Time Only</div>
          <button className="w-fit px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-white/20 transition-all">Browse All Deals</button>
        </div>
      </Card>
    </div>
  );
}