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
 * Companion live-preview card that sits to the RIGHT of the 3D player model.
 *
 * Layout rules:
 *  - The previously-used static portrait BOX is replaced with a live 3D model
 *    viewer (just like the player's 3D preview, on a smaller scale).
 *  - The thin vertical divider between player and companion changes color based
 *    on the current fusion mode:
 *      • Player mode    → amber (matches the enchant button)
 *      • Companion mode → blue  (matches the companion's active accent)
 *  - There is NO enchant button on this side anymore. The single enchant button
 *    above the player model handles both contexts.
 *  - Clicking the 3D preview area toggles fusion mode just like the old portrait did.
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

  // Divider stop colors — amber in player mode, blue in companion mode
  const dividerStop = isActive
    ? 'rgba(147,197,253,0.55)'  // blue
    : 'rgba(251,191,36,0.55)';  // amber (matches enchant button)
  const dividerEdge = isActive
    ? 'rgba(147,197,253,0.35)'
    : 'rgba(251,191,36,0.35)';

  return (
    <>
      {/* Thin vertical divider — color follows fusion mode */}
      <div
        className="absolute pointer-events-none transition-colors duration-300"
        style={{
          right: 280,
          top: 140,
          bottom: 180,
          width: 1,
          background: `linear-gradient(180deg, rgba(255,255,255,0) 0%, ${dividerEdge} 30%, ${dividerStop} 50%, ${dividerEdge} 70%, rgba(255,255,255,0) 100%)`,
        }}
      />

      <div
        className="absolute pointer-events-auto flex flex-col items-center gap-2"
        style={{
          right: 40,
          // Anchor to the bottom so the wolf sits just above the
          // Repair / Replace action buttons (which live at bottom-5 / ~20px).
          bottom: 60,
          width: 240,
        }}
      >
        {/* Name + rarity label — now ABOVE the 3D preview, so the wolf's
            feet visually sit lower in the frame (closer to the archer's feet). */}
        <div className="text-center">
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

        {/* Live 3D companion preview — clicking toggles fusion mode.
            Wolf is anchored to the BOTTOM of this frame so its feet align
            visually with the archer's feet on the same ground plane. */}
        <button
          onClick={() => setFusionMode(isActive ? 'player' : 'companion')}
          className="w-full rounded-lg overflow-hidden transition-all hover:scale-[1.02] cursor-pointer relative"
          style={{
            height: 260,
            background: 'transparent',
            border: 'none',
            padding: 0,
          }}
          title={isActive ? 'Click to return to player view' : 'Click to view companion equipment'}
        >
          <CompanionPreview3D />

          {/* Active-mode glow corner indicator */}
          {isActive && (
            <Sparkles
              className="absolute top-2 right-2 w-3.5 h-3.5"
              style={{ color: rarityColor }}
            />
          )}
        </button>
      </div>
    </>
  );
}