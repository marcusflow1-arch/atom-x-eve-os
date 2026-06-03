// NetworkQuestLog.jsx — Full quest log showing all quests across all NPCs

import React from 'react';
import { motion } from 'framer-motion';
import { NPC_DEFS, QUEST_DEFS, QuestState } from './questNetwork';
import { getQuestProgress } from './questNetworkStore';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

const STATE_ICON = {
  [QuestState.NONE]:          <Circle className="w-3.5 h-3.5 text-white/20" />,
  [QuestState.ACTIVE]:        <Clock className="w-3.5 h-3.5 text-yellow-400" />,
  [QuestState.READY_TO_TURN]: <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />,
  [QuestState.COMPLETED]:     <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />,
};

const BRANCH_LABELS = { kill: '⚔️ Eliminated', spare: '🕊️ Spared', interrogate: '🧠 Interrogated' };

export default function NetworkQuestLog({ questEntries, flags }) {
  return (
    <div className="space-y-4 px-3 py-3">
      {NPC_DEFS.map(npc => {
        const npcQuests = npc.quests.map(id => QUEST_DEFS[id]).filter(Boolean);
        return (
          <div key={npc.id}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">{npc.icon}</span>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: npc.color }}>
                {npc.name}
              </span>
              <span className="text-[8px] text-white/20 capitalize ml-1">{npc.alignment}</span>
            </div>
            <div className="space-y-1.5 pl-2 border-l" style={{ borderColor: `${npc.color}25` }}>
              {npcQuests.map(quest => {
                const entry = questEntries[quest.id] || {};
                const state = entry.state || QuestState.NONE;
                const isLocked = (quest.requiredFlag && !flags[quest.requiredFlag])
                  || (quest.blockedByFlag && flags[quest.blockedByFlag]);

                return (
                  <motion.div
                    key={quest.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isLocked ? 0.3 : 1 }}
                    className="flex items-start gap-2 px-2 py-1.5 rounded-lg"
                    style={{
                      background: state === QuestState.ACTIVE || state === QuestState.READY_TO_TURN
                        ? `${npc.color}08` : 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <div className="mt-0.5 flex-shrink-0">{STATE_ICON[state]}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-medium text-white/70 truncate">{quest.title}</div>
                      {state === QuestState.ACTIVE && (
                        <div className="text-[9px] text-white/30 mt-0.5">
                          {entry.killProgress || 0} / {entry.killTarget || quest.killTarget} kills
                        </div>
                      )}

                      {/* Milestone progress bar — fills as quest is accepted, progressed, and turned in */}
                      {(state === QuestState.ACTIVE || state === QuestState.READY_TO_TURN || state === QuestState.COMPLETED) && (() => {
                        const pct = getQuestProgress(quest.id);
                        const done = state === QuestState.COMPLETED;
                        const ready = state === QuestState.READY_TO_TURN;
                        return (
                          <div className="mt-1.5">
                            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  background: done
                                    ? 'linear-gradient(90deg, #a78bfa, #c4b5fd)'
                                    : ready
                                      ? 'linear-gradient(90deg, #34d399, #6ee7b7)'
                                      : `linear-gradient(90deg, ${npc.color}, ${npc.color}aa)`,
                                }}
                              />
                            </div>
                            <div className="text-[8px] text-white/25 tabular-nums mt-0.5">{pct}%</div>
                          </div>
                        );
                      })()}
                      {state === QuestState.COMPLETED && entry.branchChoice && (
                        <div className="text-[9px] mt-0.5" style={{ color: npc.color }}>
                          {BRANCH_LABELS[entry.branchChoice] || entry.branchChoice}
                        </div>
                      )}
                      {isLocked && (
                        <div className="text-[8px] text-white/20 mt-0.5">🔒 Locked</div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}