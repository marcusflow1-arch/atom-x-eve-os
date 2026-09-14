// ─── Character Creation Modal ──────────────────────────────────────────
// Uses the same universal Artemis avatar body as Luna. Players can keep the
// shared body or create a personal likeness from a consented selfie.

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User, Sparkles } from 'lucide-react';
import { APPEARANCE_OPTIONS, createCharacter } from './characterStore';
import ThreeScene from '@/components/shared/ThreeScene';
import GenesisFaceScan from '@/components/onboarding/GenesisFaceScan';
import { companionModel, GLOBAL_AVATAR_NAME, withAppearanceDefaults } from '@/components/onboarding/genesisAssets';
import '@/components/onboarding/genesis.css';

const SLOTS = [
  { key: 'head', label: 'Head' },
  { key: 'body', label: 'Body' },
  { key: 'shoulders', label: 'Shoulders' },
];

export default function CharacterCreationModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [appearance, setAppearance] = useState({ head: 'default', body: 'default', shoulders: 'default' });
  const [avatarConfig, setAvatarConfig] = useState(() => withAppearanceDefaults({ name: '', gender: 'female', model_url: '' }));
  const canCreate = name.trim().length > 0;
  const previewUrl = companionModel(avatarConfig);

  const updateName = (value) => {
    setName(value);
    setAvatarConfig((current) => ({ ...current, name: value }));
  };

  const handleCreate = () => {
    if (!canCreate) return;
    const c = createCharacter({ name, appearance, avatarConfig });
    onCreated?.(c);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative flex max-h-[94vh] w-[1040px] max-w-[96vw] flex-col overflow-hidden rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(12,24,40,.97), rgba(18,38,60,.94))',
          backdropFilter: 'blur(24px) saturate(160%)',
          border: '1px solid rgba(120, 200, 240, 0.22)',
          boxShadow: '0 18px 70px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-cyan-300" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.25em] text-white">Create Character</h2>
              <p className="mt-1 text-[10px] text-white/40">{GLOBAL_AVATAR_NAME} universal body · optional personal face</p>
            </div>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Close character creator">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[0.9fr_1.1fr]">
          <section className="relative min-h-[420px] overflow-hidden border-b border-white/10 bg-black/15 lg:border-b-0 lg:border-r">
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4">
              <span className="text-[9px] font-bold uppercase tracking-[.22em] text-cyan-200/55">Live body preview</span>
              <span className="rounded-full bg-black/35 px-2 py-1 text-[9px] text-white/45">{avatarConfig.face_scan_generated ? 'Personal likeness' : 'Global default'}</span>
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(34,211,238,.11),transparent_45%)]" />
            <div className="absolute inset-0 pt-12">
              <ThreeScene modelUrl={previewUrl} scale={0.9} autoRotate />
            </div>
            <div className="absolute inset-x-4 bottom-4 rounded-xl bg-black/35 p-3 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-semibold text-white/80"><Sparkles className="h-3.5 w-3.5 text-cyan-300" /> One avatar identity everywhere</div>
              <p className="mt-1 text-[10px] leading-4 text-white/40">This same saved model is used by Luna, game landing pages, skill previews, profile views, and compatible player previews.</p>
            </div>
          </section>

          <section className="space-y-5 p-6">
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Character Name</label>
              <input autoFocus type="text" value={name} onChange={(e) => updateName(e.target.value)} maxLength={24} placeholder="Enter a name..." className="w-full rounded-lg border border-white/15 bg-black/35 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-400/60" />
            </div>

            <GenesisFaceScan config={avatarConfig} setConfig={setAvatarConfig} />

            <div className="space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Equipment appearance</div>
              {SLOTS.map(({ key, label }) => {
                const options = APPEARANCE_OPTIONS[key] || [];
                return (
                  <div key={key}>
                    <div className="mb-1.5 text-xs text-white/70">{label}</div>
                    <div className="flex flex-wrap gap-2">
                      {options.map((opt) => {
                        const selected = appearance[key] === opt.id;
                        return <button key={opt.id} type="button" onClick={() => setAppearance((current) => ({ ...current, [key]: opt.id }))} className={`rounded px-3 py-1.5 text-xs transition-all ${selected ? 'border border-cyan-400/60 bg-cyan-500/20 text-white' : 'border border-white/10 bg-black/30 text-white/70 hover:border-white/30'}`}>{opt.label}</button>;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/25 px-3 py-2">
              <span className="text-xs text-white/60">Starting Level</span>
              <span className="text-sm font-bold text-cyan-300">1</span>
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-2 border-t border-white/10 px-6 py-4">
          <button onClick={onClose} className="rounded border border-white/15 bg-black/40 px-4 py-2 text-xs tracking-wider text-white/70 hover:text-white">Cancel</button>
          <button onClick={handleCreate} disabled={!canCreate} className={`rounded px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] transition-all ${canCreate ? 'border border-cyan-400/60 bg-cyan-500/30 text-white hover:bg-cyan-500/50' : 'cursor-not-allowed border border-white/10 bg-black/30 text-white/30'}`}>Create</button>
        </div>
      </motion.div>
    </div>
  );
}
