import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  subscribeFusion,
  getFusionState,
  setFusionMode,
  getActiveCompanion,
} from './companionFusionStore';
import CompanionPreview3D from './CompanionPreview3D';

/**
 * Compact companion preview card that sits to the RIGHT of the 3D player model.
 * - Click the companion PORTRAIT itself to switch into companion mode.
 * - The button above is ENCHANT (active only in companion mode) — clicking it
 *   toggles the enchantment overlay for companion gear.
 *
 * The 3D model itself is NOT moved.
 */
export default function CompanionFusionCard({ onEnchant, enchantOpen }) {
  const [fusion, setFusion] = useState(getFusionState());
  useEffect(() => subscribeFusion(setFusion), []);

  const companion = getActiveCompanion();
  const isActive = fusion.mode === 'companion';

  if (!companion) return null;

  const rarityColor = {
    common:    '#9ca3af',
    rare:      '#60a5fa',
    epic:      '#c084fc',
    legendary: '#fbbf24',
  }[companion.rarity] || '#9ca3af';

  return (
    <>
      {/* Thin vertical divider between player and companion.
          Subtle radiant fade — visible but not glowing. */}
      <div
        className="absolute pointer-events-none"
        style={{
          right: 280,
          top: 140,
          bottom: 180,
          width: 1,
          background:
            'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(147,197,253,0.35) 30%, rgba(147,197,253,0.45) 50%, rgba(147,197,253,0.35) 70%, rgba(255,255,255,0) 100%)',
        }}
      />

      <div
        className="absolute pointer-events-auto flex flex-col items-center gap-2"
        style={{
          right: 60,
          top: 110,
          width: 200,
        }}
      >
        {/* ENCHANT button — only does something while in companion mode. */}
        <button
          onClick={() => {
            if (!isActive) setFusionMode('companion');
            else onEnchant?.();
          }}
          disabled={false}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] tracking-widest font-semibold transition-all hover:scale-105"
          style={{
            background: enchantOpen
              ? 'linear-gradient(180deg, rgba(251,191,36,0.95), rgba(217,119,6,0.9))'
              : isActive
              ? 'linear-gradient(180deg, rgba(96,165,250,0.95), rgba(37,99,235,0.9))'
              : 'rgba(15,17,22,0.55)',
            color: enchantOpen
              ? '#1a1208'
              : isActive
              ? '#0a0f1e'
              : 'rgba(147,197,253,0.95)',
            border: `1px solid ${
              enchantOpen
                ? 'rgba(251,191,36,0.7)'
                : isActive
                ? 'rgba(147,197,253,0.7)'
                : 'rgba(96,165,250,0.45)'
            }`,
            backdropFilter: 'blur(14px) saturate(140%)',
            WebkitBackdropFilter: 'blur(14px) saturate(140%)',
            boxShadow: isActive
              ? '0 6px 18px rgba(96,165,250,0.4)'
              : '0 4px 14px rgba(0,0,0,0.4)',
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          ENCHANT
        </button>

        {/* Companion portrait — CLICK THIS to toggle companion mode. */}
        <button
          onClick={() => setFusionMode(isActive ? 'player' : 'companion')}
          className="w-full rounded-lg overflow-hidden transition-all hover:scale-[1.02] cursor-pointer"
          style={{
            background: isActive
              ? `linear-gradient(180deg, ${rarityColor}22 0%, rgba(15,17,22,0.7) 100%)`
              : 'rgba(15,17,22,0.55)',
            border: `1px solid ${isActive ? rarityColor + 'aa' : 'rgba(255,255,255,0.1)'}`,
            backdropFilter: 'blur(12px) saturate(140%)',
            WebkitBackdropFilter: 'blur(12px) saturate(140%)',
            boxShadow: isActive
              ? `0 6px 20px ${rarityColor}33`
              : '0 4px 14px rgba(0,0,0,0.4)',
          }}
          title={isActive ? 'Click to return to player view' : 'Click to view companion equipment'}
        >
          <div
            className="relative flex items-center justify-center overflow-hidden"
            style={{ height: 160 }}
          >
            {/* Floating name label above the 3D model */}
            <div
              className="absolute top-2 left-0 right-0 z-10 text-center pointer-events-none"
              style={{
                textShadow: '0 2px 6px rgba(0,0,0,0.9)',
              }}
            >
              <div
                className="text-[11px] font-bold tracking-wider truncate px-2"
                style={{ color: rarityColor }}
              >
                {companion.name}
              </div>
            </div>

            {/* Soft rarity glow behind model */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 130,
                height: 130,
                background: `radial-gradient(circle, ${rarityColor}33 0%, transparent 70%)`,
                filter: 'blur(10px)',
              }}
            />

            {/* Live 3D companion model */}
            <div className="absolute inset-0">
              <CompanionPreview3D companion={companion} />
            </div>

            {isActive && (
              <Sparkles
                className="absolute top-2 right-2 w-3.5 h-3.5 z-10"
                style={{ color: rarityColor }}
              />
            )}
          </div>

          <div className="px-3 py-2 border-t border-white/5 text-left">
            <div
              className="text-[11px] font-bold tracking-wider truncate"
              style={{ color: rarityColor }}
            >
              {companion.name}
            </div>
            <div className="text-[9px] tracking-widest uppercase text-white/40 mt-0.5">
              {companion.rarity} · companion
            </div>
          </div>
        </button>

        <div className="text-[9px] tracking-widest uppercase text-white/35 text-center px-2 leading-relaxed">
          {isActive
            ? 'Click portrait to return'
            : 'Click companion to equip'}
        </div>
      </div>
    </>
  );
}