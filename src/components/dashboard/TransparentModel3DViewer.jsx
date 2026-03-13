import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { base44 } from '@/api/base44Client';
import ReactorBridge from '../admin/reactor/ReactorBridge';
import { attachWeapon, attachEffect } from '../3d/WeaponAttachmentSystem';



export default function TransparentModel3DViewer({ modelUrl, weaponModel, triggerAnimation, backgroundUrl, roomModelUrl, activeScene, isStatsOpen, playerSpawn, useMeshCollision, equippedWeaponUrl, drawEffectUrl }) {
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
  const remotePlayersRef = useRef(new Map());
  
  // --- DUAL CHARACTER SYSTEM ---
  const c1ModelRef = useRef(null);       // C1 (ErikaArcher) model object
  const c1MixerRef = useRef(null);       // C1 animation mixer
  const c1ActionsRef = useRef({});       // C1 animation actions map
  const c1ActiveActionRef = useRef(null);
  const activeCharacterRef = useRef(localStorage.getItem('luna_active_character') || 'ybot'); // 'ybot' or 'c1'
  const [activeCharLabel, setActiveCharLabel] = useState(localStorage.getItem('luna_active_character') || 'ybot'); // For UI display
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const switchingRef = useRef(false);     // Prevent double-switch
  
  const [playerStats, setPlayerStats] = useState({ level: 1, xp: 0, hp: 100, maxHp: 100, attack: 25 });
  const playerStatsRef = useRef({ level: 1, xp: 0, hp: 100, maxHp: 100, attack: 25 });
  const floatingTextsRef = useRef([]);
  const floatingTextContainerRef = useRef(null);

  useEffect(() => {
    const onSync = () => setPlayerStats({ ...playerStatsRef.current });
    window.addEventListener('syncPlayerStats', onSync);
    return () => window.removeEventListener('syncPlayerStats', onSync);
  }, []);
  
  const skyboxModelRef = useRef(null);

  // Background / Skybox handler
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (skyboxModelRef.current) {
      scene.remove(skyboxModelRef.current);
      skyboxModelRef.current = null;
    }
    
    scene.background = null;

    if (!backgroundUrl) return;

    const lower = backgroundUrl.toLowerCase();
    
    if (lower.endsWith('.fbx') || lower.endsWith('.glb') || lower.endsWith('.gltf')) {
      const onLoaded = (obj) => {
        obj.scale.setScalar(500); 
        obj.traverse((child) => {
          if (child.isMesh) {
            child.material.side = THREE.BackSide;
            child.material.depthWrite = false;
          }
        });
        skyboxModelRef.current = obj;
        scene.add(obj);
      };

      if (lower.endsWith('.fbx')) {
        new FBXLoader().load(backgroundUrl, onLoaded);
      } else {
        new GLTFLoader().load(backgroundUrl, (gltf) => onLoaded(gltf.scene));
      }
    } else {
      new THREE.TextureLoader().load(backgroundUrl, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        scene.background = texture;
      });
    }
  }, [backgroundUrl, isModelLoaded]);

  // Player Controller State
  const isSprintingRef = useRef(false);
  const sprintTimerRef = useRef(0);
  const sprintDuration = 0.6;
  const currentActionNameRef = useRef(""); 
  const verticalVelocityRef = useRef(0);
  const isGroundedRef = useRef(true);

  // Camera orbit state (right-click drag)
  const cameraOrbitRef = useRef({ yaw: 0, pitch: 0.35, distance: 1.2 });
  const isDraggingRef = useRef(false);
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

  // 3. Fetch all Model3D entities for AI spawning
  const { data: all3DModels = [] } = useQuery({
    queryKey: ['all3DModels'],
    queryFn: () => base44.entities.Model3D.list(),
    staleTime: Infinity,
  });

  const spawnableAIModels = useMemo(() => {
    const map = new Map();
    all3DModels.forEach(model => {
      if (model.ai_enabled && model.spawn_key) {
        map.set(model.spawn_key, model);
      }
    });
    return map;
  }, [all3DModels]);

  // Map<uniqueInstanceId, { instanceId, assetId, modelMesh, mixer, actions, activeAction, stats, role, aiProfile, spawnTime }>
  const spawnedAIModelsRef = useRef(new Map());
  const aiInstanceCounterRef = useRef(0); // Auto-incrementing unique ID

  // Listen for character switch events to update React state for the label
  useEffect(() => {
    const handler = (e) => setActiveCharLabel(e.detail.active);
    window.addEventListener('characterSwitched', handler);
    return () => window.removeEventListener('characterSwitched', handler);
  }, []);

  // --- REACTOR BRIDGE: Register scene models + listen for editor events ---
  useEffect(() => {
    // Build scene model list from loaded characters + AI spawns
    const buildSceneModels = () => {
      const models = [];
      if (modelRef.current) {
        models.push({ id: 'ybot', name: 'Y-Bot', type: 'ybot', file_url: 'ybot' });
      }
      if (c1ModelRef.current) {
        models.push({ id: 'c1', name: 'C1 (Erika)', type: 'c1', file_url: 'c1' });
      }
      // Add spawned AI
      spawnedAIModelsRef.current.forEach((inst) => {
        models.push({ id: inst.assetId, name: inst.assetName || inst.instanceId, type: 'ai', file_url: '' });
      });
      // Add all DB models (so editor can pick any)
      if (all3DModels?.length) {
        all3DModels.forEach(m => {
          if (!models.find(sm => sm.id === m.id)) {
            models.push({ id: m.id, name: m.name, type: 'model3d', file_url: m.file_url });
          }
        });
      }
      ReactorBridge.registerSceneModels(models);
    };

    // Rebuild periodically as AI spawns change
    const interval = setInterval(buildSceneModels, 3000);
    buildSceneModels();

    // Listen for reactor fired events from editor → show visual feedback in Luna viewer
    const unsubFired = ReactorBridge.on('reactorFired', ({ bone, damageType, fx }) => {
      console.log(`[Luna Reactor] Fired on bone: ${bone}, type: ${damageType}, fx: ${fx}`);
      // Visual glow on active character
      const activeModel = activeCharacterRef.current === 'ybot' ? modelRef.current : c1ModelRef.current;
      if (activeModel && sceneRef.current) {
        // Create a temporary glow at the model's position
        const color = {
          physical: 0x94a3b8, energy: 0xfacc15, lightning: 0x60a5fa,
          fire: 0xf97316, ice: 0x22d3ee, true_damage: 0xef4444,
          poison: 0x22c55e, holy: 0xfbbf24,
        }[damageType] || 0x00ffcc;

        const light = new THREE.PointLight(color, 3, 5);
        light.position.copy(activeModel.position);
        light.position.y += 0.5;
        sceneRef.current.add(light);

        // Fade out and remove after 300ms
        setTimeout(() => {
          if (sceneRef.current) sceneRef.current.remove(light);
        }, 300);
      }
    });

    // Listen for FX blocks state → render active FX in the Luna 3D scene
    const unsubFXBlocks = ReactorBridge.on('fxBlocksState', ({ activeFXBlocks }) => {
      const scene = sceneRef.current;
      if (!scene) return;
      const activeModel = activeCharacterRef.current === 'ybot' ? modelRef.current : c1ModelRef.current;
      if (!activeModel) return;

      // Clean up old FX lights (tagged with _lunaFX)
      const toRemove = [];
      scene.traverse(child => {
        if (child.userData._lunaFX) toRemove.push(child);
      });
      toRemove.forEach(c => scene.remove(c));

      // Add lights for each active FX block
      activeFXBlocks.forEach(fx => {
        const fxColor = {
          projectile: 0x3b82f6, burst: 0xf97316, aura: 0xa855f7,
          beam: 0x22d3ee, trail: 0x22c55e, impact: 0xef4444,
        }[fx.effect_type] || 0xf59e0b;

        const light = new THREE.PointLight(fxColor, 2.5, 4);
        light.position.copy(activeModel.position);
        light.position.y += 0.5;
        light.userData._lunaFX = true;
        scene.add(light);

        // Small glowing sphere
        const geo = new THREE.SphereGeometry(0.08, 12, 12);
        const mat = new THREE.MeshBasicMaterial({ color: fxColor, transparent: true, opacity: 0.6 });
        const sphere = new THREE.Mesh(geo, mat);
        sphere.position.copy(light.position);
        sphere.userData._lunaFX = true;
        scene.add(sphere);
      });
    });

    return () => {
      clearInterval(interval);
      unsubFired();
      unsubFXBlocks();
    };
  }, [all3DModels]);

  // Keep spawn/collision refs in sync with props
  useEffect(() => {
    playerSpawnRef.current = playerSpawn || { x: 0, y: -0.5, z: 0 };
  }, [playerSpawn]);
  useEffect(() => {
    useMeshCollisionRef.current = useMeshCollision || false;
  }, [useMeshCollision]);

  // Standalone function to swap ONLY the environment mesh in the existing scene.
  const swapEnvironment = async (url) => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (url === loadedEnvUrlRef.current) return;

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
    }

    loadedEnvUrlRef.current = url;
    if (!url) return;

    const onLoaded = (obj, isSubAsset = false) => {
      const box = new THREE.Box3().setFromObject(obj);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      
      if (maxDim > 0 && !isSubAsset) {
        const s = 10 / maxDim;
        obj.scale.setScalar(s);
      } else if (isSubAsset && maxDim > 0) {
        const s = 4 / maxDim; // Adjust scale for sub assets
        obj.scale.setScalar(s);
      }
      
      // Update bounds after scaling
      const box2 = new THREE.Box3().setFromObject(obj);
      const center = box2.getCenter(new THREE.Vector3());
      
      if (!isSubAsset) {
        // Center horizontally, but keep origin aligned with player's feet (-0.5)
        // We avoid using minY because environments with deep basements/roots would push the floor into the sky
        obj.position.set(-center.x, -0.5, -center.z);
      } else {
        // Place sub-assets randomly, resting perfectly on the floor
        const currentMinY = box2.min.y - obj.position.y;
        obj.position.set((Math.random() - 0.5) * 8, -0.5 - currentMinY, (Math.random() - 0.5) * 8);
      }

      obj.traverse(cleanMesh);

      if (sceneRef.current && loadedEnvUrlRef.current === url) {
        if (!envRef.current) {
          envRef.current = new THREE.Group();
          sceneRef.current.add(envRef.current);
        }
        envRef.current.add(obj);

        envCollidersRef.current = [];
        envRef.current.traverse((child) => {
          if (child.isMesh) envCollidersRef.current.push(child);
        });

        if (modelRef.current && !isSubAsset) {
          const sp = playerSpawnRef.current;
          modelRef.current.position.set(sp.x, sp.y, sp.z);
          verticalVelocityRef.current = 0;
          isGroundedRef.current = true;
        }
      }
    };

    if (url === 'virtual_room_7.glb') {
        const baseGeo = new THREE.BoxGeometry(20, 0.5, 20);
        baseGeo.translate(0, -0.25, 0); // Shift geometry so origin is top
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        onLoaded(baseMesh, false);

        try {
            const assets = await base44.entities.AssetFile.list();
            const models = assets.filter(a => {
               const name = (a.name || '').toLowerCase();
               return name.endsWith('.glb') || name.endsWith('.gltf') || name.endsWith('.fbx');
            }).slice(0, 3); // Limit to prevent WebGL context crash
            
            for (const model of models) {
               const mUrl = model.url;
               const lower = mUrl.toLowerCase();
               if (lower.endsWith('.fbx')) {
                  new FBXLoader().load(mUrl, (obj) => onLoaded(obj, true));
               } else {
                  new GLTFLoader().load(mUrl, (gltf) => onLoaded(gltf.scene, true));
               }
               await new Promise(r => setTimeout(r, 200));
            }
        } catch (e) {
            console.error("Failed to load Room 7 assets", e);
        }
        return;
    }

    const lower = url.toLowerCase();
    if (lower.endsWith('.fbx')) {
      new FBXLoader().load(url, onLoaded, undefined, (err) => console.error('[ENV] FBX load error:', err));
    } else if (lower.endsWith('.glb') || lower.endsWith('.gltf')) {
      new GLTFLoader().load(url, (gltf) => onLoaded(gltf.scene), undefined, (err) => console.error('[ENV] GLTF load error:', err));
    } else {
      new FBXLoader().load(url, onLoaded, undefined, () => {
        new GLTFLoader().load(url, (gltf) => onLoaded(gltf.scene));
      });
    }
  };

  useEffect(() => {
    if (!sceneRef.current || !roomModelUrl) return;
    swapEnvironment(roomModelUrl);
  }, [roomModelUrl]);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- SETUP SCENE ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;
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

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // --- MOUSE CONTROLS (Right click orbit + zoom) ---
    const onMouseDown = (e) => {
      // Ignore clicks on UI elements (buttons, links, inputs, scrollable areas)
      if (e.target.closest('button, a, input, [role="button"], .overflow-y-auto')) {
        if (e.target.tagName.toLowerCase() !== 'canvas') return;
      }
      if (e.button === 0 || e.button === 2) {
        isDraggingRef.current = true;
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
        if (containerRef.current) containerRef.current.focus();
      }
    };
    const onMouseUp = () => { isDraggingRef.current = false; };
    const onMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastMouseRef.current.x, dy = e.clientY - lastMouseRef.current.y;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      cameraOrbitRef.current.yaw -= dx * 0.005;
      cameraOrbitRef.current.pitch = Math.max(0.05, Math.min(Math.PI / 1.8, cameraOrbitRef.current.pitch + dy * 0.005));
    };
    const onWheel = (e) => {
      // Ignore scroll on UI elements
      if (e.target.closest('.overflow-y-auto, .overflow-auto, .scroll-auto')) return;
      
      const orbit = cameraOrbitRef.current;
      orbit.distance = Math.max(0.3, Math.min(15, orbit.distance + e.deltaY * 0.002));
    };
    const onContextMenu = (e) => {
      // Allow context menu on UI elements, prevent on background
      if (!e.target.closest('button, a, input, [role="button"]')) {
        e.preventDefault();
      }
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('contextmenu', onContextMenu);

    const initialEnvUrl = roomModelUrl || 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/ddff83a29_ModularEnvironment.fbx';
    swapEnvironment(initialEnvUrl);

    let initRenderActive = true;
    const initRender = () => {
      if (!initRenderActive) return;
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
         const orbit = cameraOrbitRef.current;
         const camX = orbit.distance * Math.sin(orbit.yaw) * Math.cos(orbit.pitch);
         const camY = orbit.distance * Math.sin(orbit.pitch);
         const camZ = orbit.distance * Math.cos(orbit.yaw) * Math.cos(orbit.pitch);
         cameraRef.current.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.15);
         cameraRef.current.lookAt(0, 0.15, 0);
         rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      requestAnimationFrame(initRender);
    };
    initRender();

    // --- CHARACTER (Y-Bot) ---
    const loader = new FBXLoader();
    const yBotUrl = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/608211a0f_YBot1.fbx';
    
    loader.load(yBotUrl, async (fbx) => {
      const model = fbx;
      model.scale.set(0.001, 0.001, 0.001); 
      model.position.set(0, -0.5, 0);
      model.visible = activeCharacterRef.current === 'ybot';
      
      model.traverse(cleanMesh);
      
      modelRef.current = model;
      scene.add(model);

      const mixer = new THREE.AnimationMixer(model);
      mixerRef.current = mixer;
      mixer.timeScale = 1.2;

      const loadAnimations = async () => {          
          if (!adminAnimations || adminAnimations.length === 0) return;
          
          const fbxLoader = new FBXLoader();
          const gltfLoader = new GLTFLoader();
          for (const anim of adminAnimations) {
            try {
              const lower = (anim.file_url || '').toLowerCase();
              let animAsset;
              if (lower.endsWith('.glb') || lower.endsWith('.gltf')) {
                  const gltf = await gltfLoader.loadAsync(anim.file_url);
                  animAsset = { animations: gltf.animations || [] };
              } else {
                  animAsset = await fbxLoader.loadAsync(anim.file_url);
              }

              if (!animAsset || !animAsset.animations || animAsset.animations.length === 0) continue;
              
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
      setIsModelLoaded(true);

      const fadeToAction = (name, duration = 0.2) => {
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

      if (!preAnimPositionRef.current) preAnimPositionRef.current = new THREE.Vector3();

      const playSequence = (sequence, keybindMeta = {}) => {
        if (sequenceLockRef.current && holdActiveRef.current && holdActiveRef.current.interruptible === false) return;
        if (sequenceLockRef.current && toggleActiveRef.current && toggleActiveRef.current.interruptible === false) return;
        if (!sequence || sequence.length === 0) return;

        previousActionNameRef.current = currentActionNameRef.current || 'idle';
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

        if (movementBehavior === 'root_motion' && activeModel && preAnimPositionRef.current) {
          const snapBehavior = entry.snapBehavior || 'maintain_end';
          if (snapBehavior === 'snap_to_origin') {
            activeModel.position.copy(preAnimPositionRef.current);
          } else if (snapBehavior === 'blend_to_idle_pos') {
            blendBackRef.current = {
              target: preAnimPositionRef.current.clone(),
              progress: 0,
              duration: 0.3,
            };
          }
        }

        let targetName = 'idle';
        if (returnState === 'previous') {
          targetName = previousActionNameRef.current || 'idle';
        } else if (returnState === 'freeze') {
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
          sequenceIndexRef.current = idx + 1;
          playSequenceStep();
          return;
        }

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

      const stopHoldOrToggle = () => {
        if (holdActiveRef.current) holdActiveRef.current = null;
        if (sequenceLockRef.current) {
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

      let enemySpawnTimer = 5.0;
      let disableEnemySpawns = true;

      const spawnFloatingText = (text, position, color = '#ffffff') => {
          const id = Date.now() + Math.random();
          floatingTextsRef.current.push({ id, text, position: position.clone(), color, age: 0 });
      };

      const animate = () => {
        requestAnimationFrame(animate);
        const delta = clockRef.current.getDelta();

        if (mixer) mixer.update(delta);
        if (c1MixerRef.current) c1MixerRef.current.update(delta);
        if (companionMixerRef.current) companionMixerRef.current.update(delta);

        // Auto-spawn enemies
        if (!disableEnemySpawns) {
          enemySpawnTimer -= delta;
          if (enemySpawnTimer <= 0) {
             enemySpawnTimer = 8 + Math.random() * 5;
             const enemyModels = Array.from(spawnableAIModels.values());
             if (enemyModels.length > 0) {
                 const activeModel = activeCharacterRef.current === 'ybot' ? model : c1ModelRef.current;
                 if (activeModel) {
                     const randomEnemy = enemyModels[Math.floor(Math.random() * enemyModels.length)];
                     spawnAIInstance(randomEnemy, activeModel);
                 }
             }
          }
        }

        // Update floating texts
        if (floatingTextContainerRef.current && cameraRef.current) {
           let html = '';
           for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
               const ft = floatingTextsRef.current[i];
               ft.age += delta;
               if (ft.age > 1.5) {
                   floatingTextsRef.current.splice(i, 1);
                   continue;
               }
               ft.position.y += delta * 1.5; // Float up
               
               const tempV = ft.position.clone();
               tempV.project(cameraRef.current);
               
               if (tempV.z < 1 && containerRef.current) { // In front of camera
                   const x = (tempV.x * 0.5 + 0.5) * containerRef.current.clientWidth;
                   const y = (tempV.y * -0.5 + 0.5) * containerRef.current.clientHeight;
                   const alpha = Math.max(0, 1 - (ft.age / 1.5));
                   const scale = 1 + (ft.age * 0.5);
                   html += `<div style="position:absolute; left:${x}px; top:${y}px; transform:translate(-50%, -50%) scale(${scale}); color:${ft.color}; font-weight:900; font-size:24px; text-shadow:0 0 5px black, 0 0 10px ${ft.color}; opacity:${alpha}; pointer-events:none; font-family:sans-serif; z-index:100; white-space:nowrap;">${ft.text}</div>`;
               }
           }
           floatingTextContainerRef.current.innerHTML = html;
        }

        const deadInstances = [];
        spawnedAIModelsRef.current.forEach((ai, instId) => {
          if (ai.mixer) ai.mixer.update(delta);
          if (!ai.modelMesh || !ai.aiProfile) return;

          const aiFadeToAction = (name) => {
            const action = ai.actions[name];
            if (!action || ai.activeAction === action) return;
            if (ai.activeAction) ai.activeAction.fadeOut(0.2);
            action.reset().fadeIn(0.2).play();
            ai.activeAction = action;
          };

          if (!ai.isAlive) {
            if (ai.deathTimer >= 0) {
              ai.deathTimer -= delta;
              if (ai.deathTimer <= 0) deadInstances.push(instId);
            }
            return;
          }

          if (ai.hitReactTimer > 0) {
            ai.hitReactTimer -= delta;
            if (ai.hitReactTimer <= 0) {
              ai.aiState = 'idle';
              aiFadeToAction('idle');
            }
            ai.hitCooldown -= delta;
            return;
          }

          ai.hitCooldown -= delta;

          const behavior = ai.aiProfile.behavior_type || 'idle_loop';
          const aiSpeed = (ai.stats?.speed || 1.0) * 0.4 * delta;
          const detRange = ai.aiProfile.detection_range || 10;
          const atkRange = ai.aiProfile.attack_range || 2;
          const wanderRadius = ai.aiProfile.wander_radius || 5;
          const aiPos = ai.modelMesh.position;

          const spawnFloor = playerSpawnRef.current.y;
          if (aiPos.y < spawnFloor) aiPos.y = spawnFloor;

          const playerTarget = activeCharacterRef.current === 'ybot' ? model : c1ModelRef.current;

          if (behavior === 'idle_loop') {
            if (ai.aiState !== 'idle') { ai.aiState = 'idle'; aiFadeToAction('idle'); }
          } else if (behavior === 'passive_wander') {
            ai.aiWanderTimer -= delta;
            const distFromSpawn = aiPos.distanceTo(ai.aiSpawnPos);
            if (distFromSpawn > wanderRadius) {
              const returnDir = ai.aiSpawnPos.clone().sub(aiPos).normalize();
              aiPos.x += returnDir.x * aiSpeed;
              aiPos.z += returnDir.z * aiSpeed;
              ai.modelMesh.lookAt(ai.aiSpawnPos.clone().setY(aiPos.y));
              if (ai.aiState !== 'wander') { ai.aiState = 'wander'; aiFadeToAction(ai.actions['walk'] ? 'walk' : 'run'); }
            } else if (ai.aiWanderTimer <= 0) {
              ai.aiWanderDir = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
              ai.aiWanderTimer = 2 + Math.random() * 3;
              if (Math.random() < 0.3) { ai.aiState = 'idle'; aiFadeToAction('idle'); }
              else { ai.aiState = 'wander'; aiFadeToAction(ai.actions['walk'] ? 'walk' : 'run'); }
            } else if (ai.aiState === 'wander') {
              aiPos.x += ai.aiWanderDir.x * aiSpeed * 0.5;
              aiPos.z += ai.aiWanderDir.z * aiSpeed * 0.5;
              const lookTarget = aiPos.clone().add(ai.aiWanderDir);
              ai.modelMesh.lookAt(lookTarget.setY(aiPos.y));
            }
          } else if (behavior === 'aggressive' || behavior === 'defensive') {
            if (!playerTarget) return;
            const playerPos = playerTarget.position;
            const distToPlayer = aiPos.distanceTo(playerPos);

            if (distToPlayer < atkRange) {
              ai.modelMesh.lookAt(playerPos.clone().setY(aiPos.y));
              ai.aiAttackCooldown -= delta;
              if (ai.aiAttackCooldown <= 0 && ai.actions['attack']) {
                ai.aiState = 'attack';
                aiFadeToAction('attack');
                ai.aiAttackCooldown = 1.5 + Math.random();

                // Deal damage to player
                setTimeout(() => {
                   if (!ai.isAlive) return;
                   if (!playerTarget) return;
                   const dist = ai.modelMesh.position.distanceTo(playerTarget.position);
                   if (dist < atkRange + 1.0) {
                       const damage = ai.attackPower;
                       playerStatsRef.current.hp -= damage;
                       if (playerStatsRef.current.hp < 0) playerStatsRef.current.hp = 0;
                       spawnFloatingText(`-${damage}`, playerTarget.position.clone().add(new THREE.Vector3(0, 1.2, 0)), '#ff3333');
                       
                       if (playerStatsRef.current.hp <= 0) {
                           spawnFloatingText(`YOU DIED`, playerTarget.position.clone().add(new THREE.Vector3(0, 1.8, 0)), '#ff0000');
                           playerStatsRef.current.hp = playerStatsRef.current.maxHp; // Auto revive for now
                       }
                       // Sync state
                       window.dispatchEvent(new CustomEvent('syncPlayerStats'));
                   }
                }, 600); // 600ms delay for impact

              } else if (ai.aiState !== 'attack') {
                aiFadeToAction('idle');
              }
            } else if (distToPlayer < detRange) {
              const chaseDir = playerPos.clone().sub(aiPos).normalize();
              aiPos.x += chaseDir.x * aiSpeed;
              aiPos.z += chaseDir.z * aiSpeed;
              ai.modelMesh.lookAt(playerPos.clone().setY(aiPos.y));
              if (ai.aiState !== 'chase') { ai.aiState = 'chase'; aiFadeToAction(ai.actions['run'] ? 'run' : (ai.actions['walk'] ? 'walk' : 'running')); }
            } else {
              ai.aiWanderTimer -= delta;
              if (ai.aiWanderTimer <= 0) {
                ai.aiWanderDir = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
                ai.aiWanderTimer = 2 + Math.random() * 4;
              }
              const distFromSpawn2 = aiPos.distanceTo(ai.aiSpawnPos);
              if (distFromSpawn2 > wanderRadius) {
                const ret = ai.aiSpawnPos.clone().sub(aiPos).normalize();
                aiPos.x += ret.x * aiSpeed * 0.5;
                aiPos.z += ret.z * aiSpeed * 0.5;
              } else {
                aiPos.x += ai.aiWanderDir.x * aiSpeed * 0.3;
                aiPos.z += ai.aiWanderDir.z * aiSpeed * 0.3;
              }
              if (ai.aiState !== 'idle') { ai.aiState = 'idle'; aiFadeToAction(ai.actions['walk'] ? 'walk' : 'idle'); }
            }
          } else if (behavior === 'follower') {
            if (!playerTarget) return;
            const playerPos2 = playerTarget.position;
            const distToPlayer2 = aiPos.distanceTo(playerPos2);
            const followDist = 1.0;
            if (distToPlayer2 > followDist + 0.3) {
              const followDir = playerPos2.clone().sub(aiPos).normalize();
              aiPos.x += followDir.x * aiSpeed;
              aiPos.z += followDir.z * aiSpeed;
              ai.modelMesh.lookAt(playerPos2.clone().setY(aiPos.y));
              if (ai.aiState !== 'follow') { ai.aiState = 'follow'; aiFadeToAction(ai.actions['run'] ? 'run' : (ai.actions['walk'] ? 'walk' : 'running')); }
            } else {
              ai.modelMesh.lookAt(playerPos2.clone().setY(aiPos.y));
              if (ai.aiState !== 'idle') { ai.aiState = 'idle'; aiFadeToAction('idle'); }
            }
          } else if (behavior === 'patrol_route') {
            const points = ai.aiProfile.patrol_points || [];
            if (points.length === 0) {
              if (ai.aiState !== 'idle') { ai.aiState = 'idle'; aiFadeToAction('idle'); }
            } else {
              if (!ai.patrolIndex) ai.patrolIndex = 0;
              const target = points[ai.patrolIndex];
              const tgt = new THREE.Vector3(target.x, aiPos.y, target.z);
              const dist = aiPos.distanceTo(tgt);
              if (dist < 0.2) {
                ai.patrolIndex = (ai.patrolIndex + 1) % points.length;
              } else {
                const dir = tgt.clone().sub(aiPos).normalize();
                aiPos.x += dir.x * aiSpeed * 0.6;
                aiPos.z += dir.z * aiSpeed * 0.6;
                ai.modelMesh.lookAt(tgt.setY(aiPos.y));
                if (ai.aiState !== 'patrol') { ai.aiState = 'patrol'; aiFadeToAction(ai.actions['walk'] ? 'walk' : 'run'); }
              }
            }
          }
        });

        deadInstances.forEach(id => despawnAIInstance(id));

        const activeModel = activeCharacterRef.current === 'ybot' ? model : c1ModelRef.current;
        if (!activeModel) { renderer.render(scene, camera); return; }

        // Update remote players
        const rt = performance.now() - 100;
        remotePlayersRef.current.forEach(p => {
          if (p.mixer) p.mixer.update(delta);
          if (p.model && !p.loading && p.positionBuffer?.length) {
            const m = p.model, buf = p.positionBuffer;
            let p0 = buf[0], p1 = buf[buf.length - 1];
            for (let i = 0; i < buf.length - 1; i++) if (buf[i].t <= rt && buf[i+1].t >= rt) { p0 = buf[i]; p1 = buf[i+1]; break; }
            let ip = p1.pos.clone(), iy = p1.yaw, an = p1.anim || 'idle';
            if (p0.t !== p1.t && rt >= p0.t && rt <= p1.t) {
              ip.lerpVectors(p0.pos, p1.pos, (rt - p0.t) / (p1.t - p0.t));
              let d = p1.yaw - p0.yaw;
              while(d < -Math.PI) d += Math.PI * 2; while(d > Math.PI) d -= Math.PI * 2;
              iy = p0.yaw + d * ((rt - p0.t) / (p1.t - p0.t));
            } else if (rt < p0.t) { ip.copy(p0.pos); iy = p0.yaw; an = p0.anim || 'idle'; }
            if (m.position.distanceTo(ip) > 0.02) an = p.actions['running'] ? 'running' : (p.actions['run'] ? 'run' : an);
            else if (an === 'running' || an === 'run') an = 'idle';
            if (!an || !p.actions[an]) an = 'idle';
            if (p.activeActionName !== an && p.actions[an]) {
              if (p.actions[p.activeActionName]) p.actions[p.activeActionName].fadeOut(0.2);
              p.actions[an].reset().fadeIn(0.2).play(); p.activeActionName = an;
            }
            m.position.copy(ip); m.rotation.y = iy;
          }
        });

        // Broadcast local state
        const euler = new THREE.Euler().setFromQuaternion(activeModel.quaternion, 'YXZ');
        window.dispatchEvent(new CustomEvent('multiplayerLocalUpdate', {
          detail: { 
            x: activeModel.position.x,
            y: activeModel.position.y,
            z: activeModel.position.z,
            yaw: euler.y,
            anim: currentActionNameRef.current 
          }
        }));

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

        const orbit = cameraOrbitRef.current;
        const camX = activeModel.position.x + orbit.distance * Math.sin(orbit.yaw) * Math.cos(orbit.pitch);
        const camY = activeModel.position.y + orbit.distance * Math.sin(orbit.pitch);
        const camZ = activeModel.position.z + orbit.distance * Math.cos(orbit.yaw) * Math.cos(orbit.pitch);
        camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.15);
        camera.lookAt(activeModel.position.clone().add(new THREE.Vector3(0, 0.15, 0)));

        const gravity = -25;
        const jumpForce = 5;
        const spawnY = playerSpawnRef.current.y;
        
        if (keysPressed.current[' '] && isGroundedRef.current) {
            verticalVelocityRef.current = jumpForce;
            isGroundedRef.current = false;
        }
        verticalVelocityRef.current += gravity * delta;
        activeModel.position.y += verticalVelocityRef.current * delta;

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

        if (!sequenceLockRef.current) {
          if (!isGroundedRef.current) {
              play(verticalVelocityRef.current > 0 ? "Jumping" : "Falling");
          } else if (isMoving) {
              play("Running");
          } else {
              const isWeaponEquipped = !!equippedWeaponUrl;
              if (isWeaponEquipped) {
                const current = currentActionNameRef.current.toLowerCase();
                if (!current.includes('standing idle') && current !== 'idle') {
                   const firstIdle = 'standing idle 01';
                   const hasFirst = actionsRef.current[firstIdle] || c1ActionsRef.current[firstIdle];
                   play(hasFirst ? firstIdle : 'Idle');
                } else {
                   if (current === 'idle') {
                      const firstIdle = 'standing idle 01';
                      const hasFirst = actionsRef.current[firstIdle] || c1ActionsRef.current[firstIdle];
                      if (hasFirst) play(firstIdle);
                   }
                }
              } else {
                play("Idle");
              }
          }
        }

        if (sequenceLockRef.current && sequenceQueueRef.current.length > 0) {
          const currentSeqIdx = sequenceIndexRef.current;
          const currentEntry = currentSeqIdx >= 0 && currentSeqIdx < sequenceQueueRef.current.length ? sequenceQueueRef.current[currentSeqIdx] : null;
          if (currentEntry && preAnimPositionRef.current && activeModel) {
            const moveBehavior = currentEntry.movementBehavior || 'in_place';
            if (moveBehavior === 'in_place') {
              activeModel.position.x = preAnimPositionRef.current.x;
              activeModel.position.z = preAnimPositionRef.current.z;
            }
          }
        }

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

      const spawnAIInstance = async (aiModelDef, playerModel) => {
        if (!playerModel || !sceneRef.current) return;
        const fbxLoader = new FBXLoader();
        const gltfLoader = new GLTFLoader();

        const fileUrl = aiModelDef.file_url;
        const lower = fileUrl.toLowerCase();
        let loadedAsset;

        if (lower.endsWith('.fbx')) {
          loadedAsset = await fbxLoader.loadAsync(fileUrl);
        } else if (lower.endsWith('.glb') || lower.endsWith('.gltf')) {
          const gltf = await gltfLoader.loadAsync(fileUrl);
          loadedAsset = gltf.scene;
          loadedAsset.animations = gltf.animations || [];
        } else {
          return;
        }

        const modelMesh = loadedAsset;
        const playerScale = playerModel.scale.x;
        modelMesh.scale.set(playerScale, playerScale, playerScale);
        modelMesh.updateMatrixWorld(true);

        const playerBox = new THREE.Box3().setFromObject(playerModel);
        const playerHeight = playerBox.max.y - playerBox.min.y;
        const aiBox = new THREE.Box3().setFromObject(modelMesh);
        const aiHeight = aiBox.max.y - aiBox.min.y;

        if (aiHeight > 0 && playerHeight > 0 && Math.abs(aiHeight - playerHeight) / playerHeight > 0.15) {
          const correctedScale = playerScale * (playerHeight / aiHeight);
          modelMesh.scale.set(correctedScale, correctedScale, correctedScale);
        }

        const angle = Math.random() * Math.PI * 2;
        const dist = 0.6 + Math.random() * 0.4;
        const offset = new THREE.Vector3(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
        modelMesh.position.copy(playerModel.position).add(offset);
        modelMesh.lookAt(playerModel.position.clone().setY(modelMesh.position.y));

        modelMesh.traverse(cleanMesh);

        sceneRef.current.add(modelMesh);

        const instanceMixer = new THREE.AnimationMixer(modelMesh);
        instanceMixer.timeScale = 1.0;
        const instanceActions = {};

        const aiAnims = aiModelDef.ai_profile?.animations || {};
        if (Object.keys(aiAnims).length > 0 && adminAnimations) {
          for (const animType of Object.keys(aiAnims)) {
            const animId = aiAnims[animType];
            if (!animId) continue;
            const animData = adminAnimations.find(a => a.id === animId) || adminAnimations.find(a => (a.name || '').toLowerCase().trim() === (animId || '').toLowerCase().trim());
            if (animData) {
              const lower = (animData.file_url || '').toLowerCase();
              let animAsset;
              if (lower.endsWith('.glb') || lower.endsWith('.gltf')) {
                  const gltf = await gltfLoader.loadAsync(animData.file_url);
                  animAsset = { animations: gltf.animations || [] };
              } else {
                  animAsset = await fbxLoader.loadAsync(animData.file_url);
              }
              if (animAsset && animAsset.animations && animAsset.animations.length > 0) {
                const clip = animAsset.animations[0];
                const action = instanceMixer.clipAction(clip);
                if (['attack', 'hit', 'death'].includes(animType)) {
                  action.setLoop(THREE.LoopOnce, 1);
                  action.clampWhenFinished = true;
                } else {
                  action.setLoop(THREE.LoopRepeat);
                }
                instanceActions[animType] = action;
              }
            }
          }
        }

        if (Object.keys(instanceActions).length === 0 && adminAnimations && adminAnimations.length > 0) {
          for (const anim of adminAnimations) {
            const lower = (anim.file_url || '').toLowerCase();
            let animAsset;
            if (lower.endsWith('.glb') || lower.endsWith('.gltf')) {
                const gltf = await gltfLoader.loadAsync(anim.file_url);
                animAsset = { animations: gltf.animations || [] };
            } else {
                animAsset = await fbxLoader.loadAsync(anim.file_url);
            }
            if (animAsset && animAsset.animations && animAsset.animations.length > 0) {
              const clip = animAsset.animations[0];
              const action = instanceMixer.clipAction(clip);
              const name = (anim.name || '').toLowerCase().trim();
              if (['attack', 'hit', 'death', 'hurricane kick', 'sprinting forward roll'].includes(name)) {
                action.setLoop(THREE.LoopOnce, 1);
                action.clampWhenFinished = true;
              }
              instanceActions[name] = action;
            }
          }
        }

        let activeAction = null;
        if (instanceActions['idle']) {
          instanceActions['idle'].reset().fadeIn(0.1).play();
          activeAction = instanceActions['idle'];
        } else if (Object.keys(instanceActions).length > 0) {
          const firstKey = Object.keys(instanceActions)[0];
          instanceActions[firstKey].reset().fadeIn(0.1).play();
          activeAction = instanceActions[firstKey];
        }

        aiInstanceCounterRef.current += 1;
        const instanceId = `${aiModelDef.id}_AI_${String(aiInstanceCounterRef.current).padStart(3, '0')}`;
        
        // Scale enemy stats based on player level
        const pLevel = playerStatsRef.current.level;
        const enemyLevel = Math.max(1, pLevel + Math.floor(Math.random() * 2) - 1); // Player level +/- 1
        
        // Level 1 -> 10 dmg, Level 2 -> 50 dmg, Level 3 -> 100 dmg
        const attackDmg = enemyLevel === 1 ? 10 : (enemyLevel === 2 ? 50 : 50 * Math.pow(1.5, enemyLevel - 2));
        const combatMaxHP = 2 + (enemyLevel * 3); // Hits to kill scales up
        
        const aiProfile = aiModelDef.ai_profile || {};
        const instanceRecord = {
          instanceId, assetId: aiModelDef.id, assetName: aiModelDef.name, modelMesh,
          mixer: instanceMixer, actions: instanceActions, activeAction,
          role: aiModelDef.role || 'enemy', aiProfile, spawnTime: Date.now(),
          aiState: 'idle', aiTarget: null, aiWanderDir: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
          aiWanderTimer: 0, aiSpawnPos: modelMesh.position.clone(), aiAttackCooldown: 0,
          isAlive: true, aiLevel: enemyLevel, maxHP: combatMaxHP, currentHP: combatMaxHP, attackPower: Math.round(attackDmg),
          hitCooldown: 0, deathTimer: -1, hitReactTimer: -1,
        };

        spawnedAIModelsRef.current.set(instanceId, instanceRecord);
        return instanceId;
      };

      const despawnAIInstance = (instanceId) => {
        const inst = spawnedAIModelsRef.current.get(instanceId);
        if (!inst) return;
        if (inst.mixer) inst.mixer.stopAllAction();
        if (inst.modelMesh && sceneRef.current) sceneRef.current.remove(inst.modelMesh);
        spawnedAIModelsRef.current.delete(instanceId);
      };

      const despawnAllForAsset = (assetId) => {
        const toRemove = [];
        spawnedAIModelsRef.current.forEach((inst, id) => {
          if (inst.assetId === assetId) toRemove.push(id);
        });
        toRemove.forEach(id => despawnAIInstance(id));
      };

      const onSpecialKeyDown = async (e) => {
        if (e.key === '}') {
          disableEnemySpawns = !disableEnemySpawns;
          const currentActiveModel = activeCharacterRef.current === 'ybot' ? model : c1ModelRef.current;
          if (currentActiveModel) {
            spawnFloatingText(disableEnemySpawns ? "ENEMY SPAWNS DISABLED" : "ENEMY SPAWNS ENABLED", currentActiveModel.position.clone().add(new THREE.Vector3(0, 2, 0)), disableEnemySpawns ? '#ff0000' : '#00ff00');
          }
          return;
        }

        const keyCode = e.code;
        const aiModelDef = spawnableAIModels.get(keyCode);
        if (aiModelDef) {
          e.preventDefault();
          const currentActiveModel = activeCharacterRef.current === 'ybot' ? model : c1ModelRef.current;
          if (!currentActiveModel) return;

          let existingCount = 0;
          spawnedAIModelsRef.current.forEach(inst => {
            if (inst.assetId === aiModelDef.id) existingCount++;
          });

          if (existingCount > 0) despawnAllForAsset(aiModelDef.id);
          else await spawnAIInstance(aiModelDef, currentActiveModel);
          return;
        }

        const matchedKeybind = findKeybindForKey(keyCode);
        if (matchedKeybind && matchedKeybind.animationSequence && matchedKeybind.animationSequence.length > 0) {
          const playbackType = matchedKeybind.playbackType || 'tap';

          if (sequenceLockRef.current) {
            const activeHold = holdActiveRef.current;
            const activeToggle = toggleActiveRef.current;
            if ((activeHold && activeHold.interruptible === false) || (activeToggle && activeToggle.interruptible === false)) {
              return;
            }
          }

          if (playbackType === 'hold') {
            if (holdActiveRef.current && holdActiveRef.current.key === matchedKeybind.key) return;
            holdActiveRef.current = matchedKeybind;
            playSequence(matchedKeybind.animationSequence, matchedKeybind);
            return;
          }

          if (playbackType === 'toggle') {
            if (toggleActiveRef.current && toggleActiveRef.current.key === matchedKeybind.key) {
              toggleActiveRef.current = null;
              stopHoldOrToggle();
              return;
            }
            toggleActiveRef.current = matchedKeybind;
            playSequence(matchedKeybind.animationSequence, matchedKeybind);
            return;
          }

          if (sequenceLockRef.current) return;
          playSequence(matchedKeybind.animationSequence, matchedKeybind);

          const isAttackKeybind = (matchedKeybind.label || '').toLowerCase().match(/kick|attack|punch|strike|slash|hit/) ||
            matchedKeybind.animationSequence.some(a => (a.animationName || '').toLowerCase().match(/kick|attack|punch|strike|slash|melee/));

          if (isAttackKeybind) {
            const isYBotLocal = activeCharacterRef.current === 'ybot';
            const currentActiveModel = isYBotLocal ? model : c1ModelRef.current;
            if (currentActiveModel) {
              const KICK_DAMAGE = 1;
              const HIT_RANGE = 2.0;
              const IMPACT_DELAY_MS = 200;
              const DEATH_LINGER_S = 2.0;

              setTimeout(() => {
                if (!currentActiveModel) return;
                const playerForward = new THREE.Vector3();
                currentActiveModel.getWorldDirection(playerForward);

                spawnedAIModelsRef.current.forEach(ai => {
                  if (!ai.isAlive) return;
                  if (ai.hitCooldown > 0) return;
                  if (ai.role === 'companion') return;
                  const dist = currentActiveModel.position.distanceTo(ai.modelMesh.position);
                  if (dist > HIT_RANGE) return;
                  const toEnemy = ai.modelMesh.position.clone().sub(currentActiveModel.position).normalize();
                  const dot = playerForward.dot(toEnemy);
                  if (dot < 0.3) return;

                  const actualDamage = playerStatsRef.current.attack;
                  ai.currentHP -= 1; // Basic HP chunking, but show actual damage
                  ai.hitCooldown = 0.5;
                  
                  spawnFloatingText(`-${actualDamage}`, ai.modelMesh.position.clone().add(new THREE.Vector3(0, 1.5, 0)), '#ffff00');

                  if (ai.currentHP <= 0) {
                    ai.isAlive = false;
                    ai.aiState = 'death';
                    ai.mixer.stopAllAction();
                    if (ai.actions['death']) {
                      const deathAction = ai.actions['death'];
                      deathAction.setLoop(THREE.LoopOnce, 1);
                      deathAction.clampWhenFinished = true;
                      deathAction.reset().fadeIn(0.15).play();
                      ai.activeAction = deathAction;
                    }
                    ai.deathTimer = DEATH_LINGER_S;
                    
                    const XP_REWARD = 40 * ai.aiLevel;
                    playerStatsRef.current.xp += XP_REWARD;
                    const nextLevelXp = playerStatsRef.current.level * 100;
                    if (playerStatsRef.current.xp >= nextLevelXp) {
                        playerStatsRef.current.level++;
                        playerStatsRef.current.attack += 15;
                        playerStatsRef.current.maxHp += 20;
                        playerStatsRef.current.hp = playerStatsRef.current.maxHp;
                        spawnFloatingText('LEVEL UP!', currentActiveModel.position.clone().add(new THREE.Vector3(0, 2, 0)), '#00ffff');
                    }
                    window.dispatchEvent(new CustomEvent('syncPlayerStats'));

                    window.dispatchEvent(new CustomEvent('combatXPReward', {
                      detail: { xp: XP_REWARD, genre: 'Action', source: ai.assetName || 'Enemy', position: ai.modelMesh.position.clone() }
                    }));
                  } else {
                    ai.aiState = 'hit';
                    if (ai.actions['hit']) {
                      ai.mixer.stopAllAction();
                      const hitAction = ai.actions['hit'];
                      hitAction.setLoop(THREE.LoopOnce, 1);
                      hitAction.clampWhenFinished = true;
                      hitAction.reset().fadeIn(0.1).play();
                      ai.activeAction = hitAction;
                    }
                    ai.hitReactTimer = 0.5;
                  }
                });
              }, IMPACT_DELAY_MS);
            }
          }
          return;
        }

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

          const currentActiveModel = isYBot ? model : c1ModelRef.current;
          if (currentActiveModel) {
            const KICK_DAMAGE = 1;
            const HIT_RANGE = 2.0;
            const IMPACT_DELAY_MS = 200;
            const DEATH_LINGER_S = 2.0;

            setTimeout(() => {
              if (!currentActiveModel) return;
              const playerForward = new THREE.Vector3();
              currentActiveModel.getWorldDirection(playerForward);

              spawnedAIModelsRef.current.forEach(ai => {
                if (!ai.isAlive) return;
                if (ai.hitCooldown > 0) return;
                if (ai.role === 'companion') return;
                const dist = currentActiveModel.position.distanceTo(ai.modelMesh.position);
                if (dist > HIT_RANGE) return;
                const toEnemy = ai.modelMesh.position.clone().sub(currentActiveModel.position).normalize();
                const dot = playerForward.dot(toEnemy);
                if (dot < 0.3) return;

                ai.currentHP -= KICK_DAMAGE;
                ai.hitCooldown = 0.5;

                if (ai.currentHP <= 0) {
                  ai.isAlive = false;
                  ai.aiState = 'death';
                  ai.mixer.stopAllAction();
                  if (ai.actions['death']) {
                    const deathAction = ai.actions['death'];
                    deathAction.setLoop(THREE.LoopOnce, 1);
                    deathAction.clampWhenFinished = true;
                    deathAction.reset().fadeIn(0.15).play();
                    ai.activeAction = deathAction;
                  }
                  ai.deathTimer = DEATH_LINGER_S;
                  const XP_REWARD = 40;
                  window.dispatchEvent(new CustomEvent('combatXPReward', {
                    detail: { xp: XP_REWARD, genre: 'Action', source: ai.assetName || 'Enemy', position: ai.modelMesh.position.clone() }
                  }));
                } else {
                  ai.aiState = 'hit';
                  if (ai.actions['hit']) {
                    ai.mixer.stopAllAction();
                    const hitAction = ai.actions['hit'];
                    hitAction.setLoop(THREE.LoopOnce, 1);
                    hitAction.clampWhenFinished = true;
                    hitAction.reset().fadeIn(0.1).play();
                    ai.activeAction = hitAction;
                  }
                  ai.hitReactTimer = 0.5;
                }
              });
            }, IMPACT_DELAY_MS);
          }
        }
      };

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

      initRenderActive = false;
      animate();

    }, undefined, (err) => console.error('Error loading Y-Bot:', err));

    // --- C1 MODEL (ErikaArcher) ---
    const c1Url = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/3f915913a_ErikaArcher.fbx';
    new FBXLoader().load(c1Url, async (c1fbx) => {
      const c1 = c1fbx;
      c1.scale.set(0.001, 0.001, 0.001);
      c1.position.set(0, -0.5, 0);
      c1.visible = activeCharacterRef.current === 'c1';

      c1.traverse(cleanMesh);

      c1ModelRef.current = c1;
      scene.add(c1);

      const c1Mixer = new THREE.AnimationMixer(c1);
      c1MixerRef.current = c1Mixer;
      c1Mixer.timeScale = 1.2;

      if (adminAnimations && adminAnimations.length > 0) {
        const fbxLoader = new FBXLoader();
        const gltfLoader = new GLTFLoader();
        for (const anim of adminAnimations) {
          try {
            const lower = (anim.file_url || '').toLowerCase();
            let animAsset;
            if (lower.endsWith('.glb') || lower.endsWith('.gltf')) {
                const gltf = await gltfLoader.loadAsync(anim.file_url);
                animAsset = { animations: gltf.animations || [] };
            } else {
                animAsset = await fbxLoader.loadAsync(anim.file_url);
            }

            if (!animAsset || !animAsset.animations || animAsset.animations.length === 0) continue;
            const clip = animAsset.animations[0];
            const action = c1Mixer.clipAction(clip);
            const name = (anim.name || '').toLowerCase().trim();

            if (name === 'jumping' || name === 'hurricane kick' || name === 'sprinting forward roll') {
              action.setLoop(THREE.LoopOnce, 1);
              action.clampWhenFinished = true;
            }

            if (name === 'hurricane kick') c1ActionsRef.current['hurricane_kick'] = action;
            else if (name === 'sprinting forward roll') c1ActionsRef.current['sprinting'] = action;
            c1ActionsRef.current[name] = action;
          } catch (e) {
            console.error("[C1] Failed to load animation:", anim.name, e);
          }
        }

        if (c1ActionsRef.current['idle']) {
          c1ActionsRef.current['idle'].reset().play();
          c1ActiveActionRef.current = c1ActionsRef.current['idle'];
        }
      }

      const weaponControllerRef = { current: null };
      const effectControllerRef = { current: null };

      const SWORD_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/53379b78d_stylized_emerald_sword.glb';
      const EFFECT_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/2d967f68b_jetpack_effect.glb';

      const setupC1Attachments = async () => {
        await new Promise(r => setTimeout(r, 100));
        
        try {
          const wc = await attachWeapon(c1, SWORD_URL, {
            backBone: 'Spine2',
            handBone: 'RightHand',
            scale: 50,
          });
          weaponControllerRef.current = wc;
          if (wc) {
            wc.mesh.visible = true;
            wc.mesh.traverse(child => {
              if (child.isMesh) child.visible = true;
            });
          } else {
            const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader');
            const loader = new GLTFLoader();
            loader.load(SWORD_URL, (gltf) => {
              const sword = gltf.scene;
              sword.scale.setScalar(0.1);
              sword.position.set(0, 100, -30);
              sword.rotation.set(0, 0, Math.PI * 0.75);
              c1.add(sword);
            });
          }
        } catch (e) { }

        try {
          const ec = await attachEffect(c1, EFFECT_URL, {
            boneName: 'Spine2',
            scale: 50,
            offset: { x: 0, y: 20, z: -15 },
          });
          effectControllerRef.current = ec;
        } catch (e) { }
      };
      setupC1Attachments();

      const onDrawSword = (e) => {
        if (activeCharacterRef.current !== 'c1') return;
        
        if (e.code === 'KeyR') {
          if (effectControllerRef.current) {
            setTimeout(() => {
              if (effectControllerRef.current) {
                if (weaponControllerRef.current && weaponControllerRef.current.isInHand() && weaponControllerRef.current.rightHandBone) {
                  const effMesh = effectControllerRef.current.mesh;
                  const currentParent = effMesh.parent;
                  if (currentParent) currentParent.remove(effMesh);
                  effMesh.position.set(0, 5, 0);
                  weaponControllerRef.current.rightHandBone.add(effMesh);
                }
                effectControllerRef.current.play();
                setTimeout(() => {
                  if (effectControllerRef.current) effectControllerRef.current.hide();
                }, 1200);
              }
            }, 400);
          }
          return;
        }

        if (e.code !== 'KeyX') return;

        if (effectControllerRef.current) {
          effectControllerRef.current.play();
          setTimeout(() => {
            if (effectControllerRef.current) effectControllerRef.current.hide();
          }, 1500);
        }

        if (weaponControllerRef.current && !weaponControllerRef.current.isInHand()) {
          setTimeout(() => {
            if (weaponControllerRef.current) weaponControllerRef.current.moveToHand();
          }, 400);
        } else if (weaponControllerRef.current && weaponControllerRef.current.isInHand()) {
          weaponControllerRef.current.moveToBack();
        }
      };
      window.addEventListener('keydown', onDrawSword);

      c1.userData._weaponCleanup = () => {
        window.removeEventListener('keydown', onDrawSword);
        if (weaponControllerRef.current) weaponControllerRef.current.dispose();
        if (effectControllerRef.current) effectControllerRef.current.dispose();
      };

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
      const toActions = isYBot ? c1ActionsRef.current : actionsRef.current;
      const toActiveAction = isYBot ? c1ActiveActionRef : activeActionRef;

      toModel.position.copy(fromModel.position);
      toModel.quaternion.copy(fromModel.quaternion);

      fromModel.visible = false;
      toModel.visible = true;

      activeCharacterRef.current = isYBot ? 'c1' : 'ybot';
      localStorage.setItem('luna_active_character', activeCharacterRef.current);
      window.dispatchEvent(new CustomEvent('characterSwitched', { detail: { active: activeCharacterRef.current } }));

      const idleAction = toActions['idle'];
      if (idleAction) {
        if (toActiveAction.current && toActiveAction.current !== idleAction) {
          toActiveAction.current.fadeOut(0.2);
        }
        idleAction.reset().fadeIn(0.2).play();
        toActiveAction.current = idleAction;
      }
      currentActionNameRef.current = 'idle';

      sequenceLockRef.current = false;
      sequenceQueueRef.current = [];
      sequenceIndexRef.current = -1;
      holdActiveRef.current = null;
      toggleActiveRef.current = null;
      blendBackRef.current = null;

      setTimeout(() => { switchingRef.current = false; }, 200);
    };
    window.addEventListener('keydown', onSwitchCharacter);

      // --- MULTIPLAYER PLAYERS SYSTEM ---

      const handleMultiplayerUpdate = (e) => {
        const scene = sceneRef.current;
        if (!scene) return;
        const players = e.detail.players || [];
        
        const currentIds = new Set(players.map(p => p.player_id));

        // Remove disconnected players
        for (const [id, data] of remotePlayersRef.current.entries()) {
          if (!currentIds.has(id)) {
            scene.remove(data.model);
            if (data.mixer) data.mixer.stopAllAction();
            remotePlayersRef.current.delete(id);
          }
        }

        // Add or update players
        players.forEach(async p => {
          let pData = remotePlayersRef.current.get(p.player_id);

          if (!pData && p.model_url) {
            // Initiate load
            pData = { loading: true, targetPos: new THREE.Vector3(p.x, p.y, p.z), targetYaw: p.yaw, targetAnim: p.anim };
            remotePlayersRef.current.set(p.player_id, pData);

            const onLoaded = (obj) => {
              obj.scale.set(0.001, 0.001, 0.001); 
              
              obj.traverse(cleanMesh);

              scene.add(obj);

              const mixer = new THREE.AnimationMixer(obj);
              mixer.timeScale = 1.2;
              
              const actions = {};
              
              const bindAnims = async () => {
                if (!adminAnimations || adminAnimations.length === 0) return;
                const fbxLoader = new FBXLoader();
                const gltfLoader = new GLTFLoader();
                for (const anim of adminAnimations) {
                  try {
                    const lower = (anim.file_url || '').toLowerCase();
                    let animAsset;
                    if (lower.endsWith('.glb') || lower.endsWith('.gltf')) {
                        const gltf = await gltfLoader.loadAsync(anim.file_url);
                        animAsset = { animations: gltf.animations || [] };
                    } else {
                        animAsset = await fbxLoader.loadAsync(anim.file_url);
                    }
                    if (!animAsset || !animAsset.animations || animAsset.animations.length === 0) continue;
                    const clip = animAsset.animations[0];
                    const action = mixer.clipAction(clip);
                    const name = (anim.name || '').toLowerCase().trim();
                    if (['idle', 'running', 'jumping', 'falling'].includes(name)) {
                      actions[name] = action;
                      if (name !== 'idle' && name !== 'running') {
                        action.setLoop(THREE.LoopOnce, 1);
                        action.clampWhenFinished = true;
                      }
                    }
                  } catch (e) {}
                }
              };
              
              bindAnims().then(() => {
                if (actions['idle']) actions['idle'].play();
              });

              pData.model = obj;
              pData.mixer = mixer;
              pData.actions = actions;
              pData.activeActionName = 'idle';
              pData.loading = false;

              remotePlayersRef.current.set(p.player_id, pData);
            };

            const url = p.model_url;
            const lower = url.toLowerCase();
            if (lower.endsWith('.fbx')) {
              new FBXLoader().load(url, onLoaded);
            } else if (lower.endsWith('.glb') || lower.endsWith('.gltf')) {
              new GLTFLoader().load(url, (gltf) => {
                const obj = gltf.scene;
                obj.animations = gltf.animations || [];
                onLoaded(obj);
              });
            } else {
              new FBXLoader().load(url, onLoaded, undefined, () => {
                new GLTFLoader().load(url, (gltf) => {
                  const obj = gltf.scene;
                  obj.animations = gltf.animations || [];
                  onLoaded(obj);
                });
              });
            }
          } else if (pData && !pData.loading) {
            (pData.positionBuffer = pData.positionBuffer || []).push({ t: performance.now(), pos: new THREE.Vector3(p.x, p.y, p.z), yaw: p.yaw, anim: p.anim });
            if (pData.positionBuffer.length > 10) pData.positionBuffer.shift();
          }
        });
      };
      
      window.addEventListener('multiplayerPlayersUpdate', handleMultiplayerUpdate);

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
      initRenderActive = false;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('keydown', onSwitchCharacter);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('multiplayerPlayersUpdate', handleMultiplayerUpdate);
      if (c1ModelRef.current?.userData?._weaponCleanup) c1ModelRef.current.userData._weaponCleanup();
      spawnedAIModelsRef.current.forEach(inst => {
        if (inst.mixer) inst.mixer.stopAllAction();
        if (inst.modelMesh) scene.remove(inst.modelMesh);
      });
      spawnedAIModelsRef.current.clear();
      if (modelRef.current?.userData?._hurricaneCleanup) modelRef.current.userData._hurricaneCleanup();
      
      loadedEnvUrlRef.current = null;
      if (containerRef.current && renderer.domElement && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [adminAnimations, keybinds, spawnableAIModels]);

  useEffect(() => {
    if (!isModelLoaded) return; 
    
    const mixer = mixerRef.current;
    const c1Mixer = c1MixerRef.current;
    const idleVariations = ['standing idle 01', 'standing idle 02 looking', 'standing idle 03 examine', 'standing idle 04'];
    
    const handleIdleFinish = (e) => {
        const isMoving = keysPressed.current['w'] || keysPressed.current['a'] || keysPressed.current['s'] || keysPressed.current['d'];
        if (isMoving || !isGroundedRef.current || !equippedWeaponUrl) return;
        if (sequenceLockRef.current) return; 
        
        const action = e.action;
        const currentName = currentActionNameRef.current.toLowerCase();
        
        if (idleVariations.includes(currentName)) {
          let idx = idleVariations.indexOf(currentName);
          let nextName = idleVariations[(idx + 1) % idleVariations.length];
          
          const isYBot = activeCharacterRef.current === 'ybot';
          const actions = isYBot ? actionsRef.current : c1ActionsRef.current;
          
          let attempts = 0;
          while (!actions[nextName] && attempts < idleVariations.length) {
              idx = (idx + 1) % idleVariations.length;
              nextName = idleVariations[idx];
              attempts++;
          }
          
          if (actions[nextName]) {
              const nextAction = actions[nextName];
              nextAction.setLoop(THREE.LoopOnce, 1);
              nextAction.clampWhenFinished = true;
              
              const activeRef = isYBot ? activeActionRef : c1ActiveActionRef;
              if (activeRef.current) activeRef.current.fadeOut(0.2);
              nextAction.reset().fadeIn(0.2).play();
              
              activeRef.current = nextAction;
              currentActionNameRef.current = nextName;
          } else {
              const actions = activeCharacterRef.current === 'ybot' ? actionsRef.current : c1ActionsRef.current;
              const activeRef = activeCharacterRef.current === 'ybot' ? activeActionRef : c1ActiveActionRef;
              const idle = actions['idle'];
              if (idle) {
                  if (activeRef.current) activeRef.current.fadeOut(0.2);
                  idle.reset().fadeIn(0.2).play();
                  activeRef.current = idle;
                  currentActionNameRef.current = 'idle';
              }
          }
        }
    };

    if (mixer) mixer.addEventListener('finished', handleIdleFinish);
    if (c1Mixer) c1Mixer.addEventListener('finished', handleIdleFinish);
    
    return () => {
        if (mixer) mixer.removeEventListener('finished', handleIdleFinish);
        if (c1Mixer) c1Mixer.removeEventListener('finished', handleIdleFinish);
    };
  }, [equippedWeaponUrl, isModelLoaded]);

  return (
    <div ref={containerRef} className="w-full h-full relative" tabIndex="0">
      {/* Player HUD */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none flex flex-col gap-1.5 w-48"
        style={{
          background: 'rgba(10, 14, 20, 0.75)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '12px',
          padding: '12px'
        }}>
        <div className="flex justify-between items-end mb-1">
          <span className="text-white font-bold text-sm">Level {playerStats.level}</span>
          <span className="text-white/60 text-[10px] font-bold">ATK: {playerStats.attack}</span>
        </div>
        
        {/* HP Bar */}
        <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden border border-white/10 relative">
          <div className="absolute inset-y-0 left-0 bg-red-500 transition-all duration-300" style={{ width: `${Math.max(0, (playerStats.hp / playerStats.maxHp) * 100)}%` }} />
        </div>
        <div className="text-[9px] text-white/50 text-right mb-2">{Math.round(playerStats.hp)} / {playerStats.maxHp} HP</div>

        {/* XP Bar */}
        <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/10 relative">
          <div className="absolute inset-y-0 left-0 bg-cyan-400 transition-all duration-300" style={{ width: `${(playerStats.xp / (playerStats.level * 100)) * 100}%` }} />
        </div>
        <div className="text-[9px] text-white/50 text-right">{playerStats.xp} / {playerStats.level * 100} XP</div>
      </div>

      <div ref={floatingTextContainerRef} className="absolute inset-0 pointer-events-none z-50 overflow-hidden" />

      <div className="absolute bottom-4 right-4 z-10 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase pointer-events-none"
        style={{
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.7)'
        }}>
        {activeCharLabel === 'ybot' ? 'Y-Bot' : 'C1'} ⟨ \\ ⟩
      </div>
    </div>
  );
}