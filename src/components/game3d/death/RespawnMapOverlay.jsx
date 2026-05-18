// ─── Respawn Map Overlay ───────────────────────────────────────────────
// Shown after the death tips screen. Top-down map view of the world
// centered on where the player died. The player picks one of three
// respawn locations — all near the death position by default.
//
// On selection: dispatches `playerRespawn` with the chosen { x, z } so the
// game world can teleport + revive the player, then resets death phase.

import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, Heart } from 'lucide-react';
import { getDeathState, setDeathPhase } from './deathStore';
import { setHP, getPlayerHUD } from '../playerHUDStore';

// Map view extents (world units) around the death point
const MAP_RADIUS = 30;
const MAP_PX = 480; // rendered size

function worldToScreen(x, z, centerX, centerZ) {
  // Convert a world (x, z) relative to the center into 0..MAP_PX pixel coords.
  const px = ((x - centerX + MAP_RADIUS) / (MAP_RADIUS * 2)) * MAP_PX;
  const py = ((z - centerZ + MAP_RADIUS) / (MAP_RADIUS * 2)) * MAP_PX;
  return { px, py };
}

export default function RespawnMapOverlay() {
  const death = getDeathState();
  const center = death.deathPosition || { x: 0, z: 0 };

  // Three nearby spawn candidates: close, medium, far.
  const choices = useMemo(() => [
    { id: 'close',  label: 'Nearby',       distance: '5m',  pos: { x: center.x + 5,  z: center.z + 2 } },
    { id: 'medium', label: 'Safe Distance', distance: '15m', pos: { x: center.x - 12, z: center.z + 8 } },
    { id: 'far',    label: 'Outpost',       distance: '25m', pos: { x: center.x + 18, z: center.z - 18 } },
  ], [center.x, center.z]);

  const [selected, setSelected] = useState('close');

  const handleRespawn = () => {
    const choice = choices.find((c) => c.id === selected) || choices[0];
    // Full heal on respawn
    const { maxHP } = getPlayerHUD();
    setHP(maxHP);
    // Tell the world to teleport the player
    window.dispatchEvent(new CustomEvent('playerRespawn', { detail: { x: choice.pos.x, z: choice.pos.z } }));
    setDeathPhase('alive', { deathPosition: null });
  };

  // Death marker (always at map center)
  const death_px = MAP_PX / 2;

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <div className="text-red-400 text-xs uppercase tracking-[0.4em] mb-2">You Died</div>
          <h2 className="text-white text-3xl font-bold tracking-wider">Choose a Respawn Point</h2>
          <p className="text-white/50 text-sm mt-1">Select a location near where you fell</p>
        </div>

        {/* Map */}
        <div
          className="relative rounded-2xl overflow-hidden border border-white/15"
          style={{
            width: MAP_PX,
            height: MAP_PX,
            background:
              'radial-gradient(circle at center, rgba(40,50,70,0.6) 0%, rgba(10,12,18,0.95) 75%)',
          }}
        >
          {/* Grid */}
          <svg className="absolute inset-0" width={MAP_PX} height={MAP_PX}>
            {Array.from({ length: 7 }).map((_, i) => (
              <g key={i} stroke="rgba(255,255,255,0.06)" strokeWidth="1">
                <line x1={0} y1={(i + 1) * (MAP_PX / 8)} x2={MAP_PX} y2={(i + 1) * (MAP_PX / 8)} />
                <line x1={(i + 1) * (MAP_PX / 8)} y1={0} x2={(i + 1) * (MAP_PX / 8)} y2={MAP_PX} />
              </g>
            ))}
          </svg>

          {/* Death marker */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
            style={{ left: death_px, top: death_px }}
          >
            <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-500/30 animate-pulse" />
            <span className="text-red-300 text-[10px] mt-1 font-bold tracking-wider">DIED HERE</span>
          </div>

          {/* Spawn choices */}
          {choices.map((c) => {
            const { px, py } = worldToScreen(c.pos.x, c.pos.z, center.x, center.z);
            const isSelected = selected === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
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
                  {c.label} · {c.distance}
                </div>
              </button>
            );
          })}
        </div>

        {/* Confirm */}
        <button
          onClick={handleRespawn}
          className="px-8 py-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/40"
        >
          <Heart className="w-5 h-5" />
          Respawn at {choices.find((c) => c.id === selected)?.label}
        </button>
      </div>
    </div>
  );
}