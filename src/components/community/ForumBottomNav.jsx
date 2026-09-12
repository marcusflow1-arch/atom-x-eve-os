import React from 'react';
import { Clock3, Flame, Grid, Home, ListFilter, Wheat } from 'lucide-react';
import './forumHub.css';

export default function ForumBottomNav({ activeTab = 'home', onBrowseForums, onTabSelect }) {
  if (activeTab === 'farm_hub') {
    return <div className="flex h-full w-full items-center justify-center">
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => onTabSelect?.('hub')}
          className="relative mx-1 flex items-center gap-2 px-6 py-2 text-sm font-medium uppercase tracking-wide text-white/60 transition-all duration-300 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
        >
          <Grid className="h-4 w-4" /><span>Forum Hub</span>
        </button>
        <div className="mx-2 h-5 w-px bg-white/10" />
        <button
          type="button"
          onClick={() => onTabSelect?.('farm_hub')}
          className="relative mx-1 flex items-center gap-2 px-6 py-2 text-sm font-medium uppercase tracking-wide text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]"
        >
          <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-yellow-400/20 blur-md" />
          <Wheat className="h-4 w-4" /><span>Farm Hub</span>
        </button>
      </div>
    </div>;
  }

  return <nav
    className="forum-console-nav"
    aria-label="Forum navigation"
    style={{ '--forum-accent': '#9de8f2', '--forum-accent-rgb': '157,232,242' }}
  >
    <button type="button" onClick={onBrowseForums} className="forum-browser-link"><ListFilter size={16} /><span>Forums</span></button>
    <div className="forum-console-center">
      <button type="button" onClick={() => onTabSelect?.('recent')} className={activeTab === 'recent' ? 'is-active' : ''}><Clock3 size={16} /><span>Recent</span></button>
      <button type="button" onClick={() => onTabSelect?.('home')} className={activeTab === 'home' ? 'is-active' : ''}><Home size={16} /><span>Home</span></button>
      <button type="button" onClick={() => onTabSelect?.('heated')} className={activeTab === 'heated' ? 'is-active' : ''}><Flame size={16} /><span>Popular</span></button>
    </div>
  </nav>;
}
