import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, BadgeCheck, ChevronRight, Copy, Crown, Gem, History,
  Layers3, Loader2, PackagePlus, ShieldCheck, Sparkles, Swords, TrendingUp,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const TABS = [
  { id: 'overview', label: 'OVERVIEW', icon: TrendingUp },
  { id: 'enhance', label: 'ENHANCE', icon: Sparkles },
  { id: 'stack', label: 'STACK', icon: Layers3 },
  { id: 'passport', label: 'PASSPORT', icon: BadgeCheck },
];

const STAT_LABELS = {
  attack: 'Attack', defense: 'Defense', magic: 'Spirit', vitality: 'Vitality', speed: 'Dexterity',
  dodge: 'Dodge', accuracy: 'Accuracy', crit_chance: 'Crit Chance', crit_damage: 'Crit Damage',
};

const TIER_TONE = {
  Rare: 'text-cyan-200 border-cyan-300/25',
  Epic: 'text-violet-200 border-violet-300/25',
  Legendary: 'text-amber-200 border-amber-300/25',
  Demigod: 'text-orange-200 border-orange-300/25',
  Mythical: 'text-fuchsia-200 border-fuchsia-300/25',
  Mythic: 'text-fuchsia-200 border-fuchsia-300/25',
  Deity: 'text-sky-100 border-sky-200/30',
  Chosen: 'text-white border-white/35',
};

function unwrap(response) {
  return response?.data || response || {};
}

function invoke(action, card, payload = {}) {
  const userCardId = card?.userCardId || card?.user_card_id || card?.ownedCardId || undefined;
  return base44.functions.invoke('cardProgression', {
    action,
    userCardId,
    achievementId: card?.achievementId || card?.achievement_id || (!userCardId && !card?.trading_card_id ? card?.id : undefined),
    payload,
  });
}

function fmt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0';
}

function date(value) {
  if (!value) return 'Not recorded';
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toLocaleString() : 'Not recorded';
}

function Panel({ children, className = '' }) {
  return <section className={`border border-white/[0.07] bg-[#0b111a]/96 ${className}`}>{children}</section>;
}

function Progress({ value = 0, max = 120 }) {
  const percent = Math.max(0, Math.min(100, (Number(value || 0) / Math.max(1, max)) * 100));
  return (
    <div className="h-2 overflow-hidden bg-white/[0.06]">
      <div className="h-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 transition-[width] duration-300" style={{ width: `${percent}%` }} />
    </div>
  );
}

function CardFace({ card, state }) {
  const p = state?.progression || {};
  const userCard = state?.userCard || {};
  const mastery = state?.mastery || {};
  const image = card?.image || card?.card_image || userCard.card_image || state?.definition?.image_url || '';
  const title = card?.title || card?.name || userCard.card_name || state?.definition?.name || 'Card';
  const tier = userCard.playable_tier || state?.definition?.playable_tier || userCard.card_rarity || state?.definition?.rarity || card?.rarity || 'Rare';
  const mastered = Boolean(mastery.holographic || p.mastery_visual === 'holographic_3d');

  return (
    <div className="space-y-3">
      <div className={`relative aspect-[2/3] overflow-hidden border bg-[#070b11] ${TIER_TONE[tier] || 'border-white/10 text-white'} ${mastered ? 'shadow-[0_0_35px_rgba(103,232,249,.12)]' : ''}`}>
        {image ? <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(34,211,238,.16),transparent_35%),linear-gradient(150deg,#111827,#05070c)]" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />
        {mastered && <div className="pointer-events-none absolute inset-0 opacity-45 bg-[linear-gradient(115deg,transparent_28%,rgba(103,232,249,.18)_42%,rgba(217,70,239,.14)_52%,transparent_68%)] animate-pulse" />}
        <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
          <span className={`border bg-black/65 px-2 py-1 text-[9px] font-semibold uppercase tracking-[.14em] ${TIER_TONE[tier] || 'border-white/20 text-white'}`}>{tier}</span>
          <span className="bg-black/65 px-2 py-1 text-[9px] uppercase tracking-[.14em] text-white/75">A{p.ascension || 0}/5</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          {mastered && <div className="mb-2 inline-flex items-center gap-1 bg-cyan-300/10 px-2 py-1 text-[8px] font-bold uppercase tracking-[.17em] text-cyan-100"><Sparkles className="h-3 w-3" /> Holographic Mastery</div>}
          <h2 className="text-xl font-black leading-tight text-white">{title}</h2>
          <p className="mt-1 text-[10px] text-white/45">{userCard.game_name || card?.series || state?.definition?.series || 'Adam XE'}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-px bg-white/[0.06]">
        <Metric label="Power" value={fmt(p.power_score)} />
        <Metric label="Enhance" value={`${fmt(p.enhancement_percent)}%`} />
        <Metric label="Stack" value={`${p.stack_level || 1}/4`} />
      </div>
    </div>
  );
}

function Metric({ label, value, sub }) {
  return <div className="bg-[#090e15] p-3"><span className="block text-[8px] uppercase tracking-[.16em] text-white/30">{label}</span><strong className="mt-1 block text-sm text-white">{value}</strong>{sub && <span className="mt-1 block text-[9px] text-white/35">{sub}</span>}</div>;
}

function Overview({ state }) {
  const p = state?.progression || {};
  const mastery = state?.mastery || {};
  const combat = state?.combat_preview;
  const stats = p.effective_stats || {};
  const permanent = p.permanent_stats || {};
  const cycle = p.current_cycle_stats || {};
  return (
    <div className="space-y-4">
      <Panel className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-[9px] uppercase tracking-[.2em] text-cyan-200/55">Card Power</p><h3 className="mt-1 text-2xl font-black text-white">{fmt(p.power_score)}</h3></div>
          {combat && <div className="text-right"><p className="text-[9px] uppercase tracking-[.18em] text-white/30">PvP Damage</p><strong className="mt-1 block text-xl text-amber-200">{fmt(combat.base_damage)}</strong><span className="text-[8px] text-white/30">before defense</span></div>}
        </div>
        <div className="mt-5"><div className="mb-2 flex justify-between text-[9px] uppercase tracking-[.16em] text-white/40"><span>Enhancement cycle</span><span>{fmt(p.enhancement_percent)} / 120%</span></div><Progress value={p.enhancement_percent} /></div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label="Ascension" value={`${p.ascension || 0}/5`} />
          <Metric label="Stack Level" value={`${p.stack_level || 1}/4`} />
          <Metric label="Mastery" value={mastery.mastered ? 'MASTERED' : 'IN PROGRESS'} />
          <Metric label="Avatar Level" value={state?.avatar_level || 1} />
        </div>
      </Panel>

      <Panel className="p-4">
        <div className="mb-3 flex items-center gap-2"><Swords className="h-4 w-4 text-cyan-200/70" /><h3 className="text-xs font-bold uppercase tracking-[.16em] text-white/80">Effective Stats</h3></div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          {Object.entries(stats).filter(([, value]) => Number(value) !== 0).map(([key, value]) => (
            <div key={key} className="flex items-end justify-between border-b border-white/[0.05] pb-2"><span className="text-[9px] uppercase tracking-[.12em] text-white/35">{STAT_LABELS[key] || key.replaceAll('_', ' ')}</span><strong className="text-xs text-white">{fmt(value)}</strong></div>
          ))}
        </div>
      </Panel>

      <Panel className="grid gap-px bg-white/[0.06] sm:grid-cols-2">
        <div className="bg-[#0a1018] p-4"><p className="text-[9px] uppercase tracking-[.18em] text-white/35">Permanent Power</p><p className="mt-2 text-xs leading-5 text-white/55">Stats locked in by completed Ascensions. These are never removed when the 120% gauge resets.</p><div className="mt-3 text-[10px] text-cyan-100/70">{Object.keys(permanent).length ? Object.entries(permanent).map(([k,v]) => `${STAT_LABELS[k] || k} +${fmt(v)}`).join(' · ') : 'No Ascension-locked stats yet.'}</div></div>
        <div className="bg-[#0a1018] p-4"><p className="text-[9px] uppercase tracking-[.18em] text-white/35">Current Cycle</p><p className="mt-2 text-xs leading-5 text-white/55">Power earned between 0% and 120%. Ascending moves these gains permanently into the card.</p><div className="mt-3 text-[10px] text-violet-100/70">{Object.keys(cycle).length ? Object.entries(cycle).map(([k,v]) => `${STAT_LABELS[k] || k} +${fmt(v)}`).join(' · ') : 'Feed enhancement materials to begin.'}</div></div>
      </Panel>
    </div>
  );
}

function Enhance({ state, busy, onAction }) {
  const p = state?.progression || {};
  const mastery = state?.mastery || {};
  const materials = useMemo(() => (state?.materials || []).filter((row) => row.can_enhance), [state?.materials]);
  const [selected, setSelected] = useState('');
  const [quantity, setQuantity] = useState(1);
  useEffect(() => { if (!selected && materials[0]) setSelected(materials[0].id); }, [selected, materials]);
  const chosen = materials.find((row) => String(row.id) === String(selected));
  const projected = chosen ? Math.min(120, Number(p.enhancement_percent || 0) + Number(chosen.enhancement_value || 0) * quantity) : Number(p.enhancement_percent || 0);
  const maxQty = Math.max(1, Number(chosen?.quantity || 1));

  return <div className="space-y-4">
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-4"><div><p className="text-[9px] uppercase tracking-[.2em] text-cyan-200/55">Enhancement</p><h3 className="mt-1 text-xl font-black text-white">{fmt(p.enhancement_percent)} / 120%</h3></div><div className="text-right"><p className="text-[8px] uppercase tracking-[.15em] text-white/30">After selected materials</p><strong className="text-sm text-cyan-100">{fmt(projected)}%</strong></div></div>
      <div className="mt-4"><Progress value={p.enhancement_percent} /></div>
      <p className="mt-3 text-[11px] leading-5 text-white/45">Feed enhancement materials into this exact card instance. The stats gained are immediately usable in Skill Book, PvP and PvE.</p>
    </Panel>

    <Panel className="p-4">
      <div className="mb-3 flex items-center gap-2"><Gem className="h-4 w-4 text-violet-200/70" /><h3 className="text-xs font-bold uppercase tracking-[.16em] text-white/75">Enhancement Materials</h3></div>
      {materials.length ? <div className="space-y-2">{materials.map((row) => {
        const def = row.definition || {};
        const active = String(selected) === String(row.id);
        return <button key={row.id} type="button" onClick={() => { setSelected(row.id); setQuantity(1); }} className={`flex w-full items-center justify-between border p-3 text-left transition ${active ? 'border-cyan-300/35 bg-cyan-300/[0.06]' : 'border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.035]'}`}>
          <div><strong className="block text-xs text-white/85">{def.name || 'Enhancement Material'}</strong><span className="mt-1 block text-[9px] uppercase tracking-[.12em] text-white/35">{def.rarity || 'Common'} · +{row.enhancement_value || 0}% each</span></div><span className="font-mono text-xs text-white/55">×{row.quantity || 0}</span>
        </button>;
      })}</div> : <div className="border border-dashed border-white/10 p-5 text-center text-xs text-white/35">No enhancement materials available.</div>}
      {chosen && <div className="mt-3 flex items-center gap-2"><button type="button" onClick={() => setQuantity((n) => Math.max(1, n - 1))} className="h-9 w-9 border border-white/10 text-white/65">−</button><div className="flex h-9 min-w-16 items-center justify-center border border-white/10 bg-black/20 px-3 text-xs text-white">{quantity}</div><button type="button" onClick={() => setQuantity((n) => Math.min(maxQty, n + 1))} className="h-9 w-9 border border-white/10 text-white/65">+</button><button disabled={busy || Number(p.enhancement_percent || 0) >= 120} onClick={() => onAction('enhance', { userMaterialId: chosen.id, quantity })} className="ml-auto h-9 bg-cyan-300 px-5 text-[10px] font-black uppercase tracking-[.12em] text-slate-950 disabled:cursor-not-allowed disabled:opacity-30">Feed Material</button></div>}
    </Panel>

    <Panel className="p-4">
      <div className="flex items-center justify-between gap-4"><div><div className="flex items-center gap-2"><Crown className="h-4 w-4 text-amber-200" /><h3 className="text-xs font-black uppercase tracking-[.16em] text-white/85">Ascension {p.ascension || 0}/5</h3></div><p className="mt-2 max-w-xl text-[11px] leading-5 text-white/45">At 120%, Ascend this card. The gauge returns to 0%, but every stat and damage increase earned during the cycle is permanently locked into the card.</p></div><button disabled={busy || !mastery.can_ascend} onClick={() => onAction('ascend')} className="h-11 shrink-0 bg-amber-300 px-5 text-[10px] font-black uppercase tracking-[.12em] text-slate-950 disabled:cursor-not-allowed disabled:opacity-25">Ascend</button></div>
      <div className="mt-4 grid grid-cols-5 gap-2">{[1,2,3,4,5].map((step) => <div key={step} className={`border p-2 text-center ${Number(p.ascension || 0) >= step ? 'border-amber-300/30 bg-amber-300/[0.07] text-amber-100' : 'border-white/[0.06] text-white/25'}`}><span className="text-[8px] uppercase tracking-wider">A{step}</span>{step === 5 && <Sparkles className="mx-auto mt-1 h-3 w-3" />}</div>)}</div>
      {mastery.mastered && <div className="mt-4 flex items-center gap-2 border border-cyan-300/20 bg-cyan-300/[0.05] p-3 text-[10px] uppercase tracking-[.13em] text-cyan-100"><ShieldCheck className="h-4 w-4" /> Maximum mastery · 3D holographic presentation unlocked</div>}
    </Panel>
  </div>;
}

function Stack({ state, busy, onAction }) {
  const p = state?.progression || {};
  const duplicates = state?.duplicates || [];
  return <div className="space-y-4">
    <Panel className="p-4"><div className="flex items-center justify-between gap-4"><div><p className="text-[9px] uppercase tracking-[.2em] text-violet-200/55">Duplicate Stacking</p><h3 className="mt-1 text-xl font-black text-white">Stack Level {p.stack_level || 1} / 4</h3><p className="mt-2 max-w-xl text-[11px] leading-5 text-white/45">Combine one exact duplicate of the same card and tier into this card. The duplicate is consumed and this card becomes stronger. You can also keep or trade duplicates instead.</p></div><PackagePlus className="h-8 w-8 text-violet-200/35" /></div></Panel>
    <div className="space-y-2">{duplicates.length ? duplicates.map((duplicate) => <Panel key={duplicate.id} className="flex items-center gap-3 p-3"><div className="h-14 w-10 overflow-hidden bg-white/[0.04]">{duplicate.card_image && <img src={duplicate.card_image} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><strong className="block truncate text-xs text-white/85">{duplicate.card_name}</strong><span className="mt-1 block text-[9px] uppercase tracking-[.12em] text-white/35">{duplicate.card_rarity} · acquired {date(duplicate.acquired_at)}</span></div><button disabled={busy || Number(p.stack_level || 1) >= 4} onClick={() => onAction('stack', { duplicateUserCardId: duplicate.id })} className="h-9 bg-violet-300 px-4 text-[9px] font-black uppercase tracking-[.12em] text-slate-950 disabled:opacity-25">Stack</button></Panel>) : <Panel className="p-6 text-center"><Layers3 className="mx-auto h-6 w-6 text-white/20" /><p className="mt-2 text-xs text-white/40">No eligible duplicate copies are available.</p><p className="mt-1 text-[10px] text-white/25">Earn another copy or keep checking trades.</p></Panel>}</div>
  </div>;
}

function Passport({ state }) {
  const passport = state?.passport || {};
  const events = passport.events || [];
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!passport.passport_id || !navigator?.clipboard) return;
    await navigator.clipboard.writeText(passport.passport_id);
    setCopied(true); setTimeout(() => setCopied(false), 1200);
  };
  return <div className="space-y-4">
    <Panel className="p-4"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-200" /><h3 className="text-sm font-black text-white">Digital Passport</h3></div><p className="mt-2 max-w-xl text-[11px] leading-5 text-white/45">This identity belongs to this exact card instance. Its progression and ownership history stay with the card when it is traded.</p></div><span className="border border-emerald-300/20 bg-emerald-300/[0.06] px-2 py-1 text-[8px] uppercase tracking-[.13em] text-emerald-100">{String(passport.authenticity_status || 'registered_internal').replaceAll('_',' ')}</span></div><div className="mt-4 flex items-center gap-2 border border-white/[0.07] bg-black/20 p-3"><code className="min-w-0 flex-1 truncate text-[10px] text-cyan-100/80">{passport.passport_id || 'Passport pending'}</code><button type="button" onClick={copy} className="p-1 text-white/45 hover:text-white" aria-label="Copy card passport ID">{copied ? <ShieldCheck className="h-4 w-4 text-emerald-200" /> : <Copy className="h-4 w-4" />}</button></div></Panel>
    <div className="grid gap-2 sm:grid-cols-3"><Metric label="Ledger" value={String(passport.ledger_adapter || 'internal_hash_chain_v1').replaceAll('_',' ')} /><Metric label="Events" value={passport.event_count || events.length || 0} /><Metric label="External Ledger" value={passport.external_ledger_status === 'anchored' ? 'ANCHORED' : 'NOT ANCHORED'} /></div>
    {passport.external_ledger_status !== 'anchored' && <Panel className="border-amber-300/10 bg-amber-300/[0.025] p-3 text-[10px] leading-5 text-amber-100/55">This card currently uses Adam XE's tamper-evident internal hash-chain registry. It is not being represented as externally blockchain-anchored until that external ledger connection is actually active.</Panel>}
    <Panel className="p-4"><div className="mb-3 flex items-center gap-2"><History className="h-4 w-4 text-cyan-200/60" /><h3 className="text-xs font-bold uppercase tracking-[.16em] text-white/70">Card History</h3></div>{events.length ? <div className="space-y-1">{[...events].reverse().map((event) => <div key={`${event.sequence}-${event.event_hash}`} className="grid grid-cols-[42px_1fr_auto] items-start gap-3 border-b border-white/[0.05] py-3 last:border-0"><span className="font-mono text-[9px] text-white/25">#{event.sequence}</span><div><strong className="block text-[10px] uppercase tracking-[.11em] text-white/65">{String(event.event_type || '').replaceAll('_',' ')}</strong><span className="mt-1 block max-w-md truncate font-mono text-[8px] text-white/20">{event.event_hash}</span></div><span className="text-[8px] text-white/25">{date(event.timestamp)}</span></div>)}</div> : <p className="text-xs text-white/35">No passport events yet.</p>}</Panel>
  </div>;
}

export default function MysteryCardDetail({ card, onBack }) {
  const [tab, setTab] = useState('overview');
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setState(unwrap(await invoke('getState', card))); }
    catch (err) { setError(err?.message || 'Card details could not load.'); }
    finally { setLoading(false); }
  }, [card?.user_card_id, card?.userCardId, card?.achievement_id, card?.id]);

  useEffect(() => { load(); }, [load]);

  const act = async (action, payload = {}) => {
    setBusy(true); setError('');
    try { setState(unwrap(await invoke(action, card, payload))); }
    catch (err) { setError(err?.response?.data?.error || err?.message || 'Card action failed.'); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="flex h-full min-h-[320px] items-center justify-center bg-[#080d14] text-white/55"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading card…</div>;
  if (!state || state.error) return <div className="flex h-full min-h-[320px] flex-col items-center justify-center bg-[#080d14] p-6 text-center"><p className="text-sm text-rose-200/80">{state?.error || error || 'Card details are unavailable.'}</p><button onClick={load} className="mt-4 border border-white/10 px-4 py-2 text-xs text-white/65">Retry</button></div>;

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#080d14] text-white">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-white/[0.07] bg-[#0a1018] px-3">
        <button onClick={onBack} className="grid h-8 w-8 place-items-center text-white/45 hover:text-white" aria-label="Back to cards"><ArrowLeft className="h-4 w-4" /></button>
        <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-white/85">{state?.userCard?.card_name || card?.title || card?.name || 'Card'}</p><p className="mt-0.5 text-[8px] uppercase tracking-[.16em] text-white/25">Card System v2 · one card, one progression record</p></div>
        {busy && <Loader2 className="h-4 w-4 animate-spin text-cyan-200" />}
      </header>

      {error && <div className="shrink-0 border-b border-rose-300/10 bg-rose-400/[0.05] px-4 py-2 text-[10px] text-rose-100/70">{error}</div>}

      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(180px,26%)_minmax(0,1fr)]">
        <aside className="min-h-0 overflow-auto border-b border-white/[0.06] p-3 lg:border-b-0 lg:border-r">
          <CardFace card={card} state={state} />
        </aside>
        <main className="flex min-h-0 flex-col">
          <nav className="flex shrink-0 border-b border-white/[0.06] bg-[#090f17] px-2" aria-label="Card progression sections">
            {TABS.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 border-b-2 px-2 py-3 text-[9px] font-bold tracking-[.12em] transition ${tab === id ? 'border-cyan-300 text-cyan-100' : 'border-transparent text-white/30 hover:text-white/60'}`}><Icon className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{label}</span></button>)}
          </nav>
          <div className="min-h-0 flex-1 overflow-y-auto p-3 custom-scrollbar">
            {tab === 'overview' && <Overview state={state} />}
            {tab === 'enhance' && <Enhance state={state} busy={busy} onAction={act} />}
            {tab === 'stack' && <Stack state={state} busy={busy} onAction={act} />}
            {tab === 'passport' && <Passport state={state} />}
          </div>
        </main>
      </div>
    </div>
  );
}
