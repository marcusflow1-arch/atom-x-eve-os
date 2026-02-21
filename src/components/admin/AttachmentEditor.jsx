import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Move, MessageSquare, Save, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DirectorChat from './DirectorChat';
import AttachmentObjectPanel from './attachment/AttachmentObjectPanel';
import { createGizmo, getGizmoHitMeshes, positionGizmo, hideGizmo } from './attachment/TransformGizmo';
import ReactorBridge from './reactor/ReactorBridge';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const DEFAULT_TRANSFORMS = {
  weapon: { position: { x: 0, y: 5, z: 0 }, rotation: { x: 90, y: 180, z: 0 }, scale: 50 },
  effect: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: 30 },
  prop:   { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: 50 },
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

  // Multi-object state: each object = { id, type, label, bone, url, position, rotation, scale, visible, _mesh }
  const [attachedObjects, setAttachedObjects] = useState([]);
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  const meshMapRef = useRef(new Map()); // id → THREE.Object3D

  const [selectedCharacter, setSelectedCharacter] = useState('c1');
  const [boneList, setBoneList] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Drag state for gizmo
  const dragAxisRef = useRef(null);
  const dragStartRef = useRef(null);
  const dragObjectIdRef = useRef(null);

  const { data: adminAnimations = [] } = useQuery({
    queryKey: ['adminAnimations-att'],
    queryFn: () => base44.entities.AnimationFBX.list(),
    staleTime: Infinity,
  });

  const { data: fxList = [] } = useQuery({
    queryKey: ['reactorFX-att'],
    queryFn: () => base44.entities.ReactorFX.list('-created_date', 50),
    staleTime: 60000,
  });

  // ── Three.js Scene Setup ──
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x12141a);
    sceneRef.current = scene;

    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.01, 100);
    camera.position.set(0, 1, 3);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    containerRef.current.appendChild(renderer.domElement);
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

    // Gizmo
    const gizmo = createGizmo();
    scene.add(gizmo);
    gizmoRef.current = gizmo;

    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      if (mixerRef.current) mixerRef.current.update(delta);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // ── Load Character ──
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (characterRef.current) {
      scene.remove(characterRef.current);
      characterRef.current = null;
    }
    // Clear all attached meshes from the scene
    meshMapRef.current.forEach(mesh => {
      if (mesh.parent) mesh.parent.remove(mesh);
    });
    meshMapRef.current.clear();
    setAttachedObjects([]);
    setSelectedObjectId(null);
    setIsLoaded(false);

    const url = CHARACTER_URLS[selectedCharacter];
    new FBXLoader().load(url, async (fbx) => {
      fbx.scale.set(0.01, 0.01, 0.01);
      fbx.position.set(0, 0, 0);
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
        if (animFbx.animations.length > 0) mixer.clipAction(animFbx.animations[0]).play();
      }
      setIsLoaded(true);
    });
  }, [selectedCharacter, adminAnimations]);

  // ── Find Bone Helper ──
  const findBone = useCallback((boneName) => {
    if (!characterRef.current) return null;
    let found = null;
    characterRef.current.traverse(child => {
      if (child.isBone && child.name === boneName) found = child;
    });
    return found;
  }, []);

  // ── Apply transform to a mesh ──
  const applyTransform = useCallback((mesh, obj) => {
    if (!mesh) return;
    mesh.scale.setScalar(obj.scale);
    mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
    mesh.rotation.set(
      (obj.rotation.x * Math.PI) / 180,
      (obj.rotation.y * Math.PI) / 180,
      (obj.rotation.z * Math.PI) / 180
    );
    mesh.visible = obj.visible !== false;
  }, []);

  // ── Load a model and attach to bone ──
  const loadAndAttach = useCallback((obj) => {
    if (!obj.url || !characterRef.current) return;
    const bone = findBone(obj.bone);
    if (!bone) return;

    // Remove old mesh if exists
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

  // ── Sync transforms when state changes ──
  useEffect(() => {
    attachedObjects.forEach(obj => {
      const mesh = meshMapRef.current.get(obj.id);
      if (mesh) applyTransform(mesh, obj);
    });
    // Update gizmo position for selected object
    if (selectedObjectId && gizmoRef.current) {
      const mesh = meshMapRef.current.get(selectedObjectId);
      if (mesh) {
        const wp = new THREE.Vector3();
        mesh.getWorldPosition(wp);
        positionGizmo(gizmoRef.current, wp);
      }
    }
  }, [attachedObjects, selectedObjectId, applyTransform]);

  // ── Add Object ──
  const handleAddObject = useCallback((type) => {
    const defaults = DEFAULT_TRANSFORMS[type] || DEFAULT_TRANSFORMS.prop;
    const defaultBone = type === 'weapon' ? 'mixamorigRightHand' : type === 'effect' ? 'mixamorigSpine2' : 'mixamorigHips';
    const bone = boneList.includes(defaultBone) ? defaultBone : (boneList[0] || '');
    const obj = {
      id: newId(),
      type,
      label: '',
      bone,
      url: '',
      position: { ...defaults.position },
      rotation: { ...defaults.rotation },
      scale: defaults.scale,
      visible: true,
    };
    setAttachedObjects(prev => [...prev, obj]);
    setSelectedObjectId(obj.id);
  }, [boneList]);

  // ── Remove Object ──
  const handleRemoveObject = useCallback((id) => {
    const mesh = meshMapRef.current.get(id);
    if (mesh && mesh.parent) mesh.parent.remove(mesh);
    meshMapRef.current.delete(id);
    setAttachedObjects(prev => prev.filter(o => o.id !== id));
    if (selectedObjectId === id) {
      setSelectedObjectId(null);
      if (gizmoRef.current) hideGizmo(gizmoRef.current);
    }
  }, [selectedObjectId]);

  // ── Toggle Visibility ──
  const handleToggleVisibility = useCallback((id) => {
    setAttachedObjects(prev => prev.map(o => o.id === id ? { ...o, visible: !o.visible } : o));
  }, []);

  // ── Update Transform ──
  const handleUpdateTransform = useCallback((id, updates) => {
    setAttachedObjects(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  }, []);

  // ── Change Bone ──
  const handleChangeBone = useCallback((id, newBone) => {
    const mesh = meshMapRef.current.get(id);
    if (mesh && mesh.parent) mesh.parent.remove(mesh);
    const bone = findBone(newBone);
    if (bone && mesh) bone.add(mesh);
    setAttachedObjects(prev => prev.map(o => o.id === id ? { ...o, bone: newBone } : o));
  }, [findBone]);

  // ── Change URL ──
  const handleChangeUrl = useCallback((id, url) => {
    setAttachedObjects(prev => prev.map(o => o.id === id ? { ...o, url } : o));
  }, []);

  // ── Reattach (reload model) ──
  const handleReattach = useCallback((id) => {
    const obj = attachedObjects.find(o => o.id === id);
    if (obj) loadAndAttach(obj);
  }, [attachedObjects, loadAndAttach]);

  // ── Select Object ──
  const handleSelectObject = useCallback((id) => {
    setSelectedObjectId(id);
    if (id && gizmoRef.current) {
      const mesh = meshMapRef.current.get(id);
      if (mesh) {
        const wp = new THREE.Vector3();
        mesh.getWorldPosition(wp);
        positionGizmo(gizmoRef.current, wp);
      }
    } else if (gizmoRef.current) {
      hideGizmo(gizmoRef.current);
    }
  }, []);

  // ── Viewport Click: Select object or gizmo axis ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onPointerDown = (e) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

      // Check gizmo first
      if (gizmoRef.current?.visible) {
        const gizmoHits = getGizmoHitMeshes(gizmoRef.current);
        const intersects = raycasterRef.current.intersectObjects(gizmoHits, false);
        if (intersects.length > 0) {
          const axis = intersects[0].object.userData.axis;
          if (axis) {
            dragAxisRef.current = axis;
            dragStartRef.current = { x: e.clientX, y: e.clientY };
            dragObjectIdRef.current = selectedObjectId;
            if (controlsRef.current) controlsRef.current.enabled = false;
            return;
          }
        }
      }

      // Check attached objects
      const allMeshes = [];
      meshMapRef.current.forEach((mesh, id) => {
        mesh.traverse(child => {
          if (child.isMesh) {
            child.userData._attachId = id;
            allMeshes.push(child);
          }
        });
      });

      const intersects = raycasterRef.current.intersectObjects(allMeshes, false);
      if (intersects.length > 0) {
        let objId = null;
        let obj = intersects[0].object;
        while (obj) {
          if (obj.userData._attachId) { objId = obj.userData._attachId; break; }
          obj = obj.parent;
        }
        if (objId) handleSelectObject(objId);
      }
    };

    const onPointerMove = (e) => {
      if (!dragAxisRef.current || !dragObjectIdRef.current) return;

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const sensitivity = 0.15;

      setAttachedObjects(prev => prev.map(o => {
        if (o.id !== dragObjectIdRef.current) return o;
        const pos = { ...o.position };
        if (dragAxisRef.current === 'x') pos.x += dx * sensitivity;
        if (dragAxisRef.current === 'y') pos.y -= dy * sensitivity;
        if (dragAxisRef.current === 'z') pos.z += dx * sensitivity;
        return { ...o, position: pos };
      }));

      dragStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      if (dragAxisRef.current) {
        dragAxisRef.current = null;
        dragObjectIdRef.current = null;
        if (controlsRef.current) controlsRef.current.enabled = true;
      }
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [selectedObjectId, handleSelectObject]);

  // ── Publish state to ReactorBridge ──
  useEffect(() => {
    const effectObjects = attachedObjects.filter(o => o.type === 'effect');
    if (effectObjects.length > 0) {
      ReactorBridge.emit('attachmentEffectsUpdated', {
        effects: effectObjects.map(o => ({
          id: o.id,
          bone: o.bone,
          position: o.position,
          rotation: o.rotation,
          scale: o.scale,
          url: o.url,
          label: o.label,
        })),
        character: selectedCharacter,
      });
    }
  }, [attachedObjects, selectedCharacter]);

  // Build editor state for Director Chat
  const editorState = {
    character: selectedCharacter,
    objectCount: attachedObjects.length,
    objects: attachedObjects.map(o => ({ id: o.id, type: o.type, label: o.label, bone: o.bone, position: o.position, rotation: o.rotation, scale: o.scale })),
    selectedObjectId,
    boneCount: boneList.length,
    isLoaded,
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
            <p className="text-slate-500 text-[10px]">Attach weapons, effects & props • Click objects for gizmo • Linked to Reactor Editor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Character Selector */}
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

      <div className="flex gap-3" style={{ height: '620px' }}>
        {/* LEFT: Object Panel */}
        <div className="w-64 flex-shrink-0 bg-slate-950/50 border border-slate-800 rounded-xl p-3 overflow-hidden flex flex-col">
          <AttachmentObjectPanel
            objects={attachedObjects}
            selectedId={selectedObjectId}
            onSelect={handleSelectObject}
            onAdd={handleAddObject}
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
        <div ref={containerRef} className="flex-1 rounded-xl overflow-hidden border border-slate-700 relative">
          {/* Selection indicator */}
          {selectedObjectId && (
            <div className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded-lg bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 text-[9px] font-bold backdrop-blur-sm pointer-events-none">
              Selected: {attachedObjects.find(o => o.id === selectedObjectId)?.label || selectedObjectId.slice(-6)}
              &nbsp;— Drag gizmo axes to move
            </div>
          )}
        </div>

        {/* RIGHT: Director Chat (if open) */}
        {chatOpen && (
          <div className="w-80 flex-shrink-0 rounded-xl overflow-hidden border border-slate-700">
            <DirectorChat
              context="3D Attachment Editor"
              editorState={editorState}
              onTaskCompiled={(task) => {
                console.log('[AttachmentEditor] Task compiled:', task);
                // Forward to ReactorBridge so the Reactor Editor can pick it up
                ReactorBridge.emit('attachmentTaskCompiled', { task, editorState });
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}