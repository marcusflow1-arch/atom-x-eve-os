import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Play, Radio, X, Clock3, Trophy, Gauge, Sparkles, ChevronRight,
  Bug, SlidersHorizontal, Image, ShoppingBag, BookOpen,
  Film, Activity, CalendarDays, Target, Gift, Server, ArrowRight
} from 'lucide-react';

const FALLBACK_UPDATES = [
  { id: 'season', title: 'Season 4 — Void Ascendancy', type: 'Season', date: 'Live now', summary: 'New playable content, seasonal rewards and progression updates.', features: ['New seasonal progression track', 'Fresh map rotation and rewards', 'New collectible unlocks'], balance: ['Role tuning across competitive modes', 'Adjusted progression pacing'], fixes: ['Improved matchmaking stability', 'Resolved several UI and performance issues'] },
  { id: 'patch', title: 'Balance Patch v4.2.1', type: 'Patch', date: 'May 17', summary: 'Gameplay tuning, weapon adjustments and quality-of-life improvements.', features: ['Expanded loadout presets', 'Updated challenge tracking'], balance: ['Rebalanced high-pick-rate equipment', 'Adjusted ability cooldowns'], fixes: ['Fixed progression display mismatch', 'Reduced intermittent frame spikes'] },
  { id: 'maintenance', title: 'Server Maintenance', type: 'Service', date: 'Tomorrow', summary: 'Scheduled backend maintenance and service optimization.', features: ['Infrastructure improvements'], balance: ['No balance changes'], fixes: ['Network stability improvements', 'Match reconnect reliability'] },
];

const FALLBACK_QUESTS = [
  { title: 'Complete 3 competitive matches', type: 'Daily', progress: 67, reward: '850 XP' },
  { title: 'Earn 25 eliminations', type: 'Weekly', progress: 44, reward: 'Rare Card Pack' },
  { title: 'Reach the next account milestone', type: 'Milestone', progress: 78, reward: '2,500 XP + Badge' },
  { title: 'Finish the seasonal story objective', type: 'Season', progress: 31, reward: 'Legendary Unlock' },
];

const HUB_TILES = [
  { id: 'community', title: 'Community Hub & Guides', detail: 'Builds, strategies and player discoveries', icon: BookOpen },
  { id: 'dlc', title: 'DLC & Add-Ons Store', detail: 'Expansions, passes and cosmetics', icon: ShoppingBag },
  { id: 'media', title: 'Media Gallery & Clips', detail: 'Screenshots and saved highlights', icon: Film },
  { id: 'activity', title: 'Activity Feed & Friends', detail: 'Friends playing and trophy activity', icon: Activity },
];

const edgeMask = {
  WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
  maskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
};

function GlassSection({ children, className = '' }) {
  return (
    <section
      className={`relative overflow-hidden border-none bg-slate-950/70 backdrop-blur-md ${className}`}
      style={edgeMask}
    >
      <div className="pointer-events-none absolute inset-x-[8%] top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <div className="pointer-events-none absolute inset-x-[10%] bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-300/[0.06] to-transparent" />
      {children}
    </section>
  );
}

export default function GameLandingPage({ game, onClose }) {
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const title = game?.title || 'Selected Game';
  const hero = game?.image || game?.cover_image || game?.thumb;
  const hours = game?.playtime || game?.hours_played || '128h';
  const achievementText = game?.achievements || `${game?.progress ?? 68}%`;
  const rank = game?.rank || game?.level || 'Lv. 42';
  const quests = useMemo(() => Array.isArray(game?.quests) && game.quests.length ? game.quests : FALLBACK_QUESTS, [game]);
  const updates = useMemo(() => Array.isArray(game?.updates) && game.updates.length ? game.updates : FALLBACK_UPDATES, [game]);

  return (
    <motion.div
      key={game?.id || title}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative h-full min-h-0 overflow-y-auto bg-[#060b12] text-white"
    >
      <div className="relative min-h-[380px] overflow-hidden">
        {hero && <img src={hero} alt="" className="absolute inset-0 h-full w-full scale-[1.02] object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-transparent to-slate-950/45" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#060b12] to-transparent" />

        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-5 top-5 z-20 grid h-9 w-9 place-items-center bg-black/35 text-white/60 backdrop-blur-md transition hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60"
            aria-label="Close game detail"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="relative z-10 flex min-h-[380px] flex-col justify-end px-7 pb-8 md:px-10 lg:px-12">
          <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-200/60">Game Detail Dashboard</div>
          <h1 className="mt-2 max-w-4xl text-3xl font-black tracking-tight md:text-5xl">{title}</h1>
          <p className="mt-3 max-w-2xl line-clamp-2 text-sm leading-6 text-white/55">
            {game?.description || 'Continue your game, review live updates, track objectives and jump into the community without leaving this dashboard.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-5">
            <button className="group flex min-w-[170px] items-center justify-center gap-3 bg-cyan-300 px-7 py-3 text-sm font-black tracking-[0.14em] text-slate-950 transition-all duration-200 hover:scale-[1.02] hover:ring-1 hover:ring-cyan-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100/80">
              <Play className="h-4 w-4 fill-current" /> PLAY
            </button>
            <button className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-white/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60">
              <Radio className="h-4 w-4 text-fuchsia-300" /> STREAM
            </button>
            <div className="hidden h-9 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent md:block" />
            {[
              { label: 'Hours Played', value: hours, icon: Clock3 },
              { label: 'Achievements', value: achievementText, icon: Trophy },
              { label: 'Level / Rank', value: rank, icon: Gauge },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex min-w-[120px] items-center gap-3">
                <Icon className="h-4 w-4 text-cyan-200/65" />
                <div>
                  <div className="text-[9px] uppercase tracking-[0.18em] text-white/30">{label}</div>
                  <div className="mt-0.5 text-sm font-bold">{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 px-5 pb-12 md:px-8 lg:px-10">
        <div className="grid gap-5 xl:grid-cols-[1fr_1.12fr_.9fr]">
          <GlassSection className="min-h-[500px] p-5 md:p-6">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <div className="text-[9px] uppercase tracking-[0.24em] text-white/30">Live intelligence</div>
                <h2 className="mt-1 text-lg font-bold">Updates & Patch Notes</h2>
              </div>
              <Server className="h-4 w-4 text-cyan-300/50" />
            </div>

            <div className="space-y-1">
              {updates.map((u, i) => (
                <button
                  key={u.id || i}
                  onClick={() => setSelectedUpdate(u)}
                  className="group w-full px-1 py-4 text-left transition-all duration-200 hover:translate-x-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200/65">{u.type || 'Update'}</span>
                    <span className="text-[9px] text-white/25">{u.date || 'Recent'}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <h3 className="font-semibold text-white/85 group-hover:text-white">{u.title}</h3>
                    <ChevronRight className="h-3.5 w-3.5 text-white/20 group-hover:text-cyan-200" />
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-white/35">{u.summary || u.desc}</p>
                  <div className="mt-4 h-px bg-gradient-to-r from-white/10 via-white/[0.045] to-transparent" />
                </button>
              ))}
            </div>
          </GlassSection>

          <GlassSection className="min-h-[500px] p-5 md:p-6">
            <div className="mb-6">
              <div className="text-[9px] uppercase tracking-[0.24em] text-white/30">Active progression</div>
              <h2 className="mt-1 text-lg font-bold">Quest Log & Objectives</h2>
            </div>

            <div className="space-y-5">
              {quests.map((q, i) => {
                const p = Number(q.progress ?? 0);
                return (
                  <div key={q.title || i} className="group">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center bg-cyan-500/20 text-cyan-400">
                        <Target className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-cyan-300/55">{q.type || 'Objective'}</span>
                          <span className="text-[10px] font-bold text-white/50">{p}%</span>
                        </div>
                        <h3 className="mt-1 text-sm font-semibold text-white/80">{q.title}</h3>
                        <div className="mt-3 h-1 overflow-hidden bg-white/[0.06]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, p)}%` }}
                            transition={{ duration: .7, delay: i * .08 }}
                            className="h-full bg-cyan-400/55"
                          />
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-white/30">
                          <Gift className="h-3 w-3" /> {q.reward || 'Progress reward'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-7 flex items-center justify-between bg-cyan-500/[0.035] px-4 py-3">
              <div>
                <div className="text-[9px] uppercase tracking-[.18em] text-cyan-200/45">Next reset</div>
                <div className="text-xs font-semibold text-white/70">Daily challenges refresh in 6h 42m</div>
              </div>
              <CalendarDays className="h-4 w-4 text-cyan-200/45" />
            </div>
          </GlassSection>

          <GlassSection className="min-h-[500px] p-5 md:p-6">
            <div className="mb-5">
              <div className="text-[9px] uppercase tracking-[0.24em] text-white/30">Game hub</div>
              <h2 className="mt-1 text-lg font-bold">Explore {title}</h2>
            </div>

            <div className="grid gap-3">
              {HUB_TILES.map(({ id, title: tileTitle, detail, icon: Icon }) => (
                <button
                  key={id}
                  className="group relative overflow-hidden bg-white/[0.025] p-4 text-left transition-all duration-200 hover:scale-[1.02] hover:ring-1 hover:ring-cyan-500/50 focus-visible:scale-[1.02] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/70"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/[0.035] to-transparent opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" />
                  <div className="relative flex items-center gap-4">
                    <div className="grid h-10 w-10 shrink-0 place-items-center bg-white/[0.04]">
                      <Icon className="h-4 w-4 text-cyan-200/65" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-white/80 group-hover:text-white group-focus-visible:text-white">{tileTitle}</h3>
                      <p className="mt-1 text-[10px] text-white/30">{detail}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-white/20 transition group-hover:translate-x-1 group-hover:text-cyan-200 group-focus-visible:translate-x-1 group-focus-visible:text-cyan-200" />
                  </div>
                </button>
              ))}
            </div>
          </GlassSection>
        </div>
      </div>

      <AnimatePresence>
        {selectedUpdate && (
          <motion.div
            className="fixed inset-0 z-[10020] flex justify-end bg-black/35 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedUpdate(null)}
          >
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="h-full w-full max-w-2xl overflow-y-auto bg-black/80 p-6 backdrop-blur-xl md:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[9px] uppercase tracking-[.24em] text-cyan-200/50">Patch Inspector</div>
                  <h2 className="mt-2 text-2xl font-black">{selectedUpdate.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/45">{selectedUpdate.summary || selectedUpdate.desc}</p>
                </div>
                <button
                  onClick={() => setSelectedUpdate(null)}
                  className="grid h-9 w-9 place-items-center text-white/40 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60"
                  aria-label="Close patch inspector"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-8 grid aspect-video place-items-center bg-gradient-to-br from-slate-800/70 via-slate-950 to-black">
                <div className="text-center text-white/25">
                  <Image className="mx-auto h-7 w-7" />
                  <div className="mt-2 text-[10px] uppercase tracking-[.2em]">Media Preview</div>
                </div>
              </div>

              {[
                { title: 'New Features', icon: Sparkles, items: selectedUpdate.features },
                { title: 'Balance Changes', icon: SlidersHorizontal, items: selectedUpdate.balance },
                { title: 'Bug Fixes', icon: Bug, items: selectedUpdate.fixes },
              ].map(({ title: sectionTitle, icon: Icon, items }) => (
                <div key={sectionTitle} className="mt-7">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Icon className="h-4 w-4 text-cyan-300/65" />
                    {sectionTitle}
                  </div>
                  <div className="mt-3 space-y-2">
                    {(items || ['Details available in the full release notes.']).map((item, i) => (
                      <div key={i} className="flex gap-3 text-xs leading-5 text-white/50">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-cyan-300/60" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
