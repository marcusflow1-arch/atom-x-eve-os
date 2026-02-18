import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Badge } from '@/components/ui/badge';

const VIEW_PRESETS = {
  perspective: { pos: [0, 1.5, 4], label: 'Perspective' },
  front: { pos: [0, 1.2, 5], label: 'Front' },
  side: { pos: [5, 1.2, 0], label: 'Side' },
  top: { pos: [0, 6, 0.01], label: 'Top' },
};

const ReactorViewport = forwardRef(({ modelUrl, selectedBone, reactors = [], onBoneClick }, ref) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const modelRef = useRef(null);
  const mixerRef = useRef(null);
  const boneHelpersRef = useRef([]);
  const reactorMeshesRef = useRef([]);
  const [viewMode, setViewMode] = useState('perspective');
  const [bones, setBones] = useState([]);
  const [loading, setLoading] = useState(true);

  useImperativeHandle(ref, () => ({
    getBones: () => bones,
    setView: (mode) => setViewMode(mode),
  }));

  useEffect(() => {
    if (!containerRef.current || !modelUrl) return;
    setLoading(true);

    const container = containerRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e14);
    sceneRef.current = scene;

    // Grid
    const grid = new THREE.GridHelper(20, 20, 0x1a1f2e, 0x111827);
    scene.add(grid);

    // Camera
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
    const vp = VIEW_PRESETS[viewMode];
    camera.position.set(...vp.pos);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1, 0);
    controlsRef.current = controls;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(3, 5, 4);
    scene.add(dir);
    const back = new THREE.DirectionalLight(0x4488ff, 0.4);
    back.position.set(-3, 3, -4);
    scene.add(back);

    // Load model
    const isFbx = modelUrl.toLowerCase().includes('.fbx');
    const loader = isFbx ? new FBXLoader() : new GLTFLoader();
    loader.load(modelUrl, (asset) => {
      const model = isFbx ? asset : asset.scene;
      
      // Scale and center
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

      // Extract bones
      const foundBones = [];
      model.traverse((node) => {
        if (node.isBone) {
          foundBones.push(node.name);
        }
      });
      setBones(foundBones);

      // Skeleton helper
      const skeletonHelper = new THREE.SkeletonHelper(model);
      skeletonHelper.material.linewidth = 2;
      scene.add(skeletonHelper);

      // Animation
      const anims = isFbx ? asset.animations : asset.animations;
      if (anims?.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        mixer.clipAction(anims[0]).play();
        mixerRef.current = mixer;
      }

      setLoading(false);
    }, undefined, () => setLoading(false));

    // Render loop
    const clock = new THREE.Clock();
    let reqId;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (mixerRef.current) mixerRef.current.update(delta);
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
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [modelUrl]);

  // Update camera on view mode change
  useEffect(() => {
    if (!cameraRef.current) return;
    const vp = VIEW_PRESETS[viewMode];
    cameraRef.current.position.set(...vp.pos);
    controlsRef.current?.target.set(0, 1, 0);
    controlsRef.current?.update();
  }, [viewMode]);

  // Update reactor visualization spheres
  useEffect(() => {
    if (!sceneRef.current || !modelRef.current) return;

    // Remove old reactor meshes
    reactorMeshesRef.current.forEach(m => sceneRef.current.remove(m));
    reactorMeshesRef.current = [];

    // Add reactor spheres at bone positions
    reactors.forEach(r => {
      let targetBone = null;
      modelRef.current.traverse(node => {
        if (node.isBone && node.name === r.bone_name) targetBone = node;
      });
      if (!targetBone) return;

      const geo = new THREE.SphereGeometry(r.collider_radius * 0.1, 16, 16);
      const color = r.damage_type === 'lightning' ? 0x4488ff : r.damage_type === 'fire' ? 0xff4400 : r.damage_type === 'energy' ? 0xffcc00 : 0x00ffcc;
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, wireframe: true });
      const mesh = new THREE.Mesh(geo, mat);

      const worldPos = new THREE.Vector3();
      targetBone.getWorldPosition(worldPos);
      const offset = r.collider_offset || { x: 0, y: 0, z: 0 };
      mesh.position.set(worldPos.x + offset.x * 0.1, worldPos.y + offset.y * 0.1, worldPos.z + offset.z * 0.1);

      sceneRef.current.add(mesh);
      reactorMeshesRef.current.push(mesh);
    });

    // Highlight selected bone
    if (selectedBone && modelRef.current) {
      let bone = null;
      modelRef.current.traverse(node => {
        if (node.isBone && node.name === selectedBone) bone = node;
      });
      if (bone) {
        const geo = new THREE.SphereGeometry(0.06, 12, 12);
        const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 });
        const marker = new THREE.Mesh(geo, mat);
        const wp = new THREE.Vector3();
        bone.getWorldPosition(wp);
        marker.position.copy(wp);
        sceneRef.current.add(marker);
        reactorMeshesRef.current.push(marker);
      }
    }
  }, [reactors, selectedBone]);

  return (
    <div className="relative w-full h-full min-h-[400px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
      <div ref={containerRef} className="w-full h-full" />

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

      {/* Bone count */}
      <div className="absolute top-3 right-3">
        <Badge className="bg-slate-900/80 text-slate-400 text-[9px]">{bones.length} bones</Badge>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 rounded text-[9px] text-slate-500">
        LMB: Rotate • RMB: Pan • Scroll: Zoom
      </div>
    </div>
  );
});

ReactorViewport.displayName = 'ReactorViewport';
export default ReactorViewport;