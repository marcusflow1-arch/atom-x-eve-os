import React, { useState, useEffect, useRef } from 'react';
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

// Transparent 3D Model Viewer with WASD Controls
function TransparentModel3DViewer({ modelUrl, weaponModel, triggerAnimation, backgroundUrl, roomModelUrl, activeScene, isStatsOpen }) {

  const logChange = (entry) => {
    try {
      window.dispatchEvent(new CustomEvent('base44-change-log', { detail: { time: Date.now(), ...entry } }));
    } catch {}
  };
  
  const clearGroup = (group) => {
    if (!group) return;
    while (group.children.length) {
      const child = group.children.pop();
      if (child && child.traverse) {
        child.traverse((n) => {
          if (n.geometry && n.geometry.dispose) n.geometry.dispose();
          if (n.material) {
            if (Array.isArray(n.material)) n.material.forEach((m) => m && m.dispose && m.dispose());
            else if (n.material.dispose) n.material.dispose();
          }
        });
      }
    }
  };

  // Scale model so its final world height matches a target (meters-like units)
  const adjustModelScaleToWorldHeight = (model, targetWorldHeight = 1.8) => {
    try {
      // Current model local height
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const height = Math.max(size.y, 1e-6);

      // Account for container scale (actorContainerRef scales the whole character group)
      const containerScale = actorContainerRef.current ? actorContainerRef.current.scale.x : 1;
      const desiredLocalHeight = targetWorldHeight / (containerScale || 1);
      const s = desiredLocalHeight / height;
      model.scale.multiplyScalar(s);

      // Recenter and place feet on ground after scaling
      const box2 = new THREE.Box3().setFromObject(model);
      const center2 = box2.getCenter(new THREE.Vector3());
      model.position.x -= center2.x;
      model.position.z -= center2.z;
      model.position.y -= box2.min.y;
    } catch (e) {
      console.warn('adjustModelScaleToWorldHeight failed', e);
    }
  };

  // Fit model height to a fraction of the environment height (uses world transforms)
  const adjustModelScaleToEnvironment = (model, envHeightRatio = 0.18) => {
    try {
      if (!worldContainerRef.current) return;
      const envBox = new THREE.Box3().setFromObject(worldContainerRef.current);
      const envSize = envBox.getSize(new THREE.Vector3());
      const envH = Math.max(envSize.y, 1e-6);
      const desiredWorldH = envH * envHeightRatio;

      const modelBoxWorld = new THREE.Box3().setFromObject(model);
      const modelWorldH = Math.max(modelBoxWorld.getSize(new THREE.Vector3()).y, 1e-6);
      const k = desiredWorldH / modelWorldH;
      model.scale.multiplyScalar(k);

      // Recenter and place feet on ground after scaling
      const box2 = new THREE.Box3().setFromObject(model);
      const center2 = box2.getCenter(new THREE.Vector3());
      model.position.x -= center2.x;
      model.position.z -= center2.z;
      model.position.y -= box2.min.y;
    } catch (e) {
      console.warn('adjustModelScaleToEnvironment failed', e);
    }
  };

  const containerRef = useRef(null);
  const modelRef = useRef(null);
  const weaponRef = useRef(null);
  const actionsRef = useRef({});
  const keysPressed = useRef({});
  const velocityRef = useRef(new THREE.Vector3());
  const isJumpingRef = useRef(false);
  const isRollingRef = useRef(false);
  const rollTimerRef = useRef(0);
  const controlsActive = useRef(false);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const [animations, setAnimations] = React.useState([]);
  const [isActive, setIsActive] = React.useState(false);
  const [weaponAttached, setWeaponAttached] = React.useState(false);
  const currentWeaponRef = useRef(null);
  const currentBaseActionRef = useRef(null);
  const worldContainerRef = useRef(null);
  const roomContainerRef = useRef(null);
  const actorContainerRef = useRef(null);
  const roomMeshesRef = useRef([]);
  const mixerRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());

  const envLoadedRef = useRef(false);
  const actorLoadedRef = useRef(false);
  const [isModelReady, setIsModelReady] = useState(false); // State to trigger script injection after load
  const currentEnvKeyRef = useRef(null);
  const cameraResetRef = useRef(false);
  const collisionMeshesRef = useRef([]); // Dedicated collision storage
  const npcInstancesRef = useRef({});
  const instanceScriptsMapRef = useRef({});

  // Load scripts bound to scene instances (build map once per activeScene)
  useEffect(() => {
    const loadScripts = async () => {
      if (!activeScene?.objects) { instanceScriptsMapRef.current = {}; return; }
      const ids = Array.from(new Set(activeScene.objects.flatMap(o => (o.scripts || []).map(s => s.script_id))));
      if (ids.length === 0) { instanceScriptsMapRef.current = {}; return; }
      try {
        const all = await base44.entities.Model3DScript.list();
        const map = {};
        all.forEach(s => { if (ids.includes(s.id)) map[s.id] = s; });
        instanceScriptsMapRef.current = map;
      } catch (e) {
        console.error('Failed to load instance scripts:', e);
      }
    };
    loadScripts();
  }, [activeScene]);

  // Handle Window Resize for Full Page Coverage
  useEffect(() => {
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current && containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Local background layers for crossfade (no remounts)
  const [bgA, setBgA] = React.useState(null);
  const [bgB, setBgB] = React.useState(null);
  const [activeBg, setActiveBg] = React.useState('A');

  useEffect(() => {
    if (!backgroundUrl) return;
    if (activeBg === 'A') {
      setBgB(backgroundUrl);
      requestAnimationFrame(() => setActiveBg('B'));
    } else {
      setBgA(backgroundUrl);
      requestAnimationFrame(() => setActiveBg('A'));
    }
  }, [backgroundUrl, activeBg]);

  // Zustand store state
  const equipment = useLunaStore((state) => state.equipment);
  const actions = useLunaStore((state) => state.actions);
  const animationBindings = useLunaStore((state) => state.animationBindings);
  const clearActions = useLunaStore((state) => state.clearActions);

  // --- SCRIPT INJECTION SYSTEM ---
  // Fetch and execute active Model3DScripts
  const { data: scripts } = useQuery({ 
      queryKey: ['modelScripts'], 
      queryFn: () => base44.entities.Model3DScript.filter({ is_active: true }),
      staleTime: 60000
  });

  const scriptsExecutedRef = useRef(new Set());

  useEffect(() => {
      // Only run scripts when the model is fully loaded and ready
      if (!scripts || !actorContainerRef.current || !sceneRef.current || !isModelReady) return;

      scripts.forEach(script => {
          // Prevent duplicate execution if script is meant to run once (init)
          const scriptKey = `${script.id}-${modelUrl}-${Date.now()}`; // Force re-run on model reload
          // We allow re-execution on model reload, so we don't check persistent history too aggressively for same model URL
          // But we want to avoid loop. 
          // Let's clear history when model changes? 
          // Simplified: Just run it. The dependencies handle the "when".
          
          try {
              console.log(`Executing 3D Script: ${script.name}`);
              const func = new Function(
                  'THREE', 'scene', 'camera', 'renderer', 'model', 'mixer', 'actions', 'controls', 'clock', 'store',
                  script.script_code
              );
              func(
                  THREE, 
                  sceneRef.current, 
                  cameraRef.current, 
                  rendererRef.current, 
                  actorContainerRef.current, 
                  mixerRef.current, 
                  actionsRef.current, 
                  controlsRef.current, 
                  clockRef.current,
                  {
                      getState: useLunaStore.getState,
                      setState: useLunaStore.setState,
                      subscribe: useLunaStore.subscribe
                  }
              );
          } catch (e) {
              console.error(`Error running script ${script.name}:`, e);
          }
      });
  }, [scripts, modelUrl, isModelReady]);

  // Fetch animations for Y Bot
  useEffect(() => {
    const fetchAnimations = async () => {
      try {
        const anims = await base44.entities.AnimationFBX.list();
        setAnimations(anims);
      } catch (error) {
        console.error('Failed to load animations:', error);
      }
    };
    fetchAnimations();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Read onboarding preference for path-based environment
    const preferredPath = (localStorage.getItem('atom_eve_preferred_path') || '').toLowerCase();

    // Initialize persistent scene ONCE
    const scene = sceneRef.current || new THREE.Scene();
    sceneRef.current = scene;
    scene.background = null;

    // CLEANUP: Remove any rogue grids
    scene.traverse((child) => {
        if (child.type === 'GridHelper' || child.name.toLowerCase().includes('grid')) {
            child.visible = false;
            // We can try to remove it, but traversing and removing is tricky. Hiding is safer.
        }
    });

    // STRICT VISIBILITY ENFORCEMENT: Lighting Override
    if (!scene.getObjectByName('Visibility_Override_Light')) {
        const pointLight = new THREE.PointLight(0xffffff, 2, 100);
        pointLight.name = 'Visibility_Override_Light';
        pointLight.position.set(0, 5, 0);
        scene.add(pointLight);
    }

    // Add Hemisphere Light for global illumination (fixes black models)
    if (!scene.getObjectByName('Hemi_Light')) {
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2.0); // High intensity
        hemiLight.name = 'Hemi_Light';
        hemiLight.position.set(0, 20, 0);
        scene.add(hemiLight);
    }

    // SYSTEM REBOOT: PERSISTENT LAYERS
    if (!worldContainerRef.current) {
      // Use this as the main "Environment_Layer" for the room
      const env = new THREE.Group();
      env.name = 'Environment_Layer';
      // Scale Safety: Force 1
      env.scale.set(1, 1, 1);
      // Rotate 180 to face the user (Camera is at +Z)
      env.rotation.y = Math.PI;
      worldContainerRef.current = env;
      
      // Force Layer Addition
      scene.add(env);
      
      // Grid removed per user request
      }
    
    // Ensure room container is just an alias or sub-part if needed, but per prompt "Environment_Layer" is key.
    // We will use worldContainerRef as the Environment_Layer for Room 1.
    
    if (!actorContainerRef.current) {
      const actor = new THREE.Group();
      actor.name = 'Actor_Layer';
      actor.scale.setScalar(0.01); // FBX Scale
      // Position actor near the edge (closer to camera)
      actor.position.set(0, 0, 3.5); 
      actorContainerRef.current = actor;
      scene.add(actor);
    }



    const camera = cameraRef.current || new THREE.PerspectiveCamera(50, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 5000);
    cameraRef.current = camera;
    
    // Initial Camera Position (Better Angle)
    // Position camera behind and slightly above (assuming character at 0,0,0)
    // Z+ is typically "back" in Three.js standard coordinates if character faces Z-
    // Updated to match isometric-like view (higher and further) per user request
    camera.position.set(0, 6, 12);

    const renderer = rendererRef.current || new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0x000000, 0);
    
    // Frustum Check: Set Encoding for Visibility
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    if (!renderer.domElement.parentNode) {
      containerRef.current.appendChild(renderer.domElement);
    }

    // Lighting only added once
    if (!scene.getObjectByName('Ambient_Light')) {
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      ambientLight.name = 'Ambient_Light';
      scene.add(ambientLight);
    }
    if (!scene.getObjectByName('Key_Light')) {
      // Optional sumi-e fog for ink-wash depth
      if (!scene.fog) {
        scene.fog = new THREE.FogExp2(0x0b0b0b, 0.02);
      }
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // Increased intensity
      directionalLight.name = 'Key_Light';
      directionalLight.position.set(5, 10, 7);
      directionalLight.castShadow = true;
      scene.add(directionalLight);

      // Add Fill Light from opposite side
      const fillLight = new THREE.DirectionalLight(0xaaccff, 0.8);
      fillLight.name = 'Fill_Light';
      fillLight.position.set(-5, 5, -5);
      scene.add(fillLight);
    }

    const controls = controlsRef.current || new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    
    // Enable Camera Control (Right-Click to Rotate)
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE
    };

    controls.minDistance = 2;
    controls.maxDistance = 500;
    controls.enabled = true;
    
    // Initialize tracking target
    if (actorContainerRef.current) {
        const target = actorContainerRef.current.position.clone();
        controls.target.copy(target);
        // Store initial target for tracking delta
        controls.lastTarget = target.clone();
        logChange({ scope: '3d', file: 'pages/LunaTemplate', action: 'controls-target', summary: 'OrbitControls target set to Actor_Layer' });
    }

    const handleCanvasClick = (event) => {
      // Raycast to check if clicking on Y-Bot
      if (!actorContainerRef.current) return;

      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycasterSelect = new THREE.Raycaster();
      raycasterSelect.setFromCamera(mouse, camera);

      // Recursive intersection check on actor
      const intersects = raycasterSelect.intersectObject(actorContainerRef.current, true);

      if (intersects.length > 0) {
        // Clicked on Y-Bot -> Activate Controls
        controlsActive.current = true;
        setIsActive(true);
        renderer.domElement.style.cursor = 'crosshair'; // Visual feedback
        // Optional: Highlight or effect
      } else {
        // Clicked elsewhere -> Optional: Deselect or just keep focus if appropriate
        // For now, we allow clicking empty space to NOT toggle off immediately if dragging, 
        // but let's keep it simple: Click Y-Bot to engage.
        // If we want to deselect on background click:
        // controlsActive.current = false;
        // setIsActive(false);
        // renderer.domElement.style.cursor = 'pointer';
      }
    };
    renderer.domElement.addEventListener('click', handleCanvasClick);
    renderer.domElement.style.cursor = 'pointer';

    let mixer = null;

    // Utility: clear a container without clearing the whole scene
    const clearGroup = (group) => {
      if (!group) return;
      while (group.children.length) {
        const child = group.children.pop();
        if (child && child.traverse) {
          child.traverse((n) => {
            if (n.geometry && n.geometry.dispose) n.geometry.dispose();
            if (n.material) {
              if (Array.isArray(n.material)) n.material.forEach((m) => m && m.dispose && m.dispose());
              else if (n.material.dispose) n.material.dispose();
            }
          });
        }
      }
    };


    const clock = new THREE.Clock();

    let isFBX = false;
    if (modelUrl) {
        const extension = modelUrl.split('.').pop().toLowerCase();
        isFBX = extension === 'fbx';
        logChange({ scope: '3d', file: 'pages/LunaTemplate', action: 'asset-load', summary: isFBX ? 'Loading FBX into Actor_Layer' : 'Loading GLTF into Environment_Layer' });
    }

    // Conditional Environment Loading based on onboarding preference
    const envMapUrl = preferredPath === 'story'
      ? 'story_world.glb'
      : preferredPath === 'battle'
        ? 'arena_world.glb'
        : null;



    // Asset Injection: Load Room (Environment) into Environment_Layer
    if (roomModelUrl && worldContainerRef.current) {
      console.log("Attempting to load Environment (Room):", roomModelUrl);
      const isRoomFBX = roomModelUrl.toLowerCase().includes('.fbx');
      const roomLoader = isRoomFBX ? new FBXLoader() : new GLTFLoader();
      
      // Set resource path to help loader find textures in the same directory
      const resourcePath = roomModelUrl.substring(0, roomModelUrl.lastIndexOf('/') + 1);
      roomLoader.setPath(resourcePath);

      roomLoader.load(
        roomModelUrl.substring(roomModelUrl.lastIndexOf('/') + 1), // Load just the filename, using setPath for base
        (loadedAsset) => {
          const room = isRoomFBX ? loadedAsset : loadedAsset.scene;
          
          // Scale Safety: Explicitly set to 1 to ensure Room 2 fits standard units
          room.scale.set(1, 1, 1); 
          room.position.set(0, 0, 0);
          
          // Standardize materials for clean blending and visibility
          room.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              
              // Helper to fix material properties
              const fixMaterial = (mat) => {
                mat.side = THREE.DoubleSide;
                // If material is very dark or metallic without envMap, it appears black.
                // Reduce metalness and ensure color isn't pitch black if map is missing.
                if (mat.metalness > 0.8) mat.metalness = 0.2; 
                if (mat.roughness < 0.2) mat.roughness = 0.8;
                mat.needsUpdate = true;
              };

              if (child.material) {
                 if (Array.isArray(child.material)) child.material.forEach(fixMaterial);
                 else fixMaterial(child.material);
              }
            }
          });

          // Clear previous environment and add the new Room
          clearGroup(worldContainerRef.current);
          worldContainerRef.current.add(room);
          
          // Apply Scene Layout Transform (if exists)
          if (activeScene && activeScene.environment_transform) {
              const t = activeScene.environment_transform;
              if (t.position) room.position.set(t.position.x, t.position.y, t.position.z);
              if (t.rotation) room.rotation.set(t.rotation.x, t.rotation.y, t.rotation.z);
              if (t.scale) room.scale.set(t.scale.x, t.scale.y, t.scale.z);
          }

          // Cache meshes for collision detection (Static Mesh System)
          const meshes = [];
          room.traverse((child) => {
            if (child.isMesh) {
                // Ensure it's treated as a static mesh
                child.matrixAutoUpdate = false; 
                child.updateMatrix();
                meshes.push(child);
            }
          });
          collisionMeshesRef.current = meshes; // Update persistent collision ref
          roomMeshesRef.current = meshes;
          console.log(`Environment_Layer successfully loaded Room (${isRoomFBX ? 'FBX' : 'GLTF'}) from Admin:`, roomModelUrl);
          // If the actor is already present, refit it to this environment
          if (modelRef.current) adjustModelScaleToEnvironment(modelRef.current, 0.18);
        },
        undefined,
        (err) => console.error('Error loading Room Model:', err)
      );
    }

    // Load Additional Scene Objects
    if (activeScene && activeScene.objects) {
        // Reset per-instance script state for fresh load
        npcInstancesRef.current = {};
        activeScene.objects.forEach(obj => {
            if (obj.type === 'spawn_point') {
                // Set Avatar Spawn Position & Scale
                if (actorContainerRef.current) {
                    const t = obj.transform;
                    if (t.position) actorContainerRef.current.position.set(t.position.x, t.position.y, t.position.z);
                    if (t.rotation) actorContainerRef.current.rotation.set(t.rotation.x, t.rotation.y, t.rotation.z);
                    if (t.scale) actorContainerRef.current.scale.set(t.scale.x, t.scale.y, t.scale.z);
                }
            } else if (obj.model_url) {
                // Load static props
                const ext = obj.model_url.split('.').pop().toLowerCase();
                const loader = ext === 'fbx' ? new FBXLoader() : new GLTFLoader();
                loader.load(obj.model_url, (asset) => {
                    const model = asset.scene || asset;
                    const t = obj.transform;
                    if (t.position) model.position.set(t.position.x, t.position.y, t.position.z);
                    if (t.rotation) model.rotation.set(t.rotation.x, t.rotation.y, t.rotation.z);
                    if (t.scale) model.scale.set(t.scale.x, t.scale.y, t.scale.z);

                    // Attach to world (collision eligible) or scene
                    if (worldContainerRef.current) {
                        worldContainerRef.current.add(model);
                        model.traverse(child => {
                            if (child.isMesh) {
                                child.matrixAutoUpdate = false;
                                child.updateMatrix();
                                collisionMeshesRef.current.push(child);
                            }
                        });
                    } else {
                        scene.add(model);
                    }

                    // Register as instance and wire scripts
                    const instanceId = obj.id;
                    const instanceEntry = { object3d: model, updates: [], mixer: null };

                    // Create a mixer if animations exist on the loaded asset
                    if (asset.animations && asset.animations.length > 0) {
                        try {
                            instanceEntry.mixer = new THREE.AnimationMixer(model);
                            const action = instanceEntry.mixer.clipAction(asset.animations[0]);
                            action.play();
                        } catch {}
                    }

                    npcInstancesRef.current[instanceId] = instanceEntry;

                    const registerUpdate = (fn) => {
                        if (typeof fn === 'function') {
                            npcInstancesRef.current[instanceId].updates.push(fn);
                        }
                    };

                    if (Array.isArray(obj.scripts) && obj.scripts.length > 0) {
                        obj.scripts.forEach((binding) => {
                            const script = instanceScriptsMapRef.current[binding.script_id];
                            if (script && script.script_code) {
                                try {
                                    const fn = new Function(
                                        'THREE','scene','camera','instance','registerUpdate','params','mixer',
                                        script.script_code
                                    );
                                    fn(
                                        THREE,
                                        scene,
                                        camera,
                                        model,
                                        registerUpdate,
                                        binding.params || {},
                                        npcInstancesRef.current[instanceId].mixer
                                    );
                                } catch (e) { console.error('Error running instance script', e); }
                            }
                        });
                    }
                });
            }
        });
    }

    // If actor is FBX, optionally load the environment first based on preference
    // DISABLE legacy environment loading if activeScene is present to avoid conflict
    if (!activeScene && modelUrl && isFBX && envMapUrl && (!envLoadedRef.current || currentEnvKeyRef.current !== envMapUrl)) {
      const envLoader = new GLTFLoader();
      envLoader.load(
        envMapUrl,
        (envGltf) => {
          const world = envGltf.scene;
          world.scale.setScalar(1);
          world.position.set(0, 0, 0);
          clearGroup(worldContainerRef.current);
          logChange({ scope: '3d', file: 'pages/LunaTemplate', action: 'world-clear', summary: 'Cleared Environment_Layer only' });
          if (worldContainerRef.current) {
            worldContainerRef.current.add(world);
          }
          envLoadedRef.current = true;
          currentEnvKeyRef.current = envMapUrl;
          logChange({ scope: '3d', file: 'pages/LunaTemplate', action: 'world-load', summary: `Loaded ${envMapUrl} into Environment_Layer` });
        },
        undefined,
        (err) => console.error('Error loading ENV glTF:', err)
      );
    } else if (modelUrl && isFBX && !envMapUrl) {
      // If no env map is requested (or preference cleared), ensure environment layer is empty but marked loaded
      if (worldContainerRef.current) {
        clearGroup(worldContainerRef.current);
      }
      envLoadedRef.current = true; // Mark as "loaded" (empty state) to allow camera reset logic to proceed
    }


    const processModel = (model, animations) => {
      modelRef.current = model;

      // Check for Rigging (Bones/SkinnedMesh)
      let isRigged = false;
      let rightHandBone = null;
      
      model.traverse((node) => {
        if (node.isBone) {
          const name = node.name.toLowerCase();
          if (name.includes("righthand") || name.includes("hand_r") || name.includes("mixamorig_righthand")) {
            rightHandBone = node;
          }
        }
        if (node.isSkinnedMesh) {
            isRigged = true;
        }

        if (node.isMesh || node.isSkinnedMesh) {
          node.frustumCulled = false;

          if (node.geometry) {
            try {
              node.geometry.computeBoundingBox();
              node.geometry.computeBoundingSphere();
            } catch (e) {
              console.warn('Failed to compute bounds for', node.name, e);
            }
          }

          if (node.material) {
            const applySide = (mat) => {
              mat.side = THREE.DoubleSide;
              mat.needsUpdate = true;
            };

            if (Array.isArray(node.material)) {
              node.material.forEach(applySide);
            } else {
              applySide(node.material);
            }
          }

          if (node.isSkinnedMesh) {
            node.skeleton && node.skeleton.pose && node.skeleton.pose();
            node.bindMatrix && node.bindMatrix.identity && node.bindMatrix.identity();
          }
        }
      });

      try {
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        // Align feet to ground (keep X/Z centered, shift Y so min is at 0)
        model.position.x -= center.x;
        model.position.z -= center.z;
        model.position.y -= box.min.y; 
      } catch {}
      if (actorContainerRef.current) {
        actorContainerRef.current.add(model);
      }

      if (weaponModel && rightHandBone) {
        const weaponLoader = new FBXLoader();
        weaponLoader.load(
          weaponModel,
          (weaponFbx) => {
            weaponRef.current = weaponFbx;
            weaponFbx.scale.multiplyScalar(0.01);
            rightHandBone.add(weaponFbx);
            weaponFbx.position.set(0, 0.1, 0);
            weaponFbx.rotation.set(Math.PI / 2, 0, 0);
            weaponFbx.visible = false;
            setWeaponAttached(true);
          },
          undefined,
          (err) => console.error('Error loading weapon:', err)
        );
      }

      mixer = new THREE.AnimationMixer(model);

      // Ensure baseline container scale (match Y-Bot)
      if (actorContainerRef.current) actorContainerRef.current.scale.setScalar(0.01);

       if (animations && animations.length > 0) {
        animations.forEach((clip) => {
          const action = mixer.clipAction(clip);
          const name = clip.name.toLowerCase();

          if (name.includes('idle') || name.includes('breathing')) actionsRef.current.idle = action;
          else if (name.includes('walk')) actionsRef.current.walk = action;
          else if (name.includes('run')) actionsRef.current.run = action;
          else if (name.includes('jump') || name.includes('fall')) actionsRef.current.jump = action;
          else if (name.includes('roll')) actionsRef.current.roll = action;
          else if (name.includes('swing') || name.includes('attack') || name.includes('sword')) actionsRef.current.swing = action;
          else if (name.includes('kick')) actionsRef.current.kick = action;
          else if (name.includes('dance')) actionsRef.current.dance = action;
          else if (name.includes('wave') || name.includes('greet')) actionsRef.current.wave = action;
        });

        const idleAction = actionsRef.current.idle || mixer.clipAction(animations[0]);
        if (idleAction) {
          idleAction.play();
        }
        }

        // Final pass: Ensure character is visible and upright
        // adjustModelScaleToEnvironment(model, 0.18); // Removed to prevent incorrect scaling
        };

    if (modelUrl) {
        if (isFBX) {
          const loader = new FBXLoader();
          loader.load(
            modelUrl,
            (fbx) => {
              fbx.traverse((node) => {
                if (node.isMesh || node.isSkinnedMesh) {
                  node.frustumCulled = false;
                  if (node.material) {
                    const applySide = (mat) => {
                      mat.side = THREE.DoubleSide;
                      mat.needsUpdate = true;
                    };
                    if (Array.isArray(node.material)) {
                      node.material.forEach(applySide);
                    } else {
                      applySide(node.material);
                    }
                  }
                }
              });

              const allClips = [...(fbx.animations || [])];
              let loadedCount = 0;

              animations.forEach((anim) => {
                loader.load(
                  anim.file_url,
                  (animFbx) => {
                    if (animFbx.animations && animFbx.animations.length > 0) {
                      animFbx.animations.forEach((clip) => {
                        if (anim.animation_type === 'idle') clip.name = 'idle';
                        else if (anim.animation_type === 'run') clip.name = 'run';
                        else if (anim.name.toLowerCase().includes('falling')) clip.name = 'fall';
                        allClips.push(clip);
                      });
                    }
                    loadedCount++;

                    if (loadedCount === animations.length) {
                      clearGroup(actorContainerRef.current);
                      
                      // Standard FBX Scale (Mixamo units are cm, world is meters)
                      // Container 0.01, Model 1.0 = 1.0 scale output (1.8m tall)
                      if (actorContainerRef.current) actorContainerRef.current.scale.setScalar(0.01);
                      
                      fbx.scale.setScalar(1);
                      fbx.position.set(0, 0, 0);
                      
                      processModel(fbx, allClips);
                      mixerRef.current = mixer;
                      actorLoadedRef.current = true;
                      setIsModelReady(true); // Trigger script injection
                      
                      controlsActive.current = true;
                      setIsActive(true);
                      logChange({ scope: '3d', file: 'pages/LunaTemplate', action: 'actor-load', summary: 'Loaded Y-Bot FBX (scale 0.01)' });
                    }
                  },
                  undefined,
                  (err) => console.error(`Error loading animation ${anim.name}:`, err)
                );
              });

              if (animations.length === 0) {
                clearGroup(actorContainerRef.current);
                
                // Standard FBX Scale Fallback
                if (actorContainerRef.current) actorContainerRef.current.scale.setScalar(0.01);

                fbx.scale.setScalar(1);
                fbx.position.set(0, 0, 0);
                
                processModel(fbx, allClips);
                mixerRef.current = mixer;
                actorLoadedRef.current = true;
                setIsModelReady(true); // Trigger script injection
                
                controlsActive.current = true;
                setIsActive(true);
                logChange({ scope: '3d', file: 'pages/LunaTemplate', action: 'actor-load', summary: 'Loaded FBX actor (scale 0.01)' });
              }
            },
            undefined,
            (err) => console.error('Error loading FBX model:', err)
          );
        } else {
          const loader = new GLTFLoader();

          // Load environment first if preference is set and not already loaded or changed
          // DISABLE legacy env loading if activeScene is present
          if (!activeScene && envMapUrl && (!envLoadedRef.current || currentEnvKeyRef.current !== envMapUrl)) {
            const envLoader = new GLTFLoader();
            envLoader.load(
              envMapUrl,
              (envGltf) => {
                const world = envGltf.scene;
                world.scale.setScalar(1);
                world.position.set(0, 0, 0);
                clearGroup(worldContainerRef.current);
                logChange({ scope: '3d', file: 'pages/LunaTemplate', action: 'world-clear', summary: 'Cleared Environment_Layer only' });
                if (worldContainerRef.current) {
                  worldContainerRef.current.add(world);
                }
                envLoadedRef.current = true;
                currentEnvKeyRef.current = envMapUrl;
                logChange({ scope: '3d', file: 'pages/LunaTemplate', action: 'world-load', summary: `Loaded ${envMapUrl} into Environment_Layer` });
              },
              undefined,
              (err) => console.error('Error loading ENV glTF:', err)
            );
          }

          loader.load(
            modelUrl,
            (gltf) => {
              const world = gltf.scene;
              // Normalize map scale and reset position
              world.scale.setScalar(1);
              world.position.set(0, 0, 0);
              clearGroup(worldContainerRef.current);
              logChange({ scope: '3d', file: 'pages/LunaTemplate', action: 'world-clear', summary: 'Cleared Environment_Layer only' });
              if (worldContainerRef.current) {
                worldContainerRef.current.add(world);
              }
              envLoadedRef.current = true;
              currentEnvKeyRef.current = modelUrl;
              logChange({ scope: '3d', file: 'pages/LunaTemplate', action: 'world-load', summary: 'Loaded GLTF map into Environment_Layer (scale=1, pos=0,0,0)' });
            },
            undefined,
            (err) => console.error('Error loading GLTF model:', err)
          );
        }
    }

    const handleKeyDown = (e) => {
      if (!controlsActive.current) return;

      const key = e.key.toLowerCase();
      keysPressed.current[key] = true;

      // ROLL INPUT (C KEY)
      if (!isRollingRef.current && key === 'c') {
        isRollingRef.current = true;
        rollTimerRef.current = 0.6; // 0.6s duration
        setBaseAction('roll', true);
      }

      if (key === ' ') {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e) => {
      if (!controlsActive.current) return;
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    const animationLocked = { current: false };

    const setBaseAction = (name, once = false) => {
      if (animationLocked.current && !once) return;
      if (currentBaseActionRef.current === name && !once) return;

      const action = actionsRef.current[name];
      if (!action) return;

      currentBaseActionRef.current = name;

      Object.values(actionsRef.current).forEach((a) => {
        if (a !== action) {
          a.fadeOut(0.2);
        }
      });

      if (!action.isRunning() || once) {
        action.reset();
        action.fadeIn(0.2);
        action.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat);
        action.clampWhenFinished = once;
        action.play();

        if (once) {
          animationLocked.current = true;
          mixer.addEventListener('finished', function onFinish(e) {
            if (e.action === action) {
              animationLocked.current = false;
              mixer.removeEventListener('finished', onFinish);
            }
          });
        }
      }
    };

    const resolveIdle = () => {
      const state = useLunaStore.getState();
      const weapon = state.equipment.weapon;
      if (weapon && state.animationBindings?.weapon_idle?.[weapon]) {
        return state.animationBindings.weapon_idle[weapon];
      }
      return 'idle';
    };

    const handleAttack = () => {
      const state = useLunaStore.getState();
      if (!state.actions.attack) return;

      const weapon = state.equipment.weapon;
      if (!weapon) return;

      const anim = state.animationBindings?.weapon_attack?.[weapon];
      if (!anim || !actionsRef.current[anim]) return;

      setBaseAction(anim, true);
      state.clearActions();
    };

    const handleSkill = () => {
      const state = useLunaStore.getState();
      const skill = state.actions.skill;
      if (!skill) return;

      if (state.isOnCooldown(skill)) return;

      const anim = state.animationBindings?.skills?.[skill];
      if (!anim || !actionsRef.current[anim]) return;

      setBaseAction(anim, true);
      state.setCooldown(skill, Date.now() + 3000);
      state.clearActions();
    };

    const updateWeaponVisual = () => {
      if (!weaponRef.current) return;
      const state = useLunaStore.getState();
      const equipped = state.equipment.weapon === "sword_of_the_abyss";
      weaponRef.current.visible = equipped;
    };

    const mixAction = (name, fadeDuration, weight) => {
      const action = actionsRef.current[name];
      if (!action) return;

      action.setEffectiveWeight(weight);
      if (!action.isRunning()) {
        action.reset();
        action.fadeIn(fadeDuration);
        action.play();
      }
    };

    let animationFrameId;
    // Raycaster for ground detection
    const raycaster = new THREE.Raycaster();
    const downVector = new THREE.Vector3(0, -1, 0);

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      
      const delta = clock.getDelta();
      // Animation Heartbeat (Anti-T-Pose)
      const activeMixer = mixerRef.current || mixer;
      if (activeMixer) activeMixer.update(delta);
      // Per-instance mixers and script updates
      try {
        Object.values(npcInstancesRef.current || {}).forEach((inst) => {
          try {
            if (inst.mixer) inst.mixer.update(delta);
          } catch {}
          if (Array.isArray(inst.updates)) {
            inst.updates.forEach((fn) => { try { fn(delta); } catch {} });
          }
        });
      } catch {}

      updateWeaponVisual();

      const storeState = useLunaStore.getState();
      if (storeState.equippedWeapon !== currentWeaponRef.current) {
        currentWeaponRef.current = storeState.equippedWeapon;
      }

      // --- MOVEMENT & PHYSICS LOOP ---
      if (modelUrl && actorContainerRef.current) {
        
        // 1. INPUT & MOVEMENT (Only if Active)
        let isMoving = false;
        let intendedMove = new THREE.Vector3();
        const moveSpeed = 0.08; // Adjusted speed

        if (controlsActive.current) {
            const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
            fwd.y = 0;
            fwd.normalize();
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
            right.y = 0;
            right.normalize();

            if (keysPressed.current['w']) intendedMove.add(fwd);
            if (keysPressed.current['s']) intendedMove.sub(fwd);
            if (keysPressed.current['a']) intendedMove.sub(right);
            if (keysPressed.current['d']) intendedMove.add(right);

            if (intendedMove.lengthSq() > 0.001) {
                isMoving = true;
                intendedMove.normalize();
                
                // Rotation: Face intended direction
                const angle = Math.atan2(intendedMove.x, intendedMove.z);
                const targetRot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), angle);
                actorContainerRef.current.quaternion.slerp(targetRot, 0.15); // Smooth rotation
            }
        }

        // 2. COLLISION & GROUNDING (ALWAYS ACTIVE)
        const collisionObjects = collisionMeshesRef.current.length > 0 
            ? collisionMeshesRef.current 
            : (worldContainerRef.current ? worldContainerRef.current.children : []);

        if (collisionObjects.length > 0) {
            const currentPos = actorContainerRef.current.position.clone();

            // Wall Detection (Stop movement)
            if (isMoving) {
                const wallRayOrigin = currentPos.clone();
                wallRayOrigin.y += 0.5; // Knee height
                const wallRay = new THREE.Raycaster(wallRayOrigin, intendedMove, 0, 0.5);
                const wallHits = wallRay.intersectObjects(collisionObjects, collisionMeshesRef.current.length === 0);
                if (wallHits.length > 0) {
                    isMoving = false; // Stop on wall hit
                }
            }

            // Apply Move
            if (isMoving) {
                actorContainerRef.current.position.addScaledVector(intendedMove, moveSpeed);
            }

            // Ground Snapping (Gravity)
            const groundRayOrigin = actorContainerRef.current.position.clone();
            groundRayOrigin.y += 5.0; // Cast from above
            const down = new THREE.Vector3(0, -1, 0);
            
            const groundRay = new THREE.Raycaster(groundRayOrigin, down);
            const groundHits = groundRay.intersectObjects(collisionObjects, collisionMeshesRef.current.length === 0);

            if (groundHits.length > 0) {
                const floorY = groundHits[0].point.y;
                // Soft snap or hard snap
                actorContainerRef.current.position.y = floorY;
            }
        } else {
            // Fallback move if no collision mesh
            if (isMoving) {
                actorContainerRef.current.position.addScaledVector(intendedMove, moveSpeed);
            }
        }

        // 3. ANIMATION STATE (Replaced with PlayerController Logic)
        if (isRollingRef.current) {
            // ROLL IN PROGRESS
            rollTimerRef.current -= delta;
            if (rollTimerRef.current <= 0) {
                isRollingRef.current = false;
            }
            // ⛔ Stop other animations - handled by the 'else' block skipping them
        } else {
            // NORMAL MOVEMENT
            if (controlsActive.current) {
                // Ground check implied (basic physics)
                const isGrounded = true; 
                
                if (isGrounded) {
                    if (isMoving) {
                        if (!animationLocked.current) setBaseAction('run');
                    } else {
                        if (!animationLocked.current) setBaseAction(resolveIdle());
                    }
                } else {
                    if (!animationLocked.current) setBaseAction('jump');
                }

                const currentState = useLunaStore.getState();
                if (currentState.actions.skill) handleSkill();
                else if (currentState.actions.attack) handleAttack();
            } else {
                if (!animationLocked.current) setBaseAction(resolveIdle());
            }
        }

        // 4. CAMERA FOLLOW (Orbit Orbit)
        if (controlsRef.current) {
            const actorPos = actorContainerRef.current.position;
            
            // Sync target to actor
            // Smooth follow logic: 
            // We want the camera to maintain offset but move with actor.
            // OrbitControls target IS the pivot point.
            
            // If controlsActive, we let OrbitControls handle user input for rotation.
            // We just update the target to the player's new position.
            
            // Calculate vector from old target to new position
            if (!controlsRef.current.lastTarget) controlsRef.current.lastTarget = actorPos.clone();
            const delta = new THREE.Vector3().subVectors(actorPos, controlsRef.current.lastTarget);
            
            camera.position.add(delta);
            controlsRef.current.target.copy(actorPos);
            controlsRef.current.lastTarget.copy(actorPos);
        }
      }

      if (controlsRef.current) controlsRef.current.update();
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      renderer.domElement.removeEventListener('click', handleCanvasClick);
      // Persistent renderer/scene: do not dispose or clear between model loads
    };
  }, [modelUrl, weaponModel, animations, roomModelUrl, activeScene]);



  useEffect(() => {
    if (triggerAnimation && actionsRef.current[triggerAnimation]) {
      const action = actionsRef.current[triggerAnimation];
      action.reset();
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      action.play();
    }
  }, [triggerAnimation]);



  // Effect to ensure renderer is attached if container changes
  useEffect(() => {
    if (containerRef.current && rendererRef.current && !rendererRef.current.domElement.parentNode) {
      containerRef.current.appendChild(rendererRef.current.domElement);
    } else if (containerRef.current && rendererRef.current && rendererRef.current.domElement.parentNode !== containerRef.current) {
        rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
        containerRef.current.appendChild(rendererRef.current.domElement);
    }
  }); // Run on every render to catch ref changes

  return (
    <div className="w-full h-full relative group">
      {/* Background Container - Subtle Blending */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{
          // Relaxed mask to allow full-screen visibility while keeping a subtle fade at the very edges if needed
          // Removed the aggressive right-side fade to support full-page 3D
          maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
        }}
      >
        <div
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{
            backgroundImage: bgA ? `url(${bgA})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: activeBg === 'A' ? 1 : 0,
          }}
        />
        <div
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{
            backgroundImage: bgB ? `url(${bgB})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: activeBg === 'B' ? 1 : 0,
          }}
        />
        
        {/* Gradient Overlays for Environmental Blending */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-[#080808]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-[#080808]/50" />
      </div>

      {/* 3D Canvas - Unmasked to pop out */}
      <div 
        ref={containerRef} 
        className="absolute inset-0 z-10 transition-all duration-700 ease-in-out"
      />
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

  // Force load Y-Bot (base.fbx)
  useEffect(() => {
    // Hardcoded URL for Y-Bot / Base Mesh to ensure consistency
    // This replaces any dynamic search which might pick up the wrong model (e.g. Maria)
    const Y_BOT_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/6b628bb29_base.fbx';
    
    if (modelUrl !== Y_BOT_URL) {
      console.log('Forcing modelUrl to Y-Bot:', Y_BOT_URL);
      setModelUrl(Y_BOT_URL);
    }
  }, [modelUrl]);
  const [clickedSlot, setClickedSlot] = useState(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showAvatarProgression, setShowAvatarProgression] = useState(false);
  const [hideUI, setHideUI] = useState(false); // Toggle with '0' key
  const [currentEnvId, setCurrentEnvId] = useState('default_room');

  const { mode } = useDashboardMode();

  // Fetch Room 2 (System Reboot)
  useEffect(() => {
    const fetchScene = async () => {
        try {
            console.log("Forcing Room 2 load...");
            const models = await base44.entities.Model3D.list();
            const fbxs = await base44.entities.ModelFBX.list();
            const allModels = [...models, ...fbxs];
            
            // Prioritize Room 2
            const room2 = allModels.find(m => (m.name.toLowerCase().includes('room 2') || m.name.toLowerCase().includes('room2')));
            
            if (room2?.file_url) {
                console.log("Found Room 2:", room2.name);
                setRoomModelUrl(room2.file_url);
                setActiveScene(null); // Clear active scene to avoid overrides
            } else {
                console.warn("Room 2 not found, falling back to default.");
                setRoomModelUrl('https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/58d1bc849_scene.gltf');
            }
        } catch (e) {
            console.error("Failed to load scene configuration:", e);
        }
    };
    fetchScene();
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
      // 'o' key binding removed for stats as requested
      // if (key === 'o') { setShowStats((v) => !v); }
      if (key === '0') {
        setHideUI((v) => !v);
      }
      if (key === 'escape') {
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

  return (
    <PageErrorBoundary pageName="LunaTemplate">
      <div
        className="min-h-screen text-white p-0 overflow-hidden relative"
        style={{
          backgroundColor: '#080808',
          // Keep background image if part of scene ambiance, or remove for cleaner 3D view
          backgroundImage: `url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/fed9dc2c3_unnamed4.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}>

        {/* 3D Model Viewer */}
        <div
          className="fixed inset-0 z-0 pointer-events-auto"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100vw',
            height: '100vh',
          }}>

          <TransparentModel3DViewer 
            modelUrl={modelUrl} 
            weaponModel={weaponModelUrl} 
            triggerAnimation={triggerAnimation} 
            backgroundUrl={bannerBackgroundUrl} 
            roomModelUrl={roomModelUrl} 
            activeScene={activeScene}
            isStatsOpen={false}
          />
        </div>

      </div>
    </PageErrorBoundary>
  );


}