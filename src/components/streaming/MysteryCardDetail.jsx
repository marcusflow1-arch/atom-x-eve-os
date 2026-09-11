import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity, ArrowLeft, Check, ChevronRight, Crown, Flame, Gauge, Gem, Hammer,
  History, Layers, Lock, Merge, Package, RefreshCcw, Shield, Sparkles, Star,
  Target, TrendingUp, WandSparkles, Zap
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const tabs = [
  { id: 'record', label: 'Record', icon: History, hint: 'Live card identity, stats and history' },
  { id: 'forge', label: 'Forge', icon: Hammer, hint: 'Level, stage, enhance, enchant and ascend' },
  { id: 'skills', label: 'Skills', icon: Layers, hint: 'Skill tree and active perks' }
];

const statLabels = { attack: 'Attack', defense: 'Defense', magic: 'Spirit', vitality: 'Vitality', speed: 'Dexterity' };
const rarityTone = {
  Common: 'text-slate-300 border-slate-400/20', Uncommon: 'text-emerald-300 border-emerald-400/25', Rare: 'text-cyan-300 border-cyan-400/25',
  Epic: 'text-violet-300 border-violet-400/25', Legendary: 'text-amber-300 border-amber-400/25', Mythic: 'text-rose-300 border-rose-400/25',
  Mythical: 'text-rose-300 border-rose-400/25', Unique: 'text-fuchsia-300 border-fuchsia-400/25', Limitless: 'text-white border-white/30'
};

function invoke(action, card, payload = {}) {
  return base44.functions.invoke('cardProgression', {
    action,
    userCardId: card?.userCardId || card?.user_card_id || card?.ownedCardId || undefined,
    achievementId: card?.achievementId || card?.achievement_id || card?.id,
    payload: {
      ...payload,
      cardImage: card?.image || card?.card_image || '',
      gameId: card?.gameId || card?.game_id || '',
      genre: card?.genre || ''
    }
  });
}

function formatDate(value) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Not recorded';
}

function Meter({ value, max, label }) {
  const safeMax = Math.max(1, Number(max) || 1);
  const pct = Math.min(100, Math.max(0, ((Number(value) || 0) / safeMax) * 100));
  return <div className="space-y-2"><div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-white/35"><span>{label}</span><span className="font-mono text-white/65">{Number(value || 0).toLocaleString()} / {safeMax.toLocaleString()}</span></div><div className="h-1.5 bg-white/[0.06] overflow-hidden"><motion.div initial={false} animate={{ width: `${pct}%` }} className="h-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400" /></div></div>;
}

function CardHero({ card, progression, userCard }) {
  const stars = Math.max(1, Math.min(5, Number(progression?.stars || 1)));
  return <aside className="xl:sticky xl:top-0 self-start space-y-4">
    <div className="relative aspect-[2/3] overflow-hidden border border-white/[0.10] bg-[#080d15] shadow-[0_30px_80px_rgba(0,0,0,.45)]">
      {card?.image || userCard?.card_image ? <img src={card?.image || userCard?.card_image} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(34,211,238,.18),transparent_38%),linear-gradient(160deg,#111827,#05070c)]" />}
      <div className="absolute inset-0 bg-gradient-to-t from-[#05070c] via-transparent to-black/20" />
      <div className="absolute inset-x-0 top-0 p-4 flex items-start justify-between gap-3">
        <span className="border border-white/15 bg-black/45 backdrop-blur px-2 py-1 text-[9px] uppercase tracking-[.18em] text-white/80">Lv {progression?.level || 1}</span>
        <span className={`border bg-black/45 backdrop-blur px-2 py-1 text-[9px] uppercase tracking-[.15em] ${rarityTone[card?.rarity || userCard?.card_rarity] || rarityTone.Common}`}>{card?.rarity || userCard?.card_rarity || 'Common'}</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5">
        <div className="flex gap-1 mb-3">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3 h-3 ${i < stars ? 'fill-amber-300 text-amber-300' : 'text-white/20'}`} />)}</div>
        <p className="text-[9px] uppercase tracking-[.22em] text-cyan-300/75">Stage {progression?.stage || 1} · Ascension {progression?.ascension || 0}</p>
        <h2 className="text-2xl font-black text-white leading-none mt-2">{card?.title || userCard?.card_name || 'Achievement Card'}</h2>
        <p className="text-[11px] text-white/45 mt-2 truncate">{card?.series || userCard?.game_name || 'Atom x Eve'}</p>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-px bg-white/[0.07] border border-white/[0.07]">
      {[['Power', progression?.power_score || 0], ['Skill Points', progression?.skill_points || 0], ['Stability', `${progression?.over_enchant_stability ?? 100}%`], ['Over-Enchant', `+${progression?.over_enchant_rank || 0}`]].map(([label, value]) => <div key={label} className="bg-[#080d15]/95 p-3"><span className="block text-[8px] uppercase tracking-[.18em] text-white/30">{label}</span><strong className="block mt-1 text-sm text-white font-semibold">{value}</strong></div>)}
    </div>
  </aside>;
}

function RecordView({ card, state }) {
  const p = state.progression;
  const combinedStats = useMemo(() => Object.fromEntries(Object.keys(statLabels).map(key => [key, Number(p?.base_stats?.[key] || 0) + Number(p?.enhanced_stats?.[key] || 0)])), [p]);
  return <div className="space-y-6">
    <header><span className="text-[9px] uppercase tracking-[.24em] text-cyan-300/70">Authoritative Card State</span><h3 className="text-3xl font-black text-white mt-2">Record</h3><p className="text-sm text-white/45 mt-2 max-w-2xl">This is the card’s live record: ownership, progression, power, active perks, enchantments and every forge decision that changed it.</p></header>
    <section className="grid md:grid-cols-5 gap-px bg-white/[0.07] border border-white/[0.07]">{Object.entries(combinedStats).map(([key, value]) => <div key={key} className="bg-[#090e17]/95 p-4"><span className="text-[8px] uppercase tracking-[.18em] text-white/30">{statLabels[key]}</span><strong className="block mt-2 text-xl text-white">{value}</strong><small className="text-[9px] text-emerald-300/70">+{Number(p?.enhanced_stats?.[key] || 0)} forged</small></div>)}</section>
    <section className="grid xl:grid-cols-2 gap-4">
      <div className="border border-white/[0.08] bg-white/[0.02] p-5"><div className="flex items-center gap-2 mb-4"><Gem className="w-4 h-4 text-violet-300"/><h4 className="text-sm font-bold text-white">Enchantments</h4><span className="ml-auto text-[9px] uppercase tracking-wider text-white/30">{p?.enchantments?.length || 0} active</span></div>{p?.enchantments?.length ? <div className="space-y-2">{p.enchantments.map((e, i) => <div key={`${e.id}-${i}`} className="flex items-center gap-3 border-t border-white/[0.06] pt-3 first:border-0 first:pt-0"><span className="w-8 h-8 grid place-items-center bg-violet-400/10 text-violet-200"><WandSparkles className="w-4 h-4"/></span><div className="min-w-0"><strong className="text-xs text-white block">{e.name}</strong><span className="text-[9px] uppercase tracking-wider text-white/35">{e.element || 'Arcane'}{e.overcharged ? ' · Overcharged' : ''}</span></div></div>)}</div> : <p className="text-xs text-white/35">No enchantments have been applied yet.</p>}</div>
      <div className="border border-white/[0.08] bg-white/[0.02] p-5"><div className="flex items-center gap-2 mb-4"><Sparkles className="w-4 h-4 text-amber-300"/><h4 className="text-sm font-bold text-white">Active Perks</h4><span className="ml-auto text-[9px] uppercase tracking-wider text-white/30">{p?.active_perks?.length || 0} / 3</span></div>{p?.active_perks?.length ? <div className="flex flex-wrap gap-2">{p.active_perks.map(id => <span key={id} className="border border-amber-300/20 bg-amber-300/[0.06] px-3 py-2 text-[10px] text-amber-200">{id.replaceAll('_', ' ')}</span>)}</div> : <p className="text-xs text-white/35">Unlock perk nodes in Skills, then activate up to three.</p>}</div>
    </section>
    <section className="border border-white/[0.08] bg-white/[0.015]"><div className="px-5 py-4 border-b border-white/[0.07] flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-300"/><h4 className="text-sm font-bold text-white">Live progression history</h4><span className="ml-auto text-[9px] text-white/30 uppercase tracking-widest">Newest first</span></div><div className="divide-y divide-white/[0.06]">{state.events?.length ? state.events.map(event => <div key={event.id} className="grid md:grid-cols-[140px_1fr_auto] gap-3 px-5 py-4 items-center"><span className="text-[9px] uppercase tracking-widest text-cyan-300/65">{event.event_type?.replaceAll('_',' ')}</span><div><strong className="text-xs text-white/80">{event.summary || 'Card updated'}</strong><p className="text-[10px] text-white/30 mt-1">{formatDate(event.created_date || event.updated_date)}</p></div><ChevronRight className="w-4 h-4 text-white/15"/></div>) : <div className="p-6 text-sm text-white/35">No recorded progression events yet.</div>}</div></section>
  </div>;
}

function ForgeAction({ icon: Icon, title, description, meta, children }) {
  return <section className="border border-white/[0.08] bg-white/[0.018] p-5"><div className="flex items-start gap-3"><div className="w-9 h-9 grid place-items-center border border-white/[0.10] bg-white/[0.025] text-cyan-200"><Icon className="w-4 h-4"/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="text-sm font-bold text-white">{title}</h4>{meta && <span className="text-[8px] uppercase tracking-[.16em] text-white/30">{meta}</span>}</div><p className="text-xs text-white/40 mt-1 leading-relaxed">{description}</p></div></div><div className="mt-4">{children}</div></section>;
}

function ForgeView({ state, act, busy }) {
  const p = state.progression;
  const [enhanceStat, setEnhanceStat] = useState('attack');
  const [selectedEnchant, setSelectedEnchant] = useState('');
  const [selectedSacrifices, setSelectedSacrifices] = useState([]);
  const canLevel = Number(p?.xp || 0) >= Number(p?.xp_to_next || 1) && Number(p?.level || 1) < Number(p?.max_level || 10);
  const toggleSacrifice = id => setSelectedSacrifices(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  return <div className="space-y-6">
    <header><span className="text-[9px] uppercase tracking-[.24em] text-orange-300/70">Blacksmith Runtime</span><h3 className="text-3xl font-black text-white mt-2">Forge</h3><p className="text-sm text-white/45 mt-2 max-w-3xl">No cosmetic buttons. Every operation below is validated on the backend against ownership, materials, level caps, compatible cards and progression prerequisites.</p></header>
    <div className="grid xl:grid-cols-2 gap-4">
      <ForgeAction icon={TrendingUp} title="Train & Level" description="Training consumes Skill Catalysts to build card XP. Leveling spends accumulated XP and grants skill points." meta={`Cap ${p?.max_level || 10}`}><Meter value={p?.xp || 0} max={p?.xp_to_next || 1} label="Card XP"/><div className="grid grid-cols-2 gap-2 mt-4"><button disabled={busy} onClick={() => act('train', { sessions: 1 })} className="h-10 border border-white/10 bg-white/[0.035] text-xs text-white/70 hover:text-white disabled:opacity-40">Train +1</button><button disabled={busy || !canLevel} onClick={() => act('levelUp')} className="h-10 bg-cyan-300 text-slate-950 text-xs font-black disabled:opacity-30">Level Up</button></div></ForgeAction>
      <ForgeAction icon={Target} title="Stat Enhancement" description="Choose a stat. Costs scale as that stat is pushed higher. Resonant Edge improves each successful enhancement." meta="Precision Shards + Combat Cores"><div className="grid grid-cols-5 gap-1">{Object.keys(statLabels).map(key => <button key={key} onClick={() => setEnhanceStat(key)} className={`py-2 text-[9px] uppercase tracking-wider border ${enhanceStat === key ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-200' : 'border-white/[0.07] text-white/35'}`}>{statLabels[key]}</button>)}</div><button disabled={busy} onClick={() => act('enhance', { stat: enhanceStat })} className="mt-3 h-10 w-full bg-white/[0.06] border border-white/10 text-xs font-bold text-white hover:bg-white/[0.10] disabled:opacity-40">Enhance {statLabels[enhanceStat]}</button></ForgeAction>
      <ForgeAction icon={Merge} title="Combine / Stage" description="Fuse duplicates or compatible same-game cards into this card. Higher stages increase power, stars, perk access and enchantment capacity." meta={`Current Stage ${p?.stage || 1}`}><div className="max-h-36 overflow-y-auto space-y-1 pr-1">{state.compatibleCards?.length ? state.compatibleCards.slice(0,12).map(c => <button key={c.id} onClick={() => toggleSacrifice(c.id)} className={`w-full flex items-center gap-3 p-2 border text-left ${selectedSacrifices.includes(c.id) ? 'border-orange-300/35 bg-orange-300/[0.07]' : 'border-white/[0.06] bg-white/[0.02]'}`}><div className="w-8 h-10 bg-black overflow-hidden">{c.card_image && <img src={c.card_image} alt="" className="w-full h-full object-cover"/>}</div><div className="min-w-0"><strong className="text-[10px] text-white block truncate">{c.card_name}</strong><span className="text-[8px] text-white/30 uppercase tracking-wider">{c.card_rarity} · {c.game_name}</span></div>{selectedSacrifices.includes(c.id) && <Check className="w-3 h-3 ml-auto text-orange-300"/>}</button>) : <p className="text-xs text-white/30">No compatible spare cards are currently available.</p>}</div><div className="grid grid-cols-2 gap-2 mt-3"><button disabled={busy || !selectedSacrifices.length} onClick={() => act('combine', { sacrificeUserCardIds: selectedSacrifices })} className="h-10 border border-orange-300/20 bg-orange-300/[0.07] text-orange-200 text-xs font-bold disabled:opacity-30">Fuse Selected</button><button disabled={busy} onClick={() => act('combine', { useWildcard: true })} className="h-10 border border-violet-300/20 bg-violet-300/[0.07] text-violet-200 text-xs font-bold disabled:opacity-30">Use Wildcard</button></div></ForgeAction>
      <ForgeAction icon={Crown} title="Ascension" description="At the current level cap, consume Ascension Cores to break the cap by 10 levels and earn two skill points." meta={`Ascension ${p?.ascension || 0} / 5`}><div className="flex items-center gap-4"><div className="flex-1"><span className="text-[8px] uppercase tracking-wider text-white/30">Requirement</span><p className="text-xs text-white/70 mt-1">Reach level {p?.max_level || 10}</p></div><button disabled={busy || Number(p?.level || 1) < Number(p?.max_level || 10)} onClick={() => act('ascend')} className="h-10 px-5 bg-amber-300 text-slate-950 text-xs font-black disabled:opacity-30">Ascend</button></div></ForgeAction>
      <ForgeAction icon={WandSparkles} title="Enchant" description="Install permanent magical modifiers. Slot capacity grows as the card is staged and ascended." meta="Persistent"><div className="flex gap-2"><select value={selectedEnchant} onChange={e => setSelectedEnchant(e.target.value)} className="flex-1 h-10 bg-[#080d15] border border-white/10 px-3 text-xs text-white/75 outline-none"><option value="">Choose enchantment</option>{state.enchantments?.map(e => <option key={e.id} value={e.id}>{e.name} · {e.rarity || 'Common'}</option>)}</select><button disabled={busy || !selectedEnchant} onClick={() => act('enchant', { enchantmentId: selectedEnchant })} className="h-10 px-5 border border-violet-300/25 bg-violet-300/[0.08] text-violet-200 text-xs font-bold disabled:opacity-30">Apply</button></div></ForgeAction>
      <ForgeAction icon={Flame} title="Over-Enchant" description="Push the latest enchantment beyond normal limits. Success falls as rank rises; failure costs materials and card stability instead of deleting the card." meta={`Stability ${p?.over_enchant_stability ?? 100}%`}><div className="flex items-center gap-4"><div className="flex-1"><span className="text-[8px] uppercase tracking-wider text-white/30">Current over-rank</span><p className="text-xl font-black text-white mt-1">+{p?.over_enchant_rank || 0}</p></div><button disabled={busy || !(p?.enchantments?.length)} onClick={() => act('overEnchant')} className="h-10 px-5 bg-gradient-to-r from-rose-400 to-orange-300 text-slate-950 text-xs font-black disabled:opacity-30">Attempt Over-Enchant</button></div></ForgeAction>
    </div>
    <section className="border border-white/[0.08] bg-white/[0.015] p-5"><div className="flex items-center gap-2 mb-4"><Package className="w-4 h-4 text-cyan-300"/><h4 className="text-sm font-bold text-white">Forge Inventory</h4></div><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06]">{state.materials?.length ? state.materials.filter(m => Number(m.quantity) > 0).slice(0,12).map(m => <div key={m.id} className="bg-[#090e17] p-3"><span className="text-[8px] uppercase tracking-wider text-white/30">{m.material_type?.replaceAll('_',' ') || m.definition?.name || 'Material'}</span><strong className="block text-white mt-1">× {Number(m.quantity || 0).toLocaleString()}</strong></div>) : <div className="col-span-full bg-[#090e17] p-5 text-xs text-white/30">No forge materials are in this account yet. Achievement rewards and gameplay drops can populate these stacks.</div>}</div></section>
  </div>;
}

function SkillsView({ state, act, busy }) {
  const p = state.progression;
  const nodesByLane = useMemo(() => state.skillTree?.reduce((acc, node) => { (acc[node.lane] ||= []).push(node); return acc; }, {}) || {}, [state.skillTree]);
  const unlocked = new Set(p?.unlocked_skill_nodes || []);
  const active = new Set(p?.active_perks || []);
  const lanes = Object.entries(nodesByLane);
  return <div className="space-y-6">
    <header className="flex flex-wrap items-end gap-4"><div><span className="text-[9px] uppercase tracking-[.24em] text-violet-300/70">Card Mastery Network</span><h3 className="text-3xl font-black text-white mt-2">Skills & Perks</h3><p className="text-sm text-white/45 mt-2 max-w-3xl">The skill tree belongs to this exact card. Levels award points, stages open deeper branches, and perk nodes can be equipped to the card’s three active perk slots.</p></div><div className="ml-auto border border-violet-300/15 bg-violet-300/[0.05] px-4 py-3"><span className="text-[8px] uppercase tracking-widest text-white/30">Available SP</span><strong className="block text-2xl text-violet-200">{p?.skill_points || 0}</strong></div></header>
    <div className="grid xl:grid-cols-3 gap-4">{lanes.map(([lane, nodes]) => <section key={lane} className="border border-white/[0.08] bg-white/[0.015] p-5"><div className="flex items-center gap-2 mb-5"><span className="w-2 h-2 rounded-full bg-violet-300"/><h4 className="text-xs uppercase tracking-[.18em] text-white/70">{lane} Path</h4></div><div className="space-y-3">{nodes.map((node, idx) => { const isUnlocked = unlocked.has(node.id); const prereqOK = !node.prerequisite || unlocked.has(node.prerequisite); const eligible = Number(p?.level || 1) >= node.minLevel && Number(p?.stage || 1) >= node.minStage && prereqOK; const isActive = active.has(node.id); return <div key={node.id} className={`relative border p-4 ${isUnlocked ? 'border-violet-300/25 bg-violet-300/[0.055]' : 'border-white/[0.06] bg-black/10'}`}>{idx > 0 && <span className="absolute left-6 -top-3 h-3 w-px bg-white/10"/>}<div className="flex items-start gap-3"><div className={`w-9 h-9 grid place-items-center border ${isUnlocked ? 'border-violet-300/30 text-violet-200' : 'border-white/10 text-white/25'}`}>{isUnlocked ? <Check className="w-4 h-4"/> : eligible ? <Zap className="w-4 h-4"/> : <Lock className="w-4 h-4"/>}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><strong className="text-xs text-white">{node.name}</strong>{node.perk && <span className="text-[7px] uppercase tracking-wider border border-amber-300/20 text-amber-200 px-1.5 py-0.5">Perk</span>}</div><p className="text-[10px] text-white/35 mt-1 leading-relaxed">{node.effect}</p><div className="flex gap-3 mt-2 text-[8px] uppercase tracking-wider text-white/25"><span>Lv {node.minLevel}</span><span>Stage {node.minStage}</span><span>{node.cost} SP</span></div></div></div><div className="mt-3">{!isUnlocked ? <button disabled={busy || !eligible || Number(p?.skill_points || 0) < node.cost} onClick={() => act('unlockSkill', { nodeId: node.id })} className="w-full h-8 border border-violet-300/20 bg-violet-300/[0.06] text-[9px] uppercase tracking-widest text-violet-200 disabled:opacity-25">Unlock Node</button> : node.perk ? <button disabled={busy} onClick={() => act('togglePerk', { nodeId: node.id })} className={`w-full h-8 border text-[9px] uppercase tracking-widest ${isActive ? 'border-amber-300/30 bg-amber-300/[0.08] text-amber-200' : 'border-white/10 bg-white/[0.025] text-white/50'}`}>{isActive ? 'Deactivate Perk' : 'Activate Perk'}</button> : <div className="h-8 grid place-items-center text-[8px] uppercase tracking-widest text-emerald-300/60">Unlocked</div>}</div></div>})}</div></section>)}</div>
    <section className="border border-white/[0.08] bg-white/[0.015] p-5"><div className="flex items-center gap-2"><Shield className="w-4 h-4 text-amber-300"/><h4 className="text-sm font-bold text-white">Active loadout</h4><span className="text-[9px] uppercase tracking-widest text-white/30 ml-auto">3 perk slots</span></div><div className="grid sm:grid-cols-3 gap-2 mt-4">{Array.from({length:3}).map((_,i) => { const id = p?.active_perks?.[i]; const node = state.skillTree?.find(n => n.id === id); return <div key={i} className="min-h-20 border border-white/[0.07] bg-black/10 p-3 flex items-center gap-3"><span className="text-[10px] font-mono text-white/20">0{i+1}</span>{node ? <div><strong className="text-xs text-amber-200 block">{node.name}</strong><span className="text-[9px] text-white/30">{node.effect}</span></div> : <span className="text-[10px] uppercase tracking-widest text-white/20">Empty perk slot</span>}</div>})}</div></section>
  </div>;
}

export default function MysteryCardDetail({ card, onBack }) {
  const [tab, setTab] = useState('record');
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await invoke('getState', card);
      setState(response?.data || response);
      setMessage(null);
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'Card progression could not be loaded.' });
    } finally { setLoading(false); }
  }, [card]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const unsubscribe = base44.entities.CardProgression?.subscribe?.((event) => {
      if (event?.data?.user_card_id && event.data.user_card_id === state?.userCard?.id) load();
    });
    return () => unsubscribe?.();
  }, [load, state?.userCard?.id]);

  const act = async (action, payload = {}) => {
    setBusy(true); setMessage(null);
    try {
      const response = await invoke(action, { ...card, userCardId: state?.userCard?.id || card?.userCardId }, payload);
      const next = response?.data || response;
      setState(next);
      const latest = next?.events?.[0]?.summary;
      setMessage({ type: 'success', text: latest || 'Card updated.' });
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'That card action failed.' });
    } finally { setBusy(false); }
  };

  return <div className="h-full min-h-[620px] bg-[#05080e] text-slate-200 overflow-hidden border border-white/[0.07] relative">
    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,.08),transparent_30%),radial-gradient(circle_at_90%_15%,rgba(139,92,246,.07),transparent_28%)]" />
    <div className="relative h-full flex flex-col">
      <header className="shrink-0 border-b border-white/[0.07] bg-black/20 backdrop-blur-xl px-5 py-3 flex items-center gap-4"><button onClick={onBack} className="w-9 h-9 grid place-items-center border border-white/10 text-white/45 hover:text-white"><ArrowLeft className="w-4 h-4"/></button><div className="min-w-0"><p className="text-[8px] uppercase tracking-[.22em] text-white/30">Achievement Card Runtime</p><h1 className="text-sm font-bold text-white truncate">{card?.title || card?.card_name || 'Card Detail'}</h1></div><div className="ml-auto flex items-center gap-1">{tabs.map(({id,label,icon:Icon,hint}) => <button key={id} title={hint} onClick={() => setTab(id)} className={`h-9 px-3 flex items-center gap-2 border text-[9px] uppercase tracking-[.14em] transition-colors ${tab === id ? 'border-cyan-300/25 bg-cyan-300/[0.07] text-cyan-200' : 'border-transparent text-white/35 hover:text-white/70'}`}><Icon className="w-3.5 h-3.5"/>{label}</button>)}<button onClick={load} disabled={loading || busy} aria-label="Refresh live card state" className="w-9 h-9 grid place-items-center text-white/30 hover:text-white disabled:opacity-30"><RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}/></button></div></header>
      <AnimatePresence>{message && <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className={`shrink-0 px-5 py-2 text-[10px] border-b ${message.type === 'error' ? 'border-rose-400/15 bg-rose-400/[0.05] text-rose-200' : 'border-emerald-400/15 bg-emerald-400/[0.05] text-emerald-200'}`}>{message.text}</motion.div>}</AnimatePresence>
      {loading && !state ? <div className="flex-1 grid place-items-center"><div className="flex items-center gap-3 text-white/35 text-xs"><RefreshCcw className="w-4 h-4 animate-spin"/>Loading live card state…</div></div> : state ? <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar"><div className="grid xl:grid-cols-[230px_minmax(0,1fr)] gap-7 p-6 max-w-[1500px] mx-auto"><CardHero card={card} progression={state.progression} userCard={state.userCard}/><main className="min-w-0">{tab === 'record' ? <RecordView card={card} state={state}/> : tab === 'forge' ? <ForgeView state={state} act={act} busy={busy}/> : <SkillsView state={state} act={act} busy={busy}/>}</main></div></div> : <div className="flex-1 grid place-items-center text-sm text-white/35">This card does not have a live progression state yet.</div>}
    </div>
  </div>;
}
