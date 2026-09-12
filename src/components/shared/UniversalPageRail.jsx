import React, { useEffect, useState } from 'react';
import { UICustomizationProvider, UICustomizationRail } from '@/components/customization/UICustomizationSystem';

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

  return (
    <UICustomizationProvider pathname={pathname}>
      {isLunaHome ? children : (
        <div className="flex h-full w-full overflow-hidden bg-black/10">
          {visible && (
            <aside
              data-ui-editor-ignore="true"
              className="relative z-30 mt-16 mb-[53px] h-[calc(100%-117px)] w-[5%] min-w-[80px] flex-shrink-0 self-start border-r border-white/[0.10] bg-[#11161d]/46 px-2 py-3 shadow-[5px_0_24px_rgba(0,0,0,0.28),inset_-1px_0_0_rgba(255,255,255,0.025)] backdrop-blur-2xl"
            >
              <UICustomizationRail />
            </aside>
          )}
          <div className="universal-page-rail-content relative h-full min-w-0 flex-1 overflow-hidden bg-transparent">{children}</div>
        </div>
      )}
    </UICustomizationProvider>
  );
}