import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check, CloudRain, Home, Image, Lock, Moon, Mountain, Sparkles, Sun, Video, X,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import {
  DEFAULT_ENVIRONMENT_CONFIG,
  ENVIRONMENT_TABS,
  HOME_PRESETS,
  HOME_SECTIONS,
  LAND_PRESETS,
  SKY_PRESETS,
  WALLPAPER_PRESETS,
  WEATHER_PRESETS,
  assetSnapshot,
  configStorageKey,
  normalizeEnvironmentConfig,
} from './environmentHubCatalog';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=85',
  'https://images.unsplash.com/photo-1520637836862-4d197d17c46a?w=1200&q=85',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&q=85',
];

const HOME_NAME_PATTERN = /container|house|home|castle|cabin|loft|apartment|villa|residence/i;

function isEnvironmentButton(target) {
  const button = target instanceof Element ? target.closest('button') : null;
  if (!button) return false;
  const text = (button.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
  return text.includes('environment hubs');
}

function readSavedConfig(userId) {
  if (typeof window === 'undefined') return normalizeEnvironmentConfig(DEFAULT_ENVIRONMENT_CONFIG);
  try {
    const raw = localStorage.getItem(configStorageKey(userId));
    return normalizeEnvironmentConfig(raw ? JSON.parse(raw) : DEFAULT_ENVIRONMENT_CONFIG);
  } catch {
    return normalizeEnvironmentConfig(DEFAULT_ENVIRONMENT_CONFIG);
  }
}

function normalizeLabel(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function localSkyState(date = new Date()) {
  const hour = date.getHours() + date.getMinutes() / 60;
  if (hour < 5 || hour >= 21) return { label: 'Night', top: '#07101f', middle: '#10203c', bottom: '#24344f', icon: Moon };
  if (hour < 8) return { label: 'Dawn', top: '#334a73', middle: '#c57e78', bottom: '#f0b98f', icon: Sun };
  if (hour < 17) return { label: 'Day', top: '#5f9fd2', middle: '#8fc3e6', bottom: '#d8ecf7', icon: Sun };
  if (hour < 20) return { label: 'Sunset', top: '#43527e', middle: '#c16f70', bottom: '#f0a56f', icon: Sun };
  return { label: 'Dusk', top: '#1c2948', middle: '#5b4b68', bottom: '#b06f75', icon: Moon };
}

function Preview({ config, wallpapers, homes }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const wallpaper = wallpapers.find((item) => item.id === config.wallpaperId) || config.wallpaperAsset || WALLPAPER_PRESETS[0];
  const home = homes.find((item) => item.id === config.homeId) || config.homeAsset || HOME_PRESETS[0];
  const land = LAND_PRESETS.find((item) => item.id === config.landId) || LAND_PRESETS[0];
  const sky = SKY_PRESETS.find((item) => item.id === config.skyId) || SKY_PRESETS[0];
  const liveSky = localSkyState(now);

  if (config.mode === 'wallpaper') {
    return (
      <div className="relative h-full min-h-[240px] overflow-hidden rounded-[26px] bg-[#080d14] shadow-[0_24px_70px_rgba(0,0,0,.20)]">
        {wallpaper?.videoUrl ? (
          <video src={wallpaper.videoUrl} poster={wallpaper.image || undefined} autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover opacity-90" />
        ) : wallpaper?.image ? (
          <motion.img
            key={wallpaper.id}
            src={wallpaper.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ scale: 1.01 }}
            animate={wallpaper.mediaType === 'animated' ? { scale: [1.01, 1.08, 1.01], x: [0, -8, 0] } : { scale: 1.01 }}
            transition={wallpaper.mediaType === 'animated' ? { duration: 14, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06101b]/82 via-transparent to-white/[0.04]" />
        <div className="absolute bottom-5 left-5">
          <div className="text-[9px] font-bold uppercase tracking-[.18em] text-white/45">Wallpaper</div>
          <div className="mt-1 text-lg font-semibold text-white">{wallpaper?.name || 'Wallpaper'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[240px] overflow-hidden rounded-[26px] bg-[#101722] shadow-[0_24px_70px_rgba(0,0,0,.20)]">
      {sky?.realtime ? (
        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${liveSky.top}, ${liveSky.middle} 55%, ${liveSky.bottom})` }}>
          {(liveSky.label === 'Night' || liveSky.label === 'Dusk') && (
            <div className="absolute inset-0 opacity-55" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.9) 0 1px, transparent 1.5px)', backgroundSize: '42px 42px' }} />
          )}
          <div className={`absolute right-[16%] top-[13%] h-12 w-12 rounded-full ${liveSky.label === 'Night' || liveSky.label === 'Dusk' ? 'bg-slate-100/80 shadow-[0_0_50px_rgba(220,235,255,.42)]' : 'bg-amber-100/90 shadow-[0_0_65px_rgba(255,220,150,.38)]'}`} />
        </div>
      ) : sky?.image ? (
        <img src={sky.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-85" />
      ) : null}

      {land?.image && (
        <div className="absolute inset-x-0 bottom-0 h-[54%] overflow-hidden">
          <img src={land.image} alt="" className="h-full w-full object-cover object-center opacity-75" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07101a]/70 via-transparent to-transparent" />
        </div>
      )}

      {home?.image && home.id !== 'home-open-land' && (
        <motion.img
          key={home.id}
          initial={{ opacity: 0, y: 18, scale: 0.93 }}
          animate={{ opacity: 0.82, y: 0, scale: 0.82 }}
          src={home.image}
          alt=""
          className="absolute bottom-[-7%] left-[10%] h-[68%] w-[80%] object-contain object-bottom drop-shadow-[0_25px_32px_rgba(0,0,0,.38)]"
        />
      )}

      {config.weatherId === 'weather-rain' && <div className="absolute inset-0 opacity-24" style={{ backgroundImage: 'repeating-linear-gradient(112deg, transparent 0 17px, rgba(220,240,255,.6) 18px, transparent 19px 30px)' }} />}
      {config.weatherId === 'weather-snow' && <div className="absolute inset-0 opacity-55" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.95) 0 1px, transparent 1.7px)', backgroundSize: '25px 25px' }} />}
      {config.weatherId === 'weather-fog' && <div className="absolute inset-0 bg-slate-100/16 backdrop-blur-[3px]" />}
      {config.weatherId === 'weather-storm' && <div className="absolute inset-0 bg-slate-950/38" />}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_15%,rgba(5,10,18,.15)_58%,rgba(5,10,18,.62)_100%)]" />
      <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-[.18em] text-white/45">Home</div>
          <div className="mt-1 text-lg font-semibold text-white">{home?.name || 'Open Land'}</div>
          <div className="mt-1 text-[10px] text-white/42">{land?.name} · {sky?.realtime ? `${liveSky.label} · Live` : sky?.name}</div>
        </div>
        {sky?.realtime && <span className="rounded-full bg-white/[0.10] px-3 py-1.5 text-[8px] font-bold uppercase tracking-[.16em] text-white/65 backdrop-blur-xl">{now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>}
      </div>
    </div>
  );
}

function AssetCard({ item, selected, onSelect }) {
  const locked = item.unlocked === false;
  const typeLabel = item.videoUrl ? 'Video' : item.mediaType === 'animated' ? 'Animated' : item.kind === 'home' ? '3D Home' : item.kind;

  return (
    <button
      type="button"
      disabled={locked}
      onClick={() => onSelect(item)}
      className={`group relative min-h-[150px] overflow-hidden rounded-[22px] text-left transition duration-300 ${locked ? 'cursor-not-allowed opacity-48' : 'hover:-translate-y-0.5'} ${selected ? 'ring-1 ring-cyan-100/55' : ''}`}
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,.095), rgba(255,255,255,.035))',
        boxShadow: selected ? '0 16px 40px rgba(100,220,255,.09), inset 0 1px 0 rgba(255,255,255,.15)' : 'inset 0 1px 0 rgba(255,255,255,.09)',
      }}
    >
      {item.image && <img src={item.image} alt="" className={`absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.035] ${locked ? 'grayscale opacity-30' : 'opacity-62'}`} />}
      <div className="absolute inset-0 bg-gradient-to-t from-[#07101a]/95 via-[#07101a]/34 to-white/[0.025]" />
      <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
        <span className="rounded-full bg-black/25 px-2 py-1 text-[7px] font-bold uppercase tracking-[.16em] text-white/58 backdrop-blur-lg">{typeLabel}</span>
        {selected ? <span className="grid h-6 w-6 place-items-center rounded-full bg-cyan-100/90 text-slate-950"><Check className="h-3.5 w-3.5" /></span> : locked ? <span className="grid h-6 w-6 place-items-center rounded-full bg-black/30 text-white/55 backdrop-blur-lg"><Lock className="h-3 w-3" /></span> : null}
      </div>
      <div className="absolute bottom-3 left-3 right-3">
        <div className="truncate text-sm font-semibold text-white/92">{item.name}</div>
        <div className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-white/45">{locked ? (item.unlockLabel || 'Unlock through an achievement.') : item.description}</div>
      </div>
    </button>
  );
}

function GlassChoice({ selected, icon: Icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[94px] items-center gap-4 rounded-[22px] px-4 text-left transition ${selected ? 'bg-white/[0.105] shadow-[inset_0_1px_0_rgba(255,255,255,.16),0_16px_38px_rgba(0,0,0,.10)]' : 'bg-white/[0.045] hover:bg-white/[0.07]'}`}
    >
      <span className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl ${selected ? 'bg-cyan-100/12 text-cyan-100' : 'bg-white/[0.055] text-white/42'}`}><Icon className="h-4.5 w-4.5" /></span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-white/88">{title}</span>
        <span className="mt-1 block text-[9px] leading-relaxed text-white/38">{description}</span>
      </span>
      {selected && <Check className="ml-auto h-4 w-4 flex-shrink-0 text-cyan-100/80" />}
    </button>
  );
}

export default function EnvironmentHubWorkspace() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState('home');
  const [homeSection, setHomeSection] = useState('house');
  const [config, setConfig] = useState(() => readSavedConfig(user?.id));
  const [homes, setHomes] = useState(HOME_PRESETS);
  const [wallpapers, setWallpapers] = useState(WALLPAPER_PRESETS);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const next = readSavedConfig(user?.id);
    setConfig(next);
    setPage(next.mode === 'wallpaper' ? 'wallpaper' : 'home');
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
    const handleAvatarFocus = (event) => {
      if (event.detail?.active) setOpen(false);
    };

    document.addEventListener('click', handleClick, true);
    window.addEventListener('openEnvironmentHub', handleOpen);
    window.addEventListener('closeEnvironmentHub', handleClose);
    window.addEventListener('lunaDashboardOverlayState', handleSurface);
    window.addEventListener('lunaAvatarFocusChanged', handleAvatarFocus);
    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('openEnvironmentHub', handleOpen);
      window.removeEventListener('closeEnvironmentHub', handleClose);
      window.removeEventListener('lunaDashboardOverlayState', handleSurface);
      window.removeEventListener('lunaAvatarFocusChanged', handleAvatarFocus);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open]);

  useEffect(() => {
    if (!open || !user?.id) return undefined;
    let cancelled = false;

    (async () => {
      setLoadingAssets(true);
      try {
        const [models3d, modelsFbx, layouts, userAchievements, achievements] = await Promise.all([
          base44.entities.Model3D.list().catch(() => []),
          base44.entities.ModelFBX.list().catch(() => []),
          base44.entities.SceneLayout.list().catch(() => []),
          base44.entities.UserAchievement.filter({ user_id: user.id }).catch(() => []),
          base44.entities.Achievement.list().catch(() => []),
        ]);
        if (cancelled) return;

        const unlockedAchievementIds = new Set((userAchievements || []).filter((row) => row.status === 'unlocked').map((row) => String(row.achievement_id)));
        const environmentAchievements = (achievements || []).filter((achievement) => achievement.category === 'environment');

        const findAchievementForAsset = (asset) => environmentAchievements.find((achievement) => {
          const reward = achievement.reward || {};
          const showcase = achievement.showcase || {};
          const assetName = normalizeLabel(asset.name);
          const rewardName = normalizeLabel(reward.name);
          return String(reward.environment_id || '') === String(asset.sourceEntityId || asset.id)
            || (showcase.model_url && asset.modelUrl && showcase.model_url === asset.modelUrl)
            || (rewardName && assetName && rewardName === assetName);
        });

        const rawHomeAssets = [
          ...(models3d || []).map((model) => ({
            sourceEntityId: model.id,
            id: `model-home-${model.id}`,
            name: model.name || '3D Home',
            description: model.description || '3D home model.',
            image: model.thumbnail_url || '',
            modelUrl: model.file_url || '',
            source: 'Model3D',
            bundledLand: false,
          })),
          ...(modelsFbx || []).map((model) => ({
            sourceEntityId: model.id,
            id: `fbx-home-${model.id}`,
            name: model.name || '3D Home',
            description: model.description || '3D home model.',
            image: model.thumbnail_url || '',
            modelUrl: model.file_url || '',
            source: 'ModelFBX',
            bundledLand: false,
          })),
          ...(layouts || []).map((layout) => ({
            sourceEntityId: layout.id,
            id: `layout-home-${layout.id}`,
            name: layout.name || '3D Home Environment',
            description: layout.description || '3D home scene with its own environment.',
            image: layout.thumbnail_url || layout.thumbnail || layout.preview_url || '',
            modelUrl: layout.environment_url || '',
            layoutData: layout,
            source: 'SceneLayout',
            bundledLand: true,
          })),
        ].filter((asset) => asset.modelUrl && HOME_NAME_PATTERN.test(`${asset.name} ${asset.description}`));

        const dynamicHomes = rawHomeAssets.map((asset, index) => {
          const achievement = findAchievementForAsset(asset);
          const unlocked = Boolean(achievement && unlockedAchievementIds.has(String(achievement.id)));
          return {
            ...asset,
            kind: 'home',
            image: asset.image || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length],
            unlocked,
            unlockLabel: achievement ? `Achievement: ${achievement.title}` : 'Unlock from an Environment achievement.',
            achievementId: achievement?.id || null,
          };
        });
        setHomes([...HOME_PRESETS, ...dynamicHomes]);

        const achievementWallpapers = environmentAchievements
          .filter((achievement) => {
            const reward = achievement.reward || {};
            const showcase = achievement.showcase || {};
            const text = `${reward.type || ''} ${reward.name || ''} ${achievement.title || ''}`;
            return Boolean(showcase.video_url || /wallpaper|background|video/i.test(text));
          })
          .map((achievement, index) => ({
            id: `achievement-wall-${achievement.id}`,
            name: achievement.reward?.name || achievement.title || 'Achievement Wallpaper',
            description: achievement.reward?.description || achievement.description || 'Achievement-unlocked dashboard wallpaper.',
            kind: 'wallpaper',
            image: achievement.reward?.environment_thumbnail || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length],
            videoUrl: achievement.showcase?.video_url || '',
            mediaType: achievement.showcase?.video_url ? 'video' : 'image',
            unlocked: unlockedAchievementIds.has(String(achievement.id)),
            unlockLabel: `Achievement: ${achievement.title}`,
          }));
        setWallpapers([...WALLPAPER_PRESETS, ...achievementWallpapers]);
      } finally {
        if (!cancelled) setLoadingAssets(false);
      }
    })();

    return () => { cancelled = true; };
  }, [open, user?.id]);

  const emitConfig = (next) => {
    window.__atomXeEnvironmentHubConfig = next;
    window.dispatchEvent(new CustomEvent('environmentHubConfigChanged', { detail: next }));
  };

  const updateConfig = (recipe) => {
    setSaved(false);
    setConfig((current) => {
      const next = normalizeEnvironmentConfig(typeof recipe === 'function' ? recipe(current) : { ...current, ...recipe });
      emitConfig(next);
      return next;
    });
  };

  const chooseWallpaper = (item) => {
    if (item.unlocked === false) return;
    setPage('wallpaper');
    updateConfig((current) => ({ ...current, mode: 'wallpaper', wallpaperId: item.id, wallpaperAsset: assetSnapshot(item) }));
  };

  const chooseHome = (item) => {
    if (item.unlocked === false) return;
    setPage('home');
    updateConfig((current) => ({ ...current, mode: 'home', homeId: item.id, homeAsset: assetSnapshot(item) }));
  };

  const apply = async () => {
    const next = normalizeEnvironmentConfig({ ...config, mode: page === 'wallpaper' ? 'wallpaper' : 'home' });
    try { localStorage.setItem(configStorageKey(user?.id), JSON.stringify(next)); } catch { /* local persistence is best effort */ }
    setConfig(next);
    emitConfig(next);

    if (next.mode === 'home') {
      const selectedHome = homes.find((item) => item.id === next.homeId) || next.homeAsset;
      if (selectedHome?.modelUrl) {
        window.dispatchEvent(new CustomEvent('changeEnvironment', {
          detail: {
            envUrl: selectedHome.modelUrl,
            layoutData: selectedHome.layoutData,
            envId: selectedHome.sourceEntityId || selectedHome.id,
          },
        }));

        if (user?.id) {
          try {
            const rows = await base44.entities.AvatarHomeState.filter({ avatarId: user.id });
            const value = selectedHome.sourceEntityId || selectedHome.id;
            if (rows?.length) await base44.entities.AvatarHomeState.update(rows[0].id, { currentEnvironmentId: value });
            else await base44.entities.AvatarHomeState.create({ avatarId: user.id, currentEnvironmentId: value });
          } catch (error) {
            console.warn('Environment Hub could not save AvatarHomeState.', error);
          }
        }
      }
    }

    setSaved(true);
  };

  const currentWallpaper = wallpapers.find((item) => item.id === config.wallpaperId) || config.wallpaperAsset;
  const currentHome = homes.find((item) => item.id === config.homeId) || config.homeAsset || HOME_PRESETS[0];
  const currentLand = LAND_PRESETS.find((item) => item.id === config.landId) || LAND_PRESETS[0];
  const currentSky = SKY_PRESETS.find((item) => item.id === config.skyId) || SKY_PRESETS[0];
  const currentWeather = WEATHER_PRESETS.find((item) => item.id === config.weatherId) || WEATHER_PRESETS[0];

  const homeStatus = useMemo(() => {
    if (currentHome?.bundledLand) return `${currentHome.name} includes its own land`;
    return [currentHome?.name || 'Current home', currentLand?.name].filter(Boolean).join(' · ');
  }, [currentHome, currentLand]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.section
          initial={{ opacity: 0, y: 10, scale: 0.995 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.995 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-[54px] left-[390px] right-[8px] top-[170px] z-[9800] isolate overflow-hidden text-white"
          role="dialog"
          aria-modal="true"
          aria-label="Environment Hub"
          style={{
            background: 'linear-gradient(145deg, rgba(210,224,238,.16), rgba(28,38,52,.83) 38%, rgba(10,16,25,.88) 100%)',
            backdropFilter: 'blur(34px) saturate(138%)',
            WebkitBackdropFilter: 'blur(34px) saturate(138%)',
            border: '1px solid rgba(255,255,255,.13)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.16), 0 26px 80px rgba(0,0,0,.30)',
            clipPath: 'polygon(18px 0, calc(100% - 18px) 0, 100% 18px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 18px 100%, 0 calc(100% - 18px), 0 18px)',
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_2%,rgba(225,245,255,.13),transparent_31%),radial-gradient(circle_at_88%_92%,rgba(91,151,190,.07),transparent_30%)]" />

          <div className="relative flex h-full min-h-0 flex-col">
            <header className="flex h-[70px] flex-shrink-0 items-center gap-5 px-6">
              <div className="min-w-0">
                <div className="text-[8px] font-bold uppercase tracking-[.22em] text-cyan-100/45">Luna Home</div>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-white/92">Environment Hub</h2>
              </div>

              <div className="ml-6 flex rounded-full bg-white/[0.045] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]">
                {ENVIRONMENT_TABS.map((entry) => {
                  const Icon = entry.id === 'wallpaper' ? Image : Home;
                  const active = page === entry.id;
                  return (
                    <button
                      key={entry.id}
                      onClick={() => {
                        setPage(entry.id);
                        updateConfig((current) => ({ ...current, mode: entry.id === 'wallpaper' ? 'wallpaper' : 'home' }));
                      }}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-[9px] font-bold uppercase tracking-[.15em] transition ${active ? 'bg-white/[0.10] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.12)]' : 'text-white/35 hover:text-white/60'}`}
                    >
                      <Icon className="h-3.5 w-3.5" /> {entry.label}
                    </button>
                  );
                })}
              </div>

              <div className="ml-auto flex items-center gap-2">
                <button onClick={apply} className="rounded-full bg-white/[0.095] px-4 py-2 text-[9px] font-bold uppercase tracking-[.15em] text-white/78 shadow-[inset_0_1px_0_rgba(255,255,255,.12)] transition hover:bg-white/[0.14] hover:text-white">
                  {saved ? 'Applied' : 'Apply'}
                </button>
                <button onClick={() => setOpen(false)} aria-label="Close Environment Hub" className="grid h-9 w-9 place-items-center rounded-full text-white/40 transition hover:bg-white/[0.07] hover:text-white"><X className="h-4 w-4" /></button>
              </div>
            </header>

            <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_340px] gap-4 px-5 pb-5">
              <section className="flex min-h-0 flex-col overflow-hidden rounded-[26px] bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,.08)]">
                {page === 'wallpaper' ? (
                  <>
                    <div className="flex flex-shrink-0 items-end justify-between gap-4 px-5 pb-4 pt-5">
                      <div>
                        <h3 className="text-base font-semibold text-white/90">Wallpaper</h3>
                        <p className="mt-1 text-[10px] text-white/38">One full-scene backdrop. Static, animated and achievement video wallpapers can all live here.</p>
                      </div>
                      {loadingAssets && <span className="text-[9px] text-white/28">Syncing achievements…</span>}
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 [scrollbar-width:thin]">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {wallpapers.map((item) => <AssetCard key={item.id} item={item} selected={currentWallpaper?.id === item.id} onSelect={chooseWallpaper} />)}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-shrink-0 items-center justify-between gap-4 px-5 pb-3 pt-5">
                      <div>
                        <h3 className="text-base font-semibold text-white/90">Home</h3>
                        <p className="mt-1 text-[10px] text-white/38">A simple three-part setup: house, land, then sky and weather.</p>
                      </div>
                      <div className="flex rounded-full bg-white/[0.04] p-1">
                        {HOME_SECTIONS.map((entry) => (
                          <button key={entry.id} onClick={() => setHomeSection(entry.id)} className={`rounded-full px-3 py-1.5 text-[8px] font-bold uppercase tracking-[.13em] transition ${homeSection === entry.id ? 'bg-white/[0.09] text-white/82' : 'text-white/30 hover:text-white/55'}`}>{entry.label}</button>
                        ))}
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 [scrollbar-width:thin]">
                      {homeSection === 'house' && (
                        <div>
                          <div className="mb-3 rounded-[18px] bg-white/[0.035] px-4 py-3 text-[9px] leading-relaxed text-white/42">
                            3D homes are reward assets. The starter Open Land is always available; other houses unlock when their linked Environment achievement is completed.
                          </div>
                          {loadingAssets && <div className="mb-3 text-[9px] text-white/28">Checking your unlocked home rewards…</div>}
                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {homes.map((item) => <AssetCard key={item.id} item={item} selected={currentHome?.id === item.id} onSelect={chooseHome} />)}
                          </div>
                        </div>
                      )}

                      {homeSection === 'land' && (
                        <div>
                          {currentHome?.bundledLand && (
                            <div className="mb-3 rounded-[18px] bg-white/[0.055] px-4 py-3 text-[9px] text-white/48">This home is a complete SceneLayout and already includes its own land. Your land choice remains saved for other houses.</div>
                          )}
                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {LAND_PRESETS.map((item) => <AssetCard key={item.id} item={item} selected={config.landId === item.id} onSelect={(value) => updateConfig((current) => ({ ...current, mode: 'home', landId: value.id }))} />)}
                          </div>
                        </div>
                      )}

                      {homeSection === 'sky' && (
                        <div className="space-y-5">
                          <div>
                            <div className="mb-2 flex items-center gap-2 text-[8px] font-bold uppercase tracking-[.18em] text-white/30"><Sun className="h-3 w-3" /> Sky</div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {SKY_PRESETS.map((item) => (
                                <GlassChoice
                                  key={item.id}
                                  selected={config.skyId === item.id}
                                  icon={item.realtime ? Sparkles : item.id === 'sky-moon' ? Moon : Sun}
                                  title={item.name}
                                  description={item.description}
                                  onClick={() => updateConfig((current) => ({ ...current, mode: 'home', skyId: item.id }))}
                                />
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="mb-2 flex items-center gap-2 text-[8px] font-bold uppercase tracking-[.18em] text-white/30"><CloudRain className="h-3 w-3" /> Weather</div>
                            <div className="flex flex-wrap gap-2">
                              {WEATHER_PRESETS.map((item) => (
                                <button key={item.id} onClick={() => updateConfig((current) => ({ ...current, mode: 'home', weatherId: item.id }))} className={`rounded-full px-4 py-2 text-[9px] font-semibold transition ${config.weatherId === item.id ? 'bg-white/[0.11] text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,.12)]' : 'bg-white/[0.04] text-white/35 hover:bg-white/[0.07] hover:text-white/58'}`}>{item.name}</button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </section>

              <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto [scrollbar-width:thin]">
                <div className="h-[300px] flex-shrink-0"><Preview config={{ ...config, mode: page === 'wallpaper' ? 'wallpaper' : 'home' }} wallpapers={wallpapers} homes={homes} /></div>

                <div className="rounded-[24px] bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]">
                  <div className="text-[8px] font-bold uppercase tracking-[.19em] text-white/28">Current Setup</div>
                  {page === 'wallpaper' ? (
                    <div className="mt-3 flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.055] text-white/45">{currentWallpaper?.videoUrl ? <Video className="h-4 w-4" /> : <Image className="h-4 w-4" />}</span>
                      <div><div className="text-xs font-semibold text-white/76">{currentWallpaper?.name || 'Wallpaper'}</div><div className="mt-0.5 text-[9px] text-white/30">Full-scene mode</div></div>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center gap-3"><Home className="h-4 w-4 text-white/38" /><div><div className="text-xs font-semibold text-white/75">{homeStatus}</div><div className="mt-0.5 text-[9px] text-white/30">House & land</div></div></div>
                      <div className="flex items-center gap-3"><Mountain className="h-4 w-4 text-white/38" /><div><div className="text-xs font-semibold text-white/75">{currentSky?.name || 'Current sky'}</div><div className="mt-0.5 text-[9px] text-white/30">{currentSky ? (currentSky.realtime ? 'Live local day/night cycle' : 'Manual sky') : 'Existing environment sky'} · {currentWeather?.name || 'Clear'}</div></div></div>
                    </div>
                  )}
                </div>

                <div className="rounded-[24px] bg-white/[0.03] px-4 py-3 text-[9px] leading-relaxed text-white/34">
                  {page === 'wallpaper'
                    ? 'Wallpaper is intentionally separate from Home, so a video or animated backdrop never has to fight with house, land or sky layers.'
                    : 'Real-Time Sky uses your device clock and changes automatically through dawn, day, sunset and night. No location permission is required.'}
                </div>
              </aside>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>,
    document.body
  );
}