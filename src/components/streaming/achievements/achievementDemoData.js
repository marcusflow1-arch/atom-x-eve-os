export const achievementGames = [
  { id: 'elder-scrolls', name: 'The Elder Scrolls', genre: 'MMORPG', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/306130/header.jpg' },
  { id: 'smite-2', name: 'SMITE 2', genre: 'MOBA', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2687550/header.jpg' },
  { id: 'fallout', name: 'Fallout 4', genre: 'RPG', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/377160/header.jpg' },
  { id: 'cyberpunk', name: 'Cyberpunk 2077', genre: 'Action RPG', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg' },
  { id: 'destiny', name: 'Destiny 2', genre: 'Shooter', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1085660/header.jpg' },
];

const names = ['First Blood', 'Untouchable', 'Master Explorer', 'Legendary Arsenal', 'Perfect Timing'];
const rarities = ['Rare', 'Epic', 'Common', 'Legendary', 'Epic'];

export const achievementsFor = (game) => names.map((name, index) => ({
  id: `${game.id}-${index}`,
  name,
  rarity: rarities[index],
  image: game.image,
  description: `${name} records a defining feat completed in ${game.name}. Trigger its demonstration to preview the achievement behavior in real time.`,
  stats: { points: 25 + index * 15, completion: `${12 + index * 9}%`, tier: index + 1 },
}));