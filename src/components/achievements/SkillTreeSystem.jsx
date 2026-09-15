import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity, BadgeCheck, Brain, Check, ChevronRight, CircleDot, Clock3, Coins,
  Crosshair, Crown, Eye, Flag, Gauge, Ghost, Grid3X3, Hammer, Heart, Lock,
  Map, Maximize2, Minus, Navigation, Play, Plus, Puzzle, Radar, RefreshCw,
  Rocket, Ruler, Search, Settings, Shield, Sparkles, Swords, Target, Users,
  Wind, X, Zap
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { showError, showSuccess } from '@/components/error/ErrorToast';

const ICONS = {
  activity: Activity, brain: Brain, campfire: Sparkles, circuit: Settings, clock: Clock3,
  coins: Coins, crosshair: Crosshair, crown: Crown, eye: Eye, flag: Flag,
  gauge: Gauge, ghost: Ghost, grid: Grid3X3, hammer: Hammer, heart: Heart,
  map: Map, navigation: Navigation, puzzle: Puzzle, radar: Radar, rocket: Rocket,
  ruler: Ruler, search: Search, settings: Settings, shield: Shield, sparkles: Sparkles,
  steering: Gauge, swords: Swords, target: Target, users: Users, wind: Wind,
  flame: Zap, cpu: Brain, zap: Zap,
};

const THEME_BY_GENRE = {
  shooter: ['#34d399', '#0f766e'], action: ['#fb7185', '#be123c'], fighting: ['#f97316', '#c2410c'],
  rpg: ['#c084fc', '#7e22ce'], mmorpg: ['#a78bfa', '#6d28d9'], adventure: ['#facc15', '#a16207'],
  scifi: ['#22d3ee', '#0e7490'], strategy: ['#60a5fa', '#1d4ed8'], simulation: ['#818cf8', '#4338ca'],
  sports: ['#4ade80', '#15803d'], racing: ['#fb923c', '#c2410c'], puzzle: ['#f472b6', '#be185d'],
  platformer: ['#2dd4bf', '#0f766e'], horror: ['#94a3b8', '#334155'], survival: ['#84cc16', '#4d7c0f'],
  sandbox: ['#38bdf8', '#0369a1'],
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const unwrap = (response) => {
  const body = response?.data ?? response ?? {};
  if (body?.error) throw new Error(body.error);
  return body;
};

function formatEffect(effect) {
  if (!effect) return 'Mastery path';
  const prefix = Number(effect.value) >= 0 ? '+' : '';
  return `${prefix}${effect.value}${effect.unit === '%' ? '%' : ` ${effect.unit || ''}`}`.trim();
}

function SkillTreeAtmosphere({ accent }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(15,23,42,.25),rgba(2,6,12,.94)_72%)]" />
      <motion.div
        className="absolute -left-[20%] top-[12%] h-[28%] w-[145%] rounded-[50%] blur-[56px]"
        style={{ background: `linear-gradient(90deg,transparent,${accent}13,rgba(255,255,255,.035),${accent}0d,transparent)` }}
        animate={{ x: ['-4%', '5%', '-4%'], y: [0, 20, 0], rotate: [-2, 2, -2] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -left-[15%] top-[48%] h-[18%] w-[135%] rounded-[50%] blur-[48px]"
        style={{ background: `linear-gradient(90deg,transparent,rgba(255,255,255,.025),${accent}10,transparent)` }}
        animate={{ x: ['5%', '-5%', '5%'], y: [0, -18, 0], rotate: [2, -2, 2] }}
        transition={{ duration: 23, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-[16%] left-[10%] h-[42%] w-[85%] rounded-[50%] blur-[90px]"
        style={{ background: `radial-gradient(ellipse,${accent}12,transparent 68%)` }}
        animate={{ scaleX: [1, 1.08, 1], opacity: [.65, .95, .65] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)', backgroundSize: '52px 52px', maskImage: 'radial-gradient(circle at 50% 50%, black 12%, transparent 82%)' }} />
    </div>
  );
}

function DemoPanel({ node, accent }) {
  const kind = node?.demo?.kind || node?.effect?.demo || 'system';
  const before = kind === 'ammo' ? '30' : kind === 'damage' || kind === 'crit' ? '100' : kind === 'reload' ? '2.4s' : kind === 'stamina' ? '100' : kind === 'heal' ? '42 HP' : 'BASE';
  const after = kind === 'ammo'
    ? `${30 + Number(node?.effect?.value || 0)}`
    : kind === 'damage' || kind === 'crit'
      ? `${Math.round(100 * (1 + Number(node?.effect?.value || 0) / 100))}`
      : kind === 'reload'
        ? `${Math.max(0.1, 2.4 * (1 - Number(node?.effect?.value || 0) / 100)).toFixed(2)}s`
        : kind === 'heal'
          ? `${42 + Number(node?.effect?.value || 0)} HP`
          : formatEffect(node?.effect);

  return (
    <div className="relative h-full min-h-[300px] overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#050912]/90">
      <div className="absolute inset-0 opacity-50" style={{ background: `radial-gradient(circle at 65% 45%, ${accent}2e, transparent 42%), linear-gradient(135deg, rgba(255,255,255,.035), transparent 35%)` }} />
      <SkillTreeAtmosphere accent={accent} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .15 }} className="relative z-10 flex h-full min-h-[300px] flex-col p-5">
        <div className="flex items-center justify-between"><span className="text-[9px] font-black uppercase tracking-[.22em] text-white/35">Live perk demonstration</span><span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[8px] uppercase tracking-widest text-white/35">Simulation</span></div>
        <div className="mt-8 grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5 text-center"><span className="text-[8px] uppercase tracking-[.2em] text-white/25">Without node</span><strong className="mt-2 block text-3xl font-black text-white/55">{before}</strong><span className="mt-1 block text-[9px] text-white/25">Base game result</span></div>
          <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.4, repeat: Infinity }}><ChevronRight className="h-6 w-6" style={{ color: accent }} /></motion.div>
          <motion.div animate={{ boxShadow: [`0 0 0 ${accent}00`, `0 0 34px ${accent}25`, `0 0 0 ${accent}00`] }} transition={{ duration: 2.2, repeat: Infinity }} className="rounded-2xl border p-5 text-center" style={{ borderColor: `${accent}55`, background: `${accent}12` }}><span className="text-[8px] uppercase tracking-[.2em]" style={{ color: `${accent}cc` }}>With node</span><motion.strong initial={{ scale: .92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: .35 }} className="mt-2 block text-3xl font-black text-white">{after}</motion.strong><span className="mt-1 block text-[9px] text-white/35">Integrated result</span></motion.div>
        </div>
        <div className="mt-5 rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 text-[10px] leading-5 text-white/38">This demonstration previews the Atom x Eve modifier contract. The supported game's own combat, animation and balance systems remain authoritative.</div>
      </motion.div>
    </div>
  );
}

function PerkShowcase({ node, status, progress, compatibleGames, accent, onClose, onUnlock, busy }) {
  const Icon = ICONS[node?.branch_icon] || CircleDot;
  const levelReady = Number(progress?.genre_level_snapshot || 1) >= Number(node?.required_level || 1);
  const pointsReady = Number(progress?.available_points || 0) >= Number(node?.cost || 0);
  const prereqReady = !node?.prerequisite_id || (progress?.unlocked_node_ids || []).includes(node.prerequisite_id);
  const canUnlock = status !== 'unlocked' && levelReady && pointsReady && prereqReady;
  const availableIn = compatibleGames.filter((game) => {
    const keys = game.supported_effect_keys || [];
    const supports = keys.includes('*') || keys.includes(node?.effect?.key);
    return supports && (!node?.exclusive || game.tier === 'exclusive');
  });
  const typeLabel = node?.node_type === 'ability' ? 'Ability' : 'Perk';

  return (
    <motion.div data-card-overlay="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[12000] flex items-center justify-center p-5 md:p-9" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-[#02050a]/78 backdrop-blur-2xl" />
      <motion.div initial={{ y: 24, scale: .985, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 18, scale: .99, opacity: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 240 }} className="relative z-10 grid max-h-[92vh] w-full max-w-[1180px] grid-cols-1 overflow-y-auto rounded-[28px] border border-white/[0.09] bg-[linear-gradient(145deg,rgba(7,14,25,.97),rgba(3,7,13,.96))] shadow-[0_35px_100px_rgba(0,0,0,.65)] lg:grid-cols-[360px_1fr]">
        <button onClick={onClose} className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/30 text-white/55 backdrop-blur-xl hover:text-white"><X className="h-4 w-4" /></button>
        <motion.aside initial={{ x: -18, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: .08 }} className="border-b border-white/[0.07] p-7 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between"><span className="text-[9px] font-black uppercase tracking-[.24em] text-white/28">{node.branch_name} · {typeLabel}</span>{node.exclusive && <span className="rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-widest" style={{ borderColor: `${accent}55`, color: accent, background: `${accent}12` }}>Exclusive</span>}</div>
          <div className="mt-7 grid h-24 w-24 place-items-center rounded-[24px] border" style={{ borderColor: `${accent}50`, background: `linear-gradient(145deg,${accent}22,rgba(255,255,255,.02))`, boxShadow: `0 0 38px ${accent}1f` }}><Icon className="h-10 w-10" style={{ color: accent }} /></div>
          <h2 className="mt-6 text-3xl font-black tracking-tight text-white">{node.name}</h2>
          {node.ability_name && <p className="mt-1 text-[9px] font-black uppercase tracking-[.18em]" style={{ color: `${accent}aa` }}>Attached to {node.ability_name}</p>}
          <p className="mt-3 text-sm leading-6 text-white/45">{node.description}</p>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white/[0.035] p-3"><span className="text-[8px] uppercase tracking-widest text-white/25">Effect</span><strong className="mt-1 block text-lg text-white">{formatEffect(node.effect)}</strong></div>
            <div className="rounded-xl bg-white/[0.035] p-3"><span className="text-[8px] uppercase tracking-widest text-white/25">Cost</span><strong className="mt-1 block text-lg text-white">{node.cost} SP</strong></div>
            <div className="col-span-2 rounded-xl bg-white/[0.035] p-3"><span className="text-[8px] uppercase tracking-widest text-white/25">Applies to</span><strong className="mt-1 block text-xs leading-5 text-white/70">{node.effect?.scope}</strong></div>
          </div>
          <div className="mt-6 space-y-2 text-[10px]">
            <div className="flex items-center justify-between text-white/35"><span>Genre level</span><strong className={levelReady ? 'text-emerald-300' : 'text-amber-300'}>{node.required_level}</strong></div>
            <div className="flex items-center justify-between text-white/35"><span>Prerequisite</span><strong className={prereqReady ? 'text-emerald-300' : 'text-amber-300'}>{node.prerequisite_id ? (prereqReady ? 'Ready' : 'Required') : 'None'}</strong></div>
            <div className="flex items-center justify-between gap-3 text-white/35"><span>Integration key</span><code className="truncate text-cyan-200/55">{node.effect?.key}</code></div>
          </div>
        </motion.aside>
        <section className="p-7 lg:p-8">
          {node.video_url ? <motion.video initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={node.video_url} autoPlay muted loop playsInline className="min-h-[300px] w-full rounded-[22px] object-cover" /> : <DemoPanel node={node} accent={accent} />}
          <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: .22 }} className="mt-5 grid gap-4 md:grid-cols-[1.3fr_.7fr]">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"><span className="text-[9px] font-black uppercase tracking-[.2em] text-white/30">What changes in-game</span><p className="mt-3 text-sm leading-6 text-white/56">{node.effect?.description}</p><div className="mt-4 flex items-start gap-2 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.035] p-3"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200/60" /><p className="text-[10px] leading-5 text-cyan-50/42">The modifier only reaches games that explicitly support this Atom x Eve effect key. Unsupported games receive no gameplay changes.</p></div></div>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"><span className="text-[9px] font-black uppercase tracking-[.2em] text-white/30">Compatible games</span>{availableIn.length ? <div className="mt-3 space-y-2">{availableIn.slice(0, 5).map((game) => <div key={game.game_id} className="flex items-center gap-2 rounded-xl bg-black/20 p-2"><div className="h-8 w-8 overflow-hidden rounded-lg bg-white/5">{game.cover_image && <img src={game.cover_image} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><strong className="block truncate text-[10px] text-white/70">{game.title}</strong><span className="text-[8px] uppercase tracking-wider text-white/25">{game.tier}</span></div></div>)}</div> : <p className="mt-3 text-[10px] leading-5 text-white/32">No registered game exposes this modifier yet. The node can remain unlocked and becomes effective automatically when a compatible title enables it.</p>}</div>
          </motion.div>
          <div className="mt-5 flex items-center gap-3">
            {status === 'unlocked' ? <div className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] text-[10px] font-black uppercase tracking-widest text-emerald-200"><Check className="h-4 w-4" /> {typeLabel} active</div> : <button disabled={busy || !canUnlock} onClick={() => onUnlock(node)} className="h-12 flex-1 rounded-xl text-[10px] font-black uppercase tracking-[.18em] text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-25" style={{ background: accent }}>{busy ? 'Unlocking…' : !levelReady ? `Requires genre level ${node.required_level}` : !prereqReady ? 'Unlock prerequisite first' : !pointsReady ? `Need ${node.cost} skill points` : `Unlock ${typeLabel.toLowerCase()} · ${node.cost} SP`}</button>}
            <button onClick={onClose} className="h-12 rounded-xl border border-white/10 bg-white/[0.035] px-5 text-[9px] font-bold uppercase tracking-wider text-white/45 hover:bg-white/[0.06] hover:text-white">Back to web</button>
          </div>
        </section>
      </motion.div>
    </motion.div>
  );
}

function ConnectionLayer({ nodes, unlocked, accent, world }) {
  const byId = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  return (
    <svg className="pointer-events-none absolute inset-0" width={world.width} height={world.height} viewBox={`0 0 ${world.width} ${world.height}`}>
      {nodes.flatMap((node) => {
        const links = [...new Set((node.link_ids || (node.prerequisite_id ? [node.prerequisite_id] : [])).filter(Boolean))];
        return links.map((parentId) => {
          const parent = byId.get(parentId);
          if (!parent) return null;
          const active = unlocked.has(parent.id) && unlocked.has(node.id);
          const ready = unlocked.has(parent.id);
          const dx = node.x - parent.x;
          const dy = node.y - parent.y;
          const c1x = parent.x + dx * .42 - dy * .04;
          const c1y = parent.y + dy * .42 + dx * .04;
          const c2x = parent.x + dx * .68 + dy * .04;
          const c2y = parent.y + dy * .68 - dx * .04;
          const d = `M ${parent.x} ${parent.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${node.x} ${node.y}`;
          return <g key={`${node.id}-${parentId}`}><path d={d} fill="none" stroke="rgba(255,255,255,.055)" strokeWidth="2" vectorEffect="non-scaling-stroke" /><path d={d} fill="none" stroke={active ? accent : ready ? `${accent}48` : 'transparent'} strokeWidth={active ? '2.2' : '1.6'} vectorEffect="non-scaling-stroke" style={active ? { filter: `drop-shadow(0 0 4px ${accent})` } : undefined} />{active && <path d={d} fill="none" stroke="#fff" strokeWidth="1.8" strokeDasharray="1 14" opacity=".55" vectorEffect="non-scaling-stroke"><animate attributeName="stroke-dashoffset" from="15" to="0" dur="1.5s" repeatCount="indefinite" /></path>}</g>;
        });
      })}
    </svg>
  );
}

function WebNode({ node, status, accent, scale, onOpen, onFocus }) {
  const Icon = ICONS[node.branch_icon] || CircleDot;
  const active = status === 'unlocked';
  const reachable = status === 'reachable';
  const isCore = node.node_type === 'core';
  const isGateway = node.node_type === 'gateway';
  const isAbility = node.node_type === 'ability';
  const size = isCore ? 112 : isGateway ? 76 : isAbility ? 66 : 40;
  const labelVisible = isAbility || isGateway || isCore || scale >= .72;

  const activate = () => {
    if (isCore || isGateway) onFocus(node);
    else onOpen(node);
  };

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: .96 }}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => { event.stopPropagation(); activate(); }}
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2 outline-none"
      style={{ left: node.x, top: node.y }}
      title={`${node.name} · Level ${node.required_level}`}
    >
      <div className="relative grid place-items-center rounded-full border-2 transition-all duration-300" style={{ width: size, height: size, borderColor: active ? accent : reachable ? `${accent}82` : 'rgba(255,255,255,.09)', background: isCore ? `radial-gradient(circle,${accent}42,rgba(4,9,17,.96) 66%)` : active ? `linear-gradient(145deg,${accent}30,rgba(4,9,17,.95))` : 'rgba(4,9,17,.91)', boxShadow: isCore ? `0 0 48px ${accent}2f, inset 0 1px 0 rgba(255,255,255,.16)` : active ? `0 0 24px ${accent}2d, inset 0 1px 0 rgba(255,255,255,.11)` : reachable ? `0 0 15px ${accent}15` : 'inset 0 1px 0 rgba(255,255,255,.03)' }}>
        {active && <motion.div animate={{ scale: [1, 1.22, 1], opacity: [.16, .025, .16] }} transition={{ duration: isCore ? 4.4 : 3.1, repeat: Infinity }} className="absolute -inset-3 rounded-full" style={{ background: accent }} />}
        {isAbility && <div className="absolute -inset-[7px] rounded-full border border-white/[0.055]" />}
        <Icon className="relative z-10" style={{ width: isCore ? 34 : isGateway ? 24 : isAbility ? 22 : 14, height: isCore ? 34 : isGateway ? 24 : isAbility ? 22 : 14, color: active ? '#fff' : reachable ? accent : 'rgba(255,255,255,.2)' }} />
        {node.node_type === 'perk' && <span className="absolute -bottom-1 rounded-full border border-white/10 bg-[#06101b] px-1 text-[7px] font-black text-white/35">{node.cost}</span>}
        {status === 'locked' && !isCore && !isGateway && <div className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full border border-white/10 bg-[#050a12]"><Lock className="h-2 w-2 text-white/25" /></div>}
        {node.exclusive && <Crown className="absolute -top-4 h-3 w-3" style={{ color: accent }} />}
      </div>
      {labelVisible && <div className="pointer-events-none absolute left-1/2 top-full mt-2 w-36 -translate-x-1/2 text-center"><strong className={`${isCore ? 'text-[10px]' : 'text-[8px]'} block font-black uppercase tracking-wide ${active ? 'text-white/72' : reachable ? 'text-white/52' : 'text-white/22'}`}>{node.short_name || node.name}</strong>{!isCore && <span className="mt-0.5 block text-[7px] text-white/20">Lv {node.required_level}{isAbility ? ` · ${node.cost} SP` : ''}</span>}</div>}
    </motion.button>
  );
}

export default function SkillTreeSystem({ genre }) {
  const genreId = genre?.id || 'shooter';
  const [state, setState] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [respecArmed, setRespecArmed] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState({ x: 0, y: 0, scale: .5 });
  const [dragging, setDragging] = useState(false);
  const [accent] = THEME_BY_GENRE[genreId] || ['#38bdf8', '#0369a1'];
  const viewportRef = useRef(null);
  const dragRef = useRef(null);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const body = unwrap(await base44.functions.invoke('genreSkillTree', { action: 'get_state', data: { genre_id: genreId } }));
      setState(body);
    } catch (err) {
      setError(err.message || 'Could not load skill tree.');
    } finally { setLoading(false); }
  };

  useEffect(() => { setSelectedNode(null); setRespecArmed(false); load(); }, [genreId]);

  const nodes = state?.catalog?.nodes || [];
  const progress = state?.progress || {};
  const world = state?.catalog?.world || { width: 2600, height: 2400, center_x: 1300, center_y: 1200, level_rings: [] };
  const unlocked = useMemo(() => new Set(progress.unlocked_node_ids || []), [progress.unlocked_node_ids]);

  const nodeStatus = useCallback((node) => {
    if (unlocked.has(node.id)) return 'unlocked';
    if (Number(progress.genre_level_snapshot || 1) < Number(node.required_level || 1)) return 'locked';
    if (node.prerequisite_id && !unlocked.has(node.prerequisite_id)) return 'locked';
    return 'reachable';
  }, [progress.genre_level_snapshot, unlocked]);

  const fitView = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || !world?.width || !world?.height) return;
    const rect = viewport.getBoundingClientRect();
    const scale = clamp(Math.min((rect.width - 80) / world.width, (rect.height - 80) / world.height), .28, .78);
    setView({ x: (rect.width - world.width * scale) / 2, y: (rect.height - world.height * scale) / 2, scale });
  }, [world?.width, world?.height]);

  useEffect(() => {
    if (!loading && state?.catalog) {
      const id = requestAnimationFrame(fitView);
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [loading, genreId, state?.catalog?.node_count, fitView]);

  useEffect(() => {
    const onResize = () => fitView();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [fitView]);

  const focusNode = useCallback((node, nextScale = 1) => {
    const viewport = viewportRef.current;
    if (!viewport || !node) return;
    const rect = viewport.getBoundingClientRect();
    const scale = clamp(nextScale, .35, 1.65);
    setView({ x: rect.width / 2 - node.x * scale, y: rect.height / 2 - node.y * scale, scale });
  }, []);

  const focusBranch = useCallback((node) => {
    if (node.node_type === 'core') { fitView(); return; }
    focusNode(node, .82);
  }, [fitView, focusNode]);

  const setScaleAroundCenter = (nextScale) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    setView((prev) => {
      const scale = clamp(nextScale, .28, 1.65);
      const worldX = (cx - prev.x) / prev.scale;
      const worldY = (cy - prev.y) / prev.scale;
      return { x: cx - worldX * scale, y: cy - worldY * scale, scale };
    });
  };

  const onWheel = (event) => {
    event.preventDefault();
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    setView((prev) => {
      const worldX = (px - prev.x) / prev.scale;
      const worldY = (py - prev.y) / prev.scale;
      const scale = clamp(prev.scale * (event.deltaY < 0 ? 1.11 : .9), .28, 1.65);
      return { x: px - worldX * scale, y: py - worldY * scale, scale };
    });
  };

  const onPointerDown = (event) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, viewX: view.x, viewY: view.y };
    setDragging(true);
  };

  const onPointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setView((prev) => ({ ...prev, x: drag.viewX + event.clientX - drag.startX, y: drag.viewY + event.clientY - drag.startY }));
  };

  const endPointer = (event) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
    setDragging(false);
  };

  const unlockNode = async (node) => {
    if (busy) return;
    setBusy(true);
    try {
      const body = unwrap(await base44.functions.invoke('genreSkillTree', { action: 'unlock', data: { genre_id: genreId, node_id: node.id } }));
      setState((prev) => ({ ...prev, progress: body.progress }));
      showSuccess(`${node.name} unlocked.`);
    } catch (err) { showError(err, 'Unlock Skill'); }
    finally { setBusy(false); }
  };

  const respec = async () => {
    if (!respecArmed) { setRespecArmed(true); window.setTimeout(() => setRespecArmed(false), 4000); return; }
    setBusy(true);
    try {
      const body = unwrap(await base44.functions.invoke('genreSkillTree', { action: 'respec', data: { genre_id: genreId } }));
      setState((prev) => ({ ...prev, progress: body.progress })); setSelectedNode(null); setRespecArmed(false); showSuccess(`${body.refunded || 0} skill points refunded.`);
    } catch (err) { showError(err, 'Respec Skill Tree'); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="grid min-h-[680px] place-items-center"><div className="flex items-center gap-3 text-xs uppercase tracking-[.2em] text-white/35"><RefreshCw className="h-4 w-4 animate-spin" /> Building mastery web</div></div>;
  if (error) return <div className="grid min-h-[620px] place-items-center text-center"><div><p className="text-sm text-rose-200/70">{error}</p><button onClick={load} className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2 text-[10px] uppercase tracking-widest text-white/55">Retry</button></div></div>;

  const catalog = state?.catalog;
  const integrations = state?.compatible_games || [];
  const abilityCount = nodes.filter((node) => node.node_type === 'ability').length;
  const perkCount = nodes.filter((node) => node.node_type === 'perk').length;
  const meaningfulUnlocked = nodes.filter((node) => !['core', 'gateway'].includes(node.node_type) && unlocked.has(node.id)).length;

  return (
    <div className="relative w-full font-sans text-white">
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div className="min-w-0 flex-1"><span className="text-[9px] font-black uppercase tracking-[.25em]" style={{ color: `${accent}b8` }}>Constellation mastery web</span><h2 className="mt-1 text-3xl font-black tracking-tight text-white">{catalog?.name || genre?.name} Skill Tree</h2><p className="mt-2 max-w-3xl text-xs leading-5 text-white/35">A level-gated web of abilities and attached perk choices. Drag the field to explore, scroll to zoom, and open any ability or perk for its cinematic explanation.</p></div>
        <div className="flex items-center gap-2">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-5 py-3"><span className="block text-[8px] uppercase tracking-widest text-white/25">Genre level</span><strong className="mt-1 block text-xl">{progress.genre_level_snapshot || 1}</strong></div>
          <div className="rounded-2xl border px-5 py-3" style={{ borderColor: `${accent}30`, background: `${accent}0d` }}><span className="block text-[8px] uppercase tracking-widest text-white/25">Skill points</span><strong className="mt-1 block text-xl" style={{ color: accent }}>{progress.available_points || 0}<small className="ml-1 text-[10px] text-white/25">/ {progress.earned_points || 0}</small></strong></div>
          <button disabled={busy || meaningfulUnlocked === 0} onClick={respec} className={`h-[58px] rounded-2xl border px-4 text-[8px] font-black uppercase tracking-wider transition disabled:opacity-20 ${respecArmed ? 'border-rose-300/30 bg-rose-400/10 text-rose-200' : 'border-white/[0.07] bg-white/[0.03] text-white/35 hover:text-white'}`}>{respecArmed ? 'Click again to respec' : 'Respec'}</button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-[9px] uppercase tracking-wider text-white/25"><span className="rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-1.5">{nodes.length} node web</span><span className="rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-1.5">{abilityCount} abilities · {perkCount} attached perks</span><span className="rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-1.5">{meaningfulUnlocked} unlocked</span><span className="rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-1.5">{integrations.length} integrated games</span></div>

      <div
        ref={viewportRef}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onDoubleClick={fitView}
        className={`relative h-[720px] min-h-[620px] overflow-hidden rounded-[26px] border border-white/[0.075] bg-[#030811] shadow-[inset_0_1px_0_rgba(255,255,255,.05),0_28px_80px_rgba(0,0,0,.36)] ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ touchAction: 'none' }}
      >
        <SkillTreeAtmosphere accent={accent} />

        <div className="pointer-events-none absolute left-5 top-5 z-30 rounded-2xl border border-white/[0.07] bg-black/25 px-4 py-3 backdrop-blur-xl"><span className="text-[8px] font-black uppercase tracking-[.2em] text-white/28">Navigation</span><p className="mt-1 text-[9px] text-white/35">Drag to move · Wheel to zoom · Double-click to fit</p></div>

        <div className="absolute right-4 top-4 z-40 flex items-center gap-1 rounded-2xl border border-white/[0.08] bg-black/35 p-1.5 backdrop-blur-xl">
          <button onPointerDown={(event) => event.stopPropagation()} onClick={() => setScaleAroundCenter(view.scale - .12)} className="grid h-9 w-9 place-items-center rounded-xl text-white/45 hover:bg-white/[0.07] hover:text-white" title="Zoom out"><Minus className="h-4 w-4" /></button>
          <span className="min-w-12 text-center text-[9px] font-black text-white/35">{Math.round(view.scale * 100)}%</span>
          <button onPointerDown={(event) => event.stopPropagation()} onClick={() => setScaleAroundCenter(view.scale + .12)} className="grid h-9 w-9 place-items-center rounded-xl text-white/45 hover:bg-white/[0.07] hover:text-white" title="Zoom in"><Plus className="h-4 w-4" /></button>
          <button onPointerDown={(event) => event.stopPropagation()} onClick={fitView} className="grid h-9 w-9 place-items-center rounded-xl text-white/45 hover:bg-white/[0.07] hover:text-white" title="Fit complete web"><Maximize2 className="h-4 w-4" /></button>
        </div>

        <motion.div className="absolute left-0 top-0" animate={{ x: view.x, y: view.y, scale: view.scale }} transition={dragging ? { duration: 0 } : { type: 'spring', damping: 34, stiffness: 300, mass: .55 }} style={{ width: world.width, height: world.height, transformOrigin: '0 0' }}>
          {(world.level_rings || []).map((ring) => <div key={ring.level} className="pointer-events-none absolute rounded-full border border-white/[0.045]" style={{ width: ring.radius * 2, height: ring.radius * 2, left: world.center_x - ring.radius, top: world.center_y - ring.radius, boxShadow: ring.level === progress.genre_level_snapshot ? `0 0 28px ${accent}12 inset` : undefined }}><span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06] bg-[#050a12]/85 px-3 py-1 text-[9px] font-black tracking-[.18em] text-white/20">LEVEL {ring.level}</span></div>)}

          <ConnectionLayer nodes={nodes} unlocked={unlocked} accent={accent} world={world} />

          {(catalog?.branches || []).map((branch) => {
            const gateway = nodes.find((node) => node.node_type === 'gateway' && node.branch_id === branch.id);
            if (!gateway) return null;
            return <div key={branch.id} className="pointer-events-none absolute -translate-x-1/2 -translate-y-[90px] text-center" style={{ left: gateway.x, top: gateway.y }}><span className="text-[9px] font-black uppercase tracking-[.26em]" style={{ color: `${accent}8a` }}>{branch.name}</span></div>;
          })}

          {nodes.map((node) => <WebNode key={node.id} node={node} status={nodeStatus(node)} accent={accent} scale={view.scale} onOpen={(target) => setSelectedNode(target)} onFocus={focusBranch} />)}
        </motion.div>

        <div className="pointer-events-none absolute bottom-4 left-4 z-30 flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-black/25 px-4 py-3 backdrop-blur-xl"><span className="flex items-center gap-1.5 text-[8px] uppercase tracking-wider text-white/30"><span className="h-3 w-3 rounded-full border-2" style={{ borderColor: accent }} /> Ability</span><span className="flex items-center gap-1.5 text-[8px] uppercase tracking-wider text-white/30"><span className="h-2.5 w-2.5 rounded-full border border-white/30" /> Perk</span><span className="flex items-center gap-1.5 text-[8px] uppercase tracking-wider text-white/30"><Crown className="h-3 w-3" style={{ color: accent }} /> Exclusive</span></div>
        <div className="pointer-events-none absolute bottom-4 right-4 z-30 max-w-[330px] rounded-2xl border border-white/[0.06] bg-black/25 p-3 backdrop-blur-xl"><div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[.18em] text-white/28"><Play className="h-3 w-3" /> Inspect the web</div><p className="mt-1 text-[9px] leading-4 text-white/25">Large nodes are abilities. Each ability blooms into seven smaller perk choices, with deeper paths opening as your genre level increases.</p></div>
      </div>

      <AnimatePresence>{selectedNode && <PerkShowcase node={selectedNode} status={nodeStatus(selectedNode)} progress={progress} compatibleGames={integrations} accent={accent} busy={busy} onClose={() => setSelectedNode(null)} onUnlock={unlockNode} />}</AnimatePresence>
    </div>
  );
}
