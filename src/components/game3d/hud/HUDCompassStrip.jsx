// ─── HUDCompassStrip ──────────────────────────────────────────────────────
// Skyrim-style horizontal compass strip mounted at the top-center of the HUD.
// Cardinal letters (N, NE, E, SE, S, SW, W, NW) and ordinal tick marks slide
// horizontally as the player rotates. Quest / shop / NPC markers project
// onto the same strip based on their world-relative bearing.
//
// Pure UI — reads player yaw + quest data from existing stores.

import React, { useEffect, useState } from 'react';
import { subscribeQuests } from '../useQuestStore';
import { subscribePlayerPosition } from '../playerPositionStore';
import { QUESTS, QUEST_NPCS } from '../questData';

const STRIP_WIDTH = 440;           // visible width in px
const STRIP_HEIGHT = 32;           // strip height in px
const FOV_DEG = 180;               // degrees of bearing shown across the strip
const PX_PER_DEG = STRIP_WIDTH / FOV_DEG;
const HALF_W = STRIP_WIDTH / 2;

// Cardinal + ordinal labels with their world-bearing in degrees (0 = North, CW)
const CARDINALS = [
  { label: 'N',  deg:   0, major: true  },
  { label: 'NE', deg:  45, major: false },
  { label: 'E',  deg:  90, major: true  },
  { label: 'SE', deg: 135, major: false },
  { label: 'S',  deg: 180, major: true  },
  { label: 'SW', deg: 225, major: false },
  { label: 'W',  deg: 270, major: true  },
  { label: 'NW', deg: 315, major: false },
];

// Generate degree ticks every 5° for the fine tick row
const TICKS = Array.from({ length: 72 }, (_, i) => i * 5);

// Map a target bearing (degrees, 0..360) to a horizontal offset in px relative
// to the strip center, given the player's facing yaw (radians).
// Returns null if the bearing falls outside the visible FOV.
function bearingToX(targetDeg, yawDeg) {
  let delta = targetDeg - yawDeg;
  while (delta > 180)  delta -= 360;
  while (delta < -180) delta += 360;
  if (Math.abs(delta) > FOV_DEG / 2) return null;
  return delta * PX_PER_DEG;
}

export default function HUDCompassStrip() {
  const [quests, setQuests] = useState(null);
  const [pos, setPos] = useState({ x: 0, z: 0, yaw: 0 });

  useEffect(() => subscribeQuests(setQuests), []);
  useEffect(() => subscribePlayerPosition(setPos), []);

  // Convert player yaw (radians, 0 = +Z / "North") to degrees clockwise.
  const yawDeg = ((pos.yaw * 180) / Math.PI) % 360;
  const normYawDeg = (yawDeg + 360) % 360;

  // Project quest NPC markers onto the strip
  const npcMarkers = (() => {
    if (!quests) return [];
    const out = [];
    QUEST_NPCS.forEach((npc) => {
      const acceptedHere = QUESTS.find(
        (q) => q.npcId === npc.id && quests.acceptedIds.includes(q.id),
      );
      const availableHere = QUESTS.find(
        (q) =>
          q.npcId === npc.id &&
          !quests.acceptedIds.includes(q.id) &&
          !quests.completedIds.includes(q.id),
      );
      let color = null;
      let kind = 'quest';
      if (acceptedHere) {
        const prog = quests.progress?.[acceptedHere.id] || 0;
        color = prog >= acceptedHere.objective.count ? '#facc15' : '#60a5fa';
        kind = prog >= acceptedHere.objective.count ? 'turnin' : 'active';
      } else if (availableHere) {
        color = '#fbbf24';
        kind = 'available';
      }
      if (!color) return;

      const dx = npc.pos[0] - pos.x;
      const dz = npc.pos[2] - pos.z;
      // Bearing: 0° = +Z (North), increasing clockwise
      const bearing = (Math.atan2(dx, dz) * 180) / Math.PI;
      const targetDeg = (bearing + 360) % 360;
      const x = bearingToX(targetDeg, normYawDeg);
      if (x === null) return;
      out.push({ id: npc.id, x, color, kind });
    });
    return out;
  })();

  return (
    <div
      className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
      style={{ width: STRIP_WIDTH }}
    >
      {/* Strip frame */}
      <div
        className="relative mx-auto overflow-hidden"
        style={{
          width: STRIP_WIDTH,
          height: STRIP_HEIGHT,
          background:
            'linear-gradient(180deg, rgba(8,10,14,0.85) 0%, rgba(14,18,24,0.7) 50%, rgba(8,10,14,0.85) 100%)',
          border: '1px solid rgba(180,160,110,0.45)',
          borderRadius: 2,
          boxShadow:
            '0 4px 14px rgba(0,0,0,0.55), inset 0 0 18px rgba(0,0,0,0.6)',
        }}
      >
        {/* Faint horizontal guide line */}
        <div
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2"
          style={{
            height: 1,
            background:
              'linear-gradient(90deg, transparent 0%, rgba(180,160,110,0.35) 15%, rgba(180,160,110,0.55) 50%, rgba(180,160,110,0.35) 85%, transparent 100%)',
          }}
        />

        {/* Fine degree ticks */}
        {TICKS.map((deg) => {
          const x = bearingToX(deg, normYawDeg);
          if (x === null) return null;
          const isMajor = deg % 45 === 0;
          const isMid = deg % 15 === 0 && !isMajor;
          return (
            <div
              key={`t-${deg}`}
              className="absolute top-1/2 -translate-y-1/2"
              style={{
                left: HALF_W + x,
                width: 1,
                height: isMajor ? STRIP_HEIGHT * 0.7 : isMid ? STRIP_HEIGHT * 0.5 : STRIP_HEIGHT * 0.3,
                background: isMajor
                  ? 'rgba(230,210,160,0.85)'
                  : isMid
                    ? 'rgba(210,190,150,0.55)'
                    : 'rgba(200,180,140,0.30)',
                transform: 'translate(-50%, -50%)',
              }}
            />
          );
        })}

        {/* Cardinal labels */}
        {CARDINALS.map((c) => {
          const x = bearingToX(c.deg, normYawDeg);
          if (x === null) return null;
          return (
            <div
              key={c.label}
              className="absolute top-0 select-none"
              style={{
                left: HALF_W + x,
                transform: 'translate(-50%, 0)',
                fontSize: c.major ? 12 : 9,
                fontWeight: c.major ? 700 : 600,
                letterSpacing: c.major ? '0.15em' : '0.1em',
                color: c.major ? '#fde68a' : 'rgba(230,210,160,0.75)',
                textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.7)',
                lineHeight: '14px',
                paddingTop: c.major ? 1 : 3,
              }}
            >
              {c.label}
            </div>
          );
        })}

        {/* Quest / POI markers */}
        {npcMarkers.map((m) => (
          <div
            key={m.id}
            className="absolute"
            style={{
              left: HALF_W + m.x,
              bottom: 2,
              transform: 'translate(-50%, 0)',
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderBottom: `7px solid ${m.color}`,
                filter: `drop-shadow(0 0 4px ${m.color})`,
              }}
            />
          </div>
        ))}

        {/* Center indicator — player facing arrow */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: -4 }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '7px solid rgba(255,240,200,0.95)',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
            }}
          />
        </div>
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ bottom: -4 }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderBottom: '7px solid rgba(255,240,200,0.95)',
              filter: 'drop-shadow(0 -1px 2px rgba(0,0,0,0.8))',
            }}
          />
        </div>
      </div>

      {/* Coordinates under the strip */}
      <div
        className="mx-auto mt-1 text-center text-[9px] tabular-nums tracking-[0.2em]"
        style={{ color: 'rgba(230,210,160,0.55)' }}
      >
        {Math.round(pos.x)}, {Math.round(pos.z)}
      </div>
    </div>
  );
}