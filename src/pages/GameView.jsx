import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import CharacterLoginScreen from '../components/game3d/CharacterLoginScreen';
import GameWorld3D from '../components/game3d/GameWorld3D';
import GameHUD from '../components/game3d/hud/GameHUD';
import StoreMenuOverlay from '../components/game3d/StoreMenuOverlay';
import CharacterProgressionMenu from '../components/game3d/CharacterProgressionMenu';
import BossWaypoint from '../components/game3d/hud/BossWaypoint';
import RogueBossHPTank from '../components/game3d/hud/RogueBossHPTank';
import MultiplayerSystem from '../components/game/MultiplayerSystem';
import GameWorldServerManager from '../components/game3d/GameWorldServerManager';
import WorldSyncMount from '../components/game3d/network/WorldSyncMount';
import AXEWorldStreamingMount from '../components/game3d/axe/world/AXEWorldStreamingMount';
import AXEFirstRegionMount from '../components/game3d/axe/world/AXEFirstRegionMount';
import AXEFirstSpawnMount from '../components/game3d/axe/characters/AXEFirstSpawnMount';
import AXETraversalSafetyMount from '../components/game3d/axe/player/AXETraversalSafetyMount';
import AXEInteractionMount from '../components/game3d/axe/interactions/AXEInteractionMount';
import AXECapitalBlockoutMount from '../components/game3d/axe/cities/AXECapitalBlockoutMount';
import AXEDungeonMount from '../components/game3d/axe/dungeons/AXEDungeonMount';
import AXEDungeonRuntime from '../components/game3d/axe/dungeons/AXEDungeonRuntime';
import AXEFactionWarRuntime from '../components/game3d/axe/factions/AXEFactionWarRuntime';
import AXEWeaponIdentityMount from '../components/game3d/axe/weapons/AXEWeaponIdentityMount';
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
import PlayerAngelWings from '../components/game3d/PlayerAngelWings';
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
import CinematicQuestDialogue from '../components/game3d/npc/CinematicQuestDialogue';
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
  const [requestedService, setRequestedService] = useState(null);
  const [requestedCharacterTab, setRequestedCharacterTab] = useState(null);
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

  // Theme audio (login "game 1" + world "game 2" exploration music) is disabled
  // by request — only combat music (combatMusicController, a separate track) is
  // kept. We still bind the (empty) world ref so the combat controller has a
  // stable handle; with .current === null its duck/resume calls are no-ops.
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.load();
      audioRef.current = null;
    }
    bindWorldAudio(audioRef, themeVolume);
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current.load();
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

  // Living Quest NPC interaction is now handled in-world by CinematicQuestDialogue
  // (mounted below), which listens for the same 'openLivingQuest' event.

  useEffect(() => {
    const onOpenHub = (event) => {
      setRequestedService(null);
      setRequestedCharacterTab(event?.detail?.tab || 'inventory');
      setProgressionOpen(true);
    };
    window.addEventListener('axeOpenCharacterHub', onOpenHub);
    return () => window.removeEventListener('axeOpenCharacterHub', onOpenHub);
  }, []);

  // NPC/global service requests route into the Services tab of the C Character
  // Hub. There is no second standalone Services overlay anymore.
  useEffect(() => {
    const onService = (event) => {
      setRequestedCharacterTab('services');
      setRequestedService(event?.detail?.service || 'reinforcement');
      setProgressionOpen(true);
    };
    window.addEventListener('axeServiceRequested', onService);
    return () => window.removeEventListener('axeServiceRequested', onService);
  }, []);

  // Live-update audio volume when slider changes (without reloading the track)
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = themeVolume;
    setWorldTargetVolume(themeVolume);
    localStorage.setItem('game_theme_volume', String(themeVolume));
  }, [themeVolume]);

  // Hotkeys while in-game:
  // TAB = store/build, C = unified Character Hub, V = Character Hub Services,
  // ESC = close the active overlay / pause.
  useEffect(() => {
    if (phase !== 'world') return;
    const onKey = (e) => {
      if (e.target?.matches?.('input, textarea')) return;
      if (e.key === 'Tab') {
        e.preventDefault();
        setStoreOpen((v) => !v);
      } else if (e.key.toLowerCase() === 'c') {
        setRequestedService(null);
        setRequestedCharacterTab(null);
        setProgressionOpen((v) => !v);
      } else if (e.key.toLowerCase() === 'v') {
        setRequestedCharacterTab('services');
        setRequestedService('reinforcement');
        setProgressionOpen(true);
      } else if (e.key.toLowerCase() === 'l') {
        setFriendsListOpen((v) => !v);
      } else if (e.key.toLowerCase() === 'g') {
        setClanOverlayOpen((v) => !v);
      } else if (e.key === 'Escape') {
        // Close any open sub-panels first; otherwise toggle pause menu.
        if (storeOpen) setStoreOpen(false);
        else if (progressionOpen) {
          setProgressionOpen(false);
          setRequestedService(null);
          setRequestedCharacterTab(null);
        }
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
      <button
        onClick={() => {
          setRequestedCharacterTab('services');
          setRequestedService('reinforcement');
          setProgressionOpen(true);
        }}
        className="absolute right-4 top-4 z-[135] rounded-xl border border-white/15 bg-neutral-800/55 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/80 backdrop-blur-xl hover:bg-white/10 hover:text-white"
        title="Open Services inside Character Hub (V)"
      >
        Services
      </button>
      {/* Hybrid host-authoritative simulation layer.
          Owns enemies / loot / pvp damage / player hp.
          GameWorld3D is becoming a renderer that reads from this. */}
      <GameStateProvider showDebugHUD={false}>
      <GameWorld3D />
      <GameHUD />
      <RogueBossHPTank />
      <BossWaypoint />
      <MultiplayerSystem envUrl="game_world_lowpoly" />
      <GameWorldServerManager />
      {/* Equipped weapon is the canonical source for mastery/class/role identity. */}
      <AXEWeaponIdentityMount />
      {/* Host-authoritative enemy/boss sync — elects one host per channel,
          broadcasts world snapshots, and applies them on non-hosts. */}
      <WorldSyncMount />
      {/* AXE Prompt 003 — logical region/POI/travel streaming follows the live player position. */}
      <AXEWorldStreamingMount />
      {/* AXE Prompt 004 — first 2.4 km macro-region blockout. */}
      <AXEFirstRegionMount />
      {/* AXE Prompt 005 — character first-spawn entry and tutorial handoff. */}
      <AXEFirstSpawnMount />
      {/* AXE Prompt 007 — fall safety, landing severity and world trigger volumes. */}
      <AXETraversalSafetyMount />
      {/* AXE Prompt 008 — reusable NPC/door/gate/teleport/service interactions. */}
      <AXEInteractionMount />
      {/* AXE Prompt 009 — defended faction capital blockout and districts. */}
      <AXECapitalBlockoutMount />
      {/* AXE Prompt 037 — cave/dungeon/SOS-access prototype entrances and session state. */}
      <AXEDungeonMount />
      <AXEDungeonRuntime />
      {/* AXE Prompt 039 — recurring faction-war objectives and invasion defenses. */}
      <AXEFactionWarRuntime />
      <StoreMenuOverlay isOpen={storeOpen} onClose={() => setStoreOpen(false)} />
      <CharacterProgressionMenu
        isOpen={progressionOpen}
        onClose={() => {
          setProgressionOpen(false);
          setRequestedService(null);
          setRequestedCharacterTab(null);
        }}
        requestedService={requestedService}
        initialTab={requestedCharacterTab}
        onServiceRequestConsumed={() => setRequestedService(null)}
      />
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

      {/* Hostile rogue-player AIs — kill them for gold, XP, loot, and PvP title kills */}
      <EnemyPlayerSpawner />

      {/* HP bars (level + random name + liquid-glass HP) above each rogue AI */}
      <RogueAIHPBarLayer />

      {/* Shop consumable effects — applies buffs/heals when items are used from the shop */}
      <ShopEffectsBridge />

      {/* Passive skill aura visual effects rendered over the player */}
      <PassiveSkillAuraEffects activeSkillIds={[...learnedSkillIds]} />

      {/* 3D angelic halo above the player's head — scales with Halo level */}
      <PlayerHaloAura />

      {/* 3D angel wings on the player's back — scales with equipped Wings level */}
      <PlayerAngelWings />

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

      {/* In-world cinematic dialogue → quest flow for the Living Quest NPC (Artemis) */}
      <CinematicQuestDialogue />

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