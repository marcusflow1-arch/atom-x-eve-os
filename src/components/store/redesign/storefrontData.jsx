// storefrontData.js — Curated mock data for the redesigned Store front page.
// Pulls from existing mock catalog so covers/titles stay consistent.

import { trendingGames, newReleases, classicBestSellers } from '../mockData';

const pool = [...trendingGames, ...newReleases, ...classicBestSellers];
const byId = (id) => pool.find(g => g.id === id);

// ── Hero featured game ─────────────────────────────────────────────────────────
export const HERO_GAME = {
  id: 'starfall_legacy',
  title: 'STARFALL',
  subtitle: 'LEGACY',
  tagline: 'RISE. FIGHT. RECLAIM.',
  description:
    'An epic sci-fi action RPG set across fractured worlds. Uncover ancient secrets and shape the fate of the galaxy.',
  tags: ['Sci-Fi', 'RPG', 'Open World', 'Single Player'],
  rating: 4.8,
  reviews: '12.5K',
  cover_image:
    'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?w=1600&h=900&fit=crop',
};

// ── Quick access tiles ─────────────────────────────────────────────────────────
export const QUICK_ACCESS = [
  { id: 'top_sellers', label: 'Top Sellers', sub: 'Most popular games', icon: 'Star', color: '#a78bfa' },
  { id: 'new_releases', label: 'New Releases', sub: 'Latest additions', icon: 'Sparkles', color: '#38bdf8' },
  { id: 'coming_soon', label: 'Coming Soon', sub: "What's next", icon: 'Clock', color: '#f472b6' },
  { id: 'special_offers', label: 'Special Offers', sub: 'Best deals today', icon: 'Tag', color: '#34d399' },
];

// ── Browse by genre ────────────────────────────────────────────────────────────
export const BROWSE_GENRES = [
  { id: 'action', label: 'Action', count: '1,234 Games', icon: 'Swords', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=500&h=600&fit=crop', glow: '#ef4444' },
  { id: 'rpg', label: 'RPG', count: '856 Games', icon: 'Shield', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=600&fit=crop', glow: '#a855f7' },
  { id: 'shooter', label: 'Shooter', count: '1,098 Games', icon: 'Crosshair', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&h=600&fit=crop', glow: '#06b6d4' },
  { id: 'adventure', label: 'Adventure', count: '743 Games', icon: 'Compass', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500&h=600&fit=crop', glow: '#22c55e' },
  { id: 'horror', label: 'Horror', count: '421 Games', icon: 'Skull', image: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=500&h=600&fit=crop', glow: '#64748b' },
  { id: 'racing', label: 'Racing', count: '312 Games', icon: 'Car', image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500&h=600&fit=crop', glow: '#f59e0b' },
];

// ── Genre sidebar (full list) ──────────────────────────────────────────────────
export const GENRE_LIST = [
  { id: 'action', label: 'Action', icon: 'Swords' },
  { id: 'fps', label: 'First-Person Shooter', icon: 'Crosshair' },
  { id: 'horror', label: 'Horror', icon: 'Skull' },
  { id: 'platformer', label: 'Platformer', icon: 'Gamepad2' },
  { id: 'rpg', label: 'RPG', icon: 'Shield' },
  { id: 'racing', label: 'Racing', icon: 'Car' },
  { id: 'role_playing', label: 'Role-Playing (RPG)', icon: 'Sparkles' },
  { id: 'scifi', label: 'Sci-Fi', icon: 'Rocket' },
  { id: 'adventure', label: 'Adventure', icon: 'Compass' },
  { id: 'strategy', label: 'Strategy', icon: 'Trophy' },
  { id: 'simulation', label: 'Simulation', icon: 'Monitor' },
];

export const TOP_NAV_GENRES = [
  'Discover', 'All Games', 'Trending', 'New Releases', 'Top Rated', 'Coming Soon', 'Free to Play', 'Special Offers',
];

// ── Curated collections ────────────────────────────────────────────────────────
export const COLLECTIONS = [
  { id: 'best_2024', title: 'BEST OF', big: '2024', sub: "Editor's Choice", image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop' },
  { id: 'epic_coop', title: 'EPIC', big: 'CO-OP', sub: 'Play Together', image: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=600&h=400&fit=crop' },
  { id: 'story_rich', title: 'STORY', big: 'RICH', sub: 'Immersive Worlds', image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=600&h=400&fit=crop' },
  { id: 'indie', title: 'INDIE', big: 'SPOTLIGHT', sub: 'Hidden Gems', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=400&fit=crop' },
];

// ── Explore all games grid ─────────────────────────────────────────────────────
export const EXPLORE_GAMES = [
  { id: 'witcher3', title: 'The Witcher 3', sub: 'Wild Hunt', rating: 4.9, price: 39.99, cover_image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=400&fit=crop' },
  byId('baldurs_gate_3') && { ...byId('baldurs_gate_3'), title: 'Baldur\'s Gate 3', sub: '', rating: 4.9, price: 59.99 },
  { id: 'doom_eternal', title: 'DOOM Eternal', sub: '', rating: 4.8, price: 29.99, cover_image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=300&h=400&fit=crop' },
  { id: 'resident_evil_4', title: 'Resident Evil 4', sub: 'Remake', rating: 4.8, price: 39.99, cover_image: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=300&h=400&fit=crop' },
  { id: 'alan_wake_2', title: 'Alan Wake 2', sub: '', rating: 4.7, price: 49.99, cover_image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=300&h=400&fit=crop' },
  { id: 'forza_horizon_5', title: 'Forza Horizon 5', sub: '', rating: 4.8, price: 29.99, cover_image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=300&h=400&fit=crop' },
  byId('hogwarts_legacy') && { ...byId('hogwarts_legacy'), sub: '', rating: 4.7, price: 39.99 },
  byId('cyberpunk_2077') && { ...byId('cyberpunk_2077'), title: 'Cyberpunk 2077', sub: '', rating: 4.6, price: 29.99 },
].filter(Boolean);

// ── Right rail ─────────────────────────────────────────────────────────────────
export const PERSONALIZED = {
  playstyle: ['Strategic', 'Explorer', 'Collector'],
  genres: ['RPG', 'Sci-Fi', 'Adventure'],
  lastPlayed: 'Elden Ring: Nightreign',
};

export const DAILY_DEAL = {
  title: 'Cyberpunk 2088',
  discount: '-40%',
  oldPrice: '$59.99',
  price: '$35.99',
  claimed: 87,
  timer: '07:45:12',
  image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=200&fit=crop',
};

export const TRENDING_NOW = [
  { rank: '01', title: 'Elden Ring: Nightreign', rating: 4.9, price: 37.49, image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=80&h=80&fit=crop' },
  { rank: '02', title: 'Stellar Odyssey', rating: 4.7, price: 24.49, image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=80&h=80&fit=crop' },
  { rank: '03', title: 'Horizon Forbidden West', rating: 4.8, price: 29.99, image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=80&h=80&fit=crop' },
  { rank: '04', title: 'God of War: Ragnarok', rating: 4.8, price: 49.99, image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=80&h=80&fit=crop' },
  { rank: '05', title: 'Starfield', rating: 4.5, price: 59.99, image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=80&h=80&fit=crop' },
];

export const MEGA_DEAL = {
  save: '75%',
  image: 'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?w=400&h=400&fit=crop',
};

// ── New Releases ──────────────────────────────────────────────────────────────
export const NEW_RELEASES = [
  { id: 'nr1', title: 'Elden Ring: Nightreign', genre: 'Action RPG', date: 'Jul 2026', rating: 4.9, price: 59.99, cover_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=500&fit=crop' },
  { id: 'nr2', title: 'Stellar Odyssey', genre: 'Sci-Fi', date: 'Jul 2026', rating: 4.7, price: 39.99, cover_image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=500&fit=crop' },
  { id: 'nr3', title: 'Voidbreaker', genre: 'Shooter', date: 'Jun 2026', rating: 4.6, price: 49.99, cover_image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=500&fit=crop' },
  { id: 'nr4', title: 'Crimson Realm', genre: 'RPG', date: 'Jun 2026', rating: 4.8, price: 44.99, cover_image: 'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?w=400&h=500&fit=crop' },
  { id: 'nr5', title: 'Neon Drift', genre: 'Racing', date: 'Jun 2026', rating: 4.5, price: 29.99, cover_image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&h=500&fit=crop' },
  { id: 'nr6', title: 'Shadow Protocol', genre: 'Stealth', date: 'May 2026', rating: 4.6, price: 34.99, cover_image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=500&fit=crop' },
  { id: 'nr7', title: 'Frostpunk 2', genre: 'Strategy', date: 'May 2026', rating: 4.7, price: 39.99, cover_image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=500&fit=crop' },
  { id: 'nr8', title: 'Hollow Sanctum', genre: 'Horror', date: 'May 2026', rating: 4.5, price: 27.99, cover_image: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400&h=500&fit=crop' },
];

// ── Top Sellers ───────────────────────────────────────────────────────────────
export const TOP_SELLERS = [
  { id: 'ts1', rank: 1, title: 'Cyberpunk 2088', genre: 'RPG', rating: 4.8, price: 29.99, cover_image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=400&fit=crop' },
  { id: 'ts2', rank: 2, title: 'God of War: Ragnarok', genre: 'Action', rating: 4.9, price: 49.99, cover_image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=400&fit=crop' },
  { id: 'ts3', rank: 3, title: 'Horizon Forbidden West', genre: 'Adventure', rating: 4.8, price: 29.99, cover_image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=300&h=400&fit=crop' },
  { id: 'ts4', rank: 4, title: 'The Witcher 3: Wild Hunt', genre: 'RPG', rating: 4.9, price: 39.99, cover_image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=400&fit=crop' },
  { id: 'ts5', rank: 5, title: 'Starfield', genre: 'Sci-Fi', rating: 4.5, price: 59.99, cover_image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=300&h=400&fit=crop' },
  { id: 'ts6', rank: 6, title: 'Baldur\'s Gate 3', genre: 'RPG', rating: 4.9, price: 59.99, cover_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=400&fit=crop' },
];

// ── Free to Play ──────────────────────────────────────────────────────────────
export const FREE_TO_PLAY = [
  { id: 'ftp1', title: 'Apex Legends', genre: 'Battle Royale', players: '12M', rating: 4.6, cover_image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=500&fit=crop' },
  { id: 'ftp2', title: 'Warframe', genre: 'Action', players: '8M', rating: 4.7, cover_image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=500&fit=crop' },
  { id: 'ftp3', title: 'Genshin Impact', genre: 'RPG', players: '15M', rating: 4.5, cover_image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=500&fit=crop' },
  { id: 'ftp4', title: 'Valorant', genre: 'Shooter', players: '10M', rating: 4.6, cover_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=500&fit=crop' },
  { id: 'ftp5', title: 'Path of Exile 2', genre: 'ARPG', players: '5M', rating: 4.8, cover_image: 'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?w=400&h=500&fit=crop' },
  { id: 'ftp6', title: 'Rocket League', genre: 'Sports', players: '9M', rating: 4.7, cover_image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&h=500&fit=crop' },
];

// ── Coming Soon ───────────────────────────────────────────────────────────────
export const COMING_SOON = [
  { id: 'cs1', title: 'Grand Theft Auto VI', date: 'Fall 2026', wishlist_count: '2.4M', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=300&fit=crop', genre: 'Action' },
  { id: 'cs2', title: 'Monster Hunter Wilds', date: 'Sep 2026', wishlist_count: '890K', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=300&fit=crop', genre: 'Action RPG' },
  { id: 'cs3', title: 'Marvel\'s Wolverine', date: 'Holiday 2026', wishlist_count: '1.2M', image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=600&h=300&fit=crop', genre: 'Action' },
  { id: 'cs4', title: 'Death Stranding 2', date: '2027', wishlist_count: '760K', image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&h=300&fit=crop', genre: 'Adventure' },
];

// ── Special Offers ────────────────────────────────────────────────────────────
export const SPECIAL_OFFERS = [
  { id: 'so1', title: 'DOOM Eternal', discount: '-50%', oldPrice: 59.99, price: 29.99, cover_image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=300&h=400&fit=crop', genre: 'Shooter' },
  { id: 'so2', title: 'Resident Evil 4', discount: '-40%', oldPrice: 59.99, price: 35.99, cover_image: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=300&h=400&fit=crop', genre: 'Horror' },
  { id: 'so3', title: 'Forza Horizon 5', discount: '-35%', oldPrice: 59.99, price: 38.99, cover_image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=300&h=400&fit=crop', genre: 'Racing' },
  { id: 'so4', title: 'Alan Wake 2', discount: '-30%', oldPrice: 49.99, price: 34.99, cover_image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=300&h=400&fit=crop', genre: 'Horror' },
  { id: 'so5', title: 'Hogwarts Legacy', discount: '-25%', oldPrice: 59.99, price: 44.99, cover_image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=400&fit=crop', genre: 'RPG' },
  { id: 'so6', title: 'Cyberpunk 2077', discount: '-55%', oldPrice: 59.99, price: 26.99, cover_image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=400&fit=crop', genre: 'RPG' },
];

// ── Editor's Choice ───────────────────────────────────────────────────────────
export const EDITORS_CHOICE = [
  { id: 'ec1', title: 'Disco Elysium', quote: 'A masterclass in narrative RPG design', author: '— Staff Review', rating: 4.9, cover_image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300&h=400&fit=crop' },
  { id: 'ec2', title: 'Hades', quote: 'Roguelike perfection with heart', author: '— Staff Review', rating: 4.9, cover_image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=400&fit=crop' },
  { id: 'ec3', title: 'Outer Wilds', quote: 'The greatest mystery in gaming', author: '— Staff Review', rating: 4.8, cover_image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=300&h=400&fit=crop' },
  { id: 'ec4', title: 'Slay the Spire', quote: 'The deck-builder that started it all', author: '— Staff Review', rating: 4.8, cover_image: 'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?w=300&h=400&fit=crop' },
];