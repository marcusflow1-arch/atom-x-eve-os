import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { createAXEInteractable } from '../interactions/AXEInteractionSystem';
import { getActiveCharacter } from '../../characterStore';
import { getAXEPowerProgression } from '../../playerHUDStore';
import {
  AXE_WAR_CONFIG,
  AXE_WAR_DEFENSES,
  AXE_WAR_MAPS,
  getAXEWarMap,
} from './AXEFactionWarSystem';
import {
  damageAXEWarDefense,
  getAXEFactionWarState,
  joinAXEFactionWar,
  subscribeAXEFactionWar,
  tickAXECentralCapture,
} from './AXEFactionWarStore';

const distance2D = (a, b) => Math.hypot(
  Number(a?.x || 0) - Number(b?.x || 0),
  Number(a?.z || 0) - Number(b?.z || 0),
);

function createWarMarker(scene, position, {
  color = 0xef4444,
  radius = 2.5,
  height = 0.25,
  name = 'AXE_WarMarker',
} = {}) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 32),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.25,
      roughness: 0.7,
      metalness: 0.1,
      transparent: true,
      opacity: 0.8,
    }),
  );
  mesh.name = name;
  mesh.position.set(position.x, position.y + height / 2, position.z);
  scene.add(mesh);
  return mesh;
}

function formatRemaining(ms = 0) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

export default function AXEFactionWarRuntime() {
  const [state, setState] = useState(() => getAXEFactionWarState());
  const [notice, setNotice] = useState(null);
  const lastCaptureTick = useRef(0);

  useEffect(() => subscribeAXEFactionWar(setState), []);

  // Refresh phase/countdown against the wall clock even if no score changes.
  useEffect(() => {
    const id = window.setInterval(() => setState(getAXEFactionWarState()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // World markers + attackable faction defenses.
  useEffect(() => {
    let disposed = false;
    let setupTimer = 0;
    let registered = false;
    const meshes = [];
    const interactionIds = [];

    const setup = () => {
      if (disposed || registered) return;
      const scene = window.__gw3dScene;
      const interactions = window.__axeInteractions;
      if (!scene || !interactions) return;

      const central = AXE_WAR_MAPS.find((map) => map.type === 'central_objective');
      if (central) {
        meshes.push(createWarMarker(scene, central.prototypePosition, {
          color: 0x22d3ee,
          radius: 5.5,
          height: 0.12,
          name: 'AXE_War_CentralObjective',
        }));
      }

      for (const def of AXE_WAR_DEFENSES) {
        const color = def.type === 'core' ? 0xf43f5e : def.type === 'shield' ? 0xa78bfa : 0xf59e0b;
        meshes.push(createWarMarker(scene, def.position, {
          color,
          radius: def.type === 'core' ? 3.5 : 2.2,
          height: def.type === 'tower' ? 4 : 2.4,
          name: def.id,
        }));

        const id = `AXE_WarDefenseInteract_${def.id}`;
        interactionIds.push(id);
        interactions.register(createAXEInteractable({
          id,
          name: def.id,
          type: 'Activate',
          position: def.position,
          range: 5,
          priority: 14,
          prompt: def.type === 'core' ? 'Attack Homeland Core' : `Attack ${def.type === 'shield' ? 'Shield' : 'Defense Tower'}`,
          metadata: { defenseId: def.id, mapId: def.mapId },
          onInteract: () => {
            const war = getAXEFactionWarState();
            const factionId = war.player.joinedFactionId;
            if (!factionId || war.player.joinedCycleId !== war.cycle.cycleId) {
              setNotice({ type: 'blocked', message: 'Join the active faction war before attacking war objectives.' });
              window.setTimeout(() => setNotice(null), 2200);
              return { state: 'idle' };
            }
            const result = damageAXEWarDefense(def.id, 2500, factionId);
            setNotice({
              type: result.ok ? 'ok' : 'blocked',
              message: result.ok
                ? (result.destroyed ? 'Defense destroyed.' : `Objective HP: ${Math.round(result.hp)}`)
                : result.reason === 'INVASION_ROUTE_LOCKED'
                  ? 'Destroy the earlier route shields before advancing.'
                  : result.reason,
            });
            window.setTimeout(() => setNotice(null), 1800);
            return { state: 'idle' };
          },
        }));
      }

      registered = true;
    };

    setup();
    setupTimer = window.setInterval(setup, 250);

    return () => {
      disposed = true;
      window.clearInterval(setupTimer);
      const interactions = window.__axeInteractions;
      interactionIds.forEach((id) => interactions?.unregister?.(id));
      meshes.forEach((mesh) => {
        mesh.parent?.remove(mesh);
        mesh.geometry?.dispose?.();
        mesh.material?.dispose?.();
      });
    };
  }, []);

  // Standing inside the central objective advances the joined faction's capture.
  useEffect(() => {
    const id = window.setInterval(() => {
      const war = getAXEFactionWarState();
      if (war.cycle.phase !== 'battle') return;
      if (war.player.joinedCycleId !== war.cycle.cycleId || !war.player.joinedFactionId) return;

      const central = getAXEWarMap('AXE_WarMap_Central');
      const playerPos = window.__localPlayerPos;
      if (!central || !playerPos || distance2D(playerPos, central.prototypePosition) > 7.5) return;

      const now = Date.now();
      const delta = lastCaptureTick.current ? Math.max(0.1, (now - lastCaptureTick.current) / 1000) : 1;
      lastCaptureTick.current = now;

      // Contested-state detection will move to the authoritative war service.
      // Browser fallback advances only the local faction's prototype capture.
      tickAXECentralCapture({
        factionId: war.player.joinedFactionId,
        deltaSeconds: Math.min(2, delta),
        contested: false,
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const character = getActiveCharacter();
  const activeFactionId = character?.factionId || 'AXE_Faction_Unassigned';
  const joined = state.player.joinedCycleId === state.cycle.cycleId;
  const centralProgress = joined
    ? Number(state.shared.centralCaptureProgress?.[state.player.joinedFactionId] || 0)
    : 0;
  const scores = useMemo(
    () => Object.entries(state.shared.factionScores || {}).sort((a, b) => Number(b[1]) - Number(a[1])),
    [state.shared.factionScores],
  );

  const handleJoin = async () => {
    const powerTier = getAXEPowerProgression()?.powerTier || 0;
    const result = await joinAXEFactionWar({ powerTier });
    setNotice({
      type: result.ok ? 'ok' : 'blocked',
      message: result.ok
        ? 'Joined faction war.'
        : result.reason === 'FACTION_REQUIRED'
          ? 'Choose a faction on your character before joining faction war.'
          : result.reason,
    });
    window.setTimeout(() => setNotice(null), 2400);
  };

  return (
    <>
      <div className="absolute left-4 top-[230px] z-[126] w-[290px] rounded-2xl border border-red-300/15 bg-slate-950/72 p-4 text-white backdrop-blur-xl">
        <div className="text-[9px] font-semibold uppercase tracking-[0.28em] text-red-200/60">Faction War</div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold capitalize">{state.cycle.phase}</div>
          <div className="font-mono text-xs text-white/50">{formatRemaining(state.cycle.remainingMs)}</div>
        </div>

        <div className="mt-2 text-[10px] text-white/35">
          Cycle repeats every {AXE_WAR_CONFIG.cycleMinutes} minutes · Faction: {activeFactionId}
        </div>

        {!joined && ['registration', 'battle'].includes(state.cycle.phase) && (
          <button
            onClick={handleJoin}
            className="mt-3 w-full rounded-xl border border-red-300/20 bg-red-300/[0.08] px-3 py-2 text-xs font-semibold text-red-100"
          >
            Join War
          </button>
        )}

        {joined && (
          <div className="mt-3 space-y-2">
            <div className="rounded-lg bg-white/[0.04] px-3 py-2 text-xs text-white/60">
              Bracket: <b className="text-white/80">{state.player.bracketId}</b>
            </div>
            <div className="rounded-lg bg-white/[0.04] px-3 py-2">
              <div className="flex justify-between text-[10px] text-white/45">
                <span>Central Objective</span>
                <span>{Math.min(AXE_WAR_CONFIG.captureSeconds, Math.round(centralProgress))}/{AXE_WAR_CONFIG.captureSeconds}s</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-cyan-300/80"
                  style={{ width: `${Math.min(100, (centralProgress / AXE_WAR_CONFIG.captureSeconds) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {state.shared.centralOwnerFactionId && (
          <div className="mt-3 text-xs text-cyan-200/70">
            Central control: {state.shared.centralOwnerFactionId}
          </div>
        )}

        {scores.length > 0 && (
          <div className="mt-3 border-t border-white/10 pt-2">
            <div className="mb-1 text-[9px] uppercase tracking-widest text-white/30">Score</div>
            {scores.slice(0, 3).map(([factionId, score]) => (
              <div key={factionId} className="flex justify-between text-[10px] text-white/50">
                <span>{factionId}</span><span>{score}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {notice && (
        <div className="pointer-events-none absolute left-1/2 top-24 z-[160] -translate-x-1/2">
          <div className={`rounded-xl border px-4 py-2 text-sm backdrop-blur-xl ${
            notice.type === 'blocked'
              ? 'border-rose-300/30 bg-rose-950/80 text-rose-100'
              : 'border-emerald-300/30 bg-emerald-950/75 text-emerald-100'
          }`}>
            {notice.message}
          </div>
        </div>
      )}
    </>
  );
}
