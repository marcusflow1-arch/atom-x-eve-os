import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import MobileBottomNav from './MobileBottomNav';
import MobileHeader from './MobileHeader';
import MobileDrawer from './MobileDrawer';
import LibrarySidebar from '@/components/streaming/LibrarySidebar';

export default function MobileLayoutShell({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

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

      {/* Middle-Left Floating Button */}
      <button
        onClick={() => setLibraryOpen(true)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-[49] flex items-center justify-center"
        style={{
          width: '28px',
          height: '56px',
          background: 'rgba(100, 120, 140, 0.18)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '0 10px 10px 0',
          border: '1px solid rgba(255,255,255,0.10)',
          borderLeft: 'none',
          boxShadow: '2px 0 12px rgba(0,0,0,0.25)',
        }}
      >
        <div className="flex flex-col gap-[4px] items-center">
          <span className="w-[10px] h-[2px] bg-white/60 rounded-full"></span>
          <span className="w-[10px] h-[2px] bg-white/60 rounded-full"></span>
          <span className="w-[10px] h-[2px] bg-white/60 rounded-full"></span>
        </div>
      </button>

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