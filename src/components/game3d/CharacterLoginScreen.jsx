import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { motion } from 'framer-motion';
import { ChevronDown, Plus, MoreHorizontal, MessageSquare, Settings, Power, Loader2 } from 'lucide-react';

const ARCHER_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/3f915913a_ErikaArcher.fbx';
const IDLE_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/9922e6dd0_Idle.fbx';

/**
 * CharacterLoginScreen — Mirrors the "Select Character" screen from New World.
 * Renders the female archer (ErikaArcher) facing the camera with an idle animation,
 * and exposes a PLAY button that calls onPlay() to enter the game world.
 */
export default function CharacterLoginScreen({ onPlay }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [selectedCharIdx, setSelectedCharIdx] = useState(0);

  const characters = [
    { name: 'Erika', region: 'Maramma', level: 65 },
    { name: 'Belghast', region: 'Valhalla', level: 60 },
  ];

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(32, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 1.4, -6.5);
    camera.lookAt(0, 1.1, 0);

    // Lighting — cinematic 3-point
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xfff4e0, 2.4);
    key.position.set(2, 4, -2);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xa5c8ff, 1.0);
    fill.position.set(-3, 2, -1);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffeebb, 2.0);
    rim.position.set(0, 2, 3);
    scene.add(rim);

    let mixer;
    const clock = new THREE.Clock();
    const loader = new FBXLoader();

    loader.load(ARCHER_URL, (fbx) => {
      const box = new THREE.Box3().setFromObject(fbx);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2.6 / maxDim;
      fbx.scale.setScalar(scale);

      const center = box.getCenter(new THREE.Vector3());
      fbx.position.sub(center.multiplyScalar(scale));
      fbx.position.y += (size.y * scale) / 2;

      // Face the camera
      fbx.rotation.y = Math.PI;

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
      mixer = new THREE.AnimationMixer(fbx);

      loader.load(IDLE_URL, (idleFbx) => {
        if (idleFbx.animations?.length > 0) {
          mixer.clipAction(idleFbx.animations[0]).play();
        }
        setLoading(false);
      }, undefined, () => setLoading(false));
    }, undefined, (err) => {
      console.error('Archer load error:', err);
      setLoading(false);
    });

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Press ENTER to play
    const onKey = (e) => {
      if (e.key === 'Enter') onPlay?.();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKey);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [onPlay]);

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Background scene — gradient + decorative fantasy bg */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 80% 20%, rgba(255, 180, 200, 0.25) 0%, transparent 50%),
            radial-gradient(ellipse at 20% 80%, rgba(100, 200, 220, 0.2) 0%, transparent 50%),
            linear-gradient(135deg, #1a2438 0%, #2d3a52 30%, #4a4068 70%, #2d3a52 100%)
          `,
        }}
      />

      {/* Decorative atmospheric particles */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              opacity: 0.3 + Math.random() * 0.5,
              animation: `float-particle ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
      `}</style>

      {/* 3D character viewport */}
      <div ref={containerRef} className="absolute inset-0" />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-12 h-12 text-cyan-300 animate-spin" />
        </div>
      )}

      {/* TOP-LEFT: ESC + Title */}
      <div className="absolute top-6 left-8 flex items-center gap-4 z-10">
        <div className="px-2 py-1 rounded border border-white/30 text-white/80 text-xs font-bold tracking-wider">
          ESC
        </div>
        <h1 className="text-white text-2xl font-light tracking-[0.3em] uppercase drop-shadow-lg">
          Select Character
        </h1>
      </div>

      {/* TOP-RIGHT: Action icons */}
      <div className="absolute top-6 right-8 flex items-center gap-3 z-10">
        {[MessageSquare, Settings, Power].map((Icon, i) => (
          <button
            key={i}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all"
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* LEFT PANEL: Region + Characters */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="absolute left-8 top-1/2 -translate-y-1/2 w-[320px] z-10"
      >
        <div
          className="rounded-lg overflow-hidden"
          style={{
            background: 'rgba(20, 35, 55, 0.85)',
            backdropFilter: 'blur(20px) saturate(160%)',
            border: '1px solid rgba(120, 180, 220, 0.25)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          {/* Region selector */}
          <div className="p-4 border-b border-white/10">
            <div className="text-[10px] text-white/50 font-bold tracking-[0.2em] uppercase mb-2">Region</div>
            <button className="w-full flex items-center justify-between px-3 py-2 rounded bg-black/30 border border-white/10 hover:border-cyan-400/40 transition-all">
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="w-3 h-[2px] bg-cyan-300" />
                  <span className="w-3 h-[2px] bg-cyan-300/70" />
                  <span className="w-3 h-[2px] bg-cyan-300/40" />
                </div>
                <span className="text-white text-sm font-medium">US East</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-xs">2/3</span>
                <ChevronDown className="w-4 h-4 text-white/60" />
              </div>
            </button>
          </div>

          {/* Characters */}
          <div className="p-4">
            <div className="text-[10px] text-white/50 font-bold tracking-[0.2em] uppercase mb-3">Characters</div>
            <div className="space-y-2">
              {characters.map((char, idx) => {
                const isSelected = selectedCharIdx === idx;
                return (
                  <button
                    key={char.name}
                    onClick={() => setSelectedCharIdx(idx)}
                    className={`w-full flex items-center gap-3 p-3 rounded transition-all ${
                      isSelected
                        ? 'bg-cyan-500/10 border border-cyan-400/40'
                        : 'bg-black/20 border border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${
                        isSelected ? 'bg-cyan-500/30 border border-cyan-300/50' : 'bg-white/10 border border-white/15'
                      }`}
                    >
                      {char.level}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-white font-bold text-base">{char.name}</div>
                      <div className="text-white/50 text-xs">{char.region}</div>
                    </div>
                    <MoreHorizontal className="w-4 h-4 text-white/40" />
                  </button>
                );
              })}

              <button className="w-full flex items-center justify-center gap-2 p-3 rounded border border-dashed border-white/20 hover:border-white/40 text-white/60 hover:text-white text-sm transition-all">
                <Plus className="w-4 h-4" />
                <span className="underline underline-offset-2">Create Character</span>
              </button>
            </div>
          </div>
        </div>

        {/* World buttons */}
        <div className="flex gap-2 mt-4">
          <button className="flex-1 px-4 py-2.5 rounded bg-black/40 border border-white/15 text-white/80 hover:text-white hover:bg-black/60 text-sm transition-all">
            View Worlds
          </button>
          <button className="flex-1 px-4 py-2.5 rounded bg-black/40 border border-white/15 text-white/80 hover:text-white hover:bg-black/60 text-sm transition-all">
            Refresh
          </button>
        </div>
      </motion.div>

      {/* BOTTOM-RIGHT: World + PLAY */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="absolute bottom-8 right-8 w-[280px] z-10 space-y-3"
      >
        <button className="w-full flex items-center gap-2 px-4 py-3 rounded bg-black/40 backdrop-blur-md border border-white/15 text-white/80 text-sm hover:bg-black/60 transition-all">
          <div className="w-4 h-4 rounded-full border border-white/40 flex items-center justify-center text-[10px] text-white/60">?</div>
          <span>Nightveil Hallow</span>
        </button>

        <motion.button
          onClick={onPlay}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 rounded text-white font-bold text-xl tracking-[0.3em] uppercase relative overflow-hidden group"
          style={{
            background: 'linear-gradient(180deg, rgba(40, 100, 140, 0.7) 0%, rgba(20, 60, 100, 0.9) 100%)',
            border: '1px solid rgba(120, 200, 240, 0.5)',
            boxShadow: '0 0 30px rgba(100, 200, 240, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        >
          <span
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: 'linear-gradient(180deg, rgba(100, 220, 255, 0.3) 0%, rgba(40, 120, 180, 0.5) 100%)',
            }}
          />
          <span className="relative z-10 drop-shadow-lg">PLAY</span>
        </motion.button>
      </motion.div>
    </div>
  );
}