// AXE Prompt 009 — main faction capital blockout and city-system layout.

export const AXE_CAPITAL_LAYOUT = Object.freeze({
  id: 'AXE_City_FirstFactionCapital',
  name: 'First Faction Capital',
  center: Object.freeze([0, 0, 420]),
  footprint: Object.freeze({ width: 820, depth: 900 }),
  wall: Object.freeze({ height: 12, thickness: 4 }),
  mainGate: Object.freeze({
    id: 'AXE_Capital_MainGate',
    position: [0, 0, -28],
    width: 18,
    height: 16,
  }),
  districts: Object.freeze([
    { id: 'AXE_District_Market', name: 'Market District', center: [-180, 0, 220], size: [250, 230] },
    { id: 'AXE_District_Blacksmith', name: 'Blacksmith District', center: [160, 0, 190], size: [210, 180] },
    { id: 'AXE_District_Teleport', name: 'Teleport Plaza', center: [-150, 0, 430], size: [180, 180] },
    { id: 'AXE_District_Storage', name: 'Storage & Bank', center: [155, 0, 420], size: [170, 150] },
    { id: 'AXE_District_Training', name: 'Training District', center: [210, 0, 650], size: [250, 210] },
    { id: 'AXE_District_Social', name: 'Social Square', center: [-160, 0, 640], size: [240, 220] },
    { id: 'AXE_District_Residential', name: 'Residential Streets', center: [-260, 0, 790], size: [260, 180] },
    { id: 'AXE_District_FactionHQ', name: 'Faction Headquarters', center: [70, 0, 820], size: [380, 180] },
  ]),
  defensiveTowers: Object.freeze([
    [-390, 0, -5], [390, 0, -5],
    [-390, 0, 410], [390, 0, 410],
    [-390, 0, 845], [390, 0, 845],
  ]),
  serviceMarkers: Object.freeze([
    { id: 'AXE_Service_Blacksmith', type: 'blacksmith', position: [150, 0, 185] },
    { id: 'AXE_Service_Weapon', type: 'weapon', position: [-150, 0, 220] },
    { id: 'AXE_Service_Armor', type: 'armor', position: [-195, 0, 245] },
    { id: 'AXE_Service_Consumable', type: 'consumable', position: [-220, 0, 195] },
    { id: 'AXE_Service_Bank', type: 'bank', position: [150, 0, 420] },
    { id: 'AXE_Service_Teleport', type: 'teleport', position: [-150, 0, 430] },
    { id: 'AXE_Service_Trainer', type: 'trainer', position: [210, 0, 650] },
    { id: 'AXE_Service_Clan', type: 'clan', position: [-130, 0, 645] },
    { id: 'AXE_Service_Housing', type: 'housing', position: [-275, 0, 790] },
  ]),
  safeZone: Object.freeze({
    id: 'AXE_SafeZone_FirstFactionCapital',
    center: [0, 0, 420],
    radius: 500,
    pvpAllowed: false,
    hostileAIAllowed: false,
  }),
});
