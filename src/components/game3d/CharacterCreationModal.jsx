// ─── Character Creation Modal ──────────────────────────────────────────
// Shown when the player clicks "Create Character" on the login screen.
// Lets them pick a NAME and Head / Body / Shoulders appearance, then
// creates a level-1 character in the roster and sets it active.

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User } from 'lucide-react';
import { APPEARANCE_OPTIONS, createCharacter } from './characterStore';

const SLOTS = [
  { key: 'head',      label: 'Head'      },
  { key: 'body',      label: 'Body'      },
  { key: 'shoulders', label: 'Shoulders' },
];

export default function CharacterCreationModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [appearance, setAppearance] = useState({
    head:      'default',
    body:      'default',
    shoulders: 'default',
  });

  const canCreate = name.trim().length > 0;

  const handleCreate = () => {
    if (!canCreate) return;
    const c = createCharacter({ name, appearance });
    onCreated?.(c);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-[480px] max-w-[92vw] rounded-xl overflow-hidden"
        style={{
          background: 'rgba(20, 35, 55, 0.95)',
          backdropFilter: 'blur(20px) saturate(160%)',
          border: '1px solid rgba(120, 180, 220, 0.25)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-300" />
            <h2 className="text-white text-sm font-bold tracking-[0.25em] uppercase">Create Character</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-[10px] text-white/50 font-bold tracking-[0.2em] uppercase mb-2">
              Character Name
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              placeholder="Enter a name..."
              className="w-full px-4 py-2.5 rounded bg-black/40 border border-white/15 focus:border-cyan-400/60 outline-none text-white text-sm placeholder:text-white/30"
            />
          </div>

          {/* Appearance slots */}
          <div className="space-y-3">
            <div className="text-[10px] text-white/50 font-bold tracking-[0.2em] uppercase">
              Appearance
            </div>
            {SLOTS.map(({ key, label }) => {
              const options = APPEARANCE_OPTIONS[key] || [];
              return (
                <div key={key}>
                  <div className="text-white/70 text-xs mb-1.5">{label}</div>
                  <div className="flex flex-wrap gap-2">
                    {options.map((opt) => {
                      const isSelected = appearance[key] === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setAppearance((a) => ({ ...a, [key]: opt.id }))}
                          className={`px-3 py-1.5 rounded text-xs transition-all ${
                            isSelected
                              ? 'bg-cyan-500/20 border border-cyan-400/60 text-white'
                              : 'bg-black/30 border border-white/10 text-white/70 hover:border-white/30'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div className="text-[10px] text-white/40 italic pt-1">
              More appearance options unlock as new 3D models are added.
            </div>
          </div>

          {/* Starting level note */}
          <div className="flex items-center justify-between px-3 py-2 rounded bg-black/30 border border-white/10">
            <span className="text-white/60 text-xs">Starting Level</span>
            <span className="text-cyan-300 text-sm font-bold">1</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-black/40 border border-white/15 text-white/70 hover:text-white text-xs tracking-wider"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className={`px-5 py-2 rounded text-xs font-bold tracking-[0.2em] uppercase transition-all ${
              canCreate
                ? 'bg-cyan-500/30 border border-cyan-400/60 text-white hover:bg-cyan-500/50'
                : 'bg-black/30 border border-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            Create
          </button>
        </div>
      </motion.div>
    </div>
  );
}