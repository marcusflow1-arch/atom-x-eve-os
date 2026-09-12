import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import {
  BACKGROUND_PRESETS,
  DEFAULT_ENVIRONMENT_CONFIG,
  ENVIRONMENT_PRESETS,
  GARDEN_PRESETS,
  HOME_PRESETS,
  SKYBOX_PRESETS,
  WALLPAPER_PRESETS,
  configStorageKey,
  normalizeEnvironmentConfig,
} from './environmentHubCatalog';

const byId = (items, id) => items.find((item) => item.id === id) || null;

function readConfig(userId) {
  if (typeof window === 'undefined') return normalizeEnvironmentConfig(DEFAULT_ENVIRONMENT_CONFIG);
  try {
    const raw = localStorage.getItem(configStorageKey(userId));
    return normalizeEnvironmentConfig(raw ? JSON.parse(raw) : DEFAULT_ENVIRONMENT_CONFIG);
  } catch {
    return normalizeEnvironmentConfig(DEFAULT_ENVIRONMENT_CONFIG);
  }
}

export default function EnvironmentHubStageLayer() {
  const { user } = useAuth();
  const [config, setConfig] = useState(() => readConfig(user?.id));
  const [runtimeHome, setRuntimeHome] = useState(null);
  const [runtimeGarden, setRuntimeGarden] = useState(null);

  useEffect(() => {
    setConfig(readConfig(user?.id));
  }, [user?.id]);

  useEffect(() => {
    const onConfig = (event) => {
      if (!event.detail) return;
      setConfig(normalizeEnvironmentConfig(event.detail));
    };
    const onHome = (event) => {
      setRuntimeHome(event.detail?.home || null);
      setRuntimeGarden(event.detail?.garden || null);
    };
    window.addEventListener('environmentHubConfigChanged', onConfig);
    window.addEventListener('environmentHomeModelChanged', onHome);
    return () => {
      window.removeEventListener('environmentHubConfigChanged', onConfig);
      window.removeEventListener('environmentHomeModelChanged', onHome);
    };
  }, []);

  const presentation = useMemo(() => {
    const environment = byId(ENVIRONMENT_PRESETS, config.environmentId);
    const skybox = byId(SKYBOX_PRESETS, config.skyboxId);
    const background = byId(BACKGROUND_PRESETS, config.backgroundId);
    const wallpaper = byId(WALLPAPER_PRESETS, config.wallpaperId);
    const home = runtimeHome || byId(HOME_PRESETS, config.homeId);
    const garden = runtimeGarden || byId(GARDEN_PRESETS, config.gardenId);
    return { environment, skybox, background, wallpaper, home, garden };
  }, [config, runtimeHome, runtimeGarden]);

  const baseImage = config.mode === 'wallpaper'
    ? presentation.wallpaper?.image
    : config.mode === 'background'
      ? presentation.background?.image
      : presentation.environment?.image;

  const showEnvironmentComposition = config.mode === 'environment';
  const home = presentation.home;
  const isContainer = /container/i.test(home?.name || '') || home?.id === 'home-container';

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {baseImage && (
        <img
          src={baseImage}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${config.mode === 'wallpaper' && presentation.wallpaper?.animated ? 'animate-[pulse_12s_ease-in-out_infinite]' : ''}`}
          style={{ opacity: config.mode === 'environment' ? 0.22 : 0.48, transform: config.mode === 'wallpaper' ? 'scale(1.045)' : 'scale(1.015)', filter: 'saturate(.82) contrast(1.02)' }}
        />
      )}

      {showEnvironmentComposition && presentation.skybox?.image && (
        <img
          src={presentation.skybox.image}
          alt=""
          className="absolute inset-x-0 top-0 h-[60%] w-full object-cover"
          style={{ opacity: 0.26, maskImage: 'linear-gradient(to bottom, black 10%, transparent 100%)' }}
        />
      )}

      {showEnvironmentComposition && home?.image && (
        <div
          className="absolute bottom-[-10%] left-[9%] right-[9%] h-[72%] origin-bottom"
          style={{ transform: `scale(${home.stageScale || (isContainer ? 0.72 : 0.82)})`, transformOrigin: '50% 100%' }}
        >
          <img
            src={home.image}
            alt=""
            className="h-full w-full object-contain object-bottom"
            style={{
              opacity: isContainer ? 0.47 : 0.38,
              filter: 'saturate(.74) contrast(1.05)',
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 18%, black 78%, transparent 100%)',
            }}
          />
        </div>
      )}

      {showEnvironmentComposition && presentation.garden?.id && presentation.garden.id !== 'garden-off' && presentation.garden.image && (
        <img
          src={presentation.garden.image}
          alt=""
          className="absolute -bottom-[24%] left-0 h-[58%] w-full object-cover"
          style={{ opacity: 0.24, maskImage: 'linear-gradient(to top, black 5%, transparent 100%)' }}
        />
      )}

      {showEnvironmentComposition && config.weatherId === 'weather-rain' && (
        <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'repeating-linear-gradient(110deg, transparent 0 19px, rgba(184,228,255,.72) 20px, transparent 21px 31px)' }} />
      )}
      {showEnvironmentComposition && config.weatherId === 'weather-snow' && (
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.95) 0 1px, transparent 1.5px)', backgroundSize: '26px 26px' }} />
      )}
      {showEnvironmentComposition && config.weatherId === 'weather-fog' && <div className="absolute inset-0 bg-slate-100/[0.07] backdrop-blur-[1px]" />}
      {showEnvironmentComposition && config.weatherId === 'weather-storm' && <div className="absolute inset-0 bg-slate-950/20" />}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_0%,rgba(2,6,13,.02)_48%,rgba(2,6,13,.35)_100%)]" />
    </div>
  );
}
