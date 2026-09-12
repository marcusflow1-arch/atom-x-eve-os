import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import {
  DEFAULT_ENVIRONMENT_CONFIG,
  HOME_PRESETS,
  LAND_PRESETS,
  SKY_PRESETS,
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

function skyState(date) {
  const hour = date.getHours() + date.getMinutes() / 60;
  if (hour < 5 || hour >= 21) return { phase: 'night', top: '#030914', middle: '#0a1830', bottom: '#1c2c45', stars: 0.62, celestial: 'moon' };
  if (hour < 8) return { phase: 'dawn', top: '#263c66', middle: '#9d6970', bottom: '#e8a979', stars: 0.12, celestial: 'sun' };
  if (hour < 17) return { phase: 'day', top: '#4d8ec3', middle: '#7cb6dd', bottom: '#d1e7f3', stars: 0, celestial: 'sun' };
  if (hour < 20) return { phase: 'sunset', top: '#384d76', middle: '#a55e68', bottom: '#e89a65', stars: 0.04, celestial: 'sun' };
  return { phase: 'dusk', top: '#172642', middle: '#4c435f', bottom: '#93626b', stars: 0.28, celestial: 'moon' };
}

function RealTimeSky() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const sky = skyState(now);
  const hour = now.getHours() + now.getMinutes() / 60;
  const x = `${8 + (hour / 24) * 84}%`;
  const daylightDistance = Math.min(1, Math.abs(hour - 12) / 12);
  const y = `${13 + daylightDistance * 20}%`;

  return (
    <div className="absolute inset-0 transition-colors duration-[1800ms]" style={{ background: `linear-gradient(to bottom, ${sky.top}, ${sky.middle} 58%, ${sky.bottom})` }}>
      {sky.stars > 0 && (
        <div
          className="absolute inset-0"
          style={{
            opacity: sky.stars,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.88) 0 1px, transparent 1.5px)',
            backgroundSize: '46px 46px',
            maskImage: 'linear-gradient(to bottom, black 0%, black 62%, transparent 100%)',
          }}
        />
      )}
      <div
        className={`absolute h-14 w-14 -translate-x-1/2 rounded-full transition-all duration-[1800ms] ${sky.celestial === 'moon' ? 'bg-slate-100/75 shadow-[0_0_60px_rgba(215,232,255,.34)]' : 'bg-amber-100/90 shadow-[0_0_72px_rgba(255,218,150,.34)]'}`}
        style={{ left: x, top: y }}
      />
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-[#08111d]/34 to-transparent" />
    </div>
  );
}

export default function EnvironmentHubStageLayer() {
  const { user } = useAuth();
  const [config, setConfig] = useState(() => readConfig(user?.id));

  useEffect(() => {
    const saved = readConfig(user?.id);
    setConfig(saved);

    // Restore a saved achievement home into the existing real 3D environment
    // pipeline after the dashboard has mounted. Browsing the hub only previews;
    // the Workspace dispatches this same event immediately when Apply is used.
    if (saved.mode === 'home' && saved.homeAsset?.modelUrl) {
      const timer = window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('changeEnvironment', {
          detail: {
            envUrl: saved.homeAsset.modelUrl,
            envId: saved.homeAsset.id,
          },
        }));
      }, 250);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [user?.id]);

  useEffect(() => {
    const onConfig = (event) => {
      if (event.detail) setConfig(normalizeEnvironmentConfig(event.detail));
    };
    window.addEventListener('environmentHubConfigChanged', onConfig);
    return () => window.removeEventListener('environmentHubConfigChanged', onConfig);
  }, []);

  const presentation = useMemo(() => {
    const wallpaper = (config.wallpaperAsset?.id === config.wallpaperId ? config.wallpaperAsset : null) || byId(WALLPAPER_PRESETS, config.wallpaperId) || WALLPAPER_PRESETS[0];
    const home = (config.homeAsset?.id === config.homeId ? config.homeAsset : null) || byId(HOME_PRESETS, config.homeId) || HOME_PRESETS[0];
    const land = byId(LAND_PRESETS, config.landId) || LAND_PRESETS[0];
    const sky = byId(SKY_PRESETS, config.skyId) || SKY_PRESETS[0];
    return { wallpaper, home, land, sky };
  }, [config]);

  if (config.mode === 'wallpaper') {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#050914]">
        {presentation.wallpaper?.videoUrl ? (
          <video
            key={presentation.wallpaper.videoUrl}
            src={presentation.wallpaper.videoUrl}
            poster={presentation.wallpaper.image || undefined}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-64"
          />
        ) : presentation.wallpaper?.image ? (
          <img
            key={presentation.wallpaper.id}
            src={presentation.wallpaper.image}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover opacity-58 ${presentation.wallpaper.mediaType === 'animated' ? 'animate-[pulse_14s_ease-in-out_infinite]' : ''}`}
            style={{ transform: 'scale(1.045)', filter: 'saturate(.88) contrast(1.04)' }}
          />
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_4%,rgba(3,8,16,.06)_48%,rgba(3,8,16,.48)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-[#030813]/60 to-transparent" />
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#07101b]">
      {presentation.sky?.realtime ? (
        <RealTimeSky />
      ) : presentation.sky?.image ? (
        <img src={presentation.sky.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-52" style={{ filter: 'saturate(.84) contrast(1.02)' }} />
      ) : null}

      {!presentation.home?.bundledLand && presentation.land?.image && (
        <div className="absolute inset-x-[-4%] bottom-[-10%] h-[54%] overflow-hidden" style={{ transform: 'perspective(700px) rotateX(11deg)', transformOrigin: '50% 100%' }}>
          <img src={presentation.land.image} alt="" className="h-full w-full object-cover opacity-36" style={{ filter: 'saturate(.68) contrast(1.05)' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06101a]/76 via-[#06101a]/08 to-transparent" />
        </div>
      )}

      {/* Real 3D home files are loaded through Luna's existing changeEnvironment
          pipeline. Only image-only starter/fallback homes are painted here. */}
      {!presentation.home?.modelUrl && presentation.home?.id !== 'home-open-land' && presentation.home?.image && (
        <img
          src={presentation.home.image}
          alt=""
          className="absolute bottom-[-8%] left-[12%] h-[66%] w-[76%] object-contain object-bottom opacity-38"
          style={{ filter: 'saturate(.72) contrast(1.05)', maskImage: 'linear-gradient(to bottom, black 72%, transparent 100%)' }}
        />
      )}

      {config.weatherId === 'weather-rain' && (
        <div className="absolute inset-0 opacity-[0.14]" style={{ backgroundImage: 'repeating-linear-gradient(111deg, transparent 0 18px, rgba(190,230,255,.72) 19px, transparent 20px 31px)', backgroundSize: '145% 145%' }} />
      )}
      {config.weatherId === 'weather-snow' && (
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.95) 0 1px, transparent 1.7px)', backgroundSize: '27px 27px' }} />
      )}
      {config.weatherId === 'weather-fog' && <div className="absolute inset-0 bg-slate-100/[0.09] backdrop-blur-[2px]" />}
      {config.weatherId === 'weather-storm' && <div className="absolute inset-0 bg-slate-950/30" />}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_0%,rgba(2,6,13,.015)_48%,rgba(2,6,13,.32)_100%)]" />
    </div>
  );
}
