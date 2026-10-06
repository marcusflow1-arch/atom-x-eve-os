import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftRight,
  ChevronDown,
  Gamepad2,
  Layers3,
  LogIn,
  MessageSquare,
  MoreHorizontal,
  Shield,
  Sparkles,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import GenesisModelPreview from '@/components/onboarding/GenesisModelPreview';
import { joinDashboard } from '@/components/social/dashboardSession';
import FriendTradePanel from './FriendTradePanel';
import { showError, showSuccess } from '@/components/error/ErrorToast';

const rarityTone = {
  Common: 'text-slate-300 border-slate-300/15',
  Uncommon: 'text-emerald-200 border-emerald-300/20',
  Rare: 'text-sky-200 border-sky-300/20',
  Epic: 'text-violet-200 border-violet-300/20',
  Legendary: 'text-amber-200 border-amber-300/25',
  Mythic: 'text-fuchsia-200 border-fuchsia-300/25',
  Unique: 'text-cyan-100 border-cyan-200/25',
  Mythical: 'text-fuchsia-200 border-fuchsia-300/25',
  Limitless: 'text-cyan-100 border-cyan-200/25',
};

const titleCase = (value = '') => String(value).replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

function Section({ title, subtitle, icon: Icon, children, className = '' }) {
  return (
    <section className={`min-w-0 ${className}`}>
      <header className="mb-2.5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-3.5 w-3.5 text-cyan-100/48" />}
            <h2 className="text-[10px] font-black uppercase tracking-[.19em] text-white/70">{title}</h2>
          </div>
          {subtitle && <p className="mt-1 text-[8px] text-white/28">{subtitle}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

function EmptyState({ text }) {
  return <div className="grid min-h-[92px] place-items-center border border-white/[0.055] bg-white/[0.018] px-4 text-center text-[9px] text-white/28">{text}</div>;
}

function ConsoleStat({ label, value }) {
  return (
    <div className="min-w-0 border-l border-white/[0.07] pl-3 first:border-l-0 first:pl-0">
      <div className="truncate text-[7px] font-bold uppercase tracking-[.16em] text-white/25">{label}</div>
      <div className="mt-1 truncate text-lg font-black tabular-nums text-white/88">{value}</div>
    </div>
  );
}

export default function FriendProfileOverlay({ friend, onClose }) {
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [actionState, setActionState] = useState({});
  const friendId = String(friend?.friend_id || friend?.id || friend?.player_id || '');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['friend-console-profile', friendId],
    queryFn: async () => {
      const response = await base44.functions.invoke('friendConsoleProfile', { target_user_id: friendId });
      const body = response?.data ?? response ?? {};
      if (body?.error) throw new Error(body.error);
      return body.profile || null;
    },
    enabled: Boolean(friendId),
    staleTime: 30000,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  });

  const profile = data || {
    id: friendId,
    name: friend?.friend_name || friend?.name || 'Player',
    avatar_url: friend?.friend_avatar || friend?.avatar || '',
    status: friend?.status || 'offline',
    current_game: friend?.current_game || friend?.game || '',
    level: 1,
    xp: 0,
    prestige: 0,
    genre_ranks: [],
    achievements: [],
    cards: [],
    games: [],
    counts: { achievements: 0, cards: 0, games: 0, genres: 0 },
  };

  const normalizedFriend = useMemo(() => ({
    id: profile.id || friendId,
    friend_id: profile.id || friendId,
    player_id: profile.id || friendId,
    name: profile.name,
    friend_name: profile.name,
    avatar: profile.avatar_url,
    friend_avatar: profile.avatar_url,
    status: profile.status,
    current_game: profile.current_game,
  }), [profile, friendId]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        if (moreOpen) setMoreOpen(false);
        else if (!tradeOpen) onClose?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen, tradeOpen, onClose]);

  const runAction = async (key, fn, message) => {
    if (actionState[key] === 'working') return;
    setActionState((current) => ({ ...current, [key]: 'working' }));
    try {
      await fn();
      setActionState((current) => ({ ...current, [key]: 'done' }));
      if (message) showSuccess(message);
    } catch (actionError) {
      setActionState((current) => ({ ...current, [key]: 'error' }));
      showError(actionError, 'Friend Profile');
    }
  };

  const openMessage = () => {
    onClose?.();
    const target = normalizedFriend;
    window.__lunaPendingMessageTarget = target;
    window.dispatchEvent(new CustomEvent('openLunaMessages', { detail: { target } }));
    window.setTimeout(() => window.dispatchEvent(new CustomEvent('openLunaMessages', { detail: { target } })), 100);
  };

  const inviteParty = () => runAction('party', async () => {
    const response = await base44.functions.invoke('partySystem', { action: 'invite_member', data: { inviteeId: friendId } });
    const body = response?.data ?? response ?? {};
    if (body?.error) throw new Error(body.error);
    window.dispatchEvent(new Event('openLunaParty'));
  }, `Party invite sent to ${profile.name}.`);

  const inviteDashboard = () => runAction('dashboard', async () => {
    const response = await base44.functions.invoke('socialActions', { action: 'send_dashboard_invite', data: { target_user_id: friendId } });
    const body = response?.data ?? response ?? {};
    if (body?.error) throw new Error(body.error);
  }, `Dashboard invite sent to ${profile.name}.`);

  const joinFriend = () => runAction('join', () => joinDashboard(normalizedFriend), `Joining ${profile.name}'s dashboard.`);

  const genres = (profile.genre_ranks || []).slice(0, 8);
  const achievements = (profile.achievements || []).slice(0, 6);
  const cards = (profile.cards || []).slice(0, 7);
  const games = (profile.games || []).slice(0, 7);
  const level = Number(profile.level || 1);
  const xpIntoLevel = Math.max(0, Number(profile.xp || 0) - Math.max(0, level - 1) * 1000);
  const xpPercent = Math.max(2, Math.min(100, xpIntoLevel / 1000 * 100));

  return (
    <AnimatePresence>
      <motion.div
        key="friend-console-profile"
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 24 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed bottom-[52px] left-[320px] right-0 top-[64px] z-[68] overflow-hidden text-white"
        style={{
          background: 'radial-gradient(circle at 23% 18%, rgba(48,89,118,.17), transparent 31%), linear-gradient(145deg, rgba(4,10,18,.985), rgba(5,12,21,.965) 58%, rgba(3,8,15,.985))',
          backdropFilter: 'blur(28px) saturate(125%)',
          WebkitBackdropFilter: 'blur(28px) saturate(125%)',
          borderLeft: '1px solid rgba(125,211,252,.08)',
        }}
        aria-label={`${profile.name} console profile`}
      >
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.009) 1px, transparent 1px)', backgroundSize: '42px 42px' }} />
        <div className="relative grid h-full min-h-0 grid-cols-[minmax(260px,29%)_minmax(0,1fr)]">
          <aside className="relative min-h-0 overflow-hidden border-r border-white/[0.065]">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-300/[0.035] via-transparent to-black/20" />
            <div className="relative flex h-full flex-col px-5 pb-5 pt-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[8px] font-black uppercase tracking-[.24em] text-cyan-100/35">Player Console</div>
                  <h1 className="mt-1 max-w-[240px] truncate text-2xl font-black tracking-tight text-white">{profile.name}</h1>
                  <div className="mt-1 flex items-center gap-2 text-[8px] uppercase tracking-[.12em]">
                    <span className={profile.online ? 'text-emerald-300/75' : 'text-white/28'}>● {profile.status || 'offline'}</span>
                    {profile.current_game && <><span className="text-white/15">·</span><span className="max-w-[150px] truncate text-white/42">{profile.current_game}</span></>}
                  </div>
                </div>
                <button type="button" onClick={onClose} aria-label="Close friend profile" className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/[0.08] bg-black/20 text-white/38 transition hover:bg-white/[0.06] hover:text-white"><X className="h-4 w-4" /></button>
              </div>

              <div className="relative mt-3 min-h-0 flex-1 overflow-hidden">
                <div className="absolute inset-x-0 bottom-0 top-0">
                  {profile.avatar ? (
                    <GenesisModelPreview config={profile.avatar} compact controls="none" idleOnly />
                  ) : profile.avatar_url ? (
                    <div className="grid h-full place-items-center"><img src={profile.avatar_url} alt={profile.name} className="max-h-[78%] max-w-[78%] object-contain drop-shadow-[0_20px_42px_rgba(0,0,0,.55)]" /></div>
                  ) : (
                    <div className="grid h-full place-items-center text-center text-white/20"><Shield className="h-12 w-12" /></div>
                  )}
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#050b13] to-transparent" />
              </div>

              <div className="relative z-10 -mt-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-cyan-200/25 bg-[#07111d]/88 shadow-[0_0_24px_rgba(103,232,249,.08)]">
                    <div className="text-center"><div className="text-[7px] font-black uppercase tracking-[.12em] text-cyan-100/38">Lv</div><div className="text-xl font-black">{level}</div></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-[7px] uppercase tracking-[.12em] text-white/28"><span>Avatar XP</span><span>{Number(profile.xp || 0).toLocaleString()}</span></div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.055]"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-200" style={{ width: `${xpPercent}%` }} /></div>
                    <div className="mt-2 text-[8px] text-white/34">Prestige <span className="font-black text-white/70">{Number(profile.prestige || 0).toLocaleString()}</span></div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" onClick={openMessage} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-cyan-200 text-[8px] font-black uppercase tracking-[.12em] text-slate-950 transition hover:bg-white"><MessageSquare className="h-3.5 w-3.5" />Message</button>
                  <button type="button" disabled={actionState.party === 'working'} onClick={inviteParty} className="flex h-10 items-center justify-center gap-2 rounded-lg border border-white/[0.10] bg-white/[0.035] text-[8px] font-black uppercase tracking-[.12em] text-white/65 transition hover:bg-white/[0.07] disabled:opacity-45"><Users className="h-3.5 w-3.5" />{actionState.party === 'working' ? 'Inviting…' : 'Invite Party'}</button>
                </div>

                <div className="relative mt-2">
                  <button type="button" onClick={() => setMoreOpen((value) => !value)} className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-white/[0.075] bg-black/20 text-[8px] font-bold uppercase tracking-[.12em] text-white/42 transition hover:bg-white/[0.04] hover:text-white/70"><MoreHorizontal className="h-3.5 w-3.5" />Additional Options<ChevronDown className={`h-3 w-3 transition ${moreOpen ? 'rotate-180' : ''}`} /></button>
                  {moreOpen && (
                    <div className="absolute bottom-11 left-0 right-0 z-40 overflow-hidden rounded-xl border border-white/[0.09] bg-[#070d16]/96 p-1.5 shadow-2xl backdrop-blur-2xl">
                      <button type="button" onClick={inviteDashboard} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[8px] font-bold uppercase tracking-[.1em] text-white/58 hover:bg-white/[0.06]"><Users className="h-3.5 w-3.5" />Invite to Dashboard</button>
                      <button type="button" onClick={joinFriend} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[8px] font-bold uppercase tracking-[.1em] text-white/58 hover:bg-white/[0.06]"><LogIn className="h-3.5 w-3.5" />Join Dashboard</button>
                      <button type="button" onClick={() => { setMoreOpen(false); setTradeOpen(true); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[8px] font-bold uppercase tracking-[.1em] text-white/58 hover:bg-white/[0.06]"><ArrowLeftRight className="h-3.5 w-3.5" />Trade Cards</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>

          <main className="min-h-0 overflow-y-auto px-5 py-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(140,190,210,.18) transparent' }}>
            {isLoading ? (
              <div className="grid h-full place-items-center text-[10px] font-bold uppercase tracking-[.2em] text-white/30">Loading console profile…</div>
            ) : error ? (
              <div className="grid h-full place-items-center">
                <div className="max-w-sm text-center"><p className="text-sm font-semibold text-white/70">Profile data could not load.</p><p className="mt-2 text-[10px] text-white/30">{error.message}</p><button onClick={() => refetch()} className="mt-4 rounded-lg bg-white/[0.06] px-4 py-2 text-[9px] font-bold uppercase tracking-wider text-cyan-100">Retry</button></div>
              </div>
            ) : (
              <div className="mx-auto max-w-[1180px] space-y-6">
                <div className="grid grid-cols-4 gap-4 border-y border-white/[0.065] py-4">
                  <ConsoleStat label="Achievements" value={profile.counts?.achievements ?? 0} />
                  <ConsoleStat label="Cards Collected" value={profile.counts?.cards ?? 0} />
                  <ConsoleStat label="Games" value={profile.counts?.games ?? 0} />
                  <ConsoleStat label="Achievement Score" value={Number(profile.achievement_points || 0).toLocaleString()} />
                </div>

                <Section title="Genre Ranks" subtitle="Current progression across the games they play" icon={Sparkles}>
                  {genres.length ? (
                    <div className="grid grid-cols-2 gap-x-5 gap-y-2 lg:grid-cols-4">
                      {genres.map((genre, index) => (
                        <div key={genre.id || genre.name || index} className="border-b border-white/[0.055] py-2">
                          <div className="flex items-center justify-between gap-2"><span className="truncate text-[9px] font-semibold text-white/64">{genre.name || titleCase(genre.id)}</span><span className="text-[9px] font-black text-cyan-100/75">Lv {genre.level || 1}</span></div>
                          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.045]"><div className="h-full rounded-full bg-cyan-200/45" style={{ width: `${Math.max(5, Math.min(100, Number(genre.xp || 0) % 1000 / 10))}%` }} /></div>
                        </div>
                      ))}
                    </div>
                  ) : <EmptyState text="No genre progression has been recorded yet." />}
                </Section>

                <Section title="Achievements" subtitle="Verified achievements unlocked on the account" icon={Trophy}>
                  {achievements.length ? (
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                      {achievements.map((achievement) => {
                        const tone = rarityTone[achievement.rarity] || rarityTone.Common;
                        const imageIcon = typeof achievement.icon === 'string' && (achievement.icon.startsWith('http') || achievement.icon.startsWith('/'));
                        return (
                          <div key={achievement.id} className={`flex min-h-[86px] items-center gap-3 border bg-white/[0.018] p-3 ${tone}`}>
                            <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-white/[0.045]">
                              {imageIcon ? <img src={achievement.icon} alt="" className="h-full w-full object-cover" /> : <Trophy className="h-4 w-4 opacity-55" />}
                            </div>
                            <div className="min-w-0 flex-1"><div className="truncate text-[10px] font-bold text-white/80">{achievement.title}</div><div className="mt-1 truncate text-[7px] uppercase tracking-[.12em] text-white/28">{achievement.game || achievement.category}</div><div className="mt-1.5 flex items-center justify-between gap-2 text-[7px]"><span className={tone.split(' ')[0]}>{achievement.rarity}</span><span className="text-white/25">{Number(achievement.points || 0)} pts</span></div></div>
                          </div>
                        );
                      })}
                    </div>
                  ) : <EmptyState text="No verified achievements have been unlocked yet." />}
                </Section>

                <Section title="Card Collection" subtitle="Recently collected achievement, ability, equipment and companion cards" icon={Layers3}>
                  {cards.length ? (
                    <div className="grid grid-cols-4 gap-2 xl:grid-cols-7">
                      {cards.map((card) => {
                        const tone = rarityTone[card.rarity] || rarityTone.Common;
                        return (
                          <div key={card.id} className={`relative aspect-[3/4] overflow-hidden border bg-white/[0.025] ${tone}`}>
                            {card.image && <img src={card.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-48" />}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#050a11] via-[#050a11]/56 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-2"><div className="line-clamp-2 text-[8px] font-bold leading-tight text-white/82">{card.name}</div><div className="mt-1 truncate text-[6px] uppercase tracking-[.1em] text-white/30">{card.game_name || titleCase(card.type)}</div><div className={`mt-1 text-[6px] font-bold uppercase tracking-wider ${tone.split(' ')[0]}`}>{card.rarity}</div></div>
                          </div>
                        );
                      })}
                    </div>
                  ) : <EmptyState text="No collectible cards are available on this profile yet." />}
                </Section>

                <Section title="Games" subtitle="Games connected to this player's collection and achievement history" icon={Gamepad2}>
                  {games.length ? (
                    <div className="grid grid-cols-4 gap-2 xl:grid-cols-7">
                      {games.map((game) => (
                        <div key={game.id} className="group min-w-0">
                          <div className="aspect-[16/10] overflow-hidden rounded-lg border border-white/[0.065] bg-white/[0.025]">{game.cover_image ? <img src={game.cover_image} alt="" className="h-full w-full object-cover opacity-70 transition group-hover:opacity-90" /> : <div className="grid h-full place-items-center"><Gamepad2 className="h-5 w-5 text-white/16" /></div>}</div>
                          <div className="mt-2 truncate text-[8px] font-bold text-white/62">{game.title}</div><div className="mt-0.5 truncate text-[6px] uppercase tracking-[.11em] text-white/25">{titleCase(game.genre)}</div>
                        </div>
                      ))}
                    </div>
                  ) : <EmptyState text="No games are connected to this player's public progression yet." />}
                </Section>
              </div>
            )}
          </main>
        </div>

        {tradeOpen && <FriendTradePanel friend={normalizedFriend} currentUser={user} onClose={() => setTradeOpen(false)} />}
      </motion.div>
    </AnimatePresence>
  );
}
