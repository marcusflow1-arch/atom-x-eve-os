import React from 'react';
import { Clock3, Flame, Home, ListFilter, Wheat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import './forumHub.css';

export default function ForumBottomNav({ activeTab = 'home', onBrowseForums, onTabSelect }) {
  const navigate = useNavigate();

  return <nav
    className="forum-console-nav relative h-full w-full"
    aria-label="Forum navigation"
    style={{ '--forum-accent': '#9de8f2', '--forum-accent-rgb': '157,232,242', pointerEvents: 'auto' }}
  >
    <div className="absolute inset-y-0 left-0 z-30 flex items-center gap-1 pointer-events-auto">
      <button
        type="button"
        onClick={onBrowseForums}
        className="forum-browser-link relative z-30 flex min-h-[40px] items-center gap-2 px-4 pointer-events-auto"
      >
        <ListFilter size={16} className="pointer-events-none" />
        <span className="pointer-events-none">Forums</span>
      </button>
      <button
        type="button"
        onClick={() => navigate(createPageUrl('Farm'))}
        className="relative z-30 flex min-h-[40px] items-center gap-2 px-4 text-white/65 transition-colors hover:text-white pointer-events-auto"
      >
        <Wheat size={16} className="pointer-events-none" />
        <span className="pointer-events-none">Farm Hub</span>
      </button>
    </div>

    <div className="forum-console-center relative z-10">
      <button type="button" onClick={() => onTabSelect?.('recent')} className={activeTab === 'recent' ? 'is-active' : ''}><Clock3 size={16} /><span>Recent</span></button>
      <button type="button" onClick={() => onTabSelect?.('home')} className={activeTab === 'home' ? 'is-active' : ''}><Home size={16} /><span>Home</span></button>
      <button type="button" onClick={() => onTabSelect?.('heated')} className={activeTab === 'heated' ? 'is-active' : ''}><Flame size={16} /><span>Popular</span></button>
    </div>
  </nav>;
}
