import React, { useEffect, useState } from 'react';
import GameChatRailSection from '@/components/clan/GameChatRailSection';

const STORAGE_KEY = 'atom_eve_left_rail_visible';

export default function UniversalPageRail({ children, pathname }) {
  const isLunaHome = pathname.toLowerCase().includes('/lunatemplate');
  const [visible, setVisible] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) !== 'false'; }
    catch { return true; }
  });

  useEffect(() => {
    const handleCollapse = (event) => setVisible(!event.detail);
    window.addEventListener('sidebarCollapseChange', handleCollapse);
    return () => window.removeEventListener('sidebarCollapseChange', handleCollapse);
  }, []);

  if (isLunaHome) return children;

  return (
    <div className="flex h-full w-full overflow-hidden bg-black/20">
      {visible && (
        <aside className="relative z-30 mt-16 mb-[53px] h-[calc(100%-117px)] w-[5%] min-w-[80px] flex-shrink-0 self-start border-r border-white/20 bg-black/20 py-6 shadow-[5px_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm">
          <GameChatRailSection />
        </aside>
      )}
      <div className="universal-page-rail-content relative h-full min-w-0 flex-1 overflow-hidden bg-black/10">{children}</div>
    </div>
  );
}