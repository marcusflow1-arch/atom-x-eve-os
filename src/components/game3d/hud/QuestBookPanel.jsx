import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ScrollText, Check, Target } from 'lucide-react';
import { QUESTS, QUEST_NPCS } from '../questData';
import { setTrackedQuest } from '../useQuestStore';

/**
 * QuestBookPanel — book-styled quest journal mirroring the Tome of Skills design.
 *
 * - Left page: list of all active quests (max 5).
 * - Right page: details of the selected quest (title, NPC, objective, progress, reward).
 * - Selecting a quest also tracks it in the HUD minimap quest panel.
 */

function describeObjective(quest) {
  const o = quest.objective;
  if (o.type === 'kill')      return `Defeat ${o.count} enemies`;
  if (o.type === 'kill_tier') return `Defeat ${o.count} ${o.tier}${o.count > 1 ? 's' : ''}`;
  return 'Complete the task';
}

function QuestList({ quests, progressMap, selectedId, onSelect, trackedId }) {
  if (quests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-white/45 text-[10px] text-center tracking-wide px-6">
        <span className="text-2xl opacity-60">📜</span>
        No active quests.<br/>Find a quest giver to begin.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1 h-full overflow-y-auto px-3 py-2" style={{ scrollbarWidth: 'none' }}>
      {quests.map((q) => {
        const progress = progressMap[q.id] || 0;
        const total = q.objective.count;
        const done = progress >= total;
        const isSelected = selectedId === q.id;
        const isTracked = trackedId === q.id;
        const color = done ? '#facc15' : '#60a5fa';
        return (
          <button
            key={q.id}
            onClick={() => onSelect(q.id)}
            className="flex items-center gap-2 px-2.5 py-2 transition-all text-left w-full"
            style={{
              background: isSelected
                ? `linear-gradient(90deg, ${color}25 0%, transparent 100%)`
                : 'rgba(255,255,255,0.025)',
              border: `1px solid ${isSelected ? color + '70' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 2,
              boxShadow: isSelected ? `inset 0 0 10px ${color}25` : 'none',
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
              style={{
                background: `radial-gradient(circle, ${color}30 0%, rgba(0,0,0,0.55) 70%)`,
                border: `1px solid ${color}80`,
                boxShadow: `0 0 6px ${color}40`,
              }}
            >
              {done ? <Check className="w-3.5 h-3.5 text-yellow-200" /> : <ScrollText className="w-3.5 h-3.5 text-blue-200" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white/90 text-[10px] font-semibold truncate tracking-wide">{q.title}</div>
              <div className="text-[8px] font-semibold tracking-[0.25em] uppercase mt-0.5" style={{ color }}>
                {progress}/{total} {done ? '· turn in' : ''}
              </div>
            </div>
            {isTracked && (
              <Target className="w-3 h-3 text-cyan-300 flex-shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function QuestDetail({ quest, progress, onTrack, isTracked }) {
  if (!quest) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-5">
        <div className="text-3xl opacity-30">👆</div>
        <p className="text-white/45 text-[10px] text-center leading-relaxed tracking-wide">
          Select a quest to view<br />its details here.
        </p>
      </div>
    );
  }
  const total = quest.objective.count;
  const done = progress >= total;
  const color = done ? '#facc15' : '#60a5fa';
  const npc = QUEST_NPCS.find((n) => n.id === quest.npcId);
  return (
    <div className="flex flex-col h-full px-5 py-4">
      <div className="flex flex-col items-center text-center mb-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3"
          style={{
            background: `radial-gradient(circle, ${color}30 0%, rgba(0,0,0,0.55) 70%)`,
            border: `1.5px solid ${color}`,
            boxShadow: `0 0 28px ${color}55, inset 0 0 12px ${color}33`,
          }}
        >
          {done ? <Check className="w-7 h-7 text-yellow-200" /> : <ScrollText className="w-7 h-7 text-blue-200" />}
        </div>
        <h3 className="text-white/95 font-semibold text-sm leading-tight mb-2 tracking-[0.2em] uppercase">{quest.title}</h3>
        <span
          className="text-[9px] px-2.5 py-0.5 font-semibold tracking-[0.3em] uppercase"
          style={{ color, background: `${color}18`, border: `1px solid ${color}55`, borderRadius: 2 }}
        >
          {done ? 'Ready to turn in' : 'In Progress'}
        </span>
      </div>

      <div className="w-full h-px mb-3" style={{ background: `linear-gradient(to right, transparent, ${color}60, transparent)` }} />

      <div className="flex flex-col gap-2 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {npc && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/45 tracking-[0.2em] uppercase">Quest Giver</span>
            <span className="text-white/85 font-semibold tracking-wide">{npc.name}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-white/45 tracking-[0.2em] uppercase">Objective</span>
          <span className="text-white/85 font-semibold tracking-wide">{describeObjective(quest)}</span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-white/45 tracking-[0.2em] uppercase">Progress</span>
          <span className="text-white/85 font-semibold tracking-wide tabular-nums">{progress} / {total}</span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-white/45 tracking-[0.2em] uppercase">Reward</span>
          <span className="text-yellow-200/90 font-semibold tracking-wide">+{quest.reward.xp} XP · +{quest.reward.points} pt</span>
        </div>

        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mt-2">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, (progress / Math.max(1, total)) * 100)}%`,
              background: done
                ? 'linear-gradient(90deg, #fde68a, #facc15)'
                : 'linear-gradient(90deg, #93c5fd, #60a5fa)',
            }}
          />
        </div>

        {quest.description && (
          <>
            <div className="w-full h-px mt-3" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <p className="text-white/65 text-[10px] leading-relaxed mt-2 italic">"{quest.description}"</p>
          </>
        )}

        <button
          onClick={() => onTrack(quest.id)}
          disabled={isTracked}
          className="mt-auto flex items-center justify-center gap-1.5 px-3 py-2 transition-all"
          style={{
            background: isTracked ? 'rgba(34,211,238,0.18)' : 'rgba(255,216,107,0.10)',
            border: `1px solid ${isTracked ? 'rgba(34,211,238,0.55)' : 'rgba(255,216,107,0.45)'}`,
            borderRadius: 2,
            opacity: isTracked ? 0.7 : 1,
            cursor: isTracked ? 'default' : 'pointer',
          }}
        >
          <Target className={`w-3 h-3 ${isTracked ? 'text-cyan-300' : 'text-amber-200'}`} />
          <span className={`text-[9px] font-semibold tracking-[0.3em] uppercase ${isTracked ? 'text-cyan-200' : 'text-amber-200'}`}>
            {isTracked ? 'Currently Tracked' : 'Track in HUD'}
          </span>
        </button>
      </div>
    </div>
  );
}

export default function QuestBookPanel({ open, onClose, questState }) {
  const activeQuests = useMemo(() => {
    if (!questState) return [];
    return questState.acceptedIds
      .map((id) => QUESTS.find((q) => q.id === id))
      .filter(Boolean);
  }, [questState]);

  const progressMap = questState?.progress || {};
  const trackedId = questState?.lastAcceptedId || null;
  const [selectedId, setSelectedId] = useState(null);

  // Default selection: the currently tracked quest, or the first one
  const effectiveSelectedId = selectedId || trackedId || activeQuests[0]?.id || null;
  const selectedQuest = activeQuests.find((q) => q.id === effectiveSelectedId) || null;
  const selectedProgress = selectedQuest ? (progressMap[selectedQuest.id] || 0) : 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70]"
            style={{ background: 'rgba(4,8,14,0.32)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="fixed z-[71] flex items-center pointer-events-auto"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          >
            <div
              className="relative flex flex-col overflow-hidden"
              style={{
                width: 720, height: 540, borderRadius: 4,
                boxShadow: '0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,216,107,0.12), 0 0 24px rgba(255,216,107,0.08)',
                border: '1px solid rgba(255,216,107,0.28)',
                background: 'linear-gradient(135deg, rgba(10,14,22,0.55) 0%, rgba(6,10,16,0.55) 100%)',
                backdropFilter: 'blur(16px) saturate(140%)',
                WebkitBackdropFilter: 'blur(16px) saturate(140%)',
              }}
            >
              {[
                { _k: 'tl', top: 6, left: 6, borderTop: '1px solid rgba(255,216,107,0.5)', borderLeft: '1px solid rgba(255,216,107,0.5)' },
                { _k: 'tr', top: 6, right: 6, borderTop: '1px solid rgba(255,216,107,0.5)', borderRight: '1px solid rgba(255,216,107,0.5)' },
                { _k: 'bl', bottom: 6, left: 6, borderBottom: '1px solid rgba(255,216,107,0.5)', borderLeft: '1px solid rgba(255,216,107,0.5)' },
                { _k: 'br', bottom: 6, right: 6, borderBottom: '1px solid rgba(255,216,107,0.5)', borderRight: '1px solid rgba(255,216,107,0.5)' },
              ].map(({ _k, ...s }) => (
                <div key={_k} className="absolute w-3 h-3 pointer-events-none z-10" style={s} />
              ))}

              <div
                className="flex items-center justify-between px-5 pt-3 pb-2 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(255,216,107,0.20)' }}
              >
                <div className="text-amber-100/90 text-[11px] font-semibold tracking-[0.35em] uppercase">
                  Quest Book
                </div>
                <button
                  onClick={onClose}
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:brightness-125"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,216,107,0.35)' }}
                >
                  <X className="w-3 h-3 text-amber-100/80" />
                </button>
              </div>

              <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 flex flex-col overflow-hidden" style={{ borderRight: '1px solid rgba(255,216,107,0.15)' }}>
                  <div className="px-4 pt-2 pb-1 flex items-center justify-between flex-shrink-0">
                    <span className="text-[9px] font-semibold tracking-[0.3em] uppercase text-amber-200/90">
                      Active Quests
                    </span>
                    <span className="text-white/40 text-[8px] tracking-[0.25em] uppercase">
                      {activeQuests.length} / 5
                    </span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <QuestList
                      quests={activeQuests}
                      progressMap={progressMap}
                      selectedId={effectiveSelectedId}
                      onSelect={setSelectedId}
                      trackedId={trackedId}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedQuest?.id ?? 'empty'}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="h-full"
                    >
                      <QuestDetail
                        quest={selectedQuest}
                        progress={selectedProgress}
                        onTrack={(id) => setTrackedQuest(id)}
                        isTracked={selectedQuest?.id === trackedId}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}