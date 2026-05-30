// ─── FracturedDivinityDialogueBox ─────────────────────────────────────────────
// Narrative branching dialogue panel for Fractured Divinity quests.
// Supports: speaker, text, tone-colored styling, player choices, mechanic tags.

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Eye, Zap, Wind, Brain, AlertTriangle } from 'lucide-react';
import { getFDDialogueNode } from './fracturedDivinityQuests';

// Tone → visual config
const TONE_CONFIG = {
  FEAR:      { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',      border: 'rgba(239,68,68,0.35)',      label: 'Fear',      icon: AlertTriangle },
  CONFUSION: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',     border: 'rgba(245,158,11,0.35)',     label: 'Confusion', icon: Brain },
  RESISTANCE:{ color: '#6366f1', bg: 'rgba(99,102,241,0.08)',     border: 'rgba(99,102,241,0.35)',     label: 'Resistance',icon: Zap },
  CURIOSITY: { color: '#06b6d4', bg: 'rgba(6,182,212,0.08)',      border: 'rgba(6,182,212,0.35)',      label: 'Curiosity', icon: Eye },
  DREAD:     { color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)',     border: 'rgba(139,92,246,0.35)',     label: 'Dread',     icon: Wind },
  RESOLVE:   { color: '#10b981', bg: 'rgba(16,185,129,0.08)',     border: 'rgba(16,185,129,0.35)',     label: 'Resolve',   icon: ChevronRight },
};

const MECHANIC_LABELS = {
  movement_lock:   '⚠ Movement Interference Active',
  input_reverse:   '⚠ Input Redirection Detected',
  presence_pulse:  '● Presence Proximity: Critical',
  memory_echo:     '◈ Memory Echo Triggered',
};

// Typewriter text hook
function useTypewriter(text, speed = 22) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return { displayed, done };
}

export default function FracturedDivinityDialogueBox({
  questId,
  startNodeId,
  onNodeChange,   // (nodeId) => void — inform parent of navigation
  onEnd,          // (node) => void — fired when isEnd node reached
  onClose,
}) {
  const [currentNodeId, setCurrentNodeId] = useState(startNodeId);
  const [node, setNode] = useState(null);
  const [choicesVisible, setChoicesVisible] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!questId || !currentNodeId) return;
    const n = getFDDialogueNode(questId, currentNodeId);
    setNode(n);
    setChoicesVisible(false);
  }, [questId, currentNodeId]);

  const { displayed, done } = useTypewriter(node?.text || '', 18);

  // Show choices once text is done
  useEffect(() => {
    if (done && node?.choices?.length) {
      const t = setTimeout(() => setChoicesVisible(true), 200);
      return () => clearTimeout(t);
    }
    if (done && (!node?.choices || node.choices.length === 0)) {
      // If end node, fire callback
      if (node?.isEnd && onEnd) onEnd(node);
    }
  }, [done, node]);

  const handleChoice = (choice) => {
    if (choice.nextId) {
      setCurrentNodeId(choice.nextId);
      if (onNodeChange) onNodeChange(choice.nextId);
    }
  };

  if (!node) return null;

  const tone = TONE_CONFIG[node.tone] || TONE_CONFIG.CONFUSION;
  const ToneIcon = tone.icon;
  const isMechanic = !!node.mechanic;
  const isInnerVoice = node.speaker === 'Inner Voice' || node.speaker === 'Inner Voice (Borrowed)';
  const isPresence = node.speaker?.includes('Presence') || node.speaker?.includes('Skadi (The Mark)') && node.id?.includes('mark');

  return (
    <motion.div
      ref={boxRef}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.98 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="absolute left-1/2 bottom-6 -translate-x-1/2 z-50"
      style={{ width: 'min(680px, 94vw)' }}
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(7, 10, 18, 0.88)',
          backdropFilter: 'blur(32px) saturate(160%)',
          WebkitBackdropFilter: 'blur(32px) saturate(160%)',
          border: `1px solid ${tone.border}`,
          boxShadow: `0 16px 56px rgba(0,0,0,0.65), 0 0 48px ${tone.bg}, inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}
      >
        {/* Mechanic alert bar */}
        <AnimatePresence>
          {isMechanic && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-5 py-1.5 text-[9px] font-bold tracking-[0.35em] uppercase flex items-center gap-2"
              style={{ background: 'rgba(239,68,68,0.12)', borderBottom: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              {MECHANIC_LABELS[node.mechanic] || node.mechanic}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2.5">
            {/* Tone pill */}
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-[0.2em] uppercase"
              style={{ background: tone.bg, border: `1px solid ${tone.border}`, color: tone.color }}
            >
              <ToneIcon className="w-2.5 h-2.5" />
              {tone.label}
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-[9px] tracking-[0.2em] uppercase text-white/25 hover:text-white/50 transition-all px-2 py-1"
            >
              [esc]
            </button>
          )}
        </div>

        {/* Speaker name */}
        <div className="px-5 pb-1">
          <div
            className="text-[11px] font-bold tracking-[0.4em] uppercase"
            style={{
              color: isInnerVoice ? 'rgba(255,255,255,0.35)' : isPresence ? '#8b5cf6' : tone.color,
              fontStyle: isInnerVoice ? 'italic' : 'normal',
            }}
          >
            {node.speaker}
          </div>
        </div>

        {/* Dialogue text */}
        <div className="px-5 pb-4">
          <p
            className="text-sm leading-[1.85] min-h-[3rem]"
            style={{
              color: isInnerVoice ? 'rgba(255,255,255,0.60)' : 'rgba(255,255,255,0.88)',
              fontStyle: isInnerVoice ? 'italic' : 'normal',
            }}
          >
            {displayed}
            {!done && <span className="animate-pulse text-white/30">▋</span>}
          </p>
        </div>

        {/* Player Choices */}
        <AnimatePresence>
          {choicesVisible && node.choices && node.choices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="px-5 pb-5 flex flex-col gap-2"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}
            >
              <div className="text-[8px] tracking-[0.4em] uppercase text-white/20 mb-1">Your Response</div>
              {node.choices.map((choice, idx) => {
                const ct = TONE_CONFIG[choice.tone] || TONE_CONFIG.CONFUSION;
                const CIcon = ct.icon;
                return (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    onClick={() => handleChoice(choice)}
                    className="group w-full text-left flex items-start gap-3 px-3.5 py-2.5 rounded-lg transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid rgba(255,255,255,0.08)`,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = ct.bg;
                      e.currentTarget.style.border = `1px solid ${ct.border}`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)';
                    }}
                  >
                    <CIcon className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: ct.color }} />
                    <span className="text-[12px] text-white/70 group-hover:text-white/95 transition-colors leading-relaxed">
                      {choice.label}
                    </span>
                    {choice.mechanic && (
                      <span className="ml-auto text-[8px] tracking-widest uppercase text-red-400/50 flex-shrink-0 mt-0.5">
                        ⚠ {choice.mechanic.replace(/_/g, ' ')}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* End node — no choices */}
        {done && node.isEnd && (!node.choices || node.choices.length === 0) && (
          <div className="px-5 pb-5 flex justify-end" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
            {node.rewardUnlocked && (
              <div className="flex-1 text-[9px] tracking-[0.2em] uppercase text-white/30 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-400/60" />
                {node.rewardUnlocked.replace(/_/g, ' ')}
              </div>
            )}
            <button
              onClick={() => onEnd && onEnd(node)}
              className="px-5 py-2 rounded-lg text-[10px] tracking-[0.35em] uppercase font-semibold transition-all"
              style={{
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.35)',
                color: '#6ee7b7',
              }}
            >
              Continue →
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}