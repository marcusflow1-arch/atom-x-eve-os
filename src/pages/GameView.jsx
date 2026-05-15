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
import GameWorldServerManager from '../components/game3d/GameWorldServerManager';
import FriendsListPanel from '../components/game3d/social/FriendsListPanel';
import PartyPanel from '../components/game3d/social/PartyPanel';
import TradePanel from '../components/game3d/social/TradePanel';
import IncomingRequestToast from '../components/game3d/social/IncomingRequestToast';
import DuelSystem from '../components/game3d/social/DuelSystem';
import DuelMarkers from '../components/game3d/social/DuelMarkers';
import NetworkBridgeMount from '../components/network/NetworkBridgeMount';
import NetworkBridgeHUD from '../components/network/debug/NetworkBridgeHUD';
import NetworkRemotesMount from '../components/network/remote/NetworkRemotesMount';
import LegacyRemotesVisibilityToggle from '../components/network/remote/LegacyRemotesVisibilityToggle';
import NetworkRemotesDebugOverlay from '../components/network/debug/NetworkRemotesDebugOverlay';
import {
  sendFriendRequest, sendPartyRequest, sendTradeRequest, sendDuelRequest,
  partyStore,
} from '../components/game3d/social/socialStores';
import { useAuth } from '@/components/auth/AuthContext';
import { toast } from 'react-hot-toast';

export default function GameView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phase, setPhase] = useState('login'); // 'login' | 'world'
  const [storeOpen, setStoreOpen] = useState(false);
  const [progressionOpen, setProgressionOpen] = useState(false);
  const [skillTreeOpen, setSkillTreeOpen] = useState(false);
  const [friendsListOpen, setFriendsListOpen] = useState(false);

  // World server join is handled by GameWorldServerManager — it enforces the
  // 20-player cap and dispatches joinMultiplayerChannel only when capacity allows.

  // Player interaction menu actions (Duel / Add Friend / Trade / Party Up)
  // These now drive the in-game stores directly so the UI reflects changes
  // immediately. The Base44 entity records are still created in the background
  // so the data is persisted for the receiving player to accept later.
  useEffect(() => {
    const onAction = async (e) => {
      const { action, playerId, playerName } = e.detail || {};
      console.log('[Social] gamePlayerAction received:', { action, playerId, playerName, myId: user?.id });
      if (!playerId) { toast.error('No target player ID'); return; }
      if (!user?.id) { toast.error('You must be signed in'); return; }
      if (playerId === user.id) { toast.error("That's you!"); return; }
      const senderName = user.full_name || user.username || 'Player';
      const sender = { id: user.id, name: senderName };
      const receiver = { id: playerId, name: playerName };

      try {
        if (action === 'friend') {
          const res = await sendFriendRequest(sender, receiver);
          console.log('[Social] friend request created:', res);
          toast.success(`Friend request sent to ${playerName}`);
        } else if (action === 'party') {
          const res = await sendPartyRequest(sender, receiver, partyStore.get().partyId);
          console.log('[Social] party request created:', res);
          toast.success(`Party invite sent to ${playerName}`);
        } else if (action === 'trade') {
          const res = await sendTradeRequest(sender, receiver);
          console.log('[Social] trade request created:', res);
          toast.success(`Trade request sent to ${playerName}`);
        } else if (action === 'duel') {
          const res = await sendDuelRequest(sender, receiver);
          console.log('[Social] duel request created:', res);
          toast.success(`Duel challenge sent to ${playerName}`);
        }
      } catch (err) {
        console.error('[Social] request failed:', err);
        toast.error(`Failed to send ${action} request: ${err?.message || 'unknown error'}`);
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
      } else if (e.key.toLowerCase() === 'l') {
        setFriendsListOpen((v) => !v);
      } else if (e.key === 'Escape') {
        if (storeOpen) setStoreOpen(false);
        if (progressionOpen) setProgressionOpen(false);
        if (skillTreeOpen) setSkillTreeOpen(false);
        if (friendsListOpen) setFriendsListOpen(false);
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
      <GameWorldServerManager />
      <StoreMenuOverlay isOpen={storeOpen} onClose={() => setStoreOpen(false)} />
      <CharacterProgressionMenu isOpen={progressionOpen} onClose={() => setProgressionOpen(false)} />
      <SkillTreeMenu open={skillTreeOpen} onClose={() => setSkillTreeOpen(false)} />
      <FriendsListPanel open={friendsListOpen} onClose={() => setFriendsListOpen(false)} />
      <PartyPanel />
      <TradePanel />
      <IncomingRequestToast userId={user?.id} userName={user?.full_name || user?.username || 'Player'} />
      <DuelSystem userId={user?.id} />
      <DuelMarkers localUserId={user?.id} />

      {/* Slice B — feature-flagged. Default OFF, no effect on existing systems. */}
      <NetworkBridgeMount />
      <NetworkBridgeHUD />
      {/* Slice C — feature-flagged. Default OFF, runs alongside legacy WebRTC remotes. */}
      <NetworkRemotesMount />
      <LegacyRemotesVisibilityToggle />
      <NetworkRemotesDebugOverlay />
    </div>
  );
}