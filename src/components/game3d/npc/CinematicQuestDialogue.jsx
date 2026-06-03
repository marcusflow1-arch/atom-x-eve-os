// CinematicQuestDialogue.jsx — In-world cinematic dialogue → quest flow.
// Opens when the Living Quest NPC is interacted with: zooms the camera onto the
// player + NPC, shows a bottom dialogue chat box (typewriter + voiced lines),
// then offers the quest. Accepting spawns the demons into the live 3D world.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Swords } from 'lucide-react';
import { BEATS, FIRST_BEAT, QUEST_GIVER } from '@/components/livingquest/livingQuestData';
import { startCinematicCamera, stopCinematicCamera } from '@/components/livingquest/cinematicCamera';
import { generateStoryAudio } from '@/functions/generateStoryAudio';

function useTypewriter(text, speed = 24) {
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

export default function CinematicQuestDialogue() {
  const [open, setOpen] = useState(false);
  const [beatId, setBeatId] = useState(FIRST_BEAT);
  const audioRef = useRef(null);
  const beat = BEATS[beatId];

  // Open / close on the in-world interaction event.
  useEffect(() => {
    const onOpen = () => {
      setBeatId(FIRST_BEAT);
      setOpen(true);
      startCinematicCamera();
      window.dispatchEvent(new CustomEvent('cinematicDialogueStart'));
    };
    window.addEventListener('openLivingQuest', onOpen);
    return () => window.removeEventListener('openLivingQuest', onOpen);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    stopCinematicCamera();
    window.dispatchEvent(new CustomEvent('cinematicDialogueEnd'));
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
  }, []);

  // Voice the current spoken line via ElevenLabs.
  const spokenText = beat?.type === 'dialogue' ? beat.text
    : beat?.type === 'ending' ? beat.body : null;
  useEffect(() => {
    if (!open || !spokenText) return;
    let cancelled = false;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    generateStoryAudio({ text: spokenText })
      .then((res) => {
        if (cancelled) return;
        const blob = res?.data instanceof Blob ? res.data : new Blob([res.data], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const a = new Audio(url);
        a.volume = 0.9;
        audioRef.current = a;
        a.play().catch(() => {});
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [open, spokenText]);

  const display = useTypewriter(spokenText || '');
  const color = QUEST_GIVER.color;

  const goTo = (id) => { if (id) setBeatId(id); };

  const acceptQuest = () => {
    // Spawn the demons into the live world using the spawner GameWorld3D exposes.
    const spawn = window.__gw3dSpawnQuestEnemies;
    if (spawn && beat.spawnCount) {
      spawn({
        count: beat.spawnCount,
        tierName: beat.spawnTier || 'normal',
        playerPos: window.__localPlayerPos || { x: 0, z: 0 },
      });
    }
    // Register the quest objective so the kill tracker / HUD can follow it.
    window.dispatchEvent(new CustomEvent('livingQuestAccepted', {
      detail: { title: beat.title, count: beat.spawnCount, reward: beat.reward },
    }));
    close();
  };

  if (!open || !beat) return null;

  return (
    <div className="fixed inset-0 z-[9000] pointer-events-none flex flex-col justify-end">
      {/* Cinematic letterbox bars */}
      <div className="absolute top-0 left-0 right-0 h-[8vh] bg-black/85" />
      <div className="absolute bottom-0 left-0 right-0 h-[8vh] bg-black/85" />

      {/* Close (skip) */}
      <button
        onClick={close}
        className="pointer-events-auto absolute top-[calc(8vh+12px)] right-5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white/60 hover:text-white transition-all"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        Skip
      </button>

      {/* Dialogue chat box */}
      <div className="pointer-events-auto w-full flex justify-center px-4 pb-[10vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={beat.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-3xl rounded-3xl overflow-hidden"
            style={{ background: 'rgba(8,12,20,0.96)', border: `1px solid ${color}55`, boxShadow: `0 0 60px ${color}25` }}
          >
            {/* Speaker header */}
            <div className="px-6 py-4 flex items-center gap-3" style={{ background: QUEST_GIVER.accent, borderBottom: `1px solid ${color}30` }}>
              <img src={QUEST_GIVER.portrait} alt={QUEST_GIVER.name} className="w-12 h-12 rounded-full object-cover" style={{ border: `1px solid ${color}60` }} />
              <div>
                <div className="text-base font-bold" style={{ color }}>{beat.speaker || QUEST_GIVER.name}</div>
                <div className="text-[9px] tracking-[0.25em] uppercase text-white/30">{QUEST_GIVER.role}</div>
              </div>
            </div>

            {/* QUEST OFFER beat */}
            {beat.type === 'quest' ? (
              <div className="px-6 py-5">
                <div className="flex items-center gap-2 mb-2">
                  <Swords className="w-4 h-4" style={{ color }} />
                  <span className="text-white font-bold text-lg">{beat.title}</span>
                </div>
                <p className="text-white/70 text-sm mb-1">{beat.objectiveText}</p>
                <p className="text-[11px] uppercase tracking-wider mb-5" style={{ color }}>Reward · {beat.reward?.xp} XP</p>
                <div className="flex gap-3">
                  <button
                    onClick={acceptQuest}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all"
                    style={{ background: `${color}30`, border: `1px solid ${color}70` }}
                  >
                    <Check className="w-4 h-4" /> Accept the Hunt
                  </button>
                  <button
                    onClick={close}
                    className="px-5 py-3 rounded-xl text-sm font-medium text-white/70 transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : beat.type === 'ending' ? (
              <div className="px-6 py-5">
                <div className="text-[10px] tracking-[0.3em] uppercase mb-1" style={{ color }}>{beat.chapter}</div>
                <div className="text-white font-bold text-lg mb-2">{beat.headline}</div>
                <p className="text-white/75 text-sm leading-relaxed font-serif mb-5">{display}</p>
                <button
                  onClick={close}
                  className="w-full px-5 py-3 rounded-xl text-sm font-bold text-white transition-all"
                  style={{ background: `${color}30`, border: `1px solid ${color}70` }}
                >
                  Continue
                </button>
              </div>
            ) : (
              /* DIALOGUE beat */
              <>
                <div className="px-6 pt-5 pb-3 min-h-[92px]">
                  <p className="text-base leading-relaxed text-white/85 font-serif">{display}</p>
                </div>
                <div className="px-6 pb-6 space-y-2">
                  {beat.choices?.map((choice, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => goTo(choice.next)}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm text-white/85 font-medium transition-all"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      {choice.label}
                    </motion.button>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}