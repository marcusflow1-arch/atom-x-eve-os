// ─── Real-world moon + sky timing ──────────────────────────────────────
// Everything the dashboard sky needs, derived from the actual clock: the
// moon's phase tonight, where it sits in the sky right now, and how light
// the sky should be. No fake animation loop — it tracks real life.

const SYNODIC_MONTH = 29.530588853;               // days, new moon → new moon
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // reference new moon

/** 0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter. */
export function getMoonPhase(date = new Date()) {
  const days = (date.getTime() - KNOWN_NEW_MOON) / 86400000;
  const phase = (days % SYNODIC_MONTH) / SYNODIC_MONTH;
  return phase < 0 ? phase + 1 : phase;
}

/** Lit fraction of the disc, 0 (new) → 1 (full). */
export function getMoonIllumination(date = new Date()) {
  return (1 - Math.cos(getMoonPhase(date) * Math.PI * 2)) / 2;
}

export function getPhaseName(phase) {
  if (phase < 0.03 || phase > 0.97) return 'New Moon';
  if (phase < 0.22) return 'Waxing Crescent';
  if (phase < 0.28) return 'First Quarter';
  if (phase < 0.47) return 'Waxing Gibbous';
  if (phase < 0.53) return 'Full Moon';
  if (phase < 0.72) return 'Waning Gibbous';
  if (phase < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}

/**
 * Where the moon is right now, on real timing. The moon crosses the sky
 * roughly 50 minutes later each day, so its transit hour follows the phase:
 * a new moon transits near noon, a full moon near midnight.
 *
 * @returns {{ altitude, x, y, aboveHorizon, phase, illumination, phaseName }}
 *          altitude −1..1 (1 = overhead), x/y as 0..1 screen fractions.
 */
export function getMoonPosition(date = new Date()) {
  const phase = getMoonPhase(date);
  const hours = date.getHours() + date.getMinutes() / 60;

  const transitHour = (12 + phase * 24) % 24;
  // Hours from transit, wrapped to −12..12.
  let fromTransit = hours - transitHour;
  if (fromTransit > 12) fromTransit -= 24;
  if (fromTransit < -12) fromTransit += 24;

  // Above the horizon for ~12 hours either side of transit.
  const t = fromTransit / 6;                 // −1..1 across the visible arc
  const altitude = Math.cos((fromTransit / 12) * Math.PI);
  const aboveHorizon = altitude > 0;

  // East (left) → transit (centre) → west (right).
  const x = 0.5 + (fromTransit / 12) * 0.46;
  const y = 0.62 - Math.max(altitude, 0) * 0.52;   // higher altitude = higher up

  return {
    altitude,
    x: Math.min(0.96, Math.max(0.04, x)),
    y,
    aboveHorizon,
    phase,
    illumination: getMoonIllumination(date),
    phaseName: getPhaseName(phase),
    t,
  };
}

/**
 * Sky colours for the real local hour, so the dashboard sky matches the
 * time outside the window: night → dawn → day → dusk → night.
 */
export function getSkyPalette(date = new Date()) {
  const h = date.getHours() + date.getMinutes() / 60;

  const STOPS = [
    { h: 0,  top: '#050914', mid: '#0a1226', bot: '#101a2e', light: 0.06 },
    { h: 5,  top: '#0b1430', mid: '#1d2a52', bot: '#3a3f63', light: 0.16 },
    { h: 6.5,top: '#2a3d70', mid: '#6a5580', bot: '#c98a6a', light: 0.42 },
    { h: 8,  top: '#3f74b8', mid: '#7aa8d8', bot: '#b9d3ea', light: 0.78 },
    { h: 13, top: '#2f7fd0', mid: '#68a9e0', bot: '#bcd9f2', light: 1.0  },
    { h: 18, top: '#3a6fae', mid: '#8f8ec0', bot: '#e0a06a', light: 0.7  },
    { h: 20, top: '#1c2a55', mid: '#4a3f6e', bot: '#a05f5a', light: 0.34 },
    { h: 21.5,top:'#0a1128', mid: '#16203c', bot: '#243049', light: 0.12 },
    { h: 24, top: '#050914', mid: '#0a1226', bot: '#101a2e', light: 0.06 },
  ];

  let a = STOPS[0], b = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (h >= STOPS[i].h && h <= STOPS[i + 1].h) { a = STOPS[i]; b = STOPS[i + 1]; break; }
  }
  const span = b.h - a.h || 1;
  const k = Math.min(1, Math.max(0, (h - a.h) / span));

  return {
    top: mixHex(a.top, b.top, k),
    mid: mixHex(a.mid, b.mid, k),
    bot: mixHex(a.bot, b.bot, k),
    light: a.light + (b.light - a.light) * k,   // 0 = deep night, 1 = midday
  };
}

function mixHex(c1, c2, k) {
  const p = (c) => {
    const n = parseInt(c.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [r1, g1, b1] = p(c1);
  const [r2, g2, b2] = p(c2);
  const r = Math.round(r1 + (r2 - r1) * k);
  const g = Math.round(g1 + (g2 - g1) * k);
  const b = Math.round(b1 + (b2 - b1) * k);
  return `rgb(${r}, ${g}, ${b})`;
}