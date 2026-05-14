import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';
import CharacterLoginScreen from '../components/game3d/CharacterLoginScreen';
import GameWorld3D from '../components/game3d/GameWorld3D';
import GameHUD from '../components/game3d/hud/GameHUD';
import StoreMenuOverlay from '../components/game3d/StoreMenuOverlay';
import CharacterProgressionMenu from '../components/game3d/CharacterProgressionMenu';
import OnlinePlayersPanel from '../components/game3d/hud/OnlinePlayersPanel';
import MultiplayerSystem from '../components/game/MultiplayerSystem';
import { useAuth } from '@/components/auth/AuthContext';

export default function GameView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phase, setPhase] = useState('login'); // 'login' | 'world'
  const [storeOpen, setStoreOpen] = useState(false);
  const [progressionOpen, setProgressionOpen] = useState(false);

  // Join the game-mode multiplayer channel so other players can see us & we can see them.
  // Uses the same MultiplayerSystem the Luna dashboard uses, but on a `game_<userId>` channel
  // so game-mode presence is distinct from dashboard presence.
  useEffect(() => {
    if (phase === 'world' && user?.id) {
      window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', {
        detail: { channelId: `game_${user.id}`, hostId: user.id }
      }));
    }
  }, [phase, user?.id]);

  // Hotkeys while in-game: TAB = store/build, C = character progression, ESC = close
  useEffect(() => {
    if (phase !== 'world') return;
    const onKey = (e) => {
      if (e.target?.matches?.('input, textarea')) return;
      if (e.key === 'Tab') {
        e.preventDefault();
        setStoreOpen((v) => !v);
      } else if (e.key.toLowerCase() === 'c') {
        setProgressionOpen((v) => !v);
      } else if (e.key === 'Escape') {
        if (storeOpen) setStoreOpen(false);
        if (progressionOpen) setProgressionOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, storeOpen, progressionOpen]);

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
      <GameHUD />
      <OnlinePlayersPanel />
      <MultiplayerSystem envUrl="game_world_lowpoly" />
      <StoreMenuOverlay isOpen={storeOpen} onClose={() => setStoreOpen(false)} />
      <CharacterProgressionMenu isOpen={progressionOpen} onClose={() => setProgressionOpen(false)} />

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