import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect';
import AvatarStatCard from './AvatarStatCard';
import { Mic, MicOff, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompanionIdentity } from '@/components/onboarding/CompanionIdentityContext';
import { companionModel, applyCompanionAppearance, getAvatarStylePreset } from '@/components/onboarding/genesisAssets';

const ROOT = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/';
const MP_ROOT = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/';
const YBOT_URL = ROOT + '608211a0f_YBot1.fbx';
const C1_URL = ROOT + '3f915913a_ErikaArcher.fbx';
const PREVIEW_AVATAR_URL = '/models/artemis.gltf';
const DASHBOARD_MOTIONS = [
  { name: 'Idle', url: ROOT + '9922e6dd0_Idle.fbx', loop: true },
  { name: 'Look Around', url: MP_ROOT + '3d7dec95f_standingidle02looking.fbx', loop: true },
  { name: 'Examine', url: MP_ROOT + 'a502d24a5_standingidle03examine.fbx', loop: true },
];

async function load3D(loaderFbx, loaderGltf, url) {
  return /\.(glb|gltf)(?:\?|$)/i.test(url) ? loaderGltf.loadAsync(url) : loaderFbx.loadAsync(url);
}

export default function Mini3DViewerBox({ isUiVisible = false, hostName, onModelFocus }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const mixerRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const animIdRef = useRef(null);
  const idleTimerRef = useRef(null);
  const isUiVisibleRef = useRef(isUiVisible);
  const lookTargetRef = useRef(new THREE.Vector3(0, 1.7, 0));
  const savedCompanion = useCompanionIdentity();
  const [activeChar, setActiveChar] = useState(savedCompanion?.gender === 'female' ? 'c1' : 'ybot');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [activeInvite, setActiveInvite] = useState(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const handleInvite = (event) => setActiveInvite(event.detail);
    const handleChar = (event) => setActiveChar(event.detail?.active || 'ybot');
    window.addEventListener('incomingInvite', handleInvite);
    window.addEventListener('characterSwitched', handleChar);
    return () => {
      window.removeEventListener('incomingInvite', handleInvite);
      window.removeEventListener('characterSwitched', handleChar);
    };
  }, []);

  useEffect(() => { isUiVisibleRef.current = isUiVisible; }, [isUiVisible]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== '`') return;
      setVoiceEnabled((value) => {
        const next = !value;
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
    if (!containerRef.current) return undefined;
    if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current.domElement?.remove();
      rendererRef.current = null;
    }

    const width = Math.max(1, containerRef.current.clientWidth);
    const height = Math.max(1, containerRef.current.clientHeight);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
    camera.position.set(0, 1.85, -1.4);
    camera.lookAt(0, 1.7, 0);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: false });
    } catch (error) {
      setWebglFailed(true);
      return undefined;
    }
    setWebglFailed(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const style = getAvatarStylePreset(savedCompanion?.style_preset);
    renderer.toneMappingExposure = style.exposure;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const outline = new OutlineEffect(renderer, {
      defaultThickness: style.outline,
      defaultColor: style.id === 'grounded_rpg' ? [0.06, 0.07, 0.09] : [0.015, 0.022, 0.04],
      defaultAlpha: style.id === 'grounded_rpg' ? .32 : .78,
      defaultKeepAlive: true,
    });

    scene.add(new THREE.HemisphereLight(0xdcecff, 0x18202d, 2.05));
    const key = new THREE.DirectionalLight(0xfff2e1, 3.1);
    key.position.set(2.5, 4, 2.2);
    key.castShadow = true;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x83aeda, 1.25);
    fill.position.set(-2.5, 2.2, 1.5);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0x66dcff, 2.4);
    rim.position.set(0, 2, -3.5);
    scene.add(rim);
    const face = new THREE.PointLight(0xffc4a0, 1.2, 4);
    face.position.set(.2, 2, -1.8);
    scene.add(face);

    const fbxLoader = new FBXLoader();
    const gltfLoader = new GLTFLoader();
    const modelUrl = savedCompanion ? companionModel(savedCompanion) : activeChar === 'ybot' ? YBOT_URL : C1_URL;
    let disposed = false;
    let model = null;
    let currentAction = null;
    let motionIndex = 0;
    let motionVersion = 0;

    const disposeAsset = (object) => object?.traverse?.((node) => {
      if (!node.isMesh) return;
      node.geometry?.dispose?.();
      (Array.isArray(node.material) ? node.material : [node.material]).filter(Boolean).forEach((material) => material.dispose?.());
    });

    const playMotion = async (motionDef) => {
      if (!model || !mixerRef.current || !motionDef?.url) return;
      const version = ++motionVersion;
      try {
        const asset = await load3D(fbxLoader, gltfLoader, motionDef.url);
        const animationRoot = asset.scene || asset;
        if (disposed || version !== motionVersion) { disposeAsset(animationRoot); return; }
        const clip = (asset.animations?.[0] || animationRoot.animations?.[0])?.clone?.();
        if (!clip) throw new Error('No clip');
        clip.tracks.forEach((track) => {
          if (/Hips\.position$/i.test(track.name) || /mixamorig:Hips\.position$/i.test(track.name)) {
            for (let index = 0; index < track.values.length; index += 3) {
              track.values[index] = track.values[0];
              track.values[index + 2] = track.values[2];
            }
          }
        });
        const next = mixerRef.current.clipAction(clip);
        next.setLoop(motionDef.loop === false ? THREE.LoopOnce : THREE.LoopRepeat, motionDef.loop === false ? 1 : Infinity);
        next.clampWhenFinished = motionDef.loop === false;
        currentAction?.fadeOut(.28);
        next.reset().fadeIn(.32).play();
        currentAction = next;
        if (animationRoot !== model) disposeAsset(animationRoot);
      } catch (error) {
        console.warn('Luna avatar motion unavailable:', motionDef.name);
      }
    };

    const scheduleIdle = () => {
      if (disposed) return;
      const delay = 6500 + Math.round(Math.random() * 6000);
      idleTimerRef.current = window.setTimeout(() => {
        motionIndex = (motionIndex + 1) % DASHBOARD_MOTIONS.length;
        playMotion(DASHBOARD_MOTIONS[motionIndex]);
        scheduleIdle();
      }, delay);
    };

    load3D(fbxLoader, gltfLoader, modelUrl).then((asset) => {
      if (disposed) return;
      model = asset.scene || asset;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 2 / maxDim;
      model.scale.setScalar(scale);
      const scaledBox = new THREE.Box3().setFromObject(model);
      const center = scaledBox.getCenter(new THREE.Vector3());
      model.position.set(-center.x, -scaledBox.min.y, -center.z);
      model.rotation.y = Math.PI;
      model.traverse((node) => {
        if (!node.isMesh) return;
        node.castShadow = true;
        node.receiveShadow = true;
        (Array.isArray(node.material) ? node.material : [node.material]).filter(Boolean).forEach((material) => {
          material.side = THREE.DoubleSide;
          if (typeof material.envMapIntensity === 'number') material.envMapIntensity = 1.2;
          material.needsUpdate = true;
        });
      });
      applyCompanionAppearance(model, savedCompanion || {});
      scene.add(model);
      mixerRef.current = new THREE.AnimationMixer(model);
      playMotion(DASHBOARD_MOTIONS[0]);
      scheduleIdle();
    }).catch((error) => {
      console.error('Luna avatar load failed:', error);
      setWebglFailed(true);
    });

    const animate = () => {
      animIdRef.current = requestAnimationFrame(animate);
      const delta = Math.min(clockRef.current.getDelta(), .05);
      mixerRef.current?.update(delta);
      const targetZ = isUiVisibleRef.current ? -4.5 : -1.4;
      const targetY = isUiVisibleRef.current ? 1 : 1.85;
      const targetLookY = isUiVisibleRef.current ? 1 : 1.7;
      camera.position.z += (targetZ - camera.position.z) * 0.05;
      camera.position.y += (targetY - camera.position.y) * 0.05;
      lookTargetRef.current.y += (targetLookY - lookTargetRef.current.y) * 0.05;
      camera.lookAt(lookTargetRef.current);
      outline.render(scene, camera);
    };
    clockRef.current = new THREE.Clock();
    animate();

    const resize = () => {
      if (!containerRef.current) return;
      const nextWidth = Math.max(1, containerRef.current.clientWidth);
      const nextHeight = Math.max(1, containerRef.current.clientHeight);
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
    };
    window.addEventListener('resize', resize);
    const observer = new ResizeObserver(resize);
    observer.observe(containerRef.current);

    return () => {
      disposed = true;
      motionVersion += 1;
      cancelAnimationFrame(animIdRef.current);
      clearTimeout(idleTimerRef.current);
      window.removeEventListener('resize', resize);
      observer.disconnect();
      mixerRef.current?.stopAllAction();
      disposeAsset(model);
      renderer.dispose();
      renderer.domElement?.remove();
      mixerRef.current = null;
    };
  }, [activeChar, savedCompanion]);

  return (
    <div className={`pointer-events-auto flex items-start gap-3 relative ${isUiVisible ? 'h-full' : 'px-3 pt-3'}`} style={isUiVisible ? { width: '100%', height: '100%' } : {}}>
      <div className={`relative z-20 flex w-full gap-3 ${isUiVisible ? 'h-full' : ''}`}>
        <div className={`overflow-hidden flex-shrink-0 relative rounded-xl ${!isUiVisible ? 'cursor-pointer' : ''}`} style={{ background: 'transparent', border: 'none', boxShadow: 'none', width: isUiVisible ? '100%' : '150px', height: isUiVisible ? '100%' : '240px' }} onClick={!isUiVisible ? (event) => { event.stopPropagation(); if (onModelFocus) onModelFocus(); else window.dispatchEvent(new CustomEvent('toggleAvatarFocusMode')); } : undefined} role={!isUiVisible ? 'button' : undefined} tabIndex={!isUiVisible ? 0 : undefined} aria-label={!isUiVisible ? 'Open full avatar view' : undefined} onKeyDown={!isUiVisible ? (event) => { if (event.key !== 'Enter' && event.key !== ' ') return; event.preventDefault(); event.stopPropagation(); if (onModelFocus) onModelFocus(); else window.dispatchEvent(new CustomEvent('toggleAvatarFocusMode')); } : undefined}>
          <div ref={containerRef} className="w-full h-full relative z-0">{webglFailed && <div className="absolute inset-0 flex items-center justify-center text-center p-4 text-white/50 text-xs">3D preview unavailable</div>}</div>

          {activeInvite && !isUiVisible && <div className="absolute bottom-2 left-2 right-2 z-30 flex items-center justify-between gap-2 px-1"><span className="text-[11px] text-white font-bold truncate">Join {activeInvite.fromUser?.friend_name} dashboard?</span><div className="flex items-center gap-2"><button onClick={(event) => { event.stopPropagation(); setActiveInvite(null); window.dispatchEvent(new CustomEvent('rejectInvite', { detail: { userId: activeInvite.fromUser?.id } })); }} className="text-red-500 hover:text-red-400" title="Decline"><X className="w-4 h-4" /></button><button onClick={(event) => { event.stopPropagation(); setActiveInvite(null); if (activeInvite.fromUser?.envUrl) window.dispatchEvent(new CustomEvent('changeEnvironment', { detail: { envUrl: activeInvite.fromUser.envUrl } })); window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', { detail: { channelId: `dashboard_${activeInvite.fromUser.id}`, hostId: activeInvite.fromUser.id, hostName: activeInvite.fromUser.friend_name || activeInvite.fromUser.name || 'Friend', socialJoin: true } })); }} className="text-green-500 hover:text-green-400" title="Accept"><Check className="w-4 h-4" /></button></div></div>}

          {hostName && !isUiVisible && !activeInvite && <div className="absolute top-2 left-2 z-20 bg-black/60 backdrop-blur-md rounded px-2 py-1.5 border border-white/10 flex items-start gap-1.5 shadow-lg pointer-events-none max-w-[150px]"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse flex-shrink-0 mt-[3px]" /><div><span className="text-[9px] font-bold text-white uppercase tracking-wider truncate block">{hostName.toLowerCase() === 'my' ? 'My' : hostName}</span><span className="text-[7px] text-white/60 uppercase tracking-wider">Dashboard</span></div></div>}

          {!isUiVisible && <button type="button" className="absolute top-2 right-2 z-20 bg-black/40 rounded-full p-1 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors" onClick={(event) => { event.stopPropagation(); setVoiceEnabled((value) => { const next = !value; window.dispatchEvent(new CustomEvent('toggleDashboardMic', { detail: { enabled: next } })); return next; }); }} aria-label="Toggle dashboard microphone">{voiceEnabled ? <Mic className="w-3.5 h-3.5 text-green-400" /> : <MicOff className="w-3.5 h-3.5 text-red-400/80" />}</button>}
        </div>
        {!isUiVisible && <div onClick={(event) => event.stopPropagation()}><AvatarStatCard /></div>}
      </div>

      {createPortal(<AnimatePresence>{activeInvite && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 drop-shadow-xl"><span className="text-sm text-white font-bold">Join {activeInvite.fromUser?.friend_name} dashboard?</span><button onClick={() => { setActiveInvite(null); window.dispatchEvent(new CustomEvent('rejectInvite', { detail: { userId: activeInvite.fromUser?.id } })); }} className="text-red-500"><X className="w-6 h-6" /></button><button onClick={() => { setActiveInvite(null); if (activeInvite.fromUser?.envUrl) window.dispatchEvent(new CustomEvent('changeEnvironment', { detail: { envUrl: activeInvite.fromUser.envUrl } })); window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', { detail: { channelId: `dashboard_${activeInvite.fromUser.id}`, hostId: activeInvite.fromUser.id, hostName: activeInvite.fromUser.friend_name || activeInvite.fromUser.name || 'Friend', socialJoin: true } })); }} className="text-green-500"><Check className="w-6 h-6" /></button></motion.div>}</AnimatePresence>, document.body)}
    </div>
  );
}
