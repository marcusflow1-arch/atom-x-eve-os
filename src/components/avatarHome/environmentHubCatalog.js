export const ENVIRONMENT_HUB_VERSION = 1;

export const ENVIRONMENT_TABS = [
  { id: 'environment', label: '3D Environment', description: 'Walkable land and world geometry.' },
  { id: 'skybox', label: 'Skybox', description: 'Sky, horizon and atmosphere around a 3D environment.' },
  { id: 'background', label: '3D Background', description: 'A presentation backdrop when a full walkable world is not active.' },
  { id: 'wallpaper', label: '3D Wallpaper', description: 'Full-scene animated or static wallpaper. Replaces environment layers.' },
  { id: 'home', label: 'Home', description: 'House, castle, container home and other unlockable residences.' },
  { id: 'garden', label: 'Garden + Companion', description: 'Outdoor decoration and companion presence.' },
  { id: 'music', label: 'Music', description: 'Ambient soundtrack for your Luna home.' },
  { id: 'weather', label: 'Weather', description: 'Weather presentation and optional skybox sync.' },
  { id: 'friends', label: 'Friends + Visits', description: 'Invite friends or visit their Luna environment.' },
];

export const GENRES = ['All', 'Sci-Fi', 'Fantasy', 'Anime', 'Cyberpunk', 'Adventure', 'Horror', 'Simulation', 'Cozy', 'Modern'];

export const ENVIRONMENT_PRESETS = [
  { id: 'env-neon-rooftop', name: 'Neon Rooftop District', genre: 'Cyberpunk', kind: 'environment', image: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1200&q=85', description: 'Walkable city rooftop environment.', unlocked: true },
  { id: 'env-sky-city', name: 'Floating Sky City', genre: 'Fantasy', kind: 'environment', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=85', description: 'Open-air floating-island environment.', unlocked: true },
  { id: 'env-orbital', name: 'Orbital Frontier', genre: 'Sci-Fi', kind: 'environment', image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&q=85', description: 'Walkable orbital-platform environment.', unlocked: true },
  { id: 'env-verdant', name: 'Verdant Sanctuary', genre: 'Adventure', kind: 'environment', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=85', description: 'Forest clearing with room for a home and garden.', unlocked: true },
];

export const SKYBOX_PRESETS = [
  { id: 'sky-moon', name: 'Moonlit Orbit', genre: 'Sci-Fi', kind: 'skybox', image: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1200&q=85', description: 'Deep-space moon and star field.', unlocked: true },
  { id: 'sky-nebula', name: 'Blue Nebula', genre: 'Sci-Fi', kind: 'skybox', image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&q=85', description: 'Cold blue stellar cloudscape.', unlocked: true },
  { id: 'sky-sunset', name: 'Golden Horizon', genre: 'Adventure', kind: 'skybox', image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&q=85', description: 'Warm sunset horizon.', unlocked: true },
  { id: 'sky-storm', name: 'Stormfront', genre: 'Horror', kind: 'skybox', image: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=1200&q=85', description: 'Heavy storm clouds for weather-linked worlds.', unlocked: true, weatherLinked: true },
];

export const BACKGROUND_PRESETS = [
  { id: 'bg-anime-city', name: 'Anime Skyline', genre: 'Anime', kind: 'background', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=85', description: 'Stylized skyline presentation background.', unlocked: true },
  { id: 'bg-cyber-alley', name: 'Cyber Alley', genre: 'Cyberpunk', kind: 'background', image: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1200&q=85', description: 'Neon urban 3D-style presentation scene.', unlocked: true },
  { id: 'bg-fantasy-vista', name: 'Mythic Vista', genre: 'Fantasy', kind: 'background', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=85', description: 'Fantasy horizon behind the avatar stage.', unlocked: true },
  { id: 'bg-minimal', name: 'Obsidian Studio', genre: 'Modern', kind: 'background', image: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&q=85', description: 'Clean dark architectural presentation stage.', unlocked: true },
];

export const WALLPAPER_PRESETS = [
  { id: 'wall-nebula', name: 'Living Nebula', genre: 'Sci-Fi', kind: 'wallpaper', image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1400&q=90', description: 'Animated slow-drift full-scene wallpaper.', unlocked: true, animated: true },
  { id: 'wall-neon-rain', name: 'Neon Rain', genre: 'Cyberpunk', kind: 'wallpaper', image: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1400&q=90', description: 'Animated rain and neon parallax wallpaper.', unlocked: true, animated: true },
  { id: 'wall-moon', name: 'Shattered Moon', genre: 'Fantasy', kind: 'wallpaper', image: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1400&q=90', description: 'Static cinematic moon wallpaper.', unlocked: true, animated: false },
];

export const HOME_PRESETS = [
  {
    id: 'home-container', name: 'Modular Shipping Container', genre: 'Modern', kind: 'home',
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=85',
    description: 'Compact container residence. Framed wide so the full structure remains visible behind the avatar.',
    unlocked: true, stageScale: 0.72, cameraDistance: 1.35, framing: 'wide', priority: true,
  },
  { id: 'home-house', name: 'Modern House', genre: 'Modern', kind: 'home', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85', description: 'Modern unlockable home.', unlocked: true, stageScale: 0.86, cameraDistance: 1.1 },
  { id: 'home-castle', name: 'Highland Castle', genre: 'Fantasy', kind: 'home', image: 'https://images.unsplash.com/photo-1520637836862-4d197d17c46a?w=1200&q=85', description: 'Large fantasy residence with a wider camera frame.', unlocked: true, stageScale: 0.64, cameraDistance: 1.5, framing: 'wide' },
  { id: 'home-loft', name: 'Skyline Loft', genre: 'Cyberpunk', kind: 'home', image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&q=85', description: 'Compact elevated apartment home.', unlocked: true, stageScale: 0.9, cameraDistance: 1.0 },
];

export const GARDEN_PRESETS = [
  { id: 'garden-off', name: 'No Garden', genre: 'All', kind: 'garden', image: '', description: 'Keep the residence exterior clear.', unlocked: true },
  { id: 'garden-zen', name: 'Zen Garden', genre: 'Cozy', kind: 'garden', image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1000&q=85', description: 'Stone, moss and quiet garden accents.', unlocked: true },
  { id: 'garden-neon', name: 'Neon Planters', genre: 'Cyberpunk', kind: 'garden', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1000&q=85', description: 'Futuristic illuminated planters.', unlocked: true },
  { id: 'garden-wild', name: 'Wildflower Field', genre: 'Adventure', kind: 'garden', image: 'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?w=1000&q=85', description: 'Natural flowering foreground.', unlocked: true },
];

export const COMPANION_PRESETS = [
  { id: 'companion-active', name: 'Active AI Companion', genre: 'All', kind: 'companion', description: 'Use the companion currently equipped to your AI avatar.', unlocked: true },
  { id: 'companion-off', name: 'No Companion', genre: 'All', kind: 'companion', description: 'Keep the home stage private and empty.', unlocked: true },
];

export const MUSIC_PRESETS = [
  { id: 'music-none', name: 'No Music', genre: 'All', kind: 'music', description: 'Disable environment music.', unlocked: true },
  { id: 'music-orbit', name: 'Orbital Ambience', genre: 'Sci-Fi', kind: 'music', description: 'Low, spacious ambient score.', unlocked: true },
  { id: 'music-neon', name: 'Neon Lo-Fi', genre: 'Cyberpunk', kind: 'music', description: 'Relaxed electronic dashboard mix.', unlocked: true },
  { id: 'music-hearth', name: 'Fantasy Hearth', genre: 'Fantasy', kind: 'music', description: 'Warm orchestral home ambience.', unlocked: true },
  { id: 'music-cozy', name: 'Quiet Home', genre: 'Cozy', kind: 'music', description: 'Minimal calm room ambience.', unlocked: true },
];

export const WEATHER_PRESETS = [
  { id: 'weather-clear', name: 'Clear', genre: 'All', kind: 'weather', description: 'Clear conditions.', unlocked: true },
  { id: 'weather-rain', name: 'Rain', genre: 'All', kind: 'weather', description: 'Rain layer with reflective atmosphere.', unlocked: true },
  { id: 'weather-snow', name: 'Snow', genre: 'All', kind: 'weather', description: 'Snowfall environment layer.', unlocked: true },
  { id: 'weather-storm', name: 'Storm', genre: 'All', kind: 'weather', description: 'Dark clouds, wind and lightning presentation.', unlocked: true },
  { id: 'weather-fog', name: 'Fog', genre: 'All', kind: 'weather', description: 'Low-visibility atmospheric fog.', unlocked: true },
];

export const DEFAULT_ENVIRONMENT_CONFIG = {
  version: ENVIRONMENT_HUB_VERSION,
  mode: 'environment',
  environmentId: null,
  skyboxId: 'sky-moon',
  backgroundId: null,
  wallpaperId: null,
  homeId: 'home-container',
  gardenId: 'garden-off',
  companionId: 'companion-active',
  musicId: 'music-none',
  weatherId: 'weather-clear',
  syncSkyboxToWeather: false,
  visibility: 'friends',
};

export function normalizeEnvironmentConfig(input = {}) {
  const next = { ...DEFAULT_ENVIRONMENT_CONFIG, ...(input || {}), version: ENVIRONMENT_HUB_VERSION };
  if (next.mode === 'wallpaper') {
    next.environmentId = null;
    next.skyboxId = null;
    next.backgroundId = null;
    next.homeId = null;
    next.gardenId = null;
    next.companionId = 'companion-off';
    next.weatherId = null;
    next.syncSkyboxToWeather = false;
  } else if (next.mode === 'background') {
    next.environmentId = null;
    next.skyboxId = null;
    next.wallpaperId = null;
    next.homeId = null;
    next.gardenId = null;
    next.companionId = 'companion-off';
    next.weatherId = null;
    next.syncSkyboxToWeather = false;
  } else {
    next.mode = 'environment';
    next.backgroundId = null;
    next.wallpaperId = null;
  }
  return next;
}

export function configStorageKey(userId) {
  return `atomxe.environmentHub.${userId || 'guest'}`;
}

export function findPresetById(id, catalogs = {}) {
  if (!id) return null;
  const groups = [
    catalogs.environments || ENVIRONMENT_PRESETS,
    SKYBOX_PRESETS,
    BACKGROUND_PRESETS,
    WALLPAPER_PRESETS,
    catalogs.homes || HOME_PRESETS,
    GARDEN_PRESETS,
    COMPANION_PRESETS,
    MUSIC_PRESETS,
    WEATHER_PRESETS,
  ];
  for (const group of groups) {
    const found = group.find((item) => item.id === id);
    if (found) return found;
  }
  return null;
}
