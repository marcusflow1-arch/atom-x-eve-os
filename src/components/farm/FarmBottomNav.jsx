import React from 'react';
import { CircleHelp, Home, ListFilter, Trophy } from 'lucide-react';
import './farmHub.css';

export default function FarmBottomNav({ activeTab = 'home', onBrowseGames, onTabSelect }) {
  return <nav className="farm-console-nav" aria-label="Farm Hub navigation">
    <button type="button" onClick={onBrowseGames} className="farm-browser-link"><ListFilter size={16} /><span>Games</span></button>
    <div className="farm-console-center">
      <button type="button" onClick={() => onTabSelect?.('help')} className={activeTab === 'help' ? 'is-active' : ''}><CircleHelp size={16} /><span>Help</span></button>
      <button type="button" onClick={() => onTabSelect?.('home')} className={activeTab === 'home' ? 'is-active' : ''}><Home size={16} /><span>Home</span></button>
      <button type="button" onClick={() => onTabSelect?.('achievements')} className={activeTab === 'achievements' ? 'is-active' : ''}><Trophy size={16} /><span>Achievements</span></button>
    </div>
  </nav>;
}
