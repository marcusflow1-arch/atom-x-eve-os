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