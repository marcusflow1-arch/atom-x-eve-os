import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import MobileBottomNav from './MobileBottomNav';
import MobileHeader from './MobileHeader';
import MobileDrawer from './MobileDrawer';
import LibrarySidebar from '@/components/streaming/LibrarySidebar';

export default function MobileLayoutShell({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div
      className="h-full w-full relative overflow-hidden"
      style={{ maxHeight: '100vh', maxWidth: '100vw' }}
    >
      {/* Mobile Header - floating glass overlay at top */}
      <div className="absolute top-0 left-0 right-0 z-[50]">
        <MobileHeader onMenuOpen={() => setDrawerOpen(true)} />
      </div>

      {/* Page Content - full screen, scrollable, content flows behind bars */}
      <div className="h-full w-full overflow-y-auto overflow-x-hidden" style={{ paddingTop: '48px', paddingBottom: '52px' }}>
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

      {/* Mobile Library Panel (middle-left button) */}
      <MobileLibraryPanel isOpen={libraryOpen} onClose={() => setLibraryOpen(false)} />
    </div>
  );
}