import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';
import CharacterLoginScreen from '../components/game3d/CharacterLoginScreen';
import GameWorld3D from '../components/game3d/GameWorld3D';
import GameHUD from '../components/game3d/hud/GameHUD';
import StoreMenuOverlay from '../components/game3d/StoreMenuOverlay';
import CharacterProgressionMenu from '../components/game3d/CharacterProgressionMenu';
import SkillTreeMenu from '../components/game3d/SkillTreeMenu';
import OnlinePlayersPanel from '../components/game3d/hud/OnlinePlayersPanel';
import BossWaypoint from '../components/game3d/hud/BossWaypoint';
import MultiplayerSystem from '../components/game/MultiplayerSystem';
import { useAuth } from '@/components/auth/AuthContext';
import { toast } from 'react-hot-toast';
import { base44 } from '@/api/base44Client';

export default function GameView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phase, setPhase] = useState('login'); // 'login' | 'world'
  const [storeOpen, setStoreOpen] = useState(false);
  const [progressionOpen, setProgressionOpen] = useState(false);
  const [skillTreeOpen, setSkillTreeOpen] = useState(false);

  // Join the game-mode multiplayer channel so other players can see us & we can see them.
  // Uses the same MultiplayerSystem the Luna dashboard uses, but on a `game_<userId>` channel
  // so game-mode presence is distinct from dashboard presence.
  useEffect(() => {
    if (phase === 'world' && user?.id) {
      // Shared world channel — every player joins the same channel so they
      // can see and interact with each other on one server/map.
      window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', {
        detail: { channelId: 'game_world_main', hostId: 'game_world_main' }
      }));
    }
  }, [phase, user?.id]);

  // Player interaction menu actions (Duel / Add Friend / Trade / Party Up)
  useEffect(() => {
    const onAction = async (e) => {
      const { action, playerId, playerName } = e.detail || {};
      if (!playerId || !user?.id) return;
      try {
        if (action === 'friend') {
          await base44.entities.FriendRequest.create({
            from_user_id: user.id, to_user_id: playerId,
            from_display_name: user.full_name || user.username || 'Player', status: 'pending',
          });
          toast.success(`Friend request sent to ${playerName}`);
        } else if (action === 'trade') {
          await base44.entities.TradeOffer.create({
            from_user_id: user.id, to_user_id: playerId,
            from_display_name: user.full_name || user.username || 'Player', status: 'pending',
          });
          toast.success(`Trade request sent to ${playerName}`);
        } else if (action === 'party') {
          await base44.entities.PartyMember.create({
            invited_by: user.id, user_id: playerId, status: 'invited',
            display_name: playerName,
          });
          toast.success(`${playerName} invited to party`);
        } else if (action === 'duel') {
          await base44.entities.Challenge.create({
            challenger_id: user.id, opponent_id: playerId,
            type: 'duel', status: 'pending',
            message: `${user.full_name || 'Player'} challenges you to a duel!`,
          });
          toast.success(`Duel challenge sent to ${playerName}`);
        }
      } catch (err) {
        toast.error('Could not send request');
        console.error('Player action failed:', err);
      }
    };
    window.addEventListener('gamePlayerAction', onAction);
    return () => window.removeEventListener('gamePlayerAction', onAction);
  }, [user?.id, user?.full_name, user?.username]);

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
      } else if (e.key.toLowerCase() === 'k') {
        setSkillTreeOpen((v) => !v);
      } else if (e.key === 'Escape') {
        if (storeOpen) setStoreOpen(false);
        if (progressionOpen) setProgressionOpen(false);
        if (skillTreeOpen) setSkillTreeOpen(false);
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
      <BossWaypoint />
      <MultiplayerSystem envUrl="game_world_lowpoly" />
      <StoreMenuOverlay isOpen={storeOpen} onClose={() => setStoreOpen(false)} />
      <CharacterProgressionMenu isOpen={progressionOpen} onClose={() => setProgressionOpen(false)} />
      <SkillTreeMenu open={skillTreeOpen} onClose={() => setSkillTreeOpen(false)} />

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