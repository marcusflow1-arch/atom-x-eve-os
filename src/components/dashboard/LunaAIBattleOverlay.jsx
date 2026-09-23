import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bot, Crown, Loader2, Map, Package, Shield, Skull, Swords, Users, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useBattleArena from '@/components/battle/useBattleArena';
import useSkillBookLoadout from '@/components/luna/hooks/useSkillBookLoadout';
import { arenaPresentation, useArenaPresentation } from '@/components/battle/arenaPresentation';
import { showError, showSuccess } from '@/components/error/ErrorToast';

const MODES = [
  { id: 'pvp', label: 'PvP', sub: 'Player vs Player', routeId: 'duel', icon: Swords },
  { id: 'pve', label: 'PvE', sub: 'Player vs Environment', routeId: 'patrol', icon: Shield },
  { id: 'dungeon', label: 'Dungeon', sub: 'Multi-room PvE', routeId: 'vault', icon: Map },
  { id: 'boss', label: 'Boss', sub: 'World Boss', routeId: 'colossus', icon: Skull },
];

const unwrap = (response) => response?.data ?? response ?? {};

export default function LunaAIBattleOverlay({ onClose }) {
  const presentation = useArenaPresentation();
  const battle = useBattleArena();
  const skillBook = useSkillBookLoadout();
  const [mode, setMode] = useState('pvp');
  const [worldId, setWorldId] = useState('');
  const [opponentType, setOpponentType] = useState('players');
  const [prefabId, setPrefabId] = useState('');
  const [skillPrefabs, setSkillPrefabs] = useState([]);
  const [equipmentPrefabs, setEquipmentPrefabs] = useState([]);
  const [busy, setBusy] = useState(false);

  const activeMode = useMemo(() => MODES.find((item) => item.id === mode) || MODES[0], [mode]);
  const worlds = battle.hub?.worlds || [];
  const queue = battle.hub?.queue || null;
  const queueWaiting = queue?.status === 'waiting';
  const contacts = battle.hub?.contacts || [];

  useEffect(() => {
    if (!worldId && worlds[0]?.id) setWorldId(worlds[0].id);
  }, [worldId, worlds]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await base44.functions.invoke('combatLoadoutPrefabs', { action: 'list', data: {} });
        const body = unwrap(response);
        if (body?.error) throw new Error(body.error);
        if (!cancelled) {
          setSkillPrefabs(body.skill_prefabs || []);
          setEquipmentPrefabs(body.equipment_prefabs || []);
        }
      } catch (error) {
        if (!cancelled) console.warn('AI Battle prefab list unavailable', error);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const matchedId = queue?.status === 'matched' ? String(queue.matched_encounter_id || '') : '';
    if (matchedId && !presentation.encounterId) {
      arenaPresentation.setEncounter(matchedId);
      showSuccess('Opponent found. Entering dashboard battle.');
    }
  }, [queue?.status, queue?.matched_encounter_id, presentation.encounterId]);

  const prefabOptions = useMemo(() => [
    ...skillPrefabs.map((prefab) => ({ ...prefab, optionKind: 'skill' })),
    ...equipmentPrefabs.map((prefab) => ({ ...prefab, optionKind: 'equipment' })),
  ], [skillPrefabs, equipmentPrefabs]);

  const applyPrefab = useCallback(async () => {
    if (!prefabId) return;
    const prefab = prefabOptions.find((item) => String(item.id) === String(prefabId));
    if (!prefab) return;

    if (prefab.optionKind === 'skill') {
      const response = await base44.functions.invoke('combatLoadoutPrefabs', {
        action: 'loadSkillPrefab',
        data: { prefab_id: prefab.id },
      });
      const body = unwrap(response);
      if (body?.error) throw new Error(body.error);
    } else {
      if (prefab.linked_skill_prefab_id) {
        const response = await base44.functions.invoke('combatLoadoutPrefabs', {
          action: 'loadSkillPrefab',
          data: { prefab_id: prefab.linked_skill_prefab_id },
        });
        const body = unwrap(response);
        if (body?.error) throw new Error(body.error);
      }

      const cleared = unwrap(await base44.functions.invoke('equipmentLoadout', { action: 'clear', data: {} }));
      if (cleared?.error) throw new Error(cleared.error);
      for (const [slot, item] of Object.entries(prefab.equipped_items || {})) {
        const equipped = unwrap(await base44.functions.invoke('equipmentLoadout', {
          action: 'equip',
          data: { slot, item },
        }));
        if (equipped?.error) throw new Error(equipped.error);
      }
      window.dispatchEvent(new CustomEvent('lunaEquipmentChanged', { detail: { prefab_id: prefab.id } }));
    }

    await skillBook.refetch();
    window.dispatchEvent(new Event('syncPlayerStats'));
  }, [prefabId, prefabOptions, skillBook]);

  const enterEncounter = useCallback((response) => {
    const encounterId = response?.encounter?.id || response?.matched_encounter_id || null;
    if (encounterId) arenaPresentation.setEncounter(encounterId);
    return encounterId;
  }, []);

  const queuePvp = useCallback(async () => {
    if (!worldId || busy || queueWaiting) return;
    setBusy(true);
    try {
      await applyPrefab();
      if (opponentType === 'bot') {
        const response = await battle.demoBot({ world_id: worldId });
        enterEncounter(response);
      } else {
        const response = await battle.queue({ world_id: worldId, queue_type: 'casual' });
        if (!enterEncounter(response)) showSuccess('Searching for the next player…');
      }
    } catch (error) {
      showError(error, 'AI Battle');
    } finally {
      setBusy(false);
    }
  }, [applyPrefab, battle, busy, enterEncounter, opponentType, queueWaiting, worldId]);

  const deploy = useCallback(async () => {
    if (!worldId || busy) return;
    setBusy(true);
    try {
      const route = (battle.hub?.routes || []).find((item) => item.id === activeMode.routeId);
      const maxGuests = Math.max(0, Number(route?.max || 1) - 1);
      const invitedIds = mode === 'boss'
        ? contacts.filter((contact) => contact.in_dashboard).slice(0, maxGuests).map((contact) => contact.id)
        : [];
      const response = await battle.create({
        world_id: worldId,
        route_id: activeMode.routeId,
        invited_ids: invitedIds,
      });
      enterEncounter(response);
    } catch (error) {
      showError(error, activeMode.label);
    } finally {
      setBusy(false);
    }
  }, [activeMode, battle, busy, contacts, enterEncounter, mode, worldId]);

  useEffect(() => {
    const onKey = (event) => {
      if (mode !== 'pvp' || event.key.toLowerCase() !== 'q' || event.repeat) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('input,textarea,select,[contenteditable=true]')) return;
      event.preventDefault();
      queuePvp();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, queuePvp]);

  if (presentation.encounterId) return null;

  const selectedWorld = worlds.find((item) => String(item.id) === String(worldId)) || worlds[0] || null;
  const ActiveIcon = activeMode.icon;

  return (
    <div className="fixed left-[390px] right-[338px] top-[205px] z-[130] flex justify-center pointer-events-none" data-dashboard-utility-workspace>
      <section
        aria-label="AI Battle"
        className="pointer-events-auto w-[min(610px,94%)] overflow-hidden border border-white/[0.11] bg-slate-950/76 text-white shadow-[0_24px_70px_rgba(0,0,0,.30)] backdrop-blur-2xl"
      >
        <header className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3">
          <div className="grid h-9 w-9 place-items-center border border-cyan-100/[0.12] bg-cyan-100/[0.04]"><ActiveIcon className="h-4 w-4 text-cyan-100/75" /></div>
          <div>
            <p className="text-[7px] font-black uppercase tracking-[0.18em] text-cyan-100/45">Luna</p>
            <h2 className="text-[15px] font-semibold">AI Battle</h2>
          </div>
          <button type="button" onClick={onClose} className="ml-auto grid h-8 w-8 place-items-center border border-white/[0.07] text-white/50 hover:bg-white/[0.06] hover:text-white" aria-label="Close AI Battle"><X className="h-3.5 w-3.5" /></button>
        </header>

        <div className="grid grid-cols-4 border-b border-white/[0.07]">
          {MODES.map(({ id, label, sub, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setMode(id)} className={`flex min-h-[62px] items-center gap-2 border-r border-white/[0.055] px-3 text-left last:border-r-0 ${mode === id ? 'bg-cyan-100/[0.07]' : 'bg-transparent hover:bg-white/[0.03]'}`}>
              <Icon className={`h-3.5 w-3.5 ${mode === id ? 'text-cyan-100' : 'text-white/38'}`} />
              <span><strong className="block text-[9px] text-white/90">{label}</strong><small className="mt-0.5 block text-[6px] uppercase tracking-[0.08em] text-white/30">{sub}</small></span>
            </button>
          ))}
        </div>

        <div className="p-4">
          <div className="grid grid-cols-[1fr_1fr] gap-3">
            <label className="block">
              <span className="text-[6px] font-black uppercase tracking-[0.14em] text-white/35">Game World</span>
              <select value={selectedWorld?.id || ''} onChange={(event) => setWorldId(event.target.value)} className="mt-1.5 h-9 w-full border border-white/[0.08] bg-slate-950 px-2.5 text-[8px] text-white outline-none">
                {worlds.map((world) => <option key={world.id} value={world.id}>{world.title}</option>)}
              </select>
            </label>

            {mode === 'pvp' ? (
              <label className="block">
                <span className="flex items-center gap-1.5 text-[6px] font-black uppercase tracking-[0.14em] text-white/35"><Package className="h-3 w-3" />Prefab</span>
                <select value={prefabId} onChange={(event) => setPrefabId(event.target.value)} className="mt-1.5 h-9 w-full border border-white/[0.08] bg-slate-950 px-2.5 text-[8px] text-white outline-none">
                  <option value="">Current Loadout</option>
                  {skillPrefabs.length > 0 && <optgroup label="Skill Prefabs">{skillPrefabs.map((prefab) => <option key={prefab.id} value={prefab.id}>{prefab.name}</option>)}</optgroup>}
                  {equipmentPrefabs.length > 0 && <optgroup label="Equipment Prefabs">{equipmentPrefabs.map((prefab) => <option key={prefab.id} value={prefab.id}>{prefab.name}</option>)}</optgroup>}
                </select>
              </label>
            ) : (
              <div>
                <span className="text-[6px] font-black uppercase tracking-[0.14em] text-white/35">Mode</span>
                <div className="mt-1.5 flex h-9 items-center border border-white/[0.07] px-3 text-[8px] text-white/60">{activeMode.sub}</div>
              </div>
            )}
          </div>

          {mode === 'pvp' ? (
            <div className="mt-4">
              <p className="text-[6px] font-black uppercase tracking-[0.14em] text-white/35">Opponent</p>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setOpponentType('bot')} className={`flex h-11 items-center justify-center gap-2 border text-[8px] font-semibold ${opponentType === 'bot' ? 'border-cyan-100/20 bg-cyan-100/[0.08] text-white' : 'border-white/[0.07] text-white/45 hover:bg-white/[0.03]'}`}><Bot className="h-3.5 w-3.5" />Bot</button>
                <button type="button" onClick={() => setOpponentType('players')} className={`flex h-11 items-center justify-center gap-2 border text-[8px] font-semibold ${opponentType === 'players' ? 'border-cyan-100/20 bg-cyan-100/[0.08] text-white' : 'border-white/[0.07] text-white/45 hover:bg-white/[0.03]'}`}><Users className="h-3.5 w-3.5" />Players</button>
              </div>

              <button type="button" disabled={busy || queueWaiting || !worldId} onClick={queuePvp} className="mt-3 flex h-12 w-full items-center justify-center gap-3 border border-cyan-100/18 bg-cyan-100/[0.09] text-[9px] font-black uppercase tracking-[0.12em] text-cyan-50 disabled:opacity-35">
                {busy || queueWaiting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
                {queueWaiting ? 'Searching for Player…' : `Q · Queue ${opponentType === 'bot' ? 'Bot' : 'Players'}`}
              </button>

              {queueWaiting && (
                <div className="mt-2 flex items-center justify-between text-[7px] text-white/38">
                  <span>Waiting for the next player who enters this queue.</span>
                  <button type="button" onClick={() => battle.cancelQueue().catch((error) => showError(error, 'Queue'))} className="text-rose-100/65 hover:text-rose-100">Cancel</button>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4">
              <button type="button" disabled={busy || !worldId} onClick={deploy} className="flex h-12 w-full items-center justify-center gap-3 border border-cyan-100/18 bg-cyan-100/[0.09] text-[9px] font-black uppercase tracking-[0.12em] text-cyan-50 disabled:opacity-35">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'boss' ? <Crown className="h-4 w-4" /> : <ActiveIcon className="h-4 w-4" />}
                Enter {activeMode.label}
              </button>
              {mode === 'boss' && <p className="mt-2 text-center text-[7px] text-white/35">Boss battles use players already present on your dashboard. At least two combatants are required.</p>}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
