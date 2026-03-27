import React, { useState, useRef, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Camera, ChevronRight, ChevronLeft, Check, Mic, Volume2,
  User, Shirt, Palette, Sparkles, RefreshCw, Upload, Wand2,
  ArrowRight, Star, Zap
} from 'lucide-react';
import AvatarCreator3DViewer from '@/components/characterCreation/AvatarCreator3DViewer';
import CharacterCustomizerPanel from '@/components/characterCreation/CharacterCustomizerPanel';

const STEPS = [
  { id: 'base', label: 'Character', icon: User },
  { id: 'style', label: 'Style', icon: Shirt },
  { id: 'voice', label: 'Voice', icon: Mic },
  { id: 'name', label: 'Name', icon: Star },
];

export default function CharacterCreation() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [avatarConfig, setAvatarConfig] = useState({
    preset: 'atlas',
    gender: 'male',
    skinTone: '#c8956c',
    hairColor: '#1a1a1a',
    eyeColor: '#4a90d9',
    outfit: 'cyberpunk_casual',
    voiceType: 'deep_calm',
    name: '',
  });
  const [cameraPermission, setCameraPermission] = useState(null); // null | 'granted' | 'denied'
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const handleFinish = () => {
    setIsFinishing(true);
    localStorage.setItem('atom_eve_avatar_config', JSON.stringify(avatarConfig));
    localStorage.setItem('atom_eve_character_created', 'true');
    setTimeout(() => {
      navigate(createPageUrl('OnboardingHome'));
    }, 1200);
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(s => s + 1);
    else handleFinish();
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  const requestCamera = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermission('granted');
      setShowCameraModal(true);
    } catch {
      setCameraPermission('denied');
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden" style={{
      background: 'radial-gradient(ellipse at 20% 50%, #0d1a2e 0%, #070b12 40%, #0a0f1a 100%)',
    }}>
      {/* Ambient texture grain */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />

      {/* Top lip-gloss shine */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <span className="text-white font-black text-xl tracking-[0.2em]" style={{
            background: 'linear-gradient(135deg, #fff 0%, #a5c8ff 50%, #c4b5fd 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
          }}>ATOM×EVE</span>
          <span className="text-white/20 text-xs font-medium tracking-widest uppercase">// Character Creation</span>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-2">
          {STEPS.map((step, i) => (
            <button key={step.id} onClick={() => setCurrentStep(i)} className="flex items-center gap-1.5 group">
              <div className={`transition-all duration-300 rounded-full flex items-center justify-center ${
                i === currentStep
                  ? 'w-8 h-2 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]'
                  : i < currentStep
                  ? 'w-2 h-2 bg-white/60'
                  : 'w-2 h-2 bg-white/20'
              }`} />
            </button>
          ))}
        </div>

        <button
          onClick={() => { localStorage.setItem('atom_eve_character_created', 'skipped'); navigate(createPageUrl('OnboardingHome')); }}
          className="text-white/30 hover:text-white/60 text-sm transition-colors tracking-wider"
        >
          Skip →
        </button>
      </div>

      {/* Main Layout: Left 3D | Divider | Right Panel */}
      <div className="flex h-full pt-16">

        {/* LEFT: 3D Viewer */}
        <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">
          {/* Top label */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10"
            style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-white/50 text-xs font-medium tracking-widest uppercase">Live Preview</span>
          </motion.div>

          <AvatarCreator3DViewer avatarConfig={avatarConfig} />

          {/* Camera / Photo scan button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
          >
            <button
              onClick={requestCamera}
              className="group flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-white/15 hover:border-white/30 transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)'
              }}
            >
              <Camera className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
              <span className="text-white/60 group-hover:text-white text-sm font-medium transition-colors">Scan Your Face</span>
              <Wand2 className="w-3.5 h-3.5 text-cyan-400/70 group-hover:text-cyan-400 transition-colors" />
            </button>
            <p className="text-white/20 text-xs text-center">Generate your avatar from a photo</p>
          </motion.div>
        </div>

        {/* CENTER: Thin divider line */}
        <div className="relative flex items-center justify-center w-[1px] mx-0 flex-shrink-0">
          <div className="absolute inset-y-16 w-[1px]" style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 80%, transparent 100%)'
          }} />
          {/* Glow dot at center */}
          <div className="w-1.5 h-1.5 rounded-full bg-white/20 shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
        </div>

        {/* RIGHT: Customizer panel */}
        <div className="w-[440px] flex-shrink-0 flex flex-col overflow-hidden relative">
          {/* Lip-gloss top shine on right panel */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.015) 0%, transparent 50%, rgba(255,255,255,0.01) 100%)',
          }} />

          <CharacterCustomizerPanel
            currentStep={currentStep}
            steps={STEPS}
            avatarConfig={avatarConfig}
            setAvatarConfig={setAvatarConfig}
            onNext={handleNext}
            onBack={handleBack}
            isLastStep={currentStep === STEPS.length - 1}
            isFinishing={isFinishing}
          />
        </div>
      </div>

      {/* Camera Permission Modal */}
      <AnimatePresence>
        {cameraPermission === 'denied' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setCameraPermission(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="rounded-2xl p-8 max-w-sm w-full mx-4 text-center"
              style={{
                background: 'rgba(10,15,25,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
                <Camera className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Camera Access Needed</h3>
              <p className="text-white/50 text-sm mb-6 leading-relaxed">
                To scan your face and generate a personalized avatar, please allow camera access in your browser settings.
              </p>
              <button
                onClick={() => setCameraPermission(null)}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-all"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Finish Transition */}
      <AnimatePresence>
        {isFinishing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/60 text-sm tracking-widest uppercase">Initializing your avatar...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}