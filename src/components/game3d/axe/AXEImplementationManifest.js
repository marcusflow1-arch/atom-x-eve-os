// AXE Prompt 010 — master audit / requirements lock.
// This file is deliberately declarative. It records what the browser Game3D track
// has implemented versus what still needs a dedicated implementation prompt.

export const AXE_STATUS = Object.freeze({
  IMPLEMENTED: 'IMPLEMENTED',
  PARTIAL: 'PARTIAL',
  MISSING: 'MISSING',
  NEEDS_DESIGN: 'NEEDS_DESIGN',
  NEEDS_VERIFICATION: 'NEEDS_VERIFICATION',
});

export const AXE_SOURCE = Object.freeze({
  USER_REQUIRED: 'USER_REQUIRED',
  AXE_ORIGINAL: 'AXE_ORIGINAL',
  REFERENCE_VERIFIED: 'REFERENCE_VERIFIED',
  UNRESOLVED: 'UNRESOLVED',
});

export const AXE_PROMPT_MANIFEST = Object.freeze([
  { prompt: 1, system: 'Core foundation', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 2, system: 'World scale and traversal standards', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 3, system: 'Region streaming / POIs / travel', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 4, system: 'First region macro blockout', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 5, system: 'Character select/create/first spawn', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 6, system: 'Player movement/camera/traversal state', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 7, system: 'Dodge/fall safety/triggers', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 8, system: 'World interaction layer', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 9, system: 'Faction capital blockout', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 10, system: 'Audit / requirements lock', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 11, system: 'Character stats and progression', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 12, system: 'Factions and weapon identities', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 13, system: 'Authoritative combat math', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 14, system: 'Skills 1–10 ladder', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 15, system: 'A-skill / God skills / charge', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 16, system: 'PvE mobs / elites / bosses', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 17, system: 'Loot rarity / quality rolls', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 18, system: 'Equipment and slots', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 19, system: 'Reinforcement / enchant / over-enchant', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 20, system: 'Combine / stage / refine / ultimate', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 21, system: 'Set 2–5 bonuses', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 22, system: 'Sockets / gems', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 23, system: 'Equipment Aura', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 24, system: 'Core progression layer', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 25, system: 'Four-piece auxiliary gear', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 26, system: 'Vanity/costume stat layer', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 27, system: 'Wings', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 28, system: 'Capes', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 29, system: 'Titles', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 30, system: 'Halo', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 31, system: 'Elixirs', status: AXE_STATUS.IMPLEMENTED },
  { prompt: 32, system: 'Pet foundation', status: AXE_STATUS.PARTIAL },
  { prompt: 33, system: 'Pet tiers / God pets', status: AXE_STATUS.MISSING },
  { prompt: 34, system: 'Mount foundation', status: AXE_STATUS.PARTIAL },
  { prompt: 35, system: 'High-end mounts', status: AXE_STATUS.MISSING },
  { prompt: 36, system: 'Quest/campaign framework', status: AXE_STATUS.PARTIAL },
  { prompt: 37, system: 'Caves/dungeons/SOS access', status: AXE_STATUS.MISSING },
  { prompt: 38, system: 'Unified Services menu', status: AXE_STATUS.PARTIAL },
  { prompt: 39, system: 'Faction wars / objective PvP / invasion', status: AXE_STATUS.PARTIAL },
  { prompt: 40, system: 'Settlement / housing', status: AXE_STATUS.MISSING },
]);

export const AXE_REQUIREMENTS_LOCK = Object.freeze({
  projectDirection: '2026 open-world martial-arts MMORPG with deep progression and faction warfare',
  finalRuntimeTrack: 'src/components/game3d/axe',
  rules: Object.freeze([
    'Do not mark a feature complete just because a placeholder exists.',
    'Prefer adapters around existing proven Game3D systems over duplicate rewrites.',
    'Keep numerical balance data-driven.',
    'Keep browser client state authoritative only where the existing multiplayer host/server layer permits it.',
    'Do not copy proprietary source assets or map geometry into AXE-native content.',
  ]),
});

export function getAXEPromptStatus(prompt) {
  return AXE_PROMPT_MANIFEST.find((entry) => entry.prompt === Number(prompt)) || null;
}
