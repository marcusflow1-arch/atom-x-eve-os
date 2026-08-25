// StorefrontLayout.jsx — Interactive redesigned Store front page
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import GenreSidebar from './GenreSidebar';
import StorefrontHero from './StorefrontHero';
import QuickAccessPanel from './QuickAccessPanel';
import BrowseByGenre from './BrowseByGenre';
import NewReleases from './NewReleases';
import CuratedCollections from './CuratedCollections';
import TopSellers from './TopSellers';
import ComingSoon from './ComingSoon';
import ExploreAllGames from './ExploreAllGames';
import FreeToPlay from './FreeToPlay';
import SpecialOffers from './SpecialOffers';
import EditorsChoice from './EditorsChoice';
import StorefrontRightRail from './StorefrontRightRail';

const normalize = value => String(value || '').toLowerCase().replace(/[_-]/g, ' ');

function matchesFilter(game, filter) {
  if (!filter || filter === 'Discover' || filter === 'All Games') return true;
  const title = normalize(game.title);
  const genre = normalize(game.genre);
  const tags = (game.tags || []).map(normalize);
  const haystack = [title, genre, ...tags].join(' ');
  const rating = Number(game.rating) || 0;
  const reviews = Number(game.reviews) || 0;
  const year = Number(game.release_year || game.original_year || game.year) || 0;
  switch (normalize(filter)) {
    case 'trending': return reviews >= 500 || rating >= 4.3 || tags.includes('trending');
    case 'new releases': return year >= 2023 || tags.includes('new release') || tags.includes('new releases');
    case 'top rated': return rating >= 4.5;
    case 'coming soon': return ['planned', 'in development', 'in_development'].includes(normalize(game.status));
    case 'free to play': return game.price === 0 || game.price == null || game.free_to_play || game.isFree;
    case 'special offers': return Boolean(game.sale_price || game.discount || game.on_sale);
    case 'action': case 'rpg': case 'shooter': case 'strategy': case 'adventure': case 'sports': case 'racing': case 'simulation': case 'horror': case 'puzzle': case 'romance': case 'sci fi': return genre === normalize(filter) || haystack.includes(normalize(filter));
    default: return haystack.includes(normalize(filter));
  }
}

export default function StorefrontLayout({ onNavigateToGame, games = [] }) {
  const [spotlightGame, setSpotlightGame] = useState(null);
  const [activeFilter, setActiveFilter] = useState('Discover');
  const hasReal = games.length > 0;
  const filteredGames = useMemo(() => games.filter(g => matchesFilter(g, activeFilter)), [games, activeFilter]);
  const visibleGames = filteredGames.length ? filteredGames : games;
  const pick = (n, offset = 0) => visibleGames.slice(offset, offset + n);

  const handleSelect = value => {
    if (value && typeof value === 'object' && value.id) return onNavigateToGame?.(value.id);
    if (typeof value === 'string') setActiveFilter(value);
  };
  const handlePlay = () => {
    const game = spotlightGame || visibleGames[0] || games[0];
    if (game?.id) onNavigateToGame?.(game.id);
  };

  return (
    <div className="storefront-aaa-surface relative h-full w-full overflow-hidden">
      <style>{`
        .storefront-aaa-surface div[class*="rounded-"] {
          border-radius: 0 !important;
          border-color: rgba(255,255,255,0.075) !important;
          background-color: rgba(255,255,255,0.018) !important;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.035), 0 8px 24px rgba(0,0,0,0.08) !important;
        }
        .storefront-aaa-surface div[class*="rounded-"]:hover {
          border-color: rgba(255,255,255,0.12) !important;
          background-color: rgba(255,255,255,0.028) !important;
        }
      `}</style>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 75% 0%, rgba(99,102,241,0.10) 0%, transparent 45%), radial-gradient(circle at 10% 100%, rgba(56,189,248,0.07) 0%, transparent 50%), linear-gradient(180deg, #0A0F1C 0%, #060912 60%, #04060d 100%)' }} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative h-full w-full overflow-y-auto custom-scrollbar px-6 pb-28" style={{ scrollbarWidth: 'none' }}>
        <div className="flex gap-6 max-w-[1700px] mx-auto pt-5">
          <div className="w-[230px] flex-shrink-0 hidden lg:block sticky top-5 self-start" style={{ height: 'calc(100vh - 150px)' }}>
            <GenreSidebar active={activeFilter} onSelect={handleSelect} />
          </div>
          <div className="flex-1 min-w-0 space-y-8">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs">
              <span className="text-white/40 uppercase tracking-widest">Store filter</span>
              <button onClick={() => setActiveFilter('Discover')} className="text-cyan-300 hover:text-white font-bold">{activeFilter} <span className="text-white/30 ml-2">×</span></button>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-4 h-[360px]">
              <StorefrontHero game={spotlightGame || visibleGames[0]} onPlay={handlePlay} />
              <div className="hidden xl:block"><QuickAccessPanel onSelect={handleSelect} /></div>
            </div>
            <BrowseByGenre onSelect={handleSelect} />
            <NewReleases onSelect={onNavigateToGame} games={hasReal ? pick(8) : undefined} />
            <CuratedCollections onSelect={handleSelect} />
            <TopSellers onSelect={onNavigateToGame} games={hasReal ? pick(6, 8) : undefined} />
            <ComingSoon onSelect={handleSelect} />
            <ExploreAllGames onSelect={onNavigateToGame} onHoverGame={setSpotlightGame} games={hasReal ? visibleGames : undefined} />
            <SpecialOffers onSelect={onNavigateToGame} games={hasReal ? pick(6, 14) : undefined} />
            <FreeToPlay onSelect={onNavigateToGame} games={hasReal ? visibleGames.filter(g => g.price === 0 || g.price == null).slice(0, 6) : undefined} />
            <EditorsChoice onSelect={onNavigateToGame} games={hasReal ? pick(4, 20) : undefined} />
          </div>
          <div className="w-[280px] flex-shrink-0 hidden 2xl:block"><StorefrontRightRail onSelect={handleSelect} /></div>
        </div>
      </motion.div>
    </div>
  );
}
