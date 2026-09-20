// AXE Prompt 003 — world partition, region streaming, POIs and travel architecture.
// Browser/Three.js equivalent of a world-partition system. It tracks logical regions
// and subregions independently from render objects so content can stream in/out safely.

import { AXE_WORLD_SCALE } from '../core/axeWorldScaleConfig';
import { axeName } from '../core/axeFoundation';

export const AXE_REGION_TYPES = Object.freeze([
  'Capital',
  'Settlement',
  'Wilderness',
  'Forest',
  'Mountain',
  'CaveNetwork',
  'Dungeon',
  'River',
  'Contested',
  'Boss',
  'Divine',
  'Interior',
]);

export function createAXERegionData({
  id,
  name,
  type = 'Wilderness',
  center = [0, 0, 0],
  size = AXE_WORLD_SCALE.regions.wildernessRegion,
  parentId = null,
  priority = 0,
  activationRadius = null,
  unloadRadius = null,
  lod = true,
  hibernatesAI = true,
  tags = [],
  metadata = {},
}) {
  if (!AXE_REGION_TYPES.includes(type)) throw new Error(`Unknown AXE region type: ${type}`);
  const safeSize = Math.max(1, Number(size) || 1);
  const active = activationRadius ?? Math.max(safeSize * 0.65, 250);
  const unload = unloadRadius ?? Math.max(active * 1.35, active + 100);

  return Object.freeze({
    id: axeName(id),
    name: name || id,
    type,
    center: [...center],
    size: safeSize,
    parentId: parentId ? axeName(parentId) : null,
    priority,
    activationRadius: active,
    unloadRadius: unload,
    lod,
    hibernatesAI,
    tags: [...tags],
    metadata: { ...metadata },
  });
}

export function createAXEPOIData({
  id,
  name,
  position = [0, 0, 0],
  regionId,
  kind = 'Landmark',
  discoveredByDefault = false,
  fastTravel = false,
  accessItemId = null,
  metadata = {},
}) {
  return Object.freeze({
    id: axeName(id),
    name: name || id,
    position: [...position],
    regionId: regionId ? axeName(regionId) : null,
    kind,
    discoveredByDefault,
    fastTravel,
    accessItemId: accessItemId ? axeName(accessItemId) : null,
    metadata: { ...metadata },
  });
}

export function createAXETravelPointData({
  id,
  name,
  position = [0, 0, 0],
  regionId,
  discoveredByDefault = false,
  access = 'discovered',
  requiredItemId = null,
  requiredPowerTier = null,
}) {
  return Object.freeze({
    id: axeName(id),
    name: name || id,
    position: [...position],
    regionId: regionId ? axeName(regionId) : null,
    discoveredByDefault,
    access,
    requiredItemId: requiredItemId ? axeName(requiredItemId) : null,
    requiredPowerTier,
  });
}

const distXZ = (a, b) => {
  const dx = Number(a?.[0] || 0) - Number(b?.[0] || 0);
  const dz = Number(a?.[2] || 0) - Number(b?.[2] || 0);
  return Math.hypot(dx, dz);
};

export class AXEWorldStreamingSystem {
  constructor({
    regions = [],
    pois = [],
    travelPoints = [],
    onActivate = null,
    onDeactivate = null,
    onPOIDiscovered = null,
  } = {}) {
    this.regions = new Map(regions.map((r) => [r.id, r]));
    this.pois = new Map(pois.map((p) => [p.id, p]));
    this.travelPoints = new Map(travelPoints.map((p) => [p.id, p]));
    this.activeRegionIds = new Set();
    this.discoveredPOIIds = new Set(
      pois.filter((p) => p.discoveredByDefault).map((p) => p.id),
    );
    this.discoveredTravelPointIds = new Set(
      travelPoints.filter((p) => p.discoveredByDefault).map((p) => p.id),
    );
    this.onActivate = onActivate;
    this.onDeactivate = onDeactivate;
    this.onPOIDiscovered = onPOIDiscovered;
    this.playerPosition = [0, 0, 0];
  }

  registerRegion(region) {
    this.regions.set(region.id, region);
    return region;
  }

  registerPOI(poi) {
    this.pois.set(poi.id, poi);
    if (poi.discoveredByDefault) this.discoveredPOIIds.add(poi.id);
    return poi;
  }

  registerTravelPoint(point) {
    this.travelPoints.set(point.id, point);
    if (point.discoveredByDefault) this.discoveredTravelPointIds.add(point.id);
    return point;
  }

  update(playerPosition) {
    this.playerPosition = Array.isArray(playerPosition)
      ? [...playerPosition]
      : [playerPosition?.x || 0, playerPosition?.y || 0, playerPosition?.z || 0];

    const ordered = Array.from(this.regions.values()).sort(
      (a, b) => b.priority - a.priority,
    );

    for (const region of ordered) {
      const distance = distXZ(this.playerPosition, region.center);
      const isActive = this.activeRegionIds.has(region.id);

      if (!isActive && distance <= region.activationRadius) {
        this.activeRegionIds.add(region.id);
        this.onActivate?.(region);
      } else if (isActive && distance > region.unloadRadius) {
        this.activeRegionIds.delete(region.id);
        this.onDeactivate?.(region);
      }
    }

    this.discoverNearbyPOIs();
    return this.snapshot();
  }

  discoverNearbyPOIs(radius = 60) {
    for (const poi of this.pois.values()) {
      if (this.discoveredPOIIds.has(poi.id)) continue;
      if (distXZ(this.playerPosition, poi.position) <= radius) {
        this.discoveredPOIIds.add(poi.id);
        if (poi.fastTravel) this.discoveredTravelPointIds.add(poi.id);
        this.onPOIDiscovered?.(poi);
      }
    }
  }

  isRegionActive(id) {
    return this.activeRegionIds.has(axeName(id));
  }

  discoverTravelPoint(id) {
    const safe = axeName(id);
    if (!this.travelPoints.has(safe)) return false;
    this.discoveredTravelPointIds.add(safe);
    return true;
  }

  canUseTravelPoint(id, context = {}) {
    const point = this.travelPoints.get(axeName(id));
    if (!point) return { ok: false, reason: 'missing' };

    if (!this.discoveredTravelPointIds.has(point.id) && point.access === 'discovered') {
      return { ok: false, reason: 'undiscovered' };
    }

    if (point.requiredItemId && !(context.itemIds || []).includes(point.requiredItemId)) {
      return { ok: false, reason: 'required-item', itemId: point.requiredItemId };
    }

    if (point.requiredPowerTier != null && Number(context.powerTier || 0) < Number(point.requiredPowerTier)) {
      return { ok: false, reason: 'required-power-tier', powerTier: point.requiredPowerTier };
    }

    return { ok: true, point };
  }

  snapshot() {
    return {
      activeRegionIds: [...this.activeRegionIds],
      discoveredPOIIds: [...this.discoveredPOIIds],
      discoveredTravelPointIds: [...this.discoveredTravelPointIds],
    };
  }

  restore(snapshot = {}) {
    this.activeRegionIds = new Set(snapshot.activeRegionIds || []);
    this.discoveredPOIIds = new Set(snapshot.discoveredPOIIds || []);
    this.discoveredTravelPointIds = new Set(snapshot.discoveredTravelPointIds || []);
  }
}

export function createAXEInitialWorldManifest() {
  const regions = [
    createAXERegionData({
      id: 'Region_FirstTerritory',
      name: 'First Faction Territory',
      type: 'Wilderness',
      center: [0, 0, 0],
      size: 2500,
      priority: 10,
      tags: ['vertical-slice', 'faction-territory'],
    }),
    createAXERegionData({
      id: 'Region_CapitalReserve',
      name: 'Main Faction Capital Reserve',
      type: 'Capital',
      center: [0, 0, 350],
      size: 1600,
      parentId: 'Region_FirstTerritory',
      priority: 50,
    }),
    createAXERegionData({
      id: 'Region_ForestReserve',
      name: 'Bamboo Forest Reserve',
      type: 'Forest',
      center: [-700, 0, -300],
      size: 900,
      parentId: 'Region_FirstTerritory',
      priority: 15,
    }),
    createAXERegionData({
      id: 'Region_CaveReserve',
      name: 'Cave Network Reserve',
      type: 'CaveNetwork',
      center: [650, 0, -500],
      size: 700,
      parentId: 'Region_FirstTerritory',
      priority: 20,
    }),
    createAXERegionData({
      id: 'Region_SettlementReserve',
      name: 'Future Player Settlement',
      type: 'Settlement',
      center: [-500, 0, 650],
      size: 350,
      parentId: 'Region_FirstTerritory',
      priority: 25,
    }),
    createAXERegionData({
      id: 'Region_ContestedPass',
      name: 'Contested Pass',
      type: 'Contested',
      center: [900, 0, 500],
      size: 500,
      parentId: 'Region_FirstTerritory',
      priority: 30,
    }),
    createAXERegionData({
      id: 'Region_BossBasin',
      name: 'Future Boss Basin',
      type: 'Boss',
      center: [800, 0, -950],
      size: 450,
      parentId: 'Region_FirstTerritory',
      priority: 35,
    }),
  ];

  const pois = [
    createAXEPOIData({
      id: 'POI_CapitalGate',
      name: 'Capital Gate',
      regionId: 'Region_CapitalReserve',
      position: [0, 0, -350],
      kind: 'CityGate',
      discoveredByDefault: true,
      fastTravel: true,
    }),
    createAXEPOIData({
      id: 'POI_CaveEntrance',
      name: 'Cave Entrance',
      regionId: 'Region_CaveReserve',
      position: [650, 0, -500],
      kind: 'CaveEntrance',
    }),
    createAXEPOIData({
      id: 'POI_FutureSettlement',
      name: 'Future Settlement Site',
      regionId: 'Region_SettlementReserve',
      position: [-500, 0, 650],
      kind: 'Settlement',
    }),
  ];

  const travelPoints = [
    createAXETravelPointData({
      id: 'Travel_CapitalGate',
      name: 'Capital Gate',
      regionId: 'Region_CapitalReserve',
      position: [0, 0, -350],
      discoveredByDefault: true,
    }),
    createAXETravelPointData({
      id: 'Travel_SpecialCave',
      name: 'Special Cave',
      regionId: 'Region_CaveReserve',
      position: [650, 0, -500],
      access: 'item',
      requiredItemId: 'Item_SOS_Access',
    }),
  ];

  return { regions, pois, travelPoints };
}
