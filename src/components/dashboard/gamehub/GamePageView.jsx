import React from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, Zap, Clock, Target, BookOpen, Star,
  Lock, Play, Radio, Gamepad2, Crown, Sparkles,
  Package,
} from 'lucide-react';
import { getGameData } from './gameProgressData';

// Circular progress ring
function ProgressRing({ pct, size = 56, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.10)" strokeWidth={stroke} fill="none" />
        <motion.circle cx={size/2} cy={size/2} r={r} stroke="url(#ringGrad)" strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }} />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-black text-white tabular-nums">{pct}%</span>
      </div>
    </div>
  );
}

// Inline stat in the ribbon
function RibbonStat({ icon: Icon, value, label, tint, last }) {
  return (
    <div className="flex items-center gap-1.5 px-3">
      <Icon className={`w-3.5 h-3.5 ${tint}`} />
      <div className="leading-none">
        <p className="text-sm font-black text-white tabular-nums">{value}</p>
        <p className="text-[7px] text-white/40 uppercase tracking-wider mt-0.5">{label}</p>
      </div>
      {!last && <div className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-px bg-white/8" />}
    </div>
  );
}

export default function GamePageView({ game, friendData, onOpenFriend, onBackToSelf }) {
  const gameData = getGameData(game?.id);
  const isFriendView = !!friendData;

  const progress = isFriendView ? (friendData.progress ?? 0) : gameData.progress;
  const storyAct = isFriendView ? (friendData.storyAct ?? '—') : gameData.storyAct;
  const storyChapter = isFriendView ? (friendData.storyChapter ?? '—') : gameData.storyChapter;
  const objective = isFriendView ? (friendData.objective ?? '') : gameData.objective;
  const level = isFriendView ? (friendData.level ?? 0) : gameData.level;
  const genreLevel = isFriendView ? (friendData.genreLevel ?? 0) : gameData.genreLevel;
  const playtime = isFriendView ? (friendData.playtime ?? '0h') : gameData.playtime;

  const showCardData = !isFriendView;
  const achievementsTotal = gameData.achievements;
  const achievementsPct = gameData.achievementPct;
  const nextAchievement = gameData.nextAchievement;
  const quests = gameData.quests || { active: [], available: [] };

  const dlc = Array.isArray(game?.dlc) ? game.dlc : [];
  const cover = game?.image || game?.thumb;
  const thumb = game?.thumb || cover;

  // ── Build a clean Updates feed from real game data ──
  const updates = [];
  if (game?.updated_date || game?.version) {
    updates.push({
      kind: 'patch',
      title: `${game?.title || 'Game'} — Latest Patch`,
      body: game?.description || 'A new update has been installed. Performance improvements and bug fixes.',
      meta: game?.version ? `v${game.version}` : 'Installed',
    });
  }
  dlc.forEach(d => updates.push({
    kind: 'dlc',
    title: d.title || d.name || 'New Content',
    body: d.description || 'New downloadable content is available.',
    meta: d.price != null && d.price > 0 ? `$${Number(d.price).toFixed(2)}` : 'Free',
    image: d.image,
  }));
  quests.active.forEach(q => updates.push({
    kind: 'quest',
    title: q.title,
    body: q.objective || q.description || 'Quest in progress.',
    meta: `Tracking · ${q.giver || 'Quest'}`,
  }));
  if (showCardData && nextAchievement) {
    updates.push({
      kind: 'award',
      title: nextAchievement.name,
      body: `Achievement progress at ${nextAchievement.pct}%.`,
      meta: `${nextAchievement.pct}%`,
    });
  }
  if (updates.length === 0) {
    updates.push({
      kind: 'system',
      title: 'No recent updates',
      body: game?.description || 'Updates will appear here as they arrive.',
      meta: '—',
    });
  }

  const allQuests = [...quests.active, ...quests.available];

  return (
    <motion.div
      key={isFriendView ? `friend-${friendData.name}` : `game-${game?.id}`}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col"
    >
      {/* ══════ CINEMATIC HERO ══════ */}
      <div className="relative flex-shrink-0 h-44 overflow-hidden">
        {cover && (
          <motion.img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover"
            initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }} />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(7,10,17,0.30) 0%, rgba(7,10,17,0.55) 45%, rgba(7,10,17,0.98) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(7,10,17,0.65) 0%, transparent 55%, rgba(7,10,17,0.4) 100%)' }} />

        <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between">
          <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-white/70 border border-white/15" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}>
            {game?.genre || 'Game'}
          </span>
          {isFriendView && (
            <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase bg-cyan-500/25 text-cyan-200 border border-cyan-400/40" style={{ backdropFilter: 'blur(8px)' }}>
              {friendData.name}'s run
            </span>
          )}
          <div className="flex items-center gap-1.5 ml-auto">
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-black text-[10px] font-black hover:bg-white/90 transition-colors shadow-lg">
              <Play className="w-2.5 h-2.5 fill-current" /> Play
            </button>
            <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-purple-200 hover:bg-purple-500/30 transition-colors border border-purple-400/40" style={{ background: 'rgba(126,34,206,0.25)', backdropFilter: 'blur(8px)' }}>
              <Radio className="w-2.5 h-2.5" /> Stream
            </button>
          </div>
        </div>

        <div className="absolute bottom-2.5 left-3 right-3 flex items-end gap-3">
          <div className="w-12 h-14 rounded-md overflow-hidden flex-shrink-0 border border-white/20 shadow-xl">
            {thumb ? <img src={thumb} alt={game?.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center bg-white/5"><Gamepad2 className="w-4 h-4 text-white/40" /></div>}
          </div>
          <div className="flex-1 min-w-0 pb-0.5">
            <h2 className="text-2xl font-black text-white tracking-tight leading-none drop-shadow-lg truncate">{game?.title}</h2>
            <p className="text-[10px] text-white/60 mt-1 truncate">{isFriendView ? `${friendData.name}'s save` : storyAct} · {storyChapter}</p>
          </div>
          <ProgressRing pct={progress} />
        </div>
      </div>

      {/* ══════ GLASS STAT RIBBON ══════ */}
      <div className="relative flex-shrink-0 -mt-3 mx-3 rounded-xl overflow-hidden z-10 flex items-stretch"
        style={{ background: 'rgba(12,16,24,0.75)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
        <RibbonStat icon={Clock} value={playtime} label="Playtime" tint="text-blue-400" />
        <RibbonStat icon={Trophy} value={achievementsTotal} label="Awards" tint="text-amber-400" />
        <RibbonStat icon={Crown} value={`Lv.${level}`} label="Player" tint="text-purple-400" />
        <RibbonStat icon={Sparkles} value={`${gameData.genreLabel} ${genreLevel}`} label="Job" tint="text-cyan-400" last />
      </div>

      {/* ══════ BODY: Updates feed (70%) | divider | Quests + Wars (30%) ══════ */}
      <div className="flex-1 flex min-h-0 px-3 pb-3 pt-2 gap-0">
        {/* LEFT — Updates feed */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden pr-3">
          <div className="flex items-center gap-1.5 px-0.5 mb-2">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Updates</span>
            <span className="ml-1 px-1.5 rounded-full bg-white/8 text-white/50 text-[8px] font-bold">{updates.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2 pr-1">
            {updates.map((u, i) => {
              const isPatch = u.kind === 'patch';
              const isDlc = u.kind === 'dlc';
              const isQuest = u.kind === 'quest';
              const isAward = u.kind === 'award';
              const Icon = isPatch ? Zap : isDlc ? Package : isQuest ? Target : isAward ? Trophy : BookOpen;
              const tint = isPatch ? 'text-cyan-400' : isDlc ? 'text-purple-400' : isQuest ? 'text-blue-400' : isAward ? 'text-amber-400' : 'text-white/40';
              const badge = isPatch ? 'Patch' : isDlc ? 'DLC' : isQuest ? 'Quest' : isAward ? 'Award' : 'System';
              const badgeColor = isPatch ? 'bg-cyan-500/20 text-cyan-200' : isDlc ? 'bg-purple-500/20 text-purple-200' : isQuest ? 'bg-blue-500/20 text-blue-200' : isAward ? 'bg-amber-500/20 text-amber-200' : 'bg-white/10 text-white/60';
              return (
                <div key={i} className="relative rounded-xl border border-white/8 p-2.5 flex gap-2.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center border border-white/10 ${badgeColor}`}>
                    <Icon className={`w-4 h-4 ${tint}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider ${badgeColor}`}>{badge}</span>
                      {u.meta && <span className="text-[8px] text-white/35 tabular-nums">{u.meta}</span>}
                    </div>
                    <p className="text-[11px] font-bold text-white/90 leading-tight truncate">{u.title}</p>
                    <p className="text-[9.5px] text-white/50 leading-snug mt-0.5 line-clamp-3">{u.body}</p>
                  </div>
                  {u.image && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                      <img src={u.image} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Vertical divider line */}
        <div className="w-px flex-shrink-0 my-1 bg-gradient-to-b from-transparent via-white/15 to-transparent" />

        {/* RIGHT — Quest Log + Wars */}
        <div className="w-[32%] min-w-[190px] flex flex-col gap-2 pl-3 overflow-hidden">
          {/* Quest Log */}
          <div className="flex flex-col min-h-0 flex-1">
            <div className="flex items-center gap-1.5 px-0.5 mb-2">
              <Target className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Quest Log</span>
              {quests.active.length > 0 && (
                <span className="ml-1 px-1.5 rounded-full bg-blue-500/25 text-blue-200 text-[8px] font-bold">{quests.active.length}</span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide space-y-1.5 pr-1">
              {allQuests.length > 0 ? allQuests.map((q, idx) => {
                const active = idx < quests.active.length;
                return (
                  <div key={q.id} className="relative rounded-lg border border-white/8 px-2.5 py-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l ${active ? 'bg-gradient-to-b from-cyan-400 to-blue-500' : 'bg-white/20'}`} />
                    <div className="pl-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-[10px] font-bold text-white/90 truncate">{q.title}</p>
                        {active && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />}
                      </div>
                      <p className="text-[8.5px] text-white/45 truncate mt-0.5">{q.objective || q.description}</p>
                      <p className="text-[8px] text-white/30 mt-0.5">{active ? 'Active' : 'Available'} · {q.giver || '—'}</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="rounded-lg border border-dashed border-white/10 p-4 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <Target className="w-4 h-4 text-white/15 mx-auto mb-1" />
                  <p className="text-[10px] text-white/35 italic">No quests</p>
                </div>
              )}
            </div>
          </div>

          {/* Wars / Awards */}
          <div className="flex flex-col flex-shrink-0">
            <div className="flex items-center gap-1.5 px-0.5 mb-2">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Wars</span>
            </div>
            {showCardData ? (
              <div className="rounded-xl border border-amber-400/20 p-2.5" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.10), rgba(249,115,22,0.06))' }}>
                <div className="flex items-baseline gap-1.5 mb-1.5">
                  <span className="text-lg font-black text-white tabular-nums leading-none">{achievementsTotal}</span>
                  <span className="text-[9px] text-amber-300/70 font-bold">{achievementsPct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-black/30 overflow-hidden mb-2">
                  <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #f59e0b, #f97316)' }}
                    initial={{ width: 0 }} animate={{ width: `${achievementsPct}%` }} transition={{ duration: 0.7, ease: 'easeOut' }} />
                </div>
                <div className="flex items-center gap-1 mb-1">
                  <Star className="w-2.5 h-2.5 text-amber-400/70" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Next Up</span>
                </div>
                <p className="text-[10px] font-bold text-white/90 truncate">{nextAchievement?.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${nextAchievement?.pct}%` }} />
                  </div>
                  <span className="text-[8px] text-white/50 tabular-nums font-bold">{nextAchievement?.pct}%</span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-white/8 p-3 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <Lock className="w-4 h-4 text-white/15 mx-auto mb-1" />
                <p className="text-[10px] text-white/35">War details private</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}