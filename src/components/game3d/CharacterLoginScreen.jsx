import PlayerAvatarPreview from '@/components/onboarding/PlayerAvatarPreview';
import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, MessageSquare, Settings, Power, Loader2 } from 'lucide-react';
import {
  subscribeCharacters,
  activateAndSyncToHUD,
  getCharacterState,
} from './characterStore';
import CharacterCreationModal from './CharacterCreationModal';

const ARCHER_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/3f915913a_ErikaArcher.fbx';
const IDLE_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/9922e6dd0_Idle.fbx';

/**
 * CharacterLoginScreen — Character selection and creation.
 * Renders the female archer (ErikaArcher) facing the camera with an idle animation.
 * Players can select a character from their persistent roster or create a new one.
 */
export default function CharacterLoginScreen({ onPlay }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [selectedCharIdx, setSelectedCharIdx] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [roster, setRoster] = useState(() => getCharacterState().roster);

  // Live-subscribe to the persistent character roster.
  useEffect(() => subscribeCharacters((s) => {
    setRoster(s.roster);
    const idx = s.roster.findIndex((c) => c.id === s.activeId);
    if (idx >= 0) setSelectedCharIdx(idx);
  }), []);

  // Decorate each roster entry with its OWN saved level (read directly
  // from that character's namespaced progression slot).
  const characters = roster.map((c) => {
    let level = 1;
    try {
      const raw = localStorage.getItem(`wwm_player_progression_v1::${c.id}`);
      if (raw) level = JSON.parse(raw).level || 1;
    } catch {}
    return { ...c, level };
  });

  // Activate the selected character's saved level/xp into the HUD, then play.
  const [starting,setStarting]=useState(false),[startError,setStartError]=useState('');
  const handlePlay=async()=>{if(starting)return;setStarting(true);setStartError('');try{const chosen=characters[selectedCharIdx];if(chosen)await activateAndSyncToHUD(chosen.id);onPlay?.();}catch(e){setStartError(e.message);}finally{setStarting(false);}};



  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Background scene — gradient + decorative fantasy bg */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 80% 20%, rgba(255, 180, 200, 0.25) 0%, transparent 50%),
            radial-gradient(ellipse at 20% 80%, rgba(100, 200, 220, 0.2) 0%, transparent 50%),
            linear-gradient(135deg, #1a2438 0%, #2d3a52 30%, #4a4068 70%, #2d3a52 100%)
          `,
        }}
      />

      {/* Decorative atmospheric particles */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              opacity: 0.3 + Math.random() * 0.5,
              animation: `float-particle ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
      `}</style>

      {/* 3D character viewport */}
      <div className="absolute inset-0" ><PlayerAvatarPreview config={characters[selectedCharIdx]?.isDevTest?undefined:characters[selectedCharIdx]} controls="compact"/></div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-12 h-12 text-cyan-300 animate-spin" />
        </div>
      )}

      {/* TOP-LEFT: ESC + Title */}
      <div className="absolute top-6 left-8 flex items-center gap-4 z-10">
        <div className="px-2 py-1 rounded border border-white/30 text-white/80 text-xs font-bold tracking-wider">
          ESC
        </div>
        <h1 className="text-white text-2xl font-light tracking-[0.3em] uppercase drop-shadow-lg">
          Select Character
        </h1>
      </div>

      {/* TOP-RIGHT: Action icons */}
      <div className="absolute top-6 right-8 flex items-center gap-3 z-10">
        {[MessageSquare, Settings, Power].map((Icon, i) => (
          <button
            key={i}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all"
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* LEFT PANEL: Characters */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="absolute left-8 top-1/2 -translate-y-1/2 w-[320px] z-10"
      >
        <div
          className="rounded-lg overflow-hidden"
          style={{
            background: 'rgba(20, 35, 55, 0.85)',
            backdropFilter: 'blur(20px) saturate(160%)',
            border: '1px solid rgba(120, 180, 220, 0.25)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          {/* Characters */}
          <div className="p-4">
            <div className="text-[10px] text-white/50 font-bold tracking-[0.2em] uppercase mb-3">Characters</div>
            <div className="space-y-2">
              {characters.length === 0 && (
                <div className="px-3 py-6 rounded bg-black/20 border border-white/5 text-center text-white/50 text-xs">
                  No characters yet. Create one to begin.
                </div>
              )}

              {characters.map((char, idx) => {
                const isSelected = selectedCharIdx === idx;
                return (
                  <button
                    key={char.id || char.name}
                    onClick={() => setSelectedCharIdx(idx)}
                    className={`w-full flex items-center gap-3 p-3 rounded transition-all ${
                      isSelected
                        ? 'bg-cyan-500/10 border border-cyan-400/40'
                        : 'bg-black/20 border border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${
                        isSelected ? 'bg-cyan-500/30 border border-cyan-300/50' : 'bg-white/10 border border-white/15'
                      }`}
                    >
                      {char.level}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-base">{char.name}</span>
                        {char.isDevTest && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-amber-500/20 border border-amber-400/40 text-amber-300">
                            Editor
                          </span>
                        )}
                      </div>
                      <div className="text-white/50 text-xs">Level {char.level}</div>
                    </div>
                  </button>
                );
              })}

              <button
                onClick={() => setShowCreate(true)}
                className="w-full flex items-center justify-center gap-2 p-3 rounded border border-dashed border-white/20 hover:border-white/40 text-white/60 hover:text-white text-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="underline underline-offset-2">Create Character</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* BOTTOM-RIGHT: PLAY */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="absolute bottom-8 right-8 w-[280px] z-10"
      >
        <motion.button
          onClick={handlePlay}
          disabled={starting||characters.length===0}
          whileHover={{ scale: characters.length === 0 ? 1 : 1.02 }}
          whileTap={{ scale: characters.length === 0 ? 1 : 0.98 }}
          className={`w-full py-4 rounded text-white font-bold text-xl tracking-[0.3em] uppercase relative overflow-hidden group ${characters.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{
            background: 'linear-gradient(180deg, rgba(40, 100, 140, 0.7) 0%, rgba(20, 60, 100, 0.9) 100%)',
            border: '1px solid rgba(120, 200, 240, 0.5)',
            boxShadow: '0 0 30px rgba(100, 200, 240, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        >
          <span
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: 'linear-gradient(180deg, rgba(100, 220, 255, 0.3) 0%, rgba(40, 120, 180, 0.5) 100%)',
            }}
          />
          <span className="relative z-10 drop-shadow-lg">{starting?'LOADING…':'PLAY'}</span>
        </motion.button>
      </motion.div>

      {startError&&<p role="alert" className="absolute bottom-28 right-8 text-red-300">{startError}</p>}
      {showCreate && (
        <CharacterCreationModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { /* roster subscription auto-selects new char */ }}
        />
      )}
    </div>
  );
}