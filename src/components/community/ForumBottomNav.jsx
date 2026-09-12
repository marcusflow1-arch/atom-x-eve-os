import React from 'react';
import { Clock3, Flame, Home, ListFilter } from 'lucide-react';
import './forumHub.css';

export default function ForumBottomNav({ activeTab = 'home', onBrowseForums, onTabSelect }) {
  return <nav className="forum-console-nav" aria-label="Forum navigation">
    <button type="button" onClick={onBrowseForums} className="forum-browser-link"><ListFilter size={16} /><span>Forums</span></button>
    <div className="forum-console-center">
      <button type="button" onClick={() => onTabSelect?.('recent')} className={activeTab === 'recent' ? 'is-active' : ''}><Clock3 size={16} /><span>Recent</span></button>
      <button type="button" onClick={() => onTabSelect?.('home')} className={activeTab === 'home' ? 'is-active' : ''}><Home size={16} /><span>Home</span></button>
      <button type="button" onClick={() => onTabSelect?.('heated')} className={activeTab === 'heated' ? 'is-active' : ''}><Flame size={16} /><span>Heated</span></button>
    </div>
  </nav>;
}
