import React from 'react';
import { Clock3, Flame, Home, ListFilter, Wheat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import './forumHub.css';

export default function ForumBottomNav({ activeTab = 'home', onBrowseForums, onTabSelect }) {
  const navigate = useNavigate();

  return <nav
    className="forum-console-nav"
    aria-label="Forum navigation"
    style={{ '--forum-accent': '#9de8f2', '--forum-accent-rgb': '157,232,242' }}
  >
    <div className="absolute right-0 flex items-center gap-1">
      <button type="button" onClick={onBrowseForums} className="forum-browser-link"><ListFilter size={16} /><span>Forums</span></button>
      <button type="button" onClick={() => navigate(createPageUrl('Farm'))}><Wheat size={16} /><span>Farm Hub</span></button>
    </div>

    <div className="forum-console-center">
      <button type="button" onClick={() => onTabSelect?.('recent')} className={activeTab === 'recent' ? 'is-active' : ''}><Clock3 size={16} /><span>Recent</span></button>
      <button type="button" onClick={() => onTabSelect?.('home')} className={activeTab === 'home' ? 'is-active' : ''}><Home size={16} /><span>Home</span></button>
      <button type="button" onClick={() => onTabSelect?.('heated')} className={activeTab === 'heated' ? 'is-active' : ''}><Flame size={16} /><span>Popular</span></button>
    </div>
  </nav>;
}
