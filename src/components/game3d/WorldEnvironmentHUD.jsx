import React, { useEffect, useState } from 'react';
import { Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, Sun, Moon } from 'lucide-react';

/**
 * Glass HUD for the WorldEnvironmentSystem. Shows the world clock, season,
 * live weather, the active climate city (click to cycle), today's forecast
 * (rain/snow chance + temp), and the current moon phase. Polls every 500ms.
 */
const WEATHER_ICONS = {
  clear: Sun, cloudy: Cloud, rain: CloudRain,
  snow: CloudSnow, storm: CloudLightning, fog: CloudFog,
};

const SEASON_COLOR = {
  spring: 'text-emerald-300', summer: 'text-amber-300',
  autumn: 'text-orange-300', winter: 'text-sky-300',
};

// Moon glyph that tracks the illuminated fraction.
function MoonGlyph({ illum, eclipse }) {
  if (eclipse) return <Moon className="w-4 h-4 text-red-300" />;
  return <Moon className="w-4 h-4 text-indigo-300" style={{ opacity: 0.35 + 0.65 * illum }} />;
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
  const fc = snap.forecast || {};
  const moonPct = Math.round((snap.moonIllum || 0) * 100);

  return (
    <div
      className="absolute top-3 right-3 z-30 flex flex-col gap-1.5 px-3 py-2 rounded-xl pointer-events-none select-none"
      style={{
        background: 'rgba(10, 14, 22, 0.55)',
        backdropFilter: 'blur(14px) saturate(150%)',
        WebkitBackdropFilter: 'blur(14px) saturate(150%)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
      }}
    >
      {/* Row 1 — clock · season · weather */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5">
          {isNight ? <Moon className="w-4 h-4 text-indigo-300" /> : <Sun className="w-4 h-4 text-yellow-300" />}
          <span className="text-xs font-bold text-white tabular-nums tracking-wide">{hh}:{mm}</span>
        </div>
        <div className="w-px h-5 bg-white/15" />
        <span className={`text-[10px] font-black uppercase tracking-wider ${SEASON_COLOR[snap.seasonId] || 'text-white/80'}`}>
          {snap.seasonLabel}
        </span>
        <div className="w-px h-5 bg-white/15" />
        <div className="flex items-center gap-1">
          <WeatherIcon className="w-4 h-4 text-cyan-200" />
          <span className="text-[10px] font-bold text-white/85">{snap.weatherLabel}</span>
          {snap.precipActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
        </div>
      </div>

      {/* Row 2 — climate (click to cycle) + moon phase */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => system.cycleClimate?.()}
          className="pointer-events-auto flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          title={snap.blurb}
        >
          <span className="text-[9px] font-black uppercase tracking-wider text-white/70">{snap.climateLabel}</span>
          <span className="text-[8px] text-white/35">↻</span>
        </button>
        <div className="w-px h-4 bg-white/15" />
        <div className="flex items-center gap-1">
          <MoonGlyph illum={snap.moonIllum || 0} eclipse={snap.eclipse} />
          <span className="text-[9px] font-bold text-white/75">{snap.moonPhaseLabel}</span>
          <span className="text-[8px] text-white/40 tabular-nums">{moonPct}%</span>
        </div>
      </div>

      {/* Row 3 — today's forecast */}
      <div className="flex items-center gap-2 text-[9px] text-white/55">
        <span className="font-bold text-white/70">Today</span>
        <span className="text-cyan-300 tabular-nums">Rain {fc.rainChancePct ?? 0}%</span>
        {(fc.snowChancePct ?? 0) > 0 && <span className="text-sky-300 tabular-nums">Snow {fc.snowChancePct}%</span>}
        {(fc.stormChancePct ?? 0) > 0 && <span className="text-amber-300 tabular-nums">Storm {fc.stormChancePct}%</span>}
        <span className="text-white/40 tabular-nums">{fc.tempAvg ?? 0}°F</span>
        <span className="text-white/30">· {fc.monthLabel}</span>
        {snap.eclipse && <span className="text-red-300 font-bold">Eclipse</span>}
      </div>
    </div>
  );
}