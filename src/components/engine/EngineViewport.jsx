import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Grid3x3, Sun, Box, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EngineViewport({ onSceneReady }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [objectCount, setObjectCount] = useState(0);
  const clockRef = useRef(new THREE.Clock());
  const mixersRef = useRef([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.FogExp2(0x1a1a2e, 0.015);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.set(5, 4, 8);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1;
    controls.maxDistance = 100;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Grid
    const grid = new THREE.GridHelper(50, 50, 0x444466, 0x222244);
    grid.name = 'grid';
    scene.add(grid);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404070, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(10, 15, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x6688cc, 0.5);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(50, 50);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1e1e3a, roughness: 0.9 });
    const ground = groundGeo ? new THREE.Mesh(groundGeo, groundMat) : null;
    if (ground) {
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      ground.name = 'ground';
      scene.add(ground);
    }

    // Starter cube
    const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
    const cubeMat = new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.3, metalness: 0.5 });
    const cube = new THREE.Mesh(cubeGeo, cubeMat);
    cube.position.set(0, 0.5, 0);
    cube.castShadow = true;
    cube.name = 'StarterCube';
    scene.add(cube);
    setObjectCount(1);

    // Expose scene API
    if (onSceneReady) {
      onSceneReady({
        scene,
        camera,
        renderer,
        addModel: async (url, options = {}) => {
          const lower = url.toLowerCase();
          let obj;
          try {
            if (lower.endsWith('.glb') || lower.endsWith('.gltf')) {
              const gltf = await new GLTFLoader().loadAsync(url);
              obj = gltf.scene;
              if (gltf.animations?.length > 0) {
                const mixer = new THREE.AnimationMixer(obj);
                gltf.animations.forEach(clip => mixer.clipAction(clip).play());
                mixersRef.current.push(mixer);
              }
            } else if (lower.endsWith('.fbx')) {
              obj = await new FBXLoader().loadAsync(url);
              if (obj.animations?.length > 0) {
                const mixer = new THREE.AnimationMixer(obj);
                obj.animations.forEach(clip => mixer.clipAction(clip).play());
                mixersRef.current.push(mixer);
              }
            }
            if (obj) {
              // Apply options
              if (options.position) obj.position.set(options.position.x, options.position.y, options.position.z);
              if (options.scale) obj.scale.set(options.scale.x, options.scale.y, options.scale.z);
              else {
                 // Auto-scale default if not provided
                const box = new THREE.Box3().setFromObject(obj);
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                if (maxDim > 0) obj.scale.setScalar(3 / maxDim);
              }
              
              if (options.animation_url) {
                 const animLoader = new FBXLoader();
                 const animObj = await animLoader.loadAsync(options.animation_url);
                 if (animObj.animations.length > 0) {
                    const mixer = new THREE.AnimationMixer(obj);
                    const action = mixer.clipAction(animObj.animations[0]);
                    action.play();
                    mixersRef.current.push(mixer);
                 }
              }

              obj.traverse(child => {
                if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
              });
              scene.add(obj);
              setObjectCount(c => c + 1);
            }
          } catch(e) { console.error("Failed to load model", e); }
        },
        addPrimitive: (type, options = {}) => {
          let geo;
          switch(type) {
            case 'cube': geo = new THREE.BoxGeometry(1, 1, 1); break;
            case 'sphere': geo = new THREE.SphereGeometry(0.5, 32, 32); break;
            case 'cylinder': geo = new THREE.CylinderGeometry(0.5, 0.5, 1, 32); break;
            case 'plane': geo = new THREE.PlaneGeometry(10, 10); break; // Larger default plane
            default: geo = new THREE.BoxGeometry(1, 1, 1);
          }
          const color = options.color || (Math.random() * 0xffffff);
          const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.3 });
          const mesh = new THREE.Mesh(geo, mat);
          
          if (options.position) mesh.position.set(options.position.x, options.position.y, options.position.z);
          else mesh.position.set((Math.random() - 0.5) * 6, 0.5, (Math.random() - 0.5) * 6);
          
          if (options.scale) mesh.scale.set(options.scale.x, options.scale.y, options.scale.z);

          if (type === 'plane') {
             mesh.rotation.x = -Math.PI / 2;
             mesh.receiveShadow = true;
          } else {
             mesh.castShadow = true;
             mesh.receiveShadow = true;
          }

          mesh.name = type + '_' + Date.now();
          scene.add(mesh);
          setObjectCount(c => c + 1);
        }
      });
    }

    // Animate
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      controls.update();
      mixersRef.current.forEach(m => m.update(delta));
      // Rotate starter cube gently
      if (cube) cube.rotation.y += delta * 0.3;
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
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  const toggleGrid = () => {
    const grid = sceneRef.current?.getObjectByName('grid');
    if (grid) grid.visible = !grid.visible;
    setShowGrid(!showGrid);
  };

  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(5, 4, 8);
      controlsRef.current.target.set(0, 0, 0);
    }
  };

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-white/10" style={{ background: '#1a1a2e' }}>
      <div ref={containerRef} className="w-full h-full" />

      {/* Viewport Toolbar */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5">
        <Button size="sm" variant="ghost" onClick={() => setIsPlaying(!isPlaying)} className="h-7 px-2 bg-black/40 backdrop-blur-md border border-white/10 text-white/80 hover:text-white">
          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </Button>
        <Button size="sm" variant="ghost" onClick={toggleGrid} className={`h-7 px-2 bg-black/40 backdrop-blur-md border border-white/10 ${showGrid ? 'text-cyan-400' : 'text-white/40'}`}>
          <Grid3x3 className="w-3 h-3" />
        </Button>
        <Button size="sm" variant="ghost" onClick={resetCamera} className="h-7 px-2 bg-black/40 backdrop-blur-md border border-white/10 text-white/80">
          <RotateCcw className="w-3 h-3" />
        </Button>
      </div>

      {/* Status */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <div className="px-2 py-1 rounded bg-black/50 backdrop-blur-md border border-white/10 text-[10px] text-white/60 font-mono">
          {objectCount} objects
        </div>
        <div className="px-2 py-1 rounded bg-black/50 backdrop-blur-md border border-white/10 text-[10px] text-emerald-400 font-mono flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </div>
      </div>
    </div>
  );
}