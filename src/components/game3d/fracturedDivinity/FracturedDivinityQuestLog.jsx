// ─── FracturedDivinityQuestLog ────────────────────────────────────────────────
// In-game quest log overlay for Fractured Divinity Arc 1.
// Shows main quest chain + side quests, objectives, reward previews.

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, ChevronRight, ChevronDown, Star, Zap, Eye, X, Lock } from 'lucide-react';
import { MAIN_QUEST_CHAIN, SIDE_QUESTS } from './fracturedDivinityQuests';

const TYPE_COLORS = {
  main: { color: '#fbbf24', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.30)' },
  side: { color: '#60a5fa', bg: 'rgba(96,165,250,0.10)', border: 'rgba(96,165,250,0.30)' },
};

const REWARD_ICONS = {
  memory_fragment:   '◈',
  resistance_skill:  '⚡',
  path_awareness:    '◎',
  core_upgrade:      '✦',
  lore_unlock:       '📜',
  knowledge_token:   '○',
  passive_ability:   '◉',
  memory_integration:'◈',
  world_unlock:      '✧',
};

export default function FracturedDivinityQuestLog({ playerLevel = 1, completedQuestIds = [], onClose, onStartQuest }) {
  const [expandedId, setExpandedId] = useState(null);
  const [tab, setTab] = useState('main'); // 'main' | 'side'

  const mainQuests = MAIN_QUEST_CHAIN.subQuests;
  const sideQuests = SIDE_QUESTS;

  const quests = tab === 'main' ? mainQuests : sideQuests;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="absolute top-4 right-4 bottom-4 z-50 flex flex-col rounded-2xl overflow-hidden"
      style={{
        width: 'min(420px, 94vw)',
        background: 'rgba(7, 10, 18, 0.92)',
        backdropFilter: 'blur(32px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <div className="text-[9px] tracking-[0.4em] uppercase text-white/30 mb-0.5">
            {MAIN_QUEST_CHAIN.arc}
          </div>
          <div className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-yellow-300/70" />
            {MAIN_QUEST_CHAIN.title}
          </div>
        </div>
        {onClose && (
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-all">
            <X className="w-4 h-4 text-white/50" />
          </button>
        )}
      </div>

      {/* Tab Bar */}
      <div className="flex flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { id: 'main', label: 'Main Quest', icon: Star },
          { id: 'side', label: 'Side Quests', icon: Eye },
        ].map((t) => {
          const on = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] tracking-[0.25em] uppercase transition-all"
              style={{
                color: on ? (t.id === 'main' ? '#fbbf24' : '#60a5fa') : 'rgba(255,255,255,0.30)',
                borderBottom: on ? `2px solid ${t.id === 'main' ? '#fbbf24' : '#60a5fa'}` : '2px solid transparent',
                background: on ? 'rgba(255,255,255,0.03)' : 'transparent',
              }}>
              <t.icon className="w-3 h-3" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Quest List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ scrollbarWidth: 'none' }}>
        {quests.map((quest) => {
          const isExpanded = expandedId === quest.id;
          const isCompleted = completedQuestIds.includes(quest.id);
          const isLocked = quest.level > playerLevel;
          const tc = TYPE_COLORS[tab === 'main' ? 'main' : 'side'];
          const rewardIcon = REWARD_ICONS[quest.reward?.type] || '○';

          return (
            <div key={quest.id}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : quest.id)}
                className="w-full text-left rounded-xl overflow-hidden transition-all"
                style={{
                  background: isCompleted ? 'rgba(16,185,129,0.06)' : isLocked ? 'rgba(0,0,0,0.3)' : tc.bg,
                  border: isCompleted ? '1px solid rgba(16,185,129,0.30)'
                    : isLocked ? '1px solid rgba(255,255,255,0.06)'
                    : `1px solid ${tc.border}`,
                  opacity: isLocked ? 0.5 : 1,
                }}
              >
                <div className="flex items-center gap-3 px-3.5 py-2.5">
                  <div className="text-xl flex-shrink-0 w-8 text-center">
                    {isLocked ? <Lock className="w-4 h-4 text-white/25 mx-auto" /> :
                      isCompleted ? '✓' : rewardIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] tracking-[0.2em] uppercase font-semibold"
                        style={{ color: isCompleted ? '#6ee7b7' : isLocked ? 'rgba(255,255,255,0.25)' : tc.color }}>
                        {isLocked ? `Lv ${quest.level} Required` : isCompleted ? 'Completed' : tab === 'main' ? 'Main' : 'Side'}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-white/90 truncate mt-0.5">
                      {quest.title}
                    </div>
                  </div>
                  {!isLocked && (
                    <div className="flex-shrink-0 text-white/25">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  )}
                </div>
              </button>

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && !isLocked && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3.5 pb-3.5 pt-1 flex flex-col gap-3"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>

                      {/* Narrative setup excerpt */}
                      <p className="text-[11px] text-white/50 leading-relaxed italic">
                        {quest.narrativeSetup?.trim().slice(0, 200).replace(/\n/g, ' ')}…
                      </p>

                      {/* Objectives */}
                      <div>
                        <div className="text-[9px] tracking-[0.3em] uppercase text-white/35 mb-1.5">Objectives</div>
                        <div className="flex flex-col gap-1">
                          {quest.objectives.map((obj) => (
                            <div key={obj.step} className="flex items-start gap-2 text-[11px] text-white/60">
                              <span className="text-white/25 flex-shrink-0 tabular-nums mt-0.5">{obj.step}.</span>
                              <span>{obj.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Reward */}
                      {quest.reward && (
                        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <span className="text-base">{REWARD_ICONS[quest.reward.type] || '○'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-semibold text-white/80">{quest.reward.name}</div>
                            <div className="text-[9px] text-white/40 mt-0.5 leading-relaxed">{quest.reward.description}</div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <div className="text-[10px] text-yellow-300/80 font-semibold">+{quest.reward.xp} XP</div>
                            <div className="text-[9px] text-white/30">+{quest.reward.points} pt</div>
                          </div>
                        </div>
                      )}

                      {/* Start button */}
                      {!isCompleted && onStartQuest && (
                        <button
                          onClick={() => onStartQuest(quest)}
                          className="w-full py-2 rounded-lg text-[10px] tracking-[0.35em] uppercase font-semibold transition-all"
                          style={{
                            background: tc.bg,
                            border: `1px solid ${tc.border}`,
                            color: tc.color,
                          }}
                        >
                          Begin Quest →
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between text-[9px] text-white/25 tracking-[0.2em] uppercase">
          <span>Arc 1 · {mainQuests.length} Main · {sideQuests.length} Side</span>
          <span>{completedQuestIds.length} / {mainQuests.length + sideQuests.length} Complete</span>
        </div>
      </div>
    </motion.div>
  );
}