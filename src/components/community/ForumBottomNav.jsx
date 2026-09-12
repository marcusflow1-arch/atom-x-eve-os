import React, { useEffect } from 'react';
import { Clock3, Flame, Home, ListFilter, Wheat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import './forumHub.css';

export default function ForumBottomNav({ activeTab = 'home', onBrowseForums, onTabSelect }) {
  const navigate = useNavigate();
  const inFarmHub = activeTab === 'farm_hub';

  const handleForums = () => {
    if (onBrowseForums) onBrowseForums();
    else navigate(createPageUrl('Community'));
  };

  useEffect(() => {
    const openDirectory = () => {
      // The sidebar's existing Forum Quick Menu is only being relocated
      // visually. Reuse that exact action when the midpoint control is pressed.
      const quickMenu = document.querySelector('button[title="Forum Quick Menu"]');
      if (quickMenu) {
        quickMenu.click();
        return;
      }
      handleForums();
    };
    window.addEventListener('openForumDirectory', openDirectory);
    return () => window.removeEventListener('openForumDirectory', openDirectory);
  }, [onBrowseForums, navigate]);

  const handleFarmHub = () => {
    if (inFarmHub) onTabSelect?.('farm_hub');
    else navigate(createPageUrl('Farm'));
  };

  const handleHome = () => {
    if (inFarmHub) {
      onTabSelect?.('farm_hub');
      return;
    }
    onTabSelect?.('home');
    window.dispatchEvent(new CustomEvent('forumGoHome'));
  };

  return <nav
    className="forum-console-nav relative h-full w-full"
    aria-label="Forum navigation"
    style={{ pointerEvents: 'auto' }}
  >
    <div className="absolute inset-y-0 left-0 z-30 flex items-center gap-1 pointer-events-auto">
      <button
        type="button"
        onClick={handleForums}
        className="forum-browser-link relative z-30 flex min-h-[40px] items-center gap-2 px-4 pointer-events-auto"
      >
        <ListFilter size={16} className="pointer-events-none" />
        <span className="pointer-events-none">Forums</span>
      </button>
      <button
        type="button"
        onClick={handleFarmHub}
        className={`relative z-30 flex min-h-[40px] items-center gap-2 px-4 transition-colors pointer-events-auto ${inFarmHub ? 'text-yellow-300' : 'text-white/65 hover:text-white'}`}
      >
        <Wheat size={16} className="pointer-events-none" />
        <span className="pointer-events-none">Farm Hub</span>
      </button>
    </div>

    <div className="forum-console-center relative z-10">
      {!inFarmHub && <button type="button" onClick={() => onTabSelect?.('recent')} className={activeTab === 'recent' ? 'is-active' : ''}><Clock3 size={16} /><span>Recent</span></button>}
      <button type="button" onClick={handleHome} className={!inFarmHub && activeTab === 'home' ? 'is-active' : ''}><Home size={16} /><span>Home</span></button>
      {!inFarmHub && <button type="button" onClick={() => onTabSelect?.('heated')} className={activeTab === 'heated' ? 'is-active' : ''}><Flame size={16} /><span>Popular</span></button>}
    </div>
  </nav>;
}
