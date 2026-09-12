import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Box, Check, ChevronRight, CloudRain, Gamepad2, Globe2, Home, Image, Layers3,
  Lock, Music2, Search, Sparkles, Trees, Users, Volume2, Wallpaper, X, Zap,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import FriendsListContent from '@/components/dashboard/FriendsListContent';
import {
  BACKGROUND_PRESETS,
  COMPANION_PRESETS,
  DEFAULT_ENVIRONMENT_CONFIG,
  ENVIRONMENT_PRESETS,
  ENVIRONMENT_TABS,
  GARDEN_PRESETS,
  GENRES,
  HOME_PRESETS,
  MUSIC_PRESETS,
  SKYBOX_PRESETS,
  WALLPAPER_PRESETS,
  WEATHER_PRESETS,
  configStorageKey,
  findPresetById,
  normalizeEnvironmentConfig,
} from './environmentHubCatalog';

const TAB_ICONS = {
  environment: Globe2,
  skybox: Sparkles,
  background: Image,
  wallpaper: Wallpaper,
  home: Home,
  garden: Trees,
  music: Music2,
  weather: CloudRain,
  friends: Users,
};

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&q=85',
  'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1200&q=85',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=85',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=85',
];

const isEnvironmentButton = (target) => {
  const button = target instanceof Element ? target.closest('button') : null;
  if (!button) return false;
  const text = (button.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
  return text === 'environment hubs' || text.includes('environment hubs');
};

const inferGenre = (value = '') => {
  const source = String(value).toLowerCase();
  if (source.includes('anime')) return 'Anime';
  if (source.includes('cyber') || source.includes('neon')) return 'Cyberpunk';
  if (source.includes('space') || source.includes('sci') || source.includes('orbit')) return 'Sci-Fi';
  if (source.includes('fantasy') || source.includes('castle') || source.includes('medieval')) return 'Fantasy';
  if (source.includes('horror') || source.includes('dark')) return 'Horror';
  if (source.includes('cozy') || source.includes('garden')) return 'Cozy';
  if (source.includes('modern') || source.includes('house') || source.includes('container')) return 'Modern';
  return 'Adventure';
};

function readSavedConfig(userId) {
  if (typeof window === 'undefined') return DEFAULT_ENVIRONMENT_CONFIG;
  try {
    const raw = localStorage.getItem(configStorageKey(userId));
    return normalizeEnvironmentConfig(raw ? JSON.parse(raw) : DEFAULT_ENVIRONMENT_CONFIG);
  } catch {
    return normalizeEnvironmentConfig(DEFAULT_ENVIRONMENT_CONFIG);
  }
}

function WorldPreview({ config, environments, homes }) {
  const catalogs = { environments, homes };
  const environment = findPresetById(config.environmentId, catalogs) || environments[0] || null;
  const skybox = findPresetById(config.skyboxId, catalogs);
  const background = findPresetById(config.backgroundId, catalogs);
  const wallpaper = findPresetById(config.wallpaperId, catalogs);
  const home = findPresetById(config.homeId, catalogs);
  const garden = findPresetById(config.gardenId, catalogs);
  const weather = findPresetById(config.weatherId, catalogs);

  const base = config.mode === 'wallpaper'
    ? wallpaper
    : config.mode === 'background'
      ? background
      : (environment || skybox);

  return (
    <div className="relative h-full min-h-[180px] overflow-hidden rounded-[22px] bg-[#050a12]">
      {base?.image && (
        <motion.img
          key={`${config.mode}-${base.id}`}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 0.78, scale: config.mode === 'wallpaper' && base.animated ? [1.02, 1.08, 1.02] : 1.03 }}
          transition={config.mode === 'wallpaper' && base.animated ? { duration: 14, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.45 }}
          src={base.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {config.mode === 'environment' && skybox?.image && (
        <img src={skybox.image} alt="" className="absolute inset-x-0 top-0 h-[58%] w-full object-cover opacity-55 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,transparent_0%,rgba(2,6,13,.08)_42%,rgba(2,6,13,.82)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#03070d]/95 via-[#03070d]/30 to-transparent" />

      {config.mode === 'environment' && home?.image && (
        <motion.div
          key={home.id}
          initial={{ opacity: 0, y: 20, scale: 0.94 }}
          animate={{ opacity: 0.76, y: 0, scale: home.stageScale || 0.82 }}
          className="absolute bottom-[-8%] left-[10%] right-[10%] h-[70%] origin-bottom"
          style={{ perspective: 900 }}
        >
          <img
            src={home.image}
            alt=""
            className="h-full w-full object-contain object-bottom"
            style={{ filter: 'saturate(.78) contrast(1.03)', maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)' }}
          />
        </motion.div>
      )}

      {config.mode === 'environment' && garden?.id && garden.id !== 'garden-off' && garden.image && (
        <img src={garden.image} alt="" className="absolute -bottom-[24%] left-0 h-[58%] w-full object-cover opacity-42 [mask-image:linear-gradient(to_top,black,transparent)]" />
      )}

      {config.mode === 'environment' && config.weatherId === 'weather-rain' && (
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(112deg, transparent 0 16px, rgba(180,225,255,.52) 17px, transparent 18px 28px)', backgroundSize: '150% 150%' }} />
      )}
      {config.mode === 'environment' && config.weatherId === 'weather-fog' && <div className="absolute inset-0 bg-slate-200/15 backdrop-blur-[2px]" />}
      {config.mode === 'environment' && config.weatherId === 'weather-storm' && <div className="absolute inset-0 bg-slate-950/35" />}
      {config.mode === 'environment' && config.weatherId === 'weather-snow' && (
        <div className="absolute inset-0 opacity-55" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.9) 0 1px, transparent 1.6px)', backgroundSize: '24px 24px' }} />
      )}

      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/30 px-3 py-1.5 backdrop-blur-xl">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.8)]" />
        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/70">Live Composition Preview</span>
      </div>
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-white">{base?.name || 'Blank Environment'}</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/45">
            {config.mode === 'environment' ? `${home?.name || 'No Home'} · ${weather?.name || 'No Weather'}` : config.mode}
          </div>
        </div>
        {home?.id === 'home-container' && config.mode === 'environment' && (
          <span className="rounded-full bg-cyan-300/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.15em] text-cyan-100/80">Wide Framing · 72%</span>
        )}
      </div>
    </div>
  );
}

function CatalogCard({ item, selected, disabled, onSelect }) {
  return (
    <button
      type="button"
      disabled={disabled || item.unlocked === false}
      onClick={() => onSelect(item)}
      className={`group relative min-h-[138px] overflow-hidden rounded-[18px] text-left transition-all duration-300 ${disabled ? 'cursor-not-allowed opacity-30 grayscale' : 'hover:-translate-y-1'} ${selected ? 'ring-1 ring-cyan-200/55' : ''}`}
      style={{ background: 'rgba(255,255,255,.045)', boxShadow: selected ? '0 0 30px rgba(34,211,238,.10)' : 'none' }}
    >
      {item.image ? (
        <img src={item.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105" />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(103,232,249,.12),transparent_38%),linear-gradient(135deg,rgba(255,255,255,.06),rgba(255,255,255,.015))]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#02050a] via-[#02050a]/55 to-transparent" />
      <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
        <span className="rounded-full bg-black/35 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.15em] text-white/55 backdrop-blur-md">{item.genre || 'All'}</span>
        {selected ? <span className="grid h-6 w-6 place-items-center rounded-full bg-cyan-200 text-slate-950"><Check className="h-3.5 w-3.5" /></span> : item.unlocked === false ? <Lock className="h-3.5 w-3.5 text-white/45" /> : null}
      </div>
      <div className="absolute bottom-3 left-3 right-3">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-white">{item.name}</span>
          {item.animated && <span className="rounded bg-fuchsia-400/15 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-fuchsia-200">Animated</span>}
          {item.priority && <span className="rounded bg-cyan-300/15 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-cyan-100">Featured</span>}
        </div>
        <p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-white/43">{item.description}</p>
      </div>
    </button>
  );
}

function EmptyDisabledState({ mode, tab }) {
  return (
    <div className="grid min-h-[260px] place-items-center rounded-[22px] bg-white/[0.025] p-8 text-center">
      <div>
        <Lock className="mx-auto h-6 w-6 text-white/20" />
        <div className="mt-3 text-sm font-semibold text-white/65">{tab} is unavailable in {mode} mode</div>
        <p className="mx-auto mt-1 max-w-md text-[11px] leading-relaxed text-white/35">Switch back to 3D Environment mode to layer land, skybox, home, garden, companion and weather together.</p>
      </div>
    </div>
  );
}

function StackRow({ label, value, disabled }) {
  return (
    <div className={`flex items-center justify-between gap-3 py-2 ${disabled ? 'opacity-30' : ''}`}>
      <span className="text-[9px] uppercase tracking-[0.15em] text-white/35">{label}</span>
      <span className="max-w-[160px] truncate text-[10px] font-medium text-white/70">{value || 'Off'}</span>
    </div>
  );
}

export default function EnvironmentHubWorkspace() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('environment');
  const [genre, setGenre] = useState('All');
  const [query, setQuery] = useState('');
  const [unlockedOnly, setUnlockedOnly] = useState(false);
  const [config, setConfig] = useState(() => readSavedConfig(user?.id));
  const [environments, setEnvironments] = useState(ENVIRONMENT_PRESETS);
  const [homes, setHomes] = useState(HOME_PRESETS);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    setConfig(readSavedConfig(user?.id));
  }, [user?.id]);

  useEffect(() => {
    const handleClick = (event) => {
      if (!isEnvironmentButton(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      window.dispatchEvent(new CustomEvent('environmentPanelClose'));
      setOpen(true);
    };
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const handleSurface = (event) => {
      if (event.detail?.mode && event.detail.mode !== 'dashboard') setOpen(false);
    };
    document.addEventListener('click', handleClick, true);
    window.addEventListener('openEnvironmentHub', handleOpen);
    window.addEventListener('closeEnvironmentHub', handleClose);
    window.addEventListener('lunaDashboardOverlayState', handleSurface);
    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('openEnvironmentHub', handleOpen);
      window.removeEventListener('closeEnvironmentHub', handleClose);
      window.removeEventListener('lunaDashboardOverlayState', handleSurface);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    };
    window.addEventListener('keydown', onKey, true);
    document.body.dataset.environmentHubOpen = 'true';
    return () => {
      window.removeEventListener('keydown', onKey, true);
      delete document.body.dataset.environmentHubOpen;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !user?.id) return undefined;
    let cancelled = false;
    (async () => {
      setLoadingAssets(true);
      try {
        const [layouts, models3d, modelsFbx] = await Promise.all([
          base44.entities.SceneLayout.list().catch(() => []),
          base44.entities.Model3D.list().catch(() => []),
          base44.entities.ModelFBX.list().catch(() => []),
        ]);
        if (cancelled) return;

        const liveEnvironments = (layouts || []).map((layout, index) => ({
          id: layout.id,
          name: layout.name || `Environment ${index + 1}`,
          genre: layout.genre || inferGenre(`${layout.name || ''} ${layout.description || ''}`),
          kind: 'environment',
          image: layout.thumbnail_url || layout.thumbnail || layout.preview_url || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length],
          description: layout.description || 'Unlocked 3D SceneLayout environment.',
          unlocked: layout.is_locked !== true,
          modelUrl: layout.environment_url,
          layoutData: layout,
          source: 'SceneLayout',
        }));
        setEnvironments(liveEnvironments.length ? [...liveEnvironments, ...ENVIRONMENT_PRESETS.filter((preset) => !liveEnvironments.some((live) => live.id === preset.id))] : ENVIRONMENT_PRESETS);

        const rawHomes = [...(models3d || []), ...(modelsFbx || [])].filter((model) => /container|house|home|castle|cabin|loft|apartment|villa/i.test(model.name || ''));
        const dynamicHomes = rawHomes.map((model, index) => {
          const isContainer = /container/i.test(model.name || '');
          return {
            id: `model-home-${model.id}`,
            modelEntityId: model.id,
            name: model.name || `Home ${index + 1}`,
            genre: inferGenre(model.name),
            kind: 'home',
            image: model.thumbnail_url || model.thumbnail || model.preview_url || (isContainer ? HOME_PRESETS[0].image : FALLBACK_IMAGES[(index + 1) % FALLBACK_IMAGES.length]),
            description: isContainer ? 'Repository shipping-container home asset with wide dashboard framing.' : 'Unlocked repository home model.',
            unlocked: true,
            modelUrl: model.file_url,
            stageScale: isContainer ? 0.72 : 0.82,
            cameraDistance: isContainer ? 1.35 : 1.1,
            framing: isContainer ? 'wide' : 'standard',
            priority: isContainer,
            source: 'Model3D',
          };
        });
        const hasContainer = dynamicHomes.some((home) => /container/i.test(home.name));
        const defaults = hasContainer ? HOME_PRESETS.filter((home) => home.id !== 'home-container') : HOME_PRESETS;
        setHomes([...dynamicHomes.sort((a, b) => Number(b.priority) - Number(a.priority)), ...defaults]);
      } finally {
        if (!cancelled) setLoadingAssets(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, user?.id]);

  const catalogs = useMemo(() => ({ environments, homes }), [environments, homes]);

  const emitConfig = (next) => {
    window.dispatchEvent(new CustomEvent('environmentHubConfigChanged', { detail: next }));
    window.__atomXeEnvironmentHubConfig = next;
  };

  const updateConfig = (recipe) => {
    setConfig((current) => {
      const next = normalizeEnvironmentConfig(typeof recipe === 'function' ? recipe(current) : { ...current, ...recipe });
      emitConfig(next);
      return next;
    });
  };

  const selectItem = (kind, item) => {
    if (item.unlocked === false) return;
    if (kind === 'environment') updateConfig((current) => ({ ...current, mode: 'environment', environmentId: item.id, backgroundId: null, wallpaperId: null }));
    if (kind === 'skybox') updateConfig((current) => ({ ...current, mode: 'environment', skyboxId: item.id, backgroundId: null, wallpaperId: null }));
    if (kind === 'background') updateConfig((current) => ({ ...current, mode: 'background', backgroundId: item.id, wallpaperId: null }));
    if (kind === 'wallpaper') updateConfig((current) => ({ ...current, mode: 'wallpaper', wallpaperId: item.id, backgroundId: null }));
    if (kind === 'home') updateConfig((current) => ({ ...current, mode: 'environment', homeId: item.id, backgroundId: null, wallpaperId: null }));
    if (kind === 'garden') updateConfig((current) => ({ ...current, mode: 'environment', gardenId: item.id, backgroundId: null, wallpaperId: null }));
    if (kind === 'companion') updateConfig((current) => ({ ...current, mode: 'environment', companionId: item.id, backgroundId: null, wallpaperId: null }));
    if (kind === 'music') updateConfig((current) => ({ ...current, musicId: item.id }));
    if (kind === 'weather') updateConfig((current) => ({ ...current, mode: 'environment', weatherId: item.id, backgroundId: null, wallpaperId: null }));
  };

  const saveConfig = async () => {
    const next = normalizeEnvironmentConfig(config);
    try { localStorage.setItem(configStorageKey(user?.id), JSON.stringify(next)); } catch { /* local persistence non-fatal */ }
    emitConfig(next);

    const activeEnvironment = findPresetById(next.environmentId, catalogs);
    if (next.mode === 'environment' && activeEnvironment?.modelUrl) {
      window.dispatchEvent(new CustomEvent('changeEnvironment', {
        detail: {
          envUrl: activeEnvironment.modelUrl,
          layoutData: activeEnvironment.layoutData,
          envId: activeEnvironment.id,
        },
      }));
      if (user?.id && activeEnvironment.layoutData) {
        try {
          const rows = await base44.entities.AvatarHomeState.filter({ avatarId: user.id });
          if (rows?.length) await base44.entities.AvatarHomeState.update(rows[0].id, { currentEnvironmentId: activeEnvironment.id });
          else await base44.entities.AvatarHomeState.create({ avatarId: user.id, currentEnvironmentId: activeEnvironment.id });
        } catch (error) {
          console.warn('Environment Hub could not persist AvatarHomeState.', error);
        }
      }
    }

    window.dispatchEvent(new CustomEvent('environmentHomeModelChanged', {
      detail: {
        home: findPresetById(next.homeId, catalogs),
        garden: findPresetById(next.gardenId, catalogs),
        companionId: next.companionId,
      },
    }));
    window.dispatchEvent(new CustomEvent('environmentSkyboxChanged', {
      detail: { skybox: findPresetById(next.skyboxId, catalogs), weatherId: next.weatherId, syncToWeather: next.syncSkyboxToWeather },
    }));
    window.dispatchEvent(new CustomEvent('environmentMusicChanged', {
      detail: { music: findPresetById(next.musicId, catalogs) },
    }));
    setSavedAt(Date.now());
  };

  const resetConfig = () => {
    const next = normalizeEnvironmentConfig(DEFAULT_ENVIRONMENT_CONFIG);
    setConfig(next);
    emitConfig(next);
  };

  const tabMeta = ENVIRONMENT_TABS.find((entry) => entry.id === tab) || ENVIRONMENT_TABS[0];
  const environmentOnly = ['skybox', 'home', 'garden', 'weather'].includes(tab);
  const tabDisabled = environmentOnly && config.mode !== 'environment';

  const collectionForTab = useMemo(() => {
    if (tab === 'environment') return environments;
    if (tab === 'skybox') return SKYBOX_PRESETS;
    if (tab === 'background') return BACKGROUND_PRESETS;
    if (tab === 'wallpaper') return WALLPAPER_PRESETS;
    if (tab === 'home') return homes;
    if (tab === 'music') return MUSIC_PRESETS;
    if (tab === 'weather') return WEATHER_PRESETS;
    return [];
  }, [tab, environments, homes]);

  const selectedIdForTab = {
    environment: config.environmentId,
    skybox: config.skyboxId,
    background: config.backgroundId,
    wallpaper: config.wallpaperId,
    home: config.homeId,
    music: config.musicId,
    weather: config.weatherId,
  }[tab];

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return collectionForTab.filter((item) => {
      if (genre !== 'All' && item.genre !== genre && item.genre !== 'All') return false;
      if (unlockedOnly && item.unlocked === false) return false;
      if (normalizedQuery && !`${item.name} ${item.description} ${item.genre}`.toLowerCase().includes(normalizedQuery)) return false;
      return true;
    });
  }, [collectionForTab, genre, query, unlockedOnly]);

  const stack = {
    environment: findPresetById(config.environmentId, catalogs),
    skybox: findPresetById(config.skyboxId, catalogs),
    background: findPresetById(config.backgroundId, catalogs),
    wallpaper: findPresetById(config.wallpaperId, catalogs),
    home: findPresetById(config.homeId, catalogs),
    garden: findPresetById(config.gardenId, catalogs),
    companion: findPresetById(config.companionId, catalogs),
    music: findPresetById(config.musicId, catalogs),
    weather: findPresetById(config.weatherId, catalogs),
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.section
          initial={{ opacity: 0, y: 10, scale: 0.995 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.995 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-[54px] left-[390px] right-[8px] top-[170px] z-[9800] isolate overflow-hidden text-white"
          aria-label="3D Environment Hub"
          role="dialog"
          aria-modal="true"
          style={{
            background: 'linear-gradient(145deg, rgba(12,18,29,.87), rgba(5,9,17,.76) 52%, rgba(13,20,32,.82))',
            backdropFilter: 'blur(34px) saturate(150%)',
            WebkitBackdropFilter: 'blur(34px) saturate(150%)',
            clipPath: 'polygon(20px 0, calc(100% - 20px) 0, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0 calc(100% - 20px), 0 20px)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.11), 0 30px 90px rgba(0,0,0,.42)',
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_5%,rgba(34,211,238,.09),transparent_27%),radial-gradient(circle_at_88%_92%,rgba(139,92,246,.08),transparent_28%)]" />

          <div className="relative flex h-full min-h-0 flex-col">
            <header className="flex h-[70px] flex-shrink-0 items-center gap-5 px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-200/[0.07] text-cyan-100"><Globe2 className="h-4 w-4" /></div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><h2 className="truncate text-lg font-semibold tracking-tight">3D Environment Hub</h2><span className="rounded-full bg-white/[0.055] px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.16em] text-white/35">World Composer</span></div>
                  <p className="text-[10px] text-white/38">Compose your Luna home from independent world layers.</p>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <div className="hidden items-center gap-1 rounded-full bg-white/[0.035] p-1 lg:flex">
                  {['environment', 'background', 'wallpaper'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        if (mode === 'environment') updateConfig((current) => ({ ...current, mode: 'environment', backgroundId: null, wallpaperId: null }));
                        if (mode === 'background') updateConfig((current) => ({ ...current, mode: 'background', backgroundId: current.backgroundId || BACKGROUND_PRESETS[0].id }));
                        if (mode === 'wallpaper') updateConfig((current) => ({ ...current, mode: 'wallpaper', wallpaperId: current.wallpaperId || WALLPAPER_PRESETS[0].id }));
                      }}
                      className={`rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.13em] transition ${config.mode === mode ? 'bg-cyan-200/12 text-cyan-100' : 'text-white/35 hover:text-white/65'}`}
                    >{mode === 'environment' ? 'World Stack' : mode}</button>
                  ))}
                </div>
                <button onClick={resetConfig} className="rounded-full px-3 py-2 text-[9px] font-bold uppercase tracking-[0.13em] text-white/35 transition hover:bg-white/[0.05] hover:text-white/65">Reset</button>
                <button onClick={saveConfig} className="rounded-full bg-cyan-200/10 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.15em] text-cyan-100 transition hover:bg-cyan-200/16">
                  {savedAt && Date.now() - savedAt < 3000 ? 'Saved' : 'Apply to Dashboard'}
                </button>
                <button onClick={() => setOpen(false)} aria-label="Close Environment Hub" className="grid h-9 w-9 place-items-center rounded-full text-white/45 transition hover:bg-white/[0.07] hover:text-white"><X className="h-4 w-4" /></button>
              </div>
            </header>

            <div className="flex min-h-0 flex-1">
              <nav className="w-[190px] flex-shrink-0 overflow-y-auto px-3 pb-5 pt-2">
                <div className="mb-3 px-3 text-[8px] font-bold uppercase tracking-[0.2em] text-white/23">Environment Layers</div>
                <div className="space-y-1">
                  {ENVIRONMENT_TABS.map((entry) => {
                    const Icon = TAB_ICONS[entry.id] || Layers3;
                    const disabledByMode = ['skybox', 'home', 'garden', 'weather'].includes(entry.id) && config.mode !== 'environment';
                    return (
                      <button
                        key={entry.id}
                        onClick={() => setTab(entry.id)}
                        className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition ${tab === entry.id ? 'bg-white/[0.075] text-white' : 'text-white/38 hover:bg-white/[0.035] hover:text-white/68'} ${disabledByMode ? 'opacity-35' : ''}`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${tab === entry.id ? 'text-cyan-200' : ''}`} />
                        <span className="min-w-0 flex-1 truncate text-[10px] font-semibold">{entry.label}</span>
                        {disabledByMode ? <Lock className="h-2.5 w-2.5" /> : <ChevronRight className={`h-3 w-3 transition ${tab === entry.id ? 'translate-x-0 text-cyan-200' : '-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-70'}`} />}
                      </button>
                    );
                  })}
                </div>
              </nav>

              <main className="min-w-0 flex-1 overflow-hidden px-2 pb-5">
                <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_300px] gap-4">
                  <section className="flex min-h-0 flex-col overflow-hidden rounded-[24px] bg-white/[0.025]">
                    <div className="flex flex-shrink-0 items-end justify-between gap-4 px-5 pb-3 pt-4">
                      <div>
                        <div className="text-[8px] font-bold uppercase tracking-[0.19em] text-cyan-200/55">{config.mode === 'environment' ? 'Layered World Mode' : `${config.mode} Mode`}</div>
                        <h3 className="mt-1 text-base font-semibold text-white/90">{tabMeta.label}</h3>
                        <p className="mt-0.5 text-[10px] text-white/35">{tabMeta.description}</p>
                      </div>
                      {tab !== 'friends' && tab !== 'garden' && (
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
                            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter assets" className="h-9 w-[170px] rounded-full bg-white/[0.045] pl-9 pr-3 text-[10px] text-white outline-none placeholder:text-white/20 focus:bg-white/[0.065]" />
                          </div>
                          <button onClick={() => setUnlockedOnly((value) => !value)} className={`h-9 rounded-full px-3 text-[9px] font-bold uppercase tracking-[0.12em] ${unlockedOnly ? 'bg-cyan-200/10 text-cyan-100' : 'bg-white/[0.04] text-white/35'}`}>Unlocked</button>
                        </div>
                      )}
                    </div>

                    {tab !== 'friends' && tab !== 'garden' && (
                      <div className="flex flex-shrink-0 gap-1 overflow-x-auto px-5 pb-3 [scrollbar-width:none]">
                        {GENRES.map((entry) => (
                          <button key={entry} onClick={() => setGenre(entry)} className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.12em] transition ${genre === entry ? 'bg-white/[0.09] text-white/85' : 'text-white/28 hover:bg-white/[0.035] hover:text-white/55'}`}>{entry}</button>
                        ))}
                      </div>
                    )}

                    <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 [scrollbar-width:thin]">
                      {tab === 'friends' ? (
                        <div className="h-full min-h-[360px] overflow-hidden rounded-[18px]"><FriendsListContent /></div>
                      ) : tabDisabled ? (
                        <EmptyDisabledState mode={config.mode} tab={tabMeta.label} />
                      ) : tab === 'garden' ? (
                        <div className="grid gap-5 lg:grid-cols-2">
                          <div>
                            <div className="mb-2 text-[8px] font-bold uppercase tracking-[0.18em] text-white/30">Garden Layer</div>
                            <div className="grid gap-2 sm:grid-cols-2">{GARDEN_PRESETS.map((item) => <CatalogCard key={item.id} item={item} selected={config.gardenId === item.id} onSelect={(value) => selectItem('garden', value)} />)}</div>
                          </div>
                          <div>
                            <div className="mb-2 text-[8px] font-bold uppercase tracking-[0.18em] text-white/30">Companion Presence</div>
                            <div className="grid gap-2">{COMPANION_PRESETS.map((item) => <CatalogCard key={item.id} item={item} selected={config.companionId === item.id} onSelect={(value) => selectItem('companion', value)} />)}</div>
                          </div>
                        </div>
                      ) : (
                        <>
                          {tab === 'weather' && (
                            <button
                              onClick={() => updateConfig((current) => ({ ...current, syncSkyboxToWeather: !current.syncSkyboxToWeather }))}
                              className={`mb-3 flex w-full items-center justify-between rounded-[16px] px-4 py-3 text-left ${config.syncSkyboxToWeather ? 'bg-cyan-200/[0.075]' : 'bg-white/[0.035]'}`}
                            >
                              <div><div className="text-[10px] font-semibold text-white/75">Sync skybox to weather</div><div className="mt-0.5 text-[9px] text-white/30">Weather can automatically choose a matching atmosphere while keeping your land and home active.</div></div>
                              <div className={`relative h-5 w-9 rounded-full ${config.syncSkyboxToWeather ? 'bg-cyan-300/45' : 'bg-white/10'}`}><div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${config.syncSkyboxToWeather ? 'left-[18px]' : 'left-0.5'}`} /></div>
                            </button>
                          )}
                          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                            {loadingAssets && ['environment', 'home'].includes(tab) && <div className="col-span-full py-3 text-[10px] text-white/30">Syncing your unlocked repository assets…</div>}
                            {filtered.map((item) => <CatalogCard key={item.id} item={item} selected={selectedIdForTab === item.id} onSelect={(value) => selectItem(tab, value)} />)}
                            {!filtered.length && <div className="col-span-full grid min-h-[180px] place-items-center text-[11px] text-white/30">No assets match these filters.</div>}
                          </div>
                        </>
                      )}
                    </div>
                  </section>

                  <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto pr-1 [scrollbar-width:thin]">
                    <div className="h-[218px] flex-shrink-0"><WorldPreview config={config} environments={environments} homes={homes} /></div>

                    <div className="rounded-[22px] bg-white/[0.028] px-4 py-3.5">
                      <div className="flex items-center justify-between"><span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/45">Current World Stack</span><span className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${config.mode === 'environment' ? 'bg-emerald-300/10 text-emerald-200/70' : 'bg-fuchsia-300/10 text-fuchsia-200/70'}`}>{config.mode}</span></div>
                      <div className="mt-2 divide-y divide-white/[0.045]">
                        <StackRow label="Land" value={stack.environment?.name} disabled={config.mode !== 'environment'} />
                        <StackRow label="Skybox" value={stack.skybox?.name} disabled={config.mode !== 'environment'} />
                        <StackRow label="Background" value={stack.background?.name} disabled={config.mode !== 'background'} />
                        <StackRow label="Wallpaper" value={stack.wallpaper?.name} disabled={config.mode !== 'wallpaper'} />
                        <StackRow label="Home" value={stack.home?.name} disabled={config.mode !== 'environment'} />
                        <StackRow label="Garden" value={stack.garden?.name} disabled={config.mode !== 'environment'} />
                        <StackRow label="Companion" value={stack.companion?.name} disabled={config.mode !== 'environment'} />
                        <StackRow label="Weather" value={stack.weather?.name} disabled={config.mode !== 'environment'} />
                        <StackRow label="Music" value={stack.music?.name} />
                      </div>
                    </div>

                    <div className="rounded-[22px] bg-white/[0.028] p-4">
                      <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-cyan-200/60" /><span className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">Visit Permissions</span></div>
                      <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-black/15 p-1">
                        {['private', 'friends', 'invite'].map((value) => (
                          <button key={value} onClick={() => updateConfig((current) => ({ ...current, visibility: value }))} className={`rounded-lg py-2 text-[8px] font-bold uppercase tracking-wider ${config.visibility === value ? 'bg-white/[0.08] text-white/80' : 'text-white/28'}`}>{value}</button>
                        ))}
                      </div>
                      <p className="mt-2 text-[9px] leading-relaxed text-white/28">Friends + Visits uses the existing Luna dashboard invitation and multiplayer channel system, so invited friends enter the environment rather than a separate fake preview.</p>
                    </div>

                    {config.mode === 'wallpaper' && (
                      <div className="rounded-[18px] bg-fuchsia-400/[0.055] p-3 text-[9px] leading-relaxed text-fuchsia-100/60"><Zap className="mb-1.5 h-3.5 w-3.5" />3D Wallpaper is exclusive. Land, skybox, home, garden, companion and weather are disabled until World Stack mode is restored.</div>
                    )}
                  </aside>
                </div>
              </main>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>,
    document.body,
  );
}
