import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Loader2 } from 'lucide-react';
import EnemyHealthBar from './EnemyHealthBar';
import PlayerXPHUD from './PlayerXPHUD';
import QuestFloatingLabel from './QuestFloatingLabel';
import QuestDialogueBox from './QuestDialogueBox';
import { setPlayerHUD, awardXP, subscribePlayerHUD, getPlayerHUD, setHP } from './playerHUDStore';
import {
  DEFAULT_PLAYER_STATS,
  ENEMY_STAT_TEMPLATES,
  computeDerivedStats,
  calculateHit,
} from './statsSystem';
import { QUEST_NPCS, QUESTS, getAvailableQuestForNPC } from './questData';
import {
  acceptQuest,
  completeQuest,
  reportEnemyKill,
  subscribeQuests,
  getQuestState,
} from './useQuestStore';
import { playActionSound, startLoopSound, stopLoopSound } from './combatAudioStore';
import { setPlayerPosition } from './playerPositionStore';
import { CREATURE_MODEL_URL, CREATURE_ANIMATION_URLS } from './creatureAssets';
import { LOWPOLY_MAP_URL, createLowPolyLoadingManager } from './lowPolyMapAssets';
import { BOSSES, BOSS_SCALE_MULT, BOSS_HP_MULT, BOSS_XP_MULT } from './bossData';
import { setBosses, updateBoss } from './bossStore';
import EquipmentMenu from './equipment/EquipmentMenu';

// ─────────────────────────────────────────────
// XP / Level system
// XP_TABLE[n] = XP required to reach level n+2 from level n+1.
// Hand-tuned (non-multiplicative) curve: 5, 7, 14, 22, 35, 50, 70, 95, 125, 160.
// Normal enemies drop 1 XP, elites 3 XP, champions 5 XP — so stronger enemies
// level you with only 4-5 kills.
// ─────────────────────────────────────────────
const XP_TABLE = [5, 7, 14, 22, 35, 50, 70, 95, 125, 160];
const xpForLevel = (level) => XP_TABLE[Math.min(level - 1, XP_TABLE.length - 1)] || 200;

// Enemy tier definitions — HP/damage/defense now come from ENEMY_STAT_TEMPLATES
// via the shared statsSystem. Only visual + XP/level metadata lives here.
const ENEMY_TIERS = [
  { name: 'normal',   weight: 0.70, xp: 1, level: 1, scale: 1.0,  tintMix: 0.55 },
  { name: 'elite',    weight: 0.22, xp: 3, level: 2, scale: 1.15, tintMix: 0.70 },
  { name: 'champion', weight: 0.08, xp: 5, level: 4, scale: 1.30, tintMix: 0.85 },
];
const pickTier = () => {
  const r = Math.random();
  let acc = 0;
  for (const t of ENEMY_TIERS) { acc += t.weight; if (r < acc) return t; }
  return ENEMY_TIERS[0];
};

const ARCHER_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/3f915913a_ErikaArcher.fbx';
const ANIMATION_URLS = {
  idle:  'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/9922e6dd0_Idle.fbx',
  run:   'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/4edd51169_Running.fbx',
  jump:  'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/b1e388a25_Jumping.fbx',
  kick:  'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/d4d6d9112_standingmeleekick.fbx',
  roll:  'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/c9ba745cd_SprintingForwardRoll.fbx',
  death: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/183d60083_standingdeathforward01.fbx',
};

const DEATH_FADE_DELAY = 5.0; // seconds the corpse stays on the ground before vanishing

const WALK_SPEED = 4.0;
const RUN_SPEED = 9.0;
const ROT_SMOOTH = 0.18;
const BLEND = 0.2;

/**
 * GameWorld3D - Renders a 3D game world with the female archer character.
 * Camera follows behind the character. WASD to move (rotates character),
 * mouse drag to orbit camera.
 */
// NPC spawn positions + dialogue
const NPC_SPAWNS = [
  { id: 'npc_elara', name: 'Elara the Guide', pos: [6, 0.3, 6], color: 0x4a90e2, dialogue: "Welcome, traveler! The arena ahead is full of restless spirits — defeat them to prove your worth." },
  { id: 'npc_borin', name: 'Borin the Blacksmith', pos: [-7, 0.3, 4], color: 0xe2a04a, dialogue: "Need stronger arrows? Come back when you've slain a few enemies and I'll forge you something special." },
  { id: 'npc_sage', name: 'Sage Mira', pos: [0, 0.3, 12], color: 0xa04ae2, dialogue: "The runes whisper of an ancient power buried beneath the platform. Be careful where you tread." },
];

// Enemy zones — each zone spawns ~15 mobs roaming around a center point.
const ENEMY_ZONES = [
  { id: 'zone_north', center: [14, 0.3, -10], radius: 9, count: 15 },
  { id: 'zone_south', center: [-12, 0.3, 12],  radius: 9, count: 15 },
];

// Build flat spawn list with randomized positions inside each zone.
const ENEMY_SPAWNS = ENEMY_ZONES.flatMap((zone) =>
  Array.from({ length: zone.count }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * zone.radius;
    return {
      id: `${zone.id}_${i}`,
      zoneId: zone.id,
      zoneCenter: zone.center,
      zoneRadius: zone.radius,
      home: [
        zone.center[0] + Math.cos(angle) * dist,
        zone.center[1],
        zone.center[2] + Math.sin(angle) * dist,
      ],
    };
  })
);

const ENEMY_SPEED = 1.2;
const ENEMY_WALK_TIME = 3.0;   // seconds walking
const ENEMY_IDLE_TIME = 5.0;   // seconds idle
const ENEMY_WANDER_RADIUS = 4; // how far they pick a new walk target
const NPC_INTERACT_RANGE = 3.5;
const ENEMY_ATTACK_RANGE = 2.0;
const ENEMY_ATTACK_COOLDOWN = 2.2;     // seconds between enemy attacks
const ENEMY_ATTACK_WINDUP = 0.4;       // seconds before damage actually lands (mid-anim)
const PLAYER_ATTACK_COOLDOWN = 0.6;    // seconds between player left-click attacks
const PLAYER_INVUL_AFTER_HIT = 0.5;    // brief i-frames after taking a hit

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
  const playerLevelRef = useRef(1);
  const playerXPRef = useRef(0);
  // Player stats: base allocation + equipped gear → derived combat values.
  // (Equipment is empty for now — plug in your equip system here later.)
  const playerBaseStatsRef = useRef({ ...DEFAULT_PLAYER_STATS });
  const playerEquipmentRef = useRef([]);
  const playerDerivedRef = useRef(
    computeDerivedStats(DEFAULT_PLAYER_STATS, [])
  );
  const keys = useRef({});
  const drag = useRef({ active: false, x: 0, y: 0 });
  const orbit = useRef({ yaw: 0, pitch: 0.4, distance: 4.5 });
  const nearbyNPCRef = useRef(null);
  const interactPressed = useRef(false);
  const attackPressed = useRef(false);
  const oneShotPlaying = useRef(false);
  const playerAttackCooldown = useRef(0);
  const playerInvulTimer = useRef(0);
  const nearbyQuestNPCRef = useRef(null);
  const playerLevelStateRef = useRef(1); // kept in sync with playerLevel for quest gating

  // Seed the shared progression store with the player's initial state so the
  // HUD and Character Progression menu have real data from the start.
  useEffect(() => {
    setPlayerHUD({
      level: 1,
      xp: 0,
      xpForNext: xpForLevel(1),
      baseStats: { ...DEFAULT_PLAYER_STATS },
      unspentPoints: 0,
      derived: playerDerivedRef.current,
      hp: playerDerivedRef.current.maxHP,
      maxHP: playerDerivedRef.current.maxHP,
    });
  }, []);

  // Subscribe to quest store so React re-renders when quests are accepted/completed
  useEffect(() => {
    return subscribeQuests((s) => setQuestState({ ...s }));
  }, []);

  // Keep a ref of the latest player level for the animation loop to read
  useEffect(() => {
    playerLevelStateRef.current = playerLevel;
  }, [playerLevel]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Scene — tropical sky/ocean tint to match the Volcano Island map
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x88c4e8, 60, 220);
    scene.background = new THREE.Color(0x88c4e8);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Camera
    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 200);
    camera.position.set(0, 3, -5);

    // Lights
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

    // Backdrop ocean plane (large, low) so the horizon isn't empty
    const oceanGeo = new THREE.PlaneGeometry(400, 400);
    const oceanMat = new THREE.MeshStandardMaterial({ color: 0x2a6a9a, roughness: 0.4, metalness: 0.1 });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -0.4;
    ocean.receiveShadow = true;
    scene.add(ocean);

    // ─────────────────────────────────────────────
    // LOW-POLY ENVIRONMENT MAP (scene.gltf bundle).
    // Loaded with a LoadingManager that rewrites relative .bin/texture URLs
    // to the Base44 bundle URLs from the admin AssetFile manifest.
    // After load, "groundMeshes" is filled so every entity (player, enemies,
    // quest NPCs) can raycast straight down and stand on the real surface.
    // ─────────────────────────────────────────────
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

    const mapLoadingManager = createLowPolyLoadingManager(THREE);
    const mapLoader = new GLTFLoader(mapLoadingManager);
    mapLoader.load(
      LOWPOLY_MAP_URL,
      (gltf) => {
        const root = gltf.scene || gltf.scenes?.[0];
        if (!root) {
          console.error('Low-poly map: GLTF has no scene');
          return;
        }

        // Scale up — we want a large walkable arena (~140u across)
        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.z);
        const mapScale = maxDim > 0 ? 140 / maxDim : 1;
        root.scale.setScalar(mapScale);

        // Re-center on XZ and place its base at y=0 so spawn snapping is easy
        const box2 = new THREE.Box3().setFromObject(root);
        const center = box2.getCenter(new THREE.Vector3());
        root.position.x -= center.x;
        root.position.z -= center.z;
        root.position.y -= box2.min.y;

        // Collect ground meshes for raycasting; textures are already applied by GLTFLoader
        root.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = false;
            node.receiveShadow = true;
            groundMeshes.push(node);
          }
        });

        scene.add(root);
        mapReady = true;

        // Snap any entities that spawned before the map was ready
        pendingFootings.forEach((fn) => fn());
        pendingFootings.length = 0;
      },
      undefined,
      (err) => {
        console.error('Low-poly map load error:', err);
        // Fallback: keep a flat green ground so the scene still works
        const fallback = new THREE.Mesh(
          new THREE.PlaneGeometry(140, 140),
          new THREE.MeshStandardMaterial({ color: 0x4a6b3a, roughness: 0.95 }),
        );
        fallback.rotation.x = -Math.PI / 2;
        fallback.receiveShadow = true;
        scene.add(fallback);
        groundMeshes.push(fallback);
        mapReady = true;
        pendingFootings.forEach((fn) => fn());
        pendingFootings.length = 0;
      },
    );

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

    // ─────────────────────────────────────────────
    // NPC SPAWNS (talk targets — blue/orange/purple capsules with name label)
    // ─────────────────────────────────────────────
    const npcs = []; // { id, name, dialogue, mesh, ringMesh }
    NPC_SPAWNS.forEach((spawn) => {
      const group = new THREE.Group();
      group.position.set(spawn.pos[0], spawn.pos[1], spawn.pos[2]);

      // Body
      const bodyGeo = new THREE.CapsuleGeometry(0.45, 1.0, 4, 8);
      const bodyMat = new THREE.MeshStandardMaterial({ color: spawn.color, roughness: 0.6, emissive: spawn.color, emissiveIntensity: 0.15 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.95;
      body.castShadow = true;
      group.add(body);

      // Head
      const headGeo = new THREE.SphereGeometry(0.3, 12, 12);
      const head = new THREE.Mesh(headGeo, bodyMat);
      head.position.y = 1.85;
      head.castShadow = true;
      group.add(head);

      // Friendly indicator ring (glowing on ground)
      const ringGeo = new THREE.RingGeometry(0.7, 0.9, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x4ade80, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.02;
      group.add(ring);

      scene.add(group);
      npcs.push({ ...spawn, mesh: group, ringMesh: ring });
      // Stand the capsule on the terrain (feet at ground)
      snapToGround(group, 0);
    });

    // Shared FBX loader (used for player + enemies + quest NPCs)
    const loader = new FBXLoader();
    const clock = new THREE.Clock();

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

    // ─────────────────────────────────────────────
    // QUEST NPCs — 5 female archers at fixed positions, idle animation,
    // NATURAL COLOR (no red tint). Floating "QUEST" label rendered in DOM.
    // ─────────────────────────────────────────────
    const questNPCs = []; // { id, name, group, mixer, idleAction }
    QUEST_NPCS.forEach((spawn) => {
      loader.load(ARCHER_URL, (fbx) => {
        const m = fbx;
        const box = new THREE.Box3().setFromObject(fbx);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.7 / maxDim;
        m.scale.setScalar(scale);
        m.position.set(spawn.pos[0], spawn.pos[1], spawn.pos[2]);
        // Random facing so they don't all look the same way
        m.rotation.y = Math.random() * Math.PI * 2;

        // Light emissive tint per NPC so each is visually distinct (subtle, not red)
        m.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = !node.isSkinnedMesh;
            node.receiveShadow = true;
            if (node.material) {
              const mats = Array.isArray(node.material) ? node.material : [node.material];
              const tinted = mats.map((mat) => {
                const c = mat.clone();
                c.emissive = new THREE.Color(spawn.tint);
                c.emissiveIntensity = 0.08;
                return c;
              });
              node.material = Array.isArray(node.material) ? tinted : tinted[0];
            }
          }
        });

        // Friendly golden ground ring marking this as a quest giver
        const ringGeo = new THREE.RingGeometry(0.7 / scale, 0.95 / scale, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xfacc15,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.55,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.02 / scale;
        m.add(ring);

        scene.add(m);
        // Stand the quest NPC's feet on the terrain
        snapToGround(m, 0);

        const npcMixer = new THREE.AnimationMixer(m);
        const npcEntry = {
          id: spawn.id,
          name: spawn.name,
          group: m,
          mixer: npcMixer,
          idleAction: null,
          ringMesh: ring,
        };
        questNPCs.push(npcEntry);

        // Attach the dedicated archer-idle clip (NOT the enemy mutant idle)
        questNPCIdleClipPromise.then((clip) => {
          if (clip && npcMixer) {
            const action = npcMixer.clipAction(clip);
            // Slightly randomize timeScale so they don't all idle in sync
            action.setEffectiveTimeScale(0.9 + Math.random() * 0.2);
            npcEntry.idleAction = action;
            action.reset().fadeIn(0.3).play();
          }
        });
      });
    });

    // ─────────────────────────────────────────────
    // ENEMY SPAWNS (female archer model patrolling between waypoints)
    // Same archer FBX as the player, tinted red, with walk (Running.fbx) animation looped
    // ─────────────────────────────────────────────
    const enemies = []; // { id, group, mixer, walkAction, idleAction, state, stateTimer, target, alive, hitCooldown, tintMaterials, zoneCenter, zoneRadius }

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

    // ─────────────────────────────────────────────
    // WORLD BOSS SPAWNS — supersized champion enemies at fixed map locations.
    // Same creature model + AI as normal enemies, but:
    //   • Scale         ×BOSS_SCALE_MULT (7) of a normal champion
    //   • Max HP        ×BOSS_HP_MULT    (8) of the champion template
    //   • XP reward     ×BOSS_XP_MULT    (15) of a normal enemy
    // Seeded into the bossStore so OnlinePlayersPanel/BossWaypoint can subscribe.
    // ─────────────────────────────────────────────
    const bossEntities = []; // refs into the `enemies` array, kept so we can push HP/pos to the store
    setBosses(BOSSES.map((b) => ({
      id: b.id, name: b.name, title: b.title,
      x: b.pos[0], z: b.pos[2],
      hp: 0, maxHp: 0, alive: true,
    })));

    BOSSES.forEach((bossDef) => {
      loader.load(CREATURE_MODEL_URL, (fbx) => {
        const bossModel = fbx;
        const champBase = ENEMY_STAT_TEMPLATES.champion;
        const champDerived = computeDerivedStats(champBase, []);
        const bossMaxHp = champDerived.maxHP * BOSS_HP_MULT;
        // Boss derived stats: champion damage + scaled HP
        const bossDerived = { ...champDerived, maxHP: bossMaxHp };

        // Scale = same auto-size as normal enemies, then ×7 for boss
        const box = new THREE.Box3().setFromObject(fbx);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const bossScale = (1.7 / maxDim) * BOSS_SCALE_MULT;
        bossModel.scale.setScalar(bossScale);
        bossModel.position.set(bossDef.pos[0], bossDef.pos[1], bossDef.pos[2]);

        // Track mesh materials for the death-fade pass
        const tintMaterials = [];
        bossModel.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = !node.isSkinnedMesh;
            node.receiveShadow = true;
            if (node.material) {
              const mats = Array.isArray(node.material) ? node.material : [node.material];
              mats.forEach((m) => tintMaterials.push(m));
            }
          }
        });

        // Big menacing ring with boss-specific color
        const ringGeo = new THREE.RingGeometry(1.1 / bossScale, 1.4 / bossScale, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: bossDef.color, side: THREE.DoubleSide, transparent: true, opacity: 0.7,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.02 / bossScale;
        bossModel.add(ring);

        scene.add(bossModel);
        snapToGround(bossModel, 0);

        const bossMixer = new THREE.AnimationMixer(bossModel);
        // Bosses are stationary sentinels until aggro'd; reuse enemy AI shape
        // but set state to 'idle' and never wander (zoneRadius=0).
        const bossEntry = {
          id: bossDef.id,
          group: bossModel,
          mixer: bossMixer,
          walkAction: null,
          idleAction: null,
          state: 'idle',
          stateTimer: 0,
          target: null,
          alive: true,
          hitCooldown: 0,
          tintMaterials,
          zoneCenter: bossDef.pos,
          zoneRadius: 0, // never wanders
          tier: 'boss',
          level: 10,
          hp: bossMaxHp,
          maxHp: bossMaxHp,
          derived: bossDerived,
          xpReward: BOSS_XP_MULT, // normal mob drops 1 XP → boss drops 15
          attackCooldown: Math.random() * 1.5,
          attacking: false,
          attackWindupTimer: 0,
          isBoss: true,
          bossName: bossDef.name,
        };
        enemies.push(bossEntry);
        bossEntities.push(bossEntry);

        // Seed the store with real HP now that we know maxHp
        updateBoss(bossDef.id, { hp: bossMaxHp, maxHp: bossMaxHp, alive: true });

        Promise.all([walkClipPromise, idleClipPromise]).then(([walkClip, idleClip]) => {
          if (walkClip) {
            const wa = bossMixer.clipAction(walkClip);
            wa.setEffectiveTimeScale(0.55);
            bossEntry.walkAction = wa;
          }
          if (idleClip) bossEntry.idleAction = bossMixer.clipAction(idleClip);
          if (bossEntry.idleAction) bossEntry.idleAction.reset().fadeIn(0.2).play();
        });
      });
    });

    ENEMY_SPAWNS.forEach((spawn) => {
      loader.load(CREATURE_MODEL_URL, (fbx) => {
        const enemyModel = fbx;
        const tier = pickTier();
        // Randomize level a bit around the tier's base
        const enemyLevel = tier.level + Math.floor(Math.random() * 2); // tier.level or tier.level+1
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
          tier: tier.name,
          level: enemyLevel,
          hp: enemyDerived.maxHP,
          maxHp: enemyDerived.maxHP,
          derived: enemyDerived,
          xpReward: tier.xp,
          attackCooldown: Math.random() * 1.5, // stagger initial attacks
          attacking: false,
          attackWindupTimer: 0,
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

    // Load the female archer + animations
    let mixer;
    let model;
    const actions = {};
    let currentActionName = 'idle';

    const playAction = (name, timeScale = 1) => {
      const next = actions[name];
      if (!next || currentActionName === name) return;
      const prev = actions[currentActionName];
      next.enabled = true;
      next.setEffectiveTimeScale(timeScale);
      next.setEffectiveWeight(1);
      next.reset().fadeIn(BLEND).play();
      if (prev) prev.fadeOut(BLEND);
      currentActionName = name;
    };

    loader.load(ARCHER_URL, (fbx) => {
      model = fbx;
      const box = new THREE.Box3().setFromObject(fbx);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 1.7 / maxDim;
      fbx.scale.setScalar(scale);
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

      // Load all animations in parallel — skip 'death' (used only on enemies)
      const entries = Object.entries(ANIMATION_URLS).filter(([n]) => n !== 'death');
      const ONE_SHOTS = new Set(['jump', 'kick', 'roll']);
      let loaded = 0;
      entries.forEach(([name, url]) => {
        loader.load(url, (animFbx) => {
          if (animFbx.animations?.length > 0) {
            const clip = animFbx.animations[0];
            clip.name = name;
            const action = mixer.clipAction(clip);
            if (ONE_SHOTS.has(name)) {
              action.setLoop(THREE.LoopOnce);
              action.clampWhenFinished = true;
            }
            actions[name] = action;
          }
          loaded++;
          if (loaded === entries.length) {
            if (actions.idle) {
              actions.idle.reset().fadeIn(0.2).play();
              currentActionName = 'idle';
            }
            setLoading(false);
          }
        }, undefined, () => {
          loaded++;
          if (loaded === entries.length) setLoading(false);
        });
      });

      // When any one-shot finishes, release the lock and blend back to idle
      mixer.addEventListener('finished', (e) => {
        const finishedName = e.action?.getClip()?.name;
        if (ONE_SHOTS.has(finishedName)) {
          oneShotPlaying.current = false;
          if (actions.idle) {
            actions.idle.reset().fadeIn(0.15).play();
            currentActionName = 'idle';
          }
        }
      });
    }, undefined, (err) => {
      console.error('Archer load error:', err);
      setLoading(false);
    });

    // Controls
    const playOneShot = (name, timeScale = 1) => {
      const action = actions[name];
      if (!action || !model || oneShotPlaying.current) return;
      oneShotPlaying.current = true;
      const prev = actions[currentActionName];
      if (prev && prev !== action) prev.fadeOut(0.1);
      action.setEffectiveTimeScale(timeScale);
      action.reset().fadeIn(0.1).play();
      currentActionName = name;
    };

    const onKeyDown = (e) => {
      if (e.target?.matches?.('input, textarea')) return;
      const k = e.key.toLowerCase();
      keys.current[k] = true;
      // Space = jump (one-shot)
      if (k === ' ') { playOneShot('jump', 1); playActionSound('player_jump'); e.preventDefault(); }
      // Q = kick
      if (k === 'q') playOneShot('kick', 1.2);
      // R = roll
      if (k === 'r') playOneShot('roll', 1.3);
      // E = interact with nearby NPC
      if (k === 'e') interactPressed.current = true;
      // F = attack nearest enemy
      if (k === 'f') attackPressed.current = true;
      // I = toggle equipment menu (Where Winds Meet style)
      if (k === 'i') { setEquipmentOpen((v) => !v); e.preventDefault(); }
    };
    const onKeyUp = (e) => { keys.current[e.key.toLowerCase()] = false; };
    const onMouseDown = (e) => {
      // Left click = attack, right/middle click = orbit camera drag
      if (e.button === 0) {
        attackPressed.current = true;
      } else {
        drag.current = { active: true, x: e.clientX, y: e.clientY };
      }
    };
    const onMouseUp = () => { drag.current.active = false; };
    const onMouseMove = (e) => {
      if (!drag.current.active) return;
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      drag.current.x = e.clientX;
      drag.current.y = e.clientY;
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

    // Animation loop
    let frameId;
    let uiFrameCounter = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);

      // Movement
      if (model) {
        const isRunning = !!keys.current['shift'];
        const speed = isRunning ? RUN_SPEED : WALK_SPEED;
        const yaw = orbit.current.yaw;
        const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
        const rx = -Math.cos(yaw), rz = Math.sin(yaw);
        const move = new THREE.Vector3();
        if (keys.current['w']) { move.x += fx; move.z += fz; }
        if (keys.current['s']) { move.x -= fx; move.z -= fz; }
        if (keys.current['a']) { move.x += rx; move.z += rz; }
        if (keys.current['d']) { move.x -= rx; move.z -= rz; }

        const isMoving = move.lengthSq() > 0;
        if (isMoving) {
          move.normalize();
          model.position.x += move.x * speed * delta;
          model.position.z += move.z * speed * delta;
          const angle = Math.atan2(move.x, move.z);
          const targetQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
          model.quaternion.slerp(targetQ, ROT_SMOOTH);
        }
        // Glue player feet to the terrain every frame (volcano map has elevation)
        if (mapReady) {
          const gy = sampleGroundY(model.position.x, model.position.z);
          if (gy !== null) model.position.y = gy;
        }

        // Animation state machine — only when not playing a one-shot (kick/roll)
        // Match the dashboard YBotPlayerViewer feel exactly:
        //   • Run (shift held) plays the Running clip at native 1.0× — looks natural,
        //     not whipped. The dashboard uses 1.0× and never speeds it up.
        //   • Walk (no shift) plays the same Running clip at 0.5× — smooth slow jog
        //     instead of a stiff in-place stride.
        if (!oneShotPlaying.current) {
          if (isMoving) {
            playAction('run', isRunning ? 1.0 : 0.5);
          } else {
            playAction('idle', 1);
          }
        }

        // Walk/run SFX loop — start/stop based on movement
        if (isMoving) {
          startLoopSound('player_walk', { volume: isRunning ? 0.6 : 0.4 });
        } else {
          stopLoopSound('player_walk');
        }

        // Broadcast live player position + facing to the HUD minimap store
        setPlayerPosition({
          x: model.position.x,
          z: model.position.z,
          yaw: orbit.current.yaw,
        });

        // Also broadcast to the multiplayer presence system (same event Luna dashboard uses)
        // so MultiplayerSystem can keep us "online" and let other players see our position.
        window.dispatchEvent(new CustomEvent('multiplayerLocalUpdate', {
          detail: {
            x: model.position.x,
            y: model.position.y,
            z: model.position.z,
            yaw: orbit.current.yaw,
            anim: isMoving ? (isRunning ? 'run' : 'walk') : 'idle',
          },
        }));

        // Camera follow
        const o = orbit.current;
        const camX = model.position.x + o.distance * Math.sin(o.yaw) * Math.cos(o.pitch);
        const camY = model.position.y + 1 + o.distance * Math.sin(o.pitch);
        const camZ = model.position.z + o.distance * Math.cos(o.yaw) * Math.cos(o.pitch);
        camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.15);
        camera.lookAt(model.position.x, model.position.y + 1, model.position.z);

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

          // Death sequence: play death anim, wait 5s on the ground, then fade out & remove
          if (enemy.dying) {
            enemy.deathTimer += delta;
            if (enemy.deathTimer >= DEATH_FADE_DELAY) {
              // Fade out over ~0.8s by decreasing material opacity
              const fadeT = Math.min(1, (enemy.deathTimer - DEATH_FADE_DELAY) / 0.8);
              enemy.tintMaterials.forEach(m => {
                m.transparent = true;
                m.opacity = 1 - fadeT;
              });
              if (fadeT >= 1) {
                enemy.alive = false;
                scene.remove(enemy.group);
                if (enemy.mixer) enemy.mixer.stopAllAction();
                const aliveCount = enemies.filter(e => e.alive && !e.dying).length;
                setEnemyCount(aliveCount);
              }
            }
            return; // skip wander logic while dying
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
              if (playerInRange && playerInvulTimer.current <= 0) {
                const playerDerived = getPlayerHUD().derived || playerDerivedRef.current;
                let dmg = calculateHit(enemy.derived, playerDerived);
                // Scale by level difference: enemies higher level hit harder
                const levelDiff = enemy.level - playerLevelRef.current;
                if (levelDiff > 0) dmg = Math.round(dmg * (1 + levelDiff * 0.25));
                else if (levelDiff < 0) dmg = Math.max(1, Math.round(dmg * Math.max(0.4, 1 + levelDiff * 0.15)));
                const newHP = Math.max(0, getPlayerHUD().hp - dmg);
                setHP(newHP);
                playActionSound('player_hit');
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

        // ─── Tick player cooldowns ───
        if (playerAttackCooldown.current > 0) playerAttackCooldown.current -= delta;
        if (playerInvulTimer.current > 0) playerInvulTimer.current -= delta;

        // ─── Player attack: Left-click or F. Plays kick animation + damages nearest enemy in range ───
        if (attackPressed.current) {
          attackPressed.current = false;
          if (playerAttackCooldown.current <= 0) {
            playerAttackCooldown.current = PLAYER_ATTACK_COOLDOWN;
            // Play attack animation (reusing kick as the melee attack)
            playOneShot('kick', 1.4);
            playActionSound('player_attack');
          }
          let closestEnemy = null;
          let closestEnemyDist = ENEMY_ATTACK_RANGE;
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
            const dmg = calculateHit(liveDerived, closestEnemy.derived);
            closestEnemy.hp -= dmg;
            closestEnemy.hitCooldown = 0.25;
            playActionSound('enemy_hit');
            if (closestEnemy.hp <= 0) {
              playActionSound('enemy_death');
              // Lethal — start death sequence
              closestEnemy.hp = 0;
              closestEnemy.dying = true;
              closestEnemy.deathTimer = 0;
              if (closestEnemy.walkAction) closestEnemy.walkAction.fadeOut(0.15);
              if (closestEnemy.idleAction) closestEnemy.idleAction.fadeOut(0.15);
              if (cachedDeathClip && closestEnemy.mixer) {
                const deathAction = closestEnemy.mixer.clipAction(cachedDeathClip);
                deathAction.setLoop(THREE.LoopOnce);
                deathAction.clampWhenFinished = true;
                deathAction.reset().fadeIn(0.15).play();
                closestEnemy.deathAction = deathAction;
              }
              setScore(prev => prev + 100 * closestEnemy.xpReward);
              // Tell the quest store about this kill (advances any active kill quests)
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
              awardXP({ newLevel, newXP, xpForNext: xpForLevel(newLevel), levelsGained });
              if (levelsGained > 0) playActionSound('level_up');
            }
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

        // ─── Sync live boss state (pos + HP + alive) to bossStore ───
        // Drives the waypoint guidance and the Boss tab list.
        bossEntities.forEach((b) => {
          updateBoss(b.id, {
            x: b.group.position.x,
            z: b.group.position.z,
            hp: Math.max(0, b.hp),
            maxHp: b.maxHp,
            alive: b.alive && !b.dying,
          });
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('contextmenu', onContext);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
      stopLoopSound('player_walk');
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* HUD: Score + Enemy count + Player Level/XP */}
      {!loading && (
        <div className="absolute top-4 left-4 flex gap-3 pointer-events-none">
          <div className="px-4 py-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10">
            <div className="text-[10px] text-white/50 font-bold tracking-[0.2em] uppercase">Score</div>
            <div className="text-xl font-bold text-yellow-300">{score}</div>
          </div>
          <div className="px-4 py-2 rounded-lg bg-black/60 backdrop-blur-md border border-red-500/30">
            <div className="text-[10px] text-red-300/70 font-bold tracking-[0.2em] uppercase">Enemies</div>
            <div className="text-xl font-bold text-red-300">{enemyCount}</div>
          </div>
          <PlayerXPHUD level={playerLevel} xp={playerXP} xpForNext={xpForLevel(playerLevel)} />
        </div>
      )}

      {/* Enemy HP bars (liquid-glass) — projected above each enemy's head */}
      {!loading && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {enemiesUI.map((e) => (
            <EnemyHealthBar
              key={e.id}
              x={e.x}
              y={e.y}
              hp={e.hp}
              maxHp={e.maxHp}
              level={e.level}
              visible
            />
          ))}
          {/* Floating "QUEST" labels above quest NPCs */}
          {questNPCsUI.map((q) => (
            <QuestFloatingLabel key={q.id} x={q.x} y={q.y} status={q.status} />
          ))}
        </div>
      )}

      {/* Controls hint */}
      {!loading && (
        <div className="absolute top-4 right-4 px-4 py-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 pointer-events-none">
          <div className="text-[10px] text-white/50 font-bold tracking-[0.2em] uppercase mb-1">Controls</div>
          <div className="text-xs text-white/80 space-y-0.5">
            <div><span className="text-cyan-300 font-mono">WASD</span> Move · <span className="text-cyan-300 font-mono">Shift</span> Run</div>
            <div><span className="text-cyan-300 font-mono">Space</span> Jump · <span className="text-red-300 font-mono">L-Click</span>/<span className="text-cyan-300 font-mono">F</span> Attack</div>
            <div><span className="text-cyan-300 font-mono">Q</span> Kick · <span className="text-cyan-300 font-mono">R</span> Roll</div>
            <div><span className="text-cyan-300 font-mono">E</span> Talk to NPC · <span className="text-yellow-300 font-mono">C</span> Character · <span className="text-amber-300 font-mono">I</span> Equipment</div>
          </div>
        </div>
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