import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import MobileBottomNav from './MobileBottomNav';
import MobileHeader from './MobileHeader';
import MobileDrawer from './MobileDrawer';

export default function MobileLayoutShell({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div
      className="h-full w-full flex flex-col overflow-hidden relative"
      style={{
        /* Fill the screen exactly: header 48px + content + nav 52px = 100% */
        maxHeight: '100vh',
        maxWidth: '100vw',
      }}
    >
      {/* Mobile Header - 48px */}
      <MobileHeader onMenuOpen={() => setDrawerOpen(true)} />

      {/* Page Content - fills remaining space, scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative min-h-0">
        {children}
      </div>

      {/* Bottom Navigation - 52px */}
      <MobileBottomNav />

      {/* Mobile Drawer */}
      <AnimatePresence>
        {drawerOpen && <MobileDrawer onClose={() => setDrawerOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}