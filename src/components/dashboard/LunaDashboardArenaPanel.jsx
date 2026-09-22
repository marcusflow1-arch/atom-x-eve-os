import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check, ChevronRight, Crown, Gem, Layers, Loader2, Map, Shield,
  Sparkles, Swords, Trophy, UserRound, Users, X, Zap
} from 'lucide-react';
import useBattleArena from '@/components/battle/useBattleArena';
import { arenaPresentation, useArenaPresentation } from '@/components/battle/arenaPresentation';
import { joinDashboard, useDashboardSession } from '@/components/social/dashboardSession';
import { showError, showSuccess } from '@/components/error/ErrorToast';

const routeForMode = {
  pvp: ['duel'],
  pve: ['vault'],
  pvwe: ['patrol', 'vault', 'colossus'],
};

const routeIcon = { duel: Swords, vault: Map, patrol: Map, colossus: Crown };

const pct = (value, max) => Math.max(0, Math.min(100, 100 * Number(value || 0) / Math.max(1, Number(max || 1))));

function CardButton({ card, player, disabled, onPlay, world }) {
  if (!card) {
    return <div className="min-h-[92px] border border-white/[0.05] bg-white/[0.012] p-2 text-center text-[7px] text-white/22"><Layers className="mx-auto mt-4 h-4 w-4" /><span className="mt-2 block">Empty</span></div>;
  }
  const cooldown = player?.cooldowns?.[card.id] || 0;
  const resonance = world && (card.game_id === world.id || card.game_name === world.title);
  const blocked = disabled || cooldown > 0 || Number(player?.ap || 0) < Number(card.cost || 0);
  return (
    <button type="button" disabled={blocked} onClick={() => onPlay(card.id)} className="relative min-h-[92px] overflow-hidden border border-white/[0.07] bg-white/[0.018] p-2 text-left disabled:opacity-35">
      {card.image ? <img src={card.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-24" /> : null}
      <div className="absolute inset-0 bg-gradient-to-t from-[#071019] via-[#071019]/84 to-transparent" />
      <div className="relative z-10 flex min-h-[76px] flex-col justify-end">
        <span className="text-[5px] font-black uppercase tracking-[0.09em] text-cyan-100/32">
          {card.rarity} · {card.type}{card.element ? ' · ' + String(card.element).toUpperCase() : ''}
        </span>
        <strong className="mt-1 line-clamp-1 text-[8px] text-white/76">{card.name}</strong>
        <div className="mt-1 flex items-center justify-between text-[6px]">
          <span className="text-white/30">{card.effect} {Number(card.value || 0) + (resonance ? Math.max(5, Math.round(Number(card.value || 0) * .12) + Number(card.ascension || 0) * 2) : 0)}</span>
          <span className="font-bold text-cyan-100/52">{card.cost} AP</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[5px] text-white/22">
          <span>Lv {card.level || 1} · Stage {card.stage || 1}</span>
          <span>BRK {card.stagger || 0}</span>
        </div>
        {Array.isArray(card.active_perks) && card.active_perks.length > 0 && <span className="mt-1 line-clamp-1 text-[5px] text-violet-100/40">{card.active_perks.slice(0, 2).map((perk) => String(perk).replaceAll('_', ' ')).join(' · ')}</span>}
        {resonance && <span className="mt-1 text-[5px] font-black uppercase tracking-[0.08em] text-emerald-100/48">World Resonance Active</span>}
        {cooldown > 0 && <span className="mt-1 text-[5px] text-amber-100/44">Ready in {cooldown}</span>}
      </div>
    </button>
  );
}

function CombatHUD({ arena, onExitStage }) {
  const e = arena.encounter;
  const me = e?.players?.find((player) => player.id === arena.user?.id);
  const session = useDashboardSession();
  const [now, setNow] = useState(Date.now());
  const timed = useRef('');
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, []);

  const run = async (task, success) => {
    setError('');
    try {
      const result = await task();
      if (success) showSuccess(success);
      return result;
    } catch (err) {
      setError(err?.message || 'Battle command failed.');
      showError(err, 'AI Battle');
      return null;
    }
  };

  const isHost = e.host_id === arena.user?.id;
  const joined = Boolean(me);
  const duel = e.route?.type === 'pvp';
  const finished = ['victory', 'defeat', 'abandoned'].includes(e.status);
  const serverNow = now + arena.serverOffset;
  const remaining = Math.max(0, (Number(e.deadline || 0) - serverNow) / 1000);
  const mine = e.turn === me?.id;
  const defending = e.phase === 'defend';
  const progress = defending ? pct(serverNow - Number(e.defense_started_at || 0), 6000) : 0;
  const target = e.players?.find((player) => player.id === e.turn);
  const ready = (e.players?.length || 0) >= Number(e.route?.min || 1);
  const inHostDashboard = session.host_id === e.host_id && session.status === 'connected';
  const canClaim = e.status === 'victory' && (!duel || e.winner_id === me?.id);
  const claimed = e.claimed?.includes(me?.id);

  useEffect(() => {
    if (!e || e.status !== 'active' || !e.deadline || remaining > 0 || arena.busy) return;
    const key = e.id + ':' + e.revision;
    if (timed.current === key) return;
    timed.current = key;
    arena.command('timeout').catch(() => { timed.current = ''; });
  }, [e?.id, e?.revision, e?.deadline, e?.status, remaining, arena.busy]);

  if (!e) return null;

  const accept = async () => {
    await joinDashboard({ id: e.host_id, name: e.host_name });
    await arena.command('join');
  };

  return (
    <div className="pointer-events-none flex h-full items-end justify-center p-5">
      <section className="pointer-events-auto w-full max-w-[1040px] overflow-hidden border border-white/[0.09] bg-[#071019]/88 shadow-[0_30px_90px_rgba(0,0,0,.48)] backdrop-blur-2xl">
        <header className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rotate-45 border border-cyan-100/12 bg-cyan-100/[0.035]"><Swords className="h-3.5 w-3.5 -rotate-45 text-cyan-100/55" /></div>
            <div className="min-w-0"><p className="text-[5px] font-black uppercase tracking-[0.15em] text-cyan-100/28">{e.world?.title} · {e.route?.type?.replaceAll('_', ' ')}</p><h3 className="truncate text-[11px] font-semibold text-white/74">{e.route?.title}</h3></div>
          </div>
          <div className="flex items-center gap-3">
            {e.deadline > 0 && <span className="text-[8px] tabular-nums text-amber-100/48">{Math.ceil(remaining)}s</span>}
            <button type="button" onClick={onExitStage} className="grid h-7 w-7 place-items-center border border-white/[0.06] text-white/34 hover:text-white" aria-label="Minimize battle HUD"><X className="h-3.5 w-3.5" /></button>
          </div>
        </header>

        {error && <div className="border-b border-rose-100/10 bg-rose-100/[0.04] px-4 py-2 text-[7px] text-rose-100/60">{error}</div>}

        {e.status === 'lobby' ? (
          <div className="grid grid-cols-[1fr_auto] gap-4 p-4">
            <div>
              <p className="text-[6px] font-black uppercase tracking-[0.13em] text-white/26">Dashboard Battle Lobby</p>
              <h4 className="mt-1 text-[13px] font-semibold text-white/72">{duel ? 'Both players must accept before the duel begins.' : 'Assemble the expedition on the host dashboard.'}</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {(e.players || []).map((player) => <span key={player.id} className="flex items-center gap-2 border border-emerald-100/10 bg-emerald-100/[0.025] px-2.5 py-1.5 text-[7px] text-white/52"><Check className="h-3 w-3 text-emerald-200/45" />{player.name} · {player.cards?.length || 0} cards</span>)}
                {(e.invited_ids || []).filter((id) => !(e.players || []).some((player) => player.id === id)).map((id) => <span key={id} className="flex items-center gap-2 border border-white/[0.06] px-2.5 py-1.5 text-[7px] text-white/28"><Users className="h-3 w-3" />Waiting for player</span>)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!joined ? (
                <>
                  <button type="button" disabled={arena.busy} onClick={() => run(accept, 'Joined battle lobby.')} className="h-10 border border-cyan-100/14 bg-cyan-100/[0.06] px-4 text-[7px] font-black uppercase tracking-[0.1em] text-cyan-50/70">Accept & Join Dashboard</button>
                  <button type="button" disabled={arena.busy} onClick={() => run(() => arena.command('decline'))} className="h-10 border border-white/[0.06] px-3 text-[7px] text-white/34">Decline</button>
                </>
              ) : isHost ? (
                <button type="button" disabled={arena.busy || !ready} onClick={() => run(() => arena.command('start'), 'Battle started.')} className="h-10 border border-cyan-100/14 bg-cyan-100/[0.06] px-5 text-[7px] font-black uppercase tracking-[0.1em] text-cyan-50/70 disabled:opacity-35">{ready ? 'Enter Battle' : 'Waiting for Players'}</button>
              ) : (
                <div className="flex items-center gap-2">
                  {!inHostDashboard && <button type="button" onClick={() => run(() => joinDashboard({ id: e.host_id, name: e.host_name }))} className="h-10 border border-white/[0.07] px-4 text-[7px] text-white/46">Join Host Dashboard</button>}
                  <span className="text-[7px] text-white/30">Waiting for {e.host_name} to start.</span>
                </div>
              )}
            </div>
          </div>
        ) : finished ? (
          <div className="flex items-center justify-between gap-5 p-4">
            <div className="flex items-center gap-3"><Trophy className="h-6 w-6 text-amber-100/48" /><div><p className="text-[6px] font-black uppercase tracking-[0.14em] text-white/26">Encounter Complete</p><h4 className="mt-1 text-[14px] font-semibold text-white/72">{e.status === 'victory' ? (duel ? (e.winner_id === me?.id ? 'Victory' : 'Defeat') : 'Route secured') : 'Expedition ended'}</h4><p className="mt-1 text-[7px] text-white/34">{canClaim ? (claimed ? 'Field chest opened.' : 'Your field chest is ready.') : 'Your avatar is ready for the next encounter.'}</p></div></div>
            {canClaim && !claimed ? <button type="button" disabled={arena.busy} onClick={() => run(() => arena.command('claim'), 'Field chest opened.')} className="flex h-10 items-center gap-2 border border-amber-100/14 bg-amber-100/[0.05] px-4 text-[7px] font-black uppercase tracking-[0.1em] text-amber-50/68"><Gem className="h-3.5 w-3.5" />Open Chest · {e.route?.xp} XP</button> : <button type="button" onClick={() => { arenaPresentation.clear(); onExitStage(); }} className="h-10 border border-white/[0.06] px-4 text-[7px] text-white/40">Return to AI Battle</button>}
          </div>
        ) : e.phase === 'camp' ? (
          <div className="flex items-center justify-between gap-5 p-4">
            <div><p className="text-[6px] font-black uppercase tracking-[0.13em] text-cyan-100/28">Dungeon Camp</p><h4 className="mt-1 text-[13px] font-semibold text-white/72">Room cleared. Catch your breath.</h4><p className="mt-1 text-[7px] text-white/34">Continuing restores 20% HP and refreshes action points.</p></div>
            <button type="button" disabled={!isHost || arena.busy} onClick={() => run(() => arena.command('continue'))} className="flex h-10 items-center gap-2 border border-cyan-100/14 bg-cyan-100/[0.06] px-4 text-[7px] font-black uppercase tracking-[0.1em] text-cyan-50/70 disabled:opacity-35">{isHost ? 'Enter Next Room' : 'Waiting for Host'}<ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
        ) : defending ? (
          <div className="p-4">
            <div className="flex items-center justify-between"><div><p className="text-[6px] font-black uppercase tracking-[0.13em] text-rose-100/34">Incoming Attack</p><h4 className="mt-1 text-[12px] font-semibold text-white/72">{mine ? 'Read the strike. Time your defense.' : (target?.name || 'Player') + ' is defending.'}</h4></div><span className="text-[7px] text-white/30">{e.enemy?.intent}</span></div>
            <div className="relative mt-3 h-[9px] overflow-hidden bg-white/[0.05]">
              <span className="absolute bottom-0 top-0 left-[43.33%] w-[33.33%] bg-cyan-200/[0.12]" />
              <span className="absolute bottom-0 top-0 left-[56.67%] w-[11.67%] bg-amber-200/[0.20]" />
              <i className="absolute bottom-[-3px] top-[-3px] w-px bg-white/80 shadow-[0_0_8px_rgba(255,255,255,.5)]" style={{ left: String(progress) + '%' }} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button type="button" disabled={!mine || arena.busy} onClick={() => run(() => arena.command('brace'))} className="border border-white/[0.07] bg-white/[0.02] py-2.5 text-[7px] text-white/54 disabled:opacity-30"><Shield className="mx-auto mb-1 h-3.5 w-3.5" />Brace<span className="mt-0.5 block text-[5px] text-white/24">60% less damage</span></button>
              <button type="button" disabled={!mine || arena.busy} onClick={() => run(() => arena.command('evade'))} className="border border-cyan-100/10 bg-cyan-100/[0.025] py-2.5 text-[7px] text-cyan-50/58 disabled:opacity-30">Evade<span className="mt-0.5 block text-[5px] text-white/24">Blue window</span></button>
              <button type="button" disabled={!mine || arena.busy} onClick={() => run(() => arena.command('parry'))} className="border border-amber-100/12 bg-amber-100/[0.035] py-2.5 text-[7px] text-amber-50/62 disabled:opacity-30">Parry<span className="mt-0.5 block text-[5px] text-white/24">Gold · counter</span></button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_190px] gap-3 p-4">
            <div>
              <div className="mb-2 flex items-center justify-between"><div><p className="text-[6px] font-black uppercase tracking-[0.13em] text-white/26">Round {e.round}</p><h4 className="mt-1 text-[11px] font-semibold text-white/68">{mine ? 'Your move. Choose a card or recover AP.' : (target?.name || 'Player') + ' is choosing.'}</h4></div><span className="flex items-center gap-1 text-[8px] text-cyan-100/50"><Zap className="h-3.5 w-3.5" />{me?.ap || 0} / 5 AP</span></div>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((index) => <CardButton key={index} card={me?.cards?.[index]} player={me} disabled={!mine || arena.busy || e.phase !== 'turn'} world={e.world} onPlay={(cardId) => run(() => arena.command('card', { card_id: cardId }))} />)}
              </div>
            </div>
            <div className="grid grid-rows-2 gap-2">
              <button type="button" disabled={!mine || arena.busy || e.phase !== 'turn'} onClick={() => run(() => arena.command('strike'))} className="flex items-center justify-center gap-2 border border-rose-100/12 bg-rose-100/[0.04] text-[7px] font-black uppercase tracking-[0.08em] text-rose-50/60 disabled:opacity-30"><Swords className="h-3.5 w-3.5" />Strike<span className="text-[5px] font-normal text-white/24">+1 AP</span></button>
              <button type="button" disabled={!mine || arena.busy || e.phase !== 'turn'} onClick={() => run(() => arena.command('guard'))} className="flex items-center justify-center gap-2 border border-cyan-100/10 bg-cyan-100/[0.03] text-[7px] font-black uppercase tracking-[0.08em] text-cyan-50/56 disabled:opacity-30"><Shield className="h-3.5 w-3.5" />Guard<span className="text-[5px] font-normal text-white/24">+18 shield</span></button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default function LunaDashboardArenaPanel({ mode }) {
  const presentation = useArenaPresentation();
  const encounterId = presentation.encounterId || null;
  const arena = useBattleArena(encounterId);
  const [worldId, setWorldId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [invites, setInvites] = useState([]);
  const [creating, setCreating] = useState(false);
  const [preparedField, setPreparedField] = useState(null);

  const hub = arena.hub;
  const routes = useMemo(() => {
    const allowed = routeForMode[mode] || [];
    return (hub?.routes || []).filter((route) => allowed.includes(route.id));
  }, [hub?.routes, mode]);

  useEffect(() => {
    const firstWorld = hub?.worlds?.[0];
    if (!worldId && firstWorld) setWorldId(firstWorld.id);
  }, [hub?.worlds, worldId]);

  useEffect(() => {
    if (!routes.length) return;
    if (!routes.some((route) => route.id === routeId)) {
      setRouteId(routes[0].id);
      setInvites([]);
    }
  }, [routes, routeId]);

  useEffect(() => {
    const prepareFieldNode = (event) => {
      const detail = event?.detail || {};
      const nextWorldId = String(detail.world_id || '');
      const nextRouteId = String(detail.route_id || '');
      if (nextWorldId && (hub?.worlds || []).some((item) => String(item.id) === nextWorldId)) setWorldId(nextWorldId);
      if (nextRouteId && routes.some((item) => item.id === nextRouteId)) setRouteId(nextRouteId);
      setPreparedField(detail.field_node_id ? {
        id: String(detail.field_node_id),
        cell_lat: detail.field_cell_lat,
        cell_lng: detail.field_cell_lng,
        title: detail.field_title || 'Field discovery',
        type: detail.field_type || '',
        distance_m: Number(detail.field_distance_m || 0),
      } : null);
      setInvites([]);
    };
    window.addEventListener('prepareAIBattleFieldNode', prepareFieldNode);
    return () => window.removeEventListener('prepareAIBattleFieldNode', prepareFieldNode);
  }, [hub?.worlds, routes]);

  const route = routes.find((item) => item.id === routeId) || routes[0];
  const world = hub?.worlds?.find((item) => item.id === worldId) || hub?.worlds?.[0];
  const contacts = hub?.contacts || [];
  const pending = (hub?.encounters || []).filter((encounter) => ['lobby', 'active'].includes(encounter.status) && !encounter.declined?.includes(arena.user?.id));

  const toggleInvite = (id) => {
    const max = Math.max(0, Number(route?.max || 1) - 1);
    setInvites((current) => current.includes(id)
      ? current.filter((value) => value !== id)
      : current.length < max ? [...current, id] : current);
  };

  const create = async () => {
    if (!route || !world || creating) return;
    setCreating(true);
    try {
      const response = await arena.create({
        world_id: world.id,
        route_id: route.id,
        invited_ids: invites,
        ...(preparedField ? {
          field_node_id: preparedField.id,
          field_cell_lat: preparedField.cell_lat,
          field_cell_lng: preparedField.cell_lng,
        } : {}),
      });
      if (response?.encounter?.id) {
        arenaPresentation.setEncounter(response.encounter.id);
        setPreparedField(null);
        showSuccess('Dashboard battle lobby created.');
      }
    } catch (error) {
      showError(error, 'AI Battle');
    } finally {
      setCreating(false);
    }
  };

  if (encounterId) {
    return <CombatHUD arena={arena} onExitStage={() => arenaPresentation.clear()} />;
  }

  return (
    <section className="shrink-0 border-b border-white/[0.06] bg-black/[0.10] px-5 py-3">
      {pending.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {pending.slice(0, 3).map((encounter) => (
            <button key={encounter.id} type="button" onClick={() => arenaPresentation.setEncounter(encounter.id)} className="flex items-center gap-2 border border-cyan-100/10 bg-cyan-100/[0.03] px-3 py-2 text-left">
              <span className="h-2 w-2 rounded-full bg-cyan-200/60" />
              <span><strong className="block text-[7px] text-white/58">{encounter.players?.some((player) => player.id === arena.user?.id) ? 'Resume ' + encounter.route.title : encounter.host_name + ' invited you'}</strong><small className="mt-0.5 block text-[5.5px] uppercase tracking-[0.07em] text-white/24">{encounter.world?.title} · {encounter.status}</small></span>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(220px,.55fr)_minmax(260px,.75fr)_auto] gap-3">
        <div>
          <p className="text-[6px] font-black uppercase tracking-[0.15em] text-cyan-100/28">Dashboard Battle Stage</p>
          <div className="mt-2 flex gap-2">
            {routes.map((item) => {
              const Icon = routeIcon[item.id] || Swords;
              return <button key={item.id} type="button" onClick={() => { setRouteId(item.id); setPreparedField(null); setInvites([]); }} className={'min-w-[130px] flex-1 border px-3 py-2 text-left ' + (route?.id === item.id ? 'border-cyan-100/16 bg-cyan-100/[0.05]' : 'border-white/[0.05] bg-white/[0.012]')}><div className="flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-white/38" /><strong className="text-[8px] text-white/62">{item.title}</strong></div><span className="mt-1 block text-[5.5px] text-white/25">{item.min === item.max ? item.min : item.min + '–' + item.max} players · {item.xp} XP</span></button>;
            })}
          </div>
        </div>

        <div>
          <p className="text-[6px] font-black uppercase tracking-[0.15em] text-white/24">Game World</p>
          <select value={world?.id || ''} onChange={(event) => { setWorldId(event.target.value); setPreparedField(null); }} className="mt-2 h-[46px] w-full border border-white/[0.06] bg-[#071019] px-3 text-[8px] text-white/55 outline-none">
            {(hub?.worlds || []).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
          <p className="mt-1 text-[5.5px] text-white/22">Cards from this world gain resonance.</p>
          {preparedField && (
            <div className="mt-1.5 border border-amber-100/10 bg-amber-100/[0.025] px-2 py-1.5">
              <span className="block truncate text-[5.5px] font-black uppercase tracking-[0.08em] text-amber-100/44">Field discovery prepared</span>
              <strong className="mt-0.5 block truncate text-[6.5px] text-white/48">{preparedField.title} · {Math.round(preparedField.distance_m)} m</strong>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between"><p className="text-[6px] font-black uppercase tracking-[0.15em] text-white/24">Party / Opponent</p><span className="text-[5.5px] text-white/22">{invites.length + 1}/{route?.max || 1}</span></div>
          <div className="mt-2 flex max-h-[46px] gap-1.5 overflow-x-auto">
            {contacts.length ? contacts.map((contact) => {
              const chosen = invites.includes(contact.id);
              return <button key={contact.id} type="button" onClick={() => toggleInvite(contact.id)} className={'flex min-w-[110px] items-center gap-2 border px-2 py-1.5 text-left ' + (chosen ? 'border-cyan-100/15 bg-cyan-100/[0.05]' : 'border-white/[0.05] bg-white/[0.012]')}><div className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden border border-white/[0.05]">{contact.portrait ? <img src={contact.portrait} alt="" className="h-full w-full object-cover" /> : <UserRound className="h-3.5 w-3.5 text-white/28" />}</div><span className="min-w-0"><strong className="block truncate text-[7px] text-white/52">{contact.name}</strong><small className="block truncate text-[5px] text-white/22">{contact.in_dashboard ? 'On dashboard' : contact.kind}</small></span>{chosen && <Check className="ml-auto h-3 w-3 text-cyan-100/45" />}</button>;
            }) : <div className="flex h-[46px] items-center px-3 text-[7px] text-white/25">Friends and dashboard visitors appear here.</div>}
          </div>
        </div>

        <button
          type="button"
          onClick={create}
          disabled={creating || !hub?.player?.cards?.length || !route || !world || invites.length + 1 < Number(route?.min || 1)}
          className="mt-[18px] flex h-[46px] min-w-[130px] items-center justify-center gap-2 border border-cyan-100/16 bg-cyan-100/[0.065] px-4 text-[7px] font-black uppercase tracking-[0.1em] text-cyan-50/68 disabled:opacity-30"
        >
          {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Swords className="h-3.5 w-3.5" />}
          Deploy
        </button>
      </div>
    </section>
  );
}
