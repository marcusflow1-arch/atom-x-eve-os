import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { toast } from 'react-hot-toast';
import { AXEInteractionSystem, createAXEInteractable } from '../axe/interactions/AXEInteractionSystem';
import { LOOT_RARITIES } from '../lootStore';
import { createDiscoveryGather } from './discoveryGather';
import { claimExplorationDiscovery, getDiscoveryAvailability, subscribeDiscoveryClaims } from './explorationDiscoveryStore';
import { DISCOVERY_MATERIALS, ELITE_SKILLS, EXPLORATION_DISCOVERIES } from '../../../../base44/shared/explorationDiscoveries.ts';

/**
 * ExplorationDiscoveryMount — discoveries out in the land (docs/game3d/EXPLORATION_DISCOVERIES.md).
 * Places each discovery in the scene, shows the prompt when the hero is in reach, runs the
 * short gather on E and asks for the reward (the server's, for a character it keeps).
 * Reads the hero's position from window.__localPlayerPos; it does not touch GameWorld3D.
 */
const SPOT_RADIUS_M = 30; // close enough to have seen it: a location_discovered quest event
const VERB = { Gather: 'Gathering', Inspect: 'Inspecting' };

const minutesUntil = (iso) => Math.max(1, Math.ceil((Date.parse(iso) - Date.now()) / 60_000));
const REFUSALS = {
  already_claimed: () => 'Already found.',
  respawning: (r) => `Depleted — returns in ${minutesUntil(r.nextAvailableAt)} min.`,
  too_far: () => 'Too far away to reach it.',
  too_fast: () => 'Too fast — try again.',
  busy: () => 'Already working on it.',
  level_too_low: () => 'You are not strong enough to take this yet.',
  saving_your_character_try_again: () => 'Saving your character — try again in a moment.',
  choose_which_save_to_keep_first: () => 'Choose which save to keep first.',
};
const refusalText = (r) => (REFUSALS[r.reason] || (() => 'Not gathered — discoveries need a server connection.'))(r);

function rewardText(result) {
  const counts = new Map();
  for (const u of result.units) counts.set(u.name || u.id, (counts.get(u.name || u.id) || 0) + 1);
  const parts = [...counts].map(([name, n]) => `${n}× ${name}`);
  const skills = result.skills.map((id) => ELITE_SKILLS[id]?.name || id);
  if (skills.length) return `Learned ${skills.join(', ')}${parts.length ? ` · ${parts.join(', ')}` : ''}`;
  return parts.length ? `Gathered ${parts.join(', ')}` : 'Nothing here this time.';
}

// a crystal cluster for a material node, a standing tablet for an elite find
function buildMarker(def) {
  const group = new THREE.Group();
  group.name = `Discovery_${def.id}`;
  group.position.set(def.position[0], def.position[1], def.position[2]);
  if (def.kind === 'elite_find') {
    const stone = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.7, 0.25), new THREE.MeshStandardMaterial({ color: 0x6f6a60, roughness: 0.95 }));
    stone.position.y = 0.85;
    stone.castShadow = true;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.04, 8, 48), new THREE.MeshStandardMaterial({ color: 0xf5d68a, emissive: 0xf5d68a, emissiveIntensity: 0.9, transparent: true, opacity: 0.85 }));
    ring.material.userData.baseOpacity = 0.85;
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    group.add(stone, ring);
  } else {
    const first = def.rewards.find((r) => r.type === 'material');
    const rarity = LOOT_RARITIES[DISCOVERY_MATERIALS[first?.itemId]?.rarity] || LOOT_RARITIES.rare;
    const material = new THREE.MeshStandardMaterial({ color: rarity.hex, emissive: rarity.glow, emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.1, transparent: true, opacity: 1 });
    const geometry = new THREE.OctahedronGeometry(0.35, 0);
    [[0, 0.55, 0, 1.4], [0.45, 0.35, 0.2, 0.9], [-0.35, 0.3, -0.25, 1], [0.1, 0.25, -0.5, 0.7]].forEach(([x, y, z, s]) => {
      const crystal = new THREE.Mesh(geometry, material);
      crystal.position.set(x, y, z);
      crystal.scale.set(s * 0.7, s * 1.5, s * 0.7);
      crystal.castShadow = true;
      group.add(crystal);
    });
  }
  return group;
}

const setMarkerState = (group, state) => {
  group.visible = state !== 'claimed';
  group.traverse((node) => {
    if (!node.isMesh || !node.material?.transparent) return;
    node.material.opacity = state === 'respawning' ? 0.22 : node.material.userData.baseOpacity ?? 1;
  });
};

export default function ExplorationDiscoveryMount() {
  const [view, setView] = useState({ target: null, gather: null });

  useEffect(() => {
    let disposed = false;
    let raf = 0;
    let scene = null;
    const markers = new Map(); // id -> group
    const system = new AXEInteractionSystem();
    const gather = createDiscoveryGather();
    const spotted = new Set();
    let lastProgress = -1;

    const items = EXPLORATION_DISCOVERIES.map((def) => system.register(createAXEInteractable({
      id: def.id, name: def.name, type: def.interaction, range: def.range, priority: 6,
      position: { x: def.position[0], y: def.position[1], z: def.position[2] },
      prompt: `${def.interaction} ${def.name}`, metadata: { discoveryId: def.id, kind: def.kind },
    })));

    // prompts and markers follow each discovery's state (taken, respawning, ready)
    const refresh = () => {
      for (const item of items) {
        const def = EXPLORATION_DISCOVERIES.find((d) => d.id === item.id);
        const open = getDiscoveryAvailability(def.id);
        const state = open.available ? 'ready' : open.reason === 'respawning' ? 'respawning' : 'claimed';
        item.enabled = state !== 'claimed';
        item.prompt = state === 'respawning' ? `${def.name} — returns in ${minutesUntil(open.nextAvailableAt)} min` : `${def.interaction} ${def.name}`;
        item.metadata.state = state;
        const marker = markers.get(def.id);
        if (marker) setMarkerState(marker, state);
      }
      system.emit();
    };

    const attach = () => {
      if (disposed || scene || !window.__gw3dScene) return;
      scene = window.__gw3dScene;
      for (const def of EXPLORATION_DISCOVERIES) {
        const marker = buildMarker(def);
        scene.add(marker);
        markers.set(def.id, marker);
      }
      refresh();
    };
    const detach = () => {
      markers.forEach((group) => {
        group.parent?.remove(group);
        group.traverse((node) => { node.geometry?.dispose?.(); node.material?.dispose?.(); });
      });
      markers.clear();
      scene = null;
    };
    attach();
    window.addEventListener('gw3dSceneReady', attach);
    window.addEventListener('gw3dSceneTeardown', detach);
    const unsubscribeClaims = subscribeDiscoveryClaims(refresh);
    const unsubscribeTarget = system.subscribe((snap) => setView((v) => ({ ...v, target: snap.target })));
    const countdown = window.setInterval(refresh, 15_000);

    const finish = async (def) => {
      const result = await claimExplorationDiscovery(def.id, { position: window.__localPlayerPos || null });
      if (disposed) return;
      if (result.ok) toast(rewardText(result), { icon: def.kind === 'elite_find' ? '📜' : '⛏️' });
      else toast(refusalText(result), { icon: '⌛' });
      refresh();
    };

    const onKey = (e) => {
      if (e.repeat || e.key?.toLowerCase() !== 'e') return;
      if (e.target?.matches?.('input, textarea, select')) return;
      const target = system.target;
      if (!target || gather.snapshot().active) return;
      const def = EXPLORATION_DISCOVERIES.find((d) => d.id === target.id);
      const open = getDiscoveryAvailability(def.id);
      if (!open.available) { toast(refusalText(open), { icon: '⌛' }); return; }
      if (gather.start(def, window.__localPlayerPos)) setView((v) => ({ ...v, gather: { id: def.id, verb: VERB[def.interaction] || 'Working', progress: 0 } }));
    };
    window.addEventListener('keydown', onKey);

    const tick = () => {
      if (disposed) return;
      const p = window.__localPlayerPos;
      if (p) {
        system.updateTarget(p);
        for (const def of EXPLORATION_DISCOVERIES) {
          if (spotted.has(def.id) || Math.hypot(p.x - def.position[0], p.z - def.position[2]) > SPOT_RADIUS_M) continue;
          spotted.add(def.id);
          window.dispatchEvent(new CustomEvent('axeQuestEvent', { detail: { type: 'location_discovered', targetId: def.id, count: 1 } }));
        }
        const step = gather.update(p);
        if (step.done) { lastProgress = -1; setView((v) => ({ ...v, gather: null })); finish(step.done); }
        else if (step.cancelled) { lastProgress = -1; setView((v) => ({ ...v, gather: null })); toast('Interrupted — you moved away.', { icon: '✋' }); }
        else {
          const { active, progress } = gather.snapshot();
          if (active && progress - lastProgress >= 0.02) { lastProgress = progress; setView((v) => (v.gather ? { ...v, gather: { ...v.gather, progress } } : v)); }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearInterval(countdown);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('gw3dSceneReady', attach);
      window.removeEventListener('gw3dSceneTeardown', detach);
      unsubscribeClaims();
      unsubscribeTarget();
      detach();
    };
  }, []);

  const { target, gather } = view;
  if (!target && !gather) return null;
  const respawning = target?.metadata?.state === 'respawning';
  return (
    <div className="pointer-events-none absolute left-1/2 bottom-24 z-[120] -translate-x-1/2" data-exploration-discovery={gather?.id || target?.id}>
      <div className="flex min-w-[220px] flex-col gap-1.5 rounded-2xl border border-amber-200/30 bg-slate-950/75 px-4 py-2 text-sm text-white shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          {!gather && !respawning && <span className="rounded border border-amber-200/40 bg-amber-300/15 px-2 py-0.5 font-mono text-xs text-amber-100">E</span>}
          <span className={respawning && !gather ? 'text-white/55' : ''}>{gather ? `${gather.verb}…` : target.prompt}</span>
        </div>
        {gather && (
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-amber-200/80" style={{ width: `${Math.round(gather.progress * 100)}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}
