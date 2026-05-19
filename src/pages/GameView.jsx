import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Hammer } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import CharacterLoginScreen from '../components/game3d/CharacterLoginScreen';
import GameWorld3D from '../components/game3d/GameWorld3D';
import GameHUD from '../components/game3d/hud/GameHUD';
import StoreMenuOverlay from '../components/game3d/StoreMenuOverlay';
import CharacterProgressionMenu from '../components/game3d/CharacterProgressionMenu';
import BossWaypoint from '../components/game3d/hud/BossWaypoint';
import MultiplayerSystem from '../components/game/MultiplayerSystem';
import GameWorldServerManager from '../components/game3d/GameWorldServerManager';
import WorldSyncMount from '../components/game3d/network/WorldSyncMount';
import FriendsListPanel from '../components/game3d/social/FriendsListPanel';
import PartyPanel from '../components/game3d/social/PartyPanel';
import TradePanel from '../components/game3d/social/TradePanel';
import TradeSessionWatcher from '../components/game3d/social/TradeSessionWatcher';
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
import EnemyPlayerSpawner from '../components/game3d/EnemyPlayerSpawner';
import TerrainArea from '../components/game3d/terrain/TerrainArea';
import RogueAIHPBarLayer from '../components/game3d/RogueAIHPBarLayer';
import ShopEffectsBridge from '../components/game3d/shop/shopEffectsBridge';
// Each action has its own dedicated send module — they do NOT share a code path.
import { sendFriendRequest } from '../components/game3d/social/friendRequest';
import { sendPartyInvite } from '../components/game3d/social/partyInvite';
import { sendTradeRequest } from '../components/game3d/social/tradeRequest';
import { sendDuelChallenge } from '../components/game3d/social/duelChallenge';
import { useAuth } from '@/components/auth/AuthContext';
import { toast } from 'react-hot-toast';
import PassiveSkillAuraEffects from '../components/game3d/PassiveSkillAuraEffects';
import PlayerHaloAura from '../components/game3d/PlayerHaloAura';
import { getLearnedSkillIds, subscribeLootInventory, subscribeLearnedSkills } from '../components/game3d/lootStore';
import { runOneTimeProgressionReset } from '../components/game3d/progression/oneTimeReset';
import SlashEffectLayer from '../components/game3d/SlashEffect';
import PauseMenu from '../components/game3d/PauseMenu';
import WindRunEffect from '../components/game3d/WindRunEffect';
import SkillActivationToastListener from '../components/game3d/SkillActivationToastListener';
import GameStateProvider from '../components/game3d/state/GameStateProvider';
import CombatMusicTrigger from '../components/game3d/CombatMusicTrigger';
import DeathFlowController from '../components/game3d/death/DeathFlowController';
import ClanOverlay from '../components/game3d/clan/ClanOverlay';
import {
  bindWorldAudio,
  setWorldTargetVolume,
  teardownCombatMusic,
} from '../components/game3d/combatMusicController';

export default function GameView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phase, setPhase] = useState('login'); // 'login' | 'world'
  const [storeOpen, setStoreOpen] = useState(false);
  const [progressionOpen, setProgressionOpen] = useState(false);
  const [friendsListOpen, setFriendsListOpen] = useState(false);
  const [clanOverlayOpen, setClanOverlayOpen] = useState(false);
  const [learnedSkillIds, setLearnedSkillIds] = useState(() => getLearnedSkillIds());
  const [themeAudioUrl, setThemeAudioUrl] = useState(null);
  const [themeVideoUrl, setThemeVideoUrl] = useState(null);
  const [pauseMenuOpen, setPauseMenuOpen] = useState(false);
  const [themeVolume, setThemeVolume] = useState(() => {
    const saved = parseFloat(localStorage.getItem('game_theme_volume'));
    return Number.isFinite(saved) ? saved : 0.5;
  });
  const audioRef = useRef(null);

  useEffect(() => subscribeLearnedSkills(setLearnedSkillIds), []);

  // One-time wipe: reset Halo + Title progression to zero so the player can
  // rebuild from scratch. Guarded by a versioned localStorage flag — runs
  // exactly once per browser.
  useEffect(() => { runOneTimeProgressionReset(); }, []);

  // Load the appropriate theme URL based on phase ('game 1' for login, 'game 2' for world)
  useEffect(() => {
    let cancelled = false;
    const title = phase === 'world' ? 'game 2' : 'game 1';

    // Synchronously stop any currently-playing audio before loading the next theme
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.load();
      audioRef.current = null;
    }
    setThemeAudioUrl(null);

    base44.entities.HeroBackground.filter({ title })
      .then((backgrounds) => {
        if (cancelled) return;
        if (backgrounds.length > 0) {
          if (backgrounds[0].audio_url) setThemeAudioUrl(backgrounds[0].audio_url);
          if (backgrounds[0].video_url) setThemeVideoUrl(backgrounds[0].video_url);
        }
      })
      .catch((err) => console.error(`Failed to load ${title}:`, err));
    return () => { cancelled = true; };
  }, [phase]);

  // Single persistent audio player — one instance, owned by audioRef.
  // Cleans up on URL change AND on component unmount (e.g. navigating away from /GameView).
  useEffect(() => {
    // Always tear down any existing audio first to prevent overlap
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.load();
      audioRef.current = null;
    }
    if (!themeAudioUrl) return;

    const audio = new Audio(themeAudioUrl);
    audio.loop = true;
    audio.volume = themeVolume;
    audioRef.current = audio;
    audio.play().catch((err) => console.warn('Audio play blocked:', err));

    // Let the combat music controller duck this audio during combat.
    bindWorldAudio(audioRef, themeVolume);

    return () => {
      if (audioRef.current === audio) {
        audio.pause();
        audio.src = '';
        audio.load();
        audioRef.current = null;
      }
    };
  }, [themeAudioUrl]);

  // Tear down combat audio when leaving GameView entirely.
  useEffect(() => () => teardownCombatMusic(), []);


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

  // Live-update audio volume when slider changes (without reloading the track)
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = themeVolume;
    setWorldTargetVolume(themeVolume);
    localStorage.setItem('game_theme_volume', String(themeVolume));
  }, [themeVolume]);

  // Hotkeys while in-game: TAB = store/build, C = character progression, ESC = pause menu
  useEffect(() => {
    if (phase !== 'world') return;
    const onKey = (e) => {
      if (e.target?.matches?.('input, textarea')) return;
      if (e.key === 'Tab') {
        e.preventDefault();
        setStoreOpen((v) => !v);
      } else if (e.key.toLowerCase() === 'c') {
        setProgressionOpen((v) => !v);
      } else if (e.key.toLowerCase() === 'l') {
        setFriendsListOpen((v) => !v);
      } else if (e.key.toLowerCase() === 'g') {
        setClanOverlayOpen((v) => !v);
      } else if (e.key === 'Escape') {
        // Close any open sub-panels first; otherwise toggle pause menu
        if (storeOpen) setStoreOpen(false);
        else if (progressionOpen) setProgressionOpen(false);
        else if (friendsListOpen) setFriendsListOpen(false);
        else if (clanOverlayOpen) setClanOverlayOpen(false);
        else setPauseMenuOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, storeOpen, progressionOpen, friendsListOpen, clanOverlayOpen]);

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
      {/* Hybrid host-authoritative simulation layer.
          Owns enemies / loot / pvp damage / player hp.
          GameWorld3D is becoming a renderer that reads from this. */}
      <GameStateProvider>
      <GameWorld3D />
      <GameHUD />
      <BossWaypoint />
      <MultiplayerSystem envUrl="game_world_lowpoly" />
      <GameWorldServerManager />
      {/* Host-authoritative enemy/boss sync — elects one host per channel,
          broadcasts world snapshots, and applies them on non-hosts. */}
      <WorldSyncMount />
      <StoreMenuOverlay isOpen={storeOpen} onClose={() => setStoreOpen(false)} />
      <CharacterProgressionMenu isOpen={progressionOpen} onClose={() => setProgressionOpen(false)} />
      <FriendsListPanel open={friendsListOpen} onClose={() => setFriendsListOpen(false)} />
      <PartyPanel />
      <TradePanel />
      <TradeSessionWatcher userId={user?.id} />
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

      {/* Isolated fantasy-forest area — single hand-composed clearing with
          tree ring, rock barriers, grass tufts, altar, and water pond. */}
      <TerrainArea />

      {/* Hostile rogue-player AIs — kill them for gold, XP, loot, and PvP title kills */}
      <EnemyPlayerSpawner />

      {/* HP bars (level + random name + liquid-glass HP) above each rogue AI */}
      <RogueAIHPBarLayer />

      {/* Shop consumable effects — applies buffs/heals when items are used from the shop */}
      <ShopEffectsBridge />

      {/* Passive skill aura visual effects rendered over the player */}
      <PassiveSkillAuraEffects activeSkillIds={[...learnedSkillIds]} />

      {/* 3D angelic halo + wings above the player's head — scales with Halo level */}
      <PlayerHaloAura />

      {/* Slash visual effects — fires on basic attack and skill activations */}
      <SlashEffectLayer />

      {/* Wind streaks while sprinting (Shift-to-Run skill) */}
      <WindRunEffect />

      {/* Toast feedback when self-cast skills (Shield, Focus, Haste, etc.) activate */}
      <SkillActivationToastListener />

      {/* Combat music — fades world theme out, plays combat track during fights */}
      <CombatMusicTrigger />

      {/* Death flow — death animation → 5s tips overlay → respawn map */}
      <DeathFlowController />

      {/* Guild Wars 2-style clan overlay — opened by G key */}
      <ClanOverlay open={clanOverlayOpen} onClose={() => setClanOverlayOpen(false)} userId={user?.id} />

      {/* Map Builder button — opens the blank-canvas sandbox in a new tab */}
      <button
        onClick={() => navigate(createPageUrl('MapBuilder'))}
        className="absolute top-4 left-4 px-3 py-2 rounded-lg bg-slate-900/85 backdrop-blur-md border border-cyan-500/40 text-cyan-200 hover:text-white hover:bg-cyan-500/20 text-xs font-medium flex items-center gap-1.5 z-30 transition-colors shadow-lg"
        title="Open Map Builder sandbox"
      >
        <Hammer className="w-3.5 h-3.5" />
        Map Builder
      </button>

      {/* Pause menu — opened by ESC */}
      <PauseMenu
        open={pauseMenuOpen}
        onClose={() => setPauseMenuOpen(false)}
        volume={themeVolume}
        onVolumeChange={setThemeVolume}
      />
      </GameStateProvider>
    </div>
  );
}