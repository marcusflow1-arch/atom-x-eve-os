import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import AvatarStatCard from './AvatarStatCard';
import { Mic, MicOff, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const YBOT_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/608211a0f_YBot1.fbx';
const C1_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/3f915913a_ErikaArcher.fbx';
const IDLE_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/9922e6dd0_Idle.fbx';

export default function Mini3DViewerBox({ isUiVisible = false, hostName }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const mixerRef = useRef(null);
  const modelRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const animIdRef = useRef(null);
  const [activeChar, setActiveChar] = useState(localStorage.getItem('luna_active_character') || 'ybot');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [activeInvite, setActiveInvite] = useState(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
     const handleInvite = (e) => setActiveInvite(e.detail);
     window.addEventListener('incomingInvite', handleInvite);
     return () => window.removeEventListener('incomingInvite', handleInvite);
  }, []);
  const isUiVisibleRef = useRef(isUiVisible);
  const lookTargetRef = useRef(new THREE.Vector3(0, 1.7, 0));

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '`') {
        setVoiceEnabled(v => {
          const newState = !v;
          window.dispatchEvent(new CustomEvent('toggleDashboardMic', { detail: { enabled: newState } }));
          return newState;
        });
      }
    };
    const handleMicDisabled = () => setVoiceEnabled(false);
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('dashboardMicDisabled', handleMicDisabled);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('dashboardMicDisabled', handleMicDisabled);
    };
  }, []);

  useEffect(() => {
    isUiVisibleRef.current = isUiVisible;
  }, [isUiVisible]);

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

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power', failIfMajorPerformanceCaveat: false });
    } catch (err) {
      console.warn('[Mini3DViewerBox] WebGL context unavailable, falling back to 2D placeholder:', err?.message);
      setWebglFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // Handle context loss gracefully (browser may evict contexts under pressure)
    const canvas = renderer.domElement;
    const onContextLost = (e) => {
      e.preventDefault();
      console.warn('[Mini3DViewerBox] WebGL context lost');
      setWebglFailed(true);
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
    canvas.addEventListener('webglcontextlost', onContextLost, false);

    containerRef.current.appendChild(canvas);
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

      if (cameraRef.current) {
         const targetZ = isUiVisibleRef.current ? -4.5 : -1.4;
         const targetY = isUiVisibleRef.current ? 1.0 : 1.85;
         const targetLookY = isUiVisibleRef.current ? 1.0 : 1.7;

         cameraRef.current.position.z += (targetZ - cameraRef.current.position.z) * 0.05;
         cameraRef.current.position.y += (targetY - cameraRef.current.position.y) * 0.05;
         
         lookTargetRef.current.y += (targetLookY - lookTargetRef.current.y) * 0.05;
         cameraRef.current.lookAt(lookTargetRef.current);
      }

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

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(animIdRef.current);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [activeChar]);

  return (
    <div 
      className={`pointer-events-auto flex items-start gap-3 cursor-pointer transition-transform relative ${isUiVisible ? 'h-full' : 'px-3 pt-3'}`}
      onClick={() => {
        if (!isUiVisible) window.dispatchEvent(new CustomEvent('toggleAvatarFocusMode'));
      }}
      style={isUiVisible ? { width: '100%', height: '100%' } : {}}
    >
      {/* Pages Container */}
      <div className={`relative z-20 flex w-full gap-3 ${isUiVisible ? 'h-full' : ''}`}>
        {/* 3D Viewer - Left Page */}
        <div
          className={`overflow-hidden flex-shrink-0 transition-all duration-500 relative rounded-xl`}
          style={isUiVisible ? {
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            width: '100%',
            height: '100%',
          } : {
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            width: '150px',
            height: '240px',
          }}
        >
          <div ref={containerRef} className="w-full h-full relative z-0">
            {webglFailed && (
              <div className="absolute inset-0 flex items-center justify-center text-center p-4 text-white/50 text-xs">
                <span>3D preview unavailable</span>
              </div>
            )}
          </div>
        
        {/* Incoming Invite Notification */}
        {activeInvite && !isUiVisible && (
          <div className="absolute bottom-2 left-2 right-2 z-30 flex items-center justify-between gap-2 px-1">
            <span className="text-[11px] text-white font-bold drop-shadow-md truncate">
              Join {activeInvite.fromUser?.friend_name} dashboard?
            </span>
            <div className="flex items-center gap-2 flex-shrink-0 drop-shadow-md">
              <button 
                onClick={(e) => {
                   e.stopPropagation();
                   setActiveInvite(null);
                   window.dispatchEvent(new CustomEvent('rejectInvite', { detail: { userId: activeInvite.fromUser?.id } }));
                }}
                className="text-red-500 hover:text-red-400 flex justify-center items-center transition-colors"
                title="Decline"
              >
                <X className="w-4 h-4" strokeWidth={3} />
              </button>
              <button 
                onClick={(e) => {
                   e.stopPropagation();
                   setActiveInvite(null);
                   if (activeInvite.fromUser?.envUrl) {
                      window.dispatchEvent(new CustomEvent('changeEnvironment', { detail: { envUrl: activeInvite.fromUser.envUrl } }));
                   }
                   window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', { detail: { channelId: `world_instance_${activeInvite.fromUser.id}`, hostId: activeInvite.fromUser.id } }));
                }}
                className="text-green-500 hover:text-green-400 flex justify-center items-center transition-colors"
                title="Accept"
              >
                <Check className="w-4 h-4" strokeWidth={3} />
              </button>
            </div>
          </div>
        )}

        {/* Host Name Badge */}
        {hostName && !isUiVisible && !activeInvite && (
          <div className="absolute top-2 left-2 z-20 bg-black/60 backdrop-blur-md rounded px-2 py-1.5 border border-white/10 flex items-start gap-1.5 shadow-lg pointer-events-none max-w-[150px]">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse flex-shrink-0 mt-[3px]" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-white uppercase tracking-wider truncate leading-tight">
                {hostName.toLowerCase() === 'my' ? 'My' : hostName}
              </span>
              <span className="text-[7px] text-white/60 uppercase tracking-wider leading-none mt-0.5">
                Dashboard
              </span>
            </div>
          </div>
        )}

        {/* Voice Chat Icon */}
        {!isUiVisible && (
          <div 
            className="absolute top-2 right-2 z-20 bg-black/40 rounded-full p-1 border border-white/10 backdrop-blur-md cursor-pointer hover:bg-white/10 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setVoiceEnabled(v => {
                const newState = !v;
                window.dispatchEvent(new CustomEvent('toggleDashboardMic', { detail: { enabled: newState } }));
                return newState;
              });
            }}
          >
             {voiceEnabled ? (
               <Mic className="w-3.5 h-3.5 text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]" />
             ) : (
               <MicOff className="w-3.5 h-3.5 text-red-400/80" />
             )}
          </div>
        )}
      </div>

      {/* Avatar Stats Card */}
      {!isUiVisible && <AvatarStatCard />}
      </div>

      {/* Global Bottom-Right Invite Notification */}
      {createPortal(
        <AnimatePresence>
          {activeInvite && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 drop-shadow-xl"
            >
              <span className="text-sm text-white font-bold drop-shadow-md">
                Join {activeInvite.fromUser?.friend_name} dashboard?
              </span>
              <div className="flex items-center gap-3 drop-shadow-md">
                <button 
                  onClick={() => {
                    setActiveInvite(null);
                    window.dispatchEvent(new CustomEvent('rejectInvite', { detail: { userId: activeInvite.fromUser?.id } }));
                  }}
                  className="text-red-500 hover:text-red-400 transition-colors"
                  title="Decline"
                >
                  <X className="w-6 h-6" strokeWidth={3} />
                </button>
                <button 
                  onClick={() => {
                    setActiveInvite(null);
                    if (activeInvite.fromUser?.envUrl) {
                      window.dispatchEvent(new CustomEvent('changeEnvironment', { detail: { envUrl: activeInvite.fromUser.envUrl } }));
                    }
                    window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', { detail: { channelId: `world_instance_${activeInvite.fromUser.id}`, hostId: activeInvite.fromUser.id } }));
                  }}
                  className="text-green-500 hover:text-green-400 transition-colors"
                  title="Accept"
                >
                  <Check className="w-6 h-6" strokeWidth={3} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}