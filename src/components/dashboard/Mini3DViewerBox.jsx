import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import AvatarStatCard from './AvatarStatCard';
import { Mic, MicOff, Check, X } from 'lucide-react';

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
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
      className="pointer-events-auto flex items-start gap-0 h-full cursor-pointer transition-transform hover:scale-[1.02] relative"
      onClick={() => {
        if (!isUiVisible) window.dispatchEvent(new CustomEvent('toggleAvatarFocusMode'));
      }}
      style={isUiVisible ? { width: '100%', height: '100%' } : {}}
    >
      {/* 3D Viewer - Original Size */}
      <div
        className="rounded-2xl overflow-hidden flex-shrink-0 transition-all duration-500 relative"
        style={isUiVisible ? {
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          width: '100%',
          height: '100%',
        } : {
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.05)',
          width: '200px',
          height: '280px',
        }}
      >
        <div ref={containerRef} className="w-full h-full" />
        
        {/* Incoming Invite Notification */}
        {activeInvite && !isUiVisible && (
          <div className="absolute top-2 left-2 right-2 z-30 bg-black/80 rounded-lg p-2 border border-cyan-500/50 backdrop-blur-xl flex flex-col gap-1.5 shadow-2xl">
            <div className="flex items-start gap-1.5">
               <div className="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">!</div>
               <span className="text-[10px] text-white font-bold leading-tight break-words">Join {activeInvite.fromUser?.friend_name}'s Luna?</span>
            </div>
            <div className="flex justify-between gap-1.5 mt-1">
              <button 
                onClick={(e) => {
                   e.stopPropagation();
                   setActiveInvite(null);
                   window.dispatchEvent(new CustomEvent('rejectInvite', { detail: { userId: activeInvite.fromUser?.id } }));
                }}
                className="flex-1 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/40 text-[10px] font-bold border border-red-500/30 transition-colors flex justify-center items-center"
                title="Decline"
              >
                <X className="w-3.5 h-3.5" />
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
                className="flex-1 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/40 text-[10px] font-bold border border-green-500/30 transition-colors flex justify-center items-center"
                title="Accept"
              >
                <Check className="w-3.5 h-3.5" />
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

        {isUiVisible && (
          <button 
            className="absolute top-4 right-4 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center gap-2 border border-white/20 z-10 transition-colors text-white text-xs font-bold uppercase tracking-wider"
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'i' }));
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
        )}
      </div>

      {/* Avatar Stats Card */}
      {!isUiVisible && <AvatarStatCard />}
    </div>
  );
}