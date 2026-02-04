import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { useAuth } from '../auth/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react'; // Added for loading state

export default function AvatarPanel({ 
  compact = false, 
  glbBaseUrl = 'https://cdn.base44.io/avatars/' 
}) {
  const mountRef = useRef(null);
  
  // Refs to store Three.js instances so they persist across renders
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const mixerRef = useRef(null);
  const modelRef = useRef(null);
  const frameIdRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const { user, avatar } = useAuth();
  
  const displayName = user?.username || user?.full_name || 'Player';
  const level = avatar?.level || 1;
  const experience = avatar?.experience || 0;
  const maxExp = level * 100;

  // 1. INITIAL SETUP (Runs once)
  useEffect(() => {
    if (!mountRef.current) return;
    
    // Setup
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.4, 2.8); // Slightly adjusted for better framing

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(2, 5, 5);
    scene.add(ambientLight);
    scene.add(dirLight);

    // Store refs
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Handle Resize
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Clean up entire scene on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameIdRef.current);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      // Dispose renderer
      renderer.dispose();
    };
  }, []);

  // 2. MODEL LOADING (Runs when avatar changes)
  useEffect(() => {
    if (!sceneRef.current) return;

    setIsLoading(true);
    const loader = new GLTFLoader();
    const avatarUrl = avatar?.model_url || `${glbBaseUrl}base_humanoid.glb`;

    // Helper: Clean up previous model resources to prevent memory leaks
    if (modelRef.current) {
      sceneRef.current.remove(modelRef.current);
      modelRef.current.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose();
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      });
      modelRef.current = null;
    }

    loader.load(
      avatarUrl,
      (gltf) => {
        const model = gltf.scene;
        model.position.set(0, -1, 0); // Center model
        sceneRef.current.add(model);
        modelRef.current = model;

        // Setup Mixer
        if (gltf.animations.length) {
          mixerRef.current = new THREE.AnimationMixer(model);
          const clip = gltf.animations.find(a => a.name.toLowerCase().includes('idle')) || gltf.animations[0];
          if(clip) mixerRef.current.clipAction(clip).play();
        }

        setIsLoading(false);
      },
      undefined,
      (err) => {
        console.warn("Using fallback avatar due to:", err);
        const fallback = createFallbackAvatar(); // Defined below
        sceneRef.current.add(fallback);
        modelRef.current = fallback;
        setIsLoading(false);
      }
    );
  }, [avatar?.model_url, glbBaseUrl]);

  // 3. ANIMATION LOOP & INTERACTION
  useEffect(() => {
    const clock = new THREE.Clock();
    
    // Mouse interaction state
    let isDragging = false;
    let prevX = 0;

    const onMouseDown = (e) => { isDragging = true; prevX = e.clientX; };
    const onMouseUp = () => { isDragging = false; };
    const onMouseMove = (e) => {
      if (!isDragging || !modelRef.current) return;
      const delta = e.clientX - prevX;
      modelRef.current.rotation.y += delta * 0.005;
      prevX = e.clientX;
    };

    if(mountRef.current) {
        mountRef.current.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mouseup', onMouseUp); // Window ensures drag releases even if cursor leaves div
        window.addEventListener('mousemove', onMouseMove);
    }

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      
      const delta = clock.getDelta();
      if (mixerRef.current) mixerRef.current.update(delta);
      
      // Fallback rotation if no mixer
      if (modelRef.current && !mixerRef.current) {
          modelRef.current.rotation.y += 0.005;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(frameIdRef.current);
      if(mountRef.current) mountRef.current.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  // --- RENDERING ---

  const Container = compact ? 'div' : 'div'; // You can swap tags if needed

  return (
    <div className={`${compact ? 'relative w-full h-64' : 'flex gap-6 p-6'} bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden`}>
      
      {/* 3D Mount Point */}
      <div 
        ref={mountRef} 
        className={`${compact ? 'w-full h-full' : 'w-96 h-80'} bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl relative cursor-move`}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900/50">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        )}
      </div>

      {/* UI Overlay (Compact Mode) */}
      {compact && (
        <div className="absolute bottom-4 left-4 right-4 pointer-events-none select-none">
          <div className="bg-black/60 backdrop-blur-md rounded-lg p-3 border border-white/10">
            <h3 className="text-white font-bold text-lg shadow-black drop-shadow-md">{displayName}</h3>
            
            <div className="flex items-center justify-between mt-2">
              <Badge variant="secondary" className="bg-blue-600/30 text-blue-300 border-blue-500/50">
                Lvl {level}
              </Badge>
              <span className="text-xs text-slate-300 font-mono">{experience}/{maxExp} XP</span>
            </div>
            
            <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                style={{ width: `${Math.min((experience / maxExp) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* UI Side Panel (Full Mode) */}
      {!compact && (
        <div className="flex-1 text-white py-2">
           <h3 className="text-3xl font-bold">{displayName}</h3>
           <p className="text-slate-400 mt-1">Level {level} Explorer</p>
           {/* Add Full mode specific stats or controls here */}
        </div>
      )}
    </div>
  );
}

// Helper: Fallback Geometry
function createFallbackAvatar() {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x4169e1, roughness: 0.3 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), mat);
    head.position.y = 1.5;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.1, 1, 8), mat);
    body.position.y = 0.8;
    group.add(head, body);
    group.position.y = -1;
    return group;
}