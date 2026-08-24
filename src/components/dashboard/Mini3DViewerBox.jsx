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
  const mixerRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const animIdRef = useRef(null);
  const isUiVisibleRef = useRef(isUiVisible);
  const lookTargetRef = useRef(new THREE.Vector3(0, 1.7, 0));
  const [activeChar, setActiveChar] = useState(localStorage.getItem('luna_active_character') || 'ybot');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [activeInvite, setActiveInvite] = useState(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const handleInvite = (e) => setActiveInvite(e.detail);
    const handleChar = (e) => setActiveChar(e.detail?.active || 'ybot');
    window.addEventListener('incomingInvite', handleInvite);
    window.addEventListener('characterSwitched', handleChar);
    return () => {
      window.removeEventListener('incomingInvite', handleInvite);
      window.removeEventListener('characterSwitched', handleChar);
    };
  }, []);

  useEffect(() => { isUiVisibleRef.current = isUiVisible; }, [isUiVisible]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '`') return;
      setVoiceEnabled(v => {
        const next = !v;
        window.dispatchEvent(new CustomEvent('toggleDashboardMic', { detail: { enabled: next } }));
        return next;
      });
    };
    const onDisabled = () => setVoiceEnabled(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('dashboardMicDisabled', onDisabled);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('dashboardMicDisabled', onDisabled);
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current.domElement?.remove();
      rendererRef.current = null;
    }

    const w = Math.max(1, containerRef.current.clientWidth);
    const h = Math.max(1, containerRef.current.clientHeight);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 100);
    camera.position.set(0, 1.85, -1.4);
    camera.lookAt(0, 1.7, 0);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power', failIfMajorPerformanceCaveat: false });
    } catch (err) {
      setWebglFailed(true);
      return;
    }
    setWebglFailed(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 2);
    key.position.set(2, 3, 2);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 1);
    fill.position.set(-2, 2, -1);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 1.5);
    rim.position.set(0, 1.5, -3);
    scene.add(rim);

    const loader = new FBXLoader();
    const modelUrl = activeChar === 'ybot' ? YBOT_URL : C1_URL;
    loader.load(modelUrl, (fbx) => {
      const box = new THREE.Box3().setFromObject(fbx);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim;
      fbx.scale.setScalar(scale);
      const center = box.getCenter(new THREE.Vector3());
      fbx.position.sub(center.multiplyScalar(scale));
      fbx.position.y += (size.y * scale) / 2;
      fbx.rotation.y = Math.PI;
      fbx.traverse(node => {
        if (node.isMesh && node.material) {
          const mats = Array.isArray(node.material) ? node.material : [node.material];
          mats.forEach(mat => { mat.side = THREE.DoubleSide; mat.envMapIntensity = 1.2; mat.needsUpdate = true; });
        }
      });
      scene.add(fbx);
      const mixer = new THREE.AnimationMixer(fbx);
      mixerRef.current = mixer;
      loader.load(IDLE_URL, idle => {
        if (idle.animations?.length) mixer.clipAction(idle.animations[0]).play();
      });
    });

    const animate = () => {
      animIdRef.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      if (mixerRef.current) mixerRef.current.update(delta);
      const targetZ = isUiVisibleRef.current ? -4.5 : -1.4;
      const targetY = isUiVisibleRef.current ? 1 : 1.85;
      const targetLookY = isUiVisibleRef.current ? 1 : 1.7;
      camera.position.z += (targetZ - camera.position.z) * 0.05;
      camera.position.y += (targetY - camera.position.y) * 0.05;
      lookTargetRef.current.y += (targetLookY - lookTargetRef.current.y) * 0.05;
      camera.lookAt(lookTargetRef.current);
      renderer.render(scene, camera);
    };
    clockRef.current = new THREE.Clock();
    animate();

    const resize = () => {
      if (!containerRef.current) return;
      const nw = Math.max(1, containerRef.current.clientWidth);
      const nh = Math.max(1, containerRef.current.clientHeight);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', resize);
    const observer = new ResizeObserver(resize);
    observer.observe(containerRef.current);
    return () => {
      cancelAnimationFrame(animIdRef.current);
      window.removeEventListener('resize', resize);
      observer.disconnect();
      renderer.dispose();
      renderer.domElement?.remove();
      mixerRef.current = null;
    };
  }, [activeChar]);

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 relative ${isUiVisible ? 'h-full' : 'px-3 pt-3'}`}
      style={isUiVisible ? { width: '100%', height: '100%' } : {}}
      // Intentionally no click handler here: clicking the avatar/viewer must never hide or replace dashboard UI.
    >
      <div className={`relative z-20 flex w-full gap-3 ${isUiVisible ? 'h-full' : ''}`}>
        <div
          className="overflow-hidden flex-shrink-0 relative rounded-xl"
          style={{ background: 'transparent', border: 'none', boxShadow: 'none', width: isUiVisible ? '100%' : '150px', height: isUiVisible ? '100%' : '240px' }}
        >
          <div ref={containerRef} className="w-full h-full relative z-0">
            {webglFailed && <div className="absolute inset-0 flex items-center justify-center text-center p-4 text-white/50 text-xs">3D preview unavailable</div>}
          </div>

          {activeInvite && !isUiVisible && (
            <div className="absolute bottom-2 left-2 right-2 z-30 flex items-center justify-between gap-2 px-1">
              <span className="text-[11px] text-white font-bold truncate">Join {activeInvite.fromUser?.friend_name} dashboard?</span>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); setActiveInvite(null); window.dispatchEvent(new CustomEvent('rejectInvite', { detail: { userId: activeInvite.fromUser?.id } })); }} className="text-red-500 hover:text-red-400" title="Decline"><X className="w-4 h-4" /></button>
                <button onClick={(e) => { e.stopPropagation(); setActiveInvite(null); if (activeInvite.fromUser?.envUrl) window.dispatchEvent(new CustomEvent('changeEnvironment', { detail: { envUrl: activeInvite.fromUser.envUrl } })); window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', { detail: { channelId: `world_instance_${activeInvite.fromUser.id}`, hostId: activeInvite.fromUser.id } })); }} className="text-green-500 hover:text-green-400" title="Accept"><Check className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          {hostName && !isUiVisible && !activeInvite && (
            <div className="absolute top-2 left-2 z-20 bg-black/60 backdrop-blur-md rounded px-2 py-1.5 border border-white/10 flex items-start gap-1.5 shadow-lg pointer-events-none max-w-[150px]">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse flex-shrink-0 mt-[3px]" />
              <div><span className="text-[9px] font-bold text-white uppercase tracking-wider truncate block">{hostName.toLowerCase() === 'my' ? 'My' : hostName}</span><span className="text-[7px] text-white/60 uppercase tracking-wider">Dashboard</span></div>
            </div>
          )}

          {!isUiVisible && (
            <button
              type="button"
              className="absolute top-2 right-2 z-20 bg-black/40 rounded-full p-1 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors"
              onClick={(e) => { e.stopPropagation(); setVoiceEnabled(v => { const next = !v; window.dispatchEvent(new CustomEvent('toggleDashboardMic', { detail: { enabled: next } })); return next; }); }}
              aria-label="Toggle dashboard microphone"
            >
              {voiceEnabled ? <Mic className="w-3.5 h-3.5 text-green-400" /> : <MicOff className="w-3.5 h-3.5 text-red-400/80" />}
            </button>
          )}
        </div>

        {!isUiVisible && <div onClick={(e) => e.stopPropagation()}><AvatarStatCard /></div>}
      </div>

      {createPortal(
        <AnimatePresence>
          {activeInvite && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 drop-shadow-xl">
              <span className="text-sm text-white font-bold">Join {activeInvite.fromUser?.friend_name} dashboard?</span>
              <button onClick={() => { setActiveInvite(null); window.dispatchEvent(new CustomEvent('rejectInvite', { detail: { userId: activeInvite.fromUser?.id } })); }} className="text-red-500"><X className="w-6 h-6" /></button>
              <button onClick={() => { setActiveInvite(null); if (activeInvite.fromUser?.envUrl) window.dispatchEvent(new CustomEvent('changeEnvironment', { detail: { envUrl: activeInvite.fromUser.envUrl } })); window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', { detail: { channelId: `world_instance_${activeInvite.fromUser.id}`, hostId: activeInvite.fromUser.id } })); }} className="text-green-500"><Check className="w-6 h-6" /></button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
