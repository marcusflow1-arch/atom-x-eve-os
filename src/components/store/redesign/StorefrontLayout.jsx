// StorefrontLayout.jsx — Composes the full redesigned Store front page
import React, { useState } from 'react';
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

export default function StorefrontLayout({ onNavigateToGame, games = [] }) {
  // Lifted state: hovering a game card updates the spotlight dynamically
  const [spotlightGame, setSpotlightGame] = useState(null);

  // Map real DB games into each section's format; fall back to mock if no real games
  const hasReal = games.length > 0;
  const pick = (n, offset = 0) => games.slice(offset, offset + n);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Atmospheric background — deep navy → black with subtle moon glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 75% 0%, rgba(99,102,241,0.10) 0%, transparent 45%), radial-gradient(circle at 10% 100%, rgba(56,189,248,0.07) 0%, transparent 50%), linear-gradient(180deg, #0A0F1C 0%, #060912 60%, #04060d 100%)' }} />

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="relative h-full w-full overflow-y-auto custom-scrollbar px-6 pb-28"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="flex gap-6 max-w-[1700px] mx-auto pt-5">
          {/* LEFT: Genre/Discover sidebar */}
          <div className="w-[230px] flex-shrink-0 hidden lg:block sticky top-5 self-start" style={{ height: 'calc(100vh - 150px)' }}>
            <GenreSidebar onSelect={() => {}} />
          </div>

          {/* CENTER: main content — strong vertical rhythm (32px) */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* Hero + Quick Access — dominant spotlight */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-4 h-[360px]">
              <StorefrontHero game={spotlightGame} onPlay={() => {}} />
              <div className="hidden xl:block">
                <QuickAccessPanel onSelect={() => {}} />
              </div>
            </div>

            <BrowseByGenre onSelect={() => {}} />
            <NewReleases onSelect={onNavigateToGame} games={hasReal ? pick(8) : undefined} />
            <CuratedCollections onSelect={() => {}} />
            <TopSellers onSelect={onNavigateToGame} games={hasReal ? pick(6, 8) : undefined} />
            <ComingSoon onSelect={() => {}} />
            <ExploreAllGames onSelect={onNavigateToGame} onHoverGame={setSpotlightGame} games={hasReal ? games : undefined} />
            <SpecialOffers onSelect={onNavigateToGame} games={hasReal ? pick(6, 14) : undefined} />
            <FreeToPlay onSelect={onNavigateToGame} games={hasReal ? games.filter(g => g.price === 0 || g.price == null).slice(0, 6) : undefined} />
            <EditorsChoice onSelect={onNavigateToGame} games={hasReal ? pick(4, 20) : undefined} />
          </div>

          {/* RIGHT: rail */}
          <div className="w-[280px] flex-shrink-0 hidden 2xl:block">
            <StorefrontRightRail onSelect={() => {}} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}