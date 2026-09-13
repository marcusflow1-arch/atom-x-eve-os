import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, CheckCircle2, Gamepad2, Lock, Play, Sparkles, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';

const titleOf = (game) => game?.title || game?.name || 'Game';
const imageOf = (game) => game?.banner_image || game?.banner || game?.cover_image || game?.cover || '';

export default function LibraryGameDetailModal({ game, onClose, initialTab = 'details' }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab === 'achievements' ? 'achievements' : 'details');
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => setActiveTab(initialTab === 'achievements' ? 'achievements' : 'details'), [initialTab, game?.id]);

  useEffect(() => {
    if (!game) return undefined;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [ach, owned] = await Promise.all([
          base44.entities.Achievement.filter({ game: titleOf(game) }, 'title', 500).catch(() => []),
          user?.id ? base44.entities.UserAchievement.filter({ user_id: user.id }, '-created_date', 1000).catch(() => []) : Promise.resolve([]),
        ]);
        if (!cancelled) {
          setAchievements(ach || []);
          setUserAchievements(owned || []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [game, user?.id]);

  useEffect(() => {
    const key = (event) => { if (event.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);

  const unlocked = useMemo(() => new Set(userAchievements.filter((row) => row.status === 'unlocked').map((row) => String(row.achievement_id))), [userAchievements]);
  const unlockedCount = achievements.filter((row) => unlocked.has(String(row.id))).length;
  const progress = achievements.length ? Math.round((unlockedCount / achievements.length) * 100) : 0;

  if (!game) return null;

  const title = titleOf(game);
  const hero = imageOf(game);
  const description = game.description || game.summary || 'Your library record for this game. Launch it, review its information, or track the achievements connected to your Atom X Eve card collection.';
  const tags = Array.isArray(game.tags) ? game.tags : [game.genre].filter(Boolean);

  const launch = async () => {
    try {
      const response = await base44.functions.invoke('playItem', { type: 'game', title, id: game.id || null });
      const data = response?.data || response || {};
      const url = data.launch_url || data.url;
      if (url) window.location.assign(url);
    } catch (error) {
      console.warn('Game launch failed.', error);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
      className="fixed bottom-[52px] left-[320px] right-0 top-[64px] z-[69] flex min-h-0 flex-col overflow-hidden text-white"
      style={{ background: 'rgba(5,9,15,.74)', backdropFilter: 'blur(34px) saturate(135%)', WebkitBackdropFilter: 'blur(34px) saturate(135%)' }}
      aria-label={`${title} library details`}
    >
      <header className="relative flex h-[168px] flex-shrink-0 items-end overflow-hidden border-b border-white/[0.065] px-6 pb-5">
        {hero && <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-28" />}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,9,15,.96),rgba(5,9,15,.60)_55%,rgba(5,9,15,.82)),linear-gradient(0deg,rgba(5,9,15,.95),transparent_65%)]" />
        <div className="relative z-10 min-w-0 flex-1">
          <p className="text-[8px] font-bold uppercase tracking-[.24em] text-cyan-100/38">Library</p>
          <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight text-white/95">{title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px] uppercase tracking-[.13em] text-white/34">
            {game.genre && <span>{game.genre}</span>}
            {game.original_year && <><span className="text-white/12">•</span><span>{game.original_year}</span></>}
            <span className="text-white/12">•</span><span>{achievements.length ? `${unlockedCount}/${achievements.length} achievements` : 'Achievement record'}</span>
          </div>
        </div>
        <button onClick={launch} className="relative z-10 mr-3 flex h-9 items-center gap-2 bg-white/[0.09] px-4 text-[9px] font-bold uppercase tracking-[.15em] text-white/80 ring-1 ring-white/[0.10] transition hover:bg-white/[0.14]"><Play className="h-3.5 w-3.5 fill-current" /> Play</button>
        <button onClick={onClose} className="relative z-10 grid h-9 w-9 place-items-center text-white/35 transition hover:bg-white/[0.06] hover:text-white"><X className="h-4 w-4" /></button>
      </header>

      <nav className="flex h-[48px] flex-shrink-0 items-center gap-6 border-b border-white/[0.055] px-6">
        {[
          { id: 'details', label: 'Details', icon: Gamepad2 },
          { id: 'achievements', label: 'Achievements', icon: Award },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)} className={`relative flex h-full items-center gap-2 text-[9px] font-bold uppercase tracking-[.16em] transition ${activeTab === id ? 'text-white/85' : 'text-white/28 hover:text-white/50'}`}>
            <Icon className="h-3.5 w-3.5" />{label}
            {activeTab === id && <span className="absolute inset-x-0 bottom-0 h-px bg-cyan-100/55" />}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
        {activeTab === 'details' ? (
          <div className="mx-auto grid w-full max-w-[1180px] gap-8 px-7 py-7 lg:grid-cols-[minmax(0,1fr)_300px]">
            <main>
              <p className="max-w-3xl text-sm leading-7 text-white/52">{description}</p>
              {tags.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{tags.map((tag) => <span key={tag} className="bg-white/[0.035] px-2.5 py-1 text-[8px] uppercase tracking-[.13em] text-white/35 ring-1 ring-white/[0.06]">{tag}</span>)}</div>}
              <div className="mt-8 grid gap-px bg-white/[0.055] sm:grid-cols-3">
                {[
                  ['Status', game.status || 'Ready to play'],
                  ['Release', game.release_date || game.original_year || 'Library'],
                  ['Price', game.price != null ? `$${Number(game.price).toFixed(2)}` : 'Owned'],
                ].map(([label, value]) => <div key={label} className="bg-[#080d14]/80 px-4 py-4"><p className="text-[7px] font-bold uppercase tracking-[.18em] text-white/22">{label}</p><p className="mt-1.5 text-xs text-white/70">{value}</p></div>)}
              </div>
              {game.system_requirements && <section className="mt-8 border-t border-white/[0.055] pt-5"><h3 className="text-[9px] font-bold uppercase tracking-[.18em] text-white/38">System Requirements</h3><pre className="mt-3 whitespace-pre-wrap font-sans text-[11px] leading-6 text-white/38">{typeof game.system_requirements === 'string' ? game.system_requirements : JSON.stringify(game.system_requirements, null, 2)}</pre></section>}
            </main>
            <aside>
              <div className="bg-white/[0.025] p-4 ring-1 ring-white/[0.055]">
                <div className="flex items-center justify-between"><span className="text-[8px] font-bold uppercase tracking-[.18em] text-white/28">Achievement Progress</span><span className="text-xs font-semibold text-cyan-100/65">{progress}%</span></div>
                <div className="mt-3 h-1 overflow-hidden bg-white/[0.055]"><div className="h-full bg-cyan-100/55" style={{ width: `${progress}%` }} /></div>
                <p className="mt-3 text-[10px] leading-5 text-white/28">Unlocked achievements feed the same card ownership system used by Inventory, friend trading, and the Trading Post.</p>
              </div>
            </aside>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[1180px] px-7 py-7">
            <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-[8px] font-bold uppercase tracking-[.2em] text-white/25">Achievement Record</p><h2 className="mt-1 text-lg font-semibold text-white/82">{unlockedCount} unlocked · {achievements.length} total</h2></div><span className="text-[9px] text-white/25">{loading ? 'Syncing…' : `${progress}% complete`}</span></div>
            {achievements.length ? (
              <div className="grid gap-px bg-white/[0.05] sm:grid-cols-2 xl:grid-cols-3">
                {achievements.map((achievement) => {
                  const isUnlocked = unlocked.has(String(achievement.id));
                  return <article key={achievement.id} className="relative min-h-[150px] bg-[#080d14]/88 p-4 transition hover:bg-white/[0.035]">
                    <div className="flex items-start gap-3"><div className={`grid h-9 w-9 flex-shrink-0 place-items-center ${isUnlocked ? 'bg-cyan-100/[0.07] text-cyan-100/70' : 'bg-white/[0.025] text-white/18'}`}>{isUnlocked ? <CheckCircle2 className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}</div><div className="min-w-0"><h3 className="truncate text-xs font-semibold text-white/78">{achievement.title}</h3><p className="mt-1 text-[8px] uppercase tracking-[.14em] text-white/24">{achievement.rarity || 'Common'} · {achievement.category || 'Achievement'}</p></div></div>
                    <p className="mt-4 line-clamp-3 text-[10px] leading-5 text-white/35">{achievement.description}</p>
                    <div className="mt-4 flex items-center justify-between text-[8px] uppercase tracking-[.12em]"><span className={isUnlocked ? 'text-cyan-100/55' : 'text-white/20'}>{isUnlocked ? 'Unlocked' : 'Locked'}</span><span className="flex items-center gap-1 text-white/20"><Sparkles className="h-3 w-3" />{achievement.points || 0} pts</span></div>
                  </article>;
                })}
              </div>
            ) : <div className="grid min-h-[260px] place-items-center border border-white/[0.05] bg-white/[0.015] text-center"><div><Award className="mx-auto h-7 w-7 text-white/10" /><p className="mt-3 text-sm text-white/38">No achievements registered for this game yet.</p></div></div>}
          </div>
        )}
      </div>
    </motion.section>
  );
}
