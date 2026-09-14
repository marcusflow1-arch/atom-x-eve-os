import PlayerAvatarPreview from '@/components/onboarding/PlayerAvatarPreview';
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
import { attachGeneratedFaceToBody } from '@/components/onboarding/faceComposite';

const ROOT = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/';
const MP_ROOT = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/';
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
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [activeInvite, setActiveInvite] = useState(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const handleInvite = (event) => setActiveInvite(event.detail);
    window.addEventListener('incomingInvite', handleInvite);
    return () => {
      window.removeEventListener('incomingInvite', handleInvite);
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

  return (
    <div className={`pointer-events-auto flex items-start gap-3 relative ${isUiVisible ? 'h-full' : 'px-3 pt-3'}`} style={isUiVisible ? { width: '100%', height: '100%' } : {}}>
      <div className={`relative z-20 flex w-full gap-3 ${isUiVisible ? 'h-full' : ''}`}>
        <div className={`overflow-hidden flex-shrink-0 relative rounded-xl ${!isUiVisible ? 'cursor-pointer' : ''}`} style={{ background: 'transparent', border: 'none', boxShadow: 'none', width: isUiVisible ? '100%' : '150px', height: isUiVisible ? '100%' : '240px' }} onClick={!isUiVisible ? (event) => { event.stopPropagation(); if (onModelFocus) onModelFocus(); else window.dispatchEvent(new CustomEvent('toggleAvatarFocusMode')); } : undefined} role={!isUiVisible ? 'button' : undefined} tabIndex={!isUiVisible ? 0 : undefined} aria-label={!isUiVisible ? 'Open full avatar view' : undefined} onKeyDown={!isUiVisible ? (event) => { if (event.key !== 'Enter' && event.key !== ' ') return; event.preventDefault(); event.stopPropagation(); if (onModelFocus) onModelFocus(); else window.dispatchEvent(new CustomEvent('toggleAvatarFocusMode')); } : undefined}>
          <div className="w-full h-full relative z-0"><PlayerAvatarPreview controls="compact" interactive={isUiVisible}/></div>

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
