import React, { useEffect, useState } from 'react';
import { Compass, Target } from 'lucide-react';
import { subscribeQuests } from '../useQuestStore';
import { subscribePlayerPosition } from '../playerPositionStore';
import { QUESTS, QUEST_NPCS } from '../questData';

// World units shown across the minimap diameter.
const MAP_RANGE = 40;
const MAP_SIZE  = 150; // px, matches the visual size below

/**
 * Top-left HUD block: minimap + quest tracker.
 * - Minimap: live player position (centered, rotated with facing), with quest NPC pings.
 * - Quest tracker: most recently accepted active quest, with live progress.
 */
export default function HUDMinimapQuest() {
  const [quests, setQuests] = useState(null);
  const [pos, setPos] = useState({ x: 0, z: 0, yaw: 0 });

  useEffect(() => subscribeQuests(setQuests), []);
  useEffect(() => subscribePlayerPosition(setPos), []);

  // Resolve the tracked active quest (if any)
  const tracked = (() => {
    if (!quests) return null;
    const id = quests.lastAcceptedId && quests.acceptedIds.includes(quests.lastAcceptedId)
      ? quests.lastAcceptedId
      : quests.acceptedIds[quests.acceptedIds.length - 1];
    if (!id) return null;
    const q = QUESTS.find((x) => x.id === id);
    if (!q) return null;
    const current = quests.progress?.[id] || 0;
    const total = q.objective.count;
    return { quest: q, current, total };
  })();

  // Project quest-NPC world positions onto the minimap (centered on player, rotated to player yaw)
  const npcMarkers = (() => {
    if (!quests) return [];
    const half = MAP_SIZE / 2;
    const scale = MAP_SIZE / MAP_RANGE; // world units → px
    const cosY = Math.cos(-pos.yaw);
    const sinY = Math.sin(-pos.yaw);
    const out = [];
    QUEST_NPCS.forEach((npc) => {
      // Status: turn_in > available > active-but-not-here. We just show the NPCs you have business with.
      const acceptedHere = QUESTS.find(
        (q) => q.npcId === npc.id && quests.acceptedIds.includes(q.id)
      );
      const availableHere = QUESTS.find(
        (q) => q.npcId === npc.id &&
               !quests.acceptedIds.includes(q.id) &&
               !quests.completedIds.includes(q.id)
      );
      let color = null;
      if (acceptedHere) {
        const prog = quests.progress?.[acceptedHere.id] || 0;
        color = prog >= acceptedHere.objective.count ? '#facc15' /* gold turn-in */ : '#60a5fa' /* blue active */;
      } else if (availableHere) {
        color = '#fbbf24'; // amber available
      }
      if (!color) return;

      // Translate so player is at origin, then rotate by -yaw so "forward" is up
      const dx = npc.pos[0] - pos.x;
      const dz = npc.pos[2] - pos.z;
      const rx = dx * cosY - dz * sinY;
      const rz = dx * sinY + dz * cosY;
      // Z+ in world should point "down" on the map → flip so forward = up
      const px = half + rx * scale;
      const py = half - rz * scale;
      // Clamp to circle
      const cx = px - half, cy = py - half;
      const d = Math.sqrt(cx * cx + cy * cy);
      const maxR = half - 6;
      let fx = px, fy = py, onEdge = false;
      if (d > maxR) {
        const k = maxR / d;
        fx = half + cx * k;
        fy = half + cy * k;
        onEdge = true;
      }
      out.push({ id: npc.id, x: fx, y: fy, color, onEdge });
    });
    return out;
  })();

  return (
    <div className="absolute top-20 left-4 z-20 pointer-events-none w-[230px] flex flex-col gap-3">
      {/* Minimap */}
      <div
        className="relative w-[150px] h-[150px] rounded-full overflow-hidden"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(40,60,80,0.85), rgba(8,12,20,0.95))',
          border: '2px solid rgba(180,160,110,0.5)',
          boxShadow: '0 4px 18px rgba(0,0,0,0.55), inset 0 0 30px rgba(0,0,0,0.6)',
        }}
      >
        {/* Compass ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Compass className="w-7 h-7 text-white/15" />
        </div>

        {/* Quest NPC pings */}
        {npcMarkers.map((m) => (
          <div
            key={m.id}
            className="absolute rounded-full"
            style={{
              left: `${m.x}px`,
              top: `${m.y}px`,
              width: m.onEdge ? '6px' : '7px',
              height: m.onEdge ? '6px' : '7px',
              transform: 'translate(-50%, -50%)',
              background: m.color,
              boxShadow: `0 0 6px ${m.color}`,
              opacity: m.onEdge ? 0.75 : 1,
            }}
          />
        ))}

        {/* Player dot (always center) with facing indicator pointing up */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative w-3 h-3">
            <div className="absolute inset-0 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.9)]" />
            {/* Forward arrow */}
            <div
              className="absolute left-1/2 -top-2 w-0 h-0 -translate-x-1/2"
              style={{
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderBottom: '5px solid rgba(103,232,249,0.95)',
              }}
            />
          </div>
        </div>

        {/* N marker */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white/70 tracking-widest">N</div>

        {/* Coords readout */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-white/55 tabular-nums tracking-wider">
          {Math.round(pos.x)}, {Math.round(pos.z)}
        </div>
      </div>

    </div>
  );
}

function describeObjective(quest) {
  const o = quest.objective;
  if (o.type === 'kill')      return `Defeat ${o.count} enemies`;
  if (o.type === 'kill_tier') return `Defeat ${o.count} ${o.tier}${o.count > 1 ? 's' : ''}`;
  return 'Complete the task';
}