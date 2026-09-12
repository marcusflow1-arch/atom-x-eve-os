export const ENVIRONMENT_HUB_VERSION = 3;

// Environment Hub is an editor over the live Luna scene. Nothing in this
// catalog is a screenshot or a fake environment; runtime asset lists come from
// the Admin-managed SceneLayout / Model3D / ModelFBX entities.
export const ENVIRONMENT_TABS = [
  { id: 'world', label: 'World', description: 'Choose the live 3D environment behind Luna.' },
  { id: 'home', label: 'Home', description: 'Choose an achievement-unlocked residence.' },
  { id: 'skybox', label: 'Skybox', description: 'Choose an Admin-managed sky or atmosphere asset.' },
  { id: 'addons', label: 'Add-ons', description: 'Browse real world modules such as farms, gyms, parks and courts.' },
  { id: 'upgrades', label: 'Upgrades', description: 'Jump to your real card and equipment upgrade systems.' },
];

export const ADDON_GROUPS = [
  { id: 'farm', label: 'Farm', pattern: /farm|crop|agriculture|greenhouse|orchard|garden/i },
  { id: 'fitness', label: 'Workout', pattern: /gym|fitness|workout|training/i },
  { id: 'basketball', label: 'Basketball', pattern: /basketball|hoop|court/i },
  { id: 'park', label: 'Park', pattern: /park|trail|walkway|walking|plaza/i },
  { id: 'track', label: 'Running Track', pattern: /running|track|jog|sprint/i },
  { id: 'theme-park', label: 'Theme Park', pattern: /theme park|amusement|ride|roller.?coaster|ferris/i },
];

export const WEATHER_PRESETS = [
  { id: 'weather-clear', name: 'Clear' },
  { id: 'weather-rain', name: 'Rain' },
  { id: 'weather-snow', name: 'Snow' },
  { id: 'weather-fog', name: 'Fog' },
  { id: 'weather-storm', name: 'Storm' },
];

export const DEFAULT_ENVIRONMENT_CONFIG = {
  version: ENVIRONMENT_HUB_VERSION,
  mode: 'world',
  environmentId: null,
  environmentAsset: null,
  homeId: null,
  homeAsset: null,
  skyboxId: null,
  skyboxAsset: null,
  addonIds: [],
  addonAssets: [],
  weatherId: 'weather-clear',
};

export function normalizeEnvironmentConfig(input = {}) {
  const source = input || {};
  const next = {
    ...DEFAULT_ENVIRONMENT_CONFIG,
    ...source,
    version: ENVIRONMENT_HUB_VERSION,
  };

  // Version 2 used hard-coded image wallpapers, land cards and synthetic sky
  // previews. Do not carry those presentation-only selections into the live
  // 3D editor. Preserve only genuine asset snapshots that have model URLs.
  if (Number(source.version || 0) < ENVIRONMENT_HUB_VERSION) {
    next.mode = 'world';
    next.environmentId = source.environmentAsset?.modelUrl ? source.environmentId : null;
    next.environmentAsset = source.environmentAsset?.modelUrl ? source.environmentAsset : null;
    next.homeId = source.homeAsset?.modelUrl ? source.homeId : null;
    next.homeAsset = source.homeAsset?.modelUrl ? source.homeAsset : null;
    next.skyboxId = null;
    next.skyboxAsset = null;
    next.addonIds = [];
    next.addonAssets = [];
  }

  if (!ENVIRONMENT_TABS.some((tab) => tab.id === next.mode)) next.mode = 'world';
  if (!Array.isArray(next.addonIds)) next.addonIds = [];
  if (!Array.isArray(next.addonAssets)) next.addonAssets = [];
  if (!WEATHER_PRESETS.some((item) => item.id === next.weatherId)) next.weatherId = 'weather-clear';

  // Purge the old image-only fields so saved config can no longer resurrect a
  // screenshot-style dashboard background.
  delete next.wallpaperId;
  delete next.wallpaperAsset;
  delete next.landId;
  delete next.skyId;
  return next;
}

export function configStorageKey(userId) {
  return `atomxe.environmentHub.${userId || 'guest'}`;
}

export function assetSnapshot(item) {
  if (!item) return null;
  return {
    id: item.id,
    sourceEntityId: item.sourceEntityId || '',
    name: item.name || '',
    description: item.description || '',
    modelUrl: item.modelUrl || '',
    source: item.source || '',
    kind: item.kind || '',
    category: item.category || '',
    tags: Array.isArray(item.tags) ? item.tags : [],
    bundledLand: Boolean(item.bundledLand),
    addonGroup: item.addonGroup || '',
  };
}

export function findPresetById(id, catalogs = {}) {
  if (!id) return null;
  const groups = [
    catalogs.worlds || [],
    catalogs.homes || [],
    catalogs.skyboxes || [],
    catalogs.addons || [],
  ];
  for (const group of groups) {
    const found = group.find((item) => item.id === id);
    if (found) return found;
  }
  return null;
}

// Compatibility exports for older imports. They intentionally contain no
// image presets. Real assets are loaded from Admin at runtime.
export const WALLPAPER_PRESETS = [];
export const HOME_PRESETS = [];
export const LAND_PRESETS = [];
export const SKY_PRESETS = [];
export const ENVIRONMENT_PRESETS = [];
export const SKYBOX_PRESETS = [];
export const BACKGROUND_PRESETS = [];
export const GARDEN_PRESETS = [];
export const COMPANION_PRESETS = [];
export const MUSIC_PRESETS = [];
export const HOME_SECTIONS = [];
export const GENRES = ['All'];