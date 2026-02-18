import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, SkipBack, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createFXGroup, updateFXGroup, createReactorFiringGlow } from './FXVisualRenderer';
import ReactorBridge from './ReactorBridge';

const VIEW_PRESETS = {
  perspective: { pos: [0, 1.5, 4], label: 'Perspective' },
  front: { pos: [0, 1.2, 5], label: 'Front' },
  side: { pos: [5, 1.2, 0], label: 'Side' },
  top: { pos: [0, 6, 0.01], label: 'Top' },
};

const DAMAGE_TYPE_COLORS = {
  physical: 0x94a3b8, energy: 0xfacc15, lightning: 0x60a5fa,
  fire: 0xf97316, ice: 0x22d3ee, true_damage: 0xef4444,
  poison: 0x22c55e, holy: 0xfbbf24,
};

const ReactorViewport = forwardRef(({
  modelUrl, selectedBone, reactors = [], onBoneClick,
  animationUrl, isPlaying, animTime, onAnimTimeChange, onAnimLoaded,
  activeFXDrag, onFXDropOnBone,
  fxBlocks = [],
}, ref) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const modelRef = useRef(null);
  const mixerRef = useRef(null);
  const activeActionRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const reactorMeshesRef = useRef([]);
  const boneSphereMapRef = useRef(new Map()); // bone name -> sphere mesh
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const [viewMode, setViewMode] = useState('perspective');
  const [bones, setBones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredBone, setHoveredBone] = useState(null);
  const [animDuration, setAnimDuration] = useState(0);
  const [localPlaying, setLocalPlaying] = useState(false);
  const animFrameRef = useRef(null);
  const activeFXMeshesRef = useRef(new Map()); // fxBlockId -> { group, type }
  const firingGlowRef = useRef(null);
  const timeAccRef = useRef(0);
  const onAnimTimeChangeRef = useRef(onAnimTimeChange);
  onAnimTimeChangeRef.current = onAnimTimeChange;

  useImperativeHandle(ref, () => ({
    getBones: () => bones,
    setView: (mode) => setViewMode(mode),
    getAnimDuration: () => animDuration,
    loadAnimation: (url) => loadAnimationClip(url),
  }));

  // Load model
  useEffect(() => {
    if (!containerRef.current || !modelUrl) return;
    setLoading(true);

    const container = containerRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e14);
    sceneRef.current = scene;

    const grid = new THREE.GridHelper(20, 20, 0x1a1f2e, 0x111827);
    scene.add(grid);

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
    const vp = VIEW_PRESETS[viewMode];
    camera.position.set(...vp.pos);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1, 0);
    controlsRef.current = controls;

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(3, 5, 4);
    scene.add(dir);
    const back = new THREE.DirectionalLight(0x4488ff, 0.4);
    back.position.set(-3, 3, -4);
    scene.add(back);

    const isFbx = modelUrl.toLowerCase().includes('.fbx');
    const loader = isFbx ? new FBXLoader() : new GLTFLoader();
    loader.load(modelUrl, (asset) => {
      const model = isFbx ? asset : asset.scene;

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 2.5 / maxDim;
      model.scale.multiplyScalar(scale);
      model.position.sub(center.multiplyScalar(scale));
      model.position.y += 0.5;

      scene.add(model);
      modelRef.current = model;

      // Extract bones & create clickable bone spheres
      const foundBones = [];
      const boneMap = new Map();
      model.traverse((node) => {
        if (node.isBone) {
          foundBones.push(node.name);
          // Create a small sphere at each bone for raycasting
          const geo = new THREE.SphereGeometry(0.04, 8, 8);
          const mat = new THREE.MeshBasicMaterial({ color: 0x445566, transparent: true, opacity: 0.3 });
          const sphere = new THREE.Mesh(geo, mat);
          sphere.userData.boneName = node.name;
          sphere.userData.boneRef = node;
          scene.add(sphere);
          boneMap.set(node.name, sphere);
        }
      });
      setBones(foundBones);
      boneSphereMapRef.current = boneMap;

      // Skeleton helper
      const skeletonHelper = new THREE.SkeletonHelper(model);
      skeletonHelper.material.linewidth = 2;
      scene.add(skeletonHelper);

      // Model's embedded animation
      const anims = isFbx ? asset.animations : asset.animations;
      if (anims?.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        mixerRef.current = mixer;
        const clip = anims[0];
        const action = mixer.clipAction(clip);
        action.reset();
        action.setLoop(THREE.LoopRepeat);
        action.clampWhenFinished = false;
        action.enabled = true;
        action.setEffectiveWeight(1);
        action.play();
        action.paused = true; // start paused so user controls it
        action.time = 0;
        activeActionRef.current = action;
        setAnimDuration(clip.duration);
        console.log(`[ReactorViewport] Embedded animation: "${clip.name}" duration=${clip.duration.toFixed(2)}s`);
        onAnimLoaded?.(clip.duration, clip.name);
      }

      setLoading(false);
    }, undefined, () => setLoading(false));

    // Render loop
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      timeAccRef.current += delta;

      if (mixerRef.current && activeActionRef.current) {
        if (!activeActionRef.current.paused) {
          mixerRef.current.update(delta);
          // Report normalized time back to parent
          const t = activeActionRef.current.time;
          const dur = activeActionRef.current.getClip().duration;
          if (dur > 0) {
            onAnimTimeChangeRef.current?.(t / dur);
          }
        }

        // Update bone sphere positions
        if (modelRef.current) {
          boneSphereMapRef.current.forEach((sphere, boneName) => {
            let bone = sphere.userData.boneRef;
            if (bone) {
              const wp = new THREE.Vector3();
              bone.getWorldPosition(wp);
              sphere.position.copy(wp);
            }
          });
        }
      }

      // Update active FX meshes animation
      activeFXMeshesRef.current.forEach(({ group, type }) => {
        updateFXGroup(group, timeAccRef.current, type);
      });

      // Update firing glow animation
      if (firingGlowRef.current) {
        const pulse = Math.sin(timeAccRef.current * 8) * 0.3 + 1;
        firingGlowRef.current.scale.setScalar(pulse);
        firingGlowRef.current.rotation.y += 0.03;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      // Clean up FX meshes
      activeFXMeshesRef.current.forEach(({ group }) => scene.remove(group));
      activeFXMeshesRef.current.clear();
      if (firingGlowRef.current) {
        scene.remove(firingGlowRef.current);
        firingGlowRef.current = null;
      }
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = null;
      }
      activeActionRef.current = null;
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [modelUrl]);

  // Play/Pause control from parent
  useEffect(() => {
    if (!activeActionRef.current) return;
    const action = activeActionRef.current;
    action.paused = !isPlaying;
    // If we're starting playback, ensure the action is enabled and not stuck
    if (isPlaying) {
      action.enabled = true;
      action.setEffectiveWeight(1);
      // If at the very end, restart from beginning
      const dur = action.getClip().duration;
      if (dur > 0 && action.time >= dur - 0.01) {
        action.time = 0;
      }
    }
    setLocalPlaying(isPlaying);
  }, [isPlaying]);

  // Scrub to specific time from parent
  useEffect(() => {
    if (!activeActionRef.current || animTime === undefined || animTime === null) return;
    const action = activeActionRef.current;
    const dur = action.getClip().duration;
    // Only scrub when paused — otherwise the mixer drives the time
    if (dur > 0 && action.paused) {
      action.time = animTime * dur;
      action.enabled = true;
      action.setEffectiveWeight(1);
      mixerRef.current?.update(0);
      
      // Force bone sphere position update after scrub
      if (modelRef.current) {
        boneSphereMapRef.current.forEach((sphere) => {
          const bone = sphere.userData.boneRef;
          if (bone) {
            const wp = new THREE.Vector3();
            bone.getWorldPosition(wp);
            sphere.position.copy(wp);
          }
        });
      }
    }
  }, [animTime]);

  // Load external animation FBX onto the model
  const loadAnimationClip = useCallback((url) => {
    if (!modelRef.current || !url) return;
    const isFbx = url.toLowerCase().includes('.fbx');
    const loader = isFbx ? new FBXLoader() : new GLTFLoader();
    loader.load(url, (asset) => {
      const anims = isFbx ? asset.animations : asset.animations;
      if (!anims?.length) {
        console.warn('[ReactorViewport] No animations found in file:', url);
        return;
      }

      if (!mixerRef.current) {
        mixerRef.current = new THREE.AnimationMixer(modelRef.current);
      }
      // Stop ALL existing actions on the mixer to avoid conflicts
      mixerRef.current.stopAllAction();

      const clip = anims[0];
      const action = mixerRef.current.clipAction(clip);
      action.reset();
      action.setLoop(THREE.LoopRepeat);
      action.clampWhenFinished = false;
      action.enabled = true;
      action.setEffectiveWeight(1);
      action.play();
      action.paused = true; // Start paused — user presses play
      action.time = 0;
      activeActionRef.current = action;

      const dur = clip.duration;
      setAnimDuration(dur);
      console.log(`[ReactorViewport] Animation loaded: "${clip.name || url.split('/').pop()}" duration=${dur.toFixed(2)}s`);
      onAnimLoaded?.(dur, clip.name || url.split('/').pop());
    }, undefined, (err) => {
      console.error('[ReactorViewport] Failed to load animation:', url, err);
    });
  }, [onAnimLoaded]);

  // Load animation when animationUrl prop changes
  // Use animationUrl as sole dep — loadAnimationClip is stable via useCallback
  useEffect(() => {
    if (animationUrl && modelRef.current) {
      console.log('[ReactorViewport] animationUrl changed, loading:', animationUrl);
      loadAnimationClip(animationUrl);
    }
  }, [animationUrl]);

  // View mode change
  useEffect(() => {
    if (!cameraRef.current) return;
    const vp = VIEW_PRESETS[viewMode];
    cameraRef.current.position.set(...vp.pos);
    controlsRef.current?.target.set(0, 1, 0);
    controlsRef.current?.update();
  }, [viewMode]);

  // Update reactor visualization (runs every frame via bone sphere update, but static meshes here)
  useEffect(() => {
    if (!sceneRef.current || !modelRef.current) return;

    reactorMeshesRef.current.forEach(m => sceneRef.current.remove(m));
    reactorMeshesRef.current = [];

    // Highlight selected bone
    boneSphereMapRef.current.forEach((sphere, boneName) => {
      if (boneName === selectedBone) {
        sphere.material.color.setHex(0x00ffff);
        sphere.material.opacity = 0.8;
        sphere.scale.setScalar(2.5);
      } else if (boneName === hoveredBone) {
        sphere.material.color.setHex(0x88aaff);
        sphere.material.opacity = 0.5;
        sphere.scale.setScalar(1.8);
      } else {
        sphere.material.color.setHex(0x445566);
        sphere.material.opacity = 0.3;
        sphere.scale.setScalar(1);
      }
    });

    // Reactor collider spheres
    reactors.forEach(r => {
      const boneSphere = boneSphereMapRef.current.get(r.bone_name);
      if (!boneSphere) return;

      const geo = new THREE.SphereGeometry(r.collider_radius * 0.1, 16, 16);
      const color = DAMAGE_TYPE_COLORS[r.damage_type] || 0x00ffcc;
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, wireframe: true });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(boneSphere.position);
      const offset = r.collider_offset || { x: 0, y: 0, z: 0 };
      mesh.position.x += offset.x * 0.1;
      mesh.position.y += offset.y * 0.1;
      mesh.position.z += offset.z * 0.1;

      sceneRef.current.add(mesh);
      reactorMeshesRef.current.push(mesh);
    });
  }, [reactors, selectedBone, hoveredBone]);

  // ── FX Block visualization in viewport ──
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const currentTime = animTime;

    // Determine which FX blocks are active
    const activeBlockIds = new Set();
    fxBlocks.forEach(fx => {
      const start = fx.start_time || 0;
      const end = start + (fx.duration_norm || 0.1);
      if (currentTime >= start && currentTime <= end) {
        activeBlockIds.add(fx._id);
      }
    });

    // Remove FX meshes that are no longer active
    activeFXMeshesRef.current.forEach(({ group }, id) => {
      if (!activeBlockIds.has(id)) {
        scene.remove(group);
        activeFXMeshesRef.current.delete(id);
      }
    });

    // Add new active FX meshes
    activeBlockIds.forEach(id => {
      if (activeFXMeshesRef.current.has(id)) {
        // Already exists, update position
        const { group } = activeFXMeshesRef.current.get(id);
        const fx = fxBlocks.find(f => f._id === id);
        if (fx?.bone) {
          const boneSphere = boneSphereMapRef.current.get(fx.bone);
          if (boneSphere) group.position.copy(boneSphere.position);
        }
        return;
      }

      const fx = fxBlocks.find(f => f._id === id);
      if (!fx) return;

      const group = createFXGroup(fx, fx.color);
      
      // Position at bone
      if (fx.bone) {
        const boneSphere = boneSphereMapRef.current.get(fx.bone);
        if (boneSphere) group.position.copy(boneSphere.position);
      }

      scene.add(group);
      activeFXMeshesRef.current.set(id, { group, type: fx.effect_type || 'burst' });
    });
  }, [animTime, fxBlocks]);

  // ── Reactor firing glow visualization ──
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Check for firing reactors
    const firingReactor = reactors.find(r =>
      animTime >= (r.trigger_time || 0) && animTime <= (r.trigger_end_time || r.trigger_time + 0.1)
    );

    if (firingReactor) {
      if (!firingGlowRef.current) {
        const glow = createReactorFiringGlow(firingReactor.damage_type);
        scene.add(glow);
        firingGlowRef.current = glow;
      }
      // Position at bone
      const boneSphere = boneSphereMapRef.current.get(firingReactor.bone_name);
      if (boneSphere && firingGlowRef.current) {
        firingGlowRef.current.position.copy(boneSphere.position);
      }
    } else {
      if (firingGlowRef.current) {
        scene.remove(firingGlowRef.current);
        firingGlowRef.current = null;
      }
    }
  }, [animTime, reactors]);

  // Click handler for bone picking
  const handleClick = useCallback((e) => {
    if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    const spheres = Array.from(boneSphereMapRef.current.values());
    const intersects = raycasterRef.current.intersectObjects(spheres);
    if (intersects.length > 0) {
      const boneName = intersects[0].object.userData.boneName;
      if (boneName) {
        // If we have an active FX drag, drop it on this bone
        if (activeFXDrag) {
          onFXDropOnBone?.(boneName, activeFXDrag);
        } else {
          onBoneClick?.(boneName);
        }
      }
    }
  }, [onBoneClick, activeFXDrag, onFXDropOnBone]);

  // Hover handler for bone highlighting
  const handleMouseMove = useCallback((e) => {
    if (!rendererRef.current || !cameraRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const spheres = Array.from(boneSphereMapRef.current.values());
    const intersects = raycasterRef.current.intersectObjects(spheres);
    if (intersects.length > 0) {
      setHoveredBone(intersects[0].object.userData.boneName);
    } else {
      setHoveredBone(null);
    }
  }, []);

  return (
    <div className="relative w-full h-full min-h-[400px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
      <div
        ref={containerRef}
        className="w-full h-full"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        style={{ cursor: hoveredBone ? (activeFXDrag ? 'copy' : 'pointer') : 'default' }}
      />

      {/* View Mode Buttons */}
      <div className="absolute top-3 left-3 flex gap-1">
        {Object.entries(VIEW_PRESETS).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setViewMode(key)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
              viewMode === key
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                : 'bg-slate-900/80 text-slate-500 border-slate-700 hover:text-white'
            }`}
          >
            {val.label}
          </button>
        ))}
      </div>

      {/* Bone count + hovered bone */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        {hoveredBone && (
          <Badge className="bg-blue-500/20 text-blue-300 text-[9px] border border-blue-500/30">
            {activeFXDrag ? `Drop FX → ${hoveredBone}` : hoveredBone}
          </Badge>
        )}
        <Badge className="bg-slate-900/80 text-slate-400 text-[9px]">{bones.length} bones</Badge>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 rounded text-[9px] text-slate-500">
        Click bone to select{activeFXDrag ? ' (FX drop mode)' : ''} • LMB: Rotate • RMB: Pan • Scroll: Zoom
      </div>
    </div>
  );
});

ReactorViewport.displayName = 'ReactorViewport';
export default ReactorViewport;