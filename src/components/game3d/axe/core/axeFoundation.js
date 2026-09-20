// AXE Prompt 001 — project foundation / core architecture for the browser 3D world.
// The Three.js runtime uses 1 world unit ~= 1 real-world meter.
// This module is intentionally framework-agnostic and data-driven so later prompts
// can extend systems without rewriting GameWorld3D.

export const AXE_NAMESPACE = 'AXE_';
export const AXE_SCHEMA_VERSION = 1;
export const AXE_ENGINE_UNITS_PER_METER = 1;

export const AXE_SYSTEM_CATEGORIES = Object.freeze([
  'Core',
  'World',
  'Regions',
  'Cities',
  'Settlements',
  'Housing',
  'Characters',
  'Players',
  'NPCs',
  'Enemies',
  'Bosses',
  'Combat',
  'Skills',
  'Weapons',
  'Equipment',
  'Items',
  'Gems',
  'SetBonuses',
  'Companions',
  'Quests',
  'Campaigns',
  'Factions',
  'Clans',
  'Families',
  'Marriage',
  'Children',
  'Inventory',
  'Crafting',
  'Trading',
  'VFX',
  'Animation',
  'Audio',
  'UI',
  'Networking',
  'SaveData',
  'Development',
]);

export const AXE_FOUNDATION = Object.freeze({
  projectId: 'axe_game3d',
  namespace: AXE_NAMESPACE,
  schemaVersion: AXE_SCHEMA_VERSION,
  worldScale: Object.freeze({
    unitsPerMeter: AXE_ENGINE_UNITS_PER_METER,
    metersPerUnit: 1 / AXE_ENGINE_UNITS_PER_METER,
  }),
  streaming: Object.freeze({
    strategy: 'region-cells',
    asyncAssetLoading: true,
    lod: true,
    instancing: true,
    vegetationStreaming: true,
    occlusionCulling: true,
  }),
  multiplayer: Object.freeze({
    serverAuthoritativeCombat: true,
    replicatedPlayerState: true,
    replicatedEquipment: true,
    persistentCharacterIdentity: true,
  }),
  persistence: Object.freeze({
    envelopeSchemaVersion: AXE_SCHEMA_VERSION,
    keyFormat: 'AXE_<system>:<accountId>:<characterId>',
    systemsOwnTheirPayloads: true,
  }),
  modularity: Object.freeze({
    dataDrivenDefinitions: true,
    crossSystemMessaging: 'events-and-interfaces',
    hardCodedContentBranchesAllowed: false,
  }),
  defaults: Object.freeze({
    playerHeightMeters: 1.8,
    walkSpeedMetersPerSecond: 4,
    runSpeedMetersPerSecond: 9,
  }),
});

export function axeName(subject) {
  const cleaned = String(subject || '')
    .trim()
    .replace(/[^A-Za-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned.startsWith(AXE_NAMESPACE) ? cleaned : `${AXE_NAMESPACE}${cleaned}`;
}

export function axePersistenceKey(system, accountId = 'local', characterId = 'default') {
  return `${axeName(system)}:${accountId || 'local'}:${characterId || 'default'}`;
}

export function createAXESaveEnvelope({
  system,
  accountId = 'local',
  characterId = 'default',
  payload = null,
  schemaVersion = AXE_SCHEMA_VERSION,
}) {
  return {
    schemaVersion,
    key: axePersistenceKey(system, accountId, characterId),
    system: axeName(system),
    accountId,
    characterId,
    savedAt: new Date().toISOString(),
    payload,
  };
}

export function validateAXESaveEnvelope(envelope) {
  return !!(
    envelope &&
    Number.isFinite(Number(envelope.schemaVersion)) &&
    typeof envelope.key === 'string' &&
    envelope.key.startsWith(AXE_NAMESPACE) &&
    typeof envelope.system === 'string' &&
    envelope.system.startsWith(AXE_NAMESPACE)
  );
}

export function makeAXEDefinition({
  id,
  displayName = '',
  description = '',
  tags = [],
  icon = null,
  schemaVersion = AXE_SCHEMA_VERSION,
  data = {},
}) {
  if (!id) throw new Error('AXE definition requires an id');
  return Object.freeze({
    definitionId: axeName(id),
    displayName,
    description,
    tags: [...tags],
    icon,
    schemaVersion,
    ...data,
  });
}

export function createAXEModuleDescriptor({
  id,
  category,
  version = 1,
  enabled = true,
  dependencies = [],
  description = '',
}) {
  if (!AXE_SYSTEM_CATEGORIES.includes(category)) {
    throw new Error(`Unknown AXE module category: ${category}`);
  }

  return Object.freeze({
    id: axeName(id),
    category,
    version,
    enabled,
    dependencies: dependencies.map(axeName),
    description,
  });
}

// Shared registry for runtime-discoverable modules. Later systems register themselves
// here instead of adding content-specific switch statements to GameWorld3D.
const moduleRegistry = new Map();

export const AXE_MODULE_REGISTRY = Object.freeze({
  register(descriptor) {
    if (!descriptor?.id) throw new Error('AXE module descriptor requires an id');
    moduleRegistry.set(descriptor.id, descriptor);
    return descriptor;
  },
  unregister(id) {
    moduleRegistry.delete(axeName(id));
  },
  get(id) {
    return moduleRegistry.get(axeName(id)) || null;
  },
  has(id) {
    return moduleRegistry.has(axeName(id));
  },
  list() {
    return Array.from(moduleRegistry.values());
  },
});

AXE_MODULE_REGISTRY.register(
  createAXEModuleDescriptor({
    id: 'CoreFoundation',
    category: 'Core',
    description: 'Prompt 001 browser-game foundation and shared AXE contracts.',
  }),
);
