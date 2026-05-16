import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import CharacterLoginScreen from '../components/game3d/CharacterLoginScreen';
import GameSettingsMenu from '../components/game3d/GameSettingsMenu';
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
import NetworkValidationTelemetry from '../components/network/debug/NetworkValidationTelemetry';
import { partyStore } from '../components/game3d/social/socialStores';
import GameWorldLootLayer from '../components/game3d/GameWorldLootLayer';
// Each action has its own dedicated send module — they do NOT share a code path.
import { sendFriendRequest } from '../components/game3d/social/friendRequest';
import { sendPartyInvite } from '../components/game3d/social/partyInvite';
import { sendTradeRequest } from '../components/game3d/social/tradeRequest';
import { sendDuelChallenge } from '../components/game3d/social/duelChallenge';
import { useAuth } from '@/components/auth/AuthContext';
import { toast } from 'react-hot-toast';
import PassiveSkillAuraEffects from '../components/game3d/PassiveSkillAuraEffects';
import { getLearnedSkillIds, subscribeLootInventory, subscribeLearnedSkills } from '../components/game3d/lootStore';
import SlashEffectLayer from '../components/game3d/SlashEffect';

export default function GameView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phase, setPhase] = useState('login'); // 'login' | 'world'
  const [storeOpen, setStoreOpen] = useState(false);
  const [progressionOpen, setProgressionOpen] = useState(false);
  const [skillTreeOpen, setSkillTreeOpen] = useState(false);
  const [friendsListOpen, setFriendsListOpen] = useState(false);
  const [learnedSkillIds, setLearnedSkillIds] = useState(() => getLearnedSkillIds());
  const [loginAudioUrl, setLoginAudioUrl] = useState(null);
  const [worldAudioUrl, setWorldAudioUrl] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [soundVolume, setSoundVolume] = useState(() => parseFloat(localStorage.getItem('gameVolume') || '1.0'));
  const [graphicsLevel, setGraphicsLevel] = useState(() => localStorage.getItem('graphicsLevel') || 'high');
  const worldAudioRef = useRef(null);
  const loginAudioRef = useRef(null);

  useEffect(() => subscribeLearnedSkills(setLearnedSkillIds), []);

  // Fetch audio URLs: first for login screen, second for world
  useEffect(() => {
    base44.entities.HeroBackground.list('-created_date', 2)
      .then((backgrounds) => {
        if (backgrounds.length > 0 && backgrounds[0].audio_url) {
          setLoginAudioUrl(backgrounds[0].audio_url);
        }
        if (backgrounds.length > 1 && backgrounds[1].audio_url) {
          setWorldAudioUrl(backgrounds[1].audio_url);
        } else if (backgrounds.length > 0 && backgrounds[0].audio_url) {
          // Fallback: use first audio for both if only one available
          setWorldAudioUrl(backgrounds[0].audio_url);
        }
      })
      .catch(() => {});
  }, []);

  // Manage login audio — plays on login phase, stops on world entry
  useEffect(() => {
    if (phase !== 'login' || !loginAudioUrl) return;

    if (!loginAudioRef.current) {
      loginAudioRef.current = new Audio(loginAudioUrl);
      loginAudioRef.current.loop = true;
      loginAudioRef.current.volume = 0.5;
      loginAudioRef.current.play().catch(() => {});
    }

    return () => {
      if (loginAudioRef.current) {
        loginAudioRef.current.pause();
        loginAudioRef.current.currentTime = 0;
        loginAudioRef.current = null;
      }
    };
  }, [phase, loginAudioUrl]);

  // Manage world background music
  useEffect(() => {
    if (phase !== 'world' || !worldAudioUrl) return;

    if (!worldAudioRef.current) {
      worldAudioRef.current = new Audio(worldAudioUrl);
      worldAudioRef.current.loop = true;
      worldAudioRef.current.volume = soundVolume;
      worldAudioRef.current.play().catch(() => {});
    } else {
      worldAudioRef.current.volume = soundVolume;
    }

    return () => {
      if (worldAudioRef.current) {
        worldAudioRef.current.pause();
        worldAudioRef.current.currentTime = 0;
        worldAudioRef.current = null;
      }
    };
  }, [phase, worldAudioUrl, soundVolume]);

  // Stop all audio when leaving GameView
  useEffect(() => {
    return () => {
      if (loginAudioRef.current) {
        loginAudioRef.current.pause();
        loginAudioRef.current = null;
      }
      if (worldAudioRef.current) {
        worldAudioRef.current.pause();
        worldAudioRef.current = null;
      }
    };
  }, []);

  const handleSettingsChange = ({ soundVolume: newVolume, graphicsLevel: newGraphics }) => {
    setSoundVolume(newVolume);
    setGraphicsLevel(newGraphics);
    if (worldAudioRef.current) {
      worldAudioRef.current.volume = newVolume;
    }
  };


  // World server join is handled by GameWorldServerManager — it enforces the
  // 20-player cap and dispatches joinMultiplayerChannel only when capacity allows.

  // Player interaction menu actions — each action (friend / party / trade / duel)
  // is dispatched to its OWN dedicated module. They do not share a code path,
  // so each one can evolve its rules, side effects, and error messages
  // independently.
  useEffect(() => {
    // Shared error formatter for the generic codes that every send helper can throw.
    const formatError = (err, action) => {
      if (err?.code === 'cooldown') return { msg: err.message, icon: '⏳' };
      if (err?.code === 'rate_limit') return { msg: 'Server is busy — try again in a few seconds', error: true };
      if (err?.code === 'self') return { msg: "That's you!", error: true };
      if (err?.code === 'invalid') return { msg: 'Invalid target', error: true };
      return { msg: `Failed to send ${action}: ${err?.message || 'unknown error'}`, error: true };
    };
    const showError = (err, action) => {
      const f = formatError(err, action);
      if (f.error) toast.error(f.msg); else toast(f.msg, { icon: f.icon });
    };

    // ─── FRIEND ───
    const handleFriend = async (sender, receiver) => {
      try {
        await sendFriendRequest(sender, receiver);
        toast.success(`Friend request sent to ${receiver.name}`);
      } catch (err) {
        console.error('[Social/friend] failed:', err);
        if (err?.code === 'already_friends') toast(err.message, { icon: '🤝' });
        else showError(err, 'friend request');
      }
    };

    // ─── PARTY ───
    const handleParty = async (sender, receiver) => {
      try {
        await sendPartyInvite(sender, receiver, partyStore.get().partyId);
        toast.success(`Party invite sent to ${receiver.name}`);
      } catch (err) {
        console.error('[Social/party] failed:', err);
        if (err?.code === 'party_full') toast.error('Your party is full');
        else showError(err, 'party invite');
      }
    };

    // ─── TRADE ───
    const handleTrade = async (sender, receiver) => {
      try {
        await sendTradeRequest(sender, receiver);
        toast.success(`Trade request sent to ${receiver.name}`);
      } catch (err) {
        console.error('[Social/trade] failed:', err);
        showError(err, 'trade request');
      }
    };

    // ─── DUEL ───
    const handleDuel = async (sender, receiver) => {
      try {
        await sendDuelChallenge(sender, receiver);
        toast.success(`Duel challenge sent to ${receiver.name}`);
      } catch (err) {
        console.error('[Social/duel] failed:', err);
        if (err?.code === 'already_dueling') toast.error(err.message);
        else showError(err, 'duel challenge');
      }
    };

    const onAction = (e) => {
      const { action, playerId, playerName } = e.detail || {};
      console.log('[Social] gamePlayerAction received:', { action, playerId, playerName, myId: user?.id });
      if (!playerId) { toast.error('No target player ID'); return; }
      if (!user?.id) { toast.error('You must be signed in'); return; }
      if (playerId === user.id) { toast.error("That's you!"); return; }
      const senderName = user.full_name || user.username || 'Player';
      const sender = { id: user.id, name: senderName };
      const receiver = { id: playerId, name: playerName };

      // Route to the dedicated handler — no shared try/catch, no shared switch.
      if (action === 'friend') handleFriend(sender, receiver);
      else if (action === 'party') handleParty(sender, receiver);
      else if (action === 'trade') handleTrade(sender, receiver);
      else if (action === 'duel') handleDuel(sender, receiver);
      else console.warn('[Social] unknown action:', action);
    };
    window.addEventListener('gamePlayerAction', onAction);
    return () => window.removeEventListener('gamePlayerAction', onAction);
  }, [user?.id, user?.full_name, user?.username]);

  // Hotkeys while in-game: TAB = store/build, C = character progression, ESC = settings
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
        else if (progressionOpen) setProgressionOpen(false);
        else if (skillTreeOpen) setSkillTreeOpen(false);
        else if (friendsListOpen) setFriendsListOpen(false);
        else setSettingsOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, storeOpen, progressionOpen, skillTreeOpen, friendsListOpen, settingsOpen]);

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
      <GameWorld3D soundVolume={soundVolume} graphicsLevel={graphicsLevel} />
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
      <NetworkValidationTelemetry />

      {/* Loot drop layer — spawns world items on enemy death, handles E-to-pickup */}
      <GameWorldLootLayer />

      {/* Passive skill aura visual effects rendered over the player */}
      <PassiveSkillAuraEffects activeSkillIds={[...learnedSkillIds]} />

      {/* Slash visual effects — fires on basic attack and skill activations */}
      <SlashEffectLayer />

      {/* Settings menu (ESC) */}
      <GameSettingsMenu 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
        onSettingsChange={handleSettingsChange} 
      />
    </div>
  );
}