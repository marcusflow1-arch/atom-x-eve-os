// AXE Prompt 002 — player scale, traversal standards, and world dimensions.
// Values are expressed in real-world meters because Three.js world units are meters.

export const AXE_WORLD_SCALE = Object.freeze({
  player: Object.freeze({
    height: 1.8,
    radius: 0.42,
    halfHeight: 0.9,
    crouchHeight: 1.2,
    stepHeight: 0.45,
    cameraTargetHeight: 1.55,
  }),

  doorways: Object.freeze({
    residential: Object.freeze({ minWidth: 1.1, preferredWidth: 1.2, minHeight: 2.2, preferredHeight: 2.3 }),
    public: Object.freeze({ minWidth: 1.5, preferredWidth: 1.8, minHeight: 2.5, preferredHeight: 2.8 }),
    palace: Object.freeze({ minWidth: 3, preferredWidth: 4, minHeight: 4, preferredHeight: 6 }),
    fortressMounted: Object.freeze({ minWidth: 7, preferredWidth: 9, minHeight: 8, preferredHeight: 10 }),
  }),

  corridors: Object.freeze({
    residential: Object.freeze({ minWidth: 1.5, preferredWidth: 1.75 }),
    public: Object.freeze({ minWidth: 2.5, preferredWidth: 3.25 }),
    combat: Object.freeze({ minWidth: 4, preferredWidth: 5.5 }),
    dungeon: Object.freeze({ minWidth: 6, preferredWidth: 9 }),
  }),

  stairs: Object.freeze({
    riserHeight: 0.18,
    treadDepth: 0.30,
    residentialMinWidth: 1.2,
    publicMinWidth: 2.5,
    combatMinWidth: 4,
    ceremonialMinWidth: 8,
  }),

  roads: Object.freeze({
    villagePath: Object.freeze({ minWidth: 2, preferredWidth: 2.5 }),
    villageRoad: Object.freeze({ minWidth: 4, preferredWidth: 5 }),
    cityStreet: Object.freeze({ minWidth: 6, preferredWidth: 8 }),
    majorAvenue: Object.freeze({ minWidth: 12, preferredWidth: 16 }),
    militaryAvenue: Object.freeze({ minWidth: 15, preferredWidth: 20 }),
  }),

  bridges: Object.freeze({
    footbridge: Object.freeze({ minWidth: 2, preferredWidth: 2.5 }),
    combat: Object.freeze({ minWidth: 5, preferredWidth: 6.5 }),
    majorCity: Object.freeze({ minWidth: 10, preferredWidth: 13 }),
    faction: Object.freeze({ minWidth: 15, preferredWidth: 18 }),
  }),

  mountClearance: Object.freeze({
    playerMountedHeight: 3.5,
    playerMountedWidth: 2.4,
    gateHeight: 8,
    gateWidth: 7,
    tunnelHeight: 5,
    tunnelWidth: 5,
    roadTurningRadius: 6,
    largeFantasyMountHeight: 5,
    largeFantasyMountWidth: 3.5,
  }),

  combatSpaces: Object.freeze({
    duel: Object.freeze({ width: 12, depth: 12 }),
    smallMob: Object.freeze({ width: 20, depth: 20 }),
    medium: Object.freeze({ width: 35, depth: 35 }),
    largeGroup: Object.freeze({ width: 50, depth: 50 }),
    miniBoss: Object.freeze({ diameter: 70 }),
    majorBoss: Object.freeze({ diameter: 125 }),
  }),

  caves: Object.freeze({
    smallPassage: Object.freeze({ minWidth: 3, preferredWidth: 4, minHeight: 3 }),
    combatPassage: Object.freeze({ minWidth: 6, preferredWidth: 8, minHeight: 5 }),
    largeCavern: Object.freeze({ preferredDiameter: 35, minHeight: 10 }),
    bossCavern: Object.freeze({ preferredDiameter: 100, minHeight: 18 }),
  }),

  cities: Object.freeze({
    starterSettlement: Object.freeze({ minAcross: 150, maxAcross: 300 }),
    smallTown: Object.freeze({ minAcross: 300, maxAcross: 600 }),
    regionalTown: Object.freeze({ minAcross: 600, maxAcross: 1000 }),
    majorFactionCity: Object.freeze({ minAcross: 1000, maxAcross: 2000 }),
    capitalCity: Object.freeze({ minAcross: 2000, maxAcross: 3200 }),
  }),

  regions: Object.freeze({
    localSubzone: 500,
    wildernessRegion: 2000,
    factionTerritory: 6000,
    majorWorldRegion: 12000,
  }),

  camera: Object.freeze({
    targetHeight: 1.55,
    defaultDistance: 5.2,
    minimumDistance: 4.8,
    combatDistance: 6.4,
    minimumInteriorCeiling: 2.8,
    preferredCombatCeiling: 5,
  }),
});

export const AXE_SCALE_STANDARD = Object.freeze({
  units: 'meters',
  threeJsUnitsPerMeter: 1,
  configId: 'AXE_WorldScaleConfig',
});

export function validateAXEClearance({
  width,
  height = Infinity,
  standard,
  label = 'space',
}) {
  if (!standard) return { ok: false, label, reason: 'missing-standard' };

  const minWidth = standard.minWidth ?? standard.width ?? 0;
  const minHeight = standard.minHeight ?? standard.height ?? 0;
  const widthOk = Number(width) >= Number(minWidth);
  const heightOk = Number(height) >= Number(minHeight);

  return {
    ok: widthOk && heightOk,
    label,
    width: Number(width),
    height: Number(height),
    minWidth,
    minHeight,
    widthOk,
    heightOk,
  };
}

export function validateAXECombatSpace({ width, depth, standard, label = 'combat-space' }) {
  if (!standard) return { ok: false, label, reason: 'missing-standard' };

  if (standard.diameter) {
    const diameter = Math.min(Number(width), Number(depth));
    return {
      ok: diameter >= standard.diameter,
      label,
      diameter,
      minimumDiameter: standard.diameter,
    };
  }

  return {
    ok: Number(width) >= Number(standard.width) && Number(depth) >= Number(standard.depth),
    label,
    width: Number(width),
    depth: Number(depth),
    minimumWidth: Number(standard.width),
    minimumDepth: Number(standard.depth),
  };
}

export function getAXEWorldScaleSnapshot() {
  return AXE_WORLD_SCALE;
}
