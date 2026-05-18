// ─── Death Tips Overlay ────────────────────────────────────────────────
// Blank full-screen overlay shown for 5 seconds right after the player dies.
// Displays a random gameplay tip at the bottom (Halo / Title / Gear advice).
// After 5 s, advances to the respawn map phase via the death store.

import React, { useEffect, useMemo } from 'react';
import { setDeathPhase } from './deathStore';

const TIPS = [
  'To prevent yourself from dying, increase your gear and your combat halo. Look into systems for Halo and Combat Title to boost your overall strength so you have a better chance of surviving.',
  'Equip a stronger weapon and upgrade its enchantments at the Blacksmith to deal more damage.',
  'Allocate unspent stat points (press C) — Vitality boosts your max HP, Strength boosts physical damage.',
  'Level up your Halo by earning XP — it grants virtual stat bonuses that scale every part of your build.',
  'Pick a Title that matches your playstyle — each one grants passive combat bonuses.',
  'Use your skill loadout — equip the right active skills before combat for burst damage and survival.',
  'Stay aware of your surroundings — rogue AIs can pull you into combat from a distance.',
  'Watch your HP bar carefully and disengage from fights you cannot win.',
];

const TIPS_DURATION_MS = 3000;

export default function DeathTipsOverlay() {
  const tip = useMemo(() => TIPS[Math.floor(Math.random() * TIPS.length)], []);

  useEffect(() => {
    const id = setTimeout(() => setDeathPhase('respawn'), TIPS_DURATION_MS);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-end pb-24">
      <div className="max-w-2xl px-8 text-center">
        <div className="text-white/40 text-xs uppercase tracking-[0.4em] mb-3">Tip</div>
        <p className="text-white/85 text-base leading-relaxed">{tip}</p>
      </div>
    </div>
  );
}