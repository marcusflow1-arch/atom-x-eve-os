export const ENVIRONMENT_HUB_VERSION = 2;

// The Environment Hub is intentionally small: choose a full-scene wallpaper,
// or build a Home from a house, land and sky/weather. Keep these as the only
// top-level destinations so the dashboard never turns into an asset editor.
export const ENVIRONMENT_TABS = [
  { id: 'wallpaper', label: 'Wallpaper', description: 'Use a cinematic, animated or video dashboard wallpaper.' },
  { id: 'home', label: 'Home', description: 'Choose your house, land and live sky/weather.' },
];

export const HOME_SECTIONS = [
  { id: 'house', label: 'House' },
  { id: 'land', label: 'Land' },
  { id: 'sky', label: 'Sky & Weather' },
];

export const WALLPAPER_PRESETS = [
  {
    id: 'wall-nebula',
    name: 'Living Nebula',
    kind: 'wallpaper',
    mediaType: 'animated',
    image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1600&q=90',
    description: 'Slow drifting space wallpaper with a subtle parallax treatment.',
    unlocked: true,
  },
  {
    id: 'wall-neon-rain',
    name: 'Neon Rain',
    kind: 'wallpaper',
    mediaType: 'animated',
    image: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1600&q=90',
    description: 'Soft neon motion for a cyber dashboard backdrop.',
    unlocked: true,
  },
  {
    id: 'wall-moon',
    name: 'Moon Panorama',
    kind: 'wallpaper',
    mediaType: 'image',
    image: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1600&q=90',
    description: 'Clean cinematic moon wallpaper.',
    unlocked: true,
  },
];

// Open Land is the safe starter state. Real 3D houses are populated at runtime
// from Model3D / ModelFBX / SceneLayout and are unlocked by UserAchievement.
export const HOME_PRESETS = [
  {
    id: 'home-open-land',
    name: 'Open Land',
    kind: 'home',
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1400&q=85',
    description: 'Starter home space. Add an achievement-unlocked 3D house whenever you want.',
    unlocked: true,
    starter: true,
    modelUrl: null,
  },
];

export const LAND_PRESETS = [
  {
    id: 'land-grass',
    name: 'Grass',
    kind: 'land',
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&q=85',
    description: 'Default soft grass terrain.',
    unlocked: true,
  },
  {
    id: 'land-snow',
    name: 'Snow',
    kind: 'land',
    image: 'https://images.unsplash.com/photo-1483664852095-d6cc6870702d?w=1200&q=85',
    description: 'Clean snow-covered terrain.',
    unlocked: true,
  },
  {
    id: 'land-stone',
    name: 'Dark Stone',
    kind: 'land',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=85',
    description: 'Minimal dark ground for modern and sci-fi homes.',
    unlocked: true,
  },
];

export const SKY_PRESETS = [
  {
    id: 'sky-live',
    name: 'Real-Time Sky',
    kind: 'sky',
    description: 'Automatically follows your device time through dawn, day, sunset and night.',
    unlocked: true,
    realtime: true,
  },
  {
    id: 'sky-blue',
    name: 'Clear Day',
    kind: 'sky',
    image: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1400&q=85',
    description: 'Manual bright daytime sky.',
    unlocked: true,
  },
  {
    id: 'sky-sunset',
    name: 'Sunset',
    kind: 'sky',
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1400&q=85',
    description: 'Manual warm evening sky.',
    unlocked: true,
  },
  {
    id: 'sky-moon',
    name: 'Moonlit',
    kind: 'sky',
    image: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1400&q=85',
    description: 'Manual moon and star field.',
    unlocked: true,
  },
];

export const WEATHER_PRESETS = [
  { id: 'weather-clear', name: 'Clear', kind: 'weather', description: 'No weather overlay.', unlocked: true },
  { id: 'weather-rain', name: 'Rain', kind: 'weather', description: 'Rain atmosphere.', unlocked: true },
  { id: 'weather-snow', name: 'Snow', kind: 'weather', description: 'Snowfall atmosphere.', unlocked: true },
  { id: 'weather-fog', name: 'Fog', kind: 'weather', description: 'Soft low-visibility fog.', unlocked: true },
  { id: 'weather-storm', name: 'Storm', kind: 'weather', description: 'Dark storm atmosphere.', unlocked: true },
];

export const DEFAULT_ENVIRONMENT_CONFIG = {
  version: ENVIRONMENT_HUB_VERSION,
  mode: 'home',
  wallpaperId: 'wall-nebula',
  wallpaperAsset: null,
  homeId: 'home-open-land',
  homeAsset: null,
  landId: 'land-grass',
  skyId: 'sky-live',
  weatherId: 'weather-clear',
};

export function normalizeEnvironmentConfig(input = {}) {
  const source = input || {};
  const isLegacy = Number(source.version || 0) < ENVIRONMENT_HUB_VERSION;
  const migratedMode = source.mode === 'wallpaper' ? 'wallpaper' : 'home';
  const next = {
    ...DEFAULT_ENVIRONMENT_CONFIG,
    ...source,
    version: ENVIRONMENT_HUB_VERSION,
    mode: migratedMode,
  };

  // Version 1 had a much larger composer with independent environment,
  // background, garden and music layers. Collapse those settings cleanly into
  // the new Home defaults instead of leaving invisible legacy selections.
  if (isLegacy) {
    next.homeId = 'home-open-land';
    next.homeAsset = null;
    next.landId = 'land-grass';
    next.skyId = 'sky-live';
    next.weatherId = source.weatherId || 'weather-clear';
  }

  if (!next.skyId) next.skyId = 'sky-live';
  if (!next.landId) next.landId = 'land-grass';
  if (!next.homeId) next.homeId = 'home-open-land';
  if (!next.wallpaperId) next.wallpaperId = 'wall-nebula';
  if (!next.weatherId) next.weatherId = 'weather-clear';

  return next;
}

export function configStorageKey(userId) {
  return `atomxe.environmentHub.${userId || 'guest'}`;
}

export function assetSnapshot(item) {
  if (!item) return null;
  return {
    id: item.id,
    name: item.name,
    image: item.image || '',
    modelUrl: item.modelUrl || '',
    videoUrl: item.videoUrl || '',
    mediaType: item.mediaType || '',
    bundledLand: Boolean(item.bundledLand),
    source: item.source || '',
  };
}

export function findPresetById(id, catalogs = {}) {
  if (!id) return null;
  const groups = [
    catalogs.wallpapers || WALLPAPER_PRESETS,
    catalogs.homes || HOME_PRESETS,
    LAND_PRESETS,
    SKY_PRESETS,
    WEATHER_PRESETS,
  ];
  for (const group of groups) {
    const found = group.find((item) => item.id === id);
    if (found) return found;
  }
  return null;
}

// Compatibility exports keep any older internal imports safe while the visible
// hub stays intentionally limited to Wallpaper and Home.
export const ENVIRONMENT_PRESETS = LAND_PRESETS;
export const SKYBOX_PRESETS = SKY_PRESETS;
export const BACKGROUND_PRESETS = [];
export const GARDEN_PRESETS = [];
export const COMPANION_PRESETS = [];
export const MUSIC_PRESETS = [];
export const GENRES = ['All'];
