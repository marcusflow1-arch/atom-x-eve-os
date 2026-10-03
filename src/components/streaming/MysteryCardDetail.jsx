import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity, AlertTriangle, ArrowLeft, Check, ChevronRight, Crown, Flame, Gauge,
  Gem, Hammer, History, Layers, Lock, Package, RefreshCcw, Shield, Sparkles,
  Star, Target, TrendingUp, Wand2, Zap, Crosshair, Swords, Trophy,
  Gamepad2, Brain, Plus
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import CardScrollActions from '@/components/cards/CardScrollActions';
import '@/components/cards/forbidden-scroll.css';

const tabs = [
  { id: 'record', label: 'Overview', icon: History, hint: 'Artwork, power, attributes and lore' },
  { id: 'forge', label: 'Enhancement', icon: Hammer, hint: 'Level advancement and stat allocation' },
  { id: 'skills', label: 'Skill Tree', icon: Layers, hint: 'Active abilities and passive perks' },
  { id: 'combined', label: 'Combined Stage', icon: Swords, hint: 'Card fusion and stage evolution' },
  { id: 'essential', label: 'Essential', icon: Gem, hint: 'Core, elemental gem and rune sockets' },
];

const statLabels = {
  attack: 'Attack',
  defense: 'Defense',
  magic: 'Spirit',
  vitality: 'Vitality',
  speed: 'Dexterity',
};

const rarityTone = {
  Common: 'text-slate-300 border-slate-400/20',
  Uncommon: 'text-emerald-300 border-emerald-400/25',
  Rare: 'text-cyan-300 border-cyan-400/25',
  Epic: 'text-violet-300 border-violet-400/25',
  Legendary: 'text-amber-300 border-amber-400/25',
  Mythic: 'text-rose-300 border-rose-400/25',
  Mythical: 'text-rose-300 border-rose-400/25',
  Unique: 'text-fuchsia-300 border-fuchsia-400/25',
  Ascendant: 'text-white border-white/30',
  Limitless: 'text-white border-white/30',
};

function invoke(action, card, payload = {}) {
  const userCardId = card?.userCardId || card?.user_card_id || card?.ownedCardId || undefined;
  return base44.functions.invoke('cardProgression', {
    action,
    userCardId,
    achievementId: card?.achievementId || card?.achievement_id || (!userCardId && !card?.trading_card_id ? card?.id : undefined),
    payload: {
      ...payload,
      cardImage: card?.image || card?.card_image || '',
      gameId: card?.gameId || card?.game_id || '',
      genre: card?.genre || '',
    },
  });
}

function formatDate(value) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'Not recorded';
}

function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function percent(value, fallback = null) {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n <= 1 ? Math.round(n * 100) : Math.round(n);
}

function Glass({ children, className = '' }) {
  return (
    <section className={`relative overflow-hidden bg-[#0F1115]/85 backdrop-blur-xl ${className}`}>
      <div className="pointer-events-none absolute inset-x-[7%] top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/15 to-transparent" />
      <div className="pointer-events-none absolute inset-x-[12%] bottom-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/10 to-transparent" />
      {children}
    </section>
  );
}

function Meter({ value, max, label, tone = 'cyan' }) {
  const safeMax = Math.max(1, num(max, 1));
  const pct = Math.min(100, Math.max(0, (num(value) / safeMax) * 100));
  const fill = tone === 'danger'
    ? 'from-rose-500 via-orange-400 to-amber-300'
    : 'from-cyan-300 via-blue-400 to-fuchsia-400';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.18em] text-white/35">
        <span>{label}</span>
        <span className="font-mono text-white/65">{num(value).toLocaleString()} / {safeMax.toLocaleString()}</span>
      </div>
      <div className="h-1.5 overflow-hidden bg-white/[0.06]">
        <motion.div initial={false} animate={{ width: `${pct}%` }} className={`h-full bg-gradient-to-r ${fill}`} />
      </div>
    </div>
  );
}

function HolographicCard({ card, progression, userCard }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const stars = Math.max(1, Math.min(5, num(progression?.stars, 1)));
  const rarity = card?.rarity || userCard?.card_rarity || 'Common';
  const safeEnchant = Math.min(5, num(progression?.enchant_rank ?? progression?.enchant_level, 0));
  const overRank = num(progression?.over_enchant_rank, 0);

  const onMove = (event) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -10, y: px * 12 });
  };

  return (
    <aside className="xl:sticky xl:top-0 self-start space-y-4">
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        animate={{ rotateX: tilt.x, rotateY: tilt.y }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        className="relative aspect-[2/3] overflow-hidden bg-[#080d15]"
        style={{ transformStyle: 'preserve-3d', perspective: 1100 }}
      >
        {card?.image || userCard?.card_image ? (
          <img src={card?.image || userCard?.card_image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(0,240,255,.20),transparent_38%),linear-gradient(160deg,#111827,#05070c)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070c] via-transparent to-black/20" />
        <div className="absolute -inset-20 opacity-30 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,.18)_48%,transparent_60%)]" style={{ transform: `translateX(${tilt.y * 5}px)` }} />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
          <span className="bg-black/45 px-2 py-1 text-[9px] uppercase tracking-[.18em] text-white/80 backdrop-blur">Lv {progression?.level || 1}</span>
          <span className={`border bg-black/45 px-2 py-1 text-[9px] uppercase tracking-[.15em] backdrop-blur ${rarityTone[rarity] || rarityTone.Common}`}>{rarity}</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <div className="mb-3 flex gap-1">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3 w-3 ${i < stars ? 'fill-amber-300 text-amber-300' : 'text-white/20'}`} />)}</div>
          <p className="text-[9px] uppercase tracking-[.22em] text-cyan-300/75">Tier {progression?.stage || 1} · Ascension {progression?.ascension || 0}</p>
          <h2 className="mt-2 text-2xl font-black leading-none text-white">{card?.title || userCard?.card_name || 'Achievement Card'}</h2>
          <p className="mt-2 truncate text-[11px] text-white/45">{card?.series || userCard?.game_name || 'Atom X Eve'}</p>
          <div className="mt-4 flex gap-2 text-[9px] uppercase tracking-wider">
            <span className="bg-cyan-400/10 px-2 py-1 text-cyan-200">Enchant +{safeEnchant}</span>
            <span className={`${overRank > 0 ? 'bg-rose-400/10 text-rose-200' : 'bg-white/[0.05] text-white/35'} px-2 py-1`}>Over +{overRank}</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-px bg-white/[0.06]">
        {[
          ['Power', progression?.power_score || 0],
          ['Skill Points', progression?.skill_points || 0],
          ['Stability', `${progression?.over_enchant_stability ?? 100}%`],
          ['Perk Slots', `${progression?.active_perks?.length || 0}/${progression?.perk_slots || 3}`],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#080d15]/95 p-3">
            <span className="block text-[8px] uppercase tracking-[.18em] text-white/30">{label}</span>
            <strong className="mt-1 block text-sm font-semibold text-white">{value}</strong>
          </div>
        ))}
      </div>
    </aside>
  );
}

function TelemetryCard({ icon: Icon, label, value, meta }) {
  return (
    <div className="group bg-white/[0.025] p-4 transition hover:bg-white/[0.045]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[8px] uppercase tracking-[.18em] text-white/30">{label}</span>
        <Icon className="h-3.5 w-3.5 text-cyan-200/50" />
      </div>
      <div className="mt-2 text-2xl font-black text-white">{value}</div>
      {meta && <div className="mt-1 text-[9px] text-cyan-200/55">{meta}</div>}
    </div>
  );
}

function RecordView({ card, state }) {
  const p = state.progression || {};
  const telemetry = state.telemetry || p.telemetry || state.userCard?.telemetry || card?.telemetry || {};
  const combinedStats = useMemo(
    () => Object.fromEntries(Object.keys(statLabels).map((key) => [key, num(p?.effective_stats?.[key],num(p?.base_stats?.[key]) + num(p?.enhanced_stats?.[key]))])),
    [p],
  );

  const kills = telemetry.total_kills ?? telemetry.kills ?? state.userCard?.total_kills;
  const accuracy = percent(telemetry.accuracy ?? telemetry.hit_accuracy, null);
  const winRate = percent(telemetry.win_rate ?? telemetry.winRate, null);
  const playstyle = percent(telemetry.playstyle_match ?? telemetry.style_match, null);
  const genreAffinity = percent(telemetry.genre_affinity ?? telemetry.genreAffinity, null);
  const status = telemetry.status || p.status || 'SYNCED';
  const utility = [
    card?.reward?.name,
    card?.reward?.environment,
    card?.reward?.equipment,
    card?.reward?.ability,
    card?.reward?.teacher,
  ].filter(Boolean);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end gap-4">
        <div>
          <span className="text-[9px] uppercase tracking-[.28em] text-cyan-300/65">Real-Time Card Telemetry</span>
          <h3 className="mt-2 text-3xl font-black text-white">Overview</h3>
          <p className="mt-2 max-w-3xl text-sm text-white/40">Every achievement card is a live gameplay object. This record updates as your playstyle, progression, and forge history change.</p>
        </div>
        <div className="ml-auto flex items-center gap-2 bg-emerald-400/[0.05] px-3 py-2 text-[9px] font-bold uppercase tracking-[.2em] text-emerald-200/70"><Activity className="h-3.5 w-3.5" /> {status}</div>
      </header>

      <div className="grid gap-px bg-white/[0.05] sm:grid-cols-2 xl:grid-cols-5">
        <TelemetryCard icon={Crosshair} label="Total Kills" value={kills != null ? num(kills).toLocaleString() : '—'} meta="live combat telemetry" />
        <TelemetryCard icon={Target} label="Accuracy" value={accuracy != null ? `${accuracy}%` : '—'} meta="weapon / ability precision" />
        <TelemetryCard icon={Trophy} label="Win Rate" value={winRate != null ? `${winRate}%` : '—'} meta="competitive outcomes" />
        <TelemetryCard icon={Brain} label="Playstyle Match" value={playstyle != null ? `${playstyle}%` : '—'} meta={telemetry.playstyle || 'behavior profile'} />
        <TelemetryCard icon={Gamepad2} label="Genre Affinity" value={genreAffinity != null ? `${genreAffinity}%` : '—'} meta={card?.genre || state.userCard?.genre || 'cross-game learning'} />
      </div>

      <Glass className="p-5">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <div className="mb-4 flex items-center gap-2"><Gauge className="h-4 w-4 text-cyan-300" /><h4 className="text-sm font-bold text-white">Card State</h4></div>
            <div className="grid grid-cols-2 gap-px bg-white/[0.05] md:grid-cols-5">
              {Object.entries(combinedStats).map(([key, value]) => (
                <div key={key} className="bg-black/20 p-3">
                  <span className="text-[8px] uppercase tracking-[.16em] text-white/30">{statLabels[key]}</span>
                  <strong className="mt-1 block text-lg text-white">{value}</strong>
                  <small className="text-[8px] text-emerald-300/60">+{num(p?.enhanced_stats?.[key])} forged</small>
                </div>
              ))}
            </div>
            <div className="mt-4"><Meter value={p?.xp || 0} max={p?.xp_to_next || 1} label={`Level ${p?.level || 1} XP`} /></div>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4 text-fuchsia-300" /><h4 className="text-sm font-bold text-white">Real-Time Utility</h4></div>
            <div className="space-y-2">
              {(utility.length ? utility : ['Achievement XP', 'Avatar progression sync']).map((item, index) => (
                <div key={`${item}-${index}`} className="flex items-center gap-3 bg-white/[0.02] px-3 py-2.5 text-xs text-white/55">
                  <Check className="h-3.5 w-3.5 text-cyan-300/65" /> {typeof item === 'string' ? item : item?.name || 'Unlocked utility'}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Glass>

      <div className="grid gap-4 xl:grid-cols-2">
        <Glass className="p-5">
          <div className="mb-4 flex items-center gap-2"><Gem className="h-4 w-4 text-violet-300" /><h4 className="text-sm font-bold text-white">Enchantments</h4><span className="ml-auto text-[9px] uppercase tracking-wider text-white/30">{p?.enchantments?.length || 0} active</span></div>
          {p?.enchantments?.length ? <div className="space-y-2">{p.enchantments.map((enchant, i) => <div key={`${enchant.id}-${i}`} className="flex items-center gap-3 bg-white/[0.02] p-3"><span className="grid h-8 w-8 place-items-center bg-violet-400/10 text-violet-200"><Wand2 className="h-4 w-4" /></span><div><strong className="block text-xs text-white">{enchant.name}</strong><span className="text-[9px] uppercase tracking-wider text-white/35">{enchant.element || 'Arcane'}{enchant.overcharged ? ' · Overcharged' : ''}</span></div></div>)}</div> : <p className="text-xs text-white/30">No enchantments have been applied yet.</p>}
        </Glass>

        <Glass className="p-5">
          <div className="mb-4 flex items-center gap-2"><Shield className="h-4 w-4 text-amber-300" /><h4 className="text-sm font-bold text-white">Active Perks</h4><span className="ml-auto text-[9px] uppercase tracking-wider text-white/30">{p?.active_perks?.length || 0} / {p?.perk_slots || 3}</span></div>
          {p?.active_perks?.length ? <div className="flex flex-wrap gap-2">{p.active_perks.map((id) => <span key={id} className="bg-amber-300/[0.07] px-3 py-2 text-[10px] text-amber-200">{String(id).replaceAll('_', ' ')}</span>)}</div> : <p className="text-xs text-white/30">Unlock perk nodes in the Skill Tree, then activate them in your loadout.</p>}
        </Glass>
      </div>

      <Glass>
        <div className="flex items-center gap-2 px-5 py-4"><Activity className="h-4 w-4 text-cyan-300" /><h4 className="text-sm font-bold text-white">Live Progression History</h4><span className="ml-auto text-[9px] uppercase tracking-widest text-white/25">Newest first</span></div>
        <div className="divide-y divide-white/[0.05]">{state.events?.length ? state.events.slice(0, 12).map((event) => <div key={event.id} className="grid items-center gap-3 px-5 py-4 md:grid-cols-[140px_1fr_auto]"><span className="text-[9px] uppercase tracking-widest text-cyan-300/60">{event.event_type?.replaceAll('_', ' ')}</span><div><strong className="text-xs text-white/75">{event.summary || 'Card updated'}</strong><p className="mt-1 text-[10px] text-white/25">{formatDate(event.created_date || event.updated_date)}</p></div><ChevronRight className="h-4 w-4 text-white/15" /></div>) : <div className="p-6 text-sm text-white/30">No recorded progression events yet.</div>}</div>
      </Glass>
    </div>
  );
}

function ForgeBlock({ icon: Icon, eyebrow, title, children, danger = false }) {
  return (
    <Glass className="p-5">
      <div className="flex items-start gap-3">
        <div className={`grid h-9 w-9 shrink-0 place-items-center ${danger ? 'bg-rose-400/10 text-rose-200' : 'bg-cyan-400/[0.07] text-cyan-200'}`}><Icon className="h-4 w-4" /></div>
        <div><span className="text-[8px] uppercase tracking-[.2em] text-white/25">{eyebrow}</span><h4 className="mt-0.5 text-sm font-bold text-white">{title}</h4></div>
      </div>
      <div className="mt-4">{children}</div>
    </Glass>
  );
}

function ForgeView({ state, act, busy, section }) {
  const p = state.progression || {};
  const [enhanceStat, setEnhanceStat] = useState('attack');
  const [selectedSacrifices, setSelectedSacrifices] = useState([]);
  const canLevel = num(p?.xp) >= num(p?.xp_to_next, 1) && num(p?.level, 1) < num(p?.max_level, 10);
  const overRank = num(p?.over_enchant_rank);
  const stability = num(p?.over_enchant_stability, 100);
  const successChance = Math.max(35, Math.min(95, 82 - overRank * 12 + num(p.stage, 1) * 2 + ((p.unlocked_skill_nodes || []).includes('enchanter_focus') ? 8 : 0)));
  const needed = Math.min(3, num(p.stage, 1) + 1);
  const toggleSacrifice = id => setSelectedSacrifices(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < needed ? [...prev, id] : prev);


  return (
    <div className="space-y-5">
      <header><span className="card-scroll-eyebrow">{section === 'combined' ? 'Synthesis & evolution' : 'Card growth'}</span><h3>{section === 'combined' ? 'Combined Stage' : 'Enhancement'}</h3><p className="mt-2 text-sm text-slate-400">{section === 'combined' ? 'Combine compatible cards to advance stages, then ascend to raise the level cap. Fusion consumes the selected spare cards.' : 'Build experience, spend earned stat points and refine your primary attributes.'}</p></header>

      <div className="grid gap-4 xl:grid-cols-2">
        {section === 'forge' && (
        <ForgeBlock icon={TrendingUp} eyebrow={`Level cap ${p?.max_level || 10}`} title="Level Card">
          <Meter value={p?.xp || 0} max={p?.xp_to_next || 1} label="Essence / XP" />
          <div className="mt-4 grid grid-cols-2 gap-2"><button disabled={busy} onClick={() => act('train', { sessions: 1 })} className="h-10 bg-white/[0.05] text-xs font-bold text-white/60 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-30">Spend Essence</button><button disabled={busy || !canLevel} onClick={() => act('levelUp')} className="h-10 bg-cyan-300 text-xs font-black text-slate-950 disabled:opacity-25">LEVEL UP</button></div>
        </ForgeBlock>
        )}

        {section === 'forge' && (
        <ForgeBlock icon={Target} eyebrow="Direct stat scaling" title="Enhance Base Stats">
          <div className="grid grid-cols-5 gap-1">{Object.keys(statLabels).map((key) => <button key={key} onClick={() => setEnhanceStat(key)} className={`py-2 text-[8px] uppercase tracking-wider ${enhanceStat === key ? 'bg-cyan-300/10 text-cyan-200' : 'bg-white/[0.025] text-white/30'}`}>{statLabels[key]}</button>)}</div>
          <button disabled={busy} onClick={() => act('enhance', { stat: enhanceStat })} className="mt-3 h-10 w-full bg-white/[0.055] text-xs font-bold text-white/70 hover:bg-white/[0.09] disabled:opacity-30">Enhance {statLabels[enhanceStat]}</button>
          <div className="mt-4 border-t border-white/10 pt-4"><p className="text-xs text-slate-300">{num(p.stat_points)} stat points available</p><p className="mt-1 text-xs text-slate-400">Earn one per new card level; each point adds +1 to your chosen base attribute.</p><button disabled={busy || num(p.stat_points) < 1} onClick={() => act('allocateStat', { stat: enhanceStat })} className="mt-3 h-10 w-full bg-cyan-200 text-xs font-bold text-slate-950 disabled:opacity-30">Allocate point to {statLabels[enhanceStat]}</button></div>
        </ForgeBlock>
        )}

        {section === 'combined' && (
        <ForgeBlock icon={Swords} eyebrow={`Current stage ${p?.stage || 1}`} title="Fusion & Stage Pedestal">
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: needed }, (_, slot) => slot).map((slot) => {
              const selected = state.compatibleCards?.find((item) => item.id === selectedSacrifices[slot]);
              return <div key={slot} className={`min-h-24 p-3 ${selected ? 'bg-fuchsia-400/[0.06]' : 'bg-white/[0.025]'}`}><span className="text-[8px] uppercase tracking-[.18em] text-white/25">Fusion Slot {String.fromCharCode(65 + slot)}</span>{selected ? <div className="mt-3 flex items-center gap-2"><div className="h-10 w-8 overflow-hidden bg-black">{selected.card_image && <img src={selected.card_image} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0"><div className="truncate text-[10px] font-bold text-white/75">{selected.card_name}</div><div className="text-[8px] text-fuchsia-200/50">{selected.card_rarity}</div></div></div> : <div className="mt-4 flex items-center gap-2 text-[9px] text-white/20"><Plus className="h-3 w-3" /> Select a sacrifice</div>}</div>;
            })}
          </div>
          <div className="mt-3 max-h-32 space-y-1 overflow-y-auto">{state.compatibleCards?.length ? state.compatibleCards.slice(0, 10).map((candidate) => <button key={candidate.id} onClick={() => toggleSacrifice(candidate.id)} className={`flex w-full items-center gap-3 p-2 text-left ${selectedSacrifices.includes(candidate.id) ? 'bg-fuchsia-400/[0.08] text-white' : 'bg-white/[0.02] text-white/45'}`}><div className="h-8 w-7 overflow-hidden bg-black">{candidate.card_image && <img src={candidate.card_image} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><div className="truncate text-[10px] font-semibold">{candidate.card_name}</div><div className="text-[8px] uppercase tracking-wider text-white/25">{candidate.card_rarity} · {candidate.game_name}</div></div>{selectedSacrifices.includes(candidate.id) && <Check className="h-3 w-3 text-fuchsia-300" />}</button>) : <div className="p-3 text-xs text-white/25">No compatible spare cards are currently available.</div>}</div>
          <button disabled={busy || selectedSacrifices.length !== needed || num(p.stage, 1) >= 5} onClick={() => act('combine', { sacrificeUserCardIds: selectedSacrifices })} className="mt-3 h-10 w-full bg-fuchsia-400/15 text-xs font-black text-fuchsia-100 disabled:opacity-25">Combine {needed} cards · advance stage</button>
        </ForgeBlock>
        )}

        {section === 'combined' && (
        <ForgeBlock icon={Crown} eyebrow={`Ascension ${p?.ascension || 0}/5`} title="Break Level Cap">
          <div className="flex items-center justify-between gap-4 bg-white/[0.02] p-3"><div><div className="text-[8px] uppercase tracking-wider text-white/25">Requirement</div><div className="mt-1 text-xs text-white/65">Reach level {p?.max_level || 10}</div></div><button disabled={busy || num(p?.level, 1) < num(p?.max_level, 10)} onClick={() => act('ascend')} className="h-10 px-5 bg-amber-300 text-xs font-black text-slate-950 disabled:opacity-25">ASCEND</button></div>
        </ForgeBlock>
        )}



        {section === 'forge' && (
        <ForgeBlock icon={Flame} eyebrow={`Danger level ${successChance < 45 ? 'CRITICAL' : successChance < 65 ? 'HIGH' : 'CONTROLLED'}`} title="Over-Enchant" danger>
          <p className="text-xs leading-6 text-slate-300">Rank {overRank} / 5 · Stability {stability}% · Success {successChance}%</p>
          <p className="mt-2 text-xs leading-6 text-slate-400">Costs {overRank + 1} adaptive shards. Success adds +{2 * (overRank + 1)} to all five primary stats. Failure consumes the materials and reduces stability by 15.</p>
          <button disabled={busy || !(p?.enchantments?.length) || overRank >= 5} onClick={() => act('overEnchant')} className="mt-3 h-10 w-full bg-rose-200 text-xs font-bold text-slate-950 disabled:opacity-25">Over-enchant</button>
        </ForgeBlock>
        )}
      </div>

      <Glass className="p-5"><div className="mb-4 flex items-center gap-2"><Package className="h-4 w-4 text-cyan-300" /><h4 className="text-sm font-bold text-white">Forge Inventory</h4></div><div className="grid gap-px bg-white/[0.05] sm:grid-cols-2 lg:grid-cols-4">{state.materials?.length ? state.materials.filter((material) => num(material.quantity) > 0).slice(0, 12).map((material) => <div key={material.id} className="bg-black/20 p-3"><span className="text-[8px] uppercase tracking-wider text-white/25">{material.material_type?.replaceAll('_', ' ') || material.definition?.name || 'Material'}</span><strong className="mt-1 block text-white">× {num(material.quantity).toLocaleString()}</strong></div>) : <div className="col-span-full bg-black/20 p-5 text-xs text-white/25">Achievement rewards and gameplay drops populate these material stacks.</div>}</div></Glass>
    </div>
  );
}

function EssentialView({ state, act, busy }) {
  const p = state.progression || {};
  const [kind, setKind] = useState('gem');
  const [selected, setSelected] = useState('');
  const slots = 1 + Math.floor(num(p.stage, 1) / 2) + Math.min(2, num(p.ascension));
  const used = (p.enchantments || []).reduce((sum, item) => sum + Math.max(1, num(item.slot_cost, 1)), 0);
  const options = (state.enchantments || []).filter(item => (item.socket_type || 'gem') === kind);
  const definition = options.find(item => item.id === selected);
  const cost = definition?.material_cost && Object.keys(definition.material_cost).length ? definition.material_cost : { resonance_fragment: 1 };
  return <div className="space-y-5">
    <header><span className="card-scroll-eyebrow">Infusion & socketing</span><h3>Essential</h3><p className="mt-2 text-sm text-slate-400">Infuse a core, elemental gem or rune. Their modifiers contribute to this card’s effective stats.</p></header>
    <div className="card-scroll-sockets">{[['core','Core'],['gem','Elemental gem'],['rune','Rune']].map(([id, label]) => <div key={id}><Gem size={19} className="text-cyan-200" /><strong>{label}</strong><span>{(p.enchantments || []).filter(item => (item.socket_type || 'gem') === id).map(item => item.name).join(', ') || 'No infusion'}</span></div>)}</div>
    <Glass className="p-5"><h4 className="text-sm font-semibold">{used} / {slots} sockets used</h4><p className="mt-2 text-xs text-slate-400">Combination stages and ascension open more sockets.</p>
      <label className="mt-4 block text-xs">Socket type<select aria-label="Socket type" value={kind} onChange={event => { setKind(event.target.value); setSelected(''); }} className="mt-2 block w-full bg-slate-950 p-3">{[['core','Core'],['gem','Elemental gem'],['rune','Rune']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="mt-4 block text-xs">Infusion<select aria-label="Infusion" value={selected} onChange={event => setSelected(event.target.value)} className="mt-2 block w-full bg-slate-950 p-3"><option value="">Choose an infusion</option>{options.map(item => <option key={item.id} value={item.id}>{item.name} · {item.element}</option>)}</select></label>
      {!options.length && <p className="mt-3 text-xs text-slate-400">No {kind} recipes have been published for this card yet.</p>}
      {definition && <div className="mt-3 text-xs leading-6 text-slate-300"><p>{definition.description}</p><p>{Object.entries(definition.modifiers || {}).map(([key,value]) => `${key.replaceAll('_',' ')} +${value}`).join(' · ')}</p><p>Cost: {Object.entries(cost).map(([key,value]) => `${value} ${key.replaceAll('_',' ')}`).join(', ')}</p></div>}
      <button disabled={busy || !definition || used + Math.max(1, num(definition?.slot_cost, 1)) > slots} onClick={() => act('enchant', { enchantmentId: selected, socketType: kind })} className="mt-4 h-10 w-full bg-cyan-200 text-xs font-bold text-slate-950 disabled:opacity-30">Infuse {kind}</button>
    </Glass>
  </div>;
}

function SkillNode({ node, unlocked, active, eligible, busy, onUnlock, onToggle, onDragStart }) {
  const teacher = node.teacher || node.node_type === 'teacher' || String(node.lane || '').toLowerCase().includes('teacher');
  const activeAbility = node.active || node.node_type === 'active';
  return (
    <motion.div layout className={`relative min-h-28 p-3 ${unlocked ? 'bg-violet-400/[0.055]' : 'bg-white/[0.02]'}`}>
      <div className="absolute left-1/2 -top-5 h-5 w-px -translate-x-1/2 bg-gradient-to-b from-transparent to-violet-300/25" />
      <div className="flex items-start gap-3">
        <motion.div animate={active ? { boxShadow: ['0 0 0 rgba(0,240,255,0)', '0 0 22px rgba(0,240,255,.35)', '0 0 0 rgba(0,240,255,0)'] } : {}} transition={{ repeat: Infinity, duration: 2.1 }} className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${unlocked ? 'bg-violet-300/10 text-violet-200' : 'bg-white/[0.04] text-white/25'}`}>{unlocked ? <Zap className="h-4 w-4" /> : eligible ? <Sparkles className="h-4 w-4" /> : <Lock className="h-4 w-4" />}</motion.div>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-1.5"><strong className="text-xs text-white/85">{node.name}</strong>{teacher && <span className="bg-cyan-400/[0.07] px-1.5 py-0.5 text-[7px] uppercase tracking-wider text-cyan-200">Teacher</span>}{activeAbility && <span className="bg-fuchsia-400/[0.07] px-1.5 py-0.5 text-[7px] uppercase tracking-wider text-fuchsia-200">Active</span>}{node.perk && <span className="bg-amber-300/[0.07] px-1.5 py-0.5 text-[7px] uppercase tracking-wider text-amber-200">Perk</span>}</div><p className="mt-1 text-[9px] leading-4 text-white/30">{node.effect}</p><div className="mt-2 flex gap-3 text-[7px] uppercase tracking-wider text-white/20"><span>Lv {node.minLevel}</span><span>Stage {node.minStage}</span><span>{node.cost} SP</span></div></div>
      </div>
      <div className="mt-3">{!unlocked ? <button disabled={busy || !eligible} onClick={onUnlock} className="h-8 w-full bg-violet-400/[0.07] text-[8px] font-bold uppercase tracking-widest text-violet-200 disabled:opacity-20">Unlock</button> : node.perk ? <button draggable onDragStart={onDragStart} disabled={busy} onClick={onToggle} className={`h-8 w-full text-[8px] font-bold uppercase tracking-widest ${active ? 'bg-cyan-300/10 text-cyan-100' : 'bg-white/[0.035] text-white/45'}`}>{active ? 'Active — Drag to Loadout' : 'Activate / Drag to Loadout'}</button> : <div className="grid h-8 place-items-center text-[8px] uppercase tracking-widest text-emerald-300/55">Unlocked</div>}</div>
    </motion.div>
  );
}

function SkillsView({ state, act, busy }) {
  const p = state.progression || {};
  const nodesByLane = useMemo(() => state.skillTree?.reduce((acc, node) => { (acc[node.lane || 'Core'] ||= []).push(node); return acc; }, {}) || {}, [state.skillTree]);
  const unlocked = new Set(p?.unlocked_skill_nodes || []);
  const active = new Set(p?.active_perks || []);
  const [draggingNode, setDraggingNode] = useState(null);
  const perkSlots = Math.max(3, num(p?.perk_slots, 3));

  const assignToSlot = (event) => {
    event.preventDefault();
    if (!draggingNode || active.has(draggingNode.id)) return;
    act('togglePerk', { nodeId: draggingNode.id });
    setDraggingNode(null);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end gap-4"><div><span className="text-[9px] uppercase tracking-[.28em] text-violet-300/65">Constellation Mastery Network</span><h3 className="mt-2 text-3xl font-black text-white">The Skill Tree</h3><p className="mt-2 max-w-3xl text-sm text-white/40">Levels and achievements award Skill Points. Branch into active abilities, teacher passives, stat enhancements, and equip unlocked perks into the live card loadout.</p></div><div className="ml-auto bg-violet-400/[0.06] px-5 py-3"><span className="text-[8px] uppercase tracking-widest text-white/25">Points Available</span><strong className="block text-2xl text-violet-200">{p?.skill_points || 0}</strong></div></header>

      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_center,rgba(139,92,246,.08),transparent_58%)] p-5">
        <div className="pointer-events-none absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.22) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative grid gap-5 xl:grid-cols-3">{Object.entries(nodesByLane).map(([lane, nodes]) => <Glass key={lane} className="p-4"><div className="mb-7 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-violet-300 shadow-[0_0_14px_rgba(196,181,253,.55)]" /><h4 className="text-[10px] font-bold uppercase tracking-[.2em] text-white/60">{lane} Path</h4></div><div className="space-y-5">{nodes.map((node) => { const isUnlocked = unlocked.has(node.id); const prereqOK = !node.prerequisite || unlocked.has(node.prerequisite); const eligible = num(p?.level, 1) >= num(node.minLevel) && num(p?.stage, 1) >= num(node.minStage) && prereqOK && num(p?.skill_points) >= num(node.cost); const isActive = active.has(node.id); return <SkillNode key={node.id} node={node} unlocked={isUnlocked} active={isActive} eligible={eligible} busy={busy} onUnlock={() => act('unlockSkill', { nodeId: node.id })} onToggle={() => act('togglePerk', { nodeId: node.id })} onDragStart={(event) => { setDraggingNode(node); event.dataTransfer.effectAllowed = 'move'; }} />; })}</div></Glass>)}</div>
      </div>

      <Glass className="p-5"><div className="flex items-center gap-2"><Shield className="h-4 w-4 text-amber-300" /><h4 className="text-sm font-bold text-white">Active Perk Loadout</h4><span className="ml-auto text-[9px] uppercase tracking-widest text-white/25">Drag unlocked perk nodes into a slot</span></div><div className="mt-4 grid gap-2 sm:grid-cols-3">{Array.from({ length: perkSlots }).slice(0, 3).map((_, index) => { const id = p?.active_perks?.[index]; const node = state.skillTree?.find((item) => item.id === id); return <div key={index} onDragOver={(event) => event.preventDefault()} onDrop={assignToSlot} className={`min-h-24 p-3 transition ${draggingNode ? 'bg-cyan-300/[0.055]' : 'bg-black/20'}`}><div className="text-[8px] font-mono text-white/20">SLOT 0{index + 1}</div>{node ? <div className="mt-3"><strong className="block text-xs text-amber-200">{node.name}</strong><span className="mt-1 block text-[9px] leading-4 text-white/30">{node.effect}</span></div> : <div className="mt-5 flex items-center gap-2 text-[9px] uppercase tracking-widest text-white/18"><Plus className="h-3 w-3" /> Empty perk slot</div>}</div>; })}</div></Glass>
    </div>
  );
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
      const next = response?.data || response;
      if (next?.error || !next?.progression) throw new Error(next?.error || 'Card state unavailable.');
      setState(next);
      setMessage(null);
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'Card progression could not be loaded.' });
    } finally {
      setLoading(false);
    }
  }, [card]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const unsubProgression = base44.entities.CardProgression?.subscribe?.((event) => {
      if (event?.data?.user_card_id && event.data.user_card_id === state?.userCard?.id) load();
    });
    const unsubUserCard = base44.entities.UserCard?.subscribe?.((event) => {
      if (event?.data?.id && event.data.id === state?.userCard?.id) load();
    });
    return () => { unsubProgression?.(); unsubUserCard?.(); };
  }, [load, state?.userCard?.id]);

  const act = async (action, payload = {}) => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await invoke(action, { ...card, userCardId: state?.userCard?.id || card?.userCardId }, payload);
      const next = response?.data || response;
      if(next?.error)throw new Error(next.error);
      setState(next);
      window.dispatchEvent(new CustomEvent('cardProgressionChanged',{detail:{user_card_id:next?.userCard?.id}}));
      const latest = next?.events?.[0]?.summary;
      setMessage({ type: 'success', text: latest || 'Card updated.' });
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'That card action failed.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card-scroll">
      <div className="card-scroll-shell">
        <header className="card-scroll-header">
          <div className="card-scroll-title">
            <button type="button" onClick={onBack} aria-label="Close card workspace"><ArrowLeft size={17} /></button>
            <div><span className="card-scroll-eyebrow">Forbidden Scroll</span><h1>{card?.title || card?.card_name || 'Card detail'}</h1></div>
            <button type="button" onClick={load} disabled={loading || busy} aria-label="Refresh live card state"><RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /></button>
          </div>
          <nav className="card-scroll-tabs" aria-label="Card management" role="tablist">{tabs.map(({ id, label, icon: Icon, hint }) => <button key={id} type="button" role="tab" aria-selected={tab === id} aria-controls="card-scroll-panel" title={hint} onClick={() => setTab(id)}><Icon size={15} />{label}</button>)}</nav>
        </header>
        {message && <div className="card-scroll-notice" data-error={message.type === 'error'} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</div>}
        {loading && !state ? <div className="grid flex-1 place-items-center" role="status">Loading card progression…</div> : state ? (
          <div className="card-scroll-body">
            <div className="card-scroll-grid">
              <HolographicCard card={card} progression={state.progression} userCard={state.userCard} />
              <main id="card-scroll-panel" role="tabpanel" aria-label={tabs.find(item => item.id === tab)?.label}>
                {tab === 'record' ? <RecordView card={card} state={state} /> : tab === 'skills' ? <SkillsView state={state} act={act} busy={busy} /> : tab === 'essential' ? <EssentialView state={state} act={act} busy={busy} /> : <ForgeView key={tab} section={tab} state={state} act={act} busy={busy} />}
              </main>
              <CardScrollActions userCard={state.userCard} disabled={busy || loading} onChanged={load} />
            </div>
          </div>
        ) : <div className="grid flex-1 place-content-center gap-4 p-6 text-sm"><p>Card progression is unavailable.</p><button onClick={load} className="text-cyan-200">Try again</button></div>}
      </div>
    </div>
  );
}
