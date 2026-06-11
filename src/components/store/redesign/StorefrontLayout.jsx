// StorefrontLayout.jsx — Composes the full redesigned Store front page
import React from 'react';
import { motion } from 'framer-motion';
import GenreSidebar from './GenreSidebar';
import StorefrontHero from './StorefrontHero';
import QuickAccessPanel from './QuickAccessPanel';
import BrowseByGenre from './BrowseByGenre';
import CuratedCollections from './CuratedCollections';
import ExploreAllGames from './ExploreAllGames';
import StorefrontRightRail from './StorefrontRightRail';

export default function StorefrontLayout({ onNavigateToGame }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="h-full w-full overflow-y-auto custom-scrollbar px-5 pb-24"
      style={{ scrollbarWidth: 'none' }}
    >
      <div className="flex gap-5 max-w-[1700px] mx-auto pt-4">
        {/* LEFT: Genre/Discover sidebar */}
        <div className="w-[230px] flex-shrink-0 hidden lg:block sticky top-4 self-start" style={{ height: 'calc(100vh - 140px)' }}>
          <GenreSidebar onSelect={() => {}} />
        </div>

        {/* CENTER: main content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Hero + Quick Access */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-4 h-[300px]">
            <StorefrontHero onPlay={() => {}} />
            <div className="hidden xl:block">
              <QuickAccessPanel onSelect={() => {}} />
            </div>
          </div>

          <BrowseByGenre onSelect={() => {}} />
          <CuratedCollections onSelect={() => {}} />
          <ExploreAllGames onSelect={onNavigateToGame} />
        </div>

        {/* RIGHT: rail */}
        <div className="w-[280px] flex-shrink-0 hidden 2xl:block">
          <StorefrontRightRail onSelect={() => {}} />
        </div>
      </div>
    </motion.div>
  );
}