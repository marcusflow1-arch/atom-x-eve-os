import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, User, Camera, Edit, Save, Trophy, Zap, Users, Crown, Flame, Target,
  TrendingUp, Clock, Star, Gamepad2, Layers, Shield, Activity, Image,
  BarChart3, Info, Play, MessageSquare, Heart, Sparkles, Sword, MapPin,
  CalendarDays, Quote, CheckCircle2, ExternalLink, Award, Mic2, Handshake,
  Swords, Compass
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../auth/AuthContext';
import { base44 } from '@/api/base44Client';

const TABS = [
  { id: 'overview', label: 'Overview', icon: User, tone: 'from-cyan-500/30 via-sky-500/10 to-transparent' },
  { id: 'achievements', label: 'Achievements', icon: Trophy, tone: 'from-amber-500/30 via-yellow-500/10 to-transparent' },
  { id: 'games', label: 'Games', icon: Gamepad2, tone: 'from-blue-500/30 via-indigo-500/10 to-transparent' },
  { id: 'cards', label: 'Cards', icon: Layers, tone: 'from-violet-500/30 via-purple-500/10 to-transparent' },
  { id: 'activity', label: 'Activity', icon: Activity, tone: 'from-emerald-500/30 via-teal-500/10 to-transparent' },
  { id: 'media', label: 'Clips & Media', icon: Image, tone: 'from-rose-500/30 via-pink-500/10 to-transparent' },
  { id: 'stats', label: 'Stats', icon: BarChart3, tone: 'from-orange-500/30 via-red-500/10 to-transparent' },
  { id: 'about', label: 'About', icon: Info, tone: 'from-slate-400/30 via-cyan-500/10 to-transparent' }
];

const Glass = ({ children, className = '' }) => (
  <div className={`relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/50 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,.28)] ${className}`}>
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-cyan-500/[0.03]" />
    <div className="relative z-10">{children}</div>
  </div>
);

const Metric = ({ icon: Icon, label, value, detail }) => (
  <Glass className="p-4">
    <div className="flex items-center gap-3">
      <div className="rounded-2xl bg-white/[0.06] p-2.5 text-cyan-200"><Icon className="h-4 w-4" /></div>
      <div className="min-w-0">
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">{label}</div>
        <div className="mt-1 text-xl font-black text-white">{value}</div>
        {detail && <div className="mt-0.5 text-[11px] text-white/35">{detail}</div>}
      </div>
    </div>
  </Glass>
);

const SectionTitle = ({ eyebrow, title, detail }) => (
  <div>
    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300/70">{eyebrow}</div>
    <h2 className="mt-1 text-2xl font-black tracking-tight text-white">{title}</h2>
    {detail && <p className="mt-1 max-w-2xl text-sm text-white/45">{detail}</p>}
  </div>
);

const Progress = ({ value = 0 }) => (
  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
    <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);

const PlaceholderBadge = ({ children }) => (
  <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/55">
    {children}
  </span>
);

const PageFrame = ({ activeTab, children }) => {
  const tab = TABS.find(t => t.id === activeTab) || TABS[0];
  return (
    <motion.div key={activeTab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .28 }} className="relative min-h-[460px]">
      <div className={`pointer-events-none absolute -left-20 -top-24 h-80 w-80 rounded-full bg-gradient-to-br ${tab.tone} blur-3xl`} />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

export default function UserProfileOverlay({ isOpen, onClose, profileUser, readOnly = false }) {
  const { user: authUser, avatar: authAvatar, updateUserData, refreshUserData } = useAuth();
  const displayUser = profileUser || authUser;
  const displayAvatar = profileUser ? (profileUser.avatar_data || {}) : authAvatar;
  const isSelf = !readOnly && (!profileUser || profileUser.id === authUser?.id);

  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    avatar_url: '',
    streaming_profile: { twitch_username: '', youtube_channel: '', twitter_handle: '', stream_bio: '' },
    social_profile: { tagline: '', favorite_games: [], playstyle: '' }
  });

  useEffect(() => {
    if (!displayUser) return;
    setFormData({
      username: displayUser.username || displayUser.full_name || '',
      bio: displayUser.bio || '',
      avatar_url: displayUser.avatar_url || '',
      streaming_profile: displayUser.streaming_profile || { twitch_username: '', youtube_channel: '', twitter_handle: '', stream_bio: '' },
      social_profile: displayUser.social_profile || { tagline: '', favorite_games: [], playstyle: '' }
    });
  }, [displayUser]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUserData(formData);
      await refreshUserData();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, avatar_url: file_url }));
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  if (!isOpen) return null;

  const stats = {
    score: displayUser?.gamer_score || displayUser?.score || 0,
    achievements: displayUser?.unlocked_achievements?.length || displayUser?.achievements || 0,
    playtime: displayUser?.total_playtime || 0,
    level: displayUser?.level || displayAvatar?.level || 1,
    friends: displayUser?.friend_count || displayUser?.friends?.length || displayUser?.follower_count || 0,
    games: displayUser?.purchased_items?.length || displayUser?.games?.length || 0,
    clans: displayUser?.clans?.length || displayUser?.clan_count || 0,
    cardPower: displayUser?.card_power || displayAvatar?.card_power || 0
  };

  const achievementTotal = displayUser?.achievement_total || Math.max(stats.achievements, 100);
  const achievementPct = achievementTotal ? Math.min(100, Math.round((stats.achievements / achievementTotal) * 100)) : 0;
  const name = formData.username || 'Player';
  const favoriteGames = formData.social_profile?.favorite_games?.length
    ? formData.social_profile.favorite_games
    : ['Neon Legends', 'Smite', 'Elder Realms', 'Apex Frontline'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-[#02060d]/95 backdrop-blur-xl">
          <motion.div initial={{ scale: .985, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: .99, opacity: 0 }} className="relative h-full w-full overflow-y-auto text-white">
            <div className="pointer-events-none fixed inset-0">
              <div className="absolute -right-32 -top-40 h-[620px] w-[620px] rounded-full bg-cyan-500/10 blur-[140px]" />
              <div className="absolute -bottom-48 left-[15%] h-[650px] w-[650px] rounded-full bg-indigo-600/10 blur-[160px]" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.015)_1px,transparent_1px)] bg-[size:72px_72px]" />
            </div>

            <div className="relative mx-auto min-h-full w-full max-w-[1660px]">
              <header className="relative min-h-[390px] overflow-hidden border-x border-white/5">
                <img
                  src={displayUser?.banner_url || 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1800&q=85'}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-55"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#02060d]/25 via-[#02060d]/50 to-[#02060d]" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#02060d]/80 via-transparent to-[#02060d]/65" />

                <div className="absolute right-6 top-6 z-20 flex gap-2">
                  {isSelf && (
                    <Button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="rounded-2xl border border-white/10 bg-black/35 text-white backdrop-blur-xl hover:bg-white/10">
                      {isEditing ? <Save className="mr-2 h-4 w-4" /> : <Edit className="mr-2 h-4 w-4" />}
                      {isEditing ? (isSaving ? 'Saving...' : 'Save') : 'Edit Profile'}
                    </Button>
                  )}
                  <Button size="icon" onClick={onClose} className="rounded-2xl border border-white/10 bg-black/35 text-white backdrop-blur-xl hover:bg-white/10">
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="relative z-10 flex min-h-[390px] items-end px-6 pb-9 pt-24 md:px-10 xl:px-14">
                  <div className="flex w-full flex-col gap-7 lg:flex-row lg:items-end">
                    <div className="relative shrink-0">
                      <div className="h-36 w-36 overflow-hidden rounded-[34px] border border-white/20 bg-slate-900/90 p-1 shadow-[0_25px_70px_rgba(0,0,0,.55)] md:h-44 md:w-44">
                        <div className="relative h-full w-full overflow-hidden rounded-[30px]">
                          {formData.avatar_url ? (
                            <img src={formData.avatar_url} alt={name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-700"><User className="h-16 w-16" /></div>
                          )}
                          {isEditing && (
                            <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/55 opacity-0 transition-opacity hover:opacity-100">
                              <Camera className="h-7 w-7" />
                              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                            </label>
                          )}
                        </div>
                      </div>
                      <div className="absolute -bottom-3 -right-3 flex items-center gap-1.5 rounded-full border border-cyan-300/20 bg-[#03101c] px-4 py-2 shadow-xl">
                        <Zap className="h-3.5 w-3.5 fill-cyan-300 text-cyan-300" />
                        <span className="text-xs font-black">LVL {stats.level}</span>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-3">
                        {isEditing ? (
                          <Input value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="h-auto max-w-xl border-white/15 bg-black/30 py-2 text-4xl font-black text-white" />
                        ) : (
                          <h1 className="truncate text-4xl font-black tracking-[-0.04em] md:text-6xl">{name}</h1>
                        )}
                        <Badge className="border border-cyan-300/15 bg-cyan-400/10 px-3 py-1 text-cyan-200 hover:bg-cyan-400/10">ATOM PLAYER</Badge>
                      </div>
                      {isEditing ? (
                        <Textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} className="max-w-2xl border-white/15 bg-black/30 text-white/75" placeholder="Write a bio..." />
                      ) : (
                        <p className="max-w-2xl text-base leading-relaxed text-white/55 md:text-lg">{formData.bio || formData.social_profile?.tagline || 'No profile message yet.'}</p>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/45">
                        <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5">Online</span>
                        <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5">Member since {displayUser?.member_since || displayUser?.created_date?.slice?.(0, 4) || '2026'}</span>
                        <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5">{formData.social_profile?.playstyle || 'Adaptive player'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 md:grid-cols-5 lg:max-w-[640px]">
                      <Metric icon={Users} label="Friends" value={stats.friends} />
                      <Metric icon={Gamepad2} label="Games" value={stats.games} />
                      <Metric icon={Trophy} label="Achievements" value={stats.achievements} />
                      <Metric icon={Crown} label="Clans" value={stats.clans} />
                      <Metric icon={Layers} label="Card Power" value={stats.cardPower.toLocaleString()} />
                    </div>
                  </div>
                </div>
              </header>

              <div className="sticky top-0 z-40 border-y border-white/[0.07] bg-[#02060d]/85 px-4 backdrop-blur-2xl md:px-8">
                <div className="no-scrollbar flex overflow-x-auto">
                  {TABS.map(({ id, label, icon: Icon }) => {
                    const active = activeTab === id;
                    return (
                      <button key={id} onClick={() => setActiveTab(id)} className={`relative flex shrink-0 items-center gap-2 px-4 py-5 text-xs font-black uppercase tracking-[0.12em] transition-colors md:px-5 ${active ? 'text-white' : 'text-white/35 hover:text-white/70'}`}>
                        <Icon className={`h-4 w-4 ${active ? 'text-cyan-300' : ''}`} />
                        {label}
                        {active && <motion.div layoutId="profile-tab" className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,.9)]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <main className="relative px-5 py-9 md:px-10 xl:px-14">
                <PageFrame activeTab={activeTab}>
                  {activeTab === 'overview' && (
                    <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
                      <div className="space-y-6">
                        <SectionTitle eyebrow="Player dossier" title="Overview" detail="A single-page read on what this player is doing now, what they are known for, and what they have earned." />
                        <Glass className="min-h-[300px] p-6 md:p-8">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300/70">Current focus</div>
                              <h3 className="mt-2 text-3xl font-black">Neon Legends</h3>
                              <p className="mt-2 text-sm text-white/45">Ranked progression · Achievement hunt · Card farming</p>
                            </div>
                            <div className="rounded-3xl bg-cyan-400/10 p-5 text-cyan-200"><Gamepad2 className="h-9 w-9" /></div>
                          </div>
                          <div className="mt-10 grid gap-4 md:grid-cols-3">
                            <Metric icon={Clock} label="Playtime" value={`${stats.playtime}h`} />
                            <Metric icon={Flame} label="Gamer Score" value={stats.score.toLocaleString()} />
                            <Metric icon={TrendingUp} label="Achievement Rate" value={`${achievementPct}%`} />
                          </div>
                        </Glass>
                        <div className="grid gap-4 md:grid-cols-2">
                          <Glass className="p-6">
                            <div className="flex items-center gap-2 text-sm font-black"><Star className="h-4 w-4 text-amber-300" /> Featured accomplishment</div>
                            <div className="mt-5 text-2xl font-black">Apex Predator</div>
                            <div className="mt-1 text-sm text-white/40">Rare achievement · top 0.8% unlock rate</div>
                          </Glass>
                          <Glass className="p-6">
                            <div className="flex items-center gap-2 text-sm font-black"><Layers className="h-4 w-4 text-violet-300" /> Featured card</div>
                            <div className="mt-5 text-2xl font-black">Ascendant Vanguard</div>
                            <div className="mt-1 text-sm text-white/40">Level 72 · Stage IV · 118% enchant</div>
                          </Glass>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <SectionTitle eyebrow="Pulse" title="Recent player activity" />
                        {[['Achievement unlocked','Master of the Arena','2h ago'],['Card upgraded','Vanguard reached Stage IV','5h ago'],['Ranked session','Won 7 of 10 matches','Yesterday'],['Media posted','New highlight clip','2d ago']].map(([kind,title,time], i) => (
                          <Glass key={i} className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="rounded-2xl bg-white/[0.05] p-3 text-cyan-200"><Activity className="h-4 w-4" /></div>
                              <div className="min-w-0 flex-1">
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">{kind}</div>
                                <div className="mt-1 truncate font-bold">{title}</div>
                              </div>
                              <div className="text-xs text-white/30">{time}</div>
                            </div>
                          </Glass>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'achievements' && (
                    <div className="space-y-7">
                      <SectionTitle eyebrow="Achievement record" title="Milestones, rarity and completion" detail="This page is dedicated to the player’s full achievement identity rather than only a recent-unlocks list." />
                      <div className="grid gap-4 md:grid-cols-4">
                        <Metric icon={Trophy} label="Unlocked" value={stats.achievements} />
                        <Metric icon={Target} label="Completion" value={`${achievementPct}%`} />
                        <Metric icon={Star} label="Ultra Rare" value={displayUser?.rare_achievements || 12} />
                        <Metric icon={Layers} label="Cards Earned" value={displayUser?.cards_from_achievements || stats.achievements} />
                      </div>
                      <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
                        <Glass className="p-6">
                          <div className="flex items-center justify-between"><h3 className="text-lg font-black">Game completion</h3><PlaceholderBadge>Live profile data</PlaceholderBadge></div>
                          <div className="mt-6 space-y-5">
                            {favoriteGames.map((game, i) => {
                              const pct = [92, 74, 61, 48][i % 4];
                              return <div key={game}><div className="mb-2 flex justify-between text-sm"><span className="font-bold">{game}</span><span className="text-white/45">{pct}%</span></div><Progress value={pct} /></div>;
                            })}
                          </div>
                        </Glass>
                        <Glass className="p-6">
                          <div className="text-lg font-black">Rarity spectrum</div>
                          <div className="mt-6 grid grid-cols-2 gap-3">
                            {['Common','Unique','Rare','Epic','Legendary','Mystical','Ascendant'].map((r,i)=><div key={r} className="rounded-2xl border border-white/8 bg-white/[0.035] p-4"><div className="text-xs text-white/40">{r}</div><div className="mt-1 text-2xl font-black">{[86,34,22,14,8,4,2][i]}</div></div>)}
                          </div>
                        </Glass>
                      </div>
                    </div>
                  )}

                  {activeTab === 'games' && (
                    <div className="space-y-7">
                      <SectionTitle eyebrow="Library identity" title="Games" detail="The player’s played library, progress, rank, current focus and completion history." />
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {favoriteGames.map((game, i) => (
                          <Glass key={game} className="group min-h-[310px] p-5">
                            <div className="flex h-full flex-col justify-between">
                              <div className={`h-36 rounded-3xl bg-gradient-to-br ${['from-cyan-500/25 to-blue-900/20','from-violet-500/25 to-fuchsia-900/20','from-emerald-500/25 to-cyan-900/20','from-amber-500/25 to-red-900/20'][i % 4]} p-5`}>
                                <Gamepad2 className="h-8 w-8 text-white/70" />
                              </div>
                              <div className="mt-6">
                                <h3 className="text-xl font-black">{game}</h3>
                                <div className="mt-2 flex justify-between text-xs text-white/40"><span>{[168,92,61,44][i%4]} hours</span><span>{[92,74,61,48][i%4]}%</span></div>
                                <div className="mt-3"><Progress value={[92,74,61,48][i%4]} /></div>
                                <div className="mt-4 flex gap-2"><PlaceholderBadge>Level {[58,41,36,24][i%4]}</PlaceholderBadge><PlaceholderBadge>{i < 2 ? 'Ranked' : 'Story'}</PlaceholderBadge></div>
                              </div>
                            </div>
                          </Glass>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'cards' && (
                    <div className="space-y-7">
                      <SectionTitle eyebrow="Achievement card identity" title="Cards" detail="A profile-facing view of the player’s strongest cards, equipped set, rarity, stages and collection power." />
                      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
                        <Glass className="p-6">
                          <div className="text-xs font-black uppercase tracking-[.2em] text-violet-300/70">Featured card</div>
                          <div className="mt-5 flex min-h-[360px] flex-col justify-between rounded-[30px] border border-violet-300/15 bg-gradient-to-br from-violet-500/20 via-slate-950 to-cyan-500/10 p-7">
                            <div className="flex justify-between"><Crown className="h-8 w-8 text-violet-200" /><Badge className="bg-violet-500/15 text-violet-200">ASCENDANT</Badge></div>
                            <div>
                              <div className="text-4xl font-black">Vanguard</div>
                              <div className="mt-2 text-white/45">Stage IV · LVL 72 · +118% Enchant</div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <Metric icon={Sword} label="Power" value="9,840" />
                              <Metric icon={Shield} label="Guard" value="7,410" />
                              <Metric icon={Sparkles} label="Perks" value="6/8" />
                            </div>
                          </div>
                        </Glass>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            {['Equipped','Legendary+','Tradeable','Total Power'].map((label,i)=><Metric key={label} icon={[Layers,Crown,TrendingUp,Zap][i]} label={label} value={['8','27','14',stats.cardPower.toLocaleString()][i]} />)}
                          </div>
                          <Glass className="p-6">
                            <div className="flex items-center justify-between"><h3 className="font-black">Equipped loadout</h3><PlaceholderBadge>Open card for Record / Forge / Skill Tree</PlaceholderBadge></div>
                            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                              {Array.from({length:8}).map((_,i)=><div key={i} className="aspect-[3/4] rounded-2xl border border-white/10 bg-gradient-to-br from-white/[.08] to-transparent p-4"><div className="text-[10px] font-black text-white/35">SLOT {i+1}</div><Layers className="mx-auto mt-10 h-7 w-7 text-violet-200/70" /><div className="mt-8 text-center text-xs font-bold">Card {i+1}</div></div>)}
                            </div>
                          </Glass>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'activity' && (
                    <div className="space-y-7">
                      <SectionTitle eyebrow="Player timeline" title="Activity" detail="Chronological game, achievement, social, card, media and progression events." />
                      <div className="mx-auto max-w-5xl space-y-3">
                        {[['Achievement','Unlocked “Apex Predator”','Neon Legends','2h ago'],['Card','Over-enchanted Vanguard to 118%','Card Forge','5h ago'],['Game','Finished a 3.2 hour ranked session','Smite','Yesterday'],['Social','Joined a five-player party','Friends','Yesterday'],['Media','Published “Final push” highlight','Clips','2d ago'],['Level','Reached account level 88','Atom XE','3d ago']].map((a,i)=>(
                          <Glass key={i} className="p-5">
                            <div className="flex gap-4">
                              <div className="mt-0.5 rounded-2xl bg-emerald-400/10 p-3 text-emerald-200"><Activity className="h-4 w-4" /></div>
                              <div className="flex-1"><div className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-300/60">{a[0]} · {a[2]}</div><div className="mt-1 text-base font-bold">{a[1]}</div></div>
                              <span className="text-xs text-white/30">{a[3]}</span>
                            </div>
                          </Glass>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'media' && (
                    <div className="space-y-7">
                      <SectionTitle eyebrow="Capture gallery" title="Clips & Media" detail="This page is intentionally visually distinct so media can later be replaced with the final screenshot-driven design without confusing it with the other subpages." />
                      <Glass className="overflow-hidden">
                        <div className="grid min-h-[360px] lg:grid-cols-[1.45fr_.55fr]">
                          <div className="relative flex items-center justify-center bg-gradient-to-br from-rose-500/20 via-fuchsia-950/40 to-slate-950 p-8">
                            <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_30%_40%,rgba(255,255,255,.2),transparent_28%),radial-gradient(circle_at_70%_60%,rgba(236,72,153,.28),transparent_34%)]" />
                            <button className="relative z-10 rounded-full border border-white/15 bg-white/10 p-7 backdrop-blur-xl"><Play className="h-9 w-9 fill-white" /></button>
                          </div>
                          <div className="p-7"><PlaceholderBadge>Featured Clip</PlaceholderBadge><h3 className="mt-5 text-3xl font-black">Final push</h3><p className="mt-2 text-sm text-white/40">Ranked comeback · 01:18</p><div className="mt-8 flex gap-5 text-sm text-white/45"><span className="flex items-center gap-2"><Heart className="h-4 w-4" /> 482</span><span className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> 63</span></div></div>
                        </div>
                      </Glass>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {Array.from({length:8}).map((_,i)=><Glass key={i} className="aspect-video p-4"><div className="flex h-full items-end justify-between rounded-2xl bg-gradient-to-br from-rose-500/10 to-cyan-500/5 p-4"><div><div className="text-xs font-black">Clip {i+1}</div><div className="text-[10px] text-white/35">00:{22+i*4}</div></div><Play className="h-4 w-4" /></div></Glass>)}
                      </div>
                    </div>
                  )}

                  {activeTab === 'stats' && (
                    <div className="space-y-7">
                      <SectionTitle eyebrow="Deep profile analytics" title="Stats" detail="Long-term account trends, performance, genre mix, achievement efficiency and card progression." />
                      <div className="grid gap-4 md:grid-cols-4">
                        <Metric icon={Clock} label="Playtime" value={`${stats.playtime}h`} />
                        <Metric icon={Target} label="Win Rate" value={displayUser?.win_rate ? `${displayUser.win_rate}%` : '58%'} />
                        <Metric icon={Trophy} label="Achievement Rate" value={`${achievementPct}%`} />
                        <Metric icon={Zap} label="Card Power" value={stats.cardPower.toLocaleString()} />
                      </div>
                      <div className="grid gap-6 lg:grid-cols-2">
                        <Glass className="p-6">
                          <h3 className="font-black">Performance trend</h3>
                          <div className="mt-8 flex h-56 items-end gap-2">
                            {[34,48,42,62,58,72,68,82,76,91,84,96].map((v,i)=><div key={i} className="flex-1 rounded-t-xl bg-gradient-to-t from-cyan-500/30 to-cyan-300/80" style={{height:`${v}%`}} />)}
                          </div>
                          <div className="mt-3 flex justify-between text-[10px] uppercase tracking-widest text-white/25"><span>Earlier</span><span>Recent</span></div>
                        </Glass>
                        <Glass className="p-6">
                          <h3 className="font-black">Genre distribution</h3>
                          <div className="mt-7 space-y-5">
                            {[['Action / MOBA',38],['RPG',26],['Shooter',18],['Fighting',10],['Other',8]].map(([label,v])=><div key={label}><div className="mb-2 flex justify-between text-sm"><span>{label}</span><span className="text-white/35">{v}%</span></div><Progress value={v*2.3} /></div>)}
                          </div>
                        </Glass>
                      </div>
                    </div>
                  )}

                  {activeTab === 'about' && (
                    <div className="space-y-4">
                      <div className="grid gap-4 xl:grid-cols-[1.08fr_.82fr_1.28fr]">
                        <Glass className="p-5">
                          <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-sm font-black">Biography</h3>
                            {isSelf && (
                              <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-bold text-white/50 hover:text-white">
                                <Edit className="h-3 w-3" /> Edit
                              </button>
                            )}
                          </div>
                          <p className="text-[13px] leading-6 text-white/60">
                            {formData.bio || `Lifelong gamer, night owl, and racing enthusiast. I play to explore new worlds, meet great people, and push my limits. Whether it's high-octane races or epic co-op adventures, I'm always up for the next challenge.`}
                          </p>
                          <div className="mt-5 rounded-2xl border border-cyan-300/10 bg-cyan-400/[0.055] p-4">
                            <div className="flex gap-3">
                              <Quote className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                              <div>
                                <div className="italic text-white/75">“{formData.social_profile?.tagline || 'Different games. Same drive.'}”</div>
                                <div className="mt-2 text-right text-[10px] text-white/35">— {name}</div>
                              </div>
                            </div>
                          </div>
                        </Glass>

                        <Glass className="p-5">
                          <h3 className="mb-4 text-sm font-black">Quick Info</h3>
                          <div className="space-y-2">
                            {[
                              [Gamepad2, 'Gamer Tagline', formData.social_profile?.tagline || 'Neon Racer'],
                              [CalendarDays, 'Member Since', displayUser?.member_since || displayUser?.created_date?.slice?.(0,10) || 'March 15, 2024'],
                              [MapPin, 'Location', displayUser?.location || 'Detroit, MI, USA'],
                              [Gamepad2, 'Preferred Genres', displayUser?.preferred_genres?.join?.(', ') || 'RPG, Racing, Action, Strategy'],
                              [Star, 'Favorite Franchises', displayUser?.favorite_franchises?.join?.(', ') || 'Elden Ring, Forza, Cyberpunk, Halo']
                            ].map(([Icon, label, value]) => (
                              <div key={label} className="grid grid-cols-[28px_110px_1fr] items-center gap-2 rounded-xl border border-white/[0.05] bg-white/[0.035] px-3 py-2.5">
                                <Icon className="h-4 w-4 text-cyan-300" />
                                <span className="text-[10px] font-bold text-white/40">{label}</span>
                                <span className="min-w-0 truncate text-[10px] font-semibold text-white/75">{value}</span>
                              </div>
                            ))}
                          </div>
                        </Glass>

                        <Glass className="p-5">
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-black">Personality & Playstyle</h3>
                            {isSelf && <Edit className="h-3.5 w-3.5 text-white/30" />}
                          </div>
                          <div className="grid gap-4 md:grid-cols-[1fr_.9fr]">
                            <div className="relative min-h-[210px]">
                              <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-cyan-300/20 bg-cyan-400/[0.035]" />
                              <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-cyan-300/20" />
                              <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-cyan-300/20 bg-cyan-400/15 shadow-[0_0_35px_rgba(34,211,238,.15)]" />
                              <div className="absolute inset-x-0 top-0 text-center text-[10px] font-black text-white/65"><Crown className="mx-auto mb-1 h-4 w-4 text-cyan-300" />Competitive</div>
                              <div className="absolute left-0 top-[42%] text-center text-[10px] font-black text-white/65"><Sparkles className="mx-auto mb-1 h-4 w-4 text-violet-300" />Strategic</div>
                              <div className="absolute right-0 top-[42%] text-center text-[10px] font-black text-white/65"><Users className="mx-auto mb-1 h-4 w-4 text-sky-300" />Team Player</div>
                              <div className="absolute bottom-0 left-3 text-center text-[10px] font-black text-white/65"><Compass className="mx-auto mb-1 h-4 w-4 text-emerald-300" />Explorer</div>
                              <div className="absolute bottom-0 right-3 text-center text-[10px] font-black text-white/65"><Activity className="mx-auto mb-1 h-4 w-4 text-fuchsia-300" />Chill</div>
                            </div>
                            <div className="flex flex-col justify-between">
                              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.035] p-4">
                                <Quote className="mb-2 h-4 w-4 text-white/30" />
                                <p className="text-[11px] italic leading-5 text-white/60">Competitive when it matters, relaxed when it counts. Always down for good people and great games.</p>
                                <div className="mt-2 text-right text-[10px] text-white/30">— {name}</div>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {['Friendly','Focused','Helpful','Team Player','Achievement Hunter','Night Owl'].map(tag => (
                                  <span key={tag} className="rounded-full border border-cyan-300/10 bg-cyan-400/[0.055] px-2 py-1 text-[9px] font-bold text-cyan-100/70">{tag}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </Glass>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-[1.08fr_.82fr_1.28fr]">
                        <Glass className="p-5">
                          <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-sm font-black">Play Schedule</h3>
                            {isSelf && <Edit className="h-3.5 w-3.5 text-white/30" />}
                          </div>
                          <div className="grid grid-cols-7 gap-2">
                            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day,i) => (
                              <div key={day} className="text-center">
                                <div className="text-[9px] font-bold text-white/35">{day}</div>
                                <div className="mx-auto mt-2 flex h-14 w-4 items-end overflow-hidden rounded-full bg-white/[0.05] p-[2px]">
                                  <div className="w-full rounded-full bg-cyan-400" style={{height:`${[45,65,55,70,85,62,72][i]}%`}} />
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 flex flex-wrap gap-4 text-[9px] text-white/35">
                            <span>● Light (1–2h)</span><span>● Moderate (3–5h)</span><span>● Heavy (5h+)</span>
                          </div>
                          <div className="mt-3 text-[10px] text-white/45">Most active: Evenings (7PM – 1AM)</div>
                        </Glass>

                        <Glass className="p-5">
                          <h3 className="mb-4 text-sm font-black">Multiplayer Preferences</h3>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              [Handshake,'Co-op','Love it','border-emerald-300/25 bg-emerald-400/[0.06] text-emerald-200'],
                              [Swords,'Competitive','Sometimes','border-rose-300/20 bg-rose-400/[0.05] text-rose-200'],
                              [Users,'Casual','Always','border-cyan-300/20 bg-cyan-400/[0.05] text-cyan-200'],
                              [Mic2,'Voice Chat','Usually','border-violet-300/20 bg-violet-400/[0.05] text-violet-200']
                            ].map(([Icon,label,value,tone]) => (
                              <div key={label} className={`rounded-2xl border p-3 text-center ${tone}`}>
                                <Icon className="mx-auto h-5 w-5" />
                                <div className="mt-2 text-[10px] font-black">{label}</div>
                                <div className="mt-1 text-[9px] opacity-60">{value}</div>
                              </div>
                            ))}
                          </div>
                        </Glass>

                        <Glass className="p-5">
                          <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-black">Clan Affiliations</h3><button className="text-[10px] font-bold text-cyan-300/70">View All</button></div>
                          <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.035] p-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 text-xl font-black text-cyan-200">AXE</div>
                            <div className="min-w-0 flex-1">
                              <div className="font-black">Atom X Eve Official</div>
                              <div className="mt-1 text-[10px] text-white/40">Member · Play. Connect. Belong.</div>
                              <div className="mt-2 flex gap-1.5"><PlaceholderBadge>Casual</PlaceholderBadge><PlaceholderBadge>Social</PlaceholderBadge><PlaceholderBadge>All Games</PlaceholderBadge></div>
                            </div>
                            <div className="text-right text-[10px] text-white/35">1.2K Members</div>
                          </div>
                        </Glass>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_.78fr_.9fr_.62fr]">
                        <Glass className="p-5">
                          <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-black">Badges</h3><button className="text-[10px] font-bold text-cyan-300/70">View All</button></div>
                          <div className="grid grid-cols-5 gap-3">
                            {[
                              [Crown,'Early Adopter'],[Target,'Racing Fanatic'],[Handshake,'Co-op Legend'],[Trophy,'100% Club'],[Users,'Community']
                            ].map(([Icon,label],i) => (
                              <div key={label} className="text-center">
                                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] shadow-[0_0_20px_rgba(34,211,238,.08)]"><Icon className="h-5 w-5 text-cyan-200" /></div>
                                <div className="mt-2 text-[8px] font-bold text-white/55">{label}</div>
                              </div>
                            ))}
                          </div>
                        </Glass>

                        <Glass className="p-5">
                          <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-black">Current Goals</h3>{isSelf && <Edit className="h-3.5 w-3.5 text-white/30" />}</div>
                          <div className="space-y-3">
                            {[
                              ['Complete Elden Ring DLC','In Progress',false],
                              ['Reach Diamond in Ranked Racing','In Progress',false],
                              ['Build a full legendary card deck','Complete',true],
                              ['Grow my clip collection to 100','In Progress',false]
                            ].map(([goal,status,done]) => (
                              <div key={goal} className="flex items-center gap-2 text-[10px]">
                                {done ? <CheckCircle2 className="h-3.5 w-3.5 text-cyan-300" /> : <div className="h-3.5 w-3.5 rounded-full border border-cyan-300/50" />}
                                <span className="min-w-0 flex-1 truncate text-white/60">{goal}</span>
                                <span className="text-[8px] text-white/25">{status}</span>
                              </div>
                            ))}
                          </div>
                        </Glass>

                        <Glass className="p-5">
                          <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-black">Personal Highlights</h3>{isSelf && <Edit className="h-3.5 w-3.5 text-white/30" />}</div>
                          <div className="space-y-2.5">
                            {[
                              [Trophy,'First Platinum Trophy','Elden Ring · Apr 2024'],
                              [Award,'Top 1% in Neon Racer Time Trials','Feb 2025'],
                              [Crown,'Organized 24-player community event','Atom X Eve · Jan 2025'],
                              [Heart,'Met some of my best friends here','Ongoing']
                            ].map(([Icon,title,meta]) => (
                              <div key={title} className="flex items-center gap-2">
                                <Icon className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                                <div className="min-w-0 flex-1"><div className="truncate text-[10px] font-semibold text-white/70">{title}</div><div className="text-[8px] text-white/25">{meta}</div></div>
                              </div>
                            ))}
                          </div>
                        </Glass>

                        <Glass className="p-5">
                          <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-black">Social Links</h3>{isSelf && <Edit className="h-3.5 w-3.5 text-white/30" />}</div>
                          <div className="space-y-2.5">
                            {[
                              ['Twitch', formData.streaming_profile?.twitch_username || `${name.toLowerCase().replace(/\s+/g,'') }0427`],
                              ['YouTube', formData.streaming_profile?.youtube_channel || `${name}Plays`],
                              ['X', formData.streaming_profile?.twitter_handle || `@${name.toLowerCase().replace(/\s+/g,'') }X`],
                              ['Discord', displayUser?.discord_username || name]
                            ].map(([platform,handle]) => (
                              <div key={platform} className="flex items-center gap-2 text-[10px]">
                                <div className="w-14 text-white/35">{platform}</div>
                                <div className="min-w-0 flex-1 truncate font-semibold text-white/65">{handle}</div>
                                <ExternalLink className="h-3 w-3 text-white/25" />
                              </div>
                            ))}
                          </div>
                        </Glass>
                      </div>
                    </div>
                  )}
                </PageFrame>
              </main>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
