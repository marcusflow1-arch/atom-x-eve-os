import React, { useEffect, useState } from 'react';
import { PawPrint, Sparkles } from 'lucide-react';
import {
  subscribeFusion,
  getFusionState,
  setFusionMode,
  getActiveCompanion,
} from './companionFusionStore';

/**
 * Compact companion preview card that sits to the RIGHT of the 3D player model
 * inside the Gear tab. Mirrors the "Attend" button placement (above the model)
 * but for the companion. Clicking ATTEND swaps the gear tab into companion mode.
 *
 * The 3D model itself is NOT moved — this card occupies the empty space to its
 * right, leaving the existing player viewer untouched.
 */
export default function CompanionFusionCard() {
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
    <div
      className="absolute pointer-events-auto flex flex-col items-center gap-2"
      style={{
        // To the right of the 3D model area (model sits around 70%; we go further right)
        right: 60,
        top: 110,
        width: 200,
      }}
    >
      {/* ATTEND button — sits above the companion silhouette, matching the
          ENCHANT button placed above the player model. */}
      <button
        onClick={() => setFusionMode(isActive ? 'player' : 'companion')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] tracking-widest font-semibold transition-all hover:scale-105"
        style={{
          background: isActive
            ? 'linear-gradient(180deg, rgba(96,165,250,0.95), rgba(37,99,235,0.9))'
            : 'rgba(15,17,22,0.55)',
          color: isActive ? '#0a0f1e' : 'rgba(147,197,253,0.95)',
          border: `1px solid ${isActive ? 'rgba(147,197,253,0.7)' : 'rgba(96,165,250,0.45)'}`,
          backdropFilter: 'blur(14px) saturate(140%)',
          WebkitBackdropFilter: 'blur(14px) saturate(140%)',
          boxShadow: isActive
            ? '0 6px 18px rgba(96,165,250,0.4)'
            : '0 4px 14px rgba(0,0,0,0.4)',
        }}
      >
        <PawPrint className="w-3.5 h-3.5" />
        {isActive ? 'ATTENDING' : 'ATTEND'}
      </button>

      {/* Companion silhouette / portrait placeholder.
          Since we don't have a companion 3D viewer yet, this is a stylized
          placeholder showing the companion's identity + rarity. */}
      <div
        className="w-full rounded-lg overflow-hidden transition-all"
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
      >
        {/* Silhouette area */}
        <div
          className="relative flex items-center justify-center"
          style={{ height: 160 }}
        >
          {/* Soft glow ring */}
          <div
            className="absolute rounded-full"
            style={{
              width: 110,
              height: 110,
              background: `radial-gradient(circle, ${rarityColor}33 0%, transparent 70%)`,
              filter: 'blur(8px)',
            }}
          />
          <PawPrint
            className="relative"
            style={{
              width: 64,
              height: 64,
              color: rarityColor,
              opacity: isActive ? 1 : 0.6,
              filter: `drop-shadow(0 0 8px ${rarityColor}88)`,
            }}
          />
          {isActive && (
            <Sparkles
              className="absolute top-2 right-2 w-3.5 h-3.5"
              style={{ color: rarityColor }}
            />
          )}
        </div>

        {/* Name + rarity */}
        <div className="px-3 py-2 border-t border-white/5">
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
      </div>

      {/* Hint text below */}
      <div className="text-[9px] tracking-widest uppercase text-white/35 text-center px-2 leading-relaxed">
        {isActive
          ? 'Equipping companion gear'
          : 'Click ATTEND to equip companion'}
      </div>
    </div>
  );
}