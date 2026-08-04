// ─── Respawn Map Overlay ───────────────────────────────────────────────
// Shown after the death tips screen. Top-down map of the world's real spawn
// points, with the player's saved checkpoint pre-selected. The player picks
// one of the map's valid spawn points — never an arbitrary offset from where
// they died, and never another player's location.
//
// On confirm: saves the chosen point as this character's checkpoint (scoped
// to the logged-in user), dispatches `playerRespawn` so the world teleports
// and revives the player, then clears the death phase.

import React, { useMemo, useState } from 'react';
import { MapPin, Heart, Skull } from 'lucide-react';
import { getDeathState, setDeathPhase } from './deathStore';
import { setHP, getPlayerHUD } from '../playerHUDStore';
import {
  MAP_SPAWN_POINTS,
  getRespawnPoint,
  saveCheckpointId,
} from '../mapSpawnPoints';

const MAP_PX = 480;
const WORLD_EXTENT = 45; // half-size of the mapped world area, in world units

function worldToScreen(x, z) {
  const px = ((x + WORLD_EXTENT) / (WORLD_EXTENT * 2)) * MAP_PX;
  const py = ((z + WORLD_EXTENT) / (WORLD_EXTENT * 2)) * MAP_PX;
  return { px, py };
}

const dist2D = (a, b) => Math.round(Math.hypot(a.x - b.x, a.z - b.z));

export default function RespawnMapOverlay() {
  const death = getDeathState();
  const deathPos = death.deathPosition || { x: 0, z: 0 };

  // Saved checkpoint (or the map default) is the starting selection.
  const [selected, setSelected] = useState(() => getRespawnPoint().id);
  const points = useMemo(() => MAP_SPAWN_POINTS, []);
  const selectedPoint = points.find((p) => p.id === selected) || getRespawnPoint();

  const handleRespawn = () => {
    const point = selectedPoint;
    saveCheckpointId(point.id);
    const { maxHP } = getPlayerHUD();
    setHP(maxHP);
    window.dispatchEvent(new CustomEvent('playerRespawn', {
      detail: { x: point.x, z: point.z, spawnId: point.id },
    }));
    setDeathPhase('alive', { deathPosition: null });
  };

  const deathMarker = worldToScreen(deathPos.x, deathPos.z);

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <div className="text-red-400 text-xs uppercase tracking-[0.4em] mb-2">You Died</div>
          <h2 className="text-white text-3xl font-bold tracking-wider">Choose a Respawn Point</h2>
          <p className="text-white/50 text-sm mt-1">Your last checkpoint is selected by default</p>
        </div>

        <div
          className="relative rounded-2xl overflow-hidden border border-white/15"
          style={{
            width: MAP_PX,
            height: MAP_PX,
            background: 'radial-gradient(circle at center, rgba(40,50,70,0.6) 0%, rgba(10,12,18,0.95) 75%)',
          }}
        >
          <svg className="absolute inset-0" width={MAP_PX} height={MAP_PX}>
            {Array.from({ length: 7 }).map((_, i) => (
              <g key={i} stroke="rgba(255,255,255,0.06)" strokeWidth="1">
                <line x1={0} y1={(i + 1) * (MAP_PX / 8)} x2={MAP_PX} y2={(i + 1) * (MAP_PX / 8)} />
                <line x1={(i + 1) * (MAP_PX / 8)} y1={0} x2={(i + 1) * (MAP_PX / 8)} y2={MAP_PX} />
              </g>
            ))}
          </svg>

          {/* Where you fell */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
            style={{ left: deathMarker.px, top: deathMarker.py }}
          >
            <Skull className="w-4 h-4 text-red-400" />
            <span className="text-red-300 text-[10px] mt-0.5 font-bold tracking-wider">DIED HERE</span>
          </div>

          {/* Valid map spawn points */}
          {points.map((p) => {
            const { px, py } = worldToScreen(p.x, p.z);
            const isSelected = selected === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
                style={{ left: px, top: py }}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-cyan-400 ring-4 ring-cyan-400/40 scale-110'
                      : 'bg-cyan-600/60 ring-2 ring-cyan-400/30 group-hover:bg-cyan-500'
                  }`}
                >
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div
                  className={`mt-1 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                    isSelected ? 'bg-cyan-400 text-black' : 'bg-black/70 text-cyan-200'
                  }`}
                >
                  {p.label} · {dist2D(p, deathPos)}m
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleRespawn}
          className="px-8 py-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/40"
        >
          <Heart className="w-5 h-5" />
          Respawn at {selectedPoint.label}
        </button>
      </div>
    </div>
  );
}