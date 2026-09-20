// AXE Prompt 004 — first playable region macro layout and terrain blockout.
// Coordinates are in meters and deliberately data-driven.

export const AXE_FIRST_REGION = Object.freeze({
  id: 'AXE_Region_FirstTerritory',
  name: 'First Faction Territory',
  size: Object.freeze({ width: 2400, depth: 2400 }),
  origin: Object.freeze([0, 0, 0]),
  safeToDangerAxis: 'north-to-southeast',
  zones: Object.freeze([
    { id: 'AXE_Zone_Capital', name: 'Main Faction Capital', kind: 'capital', center: [0, 0, 420], radius: 500 },
    { id: 'AXE_Zone_StarterWilderness', name: 'Starter Wilderness', kind: 'wilderness', center: [0, 0, 0], radius: 320 },
    { id: 'AXE_Zone_BambooForest', name: 'Bamboo Forest', kind: 'forest', center: [-620, 0, -260], radius: 360 },
    { id: 'AXE_Zone_Mountain', name: 'Mountain Ridge', kind: 'mountain', center: [780, 0, 120], radius: 330 },
    { id: 'AXE_Zone_CaveNetwork', name: 'Cave Network', kind: 'cave', center: [650, 0, -560], radius: 260 },
    { id: 'AXE_Zone_FutureSettlement', name: 'Future Player Settlement', kind: 'settlement', center: [-520, 0, 680], radius: 180 },
    { id: 'AXE_Zone_ContestedPass', name: 'Contested Pass', kind: 'contested', center: [850, 0, 560], radius: 220 },
    { id: 'AXE_Zone_BossBasin', name: 'Future Boss Basin', kind: 'boss', center: [820, 0, -900], radius: 260 },
  ]),
  landmarks: Object.freeze([
    { id: 'AXE_Landmark_CapitalGate', name: 'Capital Gate', position: [0, 0, -70], importance: 100 },
    { id: 'AXE_Landmark_MountainSpire', name: 'Mountain Spire', position: [820, 0, 140], importance: 80 },
    { id: 'AXE_Landmark_CaveMouth', name: 'Cave Mouth', position: [620, 0, -520], importance: 70 },
    { id: 'AXE_Landmark_SettlementArch', name: 'Settlement Arch', position: [-480, 0, 620], importance: 60 },
  ]),
  roads: Object.freeze([
    { id: 'AXE_Road_CapitalSpine', width: 18, points: [[0, 0, -80], [0, 0, 120], [0, 0, 420]] },
    { id: 'AXE_Road_ForestBranch', width: 7, points: [[0, 0, 40], [-260, 0, -120], [-620, 0, -260]] },
    { id: 'AXE_Road_CaveBranch', width: 8, points: [[0, 0, -80], [280, 0, -280], [650, 0, -560]] },
    { id: 'AXE_Road_SettlementBranch', width: 8, points: [[0, 0, 240], [-260, 0, 430], [-520, 0, 680]] },
    { id: 'AXE_Road_ContestedPass', width: 12, points: [[0, 0, 420], [420, 0, 500], [850, 0, 560]] },
  ]),
  river: Object.freeze({
    id: 'AXE_River_FirstTerritory',
    width: 32,
    points: [[-1050, 0, -700], [-520, 0, -340], [40, 0, -420], [520, 0, -780], [1050, 0, -1040]],
  }),
});

export const AXE_REGION_BLOCKOUT_COLORS = Object.freeze({
  capital: 0x35516d,
  wilderness: 0x2f4c35,
  forest: 0x244533,
  mountain: 0x4b4e55,
  cave: 0x3a3347,
  settlement: 0x66553a,
  contested: 0x5b3b3b,
  boss: 0x4d294d,
});
