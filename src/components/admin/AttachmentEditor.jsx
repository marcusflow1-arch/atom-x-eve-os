import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Move, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence } from 'framer-motion';
import DirectorChat from './DirectorChat';
import AttachmentObjectPanel from './attachment/AttachmentObjectPanel';
import AssetPickerModal from './attachment/AssetPickerModal';
import AnimationTimebar from './attachment/AnimationTimebar';
import { createGizmo, getGizmoHitMeshes, positionGizmo, hideGizmo } from './attachment/TransformGizmo';
import ReactorBridge from './reactor/ReactorBridge';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const DEFAULT_TRANSFORMS = {
  object: { position: { x: 0, y: 5, z: 0 }, rotation: { x: 90, y: 180, z: 0 }, scale: 50 },
  effect: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: 30 },
};

const CHARACTER_URLS = {
  c1: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/3f915913a_ErikaArcher.fbx',
  ybot: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/608211a0f_YBot1.fbx',
};

let idCounter = 0;
function newId() { return `obj_${Date.now()}_${++idCounter}`; }

export default function AttachmentEditor() {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const characterRef = useRef(null);
  const mixerRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const gizmoRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const currentActionRef = useRef(null);

  const [attachedObjects, setAttachedObjects] = useState([]);
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  const meshMapRef = useRef(new Map());

  const [selectedCharacter, setSelectedCharacter] = useState('c1');
  const [boneList, setBoneList] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Asset picker
  const [pickerOpen, setPickerOpen] = useState(null); // null | 'object' | 'effect'

  // Animation timeline
  const [isPlaying, setIsPlaying] = useState(false);
  const [animTime, setAnimTime] = useState(0);
  const [animDuration, setAnimDuration] = useState(0);
  const [currentAnimName, setCurrentAnimName] = useState('');

  // Gizmo drag
  const dragAxisRef = useRef(null);
  const dragModeRef = useRef(null); // 'translate' | 'rotate'
  const dragStartRef = useRef(null);
  const dragObjectIdRef = useRef(null);

  // ── Data Queries ──
  const { data: adminAnimations = [] } = useQuery({
    queryKey: ['adminAnimations-att'],
    queryFn: () => base44.entities.AnimationFBX.list('-created_date', 200),
    staleTime: Infinity,
  });

  const { data: fxList = [] } = useQuery({
    queryKey: ['reactorFX-att'],
    queryFn: () => base44.entities.ReactorFX.list('-created_date', 100),
    staleTime: 60000,
  });

  const { data: models3d = [] } = useQuery({
    queryKey: ['models3d-att'],
    queryFn: () => base44.entities.Model3D.list('-created_date', 100),
    staleTime: 60000,
  });

  // ── Three.js Scene Setup ──
  const initDoneRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || initDoneRef.current) return;

    // Defer init until container actually has size (forceMount + hidden tab issue)
    const tryInit = () => {
      const el = containerRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w < 10 || h < 10) return; // Still hidden — wait
      initDoneRef.current = true;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x12141a);
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(50, w / h, 0.01, 100);
      camera.position.set(0, 1, 3);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h);
      el.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0.8, 0);
      controls.update();
      controlsRef.current = controls;

      scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.5));
      const dir = new THREE.DirectionalLight(0xffffff, 2);
      dir.position.set(5, 10, 5);
      scene.add(dir);
      scene.add(new THREE.GridHelper(10, 20, 0x333344, 0x222233));

      const gizmo = createGizmo();
      scene.add(gizmo);
      gizmoRef.current = gizmo;

      const animate = () => {
        requestAnimationFrame(animate);
        const delta = clockRef.current.getDelta();
        if (mixerRef.current) {
          mixerRef.current.update(delta);
          if (currentActionRef.current && currentActionRef.current.isRunning()) {
            setAnimTime(currentActionRef.current.time);
          }
        }
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      // Also trigger character load now that scene is ready
      setSelectedCharacter(prev => prev);
    };

    // Use ResizeObserver to detect when the container becomes visible and gets a real size
    const ro = new ResizeObserver(() => {
      if (initDoneRef.current) {
        // Already initialised → just resize
        const el = containerRef.current;
        if (!el || !cameraRef.current || !rendererRef.current) return;
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (w < 10 || h < 10) return;
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      } else {
        tryInit();
      }
    });
    ro.observe(containerRef.current);

    // Also attempt immediately in case it's already visible
    tryInit();

    return () => {
      ro.disconnect();
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (containerRef.current && rendererRef.current.domElement.parentNode === containerRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, []);

  // ── Load Character ──
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !initDoneRef.current) return;
    if (characterRef.current) { scene.remove(characterRef.current); characterRef.current = null; }
    meshMapRef.current.forEach(mesh => { if (mesh.parent) mesh.parent.remove(mesh); });
    meshMapRef.current.clear();
    setAttachedObjects([]);
    setSelectedObjectId(null);
    setIsLoaded(false);
    setAnimTime(0);
    setAnimDuration(0);
    setCurrentAnimName('');
    currentActionRef.current = null;

    const url = CHARACTER_URLS[selectedCharacter];
    new FBXLoader().load(url, async (fbx) => {
      fbx.scale.set(0.01, 0.01, 0.01);
      fbx.traverse(child => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
      const bones = [];
      fbx.traverse(child => { if (child.isBone) bones.push(child.name); });
      setBoneList(bones);
      characterRef.current = fbx;
      scene.add(fbx);

      const mixer = new THREE.AnimationMixer(fbx);
      mixerRef.current = mixer;

      const idleAnim = adminAnimations.find(a => (a.name || '').toLowerCase().trim() === 'idle');
      if (idleAnim) {
        const animFbx = await new FBXLoader().loadAsync(idleAnim.file_url);
        if (animFbx.animations.length > 0) {
          const clip = animFbx.animations[0];
          const action = mixer.clipAction(clip);
          action.play();
          currentActionRef.current = action;
          setAnimDuration(clip.duration);
          setCurrentAnimName(idleAnim.name);
          setIsPlaying(true);
        }
      }
      setIsLoaded(true);
    });
  }, [selectedCharacter, adminAnimations]);

  // ── Animation Controls ──
  const handlePlayAnimation = useCallback(() => {
    if (currentActionRef.current) {
      currentActionRef.current.paused = false;
      setIsPlaying(true);
    }
  }, []);

  const handlePauseAnimation = useCallback(() => {
    if (currentActionRef.current) {
      currentActionRef.current.paused = true;
      setIsPlaying(false);
    }
  }, []);

  const handleScrubAnimation = useCallback((time) => {
    if (currentActionRef.current && mixerRef.current) {
      currentActionRef.current.paused = true;
      currentActionRef.current.time = time;
      mixerRef.current.update(0);
      setAnimTime(time);
      setIsPlaying(false);
    }
  }, []);

  const handleSelectAnimation = useCallback(async (anim) => {
    if (!characterRef.current || !mixerRef.current) return;
    const mixer = mixerRef.current;
    mixer.stopAllAction();
    currentActionRef.current = null;

    const animFbx = await new FBXLoader().loadAsync(anim.file_url);
    if (animFbx.animations.length > 0) {
      const clip = animFbx.animations[0];
      const action = mixer.clipAction(clip);
      action.play();
      currentActionRef.current = action;
      setAnimDuration(clip.duration);
      setCurrentAnimName(anim.name);
      setAnimTime(0);
      setIsPlaying(true);
    }
  }, []);

  // ── Helpers ──
  const findBone = useCallback((boneName) => {
    if (!characterRef.current) return null;
    let found = null;
    characterRef.current.traverse(child => { if (child.isBone && child.name === boneName) found = child; });
    return found;
  }, []);

  const applyTransform = useCallback((mesh, obj) => {
    if (!mesh) return;
    mesh.scale.setScalar(obj.scale);
    mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
    mesh.rotation.set((obj.rotation.x * Math.PI) / 180, (obj.rotation.y * Math.PI) / 180, (obj.rotation.z * Math.PI) / 180);
    mesh.visible = obj.visible !== false;
  }, []);

  const loadAndAttach = useCallback((obj) => {
    if (!obj.url || !characterRef.current) return;
    const bone = findBone(obj.bone);
    if (!bone) return;
    const oldMesh = meshMapRef.current.get(obj.id);
    if (oldMesh && oldMesh.parent) oldMesh.parent.remove(oldMesh);

    const lower = obj.url.toLowerCase();
    const onLoaded = (mesh) => {
      applyTransform(mesh, obj);
      mesh.userData._attachId = obj.id;
      bone.add(mesh);
      meshMapRef.current.set(obj.id, mesh);
    };

    if (lower.endsWith('.glb') || lower.endsWith('.gltf')) {
      new GLTFLoader().load(obj.url, (gltf) => onLoaded(gltf.scene));
    } else if (lower.endsWith('.fbx')) {
      new FBXLoader().load(obj.url, (fbx) => onLoaded(fbx));
    }
  }, [findBone, applyTransform]);

  // ── Sync transforms ──
  useEffect(() => {
    attachedObjects.forEach(obj => {
      const mesh = meshMapRef.current.get(obj.id);
      if (mesh) applyTransform(mesh, obj);
    });
    if (selectedObjectId && gizmoRef.current) {
      const mesh = meshMapRef.current.get(selectedObjectId);
      if (mesh) {
        const wp = new THREE.Vector3();
        mesh.getWorldPosition(wp);
        positionGizmo(gizmoRef.current, wp);
      }
    }
  }, [attachedObjects, selectedObjectId, applyTransform]);

  // ── Add from Asset Picker ──
  const handleAssetSelected = useCallback((asset) => {
    const type = asset.type === 'effect' ? 'effect' : 'object';
    const defaults = DEFAULT_TRANSFORMS[type];
    const defaultBone = type === 'object' ? 'mixamorigRightHand' : 'mixamorigSpine2';
    const bone = boneList.includes(defaultBone) ? defaultBone : (boneList[0] || '');
    const obj = {
      id: newId(),
      type,
      label: asset.name || '',
      bone,
      url: asset.url || '',
      sourceId: asset.sourceId,
      sourceType: asset.sourceType,
      position: { ...defaults.position },
      rotation: { ...defaults.rotation },
      scale: defaults.scale,
      visible: true,
    };
    setAttachedObjects(prev => [...prev, obj]);
    setSelectedObjectId(obj.id);
    setPickerOpen(null);

    // Auto-load if URL is present
    if (obj.url) {
      setTimeout(() => loadAndAttach(obj), 100);
    }
  }, [boneList, loadAndAttach]);

  // ── Remove / Toggle / Update / ChangeBone / ChangeUrl / Reattach ──
  const handleRemoveObject = useCallback((id) => {
    const mesh = meshMapRef.current.get(id);
    if (mesh && mesh.parent) mesh.parent.remove(mesh);
    meshMapRef.current.delete(id);
    setAttachedObjects(prev => prev.filter(o => o.id !== id));
    if (selectedObjectId === id) { setSelectedObjectId(null); if (gizmoRef.current) hideGizmo(gizmoRef.current); }
  }, [selectedObjectId]);

  const handleToggleVisibility = useCallback((id) => {
    setAttachedObjects(prev => prev.map(o => o.id === id ? { ...o, visible: !o.visible } : o));
  }, []);

  const handleUpdateTransform = useCallback((id, updates) => {
    setAttachedObjects(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  }, []);

  const handleChangeBone = useCallback((id, newBone) => {
    const mesh = meshMapRef.current.get(id);
    if (mesh && mesh.parent) mesh.parent.remove(mesh);
    const bone = findBone(newBone);
    if (bone && mesh) bone.add(mesh);
    setAttachedObjects(prev => prev.map(o => o.id === id ? { ...o, bone: newBone } : o));
  }, [findBone]);

  const handleChangeUrl = useCallback((id, url) => {
    setAttachedObjects(prev => prev.map(o => o.id === id ? { ...o, url } : o));
  }, []);

  const handleReattach = useCallback((id) => {
    const obj = attachedObjects.find(o => o.id === id);
    if (obj) loadAndAttach(obj);
  }, [attachedObjects, loadAndAttach]);

  const handleSelectObject = useCallback((id) => {
    setSelectedObjectId(id);
    if (id && gizmoRef.current) {
      const mesh = meshMapRef.current.get(id);
      if (mesh) {
        const wp = new THREE.Vector3();
        mesh.getWorldPosition(wp);
        positionGizmo(gizmoRef.current, wp);
      }
    } else if (gizmoRef.current) { hideGizmo(gizmoRef.current); }
  }, []);

  // ── Viewport Interaction ──
  // Left-click drag = translate (move) on gizmo axes or free-move (X/Y screen-space)
  // Right-click drag = rotate 360° (Y from horizontal, X from vertical)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onPointerDown = (e) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

      const isRightClick = e.button === 2;
      const isLeftClick = e.button === 0;

      // Right-click on viewport with a selected object → start rotate drag
      if (isRightClick && selectedObjectId) {
        dragAxisRef.current = 'free';
        dragModeRef.current = 'rotate';
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        dragObjectIdRef.current = selectedObjectId;
        if (controlsRef.current) controlsRef.current.enabled = false;
        e.preventDefault();
        return;
      }

      if (!isLeftClick) return;

      // Left-click: check gizmo arrows first (translate only)
      if (gizmoRef.current?.visible) {
        const gizmoHits = getGizmoHitMeshes(gizmoRef.current);
        const intersects = raycasterRef.current.intersectObjects(gizmoHits, false);
        if (intersects.length > 0) {
          const hit = intersects[0].object.userData;
          if (hit.axis) {
            dragAxisRef.current = hit.axis;
            // Left-click on arrows = translate, on rings/center = translate too (rotation is right-click only now)
            dragModeRef.current = 'translate';
            dragStartRef.current = { x: e.clientX, y: e.clientY };
            dragObjectIdRef.current = selectedObjectId;
            if (controlsRef.current) controlsRef.current.enabled = false;
            return;
          }
        }
      }

      // Left-click on an attached mesh → select it
      const allMeshes = [];
      meshMapRef.current.forEach((mesh, id) => {
        mesh.traverse(child => { if (child.isMesh) { child.userData._attachId = id; allMeshes.push(child); } });
      });
      const intersects = raycasterRef.current.intersectObjects(allMeshes, false);
      if (intersects.length > 0) {
        let objId = null;
        let obj = intersects[0].object;
        while (obj) { if (obj.userData._attachId) { objId = obj.userData._attachId; break; } obj = obj.parent; }
        if (objId) handleSelectObject(objId);
      }
    };

    const onPointerMove = (e) => {
      if (!dragAxisRef.current || !dragObjectIdRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      if (dragModeRef.current === 'rotate') {
        // Full 360° rotation: horizontal mouse → Y rotation, vertical mouse → X rotation
        const rotSensitivity = 0.6;
        setAttachedObjects(prev => prev.map(o => {
          if (o.id !== dragObjectIdRef.current) return o;
          const rot = { ...o.rotation };
          const axis = dragAxisRef.current;
          if (axis === 'x') { rot.x += dy * rotSensitivity; }
          else if (axis === 'y') { rot.y += dx * rotSensitivity; }
          else if (axis === 'z') { rot.z += dx * rotSensitivity; }
          else {
            // free rotate (right-click anywhere)
            rot.y += dx * rotSensitivity;
            rot.x += dy * rotSensitivity;
          }
          return { ...o, rotation: rot };
        }));
      } else {
        // Translate: axis-constrained or free screen-space
        const posSensitivity = 0.15;
        setAttachedObjects(prev => prev.map(o => {
          if (o.id !== dragObjectIdRef.current) return o;
          const pos = { ...o.position };
          const axis = dragAxisRef.current;
          if (axis === 'x') pos.x += dx * posSensitivity;
          else if (axis === 'y') pos.y -= dy * posSensitivity;
          else if (axis === 'z') pos.z += dx * posSensitivity;
          else if (axis === 'free') {
            // Free translate: horizontal → X, vertical → Y
            pos.x += dx * posSensitivity;
            pos.y -= dy * posSensitivity;
          }
          return { ...o, position: pos };
        }));
      }
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      if (dragAxisRef.current) {
        dragAxisRef.current = null;
        dragModeRef.current = null;
        dragObjectIdRef.current = null;
        if (controlsRef.current) controlsRef.current.enabled = true;
      }
    };

    // Prevent browser context menu on right-click in viewport
    const onContextMenu = (e) => { e.preventDefault(); };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [selectedObjectId, handleSelectObject]);

  // ── Publish to ReactorBridge ──
  useEffect(() => {
    const effectObjects = attachedObjects.filter(o => o.type === 'effect');
    if (effectObjects.length > 0) {
      ReactorBridge.emit('attachmentEffectsUpdated', {
        effects: effectObjects.map(o => ({
          id: o.id, bone: o.bone, position: o.position, rotation: o.rotation,
          scale: o.scale, url: o.url, label: o.label, sourceId: o.sourceId, sourceType: o.sourceType,
        })),
        character: selectedCharacter,
        animationName: currentAnimName,
        animationTime: animTime,
        animationDuration: animDuration,
      });
    }
  }, [attachedObjects, selectedCharacter, currentAnimName, animTime, animDuration]);

  const editorState = {
    character: selectedCharacter,
    objectCount: attachedObjects.length,
    objects: attachedObjects.map(o => ({
      id: o.id, type: o.type, label: o.label, bone: o.bone,
      position: o.position, rotation: o.rotation, scale: o.scale,
      sourceType: o.sourceType, sourceId: o.sourceId,
    })),
    selectedObjectId,
    boneCount: boneList.length,
    isLoaded,
    currentAnimation: currentAnimName,
    animationTime: animTime,
    isPlaying,
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Move className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm">3D Attachment Editor</h2>
            <p className="text-slate-500 text-[10px]">Pick 3D objects & effects from your library • Play animations & position at exact frames • Linked to Reactor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Object.keys(CHARACTER_URLS).map(key => (
              <Button key={key} size="sm" variant={selectedCharacter === key ? 'default' : 'outline'}
                onClick={() => setSelectedCharacter(key)} className="h-7 text-[10px]">
                {key === 'c1' ? 'C1 (Erika)' : 'Y-Bot'}
              </Button>
            ))}
          </div>
          <Badge variant="outline" className="text-slate-500 text-[9px]">{attachedObjects.length} objects</Badge>
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
              chatOpen ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3 h-3" /> Director Chat
          </button>
        </div>
      </div>

      <div className="flex gap-3 flex-col" style={{ height: '680px' }}>
        <div className="flex gap-3 flex-1 min-h-0">
          {/* LEFT: Object Panel */}
          <div className="w-64 flex-shrink-0 bg-slate-950/50 border border-slate-800 rounded-xl p-3 overflow-hidden flex flex-col">
            <AttachmentObjectPanel
              objects={attachedObjects}
              selectedId={selectedObjectId}
              onSelect={handleSelectObject}
              onAddFromLibrary={(type) => setPickerOpen(type)}
              onRemove={handleRemoveObject}
              onToggleVisibility={handleToggleVisibility}
              onUpdateTransform={handleUpdateTransform}
              boneList={boneList}
              onChangeBone={handleChangeBone}
              onChangeUrl={handleChangeUrl}
              onReattach={handleReattach}
            />
          </div>

          {/* CENTER: 3D Viewport */}
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden border border-slate-700">
            <div ref={containerRef} className="flex-1 relative">
              {selectedObjectId && (
                <div className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded-lg bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 text-[9px] font-bold backdrop-blur-sm pointer-events-none">
                  Selected: {attachedObjects.find(o => o.id === selectedObjectId)?.label || selectedObjectId.slice(-6)}
                  &nbsp;— Arrows = move • Rings = rotate • Center = free rotate
                </div>
              )}
              {!isPlaying && currentAnimName && (
                <div className="absolute top-2 right-2 z-10 px-2.5 py-1 rounded-lg bg-amber-600/20 border border-amber-500/30 text-amber-300 text-[9px] font-bold backdrop-blur-sm pointer-events-none">
                  Paused at {animTime.toFixed(2)}s — Add effects at this frame
                </div>
              )}
            </div>
            {/* Animation Timeline */}
            <AnimationTimebar
              isPlaying={isPlaying}
              animTime={animTime}
              animDuration={animDuration}
              currentAnimName={currentAnimName}
              onPlay={handlePlayAnimation}
              onPause={handlePauseAnimation}
              onScrub={handleScrubAnimation}
              onSelectAnimation={handleSelectAnimation}
              animations={adminAnimations}
            />
          </div>

          {/* RIGHT: Director Chat */}
          {chatOpen && (
            <div className="w-80 flex-shrink-0 rounded-xl overflow-hidden border border-slate-700">
              <DirectorChat
                context="3D Attachment Editor"
                editorState={editorState}
                onTaskCompiled={(task) => {
                  ReactorBridge.emit('attachmentTaskCompiled', { task, editorState });
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Asset Picker Modal */}
      <AnimatePresence>
        {pickerOpen && (
          <AssetPickerModal
            type={pickerOpen}
            models3d={models3d}
            reactorFx={fxList}
            animations={adminAnimations}
            onSelect={handleAssetSelected}
            onClose={() => setPickerOpen(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}