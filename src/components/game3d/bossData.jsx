// ─────────────────────────────────────────────
// World Boss definitions.
//
// Each boss spawns at a fixed location on the low-poly map.
// Stats are derived from the "champion" enemy template, then amplified:
//   • Scale       ×7    of a normal enemy
//   • HP          ×8    of a normal enemy (within the 5–10× requested range)
//   • XP reward   ×15   of a normal enemy
//
// Bosses use the same creature model + animation set as regular enemies,
// just supersized. Their world (x,y,z) positions are picked to spread them
// across the map so guidance waypoints feel meaningful.
// ─────────────────────────────────────────────

export const BOSS_SCALE_MULT = 7;
export const BOSS_HP_MULT = 8;
export const BOSS_XP_MULT = 15;

export const BOSSES = [
  {
    id: 'boss_ironmaw',
    name: 'Ironmaw the Devourer',
    title: 'Ancient Brute',
    pos: [40, 0.3, -30],
    color: 0xff3030,
  },
  {
    id: 'boss_voidshade',
    name: 'Voidshade the Hollow',
    title: 'Spectral Tyrant',
    pos: [-38, 0.3, 32],
    color: 0xa855f7,
  },
  {
    id: 'boss_emberwarden',
    name: 'Emberwarden',
    title: 'Forgeborn King',
    pos: [0, 0.3, -55],
    color: 0xf97316,
  },
];