import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';
import CharacterLoginScreen from '../components/game3d/CharacterLoginScreen';
import GameWorld3D from '../components/game3d/GameWorld3D';
import SkillSlotHUD from '../components/game3d/SkillSlotHUD';
import StoreMenuOverlay from '../components/game3d/StoreMenuOverlay';

export default function GameView() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('login'); // 'login' | 'world'
  const [storeOpen, setStoreOpen] = useState(false);

  // TAB key toggles the store/build menu while in-game
  useEffect(() => {
    if (phase !== 'world') return;
    const onKey = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        setStoreOpen((v) => !v);
      } else if (e.key === 'Escape' && storeOpen) {
        setStoreOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, storeOpen]);

  if (phase === 'login') {
    return (
      <div className="fixed inset-0 bg-black">
        <CharacterLoginScreen onPlay={() => setPhase('world')} />
        <button
          onClick={() => navigate(createPageUrl('LunaTemplate'))}
          className="absolute top-6 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white/60 hover:text-white text-xs flex items-center gap-1.5 z-20"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Luna
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <GameWorld3D />
      <SkillSlotHUD />
      <StoreMenuOverlay isOpen={storeOpen} onClose={() => setStoreOpen(false)} />

      {/* Back button */}
      <button
        onClick={() => navigate(createPageUrl('LunaTemplate'))}
        className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white/70 hover:text-white text-xs flex items-center gap-1.5 z-20"
      >
        <ArrowLeft className="w-3 h-3" />
        Back
      </button>
    </div>
  );
}