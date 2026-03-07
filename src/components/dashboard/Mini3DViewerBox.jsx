import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Monitor, Shirt, Zap } from 'lucide-react';
import AvatarStatCard from './AvatarStatCard';

const YBOT_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/608211a0f_YBot1.fbx';
const C1_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/3f915913a_ErikaArcher.fbx';
const IDLE_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/9922e6dd0_Idle.fbx';

export default function Mini3DViewerBox() {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const mixerRef = useRef(null);
  const modelRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const animIdRef = useRef(null);
  const [activeChar, setActiveChar] = useState(localStorage.getItem('luna_active_character') || 'ybot');
  const [showSettings, setShowSettings] = useState(false);
  const [resolution, setResolution] = useState('High');
  const [showClothes, setShowClothes] = useState(true);
  const [performanceMode, setPerformanceMode] = useState(false);

  useEffect(() => {
    const handleOpen = () => setShowSettings(true);
    window.addEventListener('openAvatarSettings', handleOpen);
    return () => window.removeEventListener('openAvatarSettings', handleOpen);
  }, []);

  useEffect(() => {
    if (!rendererRef.current) return;
    const ratio = resolution === 'High' ? Math.min(window.devicePixelRatio, 2) : resolution === 'Medium' ? 1 : 0.5;
    rendererRef.current.setPixelRatio(ratio);
  }, [resolution]);

  // Listen for character switch events from the main 3D viewer
  useEffect(() => {
    const handler = (e) => setActiveChar(e.detail.active);
    window.addEventListener('characterSwitched', handler);
    return () => window.removeEventListener('characterSwitched', handler);
  }, []);

  // Rebuild the mini 3D scene whenever activeChar changes
  useEffect(() => {
    if (!containerRef.current) return;

    // Cleanup previous scene
    if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current.domElement?.remove();
      rendererRef.current = null;
    }

    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 100);
    camera.position.set(0, 1.85, -1.4);
    camera.lookAt(0, 1.7, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(2, 3, 2);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
    fillLight.position.set(-2, 2, -1);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.5);
    rimLight.position.set(0, 1.5, -3);
    scene.add(rimLight);

    const modelUrl = activeChar === 'ybot' ? YBOT_URL : C1_URL;
    let mixer = null;
    const loader = new FBXLoader();
    clockRef.current = new THREE.Clock();

    loader.load(modelUrl, (fbx) => {
      // Auto-scale
      const box = new THREE.Box3().setFromObject(fbx);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim;
      fbx.scale.setScalar(scale);

      const center = box.getCenter(new THREE.Vector3());
      fbx.position.sub(center.multiplyScalar(scale));
      fbx.position.y += (size.y * scale) / 2;

      // Face the camera
      fbx.rotation.y = Math.PI;

      // Fix materials
      fbx.traverse((node) => {
        if (node.isMesh && node.material) {
          const mats = Array.isArray(node.material) ? node.material : [node.material];
          mats.forEach(mat => {
            mat.side = THREE.DoubleSide;
            mat.envMapIntensity = 1.2;
            mat.needsUpdate = true;
          });
        }
      });

      scene.add(fbx);
      modelRef.current = fbx;
      mixer = new THREE.AnimationMixer(fbx);
      mixerRef.current = mixer;

      // Load idle animation
      loader.load(IDLE_URL, (idleFbx) => {
        if (idleFbx.animations && idleFbx.animations.length > 0) {
          const clip = idleFbx.animations[0];
          mixer.clipAction(clip).play();
        }
      });
    });

    // Render loop
    const animate = () => {
      animIdRef.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      if (mixerRef.current) mixerRef.current.update(delta);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const nw = containerRef.current.clientWidth;
      const nh = containerRef.current.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animIdRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [activeChar]);

  return (
    <div className="pointer-events-auto flex items-start gap-0 h-full">
      {/* 3D Viewer - Original Size */}
      <div
        className="rounded-2xl overflow-hidden flex-shrink-0 h-full"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.05)',
          width: '200px',
        }}
      >
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Avatar Stats Card */}
      <AvatarStatCard />
    </div>
  );
}