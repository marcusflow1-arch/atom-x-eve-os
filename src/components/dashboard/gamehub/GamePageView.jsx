import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Play, Radio, Trophy, Clock, Crown, Sparkles, Zap, Target,
  BookOpen, Package, Images, Users, ChevronRight, X, Bug,
  SlidersHorizontal, Wrench, Gamepad2, CheckCircle2, Circle,
} from 'lucide-react';
import { getGameData } from './gameProgressData';

const glass = {
  background: 'linear-gradient(135deg, rgba(8,15,27,.76), rgba(8,15,27,.46))',
  backdropFilter: 'blur(18px) saturate(145%)',
  WebkitBackdropFilter: 'blur(18px) saturate(145%)',
};

function TinyProgress({ value = 0 }) {
  return (
    <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: .7, ease: 'easeOut' }}
        className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400"
      />
    </div>
  );
}

function Stat({ icon: Icon, label, value, tint = 'text-cyan-300' }) {
  return (
    <div className="min-w-[104px] px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-white/40 text-[8px] uppercase tracking-[.18em]">
        <Icon className={`w-3 h-3 ${tint}`} /> {label}
      </div>
      <div className="text-white text-[15px] font-black mt-1 leading-none">{value}</div>
    </div>
  );
}

function HubTile({ icon: Icon, title, subtitle, onClick, accent = 'text-cyan-300' }) {
  return (
    <button
      onClick={onClick}
      className="group text-left min-h-[92px] p-3 rounded-2xl border-none transition-all duration-200 hover:scale-[1.02] hover:ring-1 hover:ring-cyan-500/50 overflow-hidden relative"
      style={glass}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.035] via-transparent to-cyan-400/[0.025] pointer-events-none" />
      <div className="relative flex items-start justify-between gap-2">
        <div className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center">
          <Icon className={`w-4 h-4 ${accent}`} />
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-cyan-300 transition-colors" />
      </div>
      <div className="relative mt-3">
        <div className="text-[11px] font-bold text-white/90">{title}</div>
        <div className="text-[8.5px] text-white/35 mt-1 leading-snug">{subtitle}</div>
      </div>
    </button>
  );
}

export default function GamePageView({ game, friendData, onOpenFriend, onBackToSelf }) {
  const [selectedPatch, setSelectedPatch] = useState(null);
  const gameData = getGameData(game?.id);
  const isFriendView = !!friendData;

  const progress = isFriendView ? (friendData?.progress ?? 0) : (gameData?.progress ?? 0);
  const level = isFriendView ? (friendData?.level ?? 0) : (gameData?.level ?? 0);
  const playtime = isFriendView ? (friendData?.playtime ?? '0h') : (gameData?.playtime ?? game?.playtime ?? '—');
  const achievements = gameData?.achievements ?? game?.achievements ?? '—';
  const achievementPct = gameData?.achievementPct ?? progress;
  const genreLevel = gameData?.genreLevel ?? 1;
  const genreLabel = gameData?.genreLabel ?? 'Rank';
  const cover = game?.image || game?.thumb;
  const thumb = game?.thumb || cover;
  const quests = gameData?.quests || { active: [], available: [] };

  const patches = useMemo(() => {
    const rows = [];
    if (game?.updated_date || game?.version) {
      rows.push({
        id: 'latest',
        tag: 'Latest Patch',
        title: `${game?.title || 'Game'} — Live Update`,
        date: game?.updated_date || 'Today',
        summary: game?.description || 'Performance tuning, quality-of-life improvements and gameplay fixes are now live.',
        features: ['New seasonal progression hooks', 'Improved activity tracking', 'Expanded game hub telemetry'],
        balance: ['Adjusted progression pacing', 'Retuned challenge reward thresholds'],
        fixes: ['Resolved intermittent UI refresh issues', 'Improved loading and session recovery'],
      });
    }
    rows.push(
      {
        id: 'season', tag: 'Season', title: 'Seasonal Event Rotation', date: 'Live',
        summary: 'Fresh seasonal activities, rewards and limited-time objectives are now active.',
        features: ['Limited-time event track', 'New cosmetic reward tier', 'Bonus progression weekends'],
        balance: ['Event XP normalized across activities'],
        fixes: ['Event counter synchronization improvements'],
      },
      {
        id: 'maintenance', tag: 'Server', title: 'Service & Matchmaking Update', date: 'Recent',
        summary: 'Backend maintenance completed with session stability and matchmaking improvements.',
        features: ['Faster reconnect flow'],
        balance: ['Regional matchmaking weighting refined'],
        fixes: ['Reduced failed party joins', 'Improved stale-session cleanup'],
      }
    );
    return rows;
  }, [game]);

  const activeQuests = quests.active || [];
  const availableQuests = quests.available || [];
  const questRows = [...activeQuests, ...availableQuests].slice(0, 4);

  return (
    <motion.div
      key={isFriendView ? `friend-${friendData?.name}` : `game-${game?.id}`}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: .22 }}
      className="relative h-full min-h-0 overflow-hidden bg-slate-950"
    >
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_70%_10%,rgba(34,211,238,.07),transparent_34%),radial-gradient(circle_at_20%_50%,rgba(99,102,241,.06),transparent_36%)]" />

      <div className="relative h-full overflow-y-auto scrollbar-hide">
        {/* Cinematic hero */}
        <section className="relative h-[235px] overflow-hidden">
          {cover && <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover scale-[1.01]" />}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/10 to-slate-950/30" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950 to-transparent" />

          <div className="absolute inset-x-5 bottom-5 flex items-end gap-4">
            <div className="w-14 h-16 rounded-xl overflow-hidden ring-1 ring-white/15 bg-white/5 flex-shrink-0">
              {thumb ? <img src={thumb} alt={game?.title || ''} className="w-full h-full object-cover" /> : <Gamepad2 className="w-5 h-5 text-white/30 m-4" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-[9px] tracking-[.22em] uppercase text-cyan-300/70 mb-1">{game?.genre || 'Game Library'}</div>
              <h1 className="text-[28px] font-black tracking-tight text-white leading-none truncate">{game?.title}</h1>
              <div className="text-[10px] text-white/45 mt-1.5 truncate">
                {isFriendView ? `${friendData?.name}'s save` : `${gameData?.storyAct || 'Current Save'} · ${gameData?.storyChapter || 'In Progress'}`}
              </div>
            </div>

            <div className="hidden xl:flex items-stretch rounded-2xl overflow-hidden bg-slate-950/55 backdrop-blur-xl ring-1 ring-white/[0.06]">
              <Stat icon={Clock} label="Hours Played" value={playtime} tint="text-cyan-300" />
              <Stat icon={Trophy} label="Achievements" value={`${achievementsPct}%`} tint="text-amber-300" />
              <Stat icon={Crown} label="Level" value={`Lv. ${level}`} tint="text-violet-300" />
              <Stat icon={Sparkles} label={genreLabel} value={genreLevel} tint="text-sky-300" />
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button className="h-11 px-6 rounded-xl bg-white text-slate-950 font-black text-[12px] tracking-wide flex items-center gap-2 hover:scale-[1.02] transition-transform shadow-[0_8px_30px_rgba(255,255,255,.12)]">
                <Play className="w-4 h-4 fill-current" /> PLAY
              </button>
              <button className="h-11 px-4 rounded-xl bg-cyan-500/15 text-cyan-200 font-bold text-[11px] flex items-center gap-2 backdrop-blur-xl ring-1 ring-cyan-400/20 hover:scale-[1.02] hover:ring-cyan-400/50 transition-all">
                <Radio className="w-4 h-4" /> STREAM
              </button>
            </div>
          </div>
        </section>

        {/* Mobile stats */}
        <div className="xl:hidden mx-5 -mt-1 mb-4 grid grid-cols-4 divide-x divide-white/[0.05] rounded-2xl overflow-hidden" style={glass}>
          <Stat icon={Clock} label="Hours" value={playtime} />
          <Stat icon={Trophy} label="Awards" value={`${achievementPct}%`} tint="text-amber-300" />
          <Stat icon={Crown} label="Level" value={`Lv.${level}`} tint="text-violet-300" />
          <Stat icon={Sparkles} label={genreLabel} value={genreLevel} />
        </div>

        {/* Main 3-column hub */}
        <section className="px-5 pb-8 grid grid-cols-12 gap-4 items-start">
          {/* Left: updates */}
          <div className="col-span-12 lg:col-span-5 min-w-0">
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <Zap className="w-3.5 h-3.5 text-cyan-300" />
              <span className="text-[10px] uppercase tracking-[.2em] font-black text-white/65">Live Updates</span>
              <span className="text-[8px] text-white/25">PATCHES · EVENTS · SERVICE</span>
            </div>
            <div className="space-y-2">
              {patches.map((patch, i) => (
                <button key={patch.id} onClick={() => setSelectedPatch(patch)}
                  className="w-full text-left group rounded-2xl border-none p-3.5 transition-all duration-200 hover:scale-[1.01] hover:ring-1 hover:ring-cyan-500/50 relative overflow-hidden"
                  style={glass}>
                  <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-cyan-400/80 to-transparent" />
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-cyan-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-[8px] uppercase tracking-[.16em]">
                        <span className="text-cyan-300">{patch.tag}</span>
                        <span className="text-white/25">{patch.date}</span>
                      </div>
                      <div className="text-[12px] font-bold text-white/90 mt-1 group-hover:text-white">{patch.title}</div>
                      <div className="text-[9px] text-white/40 mt-1 leading-relaxed line-clamp-2">{patch.summary}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-white/20 mt-1 group-hover:text-cyan-300" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Center: quests */}
          <div className="col-span-12 md:col-span-6 lg:col-span-3 min-w-0">
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <Target className="w-3.5 h-3.5 text-cyan-300" />
              <span className="text-[10px] uppercase tracking-[.2em] font-black text-white/65">Active Objectives</span>
            </div>
            <div className="rounded-2xl overflow-hidden" style={glass}>
              {questRows.length ? questRows.map((q, idx) => {
                const active = idx < activeQuests.length;
                const pct = q.progress ?? (active ? 48 + idx * 13 : 0);
                return (
                  <div key={q.id || idx} className="p-3.5 border-b border-white/[0.045] last:border-b-0 hover:bg-white/[0.025] transition-colors">
                    <div className="flex items-start gap-2.5">
                      {active ? <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300 mt-0.5 flex-shrink-0" /> : <Circle className="w-3.5 h-3.5 text-white/25 mt-0.5 flex-shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <div className="text-[10.5px] font-bold text-white/85 truncate">{q.title || 'Objective'}</div>
                        <div className="text-[8.5px] text-white/35 mt-1 line-clamp-2">{q.objective || q.description || 'Continue this objective to earn milestone rewards.'}</div>
                        <div className="mt-2.5"><TinyProgress value={pct} /></div>
                        <div className="flex justify-between mt-1.5 text-[7.5px] uppercase tracking-wider">
                          <span className="text-cyan-300/70">{active ? 'Tracked' : 'Available'}</span>
                          <span className="text-white/25">{pct}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="p-5 text-[9px] text-white/35">No tracked objectives yet.</div>
              )}
            </div>
          </div>

          {/* Right: Steam-like feature cards */}
          <div className="col-span-12 md:col-span-6 lg:col-span-4 min-w-0">
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <Gamepad2 className="w-3.5 h-3.5 text-cyan-300" />
              <span className="text-[10px] uppercase tracking-[.2em] font-black text-white/65">Game Hub</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <HubTile icon={BookOpen} title="Community Hub & Guides" subtitle="Top builds, walkthroughs and player strategies." />
              <HubTile icon={Package} title="DLC & Add-Ons Store" subtitle="Expansions, cosmetic passes and extra content." accent="text-violet-300" />
              <HubTile icon={Images} title="Media Gallery & Clips" subtitle="Screenshots, captures and highlight reels." accent="text-sky-300" />
              <HubTile
                icon={Users}
                title="Activity Feed & Friends"
                subtitle={isFriendView ? `Viewing ${friendData?.name}'s activity.` : 'Friends playing now and recent trophy activity.'}
                accent="text-emerald-300"
                onClick={() => {
                  if (isFriendView && onBackToSelf) onBackToSelf();
                  else if (!isFriendView && onOpenFriend && gameData?.friends?.[0]) onOpenFriend(gameData.friends[0]);
                }}
              />
            </div>

            <div className="mt-2.5 rounded-2xl p-3.5" style={glass}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[8px] uppercase tracking-[.18em] text-white/30">Achievement Progress</div>
                  <div className="text-[15px] font-black text-white mt-1">{achievements}</div>
                </div>
                <div className="text-right">
                  <div className="text-[18px] font-black text-cyan-300">{achievementPct}%</div>
                  <div className="text-[8px] text-white/25">COMPLETE</div>
                </div>
              </div>
              <div className="mt-3"><TinyProgress value={achievementPct} /></div>
            </div>
          </div>
        </section>
      </div>

      {/* Patch inspector */}
      <AnimatePresence>
        {selectedPatch && (
          <>
            <motion.button
              aria-label="Close patch inspector"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedPatch(null)}
              className="absolute inset-0 z-40 bg-black/55 backdrop-blur-sm border-none"
            />
            <motion.aside
              initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="absolute right-0 top-0 bottom-0 z-50 w-full sm:w-[440px] overflow-y-auto bg-black/80 backdrop-blur-xl shadow-[-30px_0_80px_rgba(0,0,0,.5)]"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-5 bg-black/45 backdrop-blur-xl border-b border-white/[0.06]">
                <div>
                  <div className="text-[8px] uppercase tracking-[.2em] text-cyan-300">Patch Inspector</div>
                  <div className="text-[16px] font-black text-white mt-1">{selectedPatch.title}</div>
                </div>
                <button onClick={() => setSelectedPatch(null)} className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.12] transition-colors">
                  <X className="w-4 h-4 text-white/70" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="text-[10px] leading-relaxed text-white/45">{selectedPatch.summary}</div>

                {[
                  { title: 'New Features', icon: Sparkles, rows: selectedPatch.features, tint: 'text-cyan-300' },
                  { title: 'Balance Changes', icon: SlidersHorizontal, rows: selectedPatch.balance, tint: 'text-violet-300' },
                  { title: 'Bug Fixes', icon: Bug, rows: selectedPatch.fixes, tint: 'text-emerald-300' },
                ].map(section => (
                  <div key={section.title} className="rounded-2xl p-4" style={glass}>
                    <div className="flex items-center gap-2 text-[10px] font-black text-white/80 uppercase tracking-[.12em]">
                      <section.icon className={`w-3.5 h-3.5 ${section.tint}`} /> {section.title}
                    </div>
                    <div className="mt-3 space-y-2">
                      {(section.rows || []).map((row, i) => (
                        <div key={i} className="flex items-start gap-2 text-[9px] text-white/45 leading-relaxed">
                          <div className="w-1 h-1 rounded-full bg-cyan-300 mt-1.5 flex-shrink-0" /> {row}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="rounded-2xl overflow-hidden min-h-[126px] relative" style={glass}>
                  {cover && <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="relative p-4 h-[126px] flex flex-col justify-end">
                    <div className="flex items-center gap-2 text-[9px] uppercase tracking-[.16em] text-white/55"><Images className="w-3.5 h-3.5 text-cyan-300" /> Media Preview</div>
                    <div className="text-[8px] text-white/30 mt-1">Patch screenshots and feature media surface here.</div>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
