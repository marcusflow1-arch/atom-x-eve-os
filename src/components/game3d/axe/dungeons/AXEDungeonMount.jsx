import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { createAXEInteractable } from '../interactions/AXEInteractionSystem';
import { getPlayerHUD, getAXEPowerProgression } from '../../playerHUDStore';
import {
  canEnterAXEDungeon,
  enterAXEDungeon,
  getAXEDungeonState,
  subscribeAXEDungeons,
} from './AXEDungeonStore';
import {
  getAXEDungeonDefinition,
  getAXEDungeonPrototypeEntrances,
} from './AXEDungeonSystem';
import {
  getAXEAccessItemCount,
  subscribeAXEAccessItems,
} from './AXEAccessItemStore';

function createPortalMarker(scene, entry, gated) {
  const group = new THREE.Group();
  group.name = `AXE_DungeonPortal_${entry.dungeonId}`;
  group.position.set(entry.position.x, entry.position.y, entry.position.z);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.08, 10, 48),
    new THREE.MeshStandardMaterial({
      color: gated ? 0xf0abfc : 0x67e8f9,
      emissive: gated ? 0x5b165f : 0x0d3d48,
      emissiveIntensity: 1.2,
      roughness: 0.35,
      metalness: 0.45,
    }),
  );
  ring.rotation.y = Math.PI / 2;
  ring.position.y = 1.25;
  group.add(ring);

  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(1.45, 1.45, 0.12, 32),
    new THREE.MeshStandardMaterial({
      color: gated ? 0x5b214f : 0x153745,
      roughness: 0.7,
      metalness: 0.15,
    }),
  );
  pad.position.y = 0.06;
  group.add(pad);

  scene.add(group);
  return group;
}

export default function AXEDungeonMount() {
  const [dungeonState, setDungeonState] = useState(getAXEDungeonState());
  const [accessVersion, setAccessVersion] = useState(0);
  const [notice, setNotice] = useState(null);

  useEffect(() => subscribeAXEDungeons(setDungeonState), []);
  useEffect(() => subscribeAXEAccessItems(() => setAccessVersion((v) => v + 1)), []);

  useEffect(() => {
    let disposed = false;
    let timer = 0;
    let registered = false;
    let scene = null;
    const markerGroups = [];
    const registeredIds = [];

    const setup = () => {
      if (disposed || registered) return;
      const interactions = window.__axeInteractions;
      scene = window.__gw3dScene;
      if (!interactions || !scene) return;

      for (const entry of getAXEDungeonPrototypeEntrances()) {
        const def = getAXEDungeonDefinition(entry.dungeonId);
        if (!def) continue;
        const gated = !!entry.accessItemId;
        const marker = createPortalMarker(scene, entry, gated);
        markerGroups.push(marker);

        const interactableId = `AXE_Interact_Dungeon_${def.id}`;
        registeredIds.push(interactableId);

        interactions.register(createAXEInteractable({
          id: interactableId,
          name: def.name,
          type: 'Enter',
          position: entry.position,
          range: 3.8,
          priority: gated ? 16 : 15,
          prompt: gated ? `Enter ${def.name} (SOS Access)` : `Enter ${def.name}`,
          metadata: {
            dungeonId: def.id,
            accessItemId: entry.accessItemId,
            prototype: true,
          },
          onInteract: () => {
            const hud = getPlayerHUD();
            const power = getAXEPowerProgression();
            const check = canEnterAXEDungeon(def.id, {
              playerLevel: hud?.level || 1,
              powerTier: power?.powerTier || 0,
            });

            if (!check.ok && check.hardBlocked) {
              const message = check.reason === 'ACCESS_ITEM_REQUIRED'
                ? `SOS Access required for ${def.name}.`
                : check.reason === 'POWER_REQUIRED'
                  ? `Power Tier ${check.requiredPowerTier} required.`
                  : `Cannot enter ${def.name}.`;
              setNotice({ type: 'blocked', message });
              window.setTimeout(() => setNotice(null), 2600);
              return { state: 'idle' };
            }

            const result = enterAXEDungeon(def.id, {
              playerLevel: hud?.level || 1,
              powerTier: power?.powerTier || 0,
            });

            if (!result.ok) {
              setNotice({ type: 'blocked', message: result.reason });
              window.setTimeout(() => setNotice(null), 2600);
              return { state: 'idle' };
            }

            setNotice({
              type: 'entered',
              message: `${def.name} session created. Interior handoff is now active.`,
            });
            window.setTimeout(() => setNotice(null), 2600);
            window.dispatchEvent(new CustomEvent('axeDungeonPrototypeEnter', {
              detail: {
                dungeonId: def.id,
                session: result.session,
                entrancePosition: entry.position,
              },
            }));
            return { state: 'idle' };
          },
        }));
      }

      registered = true;
      window.dispatchEvent(new CustomEvent('axeDungeonLayerReady', {
        detail: { entrances: registeredIds.length },
      }));
    };

    setup();
    timer = window.setInterval(setup, 250);

    return () => {
      disposed = true;
      window.clearInterval(timer);
      const interactions = window.__axeInteractions;
      registeredIds.forEach((id) => interactions?.unregister?.(id));
      markerGroups.forEach((group) => {
        group.traverse?.((node) => {
          node.geometry?.dispose?.();
          if (Array.isArray(node.material)) node.material.forEach((m) => m?.dispose?.());
          else node.material?.dispose?.();
        });
        group.parent?.remove(group);
      });
    };
  }, []);

  const active = dungeonState.activeSession;
  const sosCount = getAXEAccessItemCount('AXE_Item_SOS_Access');

  return (
    <>
      {notice && (
        <div className="pointer-events-none absolute left-1/2 top-24 z-[140] -translate-x-1/2">
          <div className={`rounded-xl border px-4 py-2 text-sm backdrop-blur-xl ${
            notice.type === 'blocked'
              ? 'border-rose-300/30 bg-rose-950/75 text-rose-100'
              : 'border-cyan-300/30 bg-slate-950/80 text-cyan-100'
          }`}>
            {notice.message}
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute right-4 top-24 z-[120] rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-[10px] text-white/55 backdrop-blur-lg">
        <div className="uppercase tracking-[0.2em] text-white/35">Dungeon Prototype</div>
        <div className="mt-1">SOS Access: <b className="text-fuchsia-200">{sosCount}</b></div>
        {active && (
          <div className="mt-1 max-w-[220px] truncate text-cyan-200/80">
            Active: {getAXEDungeonDefinition(active.dungeonId)?.name || active.dungeonId}
          </div>
        )}
      </div>
    </>
  );
}
