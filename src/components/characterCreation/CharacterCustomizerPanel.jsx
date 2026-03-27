import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Sparkles, Check, Mic, Wand2, Star, Zap, Volume2 } from 'lucide-react';

export default function CharacterCustomizerPanel({
  currentStep, steps, avatarConfig, setAvatarConfig, onNext, onBack, isLastStep, isFinishing
}) {

  const updateConfig = (key, val) => setAvatarConfig(p => ({ ...p, [key]: val }));

  // Preset options
  const PRESETS = [
    { id: 'atlas', name: 'Atlas Prime', gender: 'male', desc: 'Standard tactical unit' },
    { id: 'eve', name: 'Eve Series 4', gender: 'female', desc: 'Advanced infiltration unit' },
    { id: 'nomad', name: 'Nomad', gender: 'male', desc: 'Wasteland survivor' },
    { id: 'siren', name: 'Siren', gender: 'female', desc: 'Neon city operative' }
  ];

  // Skin Tones
  const SKIN_TONES = ['#ffdfc4', '#f0d5be', '#d6b8a1', '#c8956c', '#a87a55', '#7b5336', '#4a301d', '#2c1b10', '#1c1513', '#666b7a', '#a6d9e0', '#83282b'];
  // Hair Colors
  const HAIR_COLORS = ['#1a1a1a', '#42281a', '#7b5336', '#d6b8a1', '#ffdfc4', '#f1f1f1', '#e82938', '#512ba6', '#00b4d8', '#2dd4bf'];
  
  const OUTFITS = [
    { id: 'cyberpunk_casual', name: 'Cyberpunk Casual', img: '🧥' },
    { id: 'tactical_armor', name: 'Tactical Armor', img: '🛡️' },
    { id: 'nomad_gear', name: 'Nomad Gear', img: '🦺' },
    { id: 'netrunner_suit', name: 'Netrunner Suit', img: '🥼' }
  ];

  const VOICES = [
    { id: 'deep_calm', name: 'Deep & Calm', tag: 'Masculine' },
    { id: 'crisp_clear', name: 'Crisp & Clear', tag: 'Feminine' },
    { id: 'gruff_veteran', name: 'Gruff Veteran', tag: 'Masculine' },
    { id: 'synthetic', name: 'Synthetic Echo', tag: 'Androgynous' },
    { id: 'energetic', name: 'High Energy', tag: 'Feminine' },
  ];

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="flex flex-col h-full pl-8 pr-12 pb-10 pt-20">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-4">
        <AnimatePresence mode="wait">
          
          {/* STEP 0: Base Character */}
          {currentStep === 0 && (
            <motion.div key="step0" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Select Preset</h2>
                <p className="text-white/50 text-sm">Choose a starting point for your avatar.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {PRESETS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { updateConfig('preset', p.id); updateConfig('gender', p.gender); }}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      avatarConfig.preset === p.id
                        ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
                        : 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/[0.08]'
                    }`}
                  >
                    <h3 className="text-white font-bold mb-1">{p.name}</h3>
                    <p className="text-white/40 text-xs">{p.desc}</p>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="text-white/70 text-sm font-medium uppercase tracking-wider">Gender</h3>
                <div className="flex bg-white/5 rounded-xl border border-white/10 p-1">
                  {['male', 'female', 'non-binary'].map(g => (
                    <button
                      key={g}
                      onClick={() => updateConfig('gender', g)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all capitalize ${
                        avatarConfig.gender === g
                          ? 'bg-white/10 text-white shadow-sm'
                          : 'text-white/50 hover:text-white/80'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 1: Style & Appearance */}
          {currentStep === 1 && (
            <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Appearance</h2>
                <p className="text-white/50 text-sm">Customize colors and outfit.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white/70 text-sm font-medium uppercase tracking-wider">Skin Tone</h3>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {SKIN_TONES.map(color => (
                    <button
                      key={color}
                      onClick={() => updateConfig('skinTone', color)}
                      className={`w-9 h-9 rounded-full transition-transform ${
                        avatarConfig.skinTone === color ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#0f1419]' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white/70 text-sm font-medium uppercase tracking-wider">Hair Color</h3>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {HAIR_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => updateConfig('hairColor', color)}
                      className={`w-9 h-9 rounded-full transition-transform ${
                        avatarConfig.hairColor === color ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#0f1419]' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-white/70 text-sm font-medium uppercase tracking-wider">Starting Outfit</h3>
                <div className="grid grid-cols-2 gap-3">
                  {OUTFITS.map(outfit => (
                    <button
                      key={outfit.id}
                      onClick={() => updateConfig('outfit', outfit.id)}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                        avatarConfig.outfit === outfit.id
                          ? 'border-cyan-400 bg-cyan-400/10'
                          : 'border-white/10 hover:border-white/20 bg-white/5'
                      }`}
                    >
                      <div className="text-2xl">{outfit.img}</div>
                      <span className="text-white/80 text-sm font-medium text-left">{outfit.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Voice */}
          {currentStep === 2 && (
            <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Voice Print</h2>
                <p className="text-white/50 text-sm">Select how your AI companion will sound.</p>
              </div>

              <div className="space-y-3">
                {VOICES.map(voice => (
                  <div
                    key={voice.id}
                    onClick={() => updateConfig('voiceType', voice.id)}
                    className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      avatarConfig.voiceType === voice.id
                        ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_20px_rgba(34,211,238,0.1)]'
                        : 'border-white/10 hover:border-white/20 bg-white/5'
                    }`}
                  >
                    <div>
                      <h3 className="text-white font-bold mb-1">{voice.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/50 uppercase tracking-wider">{voice.tag}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); /* Play sound */ }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        avatarConfig.voiceType === voice.id
                          ? 'bg-cyan-400 text-black hover:bg-cyan-300'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-3">
                <Wand2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <p className="text-purple-200/70 text-sm leading-relaxed">
                  Your AI's voice will adapt and evolve over time based on your interactions and gameplay style.
                </p>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Finalize (Name) */}
          {currentStep === 3 && (
            <motion.div key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Identity</h2>
                <p className="text-white/50 text-sm">Give your avatar a name.</p>
              </div>

              <div className="space-y-4">
                <label className="text-white/70 text-sm font-medium uppercase tracking-wider block">Avatar Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={avatarConfig.name}
                    onChange={(e) => updateConfig('name', e.target.value)}
                    placeholder="Enter designation..."
                    className="w-full bg-white/5 border border-white/10 focus:border-cyan-400 rounded-xl px-4 py-4 text-white text-lg outline-none transition-all placeholder:text-white/20"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {avatarConfig.name.length > 2 && <Check className="w-5 h-5 text-green-400" />}
                  </div>
                </div>
                <p className="text-white/40 text-xs text-right">You can change this later.</p>
              </div>

              <div className="pt-6 border-t border-white/10">
                <h3 className="text-white/70 text-sm font-medium uppercase tracking-wider mb-4">Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-white/40 text-xs block mb-1">Preset</span>
                    <span className="text-white text-sm capitalize">{avatarConfig.preset}</span>
                  </div>
                  <div>
                    <span className="text-white/40 text-xs block mb-1">Gender</span>
                    <span className="text-white text-sm capitalize">{avatarConfig.gender}</span>
                  </div>
                  <div>
                    <span className="text-white/40 text-xs block mb-1">Voice</span>
                    <span className="text-white text-sm">{VOICES.find(v => v.id === avatarConfig.voiceType)?.name}</span>
                  </div>
                  <div>
                    <span className="text-white/40 text-xs block mb-1">Outfit</span>
                    <span className="text-white text-sm">{OUTFITS.find(o => o.id === avatarConfig.outfit)?.name}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <div className="pt-6 flex gap-3 mt-auto border-t border-white/10 mt-8">
        <button
          onClick={onBack}
          className={`px-5 py-3 rounded-xl border border-white/10 font-bold transition-all ${
            currentStep === 0 
              ? 'opacity-0 pointer-events-none' 
              : 'text-white/70 hover:text-white bg-white/5 hover:bg-white/10'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={onNext}
          disabled={isFinishing || (currentStep === 3 && avatarConfig.name.length < 3)}
          className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all relative overflow-hidden group ${
            isLastStep
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:opacity-50'
              : 'bg-white text-black hover:bg-white/90'
          }`}
        >
          {isLastStep && (
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          )}
          <span className="relative z-10">{isLastStep ? 'Initialize Avatar' : 'Next Step'}</span>
          {!isLastStep && <ChevronRight className="w-5 h-5 relative z-10" />}
          {isLastStep && !isFinishing && <Zap className="w-4 h-4 relative z-10" />}
          {isFinishing && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin relative z-10" />}
        </button>
      </div>
    </div>
  );
}