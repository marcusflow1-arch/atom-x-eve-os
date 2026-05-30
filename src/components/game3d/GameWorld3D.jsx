import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Loader2 } from 'lucide-react';
import EnemyHealthBar from './EnemyHealthBar';
import PlayerXPHUD from './PlayerXPHUD';
import QuestFloatingLabel from './QuestFloatingLabel';
import QuestDialogueBox from './QuestDialogueBox';
import FloatingDamageNumbers from './FloatingDamageNumbers';
import { setPlayerHUD, awardXP, subscribePlayerHUD, getPlayerHUD, setHP, tickRegen } from './playerHUDStore';
import { DEFAULT_PLAYER_STATS, ENEMY_STAT_TEMPLATES, computeDerivedStats, calculateHit, calculateHitWithCrit, applySpellScaling } from './statsSystem';
import { QUEST_NPCS, QUESTS, getAvailableQuestForNPC } from './questData';
import { acceptQuest, completeQuest, reportEnemyKill, subscribeQuests, getQuestState } from './useQuestStore';
import { playActionSound, startLoopSound, stopLoopSound } from './combatAudioStore';
import { setPlayerPosition } from './playerPositionStore';
import { CREATURE_MODEL_URL, CREATURE_ANIMATION_URLS } from './creatureAssets';
import { LOWPOLY_MAP_URL, createLowPolyLoadingManager } from './lowPolyMapAssets';
import { BOSSES, BOSS_SCALE_MULT, BOSS_HP_MULT, BOSS_XP_MULT } from './bossData';
import { setBosses, updateBoss } from './bossStore';
import { createBossBrain } from './boss/BossBrain';
import { attachBossEventBus } from './boss/useBossEventBus';
import { makeBossMinionSpawner } from './boss/spawnBossMinion';
import { castLegacyTargetedAbility } from './legacyTargetedAbilities';
import EquipmentMenu from './equipment/EquipmentMenu';
import CompanionMountHUD from './CompanionMountHUD';
import { getCompanionState, subscribeCompanion, setMounted, getEffectiveSpeedMultiplier } from './companionStore';
import { awardCompanionXP, getCompanionProgression, subscribeCompanionProgression } from './companionProgressionStore';
import CompanionHealthBar from './CompanionHealthBar';
import PlayerNameTag from './PlayerNameTag';
import { base44 } from '@/api/base44Client';
import { getCompanionById, createCompanionLoadingManager } from './companionData';
import { loadCompanionFolderClips } from './companionAnimationLoader';
import { getAbilityState, tickCooldowns as tickLegacyAbilityCooldowns, startCooldown as startLegacyAbilityCooldown, setTarget, clearTarget, updateTargetHP, ABILITY_DEFINITIONS } from './abilityStore';
import { getLoadout, startCooldown as startSkillCooldown, tickCooldowns as tickSkillCooldowns } from './skills/loadoutStore';
import { castSkill } from './skills/skillExecutor';
import { getPlayerHUD as getHUDForSkill } from './playerHUDStore';
import { createLightningStrike } from './LightningStrikeEffect';
import { createShadowTeleport } from './ShadowTeleportEffect';
import { createFrostTornado } from './FrostTornadoEffect';
import { tickCompanionCooldowns } from './companionAbilityStore';
import { processCompanionAbilityPress } from './companionAbilityHandler';
import { tickFusion } from './fusionStore';
import { handleCompanionKey } from './companionKeyHandler';
import { applyFusionEffects } from './applyFusionEffects';
import { tickCompanionAutoCombat, resetCompanionAutoCombat } from './companionAutoCombat';
import { createRemotePlayersManager } from './RemotePlayersManager';
import { createRemoteCompanionManager } from './RemoteCompanionManager';
import { CompanionAISystem } from './ai/CompanionAISystem';
import { EnemyAISystem } from './ai/EnemyAISystem';
import { CombatSystem } from './combat/CombatSystem';
import { AbilitySystem } from './skills/AbilitySystem';
import { ENEMY_SPAWNS } from './enemySpawnConfig';
import { broadcastEnemyKill } from './enemyRespawnManager';
import PlayerInteractionMenu from './PlayerInteractionMenu';
import { handleMiddleClick } from './middleClickHandler';
import VoiceMicIndicator from './VoiceMicIndicator';
import { useProximityVoiceController } from './useProximityVoiceController';
import { handleVoiceToggle, attachMicErrorListener } from './handleVoiceToggle';
import { useCallback } from 'react';
import { fireSlash } from './SlashEffect'; import { getRunMultiplier } from './runSkillStore';
import { tickBuffs, absorbShield, rollReflect, consumeDamageBuffMultiplier, getAttackSpeedMultiplier, consumePowerChargeMultiplier, rollDodgeBuff } from './skills/buffCompat';
import { getWeaponMoveSpeedMult, getWeaponDamageMult, rollLethalBlow, rollDodge, rollGuard, rollRangedEvade, getWeaponCritChanceBonusPct } from './weaponClassCombatHelpers';
import { getActiveWeaponPath } from './weaponClassBuffStore';
import { applyMasteryToHit, getMasteryAttackSpeedMult, getActiveWeaponId } from './progression/weaponMastery/WeaponScalingPipeline'; import { reportWeaponHit, reportWeaponKill } from './progression/weaponMastery/WeaponMasteryEngine';
import { recordTitleKill } from './progression/titleStore'; import { consumeShopDamageBuff, consumeShopCritBuff } from './shop/shopEffectsBridge'; import { addGold } from './shop/shopStore'; import { dispatchRogueAttack } from './rogueAttackBridge';

// GameWorld3D — constants & enemy tier table live in ./gameWorldConfig.js.
import {
  XP_TABLE, xpForLevel,
  ENEMY_TIERS, pickTier,
  ARCHER_URL, ANIMATION_URLS,
  DEATH_FADE_DELAY, WALK_SPEED, RUN_SPEED, ROT_SMOOTH, BLEND,
  NPC_SPAWNS,
  ENEMY_SPEED, ENEMY_WALK_TIME, ENEMY_IDLE_TIME, ENEMY_WANDER_RADIUS,
  NPC_INTERACT_RANGE, ENEMY_ATTACK_RANGE, RANGED_ATTACK_RANGE, ENEMY_ATTACK_COOLDOWN, ENEMY_ATTACK_WINDUP,
  PLAYER_ATTACK_COOLDOWN, PLAYER_INVUL_AFTER_HIT,
} from './gameWorldConfig';
import { attachContextGuard } from './webglContextGuard';
import { buildGrassEnvironment } from './buildGrassEnvironment';
import { loadPlayerAnimationClips } from './player/playerAnimationLibrary';
import { createLunaDashboardPlayerController as createPlayerAnimationController } from './player/LunaDashboardPlayerController';
import { CorePlayerStateMachine } from './player/CorePlayerStateMachine';
import { CoreAnimationController } from './player/CoreAnimationController';
import { PlayerCameraSystem } from './player/PlayerCameraSystem';
import { loadDeepSpaceSkybox } from './worldSkybox';
import { createPlayerCastLightBeam } from './vfx/playerCastLightBeam';

export default function GameWorld3D() {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [activeDialogue, setActiveDialogue] = useState(null); // { name, text }
  const [nearbyNPC, setNearbyNPC] = useState(null);
  const [enemyCount, setEnemyCount] = useState(ENEMY_SPAWNS.length);
  const [score, setScore] = useState(0);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerXP, setPlayerXP] = useState(0);
  const [enemiesUI, setEnemiesUI] = useState([]); // [{ id, x, y, hp, maxHp, level, visible }]
  const [questNPCsUI, setQuestNPCsUI] = useState([]); // [{ id, x, y, status }]
  const [nearbyQuestNPC, setNearbyQuestNPC] = useState(null); // { id, name }
  const [activeQuestDialogue, setActiveQuestDialogue] = useState(null); // { npcName, quest, mode, progress }
  const [questState, setQuestState] = useState(getQuestState());
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [playerMenu, setPlayerMenu] = useState(null); const remoteManagerRef = useRef(null);
  const [localMicOn, setLocalMicOn] = useState(false);
  const [talkingPeers, setTalkingPeers] = useState({});
  const [remoteMicUI, setRemoteMicUI] = useState([]);
  const { voiceRef } = useProximityVoiceController({
    remoteManagerRef,
    onTalkingChange: (peerId, talking) => setTalkingPeers((prev) => {
      if (!!prev[peerId] === talking) return prev;
      const next = { ...prev }; if (talking) next[peerId] = true; else delete next[peerId]; return next;
    }),
  });
  const [nearbyCompanion, setNearbyCompanion] = useState(false);
  const nearbyCompanionRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);
  // Companion live HP bar (projected to screen each frame)
  const [companionUI, setCompanionUI] = useState(null); // { x, y, hp, maxHp, level }
  // Player name tag floating above the player's head
  const [playerName, setPlayerName] = useState('');
  const [playerNameUI, setPlayerNameUI] = useState(null); // { x, y }
  // Companion live combat stats (HP, derived, level) — updated when stats are allocated
  const companionStatsRef = useRef(null);
  const companionRegenAccumRef = useRef(0);
  const companionGroupRef = useRef(null);
  const companionMixerRef = useRef(null);
  const companionWalkActionRef = useRef(null);
  const companionIdleActionRef = useRef(null);
  const companionRunActionRef = useRef(null);
  const companionCurrentAnimRef = useRef('idle');
  const mountToggleRef = useRef(false);
  const isMountedRef = useRef(false);
  const companionDefRef = useRef(getCompanionById(getCompanionState().activeCompanionId));
  // Floating damage/XP numbers — projected to screen each frame.
  const floatsRef = useRef([]);
  const [floats, setFloats] = useState([]);
  const floatIdRef = useRef(0);
  // Per-enemy damage merging — replaces same-enemy value within window
  const MERGE_WINDOW_MS = 350;
  const spawnDamageFloat = (enemyId, value) => {
    const nowMs = performance.now();
    const existing = floatsRef.current.find(
      (f) => f.enemyId === enemyId && f.type === 'damage' && nowMs - f.born < MERGE_WINDOW_MS,
    );
    if (existing) {
      existing.value = value;
      existing.born = nowMs;
    } else {
      floatsRef.current.push({
        id: ++floatIdRef.current,
        enemyId,
        value,
        type: 'damage',
        born: nowMs,
      });
    }
  };
  const spawnXPFloat = (value) => {
    floatsRef.current.push({ id: ++floatIdRef.current, enemyId: 'player', value, type: 'xp', born: performance.now() });
  };
  const playerLevelRef = useRef(1);
  const playerXPRef = useRef(0);
  // Player stats: base + gear → derived combat values
  const playerBaseStatsRef = useRef({ ...DEFAULT_PLAYER_STATS });
  const playerEquipmentRef = useRef([]);
  const playerDerivedRef = useRef(
    computeDerivedStats(DEFAULT_PLAYER_STATS, [])
  );
  const keys = useRef({});
  const drag = useRef({ active: false, x: 0, y: 0 });
  const abilityKeyPressed = useRef(-1); // slot index pressed this frame (-1 = none)
  const companionAbilityPressed = useRef(null); const skillStrikeMultRef = useRef(1.0); // skill strike multiplier (e.g. Shield Slash 80%)
  const activeEffects = useRef([]); // { alive: fn, update: fn }
  const orbit = useRef({ yaw: 0, pitch: 0.4, distance: 4.5 });
  const nearbyNPCRef = useRef(null);
  const interactPressed = useRef(false);
  const attackPressed = useRef(false);
  const rangedClickAttackPressed = useRef(false);
  const oneShotPlaying = useRef(false);
  const lockOnTargetRef = useRef(null);
  const playerAttackCooldown = useRef(0);
  const playerInvulTimer = useRef(0);
  const nearbyQuestNPCRef = useRef(null);
  const playerLevelStateRef = useRef(1); // kept in sync with playerLevel for quest gating

  // Hydrate persistent progression (level, XP, stats, HP) from localStorage.
  useEffect(() => {
    const saved = getPlayerHUD();
    playerLevelRef.current = saved.level || 1;
    playerXPRef.current = saved.xp || 0;
    playerBaseStatsRef.current = { ...saved.baseStats };
    playerDerivedRef.current = saved.derived || computeDerivedStats(saved.baseStats, []);
    setPlayerLevel(saved.level || 1);
    setPlayerXP(saved.xp || 0);
    // Refresh xpForNext to match the loaded level's curve
    setPlayerHUD({ xpForNext: xpForLevel(saved.level || 1) });
  }, []);

  // Quest store subscription
  useEffect(() => subscribeQuests((s) => setQuestState({ ...s })), []);
  // Toast when mic permission is denied
  useEffect(() => attachMicErrorListener(), []);
  // Fetch the logged-in user's display name — shown above the player's head + portrait box
  useEffect(() => {
    base44.auth.me().then((u) => { if (u) setPlayerName(u.username || u.full_name || u.email?.split('@')[0] || 'Player'); }).catch(() => setPlayerName('Player'));
  }, []);

  // Keep companion def ref in sync when player picks a different companion in the menu
  useEffect(() => {
    return subscribeCompanion((s) => {
      companionDefRef.current = getCompanionById(s.activeCompanionId);
    });
  }, []);

  // Live companion combat stats — recomputed when player allocates Skill Tree points.
  // Result is consumed by the HP-bar UI and (later) any companion attack/ability code.
  useEffect(() => {
    return subscribeCompanionProgression(() => {
      const def = companionDefRef.current;
      if (!def) return;
      const prog = getCompanionProgression(def.id);
      const derived = computeDerivedStats(prog.baseStats, []);
      const prev = companionStatsRef.current;
      const hp = prev ? Math.min(derived.maxHP, prev.hp + Math.max(0, derived.maxHP - prev.maxHp)) : derived.maxHP;
      companionStatsRef.current = { hp, maxHp: derived.maxHP, level: prog.level, derived };
    });
  }, []);

  // Keep a ref of the latest player level for the animation loop to read
  useEffect(() => {
    playerLevelStateRef.current = playerLevel;
  }, [playerLevel]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Scene — deep-space world skybox + retained terrain fog depth.
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x080b18, 90, 260);
    scene.background = new THREE.Color(0x050711);

    // Renderer — keep it simple and proven. Create a canvas explicitly so we
    // can attach the WebGL context-loss listener BEFORE THREE allocates the
    // context, and we can detect a failed context immediately.
    const canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    } catch (e) {
      console.error('GameWorld3D: WebGL unavailable —', e);
      setLoading(false);
      canvas.remove();
      const msg = document.createElement('div');
      msg.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-family:sans-serif;background:#0f1419;text-align:center;padding:24px;';
      msg.innerHTML = '<div><div style="font-size:18px;font-weight:600;margin-bottom:8px">3D world unavailable</div><div style="opacity:0.6;font-size:14px">Your browser couldn\'t allocate a WebGL context. Close other tabs and reload.</div></div>';
      container.appendChild(msg);
      return;
    }

    // Width/height may be 0 on first paint inside hidden tabs — guard against that.
    const w0 = container.clientWidth || window.innerWidth;
    const h0 = container.clientHeight || window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w0, h0, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    // Guard against WebGL context loss + post-dispose render calls — without
    // this, three.js shadow-map pass crashes inside getUniforms() with
    // "Cannot read properties of null (reading 'trim')".
    const rendererGuard = attachContextGuard(renderer);

    // Camera
    const camera = new THREE.PerspectiveCamera(55, (w0 || 1) / (h0 || 1), 0.1, 200);
    camera.position.set(0, 3, -5);

    remoteManagerRef.current = createRemotePlayersManager(scene);
    const remoteCompanionManager = createRemoteCompanionManager(scene);

    // Slice C — expose scene + camera + legacy remote manager on window so the
    // network-remotes pipeline (mounted as a sibling) can attach without code
    // changes inside this giant useEffect. Cleared on unmount below.
    window.__gw3dScene = scene;
    window.__gw3dCamera = camera;
    window.__gw3dLegacyRemoteManager = remoteManagerRef.current;
    scene.add(new THREE.HemisphereLight(0xcfe4ff, 0x4a3a2a, 1.0));
    const sun = new THREE.DirectionalLight(0xfff4d6, 2.2);
    sun.position.set(20, 30, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    scene.add(sun);

    const worldGltfLoader = new GLTFLoader();
    const disposeSkybox = loadDeepSpaceSkybox({ scene, gltfLoader: worldGltfLoader });

    // (Ocean backdrop removed — replaced by simple flat green grass ground below.)

    // LOW-POLY ENVIRONMENT MAP — bundle URLs from admin AssetFile manifest. groundMeshes used for raycast snapping.
    const groundMeshes = [];           // meshes used for terrain raycasts
    const groundRaycaster = new THREE.Raycaster();
    const downVec = new THREE.Vector3(0, -1, 0);
    /** Returns terrain Y at (x,z), or null if no hit. */
    const sampleGroundY = (x, z) => {
      if (groundMeshes.length === 0) return null;
      groundRaycaster.set(new THREE.Vector3(x, 50, z), downVec);
      const hits = groundRaycaster.intersectObjects(groundMeshes, true);
      return hits.length > 0 ? hits[0].point.y : null;
    };

    let mapReady = false;
    const pendingFootings = []; // entities waiting to be snapped to ground once map loads

    // Rolling green grass environment — textured ground + decorative tufts/bushes.
    // Instant ready, no external assets.
    const grassGround = buildGrassEnvironment(scene);
    groundMeshes.push(grassGround);
    mapReady = true;
    // Flush any spawn snapping that queued before this point (none in practice
    // since this runs synchronously, but kept for safety).
    pendingFootings.forEach((fn) => fn());
    pendingFootings.length = 0;

    // Helper: stand an object on the terrain at (x,z). If map isn't ready yet,
    // queue the snap for after the FBX finishes loading.
    const snapToGround = (obj3d, footOffset = 0) => {
      const apply = () => {
        const y = sampleGroundY(obj3d.position.x, obj3d.position.z);
        if (y !== null) obj3d.position.y = y + footOffset;
      };
      if (mapReady) apply();
      else pendingFootings.push(apply);
    };

    // Generic capsule NPCs removed; only real quest NPC assets remain.
    const npcs = [];

    // Shared FBX loader (used for player + enemies + quest NPCs)
    const loader = new FBXLoader();
    const clock = new THREE.Clock();
    const playerModelRef = { current: null };

    // Quest-NPC idle clip — uses the ARCHER idle (player-style anim set), not the
    // mutant idle that enemies use. Quest NPCs must ONLY play this idle.
    const questNPCIdleClipPromise = new Promise((resolve) => {
      loader.load(
        ANIMATION_URLS.idle,
        (animFbx) => resolve(animFbx.animations?.[0] || null),
        undefined,
        () => resolve(null),
      );
    });

    // Quest NPC — cloned archer model, spawned right next to the player.
    const questNPCs = []; // populated after ARCHER_URL loads below

        // COMPANION SPAWN — rideable mount (GLB w/ embedded clips OR FBX w/ separate idle+walk anim files).
    const companionDef = companionDefRef.current;
    if (companionDef) {
      const setupCompanion = (companionModel, embeddedClips = []) => {
        const box = new THREE.Box3().setFromObject(companionModel);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const compScale = (1.7 / maxDim) * (companionDef.scale || 1.0);
        companionModel.scale.setScalar(compScale);
        companionModel.position.set(
          companionDef.spawnPos[0],
          companionDef.spawnPos[1],
          companionDef.spawnPos[2],
        );

        companionModel.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = !node.isSkinnedMesh;
            node.receiveShadow = true;
          }
        });

        // Golden friendly ring under the companion
        const ringGeo = new THREE.RingGeometry(0.8 / compScale, 1.05 / compScale, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xfbbf24,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.55,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.02 / compScale;
        companionModel.add(ring);

        scene.add(companionModel);
        snapToGround(companionModel, 0);

        const compMixer = new THREE.AnimationMixer(companionModel);
        companionGroupRef.current = companionModel;
        companionMixerRef.current = compMixer;

        // Helper: bind idle + walk clips onto this companion's mixer.
        // Used both for embedded-clip and external-clip flows.
        const bindCompanionClips = (clips) => {
          const findClip = (substr) => {
            if (!substr || !clips.length) return null;
            const lc = substr.toLowerCase();
            return clips.find((c) => (c.name || '').toLowerCase().includes(lc)) || null;
          };
          const idleClip = findClip(companionDef.idleClipName) || clips[0];
          const walkClip = findClip(companionDef.walkClipName) || clips[1] || clips[0];
          const runClip  = findClip(companionDef.runClipName)  || clips[2] || null;
          if (idleClip) {
            const idle = compMixer.clipAction(idleClip);
            companionIdleActionRef.current = idle;
            idle.reset().fadeIn(0.2).play();
          }
          if (walkClip && walkClip !== idleClip) {
            const walk = compMixer.clipAction(walkClip);
            walk.setEffectiveTimeScale(1.0);
            companionWalkActionRef.current = walk;
          }
          if (runClip && runClip !== idleClip && runClip !== walkClip) {
            const run = compMixer.clipAction(runClip);
            run.setEffectiveTimeScale(1.0);
            companionRunActionRef.current = run;
          }
        };

        if (companionDef.modelFormat === 'glb' && embeddedClips.length > 0) {
          bindCompanionClips(embeddedClips);
        } else if (companionDef.modelFormat === 'glb') {
          // Mesh-only GLB — source idle / walk clips from the admin AnimationFBX
          // library (folder = "companion"). See companionAnimationLoader.js.
          loadCompanionFolderClips(loader)
            .then((clips) => bindCompanionClips(clips))
            .catch((err) => console.error('Companion AnimationFBX load error:', err));
        } else {
          // FBX format — load idle + walk anim files separately via FBXLoader
          loader.load(companionDef.idleAnim, (af) => {
            if (af.animations?.[0]) {
              const idle = compMixer.clipAction(af.animations[0]);
              companionIdleActionRef.current = idle;
              idle.reset().fadeIn(0.2).play();
            }
          });
          loader.load(companionDef.walkAnim, (af) => {
            if (af.animations?.[0]) {
              const walk = compMixer.clipAction(af.animations[0]);
              walk.setEffectiveTimeScale(0.7);
              companionWalkActionRef.current = walk;
            }
          });
        }
      };

      if (companionDef.modelFormat === 'glb') {
        // For glTF bundles (separate .bin + textures), wire a LoadingManager
        // whose URLModifier maps relative paths to absolute Base44 URLs.
        const compManager = createCompanionLoadingManager(THREE, companionDef);
        const gltfLoader = compManager ? new GLTFLoader(compManager) : new GLTFLoader();
        gltfLoader.load(
          companionDef.modelUrl,
          (gltf) => {
            const root = gltf.scene || gltf.scenes?.[0];
            if (root) setupCompanion(root, gltf.animations || []);
          },
          undefined,
          (err) => console.error('Companion GLB load error:', err),
        );
      } else {
        loader.load(companionDef.modelUrl, (fbx) => setupCompanion(fbx, []));
      }
    }

    // Enemy spawns — mutant model patrolling between waypoints
    const enemies = [];
    // Remote kill listener: peer killed an enemy → kill it here too.
    const handleRemoteAction = (e) => {
      const d = e.detail; if (!d || d.kind !== 'enemy_killed') return;
      const t = enemies.find((en) => en.id === d.enemy_id && en.alive && !en.dying);
      if (!t) return;
      t.respawnAt = performance.now() + 10000; t.dying = true; t.deathTimer = 0; t.hp = 0;
      if (t.walkAction) t.walkAction.fadeOut(0.15);
      if (t.idleAction) t.idleAction.fadeOut(0.15);
      if (cachedDeathClip && t.mixer) { const da = t.mixer.clipAction(cachedDeathClip); da.setLoop(THREE.LoopOnce); da.clampWhenFinished = true; da.reset().fadeIn(0.15).play(); }
      setEnemyCount(enemies.filter((en) => en.alive && !en.dying).length);
    };
    window.addEventListener('webrtcRemoteAction', handleRemoteAction);
    const handlePlayerSkillStrike = (e) => { const { multiplier = 1.0, hits = 1 } = e.detail || {}; for (let i = 0; i < hits; i++) setTimeout(() => { skillStrikeMultRef.current = multiplier; attackPressed.current = true; }, i * 180); };
    const handlePlayerSkillCastStart = (e) => {
      const duration = e.detail?.duration || 0.45;
      activeEffects.current.push(createPlayerCastLightBeam({
        scene,
        loader: worldGltfLoader,
        playerRef: modelRef,
        getGroundY: (x, z) => sampleGroundY?.(x, z) ?? 0,
        duration,
      }));
    };
    window.addEventListener('playerSkillStrike', handlePlayerSkillStrike);
    window.addEventListener('playerSkillCastStart', handlePlayerSkillCastStart);

    // Boss entities — declared early so the bus + minion spawner can close over it.
    const bossEntities = [];
    // Expose live arrays for world-sync layer (after both are declared).
    window.__gw3dEnemies = enemies; window.__gw3dBosses = bossEntities;
    window.dispatchEvent(new CustomEvent('gw3dSceneReady'));

    // Boss event bus — applies bossAction events (AOE / cone / orb / dash / summon)
    // dispatched by BossBrain. Decouples boss AI from world mutation (multiplayer seam).
    // modelRef is a plain object the bus reads lazily; we assign .current when the
    // player FBX finishes loading (see archer load below). This avoids any
    // temporal-dead-zone trap with `let model` declared further down.
    let _spawnBossMinion = () => {};
    const modelRef = { current: null };
    const applyLocalBossDamage = (amount) => {
      if (playerInvulTimer.current > 0 || rollDodge() || rollGuard() || rollRangedEvade() || rollDodgeBuff()) return;
      let dmg = amount;
      const absorbed = absorbShield(dmg);
      dmg = Math.max(0, dmg - absorbed);
      if (dmg <= 0) return;
      setHP(Math.max(0, getPlayerHUD().hp - dmg));
      spawnDamageFloat('player', dmg);
      playerInvulTimer.current = Math.max(playerInvulTimer.current, 0.1);
    };

    const detachBossBus = attachBossEventBus({
      scene, getPlayerHUD, setHP, spawnDamageFloat,
      activeEffectsRef: activeEffects,
      sampleGroundY,
      modelRef,
      gltfLoader: worldGltfLoader,
      applyLocalBossDamage,
      getBossById: (id) => bossEntities.find((b) => b.id === id),
      spawnBossMinion: (bid, p) => _spawnBossMinion(bid, p),
    });

    // Pre-load enemy creature clips once (shared across all enemies).
    // These come from the "creature" folder in admin → AnimationFBX manager
    // (Survivor A Lusth model + mutant animation set).
    const walkClipPromise = new Promise((resolve) => {
      loader.load(CREATURE_ANIMATION_URLS.walk, (animFbx) => resolve(animFbx.animations?.[0] || null), undefined, () => resolve(null));
    });
    const idleClipPromise = new Promise((resolve) => {
      loader.load(CREATURE_ANIMATION_URLS.idle, (animFbx) => resolve(animFbx.animations?.[0] || null), undefined, () => resolve(null));
    });
    const deathClipPromise = new Promise((resolve) => {
      loader.load(CREATURE_ANIMATION_URLS.death, (animFbx) => resolve(animFbx.animations?.[0] || null), undefined, () => resolve(null));
    });
    // Use the mutant "punch" animation for attacks (different from the default
    // "swiping" attack so the player sees variety in enemy strikes).
    const attackClipPromise = new Promise((resolve) => {
      loader.load(CREATURE_ANIMATION_URLS.punch, (animFbx) => resolve(animFbx.animations?.[0] || null), undefined, () => resolve(null));
    });
    // Cache the death + attack clips once they load so we can reuse them per-enemy
    let cachedDeathClip = null;
    let cachedAttackClip = null;
    deathClipPromise.then((clip) => { cachedDeathClip = clip; });
    attackClipPromise.then((clip) => { cachedAttackClip = clip; });

    // Boss minion spawner — wired now that loader + clip promises exist.
    _spawnBossMinion = makeBossMinionSpawner({
      scene, loader, enemies, bossEntities, snapToGround,
      walkClipPromise, idleClipPromise, setEnemyCount,
    });

    // Helper: pick a random wander point inside the enemy's zone
    const pickWanderTarget = (enemy) => {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * ENEMY_WANDER_RADIUS;
      const tx = enemy.group.position.x + Math.cos(angle) * dist;
      const tz = enemy.group.position.z + Math.sin(angle) * dist;
      // Clamp to zone bounds
      const dx = tx - enemy.zoneCenter[0];
      const dz = tz - enemy.zoneCenter[2];
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d > enemy.zoneRadius) {
        const k = enemy.zoneRadius / d;
        enemy.target = new THREE.Vector3(
          enemy.zoneCenter[0] + dx * k,
          enemy.group.position.y,
          enemy.zoneCenter[2] + dz * k,
        );
      } else {
        enemy.target = new THREE.Vector3(tx, enemy.group.position.y, tz);
      }
    };

    // World boss spawning is currently disabled; boss brain support remains available for active boss entities.

    ENEMY_SPAWNS.forEach((spawn) => {
      loader.load(CREATURE_MODEL_URL, (fbx) => {
        const enemyModel = fbx;
        // DETERMINISTIC tier + level — uses the seeded tierRoll from spawn config
        // so every client picks the same tier for the same enemy id.
        const tier = pickTier(spawn.tierRoll);
        const enemyLevel = tier.level + (spawn.tierRoll > 0.5 ? 1 : 0);
        // Derive enemy combat stats from the shared stat system
        const enemyBaseStats = ENEMY_STAT_TEMPLATES[tier.name];
        const enemyDerived = computeDerivedStats(enemyBaseStats, []);
        const box = new THREE.Box3().setFromObject(fbx);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = (1.7 / maxDim) * tier.scale;
        enemyModel.scale.setScalar(scale);
        enemyModel.position.set(spawn.home[0], spawn.home[1], spawn.home[2]);

        // Keep the enemy's natural model color — no red tint, no emissive glow.
        // tintMaterials is still tracked so the death-fade can adjust opacity.
        const tintMaterials = [];
        enemyModel.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = !node.isSkinnedMesh;
            node.receiveShadow = true;
            if (node.material) {
              const mats = Array.isArray(node.material) ? node.material : [node.material];
              mats.forEach((m) => tintMaterials.push(m));
            }
          }
        });

        // Hostile red ground ring
        const ringGeo = new THREE.RingGeometry(0.7 / scale, 0.9 / scale, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xff3030, side: THREE.DoubleSide, transparent: true, opacity: 0.55 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.02 / scale;
        enemyModel.add(ring);

        scene.add(enemyModel);
        // Stand enemy feet on the terrain at its spawn point
        snapToGround(enemyModel, 0);

        const enemyMixer = new THREE.AnimationMixer(enemyModel);
        // Randomize initial state + timer so the herd isn't synced
        const startsWalking = Math.random() < 0.5;
        const enemyEntry = {
          id: spawn.id,
          group: enemyModel,
          mixer: enemyMixer,
          walkAction: null,
          idleAction: null,
          state: startsWalking ? 'walk' : 'idle',
          stateTimer: Math.random() * (startsWalking ? ENEMY_WALK_TIME : ENEMY_IDLE_TIME),
          target: null,
          alive: true,
          hitCooldown: 0,
          tintMaterials,
          zoneCenter: spawn.zoneCenter,
          zoneRadius: spawn.zoneRadius,
          home: spawn.home, // remembered for respawn
          respawnAt: null,  // set when killed; checked each frame
          tier: tier.name,
          level: enemyLevel,
          hp: enemyDerived.maxHP,
          maxHp: enemyDerived.maxHP,
          derived: enemyDerived,
          xpReward: tier.xp,
          attackCooldown: Math.random() * 1.5, // stagger initial attacks
          attacking: false,
          attackWindupTimer: 0,
          // Phase 5 desync fix — per-enemy randomized think/move/idle timing.
          thinkInterval: 0.2 + Math.random() * 1.2,
          thinkTimer: Math.random() * 0.9,
          speedJitter: 0.85 + Math.random() * 0.3,
          idleVariance: 0.7 + Math.random() * 0.8,
          walkVariance: 0.7 + Math.random() * 0.8,
        };
        enemies.push(enemyEntry);
        if (startsWalking) pickWanderTarget(enemyEntry);

        // Attach animations when ready
        Promise.all([walkClipPromise, idleClipPromise]).then(([walkClip, idleClip]) => {
          if (walkClip) {
            const wa = enemyMixer.clipAction(walkClip);
            wa.setEffectiveTimeScale(0.55); // slow it down → walk, not sprint
            enemyEntry.walkAction = wa;
          }
          if (idleClip) {
            enemyEntry.idleAction = enemyMixer.clipAction(idleClip);
          }
          // Play whichever matches initial state
          const initial = enemyEntry.state === 'walk' ? enemyEntry.walkAction : enemyEntry.idleAction;
          if (initial) initial.reset().fadeIn(0.2).play();
        });
      });
    });

    // Load the player model + admin-managed player animation library
    let mixer;
    let model;
    let playerAnim;
    const playerStateMachine = new CorePlayerStateMachine();
    let coreAnimationController = null;
    const playerCameraSystem = new PlayerCameraSystem({ camera, orbit, modelRef, lockOnTargetRef });
    const dodgeVanish = { active: false, timer: 0, duration: 0.45 };
    const crouchTogglePressed = { current: false };
    const lastDirectionTap = { current: {} };
    const DOUBLE_TAP_MS = 280;

    loader.load(ARCHER_URL, (fbx) => {
      model = fbx;
      modelRef.current = fbx;
      playerModelRef.current = fbx;
      const box = new THREE.Box3().setFromObject(fbx);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 1.7 / maxDim;
      fbx.scale.setScalar(scale);
      window.__gw3dPlayerHeight = size.y * scale;
      fbx.position.set(0, 0.3, 0);

      fbx.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = !node.isSkinnedMesh;
          node.receiveShadow = true;
        }
      });

      scene.add(fbx);
      // Snap the player's feet to the terrain at spawn
      snapToGround(fbx, 0);
      mixer = new THREE.AnimationMixer(fbx);
      playerAnim = createPlayerAnimationController({ mixer, blend: BLEND, oneShotRef: oneShotPlaying });
      coreAnimationController = new CoreAnimationController({ legacyController: playerAnim });

      // ─── Quest NPC: load a SECOND copy of the same archer model ───
      // We load it fresh (not a Three.js clone) so it gets its own independent
      // skeleton, mixer and animation state — no shared-rig conflicts.
      loader.load(ARCHER_URL, (npcFbx) => {
        const npcBox = new THREE.Box3().setFromObject(npcFbx);
        const npcSize = npcBox.getSize(new THREE.Vector3());
        const npcMaxDim = Math.max(npcSize.x, npcSize.y, npcSize.z);
        const npcScale = 1.7 / npcMaxDim;
        npcFbx.scale.setScalar(npcScale);
        // Place 4 units to the right of player spawn so you see them immediately
        npcFbx.position.set(4, 0, 0);
        // Face the player (toward -X)
        npcFbx.rotation.y = -Math.PI / 2;

        npcFbx.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = !node.isSkinnedMesh;
            node.receiveShadow = true;
          }
        });

        // Golden quest ring under feet
        const npcRingGeo = new THREE.RingGeometry(0.7 / npcScale, 0.95 / npcScale, 32);
        const npcRingMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
        const npcRing = new THREE.Mesh(npcRingGeo, npcRingMat);
        npcRing.rotation.x = -Math.PI / 2;
        npcRing.position.y = 0.02 / npcScale;
        npcFbx.add(npcRing);

        scene.add(npcFbx);
        snapToGround(npcFbx, 0);

        const npcMixer = new THREE.AnimationMixer(npcFbx);

        // Bind the idle animation using the same player animation library
        loadPlayerAnimationClips(loader).then((clipsByKey) => {
          const idleClip = clipsByKey['idle'];
          if (idleClip) {
            const idleAction = npcMixer.clipAction(idleClip);
            idleAction.reset().fadeIn(0.2).play();
          }
          questNPCs.push({
            id: 'npc_quest_stranger',
            name: 'The Stranger',
            group: npcFbx,
            mixer: npcMixer,
            idleAction: idleClip ? npcMixer.clipAction(idleClip) : null,
            ringMesh: npcRing,
          });
        }).catch(() => {
          // Push even without animation so proximity/interaction still works
          questNPCs.push({ id: 'npc_quest_stranger', name: 'The Stranger', group: npcFbx, mixer: npcMixer, idleAction: null, ringMesh: npcRing });
        });
      });

      // Load player animation clips and bind them to the player mixer
      loadPlayerAnimationClips(loader)
        .then((clipsByKey) => {
          playerAnim.bindClips(clipsByKey);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Player AnimationFBX library load error:', err);
          setLoading(false);
        });
    }, undefined, (err) => {
      console.error('Archer load error:', err);
      setLoading(false);
    });

    // Controls
    const playOneShot = (name, timeScale = 1) => {
      if (!model || !playerAnim) return;
      playerAnim.playOneShot(name, timeScale);
    };

    const getLockOnTargetPosition = () => {
      const target = lockOnTargetRef.current;
      if (!target?.group || (target.aliveRef && !target.aliveRef())) return null;
      return target.group.position;
    };

    const getCombatAxes = () => {
      const target = getLockOnTargetPosition();
      if (!target || !model) return null;
      const forward = new THREE.Vector3(target.x - model.position.x, 0, target.z - model.position.z);
      if (forward.lengthSq() <= 0.0001) return null;
      forward.normalize();
      const cameraForward = new THREE.Vector3();
      camera.getWorldDirection(cameraForward);
      cameraForward.y = 0;
      if (cameraForward.lengthSq() <= 0.0001) cameraForward.copy(forward);
      cameraForward.normalize();
      const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      cameraRight.y = 0;
      if (cameraRight.lengthSq() <= 0.0001) cameraRight.set(forward.z, 0, -forward.x);
      cameraRight.normalize();
      return { forward, right: cameraRight, cameraForward, cameraRight };
    };

    const getDodgeVectorAndName = (key) => {
      const axes = getCombatAxes();
      const yaw = orbit.current.yaw;
      const freeMap = {
        w: { direction: 'forward',  vector: new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)) },
        s: { direction: 'backward', vector: new THREE.Vector3( Math.sin(yaw), 0,  Math.cos(yaw)) },
        a: { direction: 'left',     vector: new THREE.Vector3(-Math.cos(yaw), 0, -Math.sin(yaw)) }, // fixed A=left
        d: { direction: 'right',    vector: new THREE.Vector3( Math.cos(yaw), 0,  Math.sin(yaw)) }, // fixed D=right
      };
      if (!axes) return freeMap[key] || { direction: 'forward', vector: new THREE.Vector3(0, 0, -1).applyQuaternion(model.quaternion) };
      if (keys.current['a']) return { direction: 'left', vector: axes.cameraRight.clone().multiplyScalar(-1) };
      if (keys.current['d']) return { direction: 'right', vector: axes.cameraRight.clone() };
      if (keys.current['s']) return { direction: 'backward', vector: axes.forward.clone().multiplyScalar(-1) };
      if (keys.current['w']) return { direction: 'forward', vector: axes.forward.clone() };
      return { direction: 'backward', vector: axes.forward.clone().multiplyScalar(-1) };
    };

    const updateLockOnRotation = (delta) => {
      const target = getLockOnTargetPosition();
      if (!target || !model || playerAnim?.isMovementOverridden?.()) return;
      const dir = new THREE.Vector3(target.x - model.position.x, 0, target.z - model.position.z);
      if (dir.lengthSq() <= 0.0001) return;
      dir.normalize();
      const targetYaw = Math.atan2(dir.x, dir.z);
      const targetQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetYaw);
      model.quaternion.slerp(targetQuat, 1 - Math.exp(-14 * delta));
    };

    const startDodgeVanish = (direction) => {
      if (!model) return;
      dodgeVanish.active = true;
      dodgeVanish.timer = 0;
      model.visible = false;
    };

    const onKeyDown = (e) => {
      if (e.target?.matches?.('input, textarea')) return;
      const k = e.key.toLowerCase();
      keys.current[k] = true;
      const dodgeKeys = new Set(['w', 'a', 's', 'd']);
      if (!e.repeat && dodgeKeys.has(k)) {
        const nowMs = performance.now();
        if (nowMs - (lastDirectionTap.current[k] || 0) <= DOUBLE_TAP_MS) {
          const dodge = getDodgeVectorAndName(k);
          if (playerStateMachine.startCombat('dodge', { lock: 0.45, cancel: 0.18 }) && playerAnim?.requestDodge?.(dodge.vector, dodge.direction)) {
            window.dispatchEvent(new CustomEvent('playerSkillCastCancel'));
            startDodgeVanish(dodge.direction);
            playActionSound('player_jump');
          }
          lastDirectionTap.current[k] = 0;
          e.preventDefault();
          return;
        }
        lastDirectionTap.current[k] = nowMs;
      }
      // Space = Jump
      if (k === ' ') {
        if (playerAnim?.requestJump()) playActionSound('player_jump');
        e.preventDefault();
      }
      // C = toggle crouch once per press
      if (k === 'c' && !crouchTogglePressed.current) {
        crouchTogglePressed.current = true;
        playerAnim?.requestCrouch(!playerAnim.getIsCrouching());
      }
      // E = interact, F = Kick
      if (k === 'e') interactPressed.current = true;
      if (k === 'f') {
        if (playerAnim?.requestAttack('kick', 1.0)) setTimeout(() => { attackPressed.current = true; }, 260);
        e.preventDefault();
      }
      // Ability keys: 1..8 → slots 0..7
      if (k >= '1' && k <= '8') { abilityKeyPressed.current = parseInt(k, 10) - 1; }
      if (k === 'i') { setEquipmentOpen((v) => !v); e.preventDefault(); }
      // Z/X/V/B = companion abilities or Deity Fusion (resolved via loadout).
      handleCompanionKey(k, companionAbilityPressed);
      if (e.code === 'Backquote' || k === '`') {
        e.preventDefault();
        handleVoiceToggle(voiceRef, setLocalMicOn);
      }
    };
    const onKeyUp = (e) => {
      const k = e.key.toLowerCase();
      keys.current[k] = false;
      if (k === 'c') crouchTogglePressed.current = false;
    };
    const rightDragMoved = { current: false };
    const onMouseDown = (e) => {
      // Left click = attack, middle click = Lock-On, right click = camera drag (+ block if no drag)
      if (e.button === 0) {
        rangedClickAttackPressed.current = true;
        attackPressed.current = true;
        e.preventDefault();
      } else if (e.button === 1) {
        e.preventDefault();
        const target = handleMiddleClick({ event: e, renderer, camera, enemies, remoteManager: remoteManagerRef.current, setPlayerMenu, rogues: window.__gw3dRogues || [] });
        lockOnTargetRef.current = target && lockOnTargetRef.current?.id !== target.id ? target : null;
      } else if (e.button === 2) {
        // Start camera drag on right-click
        drag.current.active = true;
        drag.current.x = e.clientX;
        drag.current.y = e.clientY;
        rightDragMoved.current = false;
        e.preventDefault();
      }
    };
    const onMouseUp = (e) => {
      if (e.button === 2) {
        drag.current.active = false;
        // Only activate block if right-click was a tap (no drag movement)
        if (!rightDragMoved.current) {
          playerStateMachine.setIntent({ blockHeld: true });
          playerAnim?.setBlocking(true);
          setTimeout(() => {
            playerStateMachine.setIntent({ blockHeld: false });
            playerAnim?.setBlocking(false);
          }, 150);
        }
        rightDragMoved.current = false;
      } else {
        drag.current.active = false;
      }
    };
    const onMouseMove = (e) => {
      if (!drag.current.active) return;
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      drag.current.x = e.clientX;
      drag.current.y = e.clientY;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) rightDragMoved.current = true;
      orbit.current.yaw -= dx * 0.005;
      orbit.current.pitch = Math.max(0.1, Math.min(Math.PI / 2.2, orbit.current.pitch + dy * 0.005));
    };
    const onWheel = (e) => {
      orbit.current.distance = Math.max(2, Math.min(12, orbit.current.distance + e.deltaY * 0.003));
      e.preventDefault();
    };
    const onContext = (e) => e.preventDefault();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.addEventListener('contextmenu', onContext);
    // Prevent middle-click scroll/autoscroll on the canvas
    renderer.domElement.addEventListener('mousedown', (e) => { if (e.button === 1) e.preventDefault(); });

    const playCompanionAnimation = (targetAnim) => {
      if (targetAnim === companionCurrentAnimRef.current) return;
      const idle = companionIdleActionRef.current;
      const walk = companionWalkActionRef.current;
      const run = companionRunActionRef.current;
      if (targetAnim !== 'idle' && idle) idle.fadeOut(0.2);
      if (targetAnim !== 'walk' && walk) walk.fadeOut(0.2);
      if (targetAnim !== 'run' && run) run.fadeOut(0.2);
      const next = targetAnim === 'run' ? run : targetAnim === 'walk' ? walk : idle;
      if (next) next.reset().fadeIn(0.2).play();
      companionCurrentAnimRef.current = targetAnim;
    };

    const companionSystem = new CompanionAISystem({
      companionRef: companionGroupRef,
      ownerRef: playerModelRef,
      sampleGroundY,
      playAnimation: playCompanionAnimation,
      getMounted: () => isMountedRef.current,
    });
    const enemySystem = new EnemyAISystem({ enemies, playerRef: playerModelRef, sampleGroundY });
    const combatSystem = new CombatSystem({ calculateHit, getPlayerHUD, setHP, spawnDamageFloat, playActionSound });
    const abilitySystem = new AbilitySystem({ getLoadout, castSkill, startSkillCooldown });

    // Animation loop
    let frameId;
    let uiFrameCounter = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);
      if (dodgeVanish.active) {
        dodgeVanish.timer += delta;
        if (dodgeVanish.timer >= dodgeVanish.duration) {
          if (model) model.visible = true;
          dodgeVanish.active = false;
        }
      }
      if (remoteManagerRef.current) remoteManagerRef.current.update(delta);
      remoteCompanionManager.update(delta);
      if (remoteManagerRef.current) { const mountedIds = remoteCompanionManager.getMountedPlayerIds(); remoteManagerRef.current.getRemotes?.().forEach((r, pid) => { if (r.group) r.group.visible = !mountedIds.has(pid); }); }
      if (voiceRef.current && remoteManagerRef.current) {
        const ids = Array.from(remoteManagerRef.current.getRemotes?.()?.keys() || []);
        voiceRef.current.syncPeers(ids);
        voiceRef.current.updateSpatialGains();
      }

      // ─── Companion mount toggle (F) — runs once per key press ───
      if (mountToggleRef.current && model) {
        mountToggleRef.current = false;
        const compGroup = companionGroupRef.current;
        if (isMountedRef.current) {
          // Dismount: place player next to companion
          if (compGroup) {
            model.position.x = compGroup.position.x + 1.2;
            model.position.z = compGroup.position.z;
            if (!dodgeVanish.active) model.visible = true;
          }
          isMountedRef.current = false;
          setIsMounted(false);
          setMounted(false);
        } else if (compGroup) {
          // Only mount if close enough
          const dx = compGroup.position.x - model.position.x;
          const dz = compGroup.position.z - model.position.z;
          if (Math.sqrt(dx * dx + dz * dz) < 3.5) {
            isMountedRef.current = true;
            setIsMounted(true);
            setMounted(true);
          }
        }
      }

      // Movement
      if (model) {
        const mounted = isMountedRef.current;
        const compGroup = companionGroupRef.current;
        const speedMult = mounted ? getEffectiveSpeedMultiplier() : 1.0;
        const yaw = orbit.current.yaw;
        const move = new THREE.Vector3();
        const combatAxes = getCombatAxes();
        if (combatAxes) {
          if (keys.current['w']) move.add(combatAxes.forward);
          if (keys.current['s']) move.add(combatAxes.forward.clone().multiplyScalar(-1));
          if (keys.current['a']) move.add(combatAxes.cameraRight.clone().multiplyScalar(-1));
          if (keys.current['d']) move.add(combatAxes.cameraRight);
        } else {
          // Camera-relative movement: Forward = -sin/cos of yaw, Right = cross(up, forward)
          const fx = -Math.sin(yaw), fz = -Math.cos(yaw); // forward
          const rx =  Math.cos(yaw), rz = Math.sin(yaw);  // right (fixed: A=left, D=right)
          if (keys.current['w']) { move.x += fx; move.z += fz; }
          if (keys.current['s']) { move.x -= fx; move.z -= fz; }
          if (keys.current['a']) { move.x -= rx; move.z -= rz; } // left = -right
          if (keys.current['d']) { move.x += rx; move.z += rz; } // right = +right
        }

        const isMoving = move.lengthSq() > 0;
        const isRunning = !!keys.current['shift'] && isMoving;
        const isSprinting = !!keys.current['control'] && isMoving;
        const isAiming = !!playerAnim?.getIsAiming?.();
        const moveDirection = keys.current['s'] ? 'backward' : keys.current['a'] ? 'left' : keys.current['d'] ? 'right' : 'forward';
        const combatLocked = !!combatAxes;
        const isCrouching = !!playerAnim?.getIsCrouching?.();
        const movementOverridden = !!playerAnim?.isMovementOverridden?.();
        const baseMoveSpeed = isSprinting ? RUN_SPEED * 1.35 : isRunning ? RUN_SPEED * getRunMultiplier() : WALK_SPEED;
        const speed = (baseMoveSpeed * (isCrouching ? 0.58 : 1)) * speedMult * getWeaponMoveSpeedMult();
        if (isMoving && !movementOverridden) {
          move.normalize();
          model.position.x += move.x * speed * delta;
          model.position.z += move.z * speed * delta;
          const arenaRadius = 36.5;
          const distFromCenter = Math.sqrt(model.position.x * model.position.x + model.position.z * model.position.z);
          if (distFromCenter > arenaRadius) {
            const edgeScale = arenaRadius / distFromCenter;
            model.position.x *= edgeScale;
            model.position.z *= edgeScale;
          }
          if (!combatAxes) {
            const angle = Math.atan2(move.x, move.z);
            const targetQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
            model.quaternion.slerp(targetQ, ROT_SMOOTH);
          }
        }
        // Glue player feet to terrain, then let the manual controller add jump/roll offsets.
        if (mapReady) {
          const gy = sampleGroundY(model.position.x, model.position.z);
          if (gy !== null) model.position.y = gy;
          if (playerAnim) playerAnim.updateMotion(model, delta, gy ?? model.position.y);
        } else if (playerAnim) {
          playerAnim.updateMotion(model, delta, model.position.y);
        }
        // Rogue-AI body collision — push player out so they can't walk through hostile player-AIs
        { const _R = window.__gw3dRogues; if (_R) for (let i=0;i<_R.length;i++){ const r=_R[i]; if(!r.alive||r.dying||!r.group?.visible) continue; const dxR=model.position.x-r.group.position.x, dzR=model.position.z-r.group.position.z, dR=Math.sqrt(dxR*dxR+dzR*dzR); if(dR>0&&dR<0.9){ const p=(0.9-dR)/dR; model.position.x+=dxR*p; model.position.z+=dzR*p; } } }

        // ─── Mount handling: companion follows player while mounted ───
        if (companionMixerRef.current) companionMixerRef.current.update(delta);
        if (mounted && compGroup) {
          // Rider socket pass: keep the player visible and position them above the mount instead of replacing them visually.
          if (!dodgeVanish.active) model.visible = true;
          compGroup.position.x = model.position.x;
          compGroup.position.z = model.position.z;
          // Match player rotation so steering feels natural
          compGroup.quaternion.slerp(model.quaternion, ROT_SMOOTH);
          if (mapReady) {
            const gy = sampleGroundY(compGroup.position.x, compGroup.position.z);
            if (gy !== null) {
              compGroup.position.y = gy;
              model.position.y = gy + 1.15;
            }
          }
          // Drive mount animation: idle (still), walk (W), run (Shift+W).
          // Falls back gracefully if run clip wasn't found (uses walk instead).
          const hasRun = !!companionRunActionRef.current;
          let targetAnim = 'idle';
          if (isMoving) targetAnim = isRunning && hasRun ? 'run' : 'walk';
          if (targetAnim !== companionCurrentAnimRef.current) {
            const idle = companionIdleActionRef.current;
            const walk = companionWalkActionRef.current;
            const run  = companionRunActionRef.current;
            // Fade out everything else, fade in the target
            if (targetAnim !== 'idle' && idle) idle.fadeOut(0.2);
            if (targetAnim !== 'walk' && walk) walk.fadeOut(0.2);
            if (targetAnim !== 'run'  && run)  run.fadeOut(0.2);
            const next = targetAnim === 'run' ? run : targetAnim === 'walk' ? walk : idle;
            if (next) next.reset().fadeIn(0.2).play();
            companionCurrentAnimRef.current = targetAnim;
          }
        } else {
          // Not mounted — steering-based companion AI prevents snap/micro-jitter near the player.
          if (!dodgeVanish.active) model.visible = true;
          companionSystem.update(delta, { ownerMoving: isMoving, ownerRunning: isRunning, ownerYaw: orbit.current.yaw });
        }

        // ─── Companion proximity prompt ───
        if (compGroup && !mounted) {
          const dx = compGroup.position.x - model.position.x;
          const dz = compGroup.position.z - model.position.z;
          const isNear = Math.sqrt(dx * dx + dz * dz) < 3.5;
          if (isNear !== nearbyCompanionRef.current) {
            nearbyCompanionRef.current = isNear;
            setNearbyCompanion(isNear);
          }
        } else if (nearbyCompanionRef.current) {
          nearbyCompanionRef.current = false;
          setNearbyCompanion(false);
        }

        updateLockOnRotation(delta);

        // Core player state machine drives locomotion/combat intent, while legacy animation clips remain preserved.
        playerStateMachine.setIntent({
          moveAmount: isMoving ? 1 : 0,
          runHeld: isRunning,
          sprintHeld: isSprinting,
          aimHeld: isAiming,
          direction: moveDirection,
        });
        playerStateMachine.update(delta);
        if (coreAnimationController) {
          coreAnimationController.update(playerStateMachine.getSnapshot(), playerStateMachine.intent);
        } else if (playerAnim) {
          playerAnim.updateActionState({ moving: isMoving, running: isRunning, direction: moveDirection, aiming: isAiming });
        }

        // Walk/run SFX loop — start/stop based on movement
        if (isMoving) {
          startLoopSound('player_walk', { volume: isRunning ? 0.6 : 0.4 });
        } else {
          stopLoopSound('player_walk');
        }

        // Broadcast live player position + facing to the HUD minimap store (isRunning consumed by WindRunEffect)
        setPlayerPosition({ x: model.position.x, z: model.position.z, yaw: orbit.current.yaw, isRunning: isRunning && isMoving });
        window.__localPlayerPos = { x: model.position.x, y: model.position.y, z: model.position.z };

        // Broadcast to multiplayer presence system (used by MultiplayerSystem).
        window.dispatchEvent(new CustomEvent('multiplayerLocalUpdate', {
          detail: {
            x: model.position.x,
            y: model.position.y,
            z: model.position.z,
            yaw: orbit.current.yaw,
            anim: playerAnim?.getCurrent?.() || (isMoving ? (isSprinting ? 'sprint' : isRunning ? 'run' : 'walk') : 'idle'),
          },
        }));

        // Smooth camera system: damped lock-on yaw, combat distance, and sprint pullback without per-frame object spam.
        playerCameraSystem.update(delta, playerStateMachine.intent);

        // ─── NPC proximity & interaction ───
        let closestNPC = null;
        let closestNPCDist = NPC_INTERACT_RANGE;
        npcs.forEach((npc) => {
          const dx = npc.mesh.position.x - model.position.x;
          const dz = npc.mesh.position.z - model.position.z;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (d < closestNPCDist) { closestNPCDist = d; closestNPC = npc; }
          // pulse the ring
          npc.ringMesh.material.opacity = 0.4 + Math.sin(clock.elapsedTime * 2) * 0.2;
        });
        if (closestNPC?.id !== nearbyNPCRef.current?.id) {
          nearbyNPCRef.current = closestNPC;
          setNearbyNPC(closestNPC ? { id: closestNPC.id, name: closestNPC.name } : null);
        }
        // ─── Quest NPC proximity ───
        let closestQuestNPC = null;
        let closestQuestDist = NPC_INTERACT_RANGE;
        questNPCs.forEach((qn) => {
          if (qn.mixer) qn.mixer.update(delta);
          const dx = qn.group.position.x - model.position.x;
          const dz = qn.group.position.z - model.position.z;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (d < closestQuestDist) { closestQuestDist = d; closestQuestNPC = qn; }
          if (qn.ringMesh) qn.ringMesh.material.opacity = 0.4 + Math.sin(clock.elapsedTime * 2) * 0.2;
        });
        if (closestQuestNPC?.id !== nearbyQuestNPCRef.current?.id) {
          nearbyQuestNPCRef.current = closestQuestNPC;
          setNearbyQuestNPC(closestQuestNPC ? { id: closestQuestNPC.id, name: closestQuestNPC.name } : null);
        }

        if (interactPressed.current) {
          interactPressed.current = false;
          // Prefer quest NPC if also nearby (they take priority over generic NPCs)
          if (closestQuestNPC) {
            const qs = getQuestState();
            const lvl = playerLevelStateRef.current;
            // Is there an accepted quest from this NPC that's now complete? → turn_in
            const acceptedFromHere = QUESTS.find(
              (q) => q.npcId === closestQuestNPC.id && qs.acceptedIds.includes(q.id)
            );
            if (acceptedFromHere) {
              const prog = qs.progress[acceptedFromHere.id] || 0;
              const isDone = prog >= acceptedFromHere.objective.count;
              setActiveQuestDialogue({
                npcName: closestQuestNPC.name,
                quest: acceptedFromHere,
                mode: isDone ? 'turn_in' : 'in_progress',
                progress: prog,
              });
            } else {
              // Offer the next available quest, or fall back to a generic "no quests" message
              const available = getAvailableQuestForNPC(
                closestQuestNPC.id, lvl, qs.acceptedIds, qs.completedIds
              );
              if (available) {
                setActiveQuestDialogue({
                  npcName: closestQuestNPC.name,
                  quest: available,
                  mode: 'offer',
                  progress: 0,
                });
              } else {
                setActiveDialogue({
                  name: closestQuestNPC.name,
                  text: "I've nothing for you right now, traveler. Return when you've grown stronger.",
                });
              }
            }
          } else if (closestNPC) {
            setActiveDialogue({ name: closestNPC.name, text: closestNPC.dialogue });
          }
        }

        // ─── Enemy AI: wander state machine (walk ~3s → idle ~5s → repeat) ───
        enemies.forEach((enemy) => {
          if (!enemy.alive) return;
          if (enemy.mixer) enemy.mixer.update(delta);

          // BOSS PATH — delegate to BossBrain (state machine + abilities + threat).
          // Bypasses wander/attack logic entirely; brain emits bossAction events.
          if (enemy.isBoss && enemy.brain) {
            if (enemy.dying) return;
            const localPos = { id: 'local_player', x: model.position.x, z: model.position.z, hp: getPlayerHUD().hp || 100, maxHp: getPlayerHUD().maxHP || 100, isLocal: true };
            enemy.brain.tick(delta, { players: [localPos], dt: delta });
            if (mapReady) {
              const gy = sampleGroundY(enemy.group.position.x, enemy.group.position.z);
              if (gy !== null) enemy.group.position.y = gy;
            }
            // Animation: walk when aiTarget set, idle otherwise
            if (enemy.aiTarget && enemy.walkAction && enemy.idleAction) {
              if (!enemy.walkAction.isRunning()) { enemy.idleAction.fadeOut(0.2); enemy.walkAction.reset().fadeIn(0.2).play(); }
            } else if (enemy.idleAction && enemy.walkAction) {
              if (!enemy.idleAction.isRunning()) { enemy.walkAction.fadeOut(0.2); enemy.idleAction.reset().fadeIn(0.2).play(); }
            }
            // Boss damage credit when hit by player → into threat table
            if (enemy.hitCooldown > 0) enemy.hitCooldown -= delta;
            return;
          }

          // Death sequence: play death anim, fade out, RESPAWN after 10s at home.
          if (enemy.dying) {
            enemy.deathTimer += delta;
            if (enemy.deathTimer >= DEATH_FADE_DELAY) {
              const fadeT = Math.min(1, (enemy.deathTimer - DEATH_FADE_DELAY) / 0.8);
              enemy.tintMaterials.forEach(m => { m.transparent = true; m.opacity = 1 - fadeT; });
              if (fadeT >= 1 && enemy.group.visible) {
                enemy.group.visible = false;
                if (enemy.mixer) enemy.mixer.stopAllAction();
                setEnemyCount(enemies.filter(e => e.alive && !e.dying).length);
              }
            }
            if (enemy.respawnAt && performance.now() >= enemy.respawnAt) {
              enemy.dying = false; enemy.deathTimer = 0; enemy.respawnAt = null;
              enemy.hp = enemy.maxHp; enemy.state = 'idle'; enemy.stateTimer = 0;
              enemy.target = null; enemy.attacking = false; enemy.attackCooldown = 0; enemy.hitCooldown = 0;
              enemy.tintMaterials.forEach(m => { m.opacity = 1; m.transparent = false; });
              if (enemy.home && enemy.group) {
                enemy.group.position.set(enemy.home[0], enemy.home[1], enemy.home[2]);
                enemy.group.visible = true;
                if (mapReady) { const gy = sampleGroundY(enemy.group.position.x, enemy.group.position.z); if (gy !== null) enemy.group.position.y = gy; }
              }
              if (enemy.idleAction) enemy.idleAction.reset().fadeIn(0.2).play();
              setEnemyCount(enemies.filter(e => e.alive && !e.dying).length);
            }
            return;
          }

          // ─── Enemy attack player when in range ───
          if (enemy.attackCooldown > 0) enemy.attackCooldown -= delta;
          const dxP = model.position.x - enemy.group.position.x;
          const dzP = model.position.z - enemy.group.position.z;
          const distToPlayer = Math.sqrt(dxP * dxP + dzP * dzP);
          const playerInRange = distToPlayer < ENEMY_ATTACK_RANGE;

          if (playerInRange) {
            // Face the player
            const faceAngle = Math.atan2(dxP, dzP);
            const faceQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), faceAngle);
            enemy.group.quaternion.slerp(faceQ, 0.15);

            // Start attack if cooldown ready and not already attacking
            if (!enemy.attacking && enemy.attackCooldown <= 0 && cachedAttackClip && enemy.mixer) {
              enemy.attacking = true;
              enemy.attackWindupTimer = ENEMY_ATTACK_WINDUP;
              enemy.attackCooldown = ENEMY_ATTACK_COOLDOWN;
              playActionSound('enemy_attack');
              if (enemy.walkAction) enemy.walkAction.fadeOut(0.1);
              if (enemy.idleAction) enemy.idleAction.fadeOut(0.1);
              const atkAction = enemy.mixer.clipAction(cachedAttackClip);
              atkAction.setLoop(THREE.LoopOnce);
              atkAction.clampWhenFinished = false;
              atkAction.reset().fadeIn(0.1).play();
              enemy.attackAction = atkAction;
            }
          }

          // Mid-attack: when windup ends, deal damage to player
          if (enemy.attacking) {
            enemy.attackWindupTimer -= delta;
            if (enemy.attackWindupTimer <= 0) {
              // Damage lands — only if player still in range and not invulnerable
              if (playerInRange && playerInvulTimer.current <= 0 && !rollDodge() && !rollGuard() && !rollRangedEvade() && !rollDodgeBuff()) {
                const playerDerived = getPlayerHUD().derived || playerDerivedRef.current;
                let dmg = calculateHit(enemy.derived, playerDerived);
                const levelDiff = enemy.level - playerLevelRef.current;
                if (levelDiff > 0) dmg = Math.round(dmg * (1 + levelDiff * 0.25));
                else if (levelDiff < 0) dmg = Math.max(1, Math.round(dmg * Math.max(0.4, 1 + levelDiff * 0.15)));
                // God's Deflection: chance to reflect 100% back at attacker
                if (rollReflect()) { enemy.hp -= dmg; spawnDamageFloat(enemy.id, dmg); playActionSound('enemy_hit'); }
                else { const absorbed = absorbShield(dmg); dmg = Math.max(0, dmg - absorbed); if (dmg > 0) { setHP(Math.max(0, getPlayerHUD().hp - dmg)); playerAnim?.requestHitReact(); playActionSound('player_hit'); } }
                playerInvulTimer.current = PLAYER_INVUL_AFTER_HIT;
              }
              // End attack ~0.4s after damage so anim has time to complete
              enemy.attacking = false;
              if (enemy.attackAction) enemy.attackAction.fadeOut(0.2);
              if (enemy.idleAction) enemy.idleAction.reset().fadeIn(0.2).play();
            }
            // While attacking, skip wander state updates this frame
            if (enemy.hitCooldown > 0) enemy.hitCooldown -= delta;
            return;
          }

          enemy.stateTimer += delta;

          if (enemy.state === 'walk') {
            // Move toward current wander target
            if (enemy.target) {
              const dx = enemy.target.x - enemy.group.position.x;
              const dz = enemy.target.z - enemy.group.position.z;
              const dist = Math.sqrt(dx * dx + dz * dz);
              if (dist > 0.15) {
                const nx = dx / dist, nz = dz / dist;
                enemy.group.position.x += nx * ENEMY_SPEED * delta;
                enemy.group.position.z += nz * ENEMY_SPEED * delta;
                const targetAngle = Math.atan2(nx, nz);
                const targetQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngle);
                enemy.group.quaternion.slerp(targetQ, 0.15);
              }
            }
            // Glue feet to terrain as the enemy wanders across uneven ground
            if (mapReady) {
              const gy = sampleGroundY(enemy.group.position.x, enemy.group.position.z);
              if (gy !== null) enemy.group.position.y = gy;
            }
            // After walk duration → switch to idle
            if (enemy.stateTimer >= ENEMY_WALK_TIME) {
              enemy.state = 'idle';
              enemy.stateTimer = 0;
              if (enemy.walkAction) enemy.walkAction.fadeOut(0.2);
              if (enemy.idleAction) enemy.idleAction.reset().fadeIn(0.2).play();
            }
          } else {
            // idle state — wait
            if (enemy.stateTimer >= ENEMY_IDLE_TIME) {
              enemy.state = 'walk';
              enemy.stateTimer = 0;
              pickWanderTarget(enemy);
              if (enemy.idleAction) enemy.idleAction.fadeOut(0.2);
              if (enemy.walkAction) enemy.walkAction.reset().fadeIn(0.2).play();
            }
          }

          // Tick hit-cooldown (no emissive glow — natural color preserved)
          if (enemy.hitCooldown > 0) enemy.hitCooldown -= delta;
        });

        // Tick player cooldowns + player attack
        if (playerAttackCooldown.current > 0) playerAttackCooldown.current -= delta;
        if (playerInvulTimer.current > 0) playerInvulTimer.current -= delta;
        if (attackPressed.current) {
          attackPressed.current = false;
          const isRangedClickAttack = rangedClickAttackPressed.current;
          rangedClickAttackPressed.current = false;
          if (playerAttackCooldown.current > 0) return;
          dispatchRogueAttack(playerDerivedRef, skillStrikeMultRef.current);
          // 0.2 second delay between attacks.
          playerAttackCooldown.current = 0.2;
          // Attack montage is manually gated by the animation state machine.
          if (!playerAnim?.HandleCombat?.(isRangedClickAttack || getActiveWeaponPath() === 'ranged' ? 'attack' : 'kick')) {
            playOneShot(isRangedClickAttack || getActiveWeaponPath() === 'ranged' ? 'attack' : 'kick', 1.4);
          }
          playActionSound('player_attack');
          let closestEnemy = null;
          let closestEnemyDist = isRangedClickAttack || getActiveWeaponPath() === 'ranged' ? RANGED_ATTACK_RANGE : ENEMY_ATTACK_RANGE;
          enemies.forEach((enemy) => {
            if (!enemy.alive || enemy.dying) return;
            const dx = enemy.group.position.x - model.position.x;
            const dz = enemy.group.position.z - model.position.z;
            const d = Math.sqrt(dx * dx + dz * dz);
            if (d < closestEnemyDist) { closestEnemyDist = d; closestEnemy = enemy; }
          });
          if (closestEnemy) {
            // Pull live derived stats from store so stat allocations actually affect damage.
            const liveDerived = getPlayerHUD().derived || playerDerivedRef.current;
            const boosted = { ...liveDerived, critChance: (liveDerived.critChance || 0) + getWeaponCritChanceBonusPct() };
            let dmg = Math.round(calculateHit(boosted, closestEnemy.derived) * consumeDamageBuffMultiplier() * consumePowerChargeMultiplier() * getWeaponDamageMult() * skillStrikeMultRef.current * consumeShopDamageBuff()); skillStrikeMultRef.current = 1.0; const _sc = consumeShopCritBuff(); if (_sc > 0 && Math.random() * 100 < _sc) dmg = Math.round(dmg * 1.5);
            if (rollLethalBlow()) { dmg = closestEnemy.hp; spawnDamageFloat(closestEnemy.id, 9999); }

            // Weapon Mastery — adjust damage, apply identity/milestone passives.
            const dxM = closestEnemy.group.position.x - model.position.x;
            const dzM = closestEnemy.group.position.z - model.position.z;
            const distM = Math.sqrt(dxM * dxM + dzM * dzM);
            const masteryRes = applyMasteryToHit(dmg, {
              targetHPPct: closestEnemy.hp / closestEnemy.maxHp,
              playerHPPct: (getPlayerHUD().hp || 0) / (getPlayerHUD().maxHP || 1),
              distance: distM,
              isCrit: false,
            });
            dmg = masteryRes.damage;
            if (masteryRes.armorPenPct > 0) {
              const pen = Math.round((closestEnemy.derived?.defense || 0) * (masteryRes.armorPenPct / 100));
              dmg = Math.max(1, dmg + pen);
            }

            const activeWeaponId = getActiveWeaponId();
            reportWeaponHit({ weaponId: activeWeaponId, damage: dmg, isCrit: masteryRes.isCrit, isBoss: !!closestEnemy.isBoss });

            combatSystem.applyDamage(closestEnemy, dmg, { sourceId: closestEnemy.id, sound: 'enemy_hit' });
            // Boss threat credit — feeds the boss brain's aggro table.
            if (closestEnemy.isBoss && closestEnemy.brain) {
              closestEnemy.brain.recordDamage('local_player', dmg);
            }
            if (closestEnemy.hp <= 0) {
              playActionSound('enemy_death');
              reportWeaponKill(getActiveWeaponId());
              // Lethal — start death sequence + broadcast kill to all peers so
              // every player sees this enemy die in real time. 10s respawn is
              // scheduled inside killEnemyLocal.
              closestEnemy.respawnAt = performance.now() + 10000;
              closestEnemy.dying = true;
              closestEnemy.deathTimer = 0;
              closestEnemy.hp = 0;
              if (closestEnemy.walkAction) closestEnemy.walkAction.fadeOut(0.15);
              if (closestEnemy.idleAction) closestEnemy.idleAction.fadeOut(0.15);
              if (cachedDeathClip && closestEnemy.mixer) {
                const deathAction = closestEnemy.mixer.clipAction(cachedDeathClip);
                deathAction.setLoop(THREE.LoopOnce);
                deathAction.clampWhenFinished = true;
                deathAction.reset().fadeIn(0.15).play();
                closestEnemy.deathAction = deathAction;
              }
              broadcastEnemyKill(closestEnemy.id, { tier: closestEnemy.tier || 'normal', isBoss: !!closestEnemy.isBoss, x: closestEnemy.group.position.x, y: closestEnemy.group.position.y, z: closestEnemy.group.position.z }); recordTitleKill(closestEnemy.isBoss ? 'boss' : (closestEnemy.tier === 'elite' || closestEnemy.tier === 'champion' ? 'elite' : 'normal'), 1); addGold(closestEnemy.isBoss ? 250 : closestEnemy.tier === 'champion' ? 60 : closestEnemy.tier === 'elite' ? 30 : 15);
              setScore(prev => prev + 100 * closestEnemy.xpReward);
              spawnXPFloat(closestEnemy.xpReward);
              awardCompanionXP(companionDefRef.current?.id, closestEnemy.xpReward);
              reportEnemyKill(QUESTS, closestEnemy.tier);
              // Award XP, handle level-ups against the custom curve.
              // Each level-up grants stat points (handled inside awardXP).
              let newXP = playerXPRef.current + closestEnemy.xpReward;
              let newLevel = playerLevelRef.current;
              let needed = xpForLevel(newLevel);
              let levelsGained = 0;
              while (newXP >= needed) {
                newXP -= needed;
                newLevel += 1;
                levelsGained += 1;
                needed = xpForLevel(newLevel);
              }
              playerXPRef.current = newXP;
              playerLevelRef.current = newLevel;
              setPlayerXP(newXP);
              setPlayerLevel(newLevel);
              awardXP({ newLevel, newXP, xpForNext: xpForLevel(newLevel), levelsGained, xpGained: closestEnemy.xpReward });
              if (levelsGained > 0) playActionSound('level_up');
            }
          }
        }
      }

      combatSystem.update(delta);
      tickSkillCooldowns(delta); tickLegacyAbilityCooldowns(delta); tickRegen(delta); tickCompanionCooldowns(delta); tickBuffs(); tickFusion();
      applyFusionEffects(model, companionGroupRef.current, isMountedRef.current);
      if (companionAbilityPressed.current) { const abId = companionAbilityPressed.current; companionAbilityPressed.current = null; processCompanionAbilityPress({ abilityId: abId, scene, model, companionGroup: companionGroupRef.current, enemies, cachedDeathClip, companionDefId: companionDefRef.current?.id, playerXPRef, playerLevelRef, setScore, setPlayerXP, setPlayerLevel, spawnXPFloat, spawnDamageFloat, xpForLevel, awardXP, activeEffectsRef: activeEffects }); }

      // ─── Companion auto-combat AI ───
      // Auto-attacks the player's target with off-cooldown abilities, and
      // auto-heals when the player's HP drops low or they take recent damage.
      // Uses the exact same processCompanionAbilityPress() path as manual casts.
      tickCompanionAutoCombat({
        delta, scene, model, companionGroup: companionGroupRef.current,
        enemies, cachedDeathClip,
        companionDefId: companionDefRef.current?.id,
        playerXPRef, playerLevelRef,
        setScore, setPlayerXP, setPlayerLevel,
        spawnXPFloat, spawnDamageFloat, xpForLevel, awardXP,
        activeEffectsRef: activeEffects,
        isMounted: isMountedRef.current,
      });

      // ─── Update active visual effects (lightning etc.) ───
      activeEffects.current = activeEffects.current.filter((fx) => {
        fx.update(delta);
        return fx.alive();
      });

      // ─── Ability firing (1..8 keys) ───
      // NEW PIPELINE: Input → loadoutStore → skillExecutor (validates weapon
      // lock, runs buff/attack via the new system). Falls back to the LEGACY
      // targeted-ability path ONLY for skills not yet in the new registry
      // (lightning_strike, shadow_teleport, frost_tornado — kept verbatim).
      if (abilityKeyPressed.current !== -1 && model) {
        const slotIndex = abilityKeyPressed.current; abilityKeyPressed.current = -1;
        const loadout = getLoadout();
        const newSkillId = loadout.activeSlots[slotIndex];
        const newCooldown = loadout.cooldowns[slotIndex];

        // Try new system first.
        if (newSkillId && newCooldown <= 0) {
          const result = castSkill(newSkillId, {
            level: 1,
            maxHP: getHUDForSkill().maxHP || 100,
          });
          if (result.ok) startSkillCooldown(slotIndex);
        }

        // Legacy targeted abilities still live on abilityStore for now.
        const abState = getAbilityState();
        const entry = abState.equipped[slotIndex]; const cooldownLeft = abState.cooldowns[slotIndex];
        if (entry && cooldownLeft <= 0 && !newSkillId) {
          const abId = typeof entry === 'string' ? entry : entry.id;
          const ab = ABILITY_DEFINITIONS.find((a) => a.id === abId);
          const target = abState.target;
          if (ab && target) {
            // Find the live enemy entry
            const targetEnemy = enemies.find((e) => e.id === target.id && e.alive && !e.dying);
            startLegacyAbilityCooldown(slotIndex);
            castLegacyTargetedAbility({
              ab, target, enemies, scene, model,
              activeEffectsRef: activeEffects,
              playActionSound, spawnDamageFloat, spawnXPFloat,
              getPlayerHUD, playerDerivedRef, cachedDeathClip,
              awardCompanionXP, companionDefRef, reportEnemyKill, QUESTS,
              setScore, setPlayerXP, setPlayerLevel, awardXP,
              playerXPRef, playerLevelRef, xpForLevel,
              clearTarget, updateTargetHP, getAbilityState,
            });
          }
        }
      }

      // ─── Project enemy world positions → screen-space for HP bars (throttled) ───
      uiFrameCounter++;
      if (uiFrameCounter % 3 === 0) {
        const w = container.clientWidth;
        const h = container.clientHeight;
        const ui = [];
        const tmpVec = new THREE.Vector3();
        enemies.forEach((enemy) => {
          if (!enemy.alive || enemy.dying || !enemy.group) return;
          // Position above head — model height ~1.7, scaled
          tmpVec.set(enemy.group.position.x, enemy.group.position.y + 2.2, enemy.group.position.z);
          tmpVec.project(camera);
          const inView = tmpVec.z > -1 && tmpVec.z < 1 && Math.abs(tmpVec.x) < 1.2 && Math.abs(tmpVec.y) < 1.2;
          if (!inView) return;
          ui.push({
            id: enemy.id,
            x: (tmpVec.x * 0.5 + 0.5) * w,
            y: (-tmpVec.y * 0.5 + 0.5) * h,
            hp: enemy.hp,
            maxHp: enemy.maxHp,
            level: enemy.level,
            name: enemy.bossName || (enemy.tier ? `${enemy.tier.charAt(0).toUpperCase() + enemy.tier.slice(1)} Enemy` : 'Enemy'),
          });
        });
        setEnemiesUI(ui);

        // ─── Project quest NPC heads → screen-space for floating "QUEST" labels ───
        const qs = getQuestState();
        const lvl = playerLevelStateRef.current;
        const qUI = [];
        questNPCs.forEach((qn) => {
          if (!qn.group) return;
          // Decide label status: turn_in > available > nothing
          const acceptedFromHere = QUESTS.find(
            (q) => q.npcId === qn.id && qs.acceptedIds.includes(q.id)
          );
          let status = null;
          if (acceptedFromHere) {
            const prog = qs.progress[acceptedFromHere.id] || 0;
            status = prog >= acceptedFromHere.objective.count ? 'turn_in' : 'in_progress';
          } else {
            const available = getAvailableQuestForNPC(qn.id, lvl, qs.acceptedIds, qs.completedIds);
            if (available) status = 'available';
          }
          if (!status) return;
          tmpVec.set(qn.group.position.x, qn.group.position.y + 2.4, qn.group.position.z);
          tmpVec.project(camera);
          const inView = tmpVec.z > -1 && tmpVec.z < 1 && Math.abs(tmpVec.x) < 1.2 && Math.abs(tmpVec.y) < 1.2;
          if (!inView) return;
          qUI.push({
            id: qn.id,
            x: (tmpVec.x * 0.5 + 0.5) * w,
            y: (-tmpVec.y * 0.5 + 0.5) * h,
            status,
          });
        });
        setQuestNPCsUI(qUI);

        // ─── Sync live target HP to abilityStore ───
        const currentTarget = getAbilityState().target;
        if (currentTarget) {
          const te = enemies.find((e) => e.id === currentTarget.id);
          if (te && te.alive && !te.dying) {
            updateTargetHP(te.id, Math.max(0, te.hp));
          } else if (!te || !te.alive || te.dying) {
            clearTarget();
          }
        }

        // ─── Project floating damage / XP numbers to screen space ───
        const nowMs = performance.now();
        // Drop expired floats (>1.1s)
        floatsRef.current = floatsRef.current.filter((f) => nowMs - f.born < 1100);
        const projected = [];
        floatsRef.current.forEach((f) => {
          let wx, wy, wz;
          if (f.enemyId === 'player') {
            wx = model.position.x;
            wy = model.position.y + 2.6;
            wz = model.position.z;
          } else {
            const en = enemies.find((e) => e.id === f.enemyId);
            if (!en || !en.group) return;
            wx = en.group.position.x;
            wy = en.group.position.y + 2.4;
            wz = en.group.position.z;
          }
          tmpVec.set(wx, wy, wz);
          tmpVec.project(camera);
          if (tmpVec.z < -1 || tmpVec.z > 1) return;
          projected.push({
            id: f.id,
            x: (tmpVec.x * 0.5 + 0.5) * w,
            y: (-tmpVec.y * 0.5 + 0.5) * h,
            value: f.value,
            type: f.type,
            born: f.born,
          });
        });
        setFloats(projected);

        const cg = companionGroupRef.current;
        const cs = companionStatsRef.current;
        if (cg) { window.__localCompanionPos = { x: cg.position.x, y: cg.position.y, z: cg.position.z, yaw: cg.rotation.y }; }
        if (cg && cs && !isMountedRef.current) {
          tmpVec.set(cg.position.x, cg.position.y + 2.4, cg.position.z); tmpVec.project(camera);
          const iv = tmpVec.z > -1 && tmpVec.z < 1 && Math.abs(tmpVec.x) < 1.2 && Math.abs(tmpVec.y) < 1.2;
          setCompanionUI(iv ? { x: (tmpVec.x * 0.5 + 0.5) * w, y: (-tmpVec.y * 0.5 + 0.5) * h, hp: cs.hp, maxHp: cs.maxHp, level: cs.level } : null);
        } else { setCompanionUI(null); }

        // Project player head → screen for floating name tag
        if (model && !isMountedRef.current) {
          tmpVec.set(model.position.x, model.position.y + 2.6, model.position.z); tmpVec.project(camera);
          const ivP = tmpVec.z > -1 && tmpVec.z < 1 && Math.abs(tmpVec.x) < 1.2 && Math.abs(tmpVec.y) < 1.2;
          setPlayerNameUI(ivP ? { x: (tmpVec.x * 0.5 + 0.5) * w, y: (-tmpVec.y * 0.5 + 0.5) * h } : null);
        } else { setPlayerNameUI(null); }
        // Project remote-player heads → mic icons + capture feet projections for duel markers
        const rmUI = []; const rmFeet = {};
        const rm = remoteManagerRef.current?.getRemotes?.();
        if (rm) rm.forEach((r, pid) => {
          if (!r.group) return;
          tmpVec.set(r.group.position.x, r.group.position.y + 2.6, r.group.position.z); tmpVec.project(camera);
          if (tmpVec.z > -1 && tmpVec.z < 1 && Math.abs(tmpVec.x) < 1.2 && Math.abs(tmpVec.y) < 1.2) rmUI.push({ id: pid, x: (tmpVec.x * 0.5 + 0.5) * w, y: (-tmpVec.y * 0.5 + 0.5) * h });
          tmpVec.set(r.group.position.x, r.group.position.y + 0.05, r.group.position.z); tmpVec.project(camera);
          if (tmpVec.z > -1 && tmpVec.z < 1) rmFeet[pid] = { x: (tmpVec.x * 0.5 + 0.5) * w, y: (-tmpVec.y * 0.5 + 0.5) * h };
        });
        setRemoteMicUI(rmUI);
        let lf = null; if (model) { tmpVec.set(model.position.x, model.position.y + 0.05, model.position.z); tmpVec.project(camera); if (tmpVec.z > -1 && tmpVec.z < 1) lf = { x: (tmpVec.x * 0.5 + 0.5) * w, y: (-tmpVec.y * 0.5 + 0.5) * h }; }
        window.__duelFeetPositions = { local: lf, remotes: rmFeet };

        // Sync live boss state → bossStore
        bossEntities.forEach((b) => { updateBoss(b.id, { x: b.group.position.x, z: b.group.position.z, hp: Math.max(0, b.hp), maxHp: b.maxHp, alive: b.alive && !b.dying }); });
      }

      rendererGuard.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      // Mark guard disposed FIRST so any in-flight animate() bails before
      // touching the renderer — prevents the null.trim shadow-map crash.
      rendererGuard.markDisposed();
      cancelAnimationFrame(frameId);
      rendererGuard.dispose();
      window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mouseup', onMouseUp); window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('resize', handleResize);
      window.removeEventListener('playerSkillStrike', handlePlayerSkillStrike);
      window.removeEventListener('playerSkillCastStart', handlePlayerSkillCastStart);
      disposeSkybox?.();
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('contextmenu', onContext);
      window.removeEventListener('webrtcRemoteAction', handleRemoteAction);
      detachBossBus();
      resetCompanionAutoCombat();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
      stopLoopSound('player_walk');
      if (remoteManagerRef.current) { remoteManagerRef.current.dispose(); remoteManagerRef.current = null; }
      remoteCompanionManager.dispose();
      // Slice C — clear scene refs
      if (window.__gw3dScene === scene) window.__gw3dScene = null;
      if (window.__gw3dCamera === camera) window.__gw3dCamera = null;
      window.__gw3dLegacyRemoteManager = null;
      if (window.__gw3dEnemies === enemies) window.__gw3dEnemies = null;
      if (window.__gw3dBosses === bossEntities) window.__gw3dBosses = null;
      window.dispatchEvent(new CustomEvent('gw3dSceneTeardown'));
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />



      {/* Enemy HP bars (liquid-glass) — projected above each enemy's head */}
      {!loading && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {enemiesUI.map((e) => (
            <EnemyHealthBar key={e.id} x={e.x} y={e.y} hp={e.hp} maxHp={e.maxHp} level={e.level} name={e.name} visible />
          ))}
          {/* Companion HP bar above pet's head (when not mounted) */}
          {companionUI && (
            <CompanionHealthBar x={companionUI.x} y={companionUI.y} hp={companionUI.hp} maxHp={companionUI.maxHp} level={companionUI.level} name={companionDefRef.current?.name || 'Companion'} visible />
          )}
          {/* Player name floating above the player character's head */}
          {playerNameUI && playerName && (
            <PlayerNameTag x={playerNameUI.x} y={playerNameUI.y} name={playerName} visible />
          )}
          {/* Liquid-glass mic indicators — above local player when on, and above remote talkers */}
          {playerNameUI && localMicOn && <VoiceMicIndicator x={playerNameUI.x} y={playerNameUI.y} visible />}
          {remoteMicUI.map((r) => talkingPeers[r.id] && (
            <VoiceMicIndicator key={r.id} x={r.x} y={r.y} visible />
          ))}
          {/* Floating "QUEST" labels above quest NPCs */}
          {questNPCsUI.map((q) => (
            <QuestFloatingLabel key={q.id} x={q.x} y={q.y} status={q.status} />
          ))}
          {/* Floating damage & XP numbers */}
          <FloatingDamageNumbers entries={floats} />
        </div>
      )}



      {/* Companion mount prompt */}
      {!loading && (
        <CompanionMountHUD
          nearby={nearbyCompanion}
          mounted={isMounted}
          companionName={companionDefRef.current?.name || 'Companion'}
        />
      )}

      {/* NPC interact prompt (generic NPCs) */}
      {!loading && nearbyNPC && !nearbyQuestNPC && !activeDialogue && !activeQuestDialogue && (
        <div className="absolute left-1/2 bottom-32 -translate-x-1/2 px-5 py-2.5 rounded-full bg-black/70 backdrop-blur-md border border-cyan-400/50 pointer-events-none">
          <div className="flex items-center gap-2 text-sm text-white">
            <span className="px-2 py-0.5 rounded bg-cyan-500/30 border border-cyan-400/40 font-mono text-xs">E</span>
            <span>Talk to <span className="text-cyan-300 font-semibold">{nearbyNPC.name}</span></span>
          </div>
        </div>
      )}

      {/* Quest NPC interact prompt (golden) */}
      {!loading && nearbyQuestNPC && !activeQuestDialogue && !activeDialogue && (
        <div
          className="absolute left-1/2 bottom-32 -translate-x-1/2 px-5 py-2.5 rounded-full pointer-events-none"
          style={{
            background: 'rgba(15, 20, 30, 0.7)',
            backdropFilter: 'blur(14px) saturate(160%)',
            WebkitBackdropFilter: 'blur(14px) saturate(160%)',
            border: '1px solid rgba(250, 204, 21, 0.5)',
            boxShadow: '0 4px 18px rgba(250, 204, 21, 0.25)',
          }}
        >
          <div className="flex items-center gap-2 text-sm text-white">
            <span className="px-2 py-0.5 rounded bg-yellow-500/25 border border-yellow-400/40 font-mono text-xs text-yellow-200">E</span>
            <span>Speak with <span className="text-yellow-300 font-semibold">{nearbyQuestNPC.name}</span></span>
          </div>
        </div>
      )}

      {/* Quest dialogue box */}
      {activeQuestDialogue && (
        <QuestDialogueBox
          npcName={activeQuestDialogue.npcName}
          quest={activeQuestDialogue.quest}
          mode={activeQuestDialogue.mode}
          progress={activeQuestDialogue.progress}
          onAccept={() => {
            acceptQuest(activeQuestDialogue.quest.id);
            playActionSound('quest_accept');
            setActiveQuestDialogue(null);
          }}
          onDecline={() => setActiveQuestDialogue(null)}
          onClose={() => setActiveQuestDialogue(null)}
          onClaim={() => {
            const q = activeQuestDialogue.quest;
            completeQuest(q.id);
            // Pay the reward: XP + stat points
            let newXP = playerXPRef.current + q.reward.xp;
            let newLevel = playerLevelRef.current;
            let needed = xpForLevel(newLevel);
            let levelsGained = 0;
            while (newXP >= needed) {
              newXP -= needed;
              newLevel += 1;
              levelsGained += 1;
              needed = xpForLevel(newLevel);
            }
            playerXPRef.current = newXP;
            playerLevelRef.current = newLevel;
            setPlayerXP(newXP);
            setPlayerLevel(newLevel);
            // Award levels-from-XP plus the quest's direct stat points bonus
            awardXP({
              newLevel,
              newXP,
              xpForNext: xpForLevel(newLevel),
              levelsGained,
              bonusPoints: q.reward.points,
              xpGained: q.reward.xp,
            });
            playActionSound('quest_complete');
            if (levelsGained > 0) playActionSound('level_up');
            setActiveQuestDialogue(null);
          }}
        />
      )}

      {/* Dialogue box */}
      {activeDialogue && (
        <div className="absolute left-1/2 bottom-8 -translate-x-1/2 w-[600px] max-w-[90%] rounded-xl bg-black/80 backdrop-blur-md border border-cyan-400/40 p-5">
          <div className="text-cyan-300 font-bold text-sm tracking-wider uppercase mb-2">{activeDialogue.name}</div>
          <div className="text-white/90 text-sm leading-relaxed mb-3">{activeDialogue.text}</div>
          <button
            onClick={() => setActiveDialogue(null)}
            className="px-4 py-1.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-bold tracking-wider uppercase transition-all"
          >
            Close
          </button>
        </div>
      )}

      {/* Equipment menu (I) — Where Winds Meet–style layout */}
      <EquipmentMenu open={equipmentOpen} onClose={() => setEquipmentOpen(false)} />
      <PlayerInteractionMenu
        open={!!playerMenu}
        x={playerMenu?.x || 0}
        y={playerMenu?.y || 0}
        player={playerMenu?.player}
        onClose={() => setPlayerMenu(null)}
        onAction={(action, p) => {
          window.dispatchEvent(new CustomEvent('gamePlayerAction', { detail: { action, playerId: p.id, playerName: p.name } }));
        }}
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
            <span className="text-white/70 text-sm tracking-wider">Loading world...</span>
          </div>
        </div>
      )}
    </div>
  );
}