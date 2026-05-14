import React from 'react';
import HUDMinimapQuest from './HUDMinimapQuest';
import HUDSkillSlots from './HUDSkillSlots';
import HUDEquipment from './HUDEquipment';
import HUDVitals from './HUDVitals';

/**
 * Top-level in-game HUD orchestrator — replaces SkillSlotHUD with a clean,
 * modular layout inspired by Where Winds Meet:
 *
 *   ┌─────────────────────────────────────────────┐
 *   │ [Minimap]                                   │
 *   │ [Quest]                                     │
 *   │                                             │
 *   │                                             │
 *   │                                             │
 *   │ SKILL SLOTS              EQUIPMENT          │
 *   │ [Q][E][R][F]   [Portrait] [HP] [1][2]       │
 *   │                          [MP]  [◀ Wpn ▶]    │
 *   │                          [XP]               │
 *   └─────────────────────────────────────────────┘
 */
export default function GameHUD() {
  return (
    <>
      <HUDMinimapQuest />
      <HUDSkillSlots />
      <HUDVitals />
      <HUDEquipment />
    </>
  );
}