// Real-world climate profiles for the WorldEnvironmentSystem.
//
// Probabilities below are derived from 1991–2020 climate normals:
//   • Detroit, MI      — continental, Great Lakes (NOAA/weatherspark)
//   • Miami, FL         — tropical monsoon (Wikipedia/usclimatedata)
//   • Las Vegas, NV     — hot desert (NOAA/weatherspark)
//
// Each month (Jan=0 … Dec=11) carries:
//   wetChance     — P(any precipitation falls that day)        (rain+snow+mixed)
//   snowPortion   — P(a wet day is snow)                        (conditional)
//   stormPortion   — P(a wet, non-snow day is a thunderstorm)   (conditional)
//   fogChance     — P(fog that day)                            (independent)
//   cloudyChance  — P(overcast on a dry day)                    (conditional)
//   tempAvg       — mean temperature °F (HUD flavor)
//   precipStyle   — 'afternoon' | 'brief' | 'persistent'  (shapes rain windows)

export const CLIMATE_PROFILES = {
  michigan: {
    id: 'michigan',
    label: 'Detroit, MI',
    region: 'Great Lakes',
    blurb: 'Cold snowy winters, warm humid summers with thunderstorms.',
    months: [
      { wetChance: 0.16, snowPortion: 0.44, stormPortion: 0.03, fogChance: 0.05, cloudyChance: 0.40, tempAvg: 25, precipStyle: 'persistent' },
      { wetChance: 0.14, snowPortion: 0.46, stormPortion: 0.03, fogChance: 0.05, cloudyChance: 0.40, tempAvg: 28, precipStyle: 'persistent' },
      { wetChance: 0.21, snowPortion: 0.16, stormPortion: 0.06, fogChance: 0.07, cloudyChance: 0.38, tempAvg: 37, precipStyle: 'persistent' },
      { wetChance: 0.29, snowPortion: 0.00, stormPortion: 0.08, fogChance: 0.07, cloudyChance: 0.36, tempAvg: 49, precipStyle: 'persistent' },
      { wetChance: 0.34, snowPortion: 0.00, stormPortion: 0.12, fogChance: 0.06, cloudyChance: 0.34, tempAvg: 60, precipStyle: 'persistent' },
      { wetChance: 0.34, snowPortion: 0.00, stormPortion: 0.25, fogChance: 0.04, cloudyChance: 0.32, tempAvg: 70, precipStyle: 'persistent' },
      { wetChance: 0.35, snowPortion: 0.00, stormPortion: 0.28, fogChance: 0.03, cloudyChance: 0.30, tempAvg: 74, precipStyle: 'persistent' },
      { wetChance: 0.33, snowPortion: 0.00, stormPortion: 0.25, fogChance: 0.04, cloudyChance: 0.30, tempAvg: 72, precipStyle: 'persistent' },
      { wetChance: 0.30, snowPortion: 0.00, stormPortion: 0.12, fogChance: 0.06, cloudyChance: 0.32, tempAvg: 65, precipStyle: 'persistent' },
      { wetChance: 0.25, snowPortion: 0.02, stormPortion: 0.08, fogChance: 0.08, cloudyChance: 0.36, tempAvg: 53, precipStyle: 'persistent' },
      { wetChance: 0.21, snowPortion: 0.05, stormPortion: 0.05, fogChance: 0.08, cloudyChance: 0.40, tempAvg: 41, precipStyle: 'persistent' },
      { wetChance: 0.20, snowPortion: 0.22, stormPortion: 0.04, fogChance: 0.06, cloudyChance: 0.42, tempAvg: 31, precipStyle: 'persistent' },
    ],
  },
  miami: {
    id: 'miami',
    label: 'Miami, FL',
    region: 'Tropical',
    blurb: 'Hot wet summers with daily afternoon thunderstorms; dry warm winters.',
    months: [
      { wetChance: 0.26, snowPortion: 0.0, stormPortion: 0.05, fogChance: 0.02, cloudyChance: 0.18, tempAvg: 68, precipStyle: 'afternoon' },
      { wetChance: 0.22, snowPortion: 0.0, stormPortion: 0.05, fogChance: 0.02, cloudyChance: 0.18, tempAvg: 70, precipStyle: 'afternoon' },
      { wetChance: 0.21, snowPortion: 0.0, stormPortion: 0.05, fogChance: 0.02, cloudyChance: 0.18, tempAvg: 73, precipStyle: 'afternoon' },
      { wetChance: 0.23, snowPortion: 0.0, stormPortion: 0.08, fogChance: 0.02, cloudyChance: 0.18, tempAvg: 77, precipStyle: 'afternoon' },
      { wetChance: 0.36, snowPortion: 0.0, stormPortion: 0.25, fogChance: 0.02, cloudyChance: 0.22, tempAvg: 80, precipStyle: 'afternoon' },
      { wetChance: 0.59, snowPortion: 0.0, stormPortion: 0.45, fogChance: 0.02, cloudyChance: 0.30, tempAvg: 83, precipStyle: 'afternoon' },
      { wetChance: 0.58, snowPortion: 0.0, stormPortion: 0.45, fogChance: 0.02, cloudyChance: 0.30, tempAvg: 85, precipStyle: 'afternoon' },
      { wetChance: 0.65, snowPortion: 0.0, stormPortion: 0.45, fogChance: 0.02, cloudyChance: 0.32, tempAvg: 85, precipStyle: 'afternoon' },
      { wetChance: 0.60, snowPortion: 0.0, stormPortion: 0.45, fogChance: 0.02, cloudyChance: 0.30, tempAvg: 83, precipStyle: 'afternoon' },
      { wetChance: 0.46, snowPortion: 0.0, stormPortion: 0.25, fogChance: 0.02, cloudyChance: 0.25, tempAvg: 80, precipStyle: 'afternoon' },
      { wetChance: 0.29, snowPortion: 0.0, stormPortion: 0.08, fogChance: 0.02, cloudyChance: 0.20, tempAvg: 75, precipStyle: 'afternoon' },
      { wetChance: 0.27, snowPortion: 0.0, stormPortion: 0.05, fogChance: 0.02, cloudyChance: 0.18, tempAvg: 70, precipStyle: 'afternoon' },
    ],
  },
  nevada: {
    id: 'nevada',
    label: 'Las Vegas, NV',
    region: 'Desert',
    blurb: 'Mostly clear and dry; brief summer monsoon thunderstorms, rare winter rain.',
    months: [
      { wetChance: 0.09, snowPortion: 0.02, stormPortion: 0.04, fogChance: 0.02, cloudyChance: 0.10, tempAvg: 48, precipStyle: 'brief' },
      { wetChance: 0.11, snowPortion: 0.02, stormPortion: 0.08, fogChance: 0.02, cloudyChance: 0.10, tempAvg: 54, precipStyle: 'brief' },
      { wetChance: 0.08, snowPortion: 0.0,  stormPortion: 0.04, fogChance: 0.02, cloudyChance: 0.08, tempAvg: 60, precipStyle: 'brief' },
      { wetChance: 0.04, snowPortion: 0.0,  stormPortion: 0.04, fogChance: 0.01, cloudyChance: 0.06, tempAvg: 68, precipStyle: 'brief' },
      { wetChance: 0.02, snowPortion: 0.0,  stormPortion: 0.03, fogChance: 0.01, cloudyChance: 0.05, tempAvg: 78, precipStyle: 'brief' },
      { wetChance: 0.02, snowPortion: 0.0,  stormPortion: 0.03, fogChance: 0.01, cloudyChance: 0.04, tempAvg: 90, precipStyle: 'brief' },
      { wetChance: 0.08, snowPortion: 0.0,  stormPortion: 0.30, fogChance: 0.01, cloudyChance: 0.08, tempAvg: 97, precipStyle: 'brief' },
      { wetChance: 0.09, snowPortion: 0.0,  stormPortion: 0.30, fogChance: 0.01, cloudyChance: 0.08, tempAvg: 95, precipStyle: 'brief' },
      { wetChance: 0.06, snowPortion: 0.0,  stormPortion: 0.10, fogChance: 0.01, cloudyChance: 0.06, tempAvg: 87, precipStyle: 'brief' },
      { wetChance: 0.05, snowPortion: 0.0,  stormPortion: 0.05, fogChance: 0.01, cloudyChance: 0.06, tempAvg: 74, precipStyle: 'brief' },
      { wetChance: 0.05, snowPortion: 0.0,  stormPortion: 0.04, fogChance: 0.02, cloudyChance: 0.08, tempAvg: 60, precipStyle: 'brief' },
      { wetChance: 0.07, snowPortion: 0.02, stormPortion: 0.04, fogChance: 0.02, cloudyChance: 0.10, tempAvg: 49, precipStyle: 'brief' },
    ],
  },
};

export const CLIMATE_LIST = ['michigan', 'miami', 'nevada'];

export const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// 8 named lunar phases keyed off a 0..1 cycle (0 = new, 0.5 = full).
export function moonPhaseLabel(phase) {
  const p = ((phase % 1) + 1) % 1;
  if (p < 0.03 || p > 0.97) return 'New Moon';
  if (p < 0.22) return 'Waxing Crescent';
  if (p < 0.28) return 'First Quarter';
  if (p < 0.47) return 'Waxing Gibbous';
  if (p < 0.53) return 'Full Moon';
  if (p < 0.72) return 'Waning Gibbous';
  if (p < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}