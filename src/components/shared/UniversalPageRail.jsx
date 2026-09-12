import React, { useEffect, useState } from 'react';
import { UICustomizationControls, UICustomizationProvider } from '@/components/customization/UICustomizationSystem';

const STORAGE_KEY = 'atom_eve_left_rail_visible';

export default function UniversalPageRail({ children, pathname }) {
  const lowerPath = pathname.toLowerCase();
  const isLunaHome = lowerPath.includes('/lunatemplate');
  const [visible, setVisible] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) !== 'false'; }
    catch { return true; }
  });

  useEffect(() => {
    const handleCollapse = (event) => setVisible(!event.detail);
    window.addEventListener('sidebarCollapseChange', handleCollapse);
    return () => window.removeEventListener('sidebarCollapseChange', handleCollapse);
  }, []);

  useEffect(() => {
    if (isLunaHome) return undefined;
    const hidden = [];
    let frame = 0;

    const hide = (element) => {
      if (!element || element.closest('[data-atom-customization-midpoint="true"]')) return;
      if (hidden.some((entry) => entry.element === element)) return;
      hidden.push({ element, display: element.style.display });
      element.style.display = 'none';
    };

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (lowerPath.includes('/clan')) {
          hide(document.querySelector('button[title="Roster"]'));
        }
        if (lowerPath.includes('/community') || lowerPath.includes('/forum')) {
          hide(document.querySelector('button[title="Forum Quick Menu"]'));
        }
      });
    };

    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    sync();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      hidden.forEach(({ element, display }) => {
        if (element?.isConnected) element.style.display = display;
      });
    };
  }, [isLunaHome, lowerPath]);

  return (
    <UICustomizationProvider pathname={pathname}>
      {isLunaHome ? children : (
        <div className="flex h-full w-full overflow-hidden bg-black/20">
          {visible && (
            <aside
              data-ui-editor-ignore="true"
              className="relative z-30 mt-16 mb-[53px] h-[calc(100%-117px)] w-[5%] min-w-[80px] flex-shrink-0 self-start border-r border-white/20 bg-black/20 py-6 shadow-[5px_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm"
            >
              {/* Preserve the existing Recent Games / Recently Played area. */}
              <div className="mt-12 flex w-full flex-col items-center px-2">
                <span className="mb-1 text-center text-[10px] font-bold uppercase tracking-wider text-white/50">Recently<br />Played</span>
                <div className="mb-3 h-px w-8 bg-white/20" />
                <div className="flex w-full flex-col items-center gap-2">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                      <span className="text-lg font-bold text-white/30">?</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Only the unused 50/50 midpoint is replaced with page actions/customization. */}
              <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
                <UICustomizationControls />
              </div>
            </aside>
          )}
          <div className="universal-page-rail-content relative h-full min-w-0 flex-1 overflow-hidden bg-black/10">{children}</div>
        </div>
      )}
    </UICustomizationProvider>
  );
}
