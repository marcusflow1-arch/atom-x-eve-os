// ─── Advanced Class Effects ──────────────────────────────────────────────────
// Handles visual aura / VFX activation when a class is selected.
// Broadcasts events consumed by the 3D scene and HUD systems.

import { AURA_FX } from './advancedClassRegistry';

// Aura metadata: colour tint + description for HUD display
export const AURA_META = {
  [AURA_FX.BLUE_PRECISION]: {
    color: '#3b82f6',
    name: 'Precision Aura',
    description: 'A cold blue light pulses around your silhouette.',
  },
  [AURA_FX.GREEN_TACTICAL]: {
    color: '#10b981',
    name: 'Tactical Aura',
    description: 'A steady green glow marks your readiness.',
  },
  [AURA_FX.RED_EXPLOSIVE]: {
    color: '#f97316',
    name: 'Explosive Aura',
    description: 'Crackling orange energy radiates from your body.',
  },
  [AURA_FX.PURPLE_SHADOW]: {
    color: '#8b5cf6',
    name: 'Shadow Aura',
    description: 'Dark tendrils of shadow coil around your form.',
  },
  [AURA_FX.CRIMSON_RAGE]: {
    color: '#ef4444',
    name: 'Rage Aura',
    description: 'Crimson fire blazes in your eyes.',
  },
  [AURA_FX.CYAN_DANCE]: {
    color: '#06b6d4',
    name: 'Flow Aura',
    description: 'Cyan light traces the path of each movement.',
  },
  [AURA_FX.DARK_EXECUTE]: {
    color: '#a855f7',
    name: 'Execute Aura',
    description: 'A grim purple hue surrounds your weapon.',
  },
  [AURA_FX.BLOOD_CRIMSON]: {
    color: '#dc2626',
    name: 'Blood Aura',
    description: 'A crimson mist swirls around your blade.',
  },
  [AURA_FX.GOLD_FORTRESS]: {
    color: '#f59e0b',
    name: 'Fortress Aura',
    description: 'Golden energy reinforces every surface of your armor.',
  },
  [AURA_FX.SILVER_COUNTER]: {
    color: '#6366f1',
    name: 'Counter Aura',
    description: 'Silver sparks ignite at every deflection.',
  },
  [AURA_FX.IRON_JUGGERNAUT]: {
    color: '#78716c',
    name: 'Iron Aura',
    description: 'A low rumble follows your every step.',
  },
  [AURA_FX.HOLY_PALADIN]: {
    color: '#fbbf24',
    name: 'Holy Aura',
    description: 'Warm golden light emanates from within.',
  },
};

// ─── Effect Dispatcher ────────────────────────────────────────────────────────
// Called by advancedClassStore when a class is selected.
// The 3D scene subscribes to these events to apply visual changes.

export const activateClassEffects = (classDef) => {
  if (!classDef) return;
  const { aura, projectile_vfx, class_title } = classDef.unlock_effects || {};

  window.dispatchEvent(new CustomEvent('applyClassAura', {
    detail: {
      auraKey:        aura || null,
      auraMeta:       aura ? AURA_META[aura] : null,
      projectileVfx:  projectile_vfx || null,
      classTitle:     class_title || classDef.display_name,
      classId:        classDef.class_id,
      weaponType:     classDef.weapon_type,
      color:          classDef.color,
    },
  }));
};

export const deactivateClassEffects = (weaponType) => {
  window.dispatchEvent(new CustomEvent('clearClassAura', { detail: { weaponType } }));
};

// Listen for class selections and auto-activate effects
window.addEventListener('advancedClassSelected', (e) => {
  activateClassEffects(e.detail?.classDef);
});