// Real 7-day weather forecast for Detroit, MI from the US National Weather
// Service (api.weather.gov). Free, public, no API key required.
//
// Returns 168 normalized hourly records + a 7-day summary that the
// WorldEnvironmentSystem replays over 7 in-game days to drive rain, snow,
// storms, fog, cloud cover, temperature and wind in the 3D world.

const POINT_URL = "https://api.weather.gov/points/42.33,-83.05";
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseWindMph(s) {
  if (!s) return 0;
  const m = String(s).match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

// Map an NWS shortForecast string to an engine weather category + cloud cover.
function classify(short, precipProb) {
  const f = (short || "").toLowerCase();
  const uncertain = /slight chance|chance|isolated|scattered/.test(f);
  let category = "clear";
  let precipType = null;
  let cloudCover = 0.1;
  let isFog = false;
  if (/thunder|storm/.test(f)) { precipType = "storm"; cloudCover = 0.92; }
  else if (/snow|flurr|sleet|blizzard|wintry/.test(f)) { precipType = "snow"; cloudCover = 0.82; }
  else if (/rain|shower|drizzle|freez|precip/.test(f)) { precipType = "rain"; cloudCover = 0.85; }
  else if (/fog|haze|mist|smoke|blowing/.test(f)) { isFog = true; cloudCover = 0.9; }
  if (!precipType && !isFog) {
    if (/overcast/.test(f)) { category = "cloudy"; cloudCover = 1; }
    else if (/mostly cloudy/.test(f)) { category = "cloudy"; cloudCover = 0.78; }
    else if (/partly cloudy/.test(f)) { category = "cloudy"; cloudCover = 0.5; }
    else if (/mostly clear|mostly sunny/.test(f)) { category = "clear"; cloudCover = 0.18; }
    else if (/sunny|clear|fair/.test(f)) { category = "clear"; cloudCover = 0.1; }
    else { category = "clear"; cloudCover = 0.2; }
  } else {
    category = isFog ? "fog" : (precipType === "storm" ? "storm" : precipType === "snow" ? "snow" : "rain");
  }
  // "Slight Chance / Chance" precip only counts as active when the NWS
  // probability is high enough — otherwise treat it as cloudy.
  if (uncertain && precipType) {
    const p = precipProb || 0;
    if (p < 40) {
      category = "cloudy";
      cloudCover = Math.max(cloudCover, 0.6);
      precipType = null;
    } else {
      category = isFog ? "fog" : (precipType === "storm" ? "storm" : precipType === "snow" ? "snow" : "rain");
    }
  }
  return { category, precipType, cloudCover, isFog };
}

function summarizeDay(hours) {
  let hi = -200, lo = 999, maxPrecip = 0;
  const cats = {};
  for (const h of hours) {
    if (h.tempF > hi) hi = h.tempF;
    if (h.tempF < lo) lo = h.tempF;
    if ((h.precipProb || 0) > maxPrecip) maxPrecip = h.precipProb || 0;
    cats[h.category] = (cats[h.category] || 0) + 1;
  }
  const dominant = Object.entries(cats).sort((a, b) => b[1] - a[1])[0]?.[0] || "clear";
  const date = hours[0]?.time ? new Date(hours[0].time) : new Date();
  return {
    date: date.toISOString().slice(0, 10),
    dayName: DAY_NAMES[date.getDay()],
    hi: Math.round(hi),
    lo: Math.round(lo),
    maxPrecipProb: maxPrecip,
    dominant,
    storm: !!cats.storm,
    snow: !!cats.snow,
    rain: !!cats.rain,
    fog: !!cats.fog,
  };
}

export default async function (req) {
  try {
    const headers = { "Accept": "application/geo+json", "User-Agent": "AtomXEve/1.0 (weather-integration)" };
    const ptRes = await fetch(POINT_URL, { headers });
    if (!ptRes.ok) throw new Error("NWS points fetch failed: " + ptRes.status);
    const pt = await ptRes.json();
    const hourlyUrl = pt?.properties?.forecastHourly;
    if (!hourlyUrl) throw new Error("No forecastHourly URL in points response");
    const hRes = await fetch(hourlyUrl, { headers });
    if (!hRes.ok) throw new Error("NWS hourly fetch failed: " + hRes.status);
    const hJson = await hRes.json();
    const periods = hJson?.properties?.periods || [];
    const now = Date.now();
    const hours = periods
      .filter((p) => new Date(p.startTime).getTime() >= now - 3600000)
      .slice(0, 168)
      .map((p) => {
        const precipProb = p.probabilityOfPrecipitation?.value ?? null;
        const c = classify(p.shortForecast, precipProb == null ? 0 : precipProb);
        return {
          time: p.startTime,
          tempF: p.temperature ?? 0,
          windMph: parseWindMph(p.windSpeed),
          windDir: p.windDirection || "",
          shortForecast: p.shortForecast || "",
          detailedForecast: p.detailedForecast || "",
          isDaytime: !!p.isDaytime,
          precipProb: precipProb == null ? 0 : precipProb,
          humidity: p.relativeHumidity?.value ?? null,
          dewpointC: p.dewpoint?.value ?? null,
          category: c.category,
          precipType: c.precipType,
          cloudCover: c.cloudCover,
          isFog: c.isFog,
        };
      });
    const days = [];
    for (let d = 0; d < 7; d++) {
      const chunk = hours.slice(d * 24, (d + 1) * 24);
      if (chunk.length === 0) break;
      days.push(summarizeDay(chunk));
    }
    return Response.json({
      city: "Detroit, MI",
      region: "Michigan",
      fetchedAt: new Date().toISOString(),
      hours,
      days,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}