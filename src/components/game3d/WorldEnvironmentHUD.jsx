import React, { useEffect, useState } from 'react';
import {
  Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog,
  Sun, Moon, Wind, Droplets, Thermometer,
} from 'lucide-react';

/**
 * Glass HUD for the WorldEnvironmentSystem. Shows the world clock, season, the
 * LIVE weather (driven by the real NWS 7-day forecast for Detroit, MI — no
 * city name / cycle control), the current hour's detail (temp, wind, precip %,
 * humidity), the current moon phase, and a compact 7-day forecast strip.
 * Polls the system state every 500ms.
 */

const WEATHER_ICONS = {
  clear: Sun, cloudy: Cloud, rain: CloudRain,
  snow: CloudSnow, storm: CloudLightning, fog: CloudFog,
};

const SEASON_COLOR = {
  spring: 'text-emerald-300', summer: 'text-amber-300',
  autumn: 'text-orange-300', winter: 'text-sky-300',
};

function MoonGlyph({ illum, eclipse }) {
  if (eclipse) return <Moon className="w-3.5 h-3.5 text-red-300" />;
  return <Moon className="w-3.5 h-3.5 text-indigo-300" style={{ opacity: 0.35 + 0.65 * illum }} />;
}

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
  const moonPct = Math.round((snap.moonIllum || 0) * 100);
  const days = Array.isArray(snap.days) ? snap.days.slice(0, 7) : [];

  return (
    <div
      className="absolute top-3 right-3 z-30 flex flex-col gap-1.5 px-3 py-2 rounded-xl pointer-events-none select-none w-[236px]"
      style={{
        background: 'rgba(10, 14, 22, 0.55)',
        backdropFilter: 'blur(14px) saturate(150%)',
        WebkitBackdropFilter: 'blur(14px) saturate(150%)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
      }}
    >
      {/* Row 1 — clock · season · weather */}
      <div className="flex items-center gap-2">
        {isNight ? <Moon className="w-4 h-4 text-indigo-300" /> : <Sun className="w-4 h-4 text-yellow-300" />}
        <span className="text-xs font-bold text-white tabular-nums tracking-wide">{hh}:{mm}</span>
        <div className="w-px h-4 bg-white/15" />
        <span className={`text-[10px] font-black uppercase tracking-wider ${SEASON_COLOR[snap.seasonId] || 'text-white/80'}`}>
          {snap.seasonLabel}
        </span>
        <div className="w-px h-4 bg-white/15" />
        <WeatherIcon className="w-4 h-4 text-cyan-200 flex-shrink-0" />
        <span className="text-[10px] font-bold text-white/85 truncate flex-1">{snap.weatherLabel}</span>
        {snap.precipActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />}
      </div>

      {/* Row 2 — live detail: temp · wind · precip % */}
      <div className="flex items-center gap-2.5 text-[9px] text-white/70">
        <span className="flex items-center gap-1">
          <Thermometer className="w-3 h-3 text-orange-300" />
          <span className="tabular-nums font-bold text-white/90">{snap.tempF != null ? `${Math.round(snap.tempF)}°F` : '—'}</span>
        </span>
        <span className="flex items-center gap-1">
          <Wind className="w-3 h-3 text-teal-300" />
          <span className="tabular-nums font-bold text-white/90">
            {snap.windMph != null ? `${snap.windMph}mph` : '—'}{snap.windDir ? ` ${snap.windDir}` : ''}
          </span>
        </span>
        <span className="flex items-center gap-1">
          <Droplets className="w-3 h-3 text-cyan-300" />
          <span className="tabular-nums font-bold text-white/90">{snap.precipProb != null ? `${snap.precipProb}%` : '—'}</span>
        </span>
      </div>

      {/* Row 3 — moon phase */}
      <div className="flex items-center gap-1.5">
        <MoonGlyph illum={snap.moonIllum || 0} eclipse={snap.eclipse} />
        <span className="text-[9px] font-bold text-white/75">{snap.moonPhaseLabel}</span>
        <span className="text-[8px] text-white/40 tabular-nums">{moonPct}%</span>
        {snap.eclipse && <span className="text-[8px] text-red-300 font-bold ml-1">Eclipse</span>}
      </div>

      {/* Row 4 — 7-day forecast strip */}
      {days.length > 0 && (
        <div className="flex items-stretch gap-1 mt-0.5 pt-1.5 border-t border-white/10">
          {days.map((d, i) => {
            const Icon = WEATHER_ICONS[d.dominant] || Sun;
            const tint = d.storm ? 'text-amber-300' : d.snow ? 'text-sky-300'
              : d.rain ? 'text-cyan-300' : d.fog ? 'text-slate-300' : 'text-yellow-200';
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <span className="text-[7px] font-black uppercase text-white/45">{i === 0 ? 'Now' : d.dayName}</span>
                <Icon className={`w-3.5 h-3.5 ${tint}`} />
                <span className="text-[7px] font-bold text-white/85 tabular-nums leading-none">{d.hi}°</span>
                <span className="text-[7px] text-white/40 tabular-nums leading-none">{d.lo}°</span>
                {d.maxPrecipProb > 0 && (
                  <span className="text-[6px] text-cyan-300/70 tabular-nums leading-none">{d.maxPrecipProb}%</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}