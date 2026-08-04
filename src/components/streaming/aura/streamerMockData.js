// Shared streamer data used across the Aura game view, Discover and Home.
// Deterministic per game so the same game always shows the same line-up.

const THUMBS = [
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
  'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800',
  'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800',
  'https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2?w=800',
  'https://images.unsplash.com/photo-1603484477859-abe6a73f936d?w=800',
  'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800',
];

const NAMES = [
  'NovaKnight', 'PixelSage', 'ZeroShift', 'LunaVox', 'CrimsonByte', 'EchoBlade',
  'SolarFlare', 'FrostSpark', 'AstraRift', 'NightBloom', 'IronPulse', 'VoidHawk',
];

const TAGLINES = [
  'Ranked grind — road to top 100',
  'Chill run, come hang out',
  'No-hit challenge attempt',
  'Story mode, first playthrough',
  'Speedrun practice + tips',
  'Community night — viewer games',
  'Endgame build showcase',
  'Late night co-op session',
];

const TAGS = ['English', 'Competitive', 'Chill', 'Educational', 'Comedy', 'Interactive', 'Speedrun'];

function hash(str) {
  let h = 0;
  for (let i = 0; i < String(str).length; i++) h = (h * 31 + String(str).charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Build a stable list of streamers broadcasting a given game. */
export function getStreamersForGame(game, count = 12) {
  const title = game?.title || 'Unknown Game';
  const seed = hash(game?.id || title);
  return Array.from({ length: count }).map((_, i) => {
    const s = seed + i * 977;
    return {
      id: `st_${seed}_${i}`,
      name: NAMES[(s + i) % NAMES.length],
      avatar: `https://i.pravatar.cc/200?img=${(s % 60) + 1}`,
      thumbnail: THUMBS[(s + i) % THUMBS.length],
      game: title,
      gameImage: game?.cover_image || game?.image || THUMBS[seed % THUMBS.length],
      title: TAGLINES[(s + i * 3) % TAGLINES.length],
      viewers: 180 + ((s * 7) % 9800),
      followers: 900 + ((s * 13) % 240000),
      tags: [TAGS[s % TAGS.length], TAGS[(s + 3) % TAGS.length]],
      uptimeMinutes: 12 + (s % 320),
      isLive: true,
    };
  });
}

/** Flat list across several games — used by Discover / Home. */
export function getDiscoverStreamers(games = [], perGame = 3) {
  const source = games.length
    ? games
    : ['Elden Ring', 'Valorant', 'Diablo IV', 'Cyberpunk 2077', 'Minecraft', 'Helldivers 2'].map((t, i) => ({ id: `g_${i}`, title: t }));
  return source.flatMap((g) => getStreamersForGame(g, perGame));
}

export function formatViewers(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n || 0);
}

export function formatUptime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}