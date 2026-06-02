// DialogueBeatCard.jsx — Continuous branching dialogue line for the Living Quest
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QUEST_GIVER } from './livingQuestData';

function useTypewriter(text, speed = 22) {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    setDisplay('');
    if (!text) return;
    let i = 0;
    const iv = setInterval(() => {
      setDisplay(text.slice(0, ++i));
      if (i >= text.length) clearInterval(iv);
    }, speed);
    return () => clearInterval(iv);
  }, [text]);
  return display;
}

export default function DialogueBeatCard({ beat, onChoose }) {
  const text = useTypewriter(beat.text);
  const color = QUEST_GIVER.color;

  return (
    <motion.div
      key={beat.id}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-2xl rounded-3xl overflow-hidden"
      style={{ background: 'rgba(8,12,20,0.96)', border: `1px solid ${color}40`, boxShadow: `0 0 50px ${color}20` }}
    >
      {/* Speaker header */}
      <div className="px-6 py-4 flex items-center gap-3" style={{ background: QUEST_GIVER.accent, borderBottom: `1px solid ${color}30` }}>
        <img src={QUEST_GIVER.portrait} alt={QUEST_GIVER.name}
          className="w-11 h-11 rounded-full object-cover" style={{ border: `1px solid ${color}50` }} />
        <div>
          <div className="text-sm font-bold" style={{ color }}>{QUEST_GIVER.name}</div>
          <div className="text-[9px] tracking-[0.25em] uppercase text-white/30">{QUEST_GIVER.role}</div>
        </div>
      </div>

      {/* Dialogue text */}
      <div className="px-6 pt-5 pb-3 min-h-[88px]">
        <p className="text-base leading-relaxed text-white/80 font-serif">{text}</p>
      </div>

      {/* Branching choices */}
      <div className="px-6 pb-6 space-y-2">
        {beat.choices.map((choice, i) => (
          <motion.button
            key={i}
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChoose(choice)}
            className="w-full text-left px-4 py-3 rounded-xl text-sm text-white/80 font-medium transition-all"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {choice.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}