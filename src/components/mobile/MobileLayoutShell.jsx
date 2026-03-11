import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import MobileBottomNav from './MobileBottomNav';
import MobileDrawer from './MobileDrawer';
import LibrarySidebar from '@/components/streaming/LibrarySidebar';
import ViewModeToggle from './ViewModeToggle';

export default function MobileLayoutShell({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div
      className="h-full w-full relative overflow-hidden"
      style={{ maxHeight: '100vh', maxWidth: '100vw' }}
    >
      {/* Floating ViewModeToggle so user can switch back to desktop mode */}
      <div className="absolute top-4 right-4 z-[60]">
        <ViewModeToggle />
      </div>

      {/* Page Content - full screen, scrollable, content flows behind bars */}
      <div className="h-full w-full overflow-y-auto overflow-x-hidden" style={{ paddingTop: '0px', paddingBottom: '52px' }}>
        {children}
      </div>

      {/* Library Sidebar - exact same component as desktop, rendered inside mobile */}
      <LibrarySidebar />

      {/* Bottom Navigation - floating glass overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-[50]">
        <MobileBottomNav />
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {drawerOpen && <MobileDrawer onClose={() => setDrawerOpen(false)} />}
      </AnimatePresence>


    </div>
  );
}