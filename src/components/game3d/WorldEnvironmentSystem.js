import * as THREE from 'three';

/**
 * WorldEnvironmentSystem
 * Drives a full day/night cycle, a 4-season cycle, and dynamic weather
 * (clear / cloudy / rain / snow / storm / fog) inside the 3D game world.
 *
 * It owns:
 *   - a gradient sky dome (ShaderMaterial) whose colors track the sun
 *   - a sun disc + moon disc + starfield that rise/set with the time of day
 *   - the scene's existing DirectionalLight (sun) + HemisphereLight + Fog,
 *     modulating their colors and intensities by time, season, and weather
 *   - GPU-friendly rain (line streaks) and snow (points) particle systems
 *   - periodic lightning flashes during storms
 *
 * Factory: createWorldEnvironmentSystem({ scene, sun, hemi, fog, camera, renderer })
 * Returns: { update(dt), getState(), setSeason(id), setWeather(id), setTime(h), dispose() }
 */

// ── Seasons ──────────────────────────────────────────────────────────────
const SEASONS = [
  {
    id: 'spring', label: 'Spring',
    fogTint: 0x9fc7a0,
    weights: { clear: 0.45, cloudy: 0.25, rain: 0.22, fog: 0.06, snow: 0.02, storm: 0.0 },
    sunBoost: 1.0,
  },
  {
    id: 'summer', label: 'Summer',
    fogTint: 0xbfd8ff,
    weights: { clear: 0.55, cloudy: 0.18, rain: 0.12, storm: 0.12, fog: 0.03, snow: 0.0 },
    sunBoost: 1.15,
  },
  {
    id: 'autumn', label: 'Autumn',
    fogTint: 0xc9a36b,
    weights: { clear: 0.40, cloudy: 0.20, rain: 0.25, fog: 0.12, storm: 0.03, snow: 0.0 },
    sunBoost: 0.92,
  },
  {
    id: 'winter', label: 'Winter',
    fogTint: 0xd6e2ee,
    weights: { clear: 0.35, cloudy: 0.20, snow: 0.30, fog: 0.12, rain: 0.03, storm: 0.0 },
    sunBoost: 0.8,
  },
];

const WEATHER_LABELS = {
  clear: 'Clear', cloudy: 'Cloudy', rain: 'Rain', snow: 'Snow',
  storm: 'Storm', fog: 'Fog',
};

// ── Time-of-day keyframes (top sky, bottom sky, sun color, sun intensity, hemi color, hemi intensity, fog) ──
const TIME_KEYS = [
  { h: 0,  top: 0x05070f, bot: 0x0a0f1c, sun: 0x2a3550, si: 0.00, hemi: 0x1a2238, hi: 0.22, fog: 0x06080f },
  { h: 5,  top: 0x1a1f3a, bot: 0x3a2a4a, sun: 0xff8a4a, si: 0.35, hemi: 0x3a4060, hi: 0.45, fog: 0x2a2535 },
  { h: 6.5,top: 0x4a6a9a, bot: 0xff9a5a, sun: 0xffb070, si: 1.20, hemi: 0x88a0c0, hi: 0.70, fog: 0x6a5a55 },
  { h: 12, top: 0x4a86c8, bot: 0xb0d0f0, sun: 0xfff4d6, si: 2.20, hemi: 0xcfe4ff, hi: 1.00, fog: 0x90a8c0 },
  { h: 17, top: 0x5a7ab0, bot: 0xe0b080, sun: 0xffd090, si: 1.55, hemi: 0xaab8d0, hi: 0.80, fog: 0x807060 },
  { h: 18.5,top: 0x3a4a7a, bot: 0xd07050, sun: 0xff7050, si: 0.65, hemi: 0x6a6080, hi: 0.50, fog: 0x5a4040 },
  { h: 20, top: 0x1a1f3a, bot: 0x2a2540, sun: 0x40355a, si: 0.18, hemi: 0x3a3550, hi: 0.34, fog: 0x1a1825 },
  { h: 24, top: 0x05070f, bot: 0x0a0f1c, sun: 0x2a3550, si: 0.00, hemi: 0x1a2238, hi: 0.22, fog: 0x06080f },
];

// Weather multipliers applied on top of the time palette.
const WEATHER_MOD = {
  clear:  { si: 1.0,  hi: 1.0,  fogFar: 1.0,  fogMul: 1.0, dim: 0.0 },
  cloudy: { si: 0.55, hi: 0.9,  fogFar: 0.85, fogMul: 0.95, dim: 0.25 },
  rain:   { si: 0.30, hi: 0.85, fogFar: 0.6,  fogMul: 0.75, dim: 0.45 },
  storm:  { si: 0.15, hi: 0.7,  fogFar: 0.45, fogMul: 0.6,  dim: 0.6 },
  snow:   { si: 0.6,  hi: 1.0,  fogFar: 0.7,  fogMul: 1.15, dim: 0.15 },
  fog:    { si: 0.4,  hi: 0.9,  fogFar: 0.22, fogMul: 0.9, dim: 0.4 },
};

const lerp = (a, b, t) => a + (b - a) * t;
const lerpColor = (out, a, b, t) => out.setHex(a).lerp(new THREE.Color(b), t);

function sampleTime(time) {
  // find bracketing keyframes
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

export function createWorldEnvironmentSystem({
  scene, sun, hemi, fog, camera, renderer,
  dayLengthSeconds = 240,   // one full 24h cycle
  seasonCycleDays = 5,     // days per season
}) {
  if (!scene || !sun || !hemi || !fog) {
    console.warn('[WorldEnvironmentSystem] missing required deps');
    return { update() {}, getState: () => ({}), setSeason() {}, setWeather() {}, setTime() {}, dispose() {} };
  }

  const state = {
    time: 8,            // start mid-morning
    seasonIndex: 1,     // start in Summer
    weather: 'clear',
    weatherTimer: 0,
    weatherDuration: 40,
    intensity: 1,       // ramp for particle/visual weather intensity
    dayCounter: 0,
    lightningTimer: 0,
    lightningFlash: 0,
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
    depthWrite: false,
    depthTest: false,
    fog: false,
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
  scene.background = null; // dome provides the sky

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

  // ── Starfield (Points, visible at night) ──────────────────────────────
  const STAR_COUNT = 900;
  const starPos = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    // distribute on the upper hemisphere of a sphere
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
  stars.renderOrder = -950;
  stars.frustumCulled = false;
  scene.add(stars);

  // ── Rain (LineSegments, streaks) ─────────────────────────────────────
  const RAIN_COUNT = 2600;
  const RAIN_AREA = 110;
  const rainPositions = new Float32Array(RAIN_COUNT * 6); // 2 verts per streak
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

  // ── Snow (Points) ────────────────────────────────────────────────────
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

  // ── Lightning flash light ────────────────────────────────────────────
  const lightning = new THREE.PointLight(0xbfd0ff, 0, 120, 2);
  scene.add(lightning);

  // ── Helpers ─────────────────────────────────────────────────────────
  const pickWeather = (seasonId) => {
    const season = SEASONS.find((s) => s.id === seasonId) || SEASONS[0];
    const entries = Object.entries(season.weights).filter(([, w]) => w > 0);
    const total = entries.reduce((a, [, w]) => a + w, 0);
    let r = Math.random() * total;
    for (const [id, w] of entries) { r -= w; if (r <= 0) return id; }
    return 'clear';
  };

  const transitionWeather = () => {
    const season = SEASONS[state.seasonIndex];
    // 35% chance to stay/shift toward season-typical weather, else random
    state.weather = pickWeather(season.id);
    state.weatherDuration = 28 + Math.random() * 45;
    state.weatherTimer = 0;
  };

  // initial weather tuned to season
  state.weather = pickWeather(SEASONS[state.seasonIndex].id);

  // ── Public controls ──────────────────────────────────────────────────
  const setSeason = (id) => {
    const idx = SEASONS.findIndex((s) => s.id === id);
    if (idx >= 0) { state.seasonIndex = idx; transitionWeather(); }
  };
  const setWeather = (id) => {
    if (WEATHER_LABELS[id]) { state.weather = id; state.weatherTimer = 0; state.weatherDuration = 60; }
  };
  const setTime = (h) => { state.time = ((h % 24) + 24) % 24; };

  const getState = () => ({
    time: state.time,
    hours: Math.floor(state.time),
    minutes: Math.floor((state.time % 1) * 60),
    seasonId: SEASONS[state.seasonIndex].id,
    seasonLabel: SEASONS[state.seasonIndex].label,
    weather: state.weather,
    weatherLabel: WEATHER_LABELS[state.weather] || state.weather,
    dayCounter: state.dayCounter,
  });

  // ── Per-frame update ─────────────────────────────────────────────────
  const tmpDir = new THREE.Vector3();
  const tmpColor = new THREE.Color();
  let shadowDirtyTimer = 0;

  const update = (dt) => {
    // advance time
    state.time += dt * (24 / dayLengthSeconds);
    if (state.time >= 24) {
      state.time -= 24;
      state.dayCounter += 1;
      // advance season every seasonCycleDays
      if (state.dayCounter % seasonCycleDays === 0) {
        state.seasonIndex = (state.seasonIndex + 1) % SEASONS.length;
        transitionWeather();
      }
    }

    // weather timer
    state.weatherTimer += dt;
    if (state.weatherTimer >= state.weatherDuration) transitionWeather();

    // ramp weather visual intensity
    const targetIntensity = (state.weather === 'clear' || state.weather === 'cloudy') ? 0 : 1;
    state.intensity += (targetIntensity - state.intensity) * Math.min(1, dt * 0.6);

    const season = SEASONS[state.seasonIndex];
    const mod = WEATHER_MOD[state.weather] || WEATHER_MOD.clear;
    const pal = sampleTime(state.time);

    // Sun elevation: -1 (midnight) .. +1 (noon) using a sine over (time-6)/12
    const elev = Math.sin(((state.time - 6) / 12) * Math.PI);     // -1..1
    const azimuth = (state.time / 24) * Math.PI * 2;
    const cosEl = Math.cos(elev);
    tmpDir.set(
      Math.cos(azimuth) * cosEl,
      Math.sin(elev),
      Math.sin(azimuth) * cosEl,
    ).normalize();

    // Position the directional sun light along the sun direction
    sun.position.copy(tmpDir).multiplyScalar(60);
    // Daylight factor (0 at/below horizon, 1 at noon)
    const day = Math.max(0, elev);
    const night = Math.max(0, -elev);
    const sunIntensity = pal.si * day * season.sunBoost * mod.si;
    sun.intensity = sunIntensity;
    sun.color.copy(pal.sun);

    // Hemisphere light
    hemi.intensity = pal.hi * (0.4 + 0.6 * day) * mod.hi;
    hemi.color.copy(pal.hemi);
    hemi.groundColor.setHex(0x2a2418);

    // Sky dome colors — blend toward weather/night
    const dim = 1 - mod.dim * state.intensity;
    skyUniforms.topColor.value.copy(pal.top).multiplyScalar(dim);
    skyUniforms.bottomColor.value.copy(pal.bot).multiplyScalar(dim);
    // Stormy/foggy skies shift toward gray
    if (state.weather === 'storm' || state.weather === 'fog' || state.weather === 'rain') {
      const gray = tmpColor.setRGB(0.32, 0.34, 0.38);
      skyUniforms.topColor.value.lerp(gray, 0.45 * state.intensity);
      skyUniforms.bottomColor.value.lerp(gray, 0.4 * state.intensity);
    } else if (state.weather === 'snow') {
      const white = tmpColor.setRGB(0.75, 0.78, 0.85);
      skyUniforms.topColor.value.lerp(white, 0.3 * state.intensity);
      skyUniforms.bottomColor.value.lerp(white, 0.35 * state.intensity);
    }

    // Sun/moon disc positions on the dome + opacity
    sunDisc.position.copy(tmpDir).multiplyScalar(180);
    sunDisc.material.opacity = day > 0.02 ? Math.min(1, day * 1.5) * (1 - mod.dim * 0.5) : 0;
    sunDisc.material.color.copy(pal.sun);
    moonDisc.position.copy(tmpDir).multiplyScalar(-180);
    moonDisc.material.opacity = night > 0.05 ? Math.min(1, night * 1.4) : 0;

    // Stars fade in at night
    starMat.opacity = Math.max(0, Math.min(1, (0.15 - elev) * 3)) * (1 - mod.dim * 0.6);

    // Fog — color blends time palette with season tint + weather modifier
    const baseFog = pal.fog.clone().lerp(new THREE.Color(season.fogTint), 0.35);
    baseFog.multiplyScalar(mod.fogMul);
    fog.color.copy(baseFog);
    // Fog distance scales with weather
    const far = 260 * mod.fogFar;
    fog.far = far;
    fog.near = Math.min(far * 0.35, 90);

    // Lightning during storms
    if (state.weather === 'storm' && state.intensity > 0.4) {
      state.lightningTimer -= dt;
      if (state.lightningTimer <= 0) {
        state.lightningTimer = 4 + Math.random() * 9;
        state.lightningFlash = 1;
        // position flash above the player/camera
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
      // brief sky brighten
      const f = Math.max(0, state.lightningFlash) * 0.6;
      skyUniforms.topColor.value.lerp(new THREE.Color(0xbfd0ff), f);
      skyUniforms.bottomColor.value.lerp(new THREE.Color(0xbfd0ff), f * 0.7);
    } else {
      lightning.intensity = 0;
    }

    // ── Particle systems ──────────────────────────────────────────────
    const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
    const showRain = (state.weather === 'rain' || state.weather === 'storm') ? state.intensity : 0;
    const showSnow = state.weather === 'snow' ? state.intensity : 0;
    rainMat.opacity = showRain * 0.6;
    snowMat.opacity = showSnow * 0.85;

    if (showRain > 0.02) {
      rain.visible = true;
      rain.position.set(cx, 0, cz);
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
    } else {
      rain.visible = false;
    }

    if (showSnow > 0.02) {
      snow.visible = true;
      snow.position.set(cx, 0, cz);
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
    } else {
      snow.visible = false;
    }

    // Occasionally refresh shadow map as the sun moves (cheap, every ~2s)
    if (renderer?.shadowMap) {
      shadowDirtyTimer += dt;
      if (shadowDirtyTimer > 2) {
        shadowDirtyTimer = 0;
        renderer.shadowMap.needsUpdate = true;
      }
    }
  };

  // ── Dispose ──────────────────────────────────────────────────────────
  const dispose = () => {
    scene.remove(skyDome, sunDisc, moonDisc, stars, rain, snow, lightning);
    skyDome.geometry.dispose(); skyMat.dispose();
    sunDisc.material.map?.dispose(); sunDisc.material.dispose();
    moonDisc.material.map?.dispose(); moonDisc.material.dispose();
    starGeo.dispose(); starMat.dispose();
    rainGeo.dispose(); rainMat.dispose();
    snowGeo.dispose(); snowMat.dispose();
    if (window.__worldEnv === api) window.__worldEnv = null;
  };

  const api = { update, getState, setSeason, setWeather, setTime, dispose };
  return api;
}