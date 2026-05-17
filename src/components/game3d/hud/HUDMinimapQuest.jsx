import React, { useEffect, useState } from 'react';
import { Compass, Target, BookOpen } from 'lucide-react';
import { subscribeQuests } from '../useQuestStore';
import { subscribePlayerPosition } from '../playerPositionStore';
import { QUESTS, QUEST_NPCS } from '../questData';
import QuestBookPanel from './QuestBookPanel';

// World units shown across the minimap diameter.
const MAP_RANGE = 40;
const MAP_SIZE  = 150; // px, matches the visual size below

// Max number of simultaneously tracked active quests
const MAX_ACTIVE_QUESTS = 5;

/**
 * Top-left HUD block: minimap + quest tracker.
 * - Minimap: live player position (centered, rotated with facing), with quest NPC pings.
 * - Quest tracker: lists every active quest (up to 5). Each new active quest grows
 *   the panel downward. Click to open the full Quest Book UI.
 */
export default function HUDMinimapQuest() {
  const [quests, setQuests] = useState(null);
  const [pos, setPos] = useState({ x: 0, z: 0, yaw: 0 });
  const [bookOpen, setBookOpen] = useState(false);

  useEffect(() => subscribeQuests(setQuests), []);
  useEffect(() => subscribePlayerPosition(setPos), []);

  // Resolve all currently active quests (cap at MAX_ACTIVE_QUESTS for display)
  const activeQuestEntries = (() => {
    if (!quests) return [];
    return quests.acceptedIds
      .slice(0, MAX_ACTIVE_QUESTS)
      .map((id) => {
        const q = QUESTS.find((x) => x.id === id);
        if (!q) return null;
        const current = quests.progress?.[id] || 0;
        const total = q.objective.count;
        return { quest: q, current, total, isTracked: id === quests.lastAcceptedId };
      })
      .filter(Boolean);
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
        color = prog >= acceptedHere.objective.count ? '#facc15' : '#60a5fa';
      } else if (availableHere) {
        color = '#fbbf24';
      }
      if (!color) return;

      const dx = npc.pos[0] - pos.x;
      const dz = npc.pos[2] - pos.z;
      const rx = dx * cosY - dz * sinY;
      const rz = dx * sinY + dz * cosY;
      const px = half + rx * scale;
      const py = half - rz * scale;
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
    <>
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
          <div className="absolute inset-0 flex items-center justify-center">
            <Compass className="w-7 h-7 text-white/15" />
          </div>

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

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative w-3 h-3">
              <div className="absolute inset-0 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.9)]" />
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

          <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white/70 tracking-widest">N</div>

          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-white/55 tabular-nums tracking-wider">
            {Math.round(pos.x)}, {Math.round(pos.z)}
          </div>
        </div>

        {/* SPACER for the 4 quick-action pills which now render above the quest tracker.
            The pills are positioned absolutely by HUDGameQuickActions; we reserve their height here. */}
        <div className="h-10" />

        {/* Quest tracker — grows with the number of active quests (1..MAX) */}
        <button
          onClick={() => setBookOpen(true)}
          className="px-3 py-2.5 rounded-sm text-white text-left pointer-events-auto transition-all hover:brightness-125 group"
          style={{
            background: 'linear-gradient(180deg, rgba(15,20,28,0.78), rgba(10,14,20,0.78))',
            borderLeft: '2px solid rgba(250,204,21,0.7)',
            backdropFilter: 'blur(6px)',
          }}
          title="Open Quest Book"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Target className="w-3 h-3 text-yellow-300" />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-yellow-300/90">
                Active Quests
              </span>
              {activeQuestEntries.length > 0 && (
                <span className="text-[9px] text-yellow-200/70 font-mono">
                  {activeQuestEntries.length}/{MAX_ACTIVE_QUESTS}
                </span>
              )}
            </div>
            <BookOpen className="w-3 h-3 text-yellow-300/60 group-hover:text-yellow-200 transition-colors" />
          </div>

          {activeQuestEntries.length > 0 ? (
            <div className="flex flex-col gap-2">
              {activeQuestEntries.map(({ quest, current, total, isTracked }) => {
                const pct = Math.min(100, (current / Math.max(1, total)) * 100);
                const done = current >= total;
                return (
                  <div
                    key={quest.id}
                    className="rounded-sm"
                    style={{
                      borderLeft: isTracked
                        ? '2px solid rgba(103,232,249,0.7)'
                        : '2px solid rgba(255,255,255,0.08)',
                      paddingLeft: 6,
                      paddingTop: 2,
                      paddingBottom: 2,
                    }}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="text-[11px] text-white/90 leading-tight font-semibold truncate">
                        {quest.title}
                      </div>
                      <span className="text-[9px] text-yellow-200/90 tabular-nums font-bold flex-shrink-0">
                        {current}/{total}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-white/10 overflow-hidden mt-1">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: done
                            ? 'linear-gradient(90deg, #fde68a, #facc15)'
                            : 'linear-gradient(90deg, #93c5fd, #60a5fa)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              <div className="text-[12px] text-white/85 leading-snug mb-1">—</div>
              <div className="text-[11px] text-white/55 leading-snug">
                Find a quest giver to begin.
              </div>
            </>
          )}
        </button>
      </div>

      <QuestBookPanel
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        questState={quests}
      />
    </>
  );
}