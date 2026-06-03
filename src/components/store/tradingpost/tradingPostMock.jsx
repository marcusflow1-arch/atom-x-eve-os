// Mock data + generators for the redesigned Galactic Trading Post.
// "Cards" here = tradeable items belonging to a game.

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];
const TYPES = ['Weapon', 'Armor', 'Ability', 'Consumable', 'Material', 'Tech', 'Blueprint'];

const SELLER_NAMES = [
  'SkyrimLord', 'CyberNinja', 'MysticMage', 'DragonSlayer99', 'VoidWalker',
  'NeonRunner', 'IronFist', 'ShadowBlade', 'PhoenixRider', 'StarForge',
];
const SELLER_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108755-2616c727e3d9?w=64&h=64&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=64&h=64&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=64&h=64&fit=crop&crop=face',
];

const seedOf = (str) => String(str || 'x').split('').reduce((a, c) => a + c.charCodeAt(0), 0);

// Generate the tradeable "cards" (items) for a single game.
export const generateGameCards = (game) => {
  const seed = seedOf(game.id);
  const count = 10 + (seed % 8); // 10-17 cards
  return Array.from({ length: count }).map((_, i) => {
    const type = TYPES[(seed + i) % TYPES.length];
    const rarity = RARITIES[(seed + i * 3) % RARITIES.length];
    return {
      id: `${game.id}_card_${i}`,
      name: `${game.title.split(' ')[0]} ${type} ${i + 1}`,
      type,
      rarity,
      game: game.title,
      gameId: game.id,
      image: game.cover_image || game.image,
      description: `A ${rarity} ${type} originating from ${game.title}.`,
      level: 1 + i * 4,
      power: 100 + i * 45,
      marketPrice: 250 + i * 320 + (seed % 500),
    };
  });
};

// Generate buyer + seller listings (MMORPG-style trade board) for a card.
export const generateCardListings = (card) => {
  const seed = seedOf(card.id);
  const base = card.marketPrice || 1000;
  const listings = [];

  // SELLERS — people offering the item for a price (you buy from them)
  const sellerCount = 3 + (seed % 4);
  for (let i = 0; i < sellerCount; i++) {
    const idx = (seed + i) % SELLER_NAMES.length;
    listings.push({
      id: `${card.id}_sell_${i}`,
      side: 'sell',
      trader: { name: SELLER_NAMES[idx], avatar: SELLER_AVATARS[idx % SELLER_AVATARS.length], rating: (4 + ((seed + i) % 10) / 10).toFixed(1) },
      price: Math.round(base * (0.85 + i * 0.12)),
      quantity: 1 + (i % 3),
      acceptsTrade: i % 2 === 0,
      seeking: i % 2 === 0 ? ['Plasma Core', 'Rare Materials'] : [],
      note: i % 2 === 0 ? 'Open to trades for equivalent value.' : 'Fixed price, gold only.',
    });
  }

  // BUYERS — people who want the item, offering to pay (you sell to them)
  const buyerCount = 2 + (seed % 4);
  for (let i = 0; i < buyerCount; i++) {
    const idx = (seed + i + 3) % SELLER_NAMES.length;
    listings.push({
      id: `${card.id}_buy_${i}`,
      side: 'buy',
      trader: { name: SELLER_NAMES[idx], avatar: SELLER_AVATARS[idx % SELLER_AVATARS.length], rating: (4 + ((seed + i + 2) % 10) / 10).toFixed(1) },
      price: Math.round(base * (0.7 + i * 0.08)),
      quantity: 1 + (i % 4),
      note: 'Looking to buy — instant payment.',
    });
  }

  return listings;
};

export const CATEGORIES = [
  { id: 'all', label: 'All Games' },
  { id: 'Action RPG', label: 'Action RPG' },
  { id: 'RPG', label: 'RPG' },
  { id: 'Shooter', label: 'Shooter' },
  { id: 'FPS', label: 'FPS' },
  { id: 'Strategy', label: 'Strategy' },
  { id: 'Survival', label: 'Survival' },
  { id: 'Racing', label: 'Racing' },
  { id: 'Sandbox', label: 'Sandbox' },
  { id: 'Mystery', label: 'Mystery' },
];

export const RARITY_FILTERS = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];