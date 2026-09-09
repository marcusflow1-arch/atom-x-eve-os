import React, { useEffect, useState } from 'react';

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
        <aside className="relative z-40 h-full w-[5%] min-w-[80px] flex-shrink-0 border-r border-white/20 bg-black/20 py-6 shadow-[5px_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm">
          <div className="mt-12 flex w-full flex-col items-center px-2">
            <span className="mb-1 text-center text-[10px] font-bold uppercase tracking-wider text-white/50">Recently<br />Played</span>
            <div className="mb-3 h-px w-8 bg-white/20" />
            <div className="flex w-full flex-col items-center gap-2">
              {[1, 2, 3, 4, 5].map((item) => <div key={item} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5"><span className="text-lg font-bold text-white/30">?</span></div>)}
            </div>
          </div>
        </aside>
      )}
      <div className="universal-page-rail-content relative h-full min-w-0 flex-1 overflow-hidden bg-black/10">{children}</div>
    </div>
  );
}