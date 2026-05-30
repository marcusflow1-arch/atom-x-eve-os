// QuestLogPanel.jsx — Player quest log showing active + completed quests

import React from 'react';
import { QuestState, QUESTS } from './questData';
import { ScrollText, CheckCircle2, Circle, Clock } from 'lucide-react';

const STATE_STYLE = {
  [QuestState.NONE]:          { color: 'rgba(255,255,255,0.2)',  label: 'Not Started', icon: Circle },
  [QuestState.ACTIVE]:        { color: '#fbbf24',                label: 'In Progress',  icon: Clock },
  [QuestState.READY_TO_TURN]: { color: '#34d399',                label: 'Turn In!',     icon: CheckCircle2 },
  [QuestState.COMPLETED]:     { color: '#a78bfa',                label: 'Completed',    icon: CheckCircle2 },
};

export default function QuestLogPanel({ questEntries }) {
  const tracked = QUESTS.filter(q => {
    const entry = questEntries[q.id];
    return entry && entry.state !== QuestState.NONE;
  });

  if (tracked.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ScrollText className="w-8 h-8 text-white/15 mb-3" />
        <div className="text-[11px] text-white/25">No active quests</div>
        <div className="text-[10px] text-white/15 mt-1">Talk to an NPC to get started</div>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3">
      {tracked.map(quest => {
        const entry = questEntries[quest.id] || {};
        const cfg = STATE_STYLE[entry.state] || STATE_STYLE[QuestState.NONE];
        const Icon = cfg.icon;
        const pct = entry.killTarget > 0
          ? Math.min(100, (entry.killProgress / entry.killTarget) * 100)
          : 0;

        return (
          <div key={quest.id} className="rounded-lg px-3 py-2.5"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: cfg.color }} />
                <span className="text-[12px] font-semibold text-white/80">{quest.name}</span>
              </div>
              <span className="text-[9px] tracking-[0.15em] uppercase font-medium"
                style={{ color: cfg.color }}>
                {cfg.label}
              </span>
            </div>
            <div className="text-[10px] text-white/40 mb-1.5">{quest.objective}</div>

            {(entry.state === QuestState.ACTIVE || entry.state === QuestState.READY_TO_TURN) && (
              <>
                <div className="h-1 rounded-full overflow-hidden mb-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: entry.state === QuestState.READY_TO_TURN
                        ? 'linear-gradient(90deg, #34d399, #6ee7b7)'
                        : 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                    }} />
                </div>
                <div className="text-[9px] text-white/25 tabular-nums">
                  {entry.killProgress} / {entry.killTarget} kills
                </div>
              </>
            )}

            {entry.state === QuestState.COMPLETED && (
              <div className="text-[9px] flex items-center gap-2 mt-0.5">
                <span style={{ color: '#fbbf24' }}>⭐ +{quest.rewards.xp} XP</span>
                <span style={{ color: '#34d399' }}>💰 +{quest.rewards.currency} Coins</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}