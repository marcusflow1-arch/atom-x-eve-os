import React, { useEffect, useState } from 'react';
import { Target, BookOpen } from 'lucide-react';
import { subscribeQuests } from '../useQuestStore';
import QuestBookPanel from './QuestBookPanel';
import { QUESTS } from '../questData';
import HUDCompassStrip from './HUDCompassStrip';

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
  const [bookOpen, setBookOpen] = useState(false);

  useEffect(() => subscribeQuests(setQuests), []);

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

  return (
    <>
      {/* Skyrim-style horizontal compass strip mounted at top-center */}
      <HUDCompassStrip />

      <div className="absolute top-20 left-4 z-20 pointer-events-none w-[230px] flex flex-col gap-3">
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