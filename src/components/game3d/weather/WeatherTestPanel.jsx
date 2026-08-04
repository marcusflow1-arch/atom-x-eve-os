import React, { useEffect, useState } from 'react';

/**
 * WeatherTestPanel — press U in the 3D world to open a weather sandbox:
 * force any weather type, jump the time of day, or switch season. "Auto"
 * hands control back to the live forecast.
 */

const WEATHERS = [
  { id: 'clear', label: 'Clear' },
  { id: 'cloudy', label: 'Cloudy' },
  { id: 'rain', label: 'Rain' },
  { id: 'storm', label: 'Storm' },
  { id: 'snow', label: 'Snow' },
  { id: 'hail', label: 'Hail' },
  { id: 'fog', label: 'Fog' },
];

const TIMES = [
  { label: 'Morning', hour: 7 },
  { label: 'Day', hour: 12 },
  { label: 'Evening', hour: 19.5 },
  { label: 'Night', hour: 23 },
];

const SEASONS = [
  { id: 'spring', label: 'Spring' },
  { id: 'summer', label: 'Summer' },
  { id: 'autumn', label: 'Autumn' },
  { id: 'winter', label: 'Winter' },
];

const btn = (on) =>
  `px-2.5 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-all border ${
    on
      ? 'bg-cyan-500/25 border-cyan-400/50 text-cyan-100'
      : 'bg-white/[0.04] border-white/10 text-white/60 hover:bg-white/[0.1] hover:text-white'
  }`;

export default function WeatherTestPanel({ system }) {
  const [open, setOpen] = useState(false);
  const [snap, setSnap] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key?.toLowerCase() !== 'u') return;
      const el = e.target;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      setOpen((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open || !system) return;
    const id = setInterval(() => setSnap(system.getState()), 400);
    setSnap(system.getState());
    return () => clearInterval(id);
  }, [open, system]);

  if (!open || !system) return null;

  const forced = snap?.manualWeather || null;
  const hour = snap?.hours ?? 0;
  const nearest = TIMES.reduce((best, t) => (Math.abs(t.hour - hour) < Math.abs(best.hour - hour) ? t : best), TIMES[0]);

  return (
    <div
      className="fixed left-4 top-1/2 -translate-y-1/2 z-[60] w-[236px] rounded-2xl p-3.5"
      style={{
        background: 'rgba(8, 12, 18, 0.72)',
        backdropFilter: 'blur(18px) saturate(150%)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.45)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold tracking-widest text-white/80">WEATHER SANDBOX</span>
        <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white text-xs px-1">✕</button>
      </div>

      <p className="text-[10px] text-white/40 mb-3">
        {snap ? `${String(snap.hours).padStart(2, '0')}:${String(snap.minutes).padStart(2, '0')} · ${snap.seasonLabel} · ${snap.weatherLabel}` : '—'}
      </p>

      <p className="text-[9px] font-bold tracking-widest text-white/35 mb-1.5">WEATHER</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {WEATHERS.map((w) => (
          <button key={w.id} className={btn(forced === w.id)} onClick={() => system.setWeather(w.id)}>
            {w.label}
          </button>
        ))}
        <button className={btn(!forced)} onClick={() => system.clearWeatherOverride()}>Auto</button>
      </div>

      <p className="text-[9px] font-bold tracking-widest text-white/35 mb-1.5">TIME OF DAY</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {TIMES.map((t) => (
          <button
            key={t.label}
            className={btn(nearest.label === t.label && Math.abs(t.hour - hour) < 2)}
            onClick={() => system.setTime(t.hour)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="text-[9px] font-bold tracking-widest text-white/35 mb-1.5">SEASON</p>
      <div className="flex flex-wrap gap-1.5">
        {SEASONS.map((s) => (
          <button key={s.id} className={btn(snap?.seasonId === s.id)} onClick={() => system.setSeason(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      <p className="text-[9px] text-white/25 mt-3">U toggles · T spawns a tornado</p>
    </div>
  );
}