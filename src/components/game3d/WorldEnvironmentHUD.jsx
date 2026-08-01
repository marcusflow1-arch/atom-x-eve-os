import React, { useEffect, useState } from 'react';
import { Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, Sun, Moon } from 'lucide-react';

/**
 * Small glass HUD showing the world clock, season, and current weather.
 * Polls the WorldEnvironmentSystem every 500ms (no per-frame React renders).
 */
const WEATHER_ICONS = {
  clear: Sun,
  cloudy: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
  fog: CloudFog,
};

const SEASON_COLOR = {
  spring: 'text-emerald-300',
  summer: 'text-amber-300',
  autumn: 'text-orange-300',
  winter: 'text-sky-300',
};

export default function WorldEnvironmentHUD({ system }) {
  const [snap, setSnap] = useState(null);

  useEffect(() => {
    if (!system) return;
    let alive = true;
    const tick = () => { if (alive) setSnap(system.getState()); };
    tick();
    const id = setInterval(tick, 500);
    return () => { alive = false; clearInterval(id); };
  }, [system]);

  if (!snap) return null;

  const isNight = snap.time < 6 || snap.time > 19;
  const WeatherIcon = WEATHER_ICONS[snap.weather] || Sun;
  const hh = String(snap.hours).padStart(2, '0');
  const mm = String(snap.minutes).padStart(2, '0');

  return (
    <div
      className="absolute top-3 right-3 z-30 flex items-center gap-2.5 px-3 py-2 rounded-xl pointer-events-none select-none"
      style={{
        background: 'rgba(10, 14, 22, 0.55)',
        backdropFilter: 'blur(14px) saturate(150%)',
        WebkitBackdropFilter: 'blur(14px) saturate(150%)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
      }}
    >
      {/* Time + day/night */}
      <div className="flex items-center gap-1.5">
        {isNight ? <Moon className="w-4 h-4 text-indigo-300" /> : <Sun className="w-4 h-4 text-yellow-300" />}
        <span className="text-xs font-bold text-white tabular-nums tracking-wide">{hh}:{mm}</span>
      </div>

      <div className="w-px h-5 bg-white/15" />

      {/* Season */}
      <div className="flex items-center gap-1">
        <span className={`text-[10px] font-black uppercase tracking-wider ${SEASON_COLOR[snap.seasonId] || 'text-white/80'}`}>
          {snap.seasonLabel}
        </span>
      </div>

      <div className="w-px h-5 bg-white/15" />

      {/* Weather */}
      <div className="flex items-center gap-1">
        <WeatherIcon className="w-4 h-4 text-cyan-200" />
        <span className="text-[10px] font-bold text-white/85">{snap.weatherLabel}</span>
      </div>
    </div>
  );
}