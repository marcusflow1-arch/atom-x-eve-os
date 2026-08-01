import * as THREE from 'three';
import { CLIMATE_PROFILES, CLIMATE_LIST, MONTH_LABELS, moonPhaseLabel } from './worldClimateData';

/**
 * WorldEnvironmentSystem
 *
 * A physically-flavoured day/night + season + weather engine driven by REAL
 * climate data (Detroit MI / Miami FL / Las Vegas NV — see worldClimateData.js).
 *
 * What it models:
 *   • 24h day/night cycle — gradient sky dome, moving sun + moon, starfield
 *   • 4-season cycle that advances with in-game days
 *   • LUNAR PHASE — 29.53-day synodic cycle.  Full moon nights are brightly
 *     moonlit (NOT pitch black); new moon nights are starlit-dark.  Rare lunar
 *     eclipses drop a full-moon night to near pitch black.
 *   • PROBABILISTIC DAILY FORECAST — at each in-game midnight the system rolls
 *     today's weather using the climate profile for the current month, the
 *     way a meteorologist would: "is it a wet day? (wetChance) … then is that
 *     wet day snow? a thunderstorm? …".  Some days rain, some don't.
 *   • INTRA-DAY RAIN WINDOWS — a wet day has 1–2 precip windows (start/end in
 *     hours). Rain/storm can START, fall for a while, then STOP, then maybe
 *     resume — exactly the "rain and then decide to stop" behaviour.
 *   • Dynamic weather rendering: rain (line streaks), snow (drifting points),
 *     storms (rain + lightning flashes), fog, cloud cover.
 *
 * Factory: createWorldEnvironmentSystem({ scene, sun, hemi, fog, camera, renderer,
 *   dayLengthSeconds, seasonCycleDays, climate })
 * Returns: { update, getState, setSeason, setWeather, setTime, setClimate,
 *            cycleClimate, dispose }
 */

// ── Seasons ──────────────────────────────────────────────────────────────
const SEASONS = [
  { id: 'spring', label: 'Spring', fogTint: 0x9fc7a0, sunBoost: 1.0 },
  { id: 'summer', label: 'Summer', fogTint: 0xbfd8ff, sunBoost: 1.15 },
  { id: 'autumn', label: 'Autumn', fogTint: 0xc9a36b, sunBoost: 0.92 },
  { id: 'winter', label: 'Winter', fogTint: 0xd6e2ee, sunBoost: 0.80 },
];

const WEATHER_LABELS = {
  clear: 'Clear', cloudy: 'Cloudy', rain: 'Rain',
  snow: 'Snow', storm: 'Storm', fog: 'Fog',
};

// Cloud-cover factor per weather state (0 = none, 1 = overcast).
const CLOUD_COVER = {
  clear: 0.10, cloudy: 0.60, rain: 0.85, storm: 0.95, snow: 0.75, fog: 0.90,
};

// Time-of-day keyframes: top sky, bottom sky, sun color, sun intensity, hemi
// color, hemi intensity, fog color.
const TIME_KEYS = [
  { h: 0,    top: 0x05070f, bot: 0x0a0f1c, sun: 0x2a3550, si: 0.00, hemi: 0x1a2238, hi: 0.22, fog: 0x06080f },
  { h: 5,    top: 0x1a1f3a, bot: 0x3a2a4a, sun: 0xff8a4a, si: 0.35, hemi: 0x3a4060, hi: 0.45, fog: 0x2a2535 },
  { h: 6.5,  top: 0x4a6a9a, bot: 0xff9a5a, sun: 0xffb070, si: 1.20, hemi: 0x88a0c0, hi: 0.70, fog: 0x6a5a55 },
  { h: 12,   top: 0x4a86c8, bot: 0xb0d0f0, sun: 0xfff4d6, si: 2.20, hemi: 0xcfe4ff, hi: 1.00, fog: 0x90a8c0 },
  { h: 17,   top: 0x5a7ab0, bot: 0xe0b080, sun: 0xffd090, si: 1.55, hemi: 0xaab8d0, hi: 0.80, fog: 0x807060 },
  { h: 18.5, top: 0x3a4a7a, bot: 0xd07050, sun: 0xff7050, si: 0.65, hemi: 0x6a6080, hi: 0.50, fog: 0x5a4040 },
  { h: 20,   top: 0x1a1f3a, bot: 0x2a2540, sun: 0x40355a, si: 0.18, hemi: 0x3a3550, hi: 0.34, fog: 0x1a1825 },
  { h: 24,   top: 0x05070f, bot: 0x0a0f1c, sun: 0x2a3550, si: 0.00, hemi: 0x1a2238, hi: 0.22, fog: 0x06080f },
];

// Weather multipliers layered on top of the time palette.
const WEATHER_MOD = {
  clear:  { si: 1.0,  hi: 1.0,  fogFar: 1.0,  fogMul: 1.0,  dim: 0.0 },
  cloudy: { si: 0.55, hi: 0.9,  fogFar: 0.85, fogMul: 0.95, dim: 0.25 },
  rain:   { si: 0.30, hi: 0.85, fogFar: 0.60, fogMul: 0.75, dim: 0.45 },
  storm:  { si: 0.15, hi: 0.70, fogFar: 0.45, fogMul: 0.60, dim: 0.60 },
  snow:   { si: 0.60, hi: 1.0,  fogFar: 0.70, fogMul: 1.15, dim: 0.15 },
  fog:    { si: 0.40, hi: 0.9,  fogFar: 0.22, fogMul: 0.90, dim: 0.40 },
};

const lerp = (a, b, t) => a + (b - a) * t;

function sampleTime(time) {
  let prev = TIME_KEYS[0], next = TIME_KEYS[TIME_KEYS.length - 1];
  for (let i = 0; i < TIME_KEYS.length - 1; i++) {
    if (time >= TIME_KEYS[i].h && time <= TIME_KEYS[i + 1].h) {
      prev = TIME_KEYS[i]; next = TIME_KEYS[i + 1]; break;
    }
  }
  const span = next.h - prev.h || 1;
  const t = Math.min(1, Math.max(0, (time - prev.h) / span));
  return {
    top: new THREE.Color(prev.top).lerp(new THREE.Color(next.top), t),
    bot: new THREE.Color(prev.bot).lerp(new THREE.Color(next.bot), t),
    sun: new THREE.Color(prev.sun).lerp(new THREE.Color(next.sun), t),
    si: lerp(prev.si, next.si, t),
    hemi: new THREE.Color(prev.hemi).lerp(new THREE.Color(next.hemi), t),
    hi: lerp(prev.hi, next.hi, t),
    fog: new THREE.Color(prev.fog).lerp(new THREE.Color(next.fog), t),
  };
}

// Build 1–2 precipitation windows (start,end in hours) for a wet day.
function rollWindows(style, type) {
  if (style === 'afternoon') {
    // Miami: a single afternoon downpour, often a thunderstorm.
    const start = 12 + Math.random() * 4;          // 12:00–16:00
    const dur = type === 'storm' ? 1 + Math.random() * 1.5 : 1.5 + Math.random() * 2.5;
    return [{ start, end: Math.min(24, start + dur) }];
  }
  if (style === 'brief') {
    // Desert: rare, short, any time of day.
    const start = Math.random() * 22;
    const dur = 0.5 + Math.random() * 1.5;
    return [{ start, end: Math.min(24, start + dur) }];
  }
  // Persistent (Michigan): 1–2 windows, spread across the day, longer for snow.
  const windows = [];
  const count = Math.random() < 0.35 ? 2 : 1;
  let cursor = Math.random() * 8;
  for (let i = 0; i < count; i++) {
    const dur = type === 'snow' ? 5 + Math.random() * 5 : 3 + Math.random() * 4;
    windows.push({ start: cursor, end: Math.min(24, cursor + dur) });
    cursor = Math.min(24, cursor + dur + 3 + Math.random() * 4);
    if (cursor >= 24) break;
  }
  return windows;
}

// Roll today's forecast like a meteorologist: is it wet? then snow or storm?
function rollForecast(climate, monthIndex) {
  const m = climate.months[monthIndex];
  const wet = Math.random() < m.wetChance;
  let type = null;
  let windows = [];
  if (wet) {
    const snow = Math.random() < m.snowPortion;
    const storm = !snow && Math.random() < m.stormPortion;
    type = snow ? 'snow' : storm ? 'storm' : 'rain';
    windows = rollWindows(m.precipStyle, type);
  }
  const foggy = Math.random() < m.fogChance;
  const cloudy = !wet && Math.random() < m.cloudyChance;
  return {
    wet, type, windows, foggy, cloudy,
    rainChancePct: Math.round(m.wetChance * 100),
    snowChancePct: Math.round(m.wetChance * m.snowPortion * 100),
    stormChancePct: Math.round(m.wetChance * (1 - m.snowPortion) * m.stormPortion * 100),
    tempAvg: m.tempAvg,
    monthIndex,
    monthLabel: MONTH_LABELS[monthIndex],
  };
}

// Resolve the live weather state from the forecast + current time.
function resolveWeather(time, fc, manual) {
  if (manual) return manual;
  let precipActive = false;
  for (const w of fc.windows) {
    if (time >= w.start && time < w.end) { precipActive = true; break; }
  }
  if (precipActive) return fc.type;            // rain / snow / storm
  if (fc.foggy) return 'fog';
  if (fc.cloudy || fc.wet) return 'cloudy';    // between rain windows on a wet day
  return 'clear';
}

export function createWorldEnvironmentSystem({
  scene, sun, hemi, fog, camera, renderer,
  dayLengthSeconds = 240,   // one full 24h cycle
  seasonCycleDays = 5,      // in-game days per season
  climate: initialClimate = 'michigan',
}) {
  if (!scene || !sun || !hemi || !fog) {
    console.warn('[WorldEnvironmentSystem] missing required deps');
    return {
      update() {}, getState: () => ({}), setSeason() {}, setWeather() {},
      setTime() {}, setClimate() {}, cycleClimate() {}, dispose() {},
    };
  }

  const SYODIC = 29.53; // lunar synodic month in days

  const state = {
    time: 8,
    seasonIndex: 1,        // start Summer
    dayCounter: 0,
    climateId: initialClimate,
    manualWeather: null,   // setWeather override, cleared at next midnight roll
    lunarDay: 7.4,          // start near a waxing gibbous moon
    eclipse: false,         // lunar eclipse active right now
    eclipseToday: false,
    eclipseStart: 0,
    weatherTimer: 0,
    intensity: 1,
    lightningTimer: 0,
    lightningFlash: 0,
    forecast: null,
    currentWeather: 'clear',
    // Real NWS 7-day forecast for Detroit, MI (loaded by GameWorld3D).
    hours: null,            // 168 normalized hourly records
    days: null,             // 7-day summary
    fetchedAt: null,
    useRealForecast: false,
    currentHour: null,      // resolved forecast hour object
  };

  const climateOf = (id) => CLIMATE_PROFILES[id] || CLIMATE_PROFILES.michigan;

  // Month index derived from day-of-year position across 12 months.
  const monthIndexFor = () => {
    const yearLen = seasonCycleDays * 4;            // in-game days per full year
    const prog = (state.dayCounter % yearLen) / yearLen;
    return Math.floor(prog * 12) % 12;
  };

  // Season follows the calendar month so winter months read as winter, etc.
  // Dec/Jan/Feb → winter, Mar/Apr/May → spring, Jun/Jul/Aug → summer,
  // Sep/Oct/Nov → autumn.
  const seasonForMonth = (m) => {
    if (m === 11 || m === 0 || m === 1) return 3; // winter
    if (m >= 2 && m <= 4) return 0;               // spring
    if (m >= 5 && m <= 7) return 1;               // summer
    return 2;                                      // autumn
  };

  const rollDaily = () => {
    // Weather comes from the real NWS forecast once loaded; only fall back to
    // the probabilistic climate model before the first fetch succeeds.
    if (!state.useRealForecast) {
      state.forecast = rollForecast(climateOf(state.climateId), monthIndexFor());
    }
    state.manualWeather = null;
    // Eclipse roll: only at a full moon, ~6% of full-moon days.
    const phase = (state.lunarDay % SYODIC) / SYODIC;
    const moonIllum = (1 - Math.cos(2 * Math.PI * phase)) / 2;
    state.eclipseToday = moonIllum > 0.9 && Math.random() < 0.06;
    state.eclipseStart = 0.4 + Math.random() * 2.0; // around moon culmination
    state.eclipse = false;
  };

  rollDaily();

  // Resolve the forecast hour that matches the current in-game day/hour.
  // In-game day d (0-based) → forecast day d; hour h → hour h. The 7-day
  // forecast is replayed over 7 in-game days, then re-fetched by the host.
  const resolveForecastHour = () => {
    if (!state.hours || state.hours.length === 0) return null;
    const dayInCycle = state.dayCounter % 7;
    const idx = dayInCycle * 24 + Math.floor(state.time);
    return state.hours[Math.min(idx, state.hours.length - 1)] || null;
  };

  // Load a freshly-fetched NWS forecast (called by GameWorld3D).
  const loadForecast = (data) => {
    if (!data || !Array.isArray(data.hours) || data.hours.length === 0) return;
    state.hours = data.hours;
    state.days = data.days || null;
    state.fetchedAt = data.fetchedAt || new Date().toISOString();
    state.useRealForecast = true;
    state.manualWeather = null;
  };

  // ── Sky dome (gradient shader) ────────────────────────────────────────
  const skyUniforms = {
    topColor: { value: new THREE.Color(0x4a86c8) },
    bottomColor: { value: new THREE.Color(0xb0d0f0) },
    offset: { value: 12 },
    exponent: { value: 0.7 },
  };
  const skyMat = new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    side: THREE.BackSide,
    depthWrite: false, depthTest: false, fog: false,
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vPos;
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      void main() {
        float h = normalize(vPos + vec3(0.0, offset, 0.0)).y;
        float t = max(pow(max(h, 0.0), exponent), 0.0);
        gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
      }
    `,
  });
  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(198, 32, 16), skyMat);
  skyDome.renderOrder = -1000;
  skyDome.frustumCulled = false;
  scene.add(skyDome);
  scene.background = null;

  // ── Sun + Moon discs (sprites) ────────────────────────────────────────
  const makeDisc = (color, size) => {
    const tex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const g = c.getContext('2d');
      const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.35, 'rgba(255,255,255,0.85)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    })();
    const mat = new THREE.SpriteMaterial({
      map: tex, color, transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, depthTest: false, fog: false,
    });
    const s = new THREE.Sprite(mat);
    s.scale.set(size, size, 1);
    s.renderOrder = -900;
    return s;
  };
  const sunDisc = makeDisc(0xfff4d6, 14);
  const moonDisc = makeDisc(0xcfd8ff, 8);
  scene.add(sunDisc, moonDisc);

  // ── Starfield ──────────────────────────────────────────────────────────
  const STAR_COUNT = 900;
  const starPos = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    const u = Math.random(), v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = 190;
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.9 + 10;
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff, size: 0.9, sizeAttenuation: true,
    transparent: true, opacity: 0, depthWrite: false, depthTest: false, fog: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  stars.renderOrder = -950; stars.frustumCulled = false;
  scene.add(stars);

  // ── Moonlight (directional, non-shadowing) ─────────────────────────────
  const moonLight = new THREE.DirectionalLight(0x9fb4ff, 0);
  moonLight.castShadow = false;
  scene.add(moonLight);

  // ── Rain ───────────────────────────────────────────────────────────────
  const RAIN_COUNT = 2600;
  const RAIN_AREA = 110;
  const rainPositions = new Float32Array(RAIN_COUNT * 6);
  const rainVel = new Float32Array(RAIN_COUNT);
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  const rainMat = new THREE.LineBasicMaterial({
    color: 0xa8c0e0, transparent: true, opacity: 0, depthWrite: false, fog: false,
  });
  const rain = new THREE.LineSegments(rainGeo, rainMat);
  rain.frustumCulled = false;
  scene.add(rain);
  for (let i = 0; i < RAIN_COUNT; i++) {
    const x = (Math.random() - 0.5) * RAIN_AREA;
    const y = Math.random() * 70;
    const z = (Math.random() - 0.5) * RAIN_AREA;
    rainPositions[i * 6] = x;     rainPositions[i * 6 + 1] = y;      rainPositions[i * 6 + 2] = z;
    rainPositions[i * 6 + 3] = x; rainPositions[i * 6 + 4] = y - 1.1; rainPositions[i * 6 + 5] = z;
    rainVel[i] = 30 + Math.random() * 22;
  }

  // ── Snow ───────────────────────────────────────────────────────────────
  const SNOW_COUNT = 1500;
  const SNOW_AREA = 110;
  const snowPos = new Float32Array(SNOW_COUNT * 3);
  const snowVel = new Float32Array(SNOW_COUNT);
  const snowDrift = new Float32Array(SNOW_COUNT);
  for (let i = 0; i < SNOW_COUNT; i++) {
    snowPos[i * 3] = (Math.random() - 0.5) * SNOW_AREA;
    snowPos[i * 3 + 1] = Math.random() * 70;
    snowPos[i * 3 + 2] = (Math.random() - 0.5) * SNOW_AREA;
    snowVel[i] = 4 + Math.random() * 4;
    snowDrift[i] = Math.random() * Math.PI * 2;
  }
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
  const snowMat = new THREE.PointsMaterial({
    color: 0xffffff, size: 0.55, sizeAttenuation: true,
    transparent: true, opacity: 0, depthWrite: false, fog: false,
  });
  const snow = new THREE.Points(snowGeo, snowMat);
  snow.frustumCulled = false;
  scene.add(snow);

  // ── Lightning ──────────────────────────────────────────────────────────
  const lightning = new THREE.PointLight(0xbfd0ff, 0, 120, 2);
  scene.add(lightning);

  // ── Public controls ────────────────────────────────────────────────────
  const setSeason = (id) => {
    const idx = SEASONS.findIndex((s) => s.id === id);
    if (idx >= 0) { state.seasonIndex = idx; rollDaily(); }
  };
  const setWeather = (id) => {
    if (WEATHER_LABELS[id]) state.manualWeather = id;
  };
  const setTime = (h) => { state.time = ((h % 24) + 24) % 24; };
  const setClimate = (id) => {
    if (CLIMATE_PROFILES[id]) { state.climateId = id; rollDaily(); }
  };
  const cycleClimate = () => {
    const idx = CLIMATE_LIST.indexOf(state.climateId);
    const next = CLIMATE_LIST[(idx + 1) % CLIMATE_LIST.length];
    setClimate(next);
    return next;
  };

  const getState = () => {
    const phase = (state.lunarDay % SYODIC) / SYODIC;
    const moonIllum = (1 - Math.cos(2 * Math.PI * phase)) / 2;
    const weather = state.currentWeather;
    let precipActive = false;
    if (state.useRealForecast) {
      precipActive = !!(state.currentHour && state.currentHour.precipType);
    } else if (state.forecast) {
      for (const w of state.forecast.windows) {
        if (state.time >= w.start && state.time < w.end) { precipActive = true; break; }
      }
    }
    const climate = climateOf(state.climateId);
    const ch = state.currentHour;
    return {
      time: state.time,
      hours: Math.floor(state.time),
      minutes: Math.floor((state.time % 1) * 60),
      seasonId: SEASONS[state.seasonIndex].id,
      seasonLabel: SEASONS[state.seasonIndex].label,
      weather,
      weatherLabel: ch?.shortForecast || WEATHER_LABELS[weather] || weather,
      dayCounter: state.dayCounter,
      climate: state.climateId,
      climateLabel: climate.label,
      region: climate.region,
      blurb: climate.blurb,
      moonPhase: phase,
      moonIllum,
      moonPhaseLabel: moonPhaseLabel(phase),
      eclipse: state.eclipse,
      precipActive,
      forecast: state.forecast,
      // Live NWS detail for the current hour.
      tempF: ch?.tempF ?? null,
      windMph: ch?.windMph ?? null,
      windDir: ch?.windDir ?? null,
      precipProb: ch?.precipProb ?? null,
      humidity: ch?.humidity ?? null,
      shortForecast: ch?.shortForecast ?? null,
      isDaytime: ch?.isDaytime ?? null,
      days: state.days,
      fetchedAt: state.fetchedAt,
      isNight: state.time < 6 || state.time > 19,
    };
  };

  // ── Per-frame update ───────────────────────────────────────────────────
  const tmpDir = new THREE.Vector3();
  const moonDir = new THREE.Vector3();
  const tmpColor = new THREE.Color();
  const moonLitColor = new THREE.Color(0x1a2540);
  let shadowDirtyTimer = 0;

  const update = (dt) => {
    const prevDay = state.dayCounter;
    // advance time
    state.time += dt * (24 / dayLengthSeconds);
    while (state.time >= 24) {
      state.time -= 24;
      state.dayCounter += 1;
      // advance lunar day (one synodic day per in-game day)
      state.lunarDay += 1;
    }
    // Season tracks the calendar month (winter months read as winter, etc.).
    state.seasonIndex = seasonForMonth(monthIndexFor());
    // New in-game day → roll a fresh probabilistic forecast (fallback only).
    if (state.dayCounter !== prevDay) rollDaily();

    // Lunar phase
    const phase = (state.lunarDay % SYODIC) / SYODIC;
    const moonIllumRaw = (1 - Math.cos(2 * Math.PI * phase)) / 2; // 0 new .. 1 full

    // Resolve the current weather. When a real NWS forecast is loaded, the
    // weather category + cloud cover + precip intensity all come from the
    // forecast hour that maps to the current in-game day/hour. Otherwise fall
    // back to the probabilistic climate model.
    if (state.useRealForecast) {
      state.currentHour = resolveForecastHour();
      if (state.manualWeather) {
        state.currentWeather = state.manualWeather;
      } else if (state.currentHour) {
        state.currentWeather = state.currentHour.category;
      } else {
        state.currentWeather = 'clear';
      }
      // Precip intensity scales with the forecast's precip probability so a
      // "slight chance" hour drizzles and a "heavy rain" hour pours.
      if (state.currentHour && state.currentHour.precipType) {
        const p = state.currentHour.precipProb ?? 60;
        state.intensity = 0.4 + Math.min(1, p / 100) * 0.6;
      } else {
        state.intensity = 1;
      }
    } else {
      state.currentHour = null;
      state.currentWeather = resolveWeather(state.time, state.forecast, state.manualWeather);
      state.intensity = 1;
    }
    const weather = state.currentWeather;
    const mod = WEATHER_MOD[weather] || WEATHER_MOD.clear;
    const cloudCover = state.currentHour?.cloudCover ?? (CLOUD_COVER[weather] ?? 0.1);

    // Eclipse window: full-moon night only, ~0.6 in-game hours.
    const night = Math.max(0, -Math.sin(((state.time - 6) / 12) * Math.PI)); // 0..1 at midnight
    if (state.eclipseToday && state.time >= state.eclipseStart && state.time < state.eclipseStart + 0.6) {
      state.eclipse = true;
    } else {
      state.eclipse = false;
    }

    const pal = sampleTime(state.time);
    const season = SEASONS[state.seasonIndex];

    // Sun elevation + direction
    const elev = Math.sin(((state.time - 6) / 12) * Math.PI);  // -1..1
    const azimuth = (state.time / 24) * Math.PI * 2;
    const cosEl = Math.cos(elev);
    tmpDir.set(
      Math.cos(azimuth) * cosEl,
      Math.sin(elev),
      Math.sin(azimuth) * cosEl,
    ).normalize();

    // Moon sits opposite the sun (so it's up at night).
    moonDir.copy(tmpDir).multiplyScalar(-1).normalize();

    const day = Math.max(0, elev);
    const nightFactor = Math.max(0, -elev);

    // Sun (directional) intensity/color
    sun.position.copy(tmpDir).multiplyScalar(60);
    sun.intensity = pal.si * day * season.sunBoost * mod.si;
    sun.color.copy(pal.sun);

    // Effective moonlight: full-moon bright, clouds dim it, eclipse zeroes it.
    const effMoonIllum = state.eclipse ? 0 : moonIllumRaw * (1 - 0.6 * cloudCover);
    const moonlight = 0.22 * effMoonIllum;       // ~0.22 lux-equivalent at full clear moon
    const starlight = 0.02 * (1 - 0.8 * cloudCover); // never pure black (except eclipse+overcast)

    // Hemisphere light: day palette by day, moon+star floor at night.
    const dayHemi = pal.hi * (0.4 + 0.6 * day) * mod.hi;
    const nightFloor = (starlight + moonlight * 0.6) * nightFactor;
    hemi.intensity = Math.max(dayHemi, nightFloor);
    hemi.color.copy(pal.hemi);
    hemi.groundColor.setHex(0x2a2418);

    // Moonlight directional (cool blue) from the moon direction.
    moonLight.position.copy(moonDir).multiplyScalar(60);
    moonLight.target.position.set(0, 0, 0);
    moonLight.intensity = moonlight * nightFactor;
    moonLight.color.set(0x9fb4ff);

    // Sky dome colors — dimmed by weather, lifted by moonlight at night.
    const dim = 1 - mod.dim;
    skyUniforms.topColor.value.copy(pal.top).multiplyScalar(dim);
    skyUniforms.bottomColor.value.copy(pal.bot).multiplyScalar(dim);
    if (weather === 'storm' || weather === 'fog' || weather === 'rain') {
      const gray = tmpColor.setRGB(0.32, 0.34, 0.38);
      skyUniforms.topColor.value.lerp(gray, 0.45);
      skyUniforms.bottomColor.value.lerp(gray, 0.40);
    } else if (weather === 'snow') {
      const white = tmpColor.setRGB(0.75, 0.78, 0.85);
      skyUniforms.topColor.value.lerp(white, 0.30);
      skyUniforms.bottomColor.value.lerp(white, 0.35);
    }
    // Moonlit night lift on the horizon (full moon nights aren't pitch black).
    if (nightFactor > 0.02) {
      const lift = effMoonIllum * nightFactor * 0.55;
      skyUniforms.bottomColor.value.lerp(moonLitColor.set(0.2, 0.27, 0.42), lift);
      skyUniforms.topColor.value.lerp(moonLitColor.set(0.07, 0.10, 0.20), lift * 0.5);
    }
    // Eclipse darkening: drive the sky toward near-black.
    if (state.eclipse) {
      skyUniforms.topColor.value.multiplyScalar(0.25);
      skyUniforms.bottomColor.value.multiplyScalar(0.25);
    }

    // Sun/moon discs
    sunDisc.position.copy(tmpDir).multiplyScalar(180);
    sunDisc.material.opacity = day > 0.02 ? Math.min(1, day * 1.5) * (1 - mod.dim * 0.5) : 0;
    sunDisc.material.color.copy(pal.sun);
    moonDisc.position.copy(moonDir).multiplyScalar(180);
    // Moon disc visible at night, brightness tracks phase + eclipse.
    const moonVis = state.eclipse ? 0 : Math.min(1, nightFactor * 1.4) * (0.25 + 0.75 * moonIllumRaw);
    moonDisc.material.opacity = (1 - cloudCover) * moonVis;
    moonDisc.material.color.set(0xcfd8ff);

    // Stars fade in at night, dimmed by clouds + eclipses.
    starMat.opacity = Math.max(0, Math.min(1, (0.15 - elev) * 3)) * (1 - cloudCover * 0.7) * (state.eclipse ? 0.2 : 1);

    // Fog
    const baseFog = pal.fog.clone().lerp(new THREE.Color(season.fogTint), 0.35);
    baseFog.multiplyScalar(mod.fogMul);
    fog.color.copy(baseFog);
    const far = 260 * mod.fogFar * (state.eclipse ? 0.6 : 1);
    fog.far = far;
    fog.near = Math.min(far * 0.35, 90);

    // Lightning during storms
    if (weather === 'storm' && state.intensity > 0.4) {
      state.lightningTimer -= dt;
      if (state.lightningTimer <= 0) {
        state.lightningTimer = 4 + Math.random() * 9;
        state.lightningFlash = 1;
        lightning.position.set(
          camera.position.x + (Math.random() - 0.5) * 60,
          50,
          camera.position.z + (Math.random() - 0.5) * 60,
        );
      }
    }
    if (state.lightningFlash > 0) {
      state.lightningFlash -= dt * 4;
      lightning.intensity = Math.max(0, state.lightningFlash) * 3.5;
      const f = Math.max(0, state.lightningFlash) * 0.6;
      skyUniforms.topColor.value.lerp(new THREE.Color(0xbfd0ff), f);
      skyUniforms.bottomColor.value.lerp(new THREE.Color(0xbfd0ff), f * 0.7);
    } else {
      lightning.intensity = 0;
    }

    // Particle systems
    const showRain = (weather === 'rain' || weather === 'storm') ? state.intensity : 0;
    const showSnow = weather === 'snow' ? state.intensity : 0;
    rainMat.opacity = showRain * 0.6;
    snowMat.opacity = showSnow * 0.85;
    const cx = camera.position.x, cz = camera.position.z;

    if (showRain > 0.02) {
      rain.visible = true; rain.position.set(cx, 0, cz);
      for (let i = 0; i < RAIN_COUNT; i++) {
        let y = rainPositions[i * 6 + 1];
        y -= rainVel[i] * dt;
        if (y < -4) {
          y = 60 + Math.random() * 12;
          const x = (Math.random() - 0.5) * RAIN_AREA;
          const z = (Math.random() - 0.5) * RAIN_AREA;
          rainPositions[i * 6] = x; rainPositions[i * 6 + 2] = z;
          rainPositions[i * 6 + 3] = x; rainPositions[i * 6 + 5] = z;
        }
        rainPositions[i * 6 + 1] = y;
        rainPositions[i * 6 + 4] = y - 1.1;
      }
      rainGeo.attributes.position.needsUpdate = true;
    } else rain.visible = false;

    if (showSnow > 0.02) {
      snow.visible = true; snow.position.set(cx, 0, cz);
      for (let i = 0; i < SNOW_COUNT; i++) {
        let y = snowPos[i * 3 + 1];
        y -= snowVel[i] * dt;
        snowDrift[i] += dt * 0.8;
        const dx = Math.sin(snowDrift[i]) * 0.6 * dt;
        if (y < -2) {
          y = 55 + Math.random() * 12;
          snowPos[i * 3] = (Math.random() - 0.5) * SNOW_AREA;
          snowPos[i * 3 + 2] = (Math.random() - 0.5) * SNOW_AREA;
        }
        snowPos[i * 3 + 1] = y;
        snowPos[i * 3] += dx;
      }
      snowGeo.attributes.position.needsUpdate = true;
    } else snow.visible = false;

    if (renderer?.shadowMap) {
      shadowDirtyTimer += dt;
      if (shadowDirtyTimer > 2) { shadowDirtyTimer = 0; renderer.shadowMap.needsUpdate = true; }
    }
  };

  // ── Dispose ────────────────────────────────────────────────────────────
  const dispose = () => {
    scene.remove(skyDome, sunDisc, moonDisc, stars, rain, snow, lightning, moonLight);
    skyDome.geometry.dispose(); skyMat.dispose();
    sunDisc.material.map?.dispose(); sunDisc.material.dispose();
    moonDisc.material.map?.dispose(); moonDisc.material.dispose();
    starGeo.dispose(); starMat.dispose();
    rainGeo.dispose(); rainMat.dispose();
    snowGeo.dispose(); snowMat.dispose();
    if (window.__worldEnv === api) window.__worldEnv = null;
  };

  const api = { update, getState, setSeason, setWeather, setTime, setClimate, cycleClimate, loadForecast, dispose };
  return api;
}