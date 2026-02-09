import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MobileBottomNav from './MobileBottomNav';
import MobileHeader from './MobileHeader';
import MobileDrawer from './MobileDrawer';

export default function MobileLayoutShell({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)',
      }}
    >
      {/* Mobile Header */}
      <MobileHeader onMenuOpen={() => setDrawerOpen(true)} />

      {/* Page Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
        {children}
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNav />

      {/* Mobile Drawer */}
      <AnimatePresence>
        {drawerOpen && <MobileDrawer onClose={() => setDrawerOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}