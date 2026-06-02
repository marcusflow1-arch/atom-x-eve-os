// LivingQuest — Playable test scenario: story + continuous branching dialogue in one flow.
import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GitBranch } from 'lucide-react';
import { BEATS, FIRST_BEAT } from '@/components/livingquest/livingQuestData';
import StoryBeatCard from '@/components/livingquest/StoryBeatCard';
import DialogueBeatCard from '@/components/livingquest/DialogueBeatCard';
import ObjectiveBeatCard from '@/components/livingquest/ObjectiveBeatCard';

export default function LivingQuest() {
  const navigate = useNavigate();
  const [beatId, setBeatId] = useState(FIRST_BEAT);
  const [path, setPath] = useState([]); // breadcrumb of visited beat ids
  const beat = BEATS[beatId];

  const goTo = (nextId) => {
    setPath(p => [...p, beatId]);
    setBeatId(nextId);
  };

  const handleAdvance = (b) => {
    if (b.type === 'ending') { setBeatId(FIRST_BEAT); setPath([]); return; }
    if (b.next) goTo(b.next);
  };

  const handleChoose = (choice) => {
    if (choice.next) goTo(choice.next);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a1535 0%, #0a0813 60%, #050309 100%)', fontFamily: 'system-ui' }}>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[160px]" style={{ background: 'rgba(168,85,247,0.12)' }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[160px]" style={{ background: 'rgba(59,130,246,0.1)' }} />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-10">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Exit
        </button>
        <div className="flex items-center gap-2 text-white/40 text-[10px] tracking-[0.3em] uppercase">
          <GitBranch className="w-3.5 h-3.5" /> Living Quest · Step {path.length + 1}
        </div>
      </div>

      {/* Beat content */}
      <div className="relative z-[5] w-full flex justify-center">
        <AnimatePresence mode="wait">
          {beat.type === 'dialogue' ? (
            <DialogueBeatCard key={beat.id} beat={beat} onChoose={handleChoose} />
          ) : beat.type === 'objective' ? (
            <ObjectiveBeatCard key={beat.id} beat={beat} onComplete={handleAdvance} />
          ) : (
            <StoryBeatCard key={beat.id} beat={beat} onAdvance={handleAdvance} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}