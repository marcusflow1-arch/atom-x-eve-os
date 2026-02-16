import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ArrowLeft, Settings,
  Home, BookOpen, Zap, Sword, Gamepad2, Target, Layers,
  ChevronLeft, ChevronRight, User, Trophy, MessageSquare, Shield, Swords, Bot, Crown, Radio, Users, Globe,
  Grid, ArrowUpAz, ArrowDownAz, ArrowUp, ArrowDown, GripVertical, Clapperboard,
  Film, Sparkles, Play, ShoppingBag, Tv, Monitor, Mountain, Feather, Calendar, Hammer
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { base44 } from '@/api/base44Client';
import InventoryPanel from '../components/profile/InventoryPanel';
import LunaStatsPanel from '../components/profile/LunaStatsPanel';
import LunaCardScroll from '../components/profile/LunaCardScroll';
import SettingsPanel from '../components/dashboard/SettingsPanel';
import LoadoutPanel from '../components/dashboard/LoadoutPanel';
import GenreMastery from './GenreMastery';
import BattleModeOverlay from '../components/dashboard/BattleModeOverlay';
import AIHomeOverlay from '../components/dashboard/AIHomeOverlay';
import AIStoryOverlay from '../components/dashboard/AIStoryOverlay';
import AINewsContent from '../components/dashboard/AINewsContent';
import SeasonalPassContent from '../components/dashboard/SeasonalPassContent';
import ShinyCard from '../components/shared/ShinyCard';
import HolographicTile from '@/components/dashboard/HolographicTile';
import CardEnhancementOverlay from '../components/profile/CardEnhancementOverlay';
import { inventoryData, profileData } from '../components/profile/mockData';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useDashboardMode } from '../components/dashboard/DashboardModeContext';
import UserInterfaceView from '../components/dashboard/views/UserInterfaceView';
import PinGamesContent from '../components/dashboard/PinGamesContent';
import StreamingDiscovery from '../components/streaming/StreamingDiscovery';
import SocialHub from '../components/dashboard/SocialHub';
import UserProfileOverlay from '../components/profile/UserProfileOverlay';
import FriendInteractionPanel from '../components/friends/FriendInteractionPanel';
import FriendRequestsPanel from '../components/friends/FriendRequestsPanel';
import { useAuth } from '../components/auth/AuthContext';
import IntelligentCalendarOverlay from '../components/calendar/IntelligentCalendarOverlay';
import PlatformUpdateModal from '../components/calendar/PlatformUpdateModal';
import FocusModePanel from '../components/dashboard/FocusModePanel';
import CommunityPage from './Community';
import Blacksmith from './Blacksmith';
import UpcomingEventsSection from '../components/dashboard/UpcomingEventsSection';
import Achievements from './Achievements';
import EntertainmentHub from '../components/dashboard/EntertainmentHub.jsx';
import useLunaStore from '../components/luna/useLunaStore';
import { useEquipment } from '../components/luna/hooks/useEquipment';
import { useSkills } from '../components/luna/hooks/useSkills';
import PageErrorBoundary from '@/components/error/PageErrorBoundary';
import { showError } from '@/components/error/ErrorToast';
import FriendsHubOverlay from '../components/dashboard/FriendsHubOverlay';
import SideAccessMenu from '../components/dashboard/SideAccessMenu';
import AvatarProgressionBox from '../components/avatar/AvatarProgressionBox';
import EnvironmentSelector from '../components/avatarHome/EnvironmentSelector';
import GlassPageFrame from '../components/shared/GlassPageFrame';
import Mini3DViewerBox from '../components/dashboard/Mini3DViewerBox';
import DevSpotlightOverlay from '../components/dashboard/DevSpotlightOverlay';
import CardCollectionBrowser from '../components/dashboard/CardCollectionBrowser';
import QuestLogBook from '../components/dashboard/QuestLogBook';

// Transparent 3D Model Viewer with Chase Camera & Map Environment
function TransparentModel3DViewer({ modelUrl, weaponModel, triggerAnimation, backgroundUrl, roomModelUrl, activeScene, isStatsOpen, playerSpawn, useMeshCollision }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const mixerRef = useRef(null);
  const modelRef = useRef(null);
  const actionsRef = useRef({});
  const activeActionRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const keysPressed = useRef({});
  const envRef = useRef(null);
  const loadedEnvUrlRef = useRef(null);
  const playerSpawnRef = useRef(playerSpawn || { x: 0, y: -0.5, z: 0 });
  const useMeshCollisionRef = useRef(useMeshCollision || false);
  const envCollidersRef = useRef([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const companionRef = useRef(null);
  const companionMixerRef = useRef(null);
  
  // --- DUAL CHARACTER SYSTEM ---
  // Both models are loaded. Only one is visible/active at a time.
  // The `\` key toggles between them.
  const c1ModelRef = useRef(null);       // C1 (ErikaArcher) model object
  const c1MixerRef = useRef(null);       // C1 animation mixer
  const c1ActionsRef = useRef({});       // C1 animation actions map
  const c1ActiveActionRef = useRef(null);
  const activeCharacterRef = useRef('ybot'); // 'ybot' or 'c1'
  const [activeCharLabel, setActiveCharLabel] = useState('ybot'); // For UI display
  const switchingRef = useRef(false);     // Prevent double-switch

  // Player Controller State
  const isSprintingRef = useRef(false);
  const sprintTimerRef = useRef(0);
  const sprintDuration = 0.6;
  const currentActionNameRef = useRef(""); 
  const verticalVelocityRef = useRef(0);
  const isGroundedRef = useRef(true);

  // Camera orbit state (right-click drag)
  const cameraOrbitRef = useRef({ yaw: 0, pitch: 0.35, distance: 1.2 });
  const isRightMouseDownRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // Keybind-driven animation queue (replaces old one-shot system)
  const sequenceQueueRef = useRef([]);   // Current animation sequence being played
  const sequenceIndexRef = useRef(-1);   // Current index in the sequence (-1 = not playing)
  const sequenceLockRef = useRef(false); // Lock input during sequence playback

  // Advanced animation state controller refs (used inside Three.js closure)
  const holdActiveRef = useRef(null);
  const toggleActiveRef = useRef(null);
  const previousActionNameRef = useRef('idle');
  const preAnimPositionRef = useRef(null);  // Set to THREE.Vector3 once scene is ready
  const blendBackRef = useRef(null);        // { target: Vector3, progress: 0, duration: 0.3 } for smooth blend-back

  // 1. Fetch Animations from Admin
  const { data: adminAnimations } = useQuery({
    queryKey: ['adminAnimations'],
    queryFn: () => base44.entities.AnimationFBX.list(),
    staleTime: Infinity
  });

  // 2. Fetch Keybinds from Admin
  const { data: keybinds } = useQuery({
    queryKey: ['animationKeybinds'],
    queryFn: () => base44.entities.AnimationKeybind.list(),
    staleTime: Infinity
  });

  // Listen for character switch events to update React state for the label
  useEffect(() => {
    const handler = (e) => setActiveCharLabel(e.detail.active);
    window.addEventListener('characterSwitched', handler);
    return () => window.removeEventListener('characterSwitched', handler);
  }, []);

  // Keep spawn/collision refs in sync with props
  useEffect(() => {
    playerSpawnRef.current = playerSpawn || { x: 0, y: -0.5, z: 0 };
  }, [playerSpawn]);
  useEffect(() => {
    useMeshCollisionRef.current = useMeshCollision || false;
  }, [useMeshCollision]);

  // Standalone function to swap ONLY the environment mesh in the existing scene.
  // Does NOT touch engine, renderer, canvas, camera, character, lights, or render loop.
  const swapEnvironment = (url) => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (url === loadedEnvUrlRef.current) return; // Already loaded this URL

    console.log('[ENV] Swapping environment to:', url);

    // Step 1: Dispose old environment meshes only (not lights, camera, or character)
    if (envRef.current) {
      scene.remove(envRef.current);
      envRef.current.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach(m => m?.dispose());
        }
      });
      envRef.current = null;
      console.log('[ENV] Old environment disposed');
    }

    loadedEnvUrlRef.current = url;
    if (!url) return;

    // Step 2: Load new environment into the SAME scene
    const onLoaded = (obj) => {
      // Auto-scale to fit
      const box = new THREE.Box3().setFromObject(obj);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) {
        const s = 10 / maxDim;
        obj.scale.setScalar(s);
      }
      // Center horizontally, sit on floor at y=-0.5
      const box2 = new THREE.Box3().setFromObject(obj);
      const center = box2.getCenter(new THREE.Vector3());
      const minY = box2.min.y;
      obj.position.set(-center.x, -minY - 0.5, -center.z);

      obj.traverse((child) => {
        if (child.isMesh) {
          child.receiveShadow = true;
          child.castShadow = true;
        }
      });

      // Only add if scene still exists and URL hasn't changed mid-load
      if (sceneRef.current && loadedEnvUrlRef.current === url) {
        envRef.current = obj;
        sceneRef.current.add(obj);
        console.log('[ENV] New environment loaded and added to scene');

        // Collect walkable meshes for collision
        envCollidersRef.current = [];
        obj.traverse((child) => {
          if (child.isMesh) {
            envCollidersRef.current.push(child);
          }
        });
        console.log('[ENV] Collision meshes collected:', envCollidersRef.current.length);

        // Move character to this environment's spawn point
        if (modelRef.current) {
          const sp = playerSpawnRef.current;
          modelRef.current.position.set(sp.x, sp.y, sp.z);
          verticalVelocityRef.current = 0;
          isGroundedRef.current = true;
          console.log('[ENV] Player repositioned to spawn:', sp);
        }
      }
    };

    const lower = url.toLowerCase();
    if (lower.endsWith('.fbx')) {
      new FBXLoader().load(url, onLoaded, undefined, (err) => console.error('[ENV] FBX load error:', err));
    } else if (lower.endsWith('.glb') || lower.endsWith('.gltf')) {
      new GLTFLoader().load(url, (gltf) => onLoaded(gltf.scene), undefined, (err) => console.error('[ENV] GLTF load error:', err));
    } else {
      // Unknown extension: try FBX first, then GLTF
      new FBXLoader().load(url, onLoaded, undefined, () => {
        new GLTFLoader().load(url, (gltf) => onLoaded(gltf.scene), undefined, (err) => console.error('[ENV] load error:', err));
      });
    }
  };

  // React to roomModelUrl prop changes — hot-swap environment without touching anything else
  useEffect(() => {
    if (!sceneRef.current || !roomModelUrl) return;
    swapEnvironment(roomModelUrl);
  }, [roomModelUrl]);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- SETUP SCENE ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Add Fog for depth
    scene.fog = new THREE.FogExp2(0x000000, 0.02);

    const camera = new THREE.PerspectiveCamera(50, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 500);
    camera.position.set(0, 3, -5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // --- MOUSE CONTROLS (right-click orbit + scroll zoom) ---
    const onMouseDown = (e) => {
      if (e.button === 2) {
        isRightMouseDownRef.current = true;
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
        e.preventDefault();
      }
    };
    const onMouseUp = (e) => {
      if (e.button === 2) isRightMouseDownRef.current = false;
    };
    const onMouseMove = (e) => {
      if (!isRightMouseDownRef.current) return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      const orbit = cameraOrbitRef.current;
      orbit.yaw -= dx * 0.005;
      orbit.pitch = Math.max(0.05, Math.min(Math.PI / 2.2, orbit.pitch + dy * 0.005));
    };
    const onWheel = (e) => {
      const orbit = cameraOrbitRef.current;
      orbit.distance = Math.max(0.3, Math.min(15, orbit.distance + e.deltaY * 0.002));
      e.preventDefault();
    };
    const onContextMenu = (e) => e.preventDefault();

    const el = renderer.domElement;
    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('contextmenu', onContextMenu);

    // --- ENVIRONMENT (load initial from roomModelUrl prop or fallback) ---
    const initialEnvUrl = roomModelUrl || 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/ddff83a29_ModularEnvironment.fbx';
    swapEnvironment(initialEnvUrl);

    // --- CHARACTER (Y-Bot) ---
    const loader = new FBXLoader();
    const yBotUrl = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/608211a0f_YBot1.fbx';
    
    loader.load(yBotUrl, async (fbx) => {
      const model = fbx;
      model.scale.set(0.001, 0.001, 0.001); 
      model.position.set(0, -0.5, 0);
      
      model.traverse((child) => {
          if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
          }
      });
      
      modelRef.current = model;
      scene.add(model);

      const mixer = new THREE.AnimationMixer(model);
      mixerRef.current = mixer;
      mixer.timeScale = 1.2;

      const loadAnimations = async () => {          
          if (!adminAnimations || adminAnimations.length === 0) return;
          
          const fbxLoader = new FBXLoader();
          for (const anim of adminAnimations) {
            try {
              const animAsset = await fbxLoader.loadAsync(anim.file_url);
              if (animAsset.animations.length === 0) continue;
              
              const clip = animAsset.animations[0];
              const action = mixer.clipAction(clip);
              const name = (anim.name || '').toLowerCase().trim();

              if (name === 'idle') {
                actionsRef.current['idle'] = action;
              } else if (name === 'running') {
                actionsRef.current['running'] = action;
              } else if (name === 'jumping') {
                actionsRef.current['jumping'] = action;
                action.setLoop(THREE.LoopOnce, 1);
                action.clampWhenFinished = true;
              } else if (name === 'hurricane kick') {
                actionsRef.current['hurricane_kick'] = action;
                action.setLoop(THREE.LoopOnce, 1);
                action.clampWhenFinished = true;
              } else if (name === 'sprinting forward roll') {
                actionsRef.current['sprinting'] = action;
                action.setLoop(THREE.LoopOnce, 1);
                action.clampWhenFinished = true;
              }
              
              actionsRef.current[name] = action;
            } catch (e) {
              console.error("Failed to load animation:", anim.name, e);
            }
          }
          
          if (actionsRef.current['idle']) {
            actionsRef.current['idle'].reset().play();
            activeActionRef.current = actionsRef.current['idle'];
            currentActionNameRef.current = 'idle';
          }
      };
      await loadAnimations();

      // Dual-character aware fade/play helpers
      const fadeToAction = (name, duration = 0.2) => {
        // Determine which actions map / active action ref to use
        const isYBot = activeCharacterRef.current === 'ybot';
        const actions = isYBot ? actionsRef.current : c1ActionsRef.current;
        const activeRef = isYBot ? activeActionRef : c1ActiveActionRef;

        const nextAction = actions[name] || actions['idle'];
        if (!nextAction || activeRef.current === nextAction) return;
        if (activeRef.current) activeRef.current.fadeOut(duration);
        nextAction.reset().fadeIn(duration).play();
        activeRef.current = nextAction;
      };

      const play = (name) => {
          if (sequenceLockRef.current) return;
          const key = name.toLowerCase();
          if (currentActionNameRef.current === name) return;
          currentActionNameRef.current = name;
          fadeToAction(key, 0.2);
      };

      // --- ADVANCED KEYBIND ANIMATION STATE CONTROLLER ---
      // Supports: tap (play once), hold (sustain while pressed), toggle (on/off)
      // Per-animation: movement behavior, snap behavior, return state, interruptibility

      // Initialize preAnimPosition vector (refs declared outside closure)
      if (!preAnimPositionRef.current) preAnimPositionRef.current = new THREE.Vector3();

      const playSequence = (sequence, keybindMeta = {}) => {
        // Interruptibility check: if a non-interruptible keybind is active, block
        if (sequenceLockRef.current && holdActiveRef.current && holdActiveRef.current.interruptible === false) return;
        if (sequenceLockRef.current && toggleActiveRef.current && toggleActiveRef.current.interruptible === false) return;

        if (!sequence || sequence.length === 0) return;

        // Store previous state for "return to previous"
        previousActionNameRef.current = currentActionNameRef.current || 'idle';

        // Store pre-animation position for snap-back
        const activeModel = activeCharacterRef.current === 'ybot' ? model : c1ModelRef.current;
        if (activeModel) preAnimPositionRef.current.copy(activeModel.position);

        sequenceQueueRef.current = sequence;
        sequenceIndexRef.current = 0;
        sequenceLockRef.current = true;

        playSequenceStep();
      };

      const resolveReturnState = (entry) => {
        const isYBot = activeCharacterRef.current === 'ybot';
        const actions = isYBot ? actionsRef.current : c1ActionsRef.current;
        const activeRef = isYBot ? activeActionRef : c1ActiveActionRef;
        const activeModel = isYBot ? model : c1ModelRef.current;
        const returnState = entry.returnState || 'idle';
        const movementBehavior = entry.movementBehavior || 'in_place';

        // Handle position after completion based on movementBehavior + snapBehavior
        // Only apply snap logic if the animation was set to root_motion
        if (movementBehavior === 'root_motion' && activeModel && preAnimPositionRef.current) {
          const snapBehavior = entry.snapBehavior || 'maintain_end';
          if (snapBehavior === 'snap_to_origin') {
            // Instant teleport back to cached start position
            activeModel.position.copy(preAnimPositionRef.current);
          } else if (snapBehavior === 'blend_to_idle_pos') {
            // Start a smooth lerp back over ~0.3s
            blendBackRef.current = {
              target: preAnimPositionRef.current.clone(),
              progress: 0,
              duration: 0.3,
            };
          }
          // 'maintain_end' = do absolutely nothing — character stays at animation end position
        }
        // For 'in_place' movementBehavior: position was already locked during playback, no action needed

        // Determine which animation to transition to
        let targetName = 'idle';
        if (returnState === 'previous') {
          targetName = previousActionNameRef.current || 'idle';
        } else if (returnState === 'freeze') {
          // Don't transition — clamp on final frame
          return;
        } else if (returnState === 'specific' && entry.returnAnimationName) {
          targetName = entry.returnAnimationName.toLowerCase().trim();
        }

        const targetAction = actions[targetName] || actions['idle'];
        if (targetAction && activeRef.current !== targetAction) {
          if (activeRef.current) activeRef.current.fadeOut(0.2);
          targetAction.reset().fadeIn(0.2).play();
          activeRef.current = targetAction;
        }
        currentActionNameRef.current = targetName;
      };

      const playSequenceStep = () => {
        const idx = sequenceIndexRef.current;
        const queue = sequenceQueueRef.current;
        const isYBot = activeCharacterRef.current === 'ybot';
        const actions = isYBot ? actionsRef.current : c1ActionsRef.current;
        const activeRef = isYBot ? activeActionRef : c1ActiveActionRef;
        const activeMixer = isYBot ? mixer : c1MixerRef.current;

        if (idx < 0 || idx >= queue.length) {
          // Sequence complete — resolve return state from the last played entry
          sequenceLockRef.current = false;
          sequenceIndexRef.current = -1;
          const lastEntry = queue.length > 0 ? queue[queue.length - 1] : null;
          sequenceQueueRef.current = [];

          if (lastEntry) {
            resolveReturnState(lastEntry);
          } else {
            currentActionNameRef.current = '';
            const idleAction = actions['idle'];
            if (idleAction && activeRef.current !== idleAction) {
              if (activeRef.current) activeRef.current.fadeOut(0.2);
              idleAction.reset().fadeIn(0.2).play();
              activeRef.current = idleAction;
            }
          }
          return;
        }

        const entry = queue[idx];
        const actionName = (entry.animationName || '').toLowerCase().trim();
        const action = actions[actionName];

        if (!action) {
          console.warn('[Keybind] Animation not found:', actionName, '— skipping');
          sequenceIndexRef.current = idx + 1;
          playSequenceStep();
          return;
        }

        // Configure loop based on entry
        if (entry.loop) {
          action.setLoop(THREE.LoopRepeat);
          action.clampWhenFinished = false;
        } else {
          action.setLoop(THREE.LoopOnce, 1);
          action.clampWhenFinished = true;
        }

        currentActionNameRef.current = actionName;
        if (activeRef.current) activeRef.current.fadeOut(0.15);
        action.reset().fadeIn(0.15).play();
        activeRef.current = action;

        // If not looping, listen for finish to advance
        if (!entry.loop && activeMixer) {
          const onFinished = (e) => {
            if (e.action === action) {
              activeMixer.removeEventListener('finished', onFinished);
              sequenceIndexRef.current = idx + 1;
              playSequenceStep();
            }
          };
          activeMixer.addEventListener('finished', onFinished);
        }
      };

      // --- HOLD / TOGGLE RELEASE HANDLER ---
      const stopHoldOrToggle = () => {
        if (holdActiveRef.current) {
          holdActiveRef.current = null;
        }
        if (sequenceLockRef.current) {
          // Force-end the sequence and return to idle
          const isYBot = activeCharacterRef.current === 'ybot';
          const actions = isYBot ? actionsRef.current : c1ActionsRef.current;
          const activeRef = isYBot ? activeActionRef : c1ActiveActionRef;

          const lastEntry = sequenceQueueRef.current.length > 0 ? sequenceQueueRef.current[sequenceQueueRef.current.length - 1] : null;

          sequenceLockRef.current = false;
          sequenceIndexRef.current = -1;
          sequenceQueueRef.current = [];

          if (lastEntry) {
            resolveReturnState(lastEntry);
          } else {
            const idleAction = actions['idle'];
            if (idleAction && activeRef.current !== idleAction) {
              if (activeRef.current) activeRef.current.fadeOut(0.2);
              idleAction.reset().fadeIn(0.2).play();
              activeRef.current = idleAction;
            }
            currentActionNameRef.current = 'idle';
          }
        }
      };

      // --- GAME LOOP ---
      const animate = () => {
        requestAnimationFrame(animate);
        const delta = clockRef.current.getDelta();

        // Update BOTH mixers (active one drives visible model, inactive keeps state)
        if (mixer) mixer.update(delta);
        if (c1MixerRef.current) c1MixerRef.current.update(delta);

        // Update companion mixer
        if (companionMixerRef.current) companionMixerRef.current.update(delta);

        // Determine the currently active model for movement/camera
        const activeModel = activeCharacterRef.current === 'ybot' ? model : c1ModelRef.current;
        if (!activeModel) { renderer.render(scene, camera); return; }

        // Keep companion following the active player
        if (companionRef.current && activeModel) {
          const targetX = activeModel.position.x - 0.6;
          const targetZ = activeModel.position.z + 0.3;
          companionRef.current.position.x += (targetX - companionRef.current.position.x) * 0.05;
          companionRef.current.position.z += (targetZ - companionRef.current.position.z) * 0.05;
          companionRef.current.position.y = activeModel.position.y;
        }

        const moveSpeed = 0.6;
        let isMoving = false;
        
        const moveVector = new THREE.Vector3(0, 0, 0);
        const camYaw = cameraOrbitRef.current.yaw;
        const forwardX = -Math.sin(camYaw);
        const forwardZ = -Math.cos(camYaw);
        const rightX = -Math.cos(camYaw);
        const rightZ = Math.sin(camYaw);
        
        if (keysPressed.current['w']) { moveVector.x += forwardX; moveVector.z += forwardZ; }
        if (keysPressed.current['s']) { moveVector.x -= forwardX; moveVector.z -= forwardZ; }
        if (keysPressed.current['a']) { moveVector.x += rightX; moveVector.z += rightZ; }
        if (keysPressed.current['d']) { moveVector.x -= rightX; moveVector.z -= rightZ; }

        if (moveVector.lengthSq() > 0) {
            moveVector.normalize();
            isMoving = true;

            const angle = Math.atan2(moveVector.x, moveVector.z);
            const targetQuat = new THREE.Quaternion();
            targetQuat.setFromAxisAngle(new THREE.Vector3(0,1,0), angle);
            activeModel.quaternion.slerp(targetQuat, 0.2);

            activeModel.position.x += moveVector.x * moveSpeed * delta;
            activeModel.position.z += moveVector.z * moveSpeed * delta;
        }

        // --- CAMERA ---
        const orbit = cameraOrbitRef.current;
        const camX = activeModel.position.x + orbit.distance * Math.sin(orbit.yaw) * Math.cos(orbit.pitch);
        const camY = activeModel.position.y + orbit.distance * Math.sin(orbit.pitch);
        const camZ = activeModel.position.z + orbit.distance * Math.cos(orbit.yaw) * Math.cos(orbit.pitch);
        camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.15);
        camera.lookAt(activeModel.position.clone().add(new THREE.Vector3(0, 0.15, 0)));

        // PHYSICS — clamp to floor or environment mesh collision
        const gravity = -25;
        const jumpForce = 5;
        const spawnY = playerSpawnRef.current.y;
        
        if (keysPressed.current[' '] && isGroundedRef.current) {
            verticalVelocityRef.current = jumpForce;
            isGroundedRef.current = false;
        }
        verticalVelocityRef.current += gravity * delta;
        activeModel.position.y += verticalVelocityRef.current * delta;

        // Determine floor height — either via mesh raycast or flat floor
        let floorY = spawnY;
        if (useMeshCollisionRef.current && envCollidersRef.current.length > 0) {
          const rayOrigin = new THREE.Vector3(activeModel.position.x, activeModel.position.y + 5, activeModel.position.z);
          raycasterRef.current.set(rayOrigin, new THREE.Vector3(0, -1, 0));
          raycasterRef.current.far = 20;
          const hits = raycasterRef.current.intersectObjects(envCollidersRef.current, true);
          if (hits.length > 0) {
            floorY = hits[0].point.y;
          }
        }

        if (activeModel.position.y <= floorY) {
            activeModel.position.y = floorY;
            verticalVelocityRef.current = 0;
            isGroundedRef.current = true;
        } else {
            isGroundedRef.current = false;
        }

        // State-based animation — drives whichever character is active
        // When a hold/toggle is active, don't override with movement state
        if (!sequenceLockRef.current) {
          if (!isGroundedRef.current) {
              play(verticalVelocityRef.current > 0 ? "Jumping" : "Falling");
          } else if (isMoving) {
              play("Running");
          } else {
              play("Idle");
          }
        }

        // Position control during active sequence
        if (sequenceLockRef.current && sequenceQueueRef.current.length > 0) {
          const currentSeqIdx = sequenceIndexRef.current;
          const currentEntry = currentSeqIdx >= 0 && currentSeqIdx < sequenceQueueRef.current.length
            ? sequenceQueueRef.current[currentSeqIdx] : null;
          if (currentEntry && preAnimPositionRef.current && activeModel) {
            const moveBehavior = currentEntry.movementBehavior || 'in_place';
            if (moveBehavior === 'in_place') {
              // Lock position — animation plays but character doesn't move
              activeModel.position.x = preAnimPositionRef.current.x;
              activeModel.position.z = preAnimPositionRef.current.z;
            }
            // 'root_motion' = do NOT lock position, let animation's root motion move the character freely
          }
        }

        // Blend-back smooth lerp (after root_motion animation with blend_to_idle_pos)
        if (blendBackRef.current && activeModel) {
          const bb = blendBackRef.current;
          bb.progress += delta / bb.duration;
          if (bb.progress >= 1) {
            activeModel.position.x = bb.target.x;
            activeModel.position.z = bb.target.z;
            blendBackRef.current = null;
          } else {
            activeModel.position.x += (bb.target.x - activeModel.position.x) * Math.min(bb.progress * 3, 1);
            activeModel.position.z += (bb.target.z - activeModel.position.z) * Math.min(bb.progress * 3, 1);
          }
        }

        renderer.render(scene, camera);
      };
      animate();

      // --- KEYBIND-DRIVEN INPUT HANDLER ---
      const findKeybindForKey = (keyCode) => {
        if (!keybinds || keybinds.length === 0) return null;
        const isYBot = activeCharacterRef.current === 'ybot';
        return keybinds.find(kb => {
          if (kb.key !== keyCode) return false;
          const modelName = (kb.modelName || '').toLowerCase();
          if (isYBot) return modelName.includes('y bot') || modelName.includes('y-bot') || modelName.includes('ybot');
          return modelName.includes('c1') || modelName.includes('erika') || modelName.includes('archer');
        });
      };

      const onSpecialKeyDown = (e) => {
        const keyCode = e.code;
        const matchedKeybind = findKeybindForKey(keyCode);

        if (matchedKeybind && matchedKeybind.animationSequence && matchedKeybind.animationSequence.length > 0) {
          const playbackType = matchedKeybind.playbackType || 'tap';

          // If a non-interruptible action is active, block all input
          if (sequenceLockRef.current) {
            const activeHold = holdActiveRef.current;
            const activeToggle = toggleActiveRef.current;
            if ((activeHold && activeHold.interruptible === false) || (activeToggle && activeToggle.interruptible === false)) {
              return;
            }
          }

          if (playbackType === 'hold') {
            // Don't re-trigger if already holding this keybind
            if (holdActiveRef.current && holdActiveRef.current.key === matchedKeybind.key) return;
            holdActiveRef.current = matchedKeybind;
            playSequence(matchedKeybind.animationSequence, matchedKeybind);
            return;
          }

          if (playbackType === 'toggle') {
            if (toggleActiveRef.current && toggleActiveRef.current.key === matchedKeybind.key) {
              // Deactivate toggle
              toggleActiveRef.current = null;
              stopHoldOrToggle();
              return;
            }
            toggleActiveRef.current = matchedKeybind;
            playSequence(matchedKeybind.animationSequence, matchedKeybind);
            return;
          }

          // Default: tap
          if (sequenceLockRef.current) return;
          playSequence(matchedKeybind.animationSequence, matchedKeybind);
          return;
        }

        // Legacy fallback
        if (sequenceLockRef.current) return;
        const isYBot = activeCharacterRef.current === 'ybot';
        const currentActions = isYBot ? actionsRef.current : c1ActionsRef.current;
        if (e.key === '1' || e.key === 'c' || e.key === 'C') {
          const action = currentActions['hurricane_kick'];
          if (action) {
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
            playSequence([{ animationName: 'hurricane_kick', loop: false }]);
          }
        }
        if (e.key === 'r' || e.key === 'R') {
          const action = currentActions['sprinting'];
          if (action) {
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
            playSequence([{ animationName: 'sprinting', loop: false }]);
          }
        }
      };

      // HOLD release: when the held key is released, stop the hold animation
      const onSpecialKeyUp = (e) => {
        const keyCode = e.code;
        if (holdActiveRef.current && holdActiveRef.current.key === keyCode) {
          stopHoldOrToggle();
        }
      };

      window.addEventListener('keydown', onSpecialKeyDown);
      window.addEventListener('keyup', onSpecialKeyUp);
      model.userData._hurricaneCleanup = () => {
        window.removeEventListener('keydown', onSpecialKeyDown);
        window.removeEventListener('keyup', onSpecialKeyUp);
      };

    }, undefined, (err) => console.error('Error loading Y-Bot:', err));

    // --- C1 MODEL (ErikaArcher) ---
    const c1Url = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/3f915913a_ErikaArcher.fbx';
    new FBXLoader().load(c1Url, async (c1fbx) => {
      const c1 = c1fbx;
      c1.scale.set(0.001, 0.001, 0.001);
      c1.position.set(0, -0.5, 0);
      c1.visible = false; // Hidden by default — Y-Bot is active first

      c1.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      c1ModelRef.current = c1;
      scene.add(c1);

      const c1Mixer = new THREE.AnimationMixer(c1);
      c1MixerRef.current = c1Mixer;
      c1Mixer.timeScale = 1.2;

      // Load same admin animations onto C1's skeleton
      if (adminAnimations && adminAnimations.length > 0) {
        const fbxLoader = new FBXLoader();
        for (const anim of adminAnimations) {
          try {
            const animAsset = await fbxLoader.loadAsync(anim.file_url);
            if (animAsset.animations.length === 0) continue;
            const clip = animAsset.animations[0];
            const action = c1Mixer.clipAction(clip);
            const name = (anim.name || '').toLowerCase().trim();

            if (name === 'jumping' || name === 'hurricane kick' || name === 'sprinting forward roll') {
              action.setLoop(THREE.LoopOnce, 1);
              action.clampWhenFinished = true;
            }

            // Store with same key mapping as Y-Bot
            if (name === 'hurricane kick') c1ActionsRef.current['hurricane_kick'] = action;
            else if (name === 'sprinting forward roll') c1ActionsRef.current['sprinting'] = action;
            c1ActionsRef.current[name] = action;
          } catch (e) {
            console.error("[C1] Failed to load animation:", anim.name, e);
          }
        }

        // Start C1 in idle (but it's hidden so it won't render)
        if (c1ActionsRef.current['idle']) {
          c1ActionsRef.current['idle'].reset().play();
          c1ActiveActionRef.current = c1ActionsRef.current['idle'];
        }
      }

      console.log('[C1] ErikaArcher loaded and ready (hidden)');
    }, undefined, (err) => console.error('Error loading C1:', err));

    // --- CHARACTER SWITCH HANDLER ( \ key) ---
    const onSwitchCharacter = (e) => {
      if (e.key !== '\\') return;
      if (switchingRef.current) return;
      if (!modelRef.current || !c1ModelRef.current) return;

      switchingRef.current = true;
      const isYBot = activeCharacterRef.current === 'ybot';
      const fromModel = isYBot ? modelRef.current : c1ModelRef.current;
      const toModel = isYBot ? c1ModelRef.current : modelRef.current;
      const toMixer = isYBot ? c1MixerRef.current : mixerRef.current;
      const toActions = isYBot ? c1ActionsRef.current : actionsRef.current;
      const toActiveAction = isYBot ? c1ActiveActionRef : activeActionRef;

      // Transfer position and rotation
      toModel.position.copy(fromModel.position);
      toModel.quaternion.copy(fromModel.quaternion);

      // Swap visibility
      fromModel.visible = false;
      toModel.visible = true;

      // Update active character ref
      activeCharacterRef.current = isYBot ? 'c1' : 'ybot';
      // We can't call setActiveCharLabel here since it's inside the Three.js setup closure,
      // but we dispatch a custom event the React component can listen to
      window.dispatchEvent(new CustomEvent('characterSwitched', { detail: { active: activeCharacterRef.current } }));

      // Reset animation state on new active model to idle
      const idleAction = toActions['idle'];
      if (idleAction) {
        if (toActiveAction.current && toActiveAction.current !== idleAction) {
          toActiveAction.current.fadeOut(0.2);
        }
        idleAction.reset().fadeIn(0.2).play();
        toActiveAction.current = idleAction;
      }
      currentActionNameRef.current = 'idle';

      // Clear any active sequence lock, hold/toggle states, and blend-back
      sequenceLockRef.current = false;
      sequenceQueueRef.current = [];
      sequenceIndexRef.current = -1;
      holdActiveRef.current = null;
      toggleActiveRef.current = null;
      blendBackRef.current = null;

      console.log('[Switch] Now active:', activeCharacterRef.current);
      setTimeout(() => { switchingRef.current = false; }, 200);
    };
    window.addEventListener('keydown', onSwitchCharacter);

    // --- COMPANION SYSTEM ---
    const loadCompanion = (detail) => {
      const scene = sceneRef.current;
      if (!scene) return;

      // Remove old companion
      if (companionRef.current) {
        scene.remove(companionRef.current);
        companionRef.current.traverse((child) => {
          if (child.isMesh) {
            child.geometry?.dispose();
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(m => m?.dispose());
          }
        });
        companionRef.current = null;
      }
      if (companionMixerRef.current) {
        companionMixerRef.current.stopAllAction();
        companionMixerRef.current = null;
      }

      if (!detail?.fileUrl) return;

      const onLoaded = (obj) => {
        // Scale companion to be small (about 0.4 units tall)
        const box = new THREE.Box3().setFromObject(obj);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const s = 0.4 / maxDim;
          obj.scale.setScalar(s);
        }

        // Place to the left of the Y-Bot, close to the white bar area
        const sp = playerSpawnRef.current;
        obj.position.set(sp.x - 0.6, sp.y, sp.z + 0.3);

        obj.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        companionRef.current = obj;
        scene.add(obj);

        // Play animation if any
        const anims = obj.animations || [];
        if (anims.length > 0) {
          const mixer = new THREE.AnimationMixer(obj);
          companionMixerRef.current = mixer;
          const action = mixer.clipAction(anims[0]);
          action.play();
        }
      };

      const url = detail.fileUrl;
      const lower = url.toLowerCase();
      if (lower.endsWith('.fbx')) {
        new FBXLoader().load(url, onLoaded, undefined, (err) => console.error('[Companion] FBX load error:', err));
      } else if (lower.endsWith('.glb') || lower.endsWith('.gltf')) {
        new GLTFLoader().load(url, (gltf) => {
          const obj = gltf.scene;
          obj.animations = gltf.animations || [];
          onLoaded(obj);
        }, undefined, (err) => console.error('[Companion] GLTF load error:', err));
      } else {
        // Try FBX first
        new FBXLoader().load(url, onLoaded, undefined, () => {
          new GLTFLoader().load(url, (gltf) => {
            const obj = gltf.scene;
            obj.animations = gltf.animations || [];
            onLoaded(obj);
          });
        });
      }
    };

    const dismissCompanion = () => {
      const scene = sceneRef.current;
      if (companionRef.current && scene) {
        scene.remove(companionRef.current);
        companionRef.current = null;
      }
      if (companionMixerRef.current) {
        companionMixerRef.current.stopAllAction();
        companionMixerRef.current = null;
      }
    };

    const onCompanionSummon = (e) => loadCompanion(e.detail);
    const onCompanionDismiss = () => dismissCompanion();
    window.addEventListener('companionSummon', onCompanionSummon);
    window.addEventListener('companionDismiss', onCompanionDismiss);

    const onKeyDown = (e) => keysPressed.current[e.key.toLowerCase()] = true;
    const onKeyUp = (e) => keysPressed.current[e.key.toLowerCase()] = false;
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('keydown', onSwitchCharacter);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('companionSummon', onCompanionSummon);
      window.removeEventListener('companionDismiss', onCompanionDismiss);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('contextmenu', onContextMenu);
      dismissCompanion();
      if (modelRef.current?.userData?._hurricaneCleanup) modelRef.current.userData._hurricaneCleanup();
      renderer.dispose();
    };
  }, [adminAnimations, keybinds, spawnableAIModels]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {/* Active Character Indicator */}
      <div className="absolute bottom-4 right-4 z-10 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase pointer-events-none"
        style={{
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.7)'
        }}>
        {activeCharLabel === 'ybot' ? 'Y-Bot' : 'C1'} ⟨ \ ⟩
      </div>
    </div>
  );
}



// Orbital Menu Items
const ORBITAL_ITEMS = [
  {
    id: 'skill-tree',
    label: 'Skill Tree',
    icon: Layers,
    color: 'from-purple-500 to-pink-500',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
    description: 'View & Unlock Abilities'
  },
  {
    id: 'battle',
    label: 'Battle Mode',
    icon: Swords,
    color: 'from-red-500 to-orange-500',
    route: 'Challenges',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
    description: 'Enter Combat Arena'
  },

  {
    id: 'story',
    label: 'AI Story',
    icon: BookOpen,
    color: 'from-indigo-500 to-purple-500',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
    description: 'Continue Your Journey'
  },
  {
    id: 'home',
    label: 'AI Home',
    icon: Home,
    color: 'from-green-500 to-emerald-500',
    route: 'Dashboard',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400',
    description: 'Personal Space'
  },

  {
    id: 'games',
    label: 'PINGAMES',
    icon: Gamepad2,
    color: 'from-cyan-500 to-blue-500',
    route: 'Library',
    image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400',
    description: 'Your Game Library'
  }];


// Expanded Grid View Component
const ExpandedGenreView = ({ genre, onClose, onCardClick }) => {
  // Generate 50 items
  const initialItems = Array.from({ length: 50 }, (_, i) => ({
    id: `item-${i}`,
    numericId: i + 1,
    title: `Item ${i + 1}`,
    rarity: ['Common', 'Rare', 'Epic', 'Legendary'][Math.floor(Math.random() * 4)]
  }));

  // Chunk into rows of 8
  const chunkItems = (items, size) => {
    const chunks = [];
    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }
    return chunks;
  };

  const [rows, setRows] = useState(() => chunkItems(initialItems, 8));

  const moveRow = (index, direction) => {
    if (index + direction < 0 || index + direction >= rows.length) return;
    const newRows = Array.from(rows);
    const [removed] = newRows.splice(index, 1);
    newRows.splice(index + direction, 0, removed);
    setRows(newRows);
  };

  const handleDragEnd = (result) => {
    const { source, destination, type } = result;

    if (!destination) return;

    // Handle Row Reordering
    if (type === 'ROW') {
      const newRows = Array.from(rows);
      const [removed] = newRows.splice(source.index, 1);
      newRows.splice(destination.index, 0, removed);
      setRows(newRows);
      return;
    }

    // Handle Item Swapping (Row to Row or same Row)
    if (type === 'ITEM') {
      const sourceRowIndex = parseInt(source.droppableId.split('-')[1]);
      const destRowIndex = parseInt(destination.droppableId.split('-')[1]);

      const newRows = Array.from(rows).map((row) => [...row]); // Deep copy

      if (destRowIndex < newRows.length) {
        const sourceItem = newRows[sourceRowIndex][source.index];

        // Check if dropping on an existing item to swap
        if (destination.index < newRows[destRowIndex].length) {
          const targetItem = newRows[destRowIndex][destination.index];

          // SWAP
          newRows[sourceRowIndex][source.index] = targetItem;
          newRows[destRowIndex][destination.index] = sourceItem;
        } else {
          // Append if moving to empty space (rare in grid but possible at end)
          newRows[sourceRowIndex].splice(source.index, 1);
          newRows[destRowIndex].splice(destination.index, 0, sourceItem);
        }
        setRows(newRows);
      }
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full h-full flex flex-col">

        {/* Header / Toolbar */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
            {genre} Inventory
          </h2>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/10 group">

            <X className="w-5 h-5 text-white/60 group-hover:text-white" />
          </button>
        </div>

        {/* Rows Content */}
        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
          <Droppable droppableId="all-rows" type="ROW">
            {(provided) =>
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-6">
                {rows.map((row, rowIndex) =>
                  <Draggable key={`row-${rowIndex}`} draggableId={`row-${rowIndex}`} index={rowIndex}>
                    {(providedRow) =>
                      <div
                        ref={providedRow.innerRef}
                        {...providedRow.draggableProps}
                        className="flex items-center gap-4 py-2">

                        {/* Left Control Circle */}
                        <div
                          {...providedRow.dragHandleProps}
                          className="flex-shrink-0 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors group shadow-lg z-10">

                          <ArrowUp
                            className="w-3 h-3 text-white/50 hover:text-white mb-0.5 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); moveRow(rowIndex, -1); }} />

                          <div className="w-1 h-1 rounded-full bg-white/30 group-hover:bg-blue-400 mb-0.5" />
                          <ArrowDown
                            className="w-3 h-3 text-white/50 hover:text-white cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); moveRow(rowIndex, 1); }} />

                        </div>

                        {/* Items Row */}
                        <Droppable droppableId={`row-${rowIndex}`} type="ITEM" direction="horizontal">
                          {(providedItems) =>
                            <div
                              ref={providedItems.innerRef}
                              {...providedItems.droppableProps}
                              className="flex-1 grid grid-cols-8 gap-4">

                              {row.map((item, itemIndex) =>
                                <Draggable key={item.id} draggableId={item.id} index={itemIndex}>
                                  {(providedItem) =>
                                    <div
                                      ref={providedItem.innerRef}
                                      {...providedItem.draggableProps}
                                      {...providedItem.dragHandleProps}
                                      className="aspect-[3/4]"
                                      onClick={() => onCardClick(item)}>

                                      <ShinyCard>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-mono text-sm text-white/40">
                                            {item.numericId}
                                          </div>
                                        </div>
                                        <div className="absolute bottom-3 left-3">
                                          <div className="text-[8px] font-bold tracking-wider text-white/50 uppercase">{item.rarity}</div>
                                        </div>
                                      </ShinyCard>
                                    </div>
                                  }
                                </Draggable>
                              )}
                              {providedItems.placeholder}
                            </div>
                          }
                        </Droppable>

                        {/* Right Control Circle */}
                        <div
                          {...providedRow.dragHandleProps}
                          className="flex-shrink-0 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors group shadow-lg z-10">

                          <GripVertical className="w-4 h-4 text-white/50 group-hover:text-white" />
                        </div>
                      </div>
                    }
                  </Draggable>
                )}
                {provided.placeholder}
              </div>
            }
          </Droppable>
        </div>
      </motion.div>
    </DragDropContext>);

};

// Console Tile Component - Sumi-e Liquid Glass Style
const ConsoleTile = ({ children, onClick, className = "", accentColor = null, hasImage = false, isLegendary = false }) => {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });
  };

  return (
    <motion.div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMousePos({ x: 0.5, y: 0.5 }); }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      tabIndex={0}
      animate={{
        scale: isHovered || isFocused ? 1.02 : 1,
        y: isHovered || isFocused ? -2 : 0,
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`relative overflow-hidden group outline-none ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${isHovered || isFocused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)'}`,
        borderRadius: '24px',
        boxShadow: isHovered || isFocused
          ? '0 0 15px rgba(168, 192, 255, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.05)'
          : 'inset 0 0 20px rgba(255, 255, 255, 0.05)'
      }}
    >
      {/* Inner Glass Volume Effect */}
      <div
        className="absolute inset-0 pointer-events-none z-0 rounded-[24px]"
        style={{
          background: isHovered || isFocused
            ? 'rgba(255, 255, 255, 0.10)'
            : 'transparent',
          transition: 'background 0.3s ease'
        }}
      />

      {/* Shine Effect - Silver Filament */}
      <div
        className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-300 rounded-[24px]"
        style={{
          opacity: isHovered ? 0.6 : 0,
          background: `linear-gradient(105deg, transparent ${mousePos.x * 100 - 30}%, rgba(255,255,255,0.4) ${mousePos.x * 100}%, transparent ${mousePos.x * 100 + 30}%)`
        }}
      />

      {/* Focus ring for keyboard navigation - Moonlight accent */}
      {isFocused && (
        <div className="absolute inset-0 rounded-[24px] border-2 pointer-events-none z-30" style={{ borderColor: '#A8C0FF' }} />
      )}

      {/* Content */}
      {children}
    </motion.div>
  );
};

// Hero Tile - Sumi-e Liquid Glass (Monochromatic)
const LegendaryTile = ({ children, onClick, className = "" }) => {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });
  };

  return (
    <motion.div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMousePos({ x: 0.5, y: 0.5 }); }}
      animate={{
        scale: isHovered ? 1.02 : 1,
        y: isHovered ? -4 : 0,
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`relative overflow-hidden group cursor-pointer ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${isHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)'}`,
        borderRadius: '24px',
        boxShadow: isHovered
          ? '0 0 15px rgba(168, 192, 255, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.05)'
          : 'inset 0 0 20px rgba(255, 255, 255, 0.05)'
      }}
    >
      {/* Inner Glass Volume Effect */}
      <div
        className="absolute inset-0 pointer-events-none z-0 rounded-[24px]"
        style={{
          background: isHovered ? 'rgba(255, 255, 255, 0.10)' : 'transparent',
          transition: 'background 0.3s ease'
        }}
      />

      {/* Shine Effect - Silver Filament */}
      <div
        className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-300 rounded-[24px]"
        style={{
          opacity: isHovered ? 0.6 : 0,
          background: `linear-gradient(105deg, transparent ${mousePos.x * 100 - 30}%, rgba(255,255,255,0.4) ${mousePos.x * 100}%, transparent ${mousePos.x * 100 + 30}%)`
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

// Leaderboard Tile Component with Real-Time Data
const LeaderboardTile = () => {
  const { data: users, isLoading } = useQuery({
    queryKey: ['leaderboard-users'],
    queryFn: () => base44.entities.User.list('-level', 10),
    refetchInterval: 30000,
  });

  return (
    <ConsoleTile className="w-64 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-white/10 relative">
        <h3 className="text-[#FFFFFF] font-serif text-lg tracking-wide flex items-center gap-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
          <Trophy className="w-5 h-5 text-[#E0E5EC]" style={{ filter: 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.4))' }} />
          LEADERBOARD
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        ) : users && users.length > 0 ? (
          users.map((player, index) => (
            <div
              key={player.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
            >
              {player.avatar_url ? (
                <img
                  src={player.avatar_url}
                  alt={player.username || player.full_name}
                  className="w-8 h-8 rounded-lg object-cover grayscale"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/40 text-xs font-bold">
                  {(player.username || player.full_name || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[#A0A0A0] text-xs font-sans">{index + 1}</span>
                  <span className="text-[#CCCCCC] text-sm font-sans truncate" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                    {player.username || player.full_name || 'Unknown'}
                  </span>
                </div>
              </div>
              <span className="text-[#E0E5EC] text-sm font-sans" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                {player.level || 0}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-white/30 text-sm">
            No players yet
          </div>
        )}
      </div>
    </ConsoleTile>
  );
};

// Mock Friends Data
const mockFriends = [
  { id: 1, name: 'Shadow_Striker', avatar: 'https://i.pravatar.cc/150?u=1', status: 'online', game: 'Cyberpunk 2088' },
  { id: 2, name: 'CyberVixen', avatar: 'https://i.pravatar.cc/150?u=2', status: 'online', game: 'Final Fantasy XIV' },
  { id: 3, name: 'GhostReaper', avatar: 'https://i.pravatar.cc/150?u=3', status: 'idle' },
  { id: 4, name: 'IronFist', avatar: 'https://i.pravatar.cc/150?u=4', status: 'offline' },
  { id: 5, name: 'NovaStar', avatar: 'https://i.pravatar.cc/150?u=5', status: 'online', game: 'League of Legends' }];

export default function LunaTemplate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const resetLunaStore = useLunaStore((state) => state.reset);
  const { equipItem, unequipItem, equippedItems, setWeaponModelUrl, weaponModelUrl } = useEquipment();
  const { activeSkills, triggerSkill } = useSkills();
  const [showSettings, setShowSettings] = useState(false);
  const [showLive, setShowLive] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showAINews, setShowAINews] = useState(false);
  const [showSeasonalPass, setShowSeasonalPass] = useState(false);
  // showInventory removed to prevent duplicate state source of truth
  const [showPinGames, setShowPinGames] = useState(false);
  const [expandedGenre, setExpandedGenre] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [uiVisible, setUiVisible] = useState(false);
  const [selectedCardForUpgrade, setSelectedCardForUpgrade] = useState(null);
  const [showBlankPage, setShowBlankPage] = useState(false);
  const [blankPageTab, setBlankPageTab] = useState('entertainment');
  const [selectedStreamingService, setSelectedStreamingService] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userEvents, setUserEvents] = useState([]);
  const [platformUpdates, setPlatformUpdates] = useState([]);
  const [showForumOverlay, setShowForumOverlay] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState(null);
  const [showConsoleMode, setShowConsoleMode] = useState(false);
  const [showFriendsHub, setShowFriendsHub] = useState(false);
  // Hardcoded assets for System Reboot
  const [modelUrl, setModelUrl] = useState(null);
  const [roomModelUrl, setRoomModelUrl] = useState(null);
  const [activeScene, setActiveScene] = useState(null);
  const [bannerBackgroundUrl, setBannerBackgroundUrl] = useState(null);
  const [playerSpawn, setPlayerSpawn] = useState({ x: 0, y: -0.5, z: 0 });
  const [useMeshCollision, setUseMeshCollision] = useState(false);

  // Auto-select model: Y-Bot (Xbot.glb)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // Default to Y-bot (using Xbot.glb as standard web-ready version)
        let url = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Xbot.glb';
        
        // Optional: Check for override in DB
        // const exact = await base44.entities.ModelFBX.filter({ name: 'Y-bot' });
        // if (exact && exact.length) url = exact[0].file_url;

        if (!cancelled) {
          setModelUrl(url);
        }
      } catch (e) {
        console.error('Dashboard model lookup failed:', e);
      }
    };
    if (!modelUrl) load();
    return () => { cancelled = true; };
  }, [modelUrl]);
  const [clickedSlot, setClickedSlot] = useState(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showAvatarProgression, setShowAvatarProgression] = useState(false);
  const [hideUI, setHideUI] = useState(false); // Toggle with '0' key
  const [showDevSpotlight, setShowDevSpotlight] = useState(false); // Toggle with 'P' key
  const [currentEnvId, setCurrentEnvId] = useState('default_room');

  const { mode } = useDashboardMode();

  // Fetch Active Scene Layout from Admin
  useEffect(() => {
    const fetchScene = async () => {
        try {
            // 1. Try to find an ACTIVE SceneLayout
            const layouts = await base44.entities.SceneLayout.filter({ is_active: true });
            
            if (layouts.length > 0) {
                const layout = layouts[0];
                console.log("Loading Active Scene:", layout.name);
                setActiveScene(layout);
                if (layout.environment_url) setRoomModelUrl(layout.environment_url);
            } else {
                // Fallback to legacy auto-fetch logic if no scene is active
                console.warn("No active scene found, falling back to auto-discovery.");
                const models = await base44.entities.Model3D.list();
                const room2Fbx = models.find(m => (m.name.toLowerCase().includes('room 2') || m.name.toLowerCase().includes('room2')) && (m.file_type === 'fbx' || m.file_url.toLowerCase().endsWith('.fbx')));
                const room2Any = models.find(m => m.name.toLowerCase().includes('room 2') || m.name.toLowerCase().includes('room2'));
                const room1Asset = models.find(m => m.name.toLowerCase().includes('room 1') || m.name.toLowerCase().includes('room1'));
                const selectedAsset = room2Fbx || room2Any || room1Asset;
                
                if (selectedAsset?.file_url) {
                  setRoomModelUrl(selectedAsset.file_url);
                  // Apply per-environment spawn & collision settings
                  if (selectedAsset.player_spawn) setPlayerSpawn(selectedAsset.player_spawn);
                  if (selectedAsset.use_mesh_collision) setUseMeshCollision(true);
                }
                else setRoomModelUrl('https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/58d1bc849_scene.gltf');
            }
        } catch (e) {
            console.error("Failed to load scene configuration:", e);
        }
    };
    fetchScene();
    
    // Model selection handled separately (Maria WProp J J Ong)
  }, []);

  // Load saved environment preference
  useEffect(() => {
    const loadUserEnv = async () => {
      if (!user?.id) return;
      try {
        const states = await base44.entities.AvatarHomeState.filter({ avatarId: user.id });
        if (states && states.length > 0 && states[0].currentEnvironmentId) {
          const savedId = states[0].currentEnvironmentId;
          setCurrentEnvId(savedId);
          
          // 1. Try to load as SceneLayout (New System)
          if (savedId !== 'default_room') {
             try {
                 const layouts = await base44.entities.SceneLayout.filter({ id: savedId });
                 if (layouts && layouts.length > 0) {
                     const layout = layouts[0];
                     setActiveScene(layout);
                     if (layout.environment_url) setRoomModelUrl(layout.environment_url);
                     return;
                 }
             } catch (e) { /* Not a scene layout or fetch failed */ }

             // 2. Legacy Fallback (Old IDs)
             const models = await base44.entities.Model3D.list();
             const fbxs = await base44.entities.ModelFBX.list();
             const all = [...(models || []), ...(fbxs || [])];
             
             const queries = {
               'cyber_loft': ['room 2', 'room2'],
               'zen_garden': ['zen', 'garden'],
               'mars_outpost': ['mars', 'outpost']
             };
             
             if (queries[savedId]) {
               const found = all.find(m => queries[savedId].some(q => (m.name || '').toLowerCase().includes(q)));
               if (found?.file_url) {
                 setRoomModelUrl(found.file_url);
               }
             }
          } else {
             // Default Room fallback
             try {
                 const models = await base44.entities.Model3D.list();
                 const room1Asset = models.find(m => m.name.toLowerCase().includes('room 1') || m.name.toLowerCase().includes('room1'));
                 if (room1Asset?.file_url) setRoomModelUrl(room1Asset.file_url);
                 else setRoomModelUrl('https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/58d1bc849_scene.gltf');
                 setActiveScene(null);
             } catch {}
          }
        }
      } catch (e) { console.error('Error loading env pref', e); }
    };
    loadUserEnv();
  }, [user]);

  const handleEnvSelect = async (env) => {
    setCurrentEnvId(env.id);
    
    // Update player spawn and collision from environment data
    if (env.playerSpawn) {
      setPlayerSpawn(env.playerSpawn);
    } else {
      setPlayerSpawn({ x: 0, y: -0.5, z: 0 });
    }
    setUseMeshCollision(env.useMeshCollision || false);
    
    // Check if it's a full SceneLayout
    if (env.layoutData) {
        console.log("Switching to Scene Layout:", env.layoutData.name);
        setActiveScene(env.layoutData);
        if (env.layoutData.environment_url) {
            setRoomModelUrl(env.layoutData.environment_url);
        }
    } else if (env.modelUrl) {
        // Legacy/Simple model switch
        setRoomModelUrl(env.modelUrl);
        setActiveScene(null); // Clear complex scene if switching to simple env
    }

    // Persist Preference
    if (user?.id) {
      try {
        const states = await base44.entities.AvatarHomeState.filter({ avatarId: user.id });
        if (states.length > 0) {
          await base44.entities.AvatarHomeState.update(states[0].id, { currentEnvironmentId: env.id });
        } else {
          await base44.entities.AvatarHomeState.create({ avatarId: user.id, currentEnvironmentId: env.id });
        }
      } catch (e) { console.error('Error saving env pref', e); }
    }
  };



  useEffect(() => {
    return () => {
      resetLunaStore();
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const panel = params.get('panel');
    setShowSettings(panel === 'settings');
    setShowLive(panel === 'live');
    setShowProfile(panel === 'profile');
    setShowNotifications(panel === 'notifications');
    setShowConsoleMode(panel === 'console');

    if (panel === 'blacksmith' || panel === 'seasonalpass' || panel === 'entertainment' || panel === 'clan' || panel === 'forum') {
      setActiveSubTab(panel);
    } else {
      setActiveSubTab(null);
    }
    
    setShowAchievements(panel === 'achievements');
  }, [location.search]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        const events = await base44.entities.UserEvent.filter({ user_id: user.id });
        setUserEvents(events);

        const updates = await base44.entities.PlatformUpdate.filter({ published: true });
        setPlatformUpdates(updates);
      } catch (error) {
        showError(error, 'Load Events');
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    const checkBladeEquipped = async () => {
      const hasBladeOfAbyss = Object.entries(equippedItems).some(
        ([slotId, item]) => slotId.startsWith('weapon-') && item.name === 'Blade of Abyss'
      );

      if (hasBladeOfAbyss && !weaponModelUrl) {
        try {
          const swordModels = await base44.entities.ModelFBX.filter({ name: 'Blade of Abyss Sword' });
          if (swordModels.length > 0) {
            setWeaponModelUrl(swordModels[0].file_url);
          }
        } catch (error) {
          console.error('Failed to load weapon model:', error);
        }
      } else if (!hasBladeOfAbyss && weaponModelUrl) {
        setWeaponModelUrl(null);
      }
    };

    checkBladeEquipped();
  }, [equippedItems, weaponModelUrl]);

  const [triggerAnimation, setTriggerAnimation] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      const key = (e.key || '').toLowerCase();
      if (key === 'i') {
        if (clickedSlot) {
          setClickedSlot(null);
        } else {
          setUiVisible((v) => !v);
        }
      }
      if (key === 'p') {
        setShowDevSpotlight((v) => !v);
      }
      if (key === '0') {
        setHideUI((v) => !v);
      }
      if (key === 'escape') {
        if (showDevSpotlight) { setShowDevSpotlight(false); return; }
        if (hideUI) setHideUI(false);
        if (showAvatarProgression) setShowAvatarProgression(false);
        if (showForumOverlay) setShowForumOverlay(false);
        const params = new URLSearchParams(window.location.search);
        if (params.get('panel')) {
          navigate(createPageUrl('LunaTemplate'));
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showForumOverlay, showAvatarProgression, navigate]);

  const itemCount = ORBITAL_ITEMS.length;
  const angleStep = 360 / itemCount;

  const getItemPosition = (index) => {
    const angle = (index - activeIndex) * angleStep * (Math.PI / 180);
    const radius = 350;
    const x = Math.sin(angle) * radius;
    const y = Math.cos(angle) * radius;
    const scale = index === activeIndex ? 1 : 0.75;
    const opacity = index === activeIndex ? 1 : 0.5;
    const zIndex = index === activeIndex ? 20 : 10;

    return { x, y, scale, opacity, zIndex };
  };

  const handleBoxClick = (slotId) => {
    setClickedSlot(slotId);
    // Open the new centralized inventory overlay only
    window.dispatchEvent(new CustomEvent('openInventoryPanel', { detail: { slotId } }));
  };

  const handleEquipItem = (item) => {
    if (clickedSlot && item) {
      equipItem(clickedSlot, item);
      // Do NOT close inventory on equip - keeps UI stable
    }
  };

  // Open InventoryPanel from other components (e.g., StatsDropdown InventoryGrid)
  useEffect(() => {
    const handler = (e) => {
      const slotId = e?.detail?.slotId;
      if (slotId) {
        setClickedSlot(slotId);
        setShowStats(false); // Close stats panel to prevent duplicate UI background
      }
    };
    window.addEventListener('openInventoryPanel', handler);
    return () => window.removeEventListener('openInventoryPanel', handler);
  }, []);

  if (mode === 'user') {
    return (
      <div className="h-screen w-full bg-slate-900 pt-24 px-8 pb-8">
        <UserInterfaceView />
      </div>);

  }

  return (
    <PageErrorBoundary pageName="LunaTemplate">
    <GlassPageFrame>
    <div
      className="min-h-screen text-white p-8 pt-0 overflow-hidden relative"
      style={{
        backgroundImage: `url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/fed9dc2c3_unnamed4.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#080808'
      }}>



      {/* Mini 3D Viewer Box + Quest Log Book + Card Collection - positioned below the dashboard title, left column */}
      {!showConsoleMode && !showAchievements && !uiVisible && (
        <div className="fixed z-20 pointer-events-auto flex flex-col gap-3" style={{ left: '32px', top: '80px', width: '322px' }}>
          <Mini3DViewerBox />
          <div className="w-full" style={{ transform: 'scale(1.15)', transformOrigin: 'top left' }}>
            <QuestLogBook />
          </div>
          <div className="w-full" style={{ marginTop: '24px' }}>
            <CardCollectionBrowser />
          </div>
        </div>
      )}

      {/* 3D Model Viewer - Full Page Background */}
      {/* Hidden when overlays are open (Friends Hub, Achievements, etc.) */}
      {(modelUrl || roomModelUrl) && !showConsoleMode && !showFriendsHub && !showAchievements &&
        <div
          className="fixed inset-0 z-0 pointer-events-auto"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100vw',
            height: '100vh',
            // Ensure background image container doesn't move, only this 3D view container is affected
            // but the transform is inside TransparentModel3DViewer, so this wrapper stays put.
          }}>

          <TransparentModel3DViewer 
            modelUrl={modelUrl} 
            weaponModel={weaponModelUrl} 
            triggerAnimation={triggerAnimation} 
            backgroundUrl={bannerBackgroundUrl} 
            roomModelUrl={roomModelUrl} 
            activeScene={activeScene}
            isStatsOpen={showStats}
            playerSpawn={playerSpawn}
            useMeshCollision={useMeshCollision}
          />
        </div>
      }

      {/* Focus Mode Background Overlay - Removed to show custom background */}

      {/* Plasma Water Video Background - Shows when I key is pressed (uiVisible) */}
      <AnimatePresence>
        {uiVisible && !showConsoleMode && !showAchievements &&
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-0"
          >
            <video
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/15b006cdb_Plasma-Water.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/60 to-transparent" />
          </motion.div>
        }
      </AnimatePresence>

      {/* Developer Spotlight Overlay (P key) */}
      <AnimatePresence>
        {showDevSpotlight && (
          <DevSpotlightOverlay onClose={() => setShowDevSpotlight(false)} />
        )}
      </AnimatePresence>

      {/* Focus Mode Panel - Shows when UI is hidden (I key) */}
      <AnimatePresence>
        {!uiVisible && !showConsoleMode && !showDevSpotlight &&
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="fixed right-8 z-30 overflow-y-auto pointer-events-none"
            style={{
              left: '440px', /* Offset matches expanded 3D viewer (420px) + 20px gap */
              top: '80px',
              bottom: '32px',
              maxHeight: 'calc(100vh - 112px)',
              minHeight: '800px'
            }}>

            <div className="h-full">
              <FocusModePanel
                 onOpenCalendar={() => setShowCalendar(true)}
                 onBackgroundChange={(url) => setBannerBackgroundUrl(url)}
                 onToggleStats={() => setShowStats((v) => !v)}
                 currentEnvId={currentEnvId}
                 onSelectEnv={handleEnvSelect}
                 onOpenDevSpotlight={() => setShowDevSpotlight(true)}
                />
            </div>
          </motion.div>
        }
      </AnimatePresence>





      {/* Universal Slide-Out Drawer */}
      <AnimatePresence>
        {activeDrawer &&
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setActiveDrawer(null)} />

            <motion.div
              initial={['home', 'settings', 'skill-tree', 'battle', 'story'].includes(activeDrawer.id) ? { opacity: 0, scale: 0.95 } : { x: '-100%', opacity: 0 }}
              animate={['home', 'settings', 'skill-tree', 'battle', 'story'].includes(activeDrawer.id) ? { opacity: 1, scale: 1 } : { x: 0, opacity: 1 }}
              exit={['home', 'settings', 'skill-tree', 'battle', 'story'].includes(activeDrawer.id) ? { opacity: 0, scale: 0.95 } : { x: '-100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed bg-white/[0.03] backdrop-blur-3xl z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col ${['settings', 'skill-tree', 'battle', 'home', 'story'].includes(activeDrawer.id) ?
                'inset-0' :
                'left-0 rounded-3xl'}`
              }
              style={['home', 'settings', 'skill-tree', 'battle', 'story'].includes(activeDrawer.id) ? {
                WebkitBackdropFilter: 'blur(50px) saturate(200%)'
              } : {
                top: '80px',
                bottom: '48px',
                width: '28vw',
                WebkitBackdropFilter: 'blur(50px) saturate(200%)'
              }}>

              {/* Header - Hidden for full screen apps that have their own header */}
              {!['skill-tree', 'battle', 'home', 'story'].includes(activeDrawer.id) &&
                <div className="p-6 flex items-center justify-between">
                  <h2 className="text-white font-bold text-xl tracking-wider uppercase">{activeDrawer.label}</h2>
                  <button
                    onClick={() => setActiveDrawer(null)}
                    className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all">

                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>
              }

              {/* Close Button Overlay for Full Screen Apps (Story has its own internal close button) */}
              {['battle', 'home'].includes(activeDrawer.id) &&
                <button
                  onClick={() => setActiveDrawer(null)}
                  className="fixed top-6 right-6 z-[60] w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center transition-all border border-white/10 text-white">

                  <X className="w-5 h-5" />
                </button>
              }

              {/* Content Area */}
              <div className={`flex-1 overflow-y-auto ${activeDrawer.id === 'skill-tree' ? '' : 'p-6'}`}>
                {activeDrawer.id === 'loadout' ?
                  <LoadoutPanel /> :
                  activeDrawer.id === 'settings' ?
                    <SettingsPanel /> :
                    activeDrawer.id === 'skill-tree' ?
                      <GenreMastery onClose={() => setActiveDrawer(null)} /> :
                      activeDrawer.id === 'battle' ?
                        <BattleModeOverlay onClose={() => setActiveDrawer(null)} /> :
                        activeDrawer.id === 'home' ?
                          <AIHomeOverlay
                            onClose={() => setActiveDrawer(null)}
                            onSelectItem={(item) => setActiveDrawer(item)} /> :

                          activeDrawer.id === 'story' ?
                            <AIStoryOverlay onClose={() => setActiveDrawer(null)} /> :
                            activeDrawer.id === 'games' ?
                              <div className="space-y-6">
                                {/* Pinned Games Header */}
                                <div className="flex items-center justify-between">
                                  <h3 className="text-white/80 font-semibold text-sm uppercase tracking-wider">Pinned Games</h3>
                                  <span className="text-white/40 text-xs">Quick Access</span>
                                </div>

                                {/* Pinned Games Grid */}
                                <div className="grid grid-cols-7 gap-3">
                                  {Array.from({ length: 70 }, (_, i) => {
                                    const games = [
                                      { title: 'Cyberpunk 2088', genre: 'RPG', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400', status: 'Playing' },
                                      { title: 'Neon Legends', genre: 'Action', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400', status: 'Installed' },
                                      { title: 'Stellar Odyssey', genre: 'Space Sim', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400', status: 'Playing' },
                                      { title: 'Shadow Realm', genre: 'Fantasy', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400', status: 'Installed' }];

                                    const game = games[i % games.length];
                                    return { ...game, index: i };
                                  }).map((game, index) =>
                                    <motion.div
                                      key={index}
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: Math.min(index * 0.02, 1) }}
                                      onClick={() => setSelectedGame(game)}
                                      className="group relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer border border-white/10 hover:border-cyan-400/50 transition-all">

                                      {/* Game Image */}
                                      <img src={game.image} alt={game.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />

                                      {/* Gradient Overlay */}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                                      {/* Status Badge */}
                                      <div className="absolute top-1 right-1">
                                        <div className={`w-2 h-2 rounded-full ${game.status === 'Playing' ? 'bg-green-400' : 'bg-blue-400'}`} />
                                      </div>

                                      {/* Game Info - Only on hover */}
                                      <div className="absolute inset-0 flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <p className="text-white/60 text-[8px] uppercase tracking-wider mb-0.5">{game.genre}</p>
                                        <h4 className="text-white font-bold text-[10px] mb-1 truncate">{game.title}</h4>
                                      </div>

                                      {/* Achievements Link - Top Right on Hover */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(createPageUrl('Store') + '?subview=achievements&gameId=' + game.title);
                                        }}
                                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 hover:scale-110 z-10"
                                        title="View Achievements"
                                      >
                                        <Trophy size={12} />
                                      </button>
                                    </motion.div>
                                  )}
                                </div>

                                {/* Add More Games */}
                                <motion.button
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.5 }}
                                  className="w-full border-2 border-dashed border-white/20 hover:border-cyan-400/50 rounded-xl py-8 text-white/40 hover:text-white/80 transition-all flex flex-col items-center justify-center gap-2">

                                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                    <Gamepad2 className="w-6 h-6" />
                                  </div>
                                  <span className="text-sm font-semibold">Pin More Games</span>
                                </motion.button>
                              </div> :

                              <p className="text-white/40 text-sm">{activeDrawer.label} content will appear here</p>
                }
              </div>
            </motion.div>
          </>
        }
      </AnimatePresence>

      {/* Game Detail Drawer - Slides from Right */}
      <AnimatePresence>
        {selectedGame &&
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setSelectedGame(null)} />

            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 border-l rounded-none bg-white/[0.03] backdrop-blur-3xl border-white/[0.08] z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col"
              style={{
                top: '80px',
                bottom: '48px',
                width: '35vw',
                WebkitBackdropFilter: 'blur(50px) saturate(200%)'
              }}>

              {/* Header */}
              <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
                <h2 className="text-white font-bold text-xl tracking-wider uppercase">Game Details</h2>
                <button
                  onClick={() => setSelectedGame(null)}
                  className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all">

                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Game Cover */}
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
                  <img src={selectedGame.image} alt={selectedGame.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-2xl font-bold text-white mb-1">{selectedGame.title}</h3>
                    <p className="text-white/60 text-sm">{selectedGame.genre}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${selectedGame.status === 'Playing' ? 'bg-green-400 animate-pulse' : 'bg-blue-400'}`} />
                  <span className="text-white font-semibold">{selectedGame.status}</span>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 rounded-lg py-3 text-white font-semibold transition-all flex items-center justify-center gap-2">
                    <Gamepad2 className="w-4 h-4" />
                    Launch Game
                  </button>
                  <button className="bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg py-3 text-white font-semibold transition-all">
                    View Library
                  </button>
                </div>

                {/* Game Stats */}
                <div className="space-y-3">
                  <h4 className="text-white/80 font-semibold text-sm uppercase tracking-wider">Statistics</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <p className="text-white/40 text-xs mb-1">Playtime</p>
                      <p className="text-white font-bold text-lg">24.5h</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <p className="text-white/40 text-xs mb-1">Achievements</p>
                      <p className="text-white font-bold text-lg">12/50</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <p className="text-white/40 text-xs mb-1">Last Played</p>
                      <p className="text-white font-bold text-sm">2 hours ago</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <p className="text-white/40 text-xs mb-1">Progress</p>
                      <p className="text-white font-bold text-lg">68%</p>
                    </div>
                  </div>
                </div>

                {/* Recent Achievements */}
                <div className="space-y-3">
                  <h4 className="text-white/80 font-semibold text-sm uppercase tracking-wider">Recent Achievements</h4>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) =>
                      <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-semibold">Achievement Title</p>
                          <p className="text-white/40 text-xs">Unlocked today</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pin/Unpin Button */}
                <button className="w-full bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg py-3 text-white font-semibold transition-all">
                  Unpin from Dashboard
                </button>
              </div>
            </motion.div>
          </>
        }
      </AnimatePresence>



      {/* Main Content Area - Switches based on Console Mode or Achievements */}
      <AnimatePresence mode="wait">
        {showAchievements ? (
          <motion.div
            key="achievements-mode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
          >
            <Achievements 
              showCloseButton={true} 
              onClose={() => navigate(createPageUrl('LunaTemplate'))}
            />
          </motion.div>
        ) : showConsoleMode ? (
          <motion.div
            key="console-mode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-screen pt-20 px-12 pb-12 relative z-20 flex flex-col pointer-events-none"
          >
{!showAvatarProgression && (
            <>
            {/* LIVE STREAM SECTION (Condition Rendered) */}
            <AnimatePresence>
              {showLive && (
                <motion.div
                  initial={{ opacity: 0, height: 0, mb: 0 }}
                  animate={{ opacity: 1, height: 'auto', mb: 24 }}
                  exit={{ opacity: 0, height: 0, mb: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full flex gap-6 overflow-hidden h-[340px] md:h-[380px] lg:h-[420px] pointer-events-auto"
                >
                  {/* Streamy Box */}
                  <div className="basis-[75%] h-full bg-black/40 rounded-2xl border border-white/10 overflow-hidden relative group">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                            <span className="text-white/40">Stream Offline</span>
                        </div>
                    </div>
                    {/* Mock Controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-3">
                            <button className="text-white hover:text-cyan-400"><Play className="w-5 h-5 fill-current" /></button>
                            <span className="text-white text-sm">00:00 / 00:00</span>
                        </div>
                        <button className="text-white hover:text-cyan-400"><Settings className="w-5 h-5" /></button>
                    </div>
                  </div>

                  {/* Chat Box */}
                  <div className="basis-[25%] h-full bg-black/40 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
                        <span className="text-white font-bold text-sm">Stream Chat</span>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    </div>
                    <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                        <div className="text-xs text-white/60">Welcome to the chat!</div>
                        <div className="flex gap-2">
                            <span className="text-cyan-400 text-xs font-bold">Bot:</span>
                            <span className="text-white text-xs">Stream starting soon...</span>
                        </div>
                    </div>
                    <div className="p-3 border-t border-white/10 bg-white/5">
                        <input 
                            type="text" 
                            placeholder="Send a message..." 
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* STATS SECTION (Dropdown) */}
            <AnimatePresence>
              {showStats && (
                <motion.div
                  initial={{ opacity: 0, height: 0, mb: 0 }}
                  animate={{ opacity: 1, height: 'auto', mb: 24 }}
                  exit={{ opacity: 0, height: 0, mb: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full overflow-hidden relative z-20" // High Z to sit above fade
                  style={{ paddingLeft: '440px' }}
                >
                  <div className="bg-black/40 rounded-2xl border border-white/10 p-4 mr-8 pointer-events-auto">
                    <AvatarProgressionBox />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* TOP SECTION: Aspects / Artifacts / Genre */}
            <div className={`flex gap-12 mb-6 items-start pointer-events-auto transition-opacity duration-500 ${hideUI ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              {/* Aspects */}
              <div className="flex flex-col items-center gap-4">
                <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Aspects</h2>
                <div className="relative w-40 h-4">
                  <div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div>
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-[1px] bg-white/10"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/15 bg-black/60"></div>
                </div>
                <div className="flex gap-3">
                  {[1,2,3].map((i)=> (
                    <div key={i} className="w-[60px] h-[60px] rounded-full border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700" style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Artifacts */}
              <div className="flex flex-col items-center gap-4">
                <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Artifacts</h2>
                <div className="relative w-52 h-4">
                  <div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div>
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-[1px] bg-white/10"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/15 bg-black/60"></div>
                </div>
                <div className="flex gap-3">
                  {[1,2,3,4,5].map((i)=> (
                    <div key={i} className="w-[60px] h-[60px] rounded-xl border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700" style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Genre */}
              <div className="flex flex-col items-center gap-4">
                <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Genre</h2>
                <div className="relative w-40 h-4">
                  <div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div>
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-[1px] bg-white/10"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/15 bg-black/60"></div>
                </div>
                <div className="flex gap-3">
                  {[1,2].map((i)=> (
                    <div key={i} className="w-[60px] h-[60px] rounded-xl border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700" style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Divider Line under Game Banner */}
            <div className={`h-px bg-white/10 mb-6 transition-opacity duration-500 ${hideUI ? 'opacity-0' : 'opacity-100'}`} />

            {/* QUICK ACCESS BOXES */}
            <div style={{ paddingLeft: '440px' }}>
            <div className={`flex gap-4 mb-6 pointer-events-auto transition-opacity duration-500 ${hideUI ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              {/* Stats */}
              <ConsoleTile
                onClick={() => setShowStats((v) => !v)}
                className="flex-1 h-28 cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <Grid className="w-10 h-10 relative z-10" style={{ stroke: 'url(#silverGradient)', filter: 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.4))' }} strokeWidth={1.5} />
                <span className="text-[#CCCCCC] text-sm font-sans relative z-10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Stats</span>
              </ConsoleTile>

              {/* Skill Tree */}
              <ConsoleTile
                onClick={() => navigate(createPageUrl('GenreMastery'))}
                className="flex-1 h-28 cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <Bot className="w-10 h-10 relative z-10" style={{ stroke: 'url(#silverGradient)', filter: 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.4))' }} strokeWidth={1.5} />
                <span className="text-[#CCCCCC] text-sm font-sans relative z-10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Skill Tree</span>
              </ConsoleTile>

              {/* Season Pass */}
              <ConsoleTile
                onClick={() => navigate(createPageUrl('SeasonalPass'))}
                className="flex-1 h-28 cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <Crown className="w-10 h-10 relative z-10" style={{ stroke: 'url(#silverGradient)', filter: 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.4))' }} strokeWidth={1.5} />
                <span className="text-[#CCCCCC] text-sm font-sans relative z-10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Season Pass</span>
              </ConsoleTile>

              {/* Achievements */}
              <ConsoleTile
                onClick={() => navigate(createPageUrl('Achievements'))}
                className="flex-1 h-28 cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <Trophy className="w-10 h-10 relative z-10" style={{ stroke: 'url(#silverGradient)', filter: 'drop-shadow(0px 0px 10px rgba(255, 215, 0, 0.6))' }} strokeWidth={1.5} />
                <span className="text-[#CCCCCC] text-sm font-sans relative z-10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Achievements</span>
              </ConsoleTile>

              {/* Leaderboard */}
              <ConsoleTile
                onClick={() => navigate(createPageUrl('Leaderboard'))}
                className="flex-1 h-28 cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <Target className="w-10 h-10 relative z-10" style={{ stroke: 'url(#silverGradient)', filter: 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.4))' }} strokeWidth={1.5} />
                <span className="text-[#CCCCCC] text-sm font-sans relative z-10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Leaderboard</span>
              </ConsoleTile>
            </div>

            {/* Environment Selector (Replaces Game Banner) */}
            <div className={`mb-6 transition-opacity duration-500 ${hideUI ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <EnvironmentSelector currentEnvId={currentEnvId} onSelect={handleEnvSelect} />
            </div>

            </div>

            {/* Main Grid: Leaderboard + 2x2 Right */}
            <div className={`flex-1 flex gap-6 min-h-0 transition-opacity duration-500 ${hideUI ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              {/* Leaderboard Tile - Left */}
              <div className="pointer-events-auto"><LeaderboardTile /></div>

              {/* Right Side - 2x2 Grid */}
              <div className="flex-1 flex flex-col gap-6">
                {/* App Shortcuts */}
                <div className="flex gap-6 flex-1">
                  {/* Settings */}
                  <ConsoleTile
                    onClick={() => navigate(createPageUrl('LunaTemplate') + '?panel=settings')}
                    className="flex-1 cursor-pointer flex flex-col items-center justify-center gap-3 pointer-events-auto"
                  >
                    <Settings className="w-16 h-16 relative z-10" style={{ stroke: 'url(#silverGradient)', filter: 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.4))' }} strokeWidth={1.5} />
                    <span className="text-[#CCCCCC] text-lg font-sans relative z-10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Settings</span>
                  </ConsoleTile>

                  {/* My Games & Apps */}
                  <ConsoleTile
                    onClick={() => navigate(createPageUrl('Store') + '?subview=library')}
                    className="flex-1 cursor-pointer flex flex-col items-center justify-center gap-3 pointer-events-auto"
                  >
                    <Layers className="w-16 h-16 relative z-10" style={{ stroke: 'url(#silverGradient)', filter: 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.4))' }} strokeWidth={1.5} />
                    <span className="text-[#CCCCCC] text-lg font-sans text-center relative z-10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>My games & apps</span>
                  </ConsoleTile>
                </div>
              </div>
            </div>
            </>
            )}

            {showAvatarProgression && (
              <div className="pt-4 pr-8" style={{ paddingLeft: '440px' }}>
                <div className="max-w-5xl mx-auto pointer-events-auto">
                  <AvatarProgressionBox />
                </div>
              </div>
            )}

            {/* Time Display - Bottom Left */}
            <div className="absolute bottom-6 left-12 z-30 pointer-events-auto">
              <span className="text-[#CCCCCC] text-lg font-sans" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
            </div>

            {/* SVG Gradient Definitions */}
            <svg width="0" height="0" className="absolute">
              <defs>
                <linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#A0A0A0" />
                </linearGradient>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFD700" />
                  <stop offset="50%" stopColor="#FFA500" />
                  <stop offset="100%" stopColor="#FF8C00" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        ) : uiVisible ? (
          <motion.div
            key="loadout-mode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full">

            <AnimatePresence mode="wait">
              {false &&
                <motion.div
                  key="hidden-ui"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-full flex gap-8 py-8">

                  {/* Friends List - Far Left */}
                <div className="w-80 flex-shrink-0">
                  <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-full flex flex-col">
                    <FriendRequestsPanel currentUserId={user?.id} />
                    <div className="mt-6 flex-1 overflow-y-auto">
                      <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-400" />
                        Friends Online
                      </h2>
                      <div className="space-y-3">
                        {mockFriends.map((friend) =>
                          <div
                            key={friend.id}
                            onClick={() => setSelectedFriend(friend)}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">

                            <div className="relative">
                              <img src={friend.avatar} alt={friend.name} className="w-12 h-12 rounded-full" />
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${friend.status === 'online' ? 'bg-green-500' : friend.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-500'}`
                              } />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold truncate">{friend.name}</p>
                              {friend.game ?
                                <p className="text-blue-400 text-xs truncate">{friend.game}</p> :
                                
                                <p className="text-slate-500 text-xs">Offline</p>
                              }
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Center - Calendar, Clock & Date */}
                <div className="flex-1 flex flex-col gap-6">
                  {/* Clock & Date */}
                  <div
                    onClick={() => setShowCalendar(true)}
                    className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:bg-white/[0.05] transition-colors">

                    <div className="text-7xl font-bold text-white mb-2 font-mono">
                      {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-2xl text-white/60">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <p className="text-xs text-white/40 mt-2">Click to open calendar</p>
                  </div>

                  {/* Calendar */}
                  <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex-1">
                    <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-400" />
                      Upcoming Events
                    </h2>
                    <div className="space-y-3">
                      {userEvents.slice(0, 3).map((event, i) =>
                        <div
                          key={i}
                          onClick={() => setShowCalendar(true)}
                          className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-purple-400/50 transition-colors cursor-pointer">

                          <div className="flex items-center gap-3">
                            <div className="bg-purple-500/20 rounded-lg px-3 py-2 text-purple-300 font-bold text-sm">
                              {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-semibold">{event.title}</p>
                              {event.game && <p className="text-white/50 text-sm">{event.game}</p>}
                            </div>
                          </div>
                        </div>
                      )}
                      {userEvents.length === 0 &&
                        <p className="text-white/40 text-sm text-center py-4">No upcoming events</p>
                      }
                    </div>
                  </div>

                  <div className="mt-6 w-full max-w-sm">
                  <LunaStatsPanel />
                </div>

                {/* AI News */}
                  <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                      <Radio className="w-5 h-5 text-green-400" />
                      Platform Updates
                    </h2>
                    <div className="space-y-3">
                      {platformUpdates.slice(0, 3).map((update, i) =>
                        <div
                          key={i}
                          onClick={() => setSelectedUpdate(update)}
                          className={`bg-white/5 rounded-lg p-4 border transition-colors cursor-pointer ${update.update_type === 'required' ? 'border-red-500/50 hover:border-red-400' : 'border-white/10 hover:border-green-400/50'}`
                          }>

                          <div className="flex items-start gap-3">
                            <Bot className={`w-5 h-5 flex-shrink-0 mt-0.5 ${update.update_type === 'required' ? 'text-red-400' : 'text-green-400'}`} />
                            <div className="flex-1">
                              <p className="text-white font-semibold mb-1">{update.title}</p>
                              <p className="text-white/60 text-sm">{update.description}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {platformUpdates.length === 0 &&
                        <p className="text-white/40 text-sm text-center py-4">No updates available</p>
                      }
                    </div>
                  </div>
                </div>
                </motion.div>
              }
              {uiVisible &&
                <motion.div
                  key="visible-ui"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full">

                  <AnimatePresence mode="wait">
                  {expandedGenre ?
                    <motion.div
                      key="expanded-genre"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[70] p-8"
                      style={{
                        background: 'rgba(11, 11, 11, 0.95)',
                        backdropFilter: 'blur(40px)',
                        WebkitBackdropFilter: 'blur(40px)'
                      }}
                    >
                      <ExpandedGenreView
                        genre={expandedGenre}
                        onClose={() => setExpandedGenre(null)}
                        onCardClick={setSelectedCardForUpgrade}
                      />
                    </motion.div> :


                      <motion.div
                        key="boxes"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex h-full relative">

                        {/* Left: 3D Viewer Spacing */}
                        <div className="w-[420px] flex-shrink-0" />



                        {/* Middle: All Equipment Sections - positioned below header */}
                        <div className="flex flex-col gap-8 flex-shrink-0 ml-8 relative z-30 items-center mt-20">
                          {/* Top Row: Armor and Weapons with Genre */}
                          <div className="flex gap-12 items-start">
                            {/* Armor - 3x3 Grid */}
                            <div className="flex flex-col items-center gap-4">
                              <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Armor</h2>
                              <div className="relative w-48 h-4 mb-2"><div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div><div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-[1px] bg-white/10"></div><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/15 bg-black/60"></div></div>
                              <div className="grid grid-cols-3 gap-3">{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {const slotId = `armor-${i}`; const equippedItem = equippedItems[slotId]; return (<div key={slotId} onClick={() => handleBoxClick(slotId)} className="w-[60px] h-[60px] rounded-xl border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700" style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}><div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />{equippedItem && <img src={equippedItem.icon_url || equippedItem.icon} alt={equippedItem.name} className="w-full h-full object-contain p-2 relative z-10" />}</div>);})}</div>
                            </div>

                            {/* Weapons with Genre to the right */}
                            <div className="flex gap-8 items-start">
                              {/* Weapons */}
                              <div className="flex flex-col items-center">
                                <h2 className="text-[10px] font-light tracking-[0.35em] uppercase mb-4 text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Weapons</h2>
                                <div className="relative w-64 h-4 mb-4">
                                  <div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div>
                                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-20 h-[1px] bg-white/10"></div>
                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/15 bg-black/60"></div>
                                </div>
                                <div className="flex gap-3">
                                  {[1, 2, 3].map((i) => {
                                    const slotId = `weapon-${i}`;
                                    const equippedItem = equippedItems[slotId];
                                    return (<div key={slotId} onClick={() => handleBoxClick(slotId)} className="w-[60px] h-[60px] rounded-xl border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700" style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}><div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />{equippedItem && <img src={equippedItem.icon_url || equippedItem.icon} alt={equippedItem.name} className="w-full h-full object-contain p-2 relative z-10" />}</div>);
                                  })}
                                </div>
                              </div>

                              {/* Genre (right of Weapons) */}
                              <div className="flex flex-col items-center gap-4">
                                <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Genre</h2>
                                <div className="relative w-40 h-4"><div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div><div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-[1px] bg-white/10"></div><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/15 bg-black/60"></div></div>
                                <div className="flex gap-3">{[1, 2].map((i) => {const slotId = `genre-${i}`; const equippedItem = equippedItems[slotId]; return (<div key={slotId} onClick={() => handleBoxClick(slotId)} className="w-[60px] h-[60px] rounded-xl border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700" style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}><div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />{equippedItem && <img src={equippedItem.icon_url || equippedItem.icon} alt={equippedItem.name} className="w-full h-full object-contain p-2 relative z-10" />}</div>);})}</div>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Row: Aspects, Artifacts, Genre (pushed to very bottom) */}
                          <div className="flex gap-8 mt-32">
                            {/* Aspects */}
                            <div className="flex flex-col items-center gap-4">
                              <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Aspects</h2>
                              <div className="relative w-40 h-4"><div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div><div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-[1px] bg-white/10"></div><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/15 bg-black/60"></div></div>
                              <div className="flex gap-3">{[1, 2, 3].map((i) => {const slotId = `aspect-${i}`; const equippedItem = equippedItems[slotId]; return (<div key={slotId} onClick={() => handleBoxClick(slotId)} className="w-[60px] h-[60px] rounded-full border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700" style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}><div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />{equippedItem && <img src={equippedItem.icon_url || equippedItem.icon} alt={equippedItem.name} className="w-full h-full object-contain p-2 relative z-10" />}</div>);})}</div>
                            </div>

                            {/* Artifacts */}
                            <div className="flex flex-col items-center gap-4">
                              <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Artifacts</h2>
                              <div className="relative w-52 h-4"><div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div><div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-[1px] bg-white/10"></div><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/15 bg-black/60"></div></div>
                              <div className="flex gap-3">{[1, 2, 3, 4, 5].map((i) => {const slotId = `artifact-${i}`; const equippedItem = equippedItems[slotId]; return (<div key={slotId} onClick={() => handleBoxClick(slotId)} className="w-[60px] h-[60px] rounded-xl border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700" style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}><div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />{equippedItem && <img src={equippedItem.icon_url || equippedItem.icon} alt={equippedItem.name} className="w-full h-full object-contain p-2 relative z-10" />}</div>);})}</div>
                            </div>

                            {/* Genre (bottom row) */}
                            <div className="flex flex-col items-center gap-4">
                              <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Genre</h2>
                              <div className="relative w-40 h-4"><div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div><div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-[1px] bg-white/10"></div><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/15 bg-black/60"></div></div>
                              <div className="flex gap-3">{[3, 4].map((i) => {const slotId = `genre-${i}`; const equippedItem = equippedItems[slotId]; return (<div key={slotId} onClick={() => handleBoxClick(slotId)} className="w-[60px] h-[60px] rounded-xl border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700" style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}><div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />{equippedItem && <img src={equippedItem.icon_url || equippedItem.icon} alt={equippedItem.name} className="w-full h-full object-contain p-2 relative z-10" />}</div>);})}</div>
                            </div>
                          </div>
                        </div>


                      </motion.div>
                  }
                  </AnimatePresence>
                </motion.div>
              }
            </AnimatePresence>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Inventory Panel Overlay (Global) - Single Instance */}
      {/* Moved out of AnimatePresence to ensure single stable instance when visible */}
      {clickedSlot && (
        <div 
          className="fixed inset-0 z-[60]"
          key="inventory-panel-container"
        >
          <InventoryPanel
            onEquip={handleEquipItem}
            targetSlot={clickedSlot}
            onClose={() => setClickedSlot(null)}
          />
        </div>
      )}

      {/* Avatar Progression Overlay (O key) */}
      <AnimatePresence>
        {showAvatarProgression && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowAvatarProgression(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 bg-white/[0.03] backdrop-blur-3xl z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col"
              style={{ WebkitBackdropFilter: 'blur(50px) saturate(200%)' }}
            >
              <div className="flex-1 overflow-y-auto p-8">
                <AvatarProgressionBox />
              </div>
              <button
                onClick={() => setShowAvatarProgression(false)}
                className="fixed top-6 right-6 z-[60] w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center transition-all border border-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Settings Overlay */}
      <AnimatePresence>
        {showSettings &&
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowSettings(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 bg-white/[0.03] backdrop-blur-3xl z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col"
              style={{ WebkitBackdropFilter: 'blur(50px) saturate(200%)' }}>

              <div className="flex-1 overflow-y-auto">
                <SettingsPanel />
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="fixed top-6 right-6 z-[60] w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center transition-all border border-white/10 text-white">

                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </>
        }
      </AnimatePresence>

      {/* AI News Overlay */}
      <AnimatePresence>
        {showAINews &&
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowAINews(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 bg-white/[0.03] backdrop-blur-3xl z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col"
              style={{ WebkitBackdropFilter: 'blur(50px) saturate(200%)' }}>

              <div className="flex-1 overflow-y-auto">
                <AINewsContent />
              </div>

              <button
                onClick={() => setShowAINews(false)}
                className="fixed top-6 right-6 z-[60] w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center transition-all border border-white/10 text-white">

                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </>
        }
      </AnimatePresence>

      {/* Seasonal Pass Overlay */}
      <AnimatePresence>
        {showSeasonalPass &&
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowSeasonalPass(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 bg-white/[0.03] backdrop-blur-3xl z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col"
              style={{ WebkitBackdropFilter: 'blur(50px) saturate(200%)' }}>

              <div className="flex-1 overflow-y-auto">
                <SeasonalPassContent />
              </div>

              <button
                onClick={() => setShowSeasonalPass(false)}
                className="fixed top-6 right-6 z-[60] w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center transition-all border border-white/10 text-white">

                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </>
        }
      </AnimatePresence>





      {/* Pin Games Overlay */}
      <AnimatePresence>
        {showPinGames &&
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowPinGames(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-50 flex flex-col p-8"
              style={{
                background: 'rgba(30, 41, 59, 0.25)', // Very translucent grayish dark blue
                backdropFilter: 'blur(16px) saturate(140%)',
                WebkitBackdropFilter: 'blur(16px) saturate(140%)',
                boxShadow: 'inset 0 0 40px rgba(255, 255, 255, 0.05)'
              }}>

              <div className="flex-1 overflow-hidden">
                <PinGamesContent />
              </div>

              <button
                onClick={() => setShowPinGames(false)}
                className="fixed top-6 right-6 z-[60] w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center transition-all border border-white/10 text-white">

                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </>
        }
      </AnimatePresence>

      {/* Card Enhancement Overlay */}
      <AnimatePresence>
        {selectedCardForUpgrade &&
          <CardEnhancementOverlay
            card={selectedCardForUpgrade}
            onClose={() => setSelectedCardForUpgrade(null)} />

        }


      </AnimatePresence>

      {/* Blank Page Overlay */}
      <AnimatePresence>
        {showBlankPage &&
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowBlankPage(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-50 flex flex-col p-8"
              style={{
                background: 'linear-gradient(135deg, rgba(147, 197, 253, 0.15) 0%, rgba(191, 219, 254, 0.1) 50%, rgba(147, 197, 253, 0.05) 100%)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 8px 32px rgba(59, 130, 246, 0.15)'
              }}>

              {/* Header with Tabs */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-6">
                  <h2 className="text-3xl font-bold text-white/90 drop-shadow-lg">User Interface</h2>
                  <div className="h-8 w-px bg-white/20" />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setBlankPageTab('entertainment')}
                      className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${blankPageTab === 'entertainment' ?
                        'text-white shadow-[0_8px_32px_rgba(59,130,246,0.3)]' :
                        'text-white/60 hover:text-white'}`
                      }
                      style={blankPageTab === 'entertainment' ? {
                        background: 'rgba(59, 130, 246, 0.3)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(147, 197, 253, 0.3)'
                      } : {}}>

                      Entertainment
                    </button>
                    <button
                      onClick={() => setBlankPageTab('streaming')}
                      className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${blankPageTab === 'streaming' ?
                        'text-white shadow-[0_8px_32px_rgba(59,130,246,0.3)]' :
                        'text-white/60 hover:text-white'}`
                      }
                      style={blankPageTab === 'streaming' ? {
                        background: 'rgba(59, 130, 246, 0.3)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(147, 197, 253, 0.3)'
                      } : {}}>

                      Streaming
                    </button>
                    <button
                      onClick={() => setBlankPageTab('social')}
                      className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${blankPageTab === 'social' ?
                        'text-white shadow-[0_8px_32px_rgba(59,130,246,0.3)]' :
                        'text-white/60 hover:text-white'}`
                      }
                      style={blankPageTab === 'social' ? {
                        background: 'rgba(59, 130, 246, 0.3)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(147, 197, 253, 0.3)'
                      } : {}}>

                      Social Hub
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowBlankPage(false)}
                  className="text-white/60 hover:text-white transition-colors">

                  <X className="w-8 h-8" />
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={blankPageTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full overflow-y-auto">

                    {blankPageTab === 'entertainment' &&
                      <AnimatePresence mode="wait">
                        {!selectedStreamingService ?
                          <motion.div
                            key="service-grid"
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.4 }}
                            className="grid grid-cols-4 gap-4">

                            {[
                              { name: 'Netflix', icon: Film, color: 'rgba(229, 9, 20, 0.3)', topText: 'Netflix', bottomText: '' },
                              { name: 'Disney+', icon: Sparkles, color: 'rgba(17, 60, 207, 0.3)', topText: 'Disney', bottomText: '+' },
                              { name: 'HBO Max', icon: Play, color: 'rgba(185, 28, 255, 0.3)', topText: 'HBO', bottomText: 'Max' },
                              { name: 'Prime Video', icon: ShoppingBag, color: 'rgba(0, 168, 225, 0.3)', topText: 'Prime', bottomText: 'Video' },
                              { name: 'Hulu', icon: Tv, color: 'rgba(28, 231, 131, 0.3)', topText: 'Hulu', bottomText: '' },
                              { name: 'Apple TV+', icon: Monitor, color: 'rgba(0, 0, 0, 0.5)', topText: 'Apple', bottomText: 'TV+' },
                              { name: 'Paramount+', icon: Mountain, color: 'rgba(0, 99, 235, 0.3)', topText: 'Paramount', bottomText: '+' },
                              { name: 'Peacock', icon: Feather, color: 'rgba(0, 0, 0, 0.4)', topText: 'Peacock', bottomText: '' }].
                              map((service, idx) => {
                                const Icon = service.icon;
                                return (
                                  <motion.div
                                    key={service.name}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => setSelectedStreamingService(service.name)}
                                    className="w-20 h-20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-transform p-1"
                                    style={{
                                      background: `linear-gradient(135deg, ${service.color} 0%, rgba(147, 197, 253, 0.15) 100%)`,
                                      backdropFilter: 'blur(20px)',
                                      WebkitBackdropFilter: 'blur(20px)',
                                      border: '1px solid rgba(255, 255, 255, 0.3)',
                                      boxShadow: '0 4px 16px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                    }}>

                                    <span className="text-white/90 text-[10px] font-semibold">{service.topText}</span>
                                    <Icon className="w-5 h-5 text-white/90 my-0.5" />
                                    {service.bottomText && <span className="text-white/90 text-[10px] font-semibold">{service.bottomText}</span>}
                                  </motion.div>);

                              })}
                          </motion.div> :

                          <motion.div
                            key="streaming-app"
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="fixed inset-0 flex items-center justify-center bg-black z-[100]">

                            <button
                              onClick={() => setSelectedStreamingService(null)}
                              className="fixed top-8 right-8 text-white/60 hover:text-white transition-colors">

                              <X className="w-8 h-8" />
                            </button>

                            <div className="text-center">
                              <Clapperboard className="w-16 h-16 text-white/40 mx-auto mb-4" />
                              <p className="text-white/60 text-lg">{selectedStreamingService} app will load here</p>
                              <p className="text-white/40 text-sm mt-2">Streaming interface coming soon</p>
                            </div>
                          </motion.div>
                        }
                      </AnimatePresence>
                    }
                    {blankPageTab === 'streaming' &&
                      <StreamingDiscovery />
                    }
                    {blankPageTab === 'social' &&
                      <SocialHub />
                    }
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        }
      </AnimatePresence>

      {/* Side Access Menu - Minimally invasive left edge interaction */}
      {!clickedSlot && !showConsoleMode && !showAchievements && !activeSubTab && (
        // SideAccessMenu stays visible even when hideUI is true, per user request:
        // "You're going to keep the button that's below the navigation menu. Inside this button is my library, aura, and entertainment."
        // SideAccessMenu contains Library, Entertainment, AI Story, AI Battle - close enough match
        <SideAccessMenu />
      )}

      {/* Calendar Overlay */}
      <AnimatePresence>
        {showCalendar && (
          <IntelligentCalendarOverlay onClose={() => setShowCalendar(false)} currentUserId={user?.id} />
        )}
      </AnimatePresence>

      {/* Sub-Page Views - Blacksmith, Season Pass, Entertainment, Clan, Forum */}
      <AnimatePresence>
        {activeSubTab &&
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-40"
            style={{
              background: 'linear-gradient(135deg, #0a0d14 0%, #111827 25%, #1a202c 50%, #111827 75%, #0a0d14 100%)'
            }}>

             {/* Close Blacksmith -> Console */}
             {activeSubTab === 'blacksmith' && (
               <button
                 onClick={() => navigate(createPageUrl('LunaTemplate') + '?panel=console')}
                 className="fixed top-6 right-6 z-[60] w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center transition-all border border-white/10 text-white"
               >
                 <X className="w-5 h-5" />
               </button>
             )}

             <div className={`h-full w-full overflow-hidden ${activeSubTab === 'entertainment' ? '' : 'pt-20'}`}>
              {activeSubTab === 'forum' && <CommunityPage />}
              {activeSubTab === 'blacksmith' && <Blacksmith />}
              {activeSubTab === 'seasonalpass' && <SeasonalPassContent />}
              {activeSubTab === 'entertainment' && <EntertainmentHub />}
              {activeSubTab === 'clan' && <div className="text-white p-8">Clan Content Here</div>}
            </div>
          </motion.div>
        }
      </AnimatePresence>

    </div>
    </GlassPageFrame>
    </PageErrorBoundary>
    );


}