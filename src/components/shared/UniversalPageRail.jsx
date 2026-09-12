import React, { useEffect, useState } from 'react';
import { UICustomizationProvider } from '@/components/customization/UICustomizationSystem';
import MidpointCustomizationControls from '@/components/customization/MidpointCustomizationControls';
import UIMediaCustomization from '@/components/customization/UIMediaCustomization';

const STORAGE_KEY = 'atom_eve_left_rail_visible';

export default function UniversalPageRail({ children, pathname }) {
  const lowerPath = pathname.toLowerCase();
  const isLunaHome = lowerPath.includes('/lunatemplate');
  const isClan = lowerPath.includes('/clan');
  const [visible, setVisible] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) !== 'false'; }
    catch { return true; }
  });

  useEffect(() => {
    const handleCollapse = (event) => setVisible(!event.detail);
    window.addEventListener('sidebarCollapseChange', handleCollapse);
    return () => window.removeEventListener('sidebarCollapseChange', handleCollapse);
  }, []);

  // The user explicitly removed the separate Clan Roster rail shortcut. Hide
  // only that exact legacy button; never collision-hide unrelated controls.
  useEffect(() => {
    if (!isClan) return undefined;
    let frame = 0;
    let record = null;

    const restore = () => {
      if (record?.element?.isConnected) record.element.style.display = record.display;
      record = null;
    };

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const roster = Array.from(document.querySelectorAll('button[title="Roster"],button[aria-label="Roster"]'))
          .find((button) => !button.closest('[data-atom-midpoint-controls="true"]'));
        if (!roster || record?.element === roster) return;
        restore();
        record = { element: roster, display: roster.style.display };
        roster.style.display = 'none';
      });
    };

    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    sync();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      restore();
    };
  }, [isClan]);

  return (
    <UICustomizationProvider pathname={pathname}>
      {isLunaHome ? children : (
        <div className="flex h-full w-full overflow-hidden bg-black/20">
          {visible && (
            <aside
              data-ui-editor-ignore="true"
              className="relative z-30 mt-16 mb-[53px] h-[calc(100%-117px)] w-[5%] min-w-[80px] flex-shrink-0 self-start overflow-visible border-r border-white/20 bg-black/20 px-2 py-4 shadow-[5px_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm"
            >
              {/* Existing Recently Played area stays in its original top lane. */}
              <div className="flex min-h-0 flex-col items-center pt-2">
                <span className="mb-1 shrink-0 text-center text-[9px] font-bold uppercase leading-3 tracking-wider text-white/50">Recently<br />Played</span>
                <div className="mb-2 h-px w-8 shrink-0 bg-white/20" />
                <div className="flex w-full flex-col items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="grid aspect-square w-[clamp(30px,4.5vh,40px)] shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5">
                      <span className="text-base font-bold text-white/30">?</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* The ONLY controls in the middle replacement lane are:
                  Prefab -> Environment Launch -> Layout Edit. */}
              <div className="pointer-events-none absolute inset-x-0 top-1/2 z-[120] flex -translate-y-1/2 justify-center">
                <div className="pointer-events-auto">
                  <MidpointCustomizationControls />
                </div>
              </div>
            </aside>
          )}

          <div className="universal-page-rail-content relative h-full min-w-0 flex-1 overflow-hidden bg-black/10">
            {children}
          </div>
          <UIMediaCustomization />
        </div>
      )}
    </UICustomizationProvider>
  );
}
