import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity, BadgeCheck, Brain, Check, ChevronRight, CircleDot, Clock3, Coins,
  Crosshair, Crown, Eye, Flag, Gauge, Ghost, Grid3X3, Hammer,
  Heart, Lock, Map, Navigation, Play, Puzzle, Radar, RefreshCw, Rocket,
  Ruler, Search, Settings, Shield, Sparkles, Swords, Target, Users,
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

const unwrap = (response) => {
  const body = response?.data ?? response ?? {};
  if (body?.error) throw new Error(body.error);
  return body;
};

function formatEffect(effect) {
  if (!effect) return 'Integration effect';
  const prefix = Number(effect.value) >= 0 ? '+' : '';
  return `${prefix}${effect.value}${effect.unit === '%' ? '%' : ` ${effect.unit || ''}`}`.trim();
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
    <div className="relative h-full min-h-[280px] overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#050912]/90">
      <div className="absolute inset-0 opacity-50" style={{ background: `radial-gradient(circle at 65% 45%, ${accent}2e, transparent 42%), linear-gradient(135deg, rgba(255,255,255,.035), transparent 35%)` }} />
      <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .15 }} className="relative z-10 flex h-full min-h-[280px] flex-col p-5">
        <div className="flex items-center justify-between"><span className="text-[9px] font-black uppercase tracking-[.22em] text-white/35">Live perk demonstration</span><span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[8px] uppercase tracking-widest text-white/35">Simulation</span></div>
        <div className="mt-8 grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5 text-center"><span className="text-[8px] uppercase tracking-[.2em] text-white/25">Without perk</span><strong className="mt-2 block text-3xl font-black text-white/55">{before}</strong><span className="mt-1 block text-[9px] text-white/25">Base game result</span></div>
          <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.4, repeat: Infinity }}><ChevronRight className="h-6 w-6" style={{ color: accent }} /></motion.div>
          <motion.div animate={{ boxShadow: [`0 0 0 ${accent}00`, `0 0 34px ${accent}25`, `0 0 0 ${accent}00`] }} transition={{ duration: 2.2, repeat: Infinity }} className="rounded-2xl border p-5 text-center" style={{ borderColor: `${accent}55`, background: `${accent}12` }}><span className="text-[8px] uppercase tracking-[.2em]" style={{ color: `${accent}cc` }}>With perk</span><motion.strong initial={{ scale: .92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: .35 }} className="mt-2 block text-3xl font-black text-white">{after}</motion.strong><span className="mt-1 block text-[9px] text-white/35">Integrated result</span></motion.div>
        </div>
        <div className="mt-5 rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 text-[10px] leading-5 text-white/38">This preview demonstrates the modifier contract. The final animation, weapon behavior and exact balancing remain controlled by each supported game.</div>
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
    const tier = !node?.exclusive || game.tier === 'exclusive';
    return supports && tier;
  });

  return (
    <motion.div data-card-overlay="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[12000] flex items-center justify-center p-5 md:p-9" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-[#02050a]/78 backdrop-blur-2xl" />
      <motion.div initial={{ y: 24, scale: .985, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 18, scale: .99, opacity: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 240 }} className="relative z-10 grid max-h-[92vh] w-full max-w-[1180px] grid-cols-1 overflow-y-auto rounded-[28px] border border-white/[0.09] bg-[linear-gradient(145deg,rgba(7,14,25,.97),rgba(3,7,13,.96))] shadow-[0_35px_100px_rgba(0,0,0,.65)] lg:grid-cols-[360px_1fr]">
        <button onClick={onClose} className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/30 text-white/55 backdrop-blur-xl hover:text-white"><X className="h-4 w-4" /></button>

        <motion.aside initial={{ x: -18, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: .08 }} className="border-b border-white/[0.07] p-7 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between"><span className="text-[9px] font-black uppercase tracking-[.24em] text-white/28">{node.branch_name} · Tier {node.tier}</span>{node.exclusive && <span className="rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-widest" style={{ borderColor: `${accent}55`, color: accent, background: `${accent}12` }}>Exclusive</span>}</div>
          <div className="mt-7 grid h-24 w-24 place-items-center rounded-[24px] border" style={{ borderColor: `${accent}50`, background: `linear-gradient(145deg,${accent}22,rgba(255,255,255,.02))`, boxShadow: `0 0 38px ${accent}1f` }}><Icon className="h-10 w-10" style={{ color: accent }} /></div>
          <h2 className="mt-6 text-3xl font-black tracking-tight text-white">{node.name}</h2>
          <p className="mt-3 text-sm leading-6 text-white/45">{node.description}</p>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white/[0.035] p-3"><span className="text-[8px] uppercase tracking-widest text-white/25">Effect</span><strong className="mt-1 block text-lg text-white">{formatEffect(node.effect)}</strong></div>
            <div className="rounded-xl bg-white/[0.035] p-3"><span className="text-[8px] uppercase tracking-widest text-white/25">Cost</span><strong className="mt-1 block text-lg text-white">{node.cost} SP</strong></div>
            <div className="col-span-2 rounded-xl bg-white/[0.035] p-3"><span className="text-[8px] uppercase tracking-widest text-white/25">Applies to</span><strong className="mt-1 block text-xs leading-5 text-white/70">{node.effect?.scope}</strong></div>
          </div>
          <div className="mt-6 space-y-2 text-[10px]">
            <div className="flex items-center justify-between text-white/35"><span>Genre level</span><strong className={levelReady ? 'text-emerald-300' : 'text-amber-300'}>{node.required_level}</strong></div>
            <div className="flex items-center justify-between text-white/35"><span>Previous node</span><strong className={prereqReady ? 'text-emerald-300' : 'text-amber-300'}>{node.prerequisite_id ? (prereqReady ? 'Ready' : 'Required') : 'None'}</strong></div>
            <div className="flex items-center justify-between text-white/35"><span>Integration key</span><code className="text-cyan-200/55">{node.effect?.key}</code></div>
          </div>
        </motion.aside>

        <section className="p-7 lg:p-8">
          {node.video_url ? <motion.video initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={node.video_url} autoPlay muted loop playsInline className="min-h-[280px] w-full rounded-[22px] object-cover" /> : <DemoPanel node={node} accent={accent} />}
          <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: .22 }} className="mt-5 grid gap-4 md:grid-cols-[1.3fr_.7fr]">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"><span className="text-[9px] font-black uppercase tracking-[.2em] text-white/30">What changes in-game</span><p className="mt-3 text-sm leading-6 text-white/56">{node.effect?.description}</p><div className="mt-4 flex items-start gap-2 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.035] p-3"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200/60" /><p className="text-[10px] leading-5 text-cyan-50/42">Unlocked perks are stored on your Atom x Eve account. A supported game requests your validated modifier set through the Atom x Eve perk runtime. Unsupported games receive no gameplay changes.</p></div></div>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"><span className="text-[9px] font-black uppercase tracking-[.2em] text-white/30">Compatible games</span>{availableIn.length ? <div className="mt-3 space-y-2">{availableIn.slice(0, 5).map((game) => <div key={game.game_id} className="flex items-center gap-2 rounded-xl bg-black/20 p-2"><div className="h-8 w-8 overflow-hidden rounded-lg bg-white/5">{game.cover_image && <img src={game.cover_image} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><strong className="block truncate text-[10px] text-white/70">{game.title}</strong><span className="text-[8px] uppercase tracking-wider text-white/25">{game.tier}</span></div></div>)}</div> : <p className="mt-3 text-[10px] leading-5 text-white/32">No currently registered game integration exposes this effect yet. The perk stays unlocked on your account and becomes active automatically when a compatible title enables it.</p>}</div>
          </motion.div>
          <div className="mt-5 flex items-center gap-3">
            {status === 'unlocked' ? <div className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] text-[10px] font-black uppercase tracking-widest text-emerald-200"><Check className="h-4 w-4" /> Perk unlocked</div> : <button disabled={busy || !canUnlock} onClick={() => onUnlock(node)} className="h-12 flex-1 rounded-xl text-[10px] font-black uppercase tracking-[.18em] text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-25" style={{ background: accent }}>{busy ? 'Unlocking…' : !levelReady ? `Requires genre level ${node.required_level}` : !prereqReady ? 'Unlock previous branch perk first' : !pointsReady ? `Need ${node.cost} skill points` : `Unlock perk · ${node.cost} SP`}</button>}
            <button onClick={onClose} className="h-12 rounded-xl border border-white/10 bg-white/[0.035] px-5 text-[9px] font-bold uppercase tracking-wider text-white/45 hover:bg-white/[0.06] hover:text-white">Back to tree</button>
          </div>
        </section>
      </motion.div>
    </motion.div>
  );
}

function ConnectionLayer({ nodes, unlocked, accent }) {
  return <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">{nodes.map((node) => { if (!node.prerequisite_id) return null; const parent = nodes.find((n) => n.id === node.prerequisite_id); if (!parent) return null; const active = unlocked.has(parent.id) && unlocked.has(node.id); const ready = unlocked.has(parent.id); const mx = (parent.x + node.x) / 2; const d = `M ${parent.x} ${parent.y} C ${mx} ${parent.y}, ${mx} ${node.y}, ${node.x} ${node.y}`; return <g key={node.id}><path d={d} fill="none" stroke="rgba(255,255,255,.09)" strokeWidth="2" vectorEffect="non-scaling-stroke" /><path d={d} fill="none" stroke={active ? accent : ready ? `${accent}66` : 'transparent'} strokeWidth={active ? '2.6' : '2'} vectorEffect="non-scaling-stroke" style={active ? { filter: `drop-shadow(0 0 5px ${accent})` } : undefined} />{active && <path d={d} fill="none" stroke="#fff" strokeWidth="2.2" strokeDasharray="1 11" opacity=".7" vectorEffect="non-scaling-stroke"><animate attributeName="stroke-dashoffset" from="12" to="0" dur="1.3s" repeatCount="indefinite" /></path>}</g>; })}</svg>;
}

export default function SkillTreeSystem({ genre }) {
  const genreId = genre?.id || 'shooter';
  const [state, setState] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [respecArmed, setRespecArmed] = useState(false);
  const [error, setError] = useState('');
  const [accent] = THEME_BY_GENRE[genreId] || ['#38bdf8', '#0369a1'];

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
  const unlocked = useMemo(() => new Set(progress.unlocked_node_ids || []), [progress.unlocked_node_ids]);

  const nodeStatus = (node) => {
    if (unlocked.has(node.id)) return 'unlocked';
    if (Number(progress.genre_level_snapshot || 1) < Number(node.required_level || 1)) return 'locked';
    if (node.prerequisite_id && !unlocked.has(node.prerequisite_id)) return 'locked';
    return 'reachable';
  };

  const unlockNode = async (node) => {
    if (busy) return;
    setBusy(true);
    try {
      const body = unwrap(await base44.functions.invoke('genreSkillTree', { action: 'unlock', data: { genre_id: genreId, node_id: node.id } }));
      setState((prev) => ({ ...prev, progress: body.progress }));
      showSuccess(`${node.name} unlocked.`);
    } catch (err) { showError(err, 'Unlock Perk'); }
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

  if (loading) return <div className="grid min-h-[520px] place-items-center"><div className="flex items-center gap-3 text-xs uppercase tracking-[.2em] text-white/35"><RefreshCw className="h-4 w-4 animate-spin" /> Synchronizing genre mastery</div></div>;
  if (error) return <div className="grid min-h-[480px] place-items-center text-center"><div><p className="text-sm text-rose-200/70">{error}</p><button onClick={load} className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2 text-[10px] uppercase tracking-widest text-white/55">Retry</button></div></div>;

  const catalog = state?.catalog;
  const integrations = state?.compatible_games || [];

  return (
    <div className="relative w-full font-sans text-white">
      <div className="mb-5 flex flex-wrap items-end gap-4">
        <div className="min-w-0 flex-1"><span className="text-[9px] font-black uppercase tracking-[.25em]" style={{ color: `${accent}b8` }}>Genre mastery network</span><h2 className="mt-1 text-3xl font-black tracking-tight text-white">{catalog?.name || genre?.name} Skill Tree</h2><p className="mt-2 max-w-3xl text-xs leading-5 text-white/35">Permanent account perks for supported Atom x Eve games. Each game explicitly whitelists the effect keys it implements; exclusive keystones activate only in exclusive integrations.</p></div>
        <div className="flex items-center gap-2">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-5 py-3"><span className="block text-[8px] uppercase tracking-widest text-white/25">Genre level</span><strong className="mt-1 block text-xl">{progress.genre_level_snapshot || 1}</strong></div>
          <div className="rounded-2xl border px-5 py-3" style={{ borderColor: `${accent}30`, background: `${accent}0d` }}><span className="block text-[8px] uppercase tracking-widest text-white/25">Skill points</span><strong className="mt-1 block text-xl" style={{ color: accent }}>{progress.available_points || 0}<small className="ml-1 text-[10px] text-white/25">/ {progress.earned_points || 0}</small></strong></div>
          <button disabled={busy || !(progress.unlocked_node_ids || []).length} onClick={respec} className={`h-[58px] rounded-2xl border px-4 text-[8px] font-black uppercase tracking-wider transition disabled:opacity-20 ${respecArmed ? 'border-rose-300/30 bg-rose-400/10 text-rose-200' : 'border-white/[0.07] bg-white/[0.03] text-white/35 hover:text-white'}`}>{respecArmed ? 'Click again to respec' : 'Respec'}</button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-[9px] uppercase tracking-wider text-white/25"><span className="rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-1.5">{unlocked.size} / {nodes.length} unlocked</span><span className="rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-1.5">{integrations.length} compatible games registered</span><span className="rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-1.5">Runtime revision {progress.revision || 1}</span></div>

      <div className="relative min-h-[540px] overflow-hidden rounded-[24px] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(7,14,25,.78),rgba(3,7,13,.72))] shadow-[inset_0_1px_0_rgba(255,255,255,.05),0_25px_70px_rgba(0,0,0,.32)]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)', backgroundSize: '42px 42px', maskImage: 'radial-gradient(circle at 50% 50%, black 45%, transparent 92%)' }} />
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 12% 50%, ${accent}18, transparent 32%), radial-gradient(circle at 84% 50%, ${accent}0d, transparent 32%)` }} />
        <ConnectionLayer nodes={nodes} unlocked={unlocked} accent={accent} />

        {(catalog?.branches || []).map((branch, index) => <div key={branch.id} className="pointer-events-none absolute left-[2.5%] flex -translate-y-1/2 items-center gap-2" style={{ top: `${[24, 50, 76][index]}%` }}><div className="h-2 w-2 rounded-full" style={{ background: accent, boxShadow: `0 0 14px ${accent}` }} /><span className="text-[8px] font-black uppercase tracking-[.2em] text-white/30">{branch.name}</span></div>)}

        {nodes.map((node) => {
          const status = nodeStatus(node); const Icon = ICONS[node.branch_icon] || CircleDot; const active = status === 'unlocked'; const reachable = status === 'reachable';
          return <motion.button key={node.id} whileHover={{ scale: 1.08 }} whileTap={{ scale: .98 }} onClick={() => setSelectedNode(node)} className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: `${node.x}%`, top: `${node.y}%` }}>
            <div className={`relative grid ${node.tier === 4 ? 'h-[72px] w-[72px]' : 'h-[58px] w-[58px]'} place-items-center rounded-full border-2 transition`} style={{ borderColor: active ? accent : reachable ? `${accent}88` : 'rgba(255,255,255,.10)', background: active ? `linear-gradient(145deg,${accent}30,rgba(4,9,17,.94))` : 'rgba(4,9,17,.88)', boxShadow: active ? `0 0 30px ${accent}32, inset 0 1px 0 rgba(255,255,255,.12)` : reachable ? `0 0 18px ${accent}16` : 'inset 0 1px 0 rgba(255,255,255,.04)' }}>
              {active && <motion.div animate={{ scale: [1, 1.18, 1], opacity: [.18, .04, .18] }} transition={{ duration: 2.8, repeat: Infinity }} className="absolute -inset-3 rounded-full" style={{ background: accent }} />}
              <Icon className="relative z-10 h-5 w-5" style={{ color: active ? '#fff' : reachable ? accent : 'rgba(255,255,255,.20)' }} />
              {status === 'locked' && <div className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border border-white/10 bg-[#050a12]"><Lock className="h-2.5 w-2.5 text-white/25" /></div>}
              {active && <div className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border border-emerald-300/20 bg-[#07140f]"><Check className="h-2.5 w-2.5 text-emerald-300" /></div>}
              {node.exclusive && <Crown className="absolute -top-4 h-3 w-3" style={{ color: accent }} />}
            </div>
            <div className="pointer-events-none absolute left-1/2 top-full mt-2 w-28 -translate-x-1/2 text-center"><strong className={`block text-[8px] font-black uppercase tracking-wide ${active ? 'text-white/72' : reachable ? 'text-white/52' : 'text-white/22'}`}>{node.name}</strong><span className="mt-0.5 block text-[7px] text-white/20">T{node.tier} · {node.cost} SP</span></div>
          </motion.button>;
        })}

        <div className="absolute bottom-4 right-4 max-w-[320px] rounded-2xl border border-white/[0.06] bg-black/25 p-3 backdrop-blur-xl"><div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[.18em] text-white/28"><Play className="h-3 w-3" /> Inspect any perk</div><p className="mt-1 text-[9px] leading-4 text-white/25">Opening a node launches its cinematic explanation panel with the effect contract, scope, unlock rules, compatible games and a short animated demonstration.</p></div>
      </div>

      <AnimatePresence>{selectedNode && <PerkShowcase node={selectedNode} status={nodeStatus(selectedNode)} progress={progress} compatibleGames={integrations} accent={accent} busy={busy} onClose={() => setSelectedNode(null)} onUnlock={unlockNode} />}</AnimatePresence>
    </div>
  );
}
