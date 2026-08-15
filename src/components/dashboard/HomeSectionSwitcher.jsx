import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Home, Star } from 'lucide-react';
import AvatarFeatureRail from './AvatarFeatureRail';

const SECTIONS = [
  { id: 'avatar', label: 'AI Avatar Home', icon: Home, color: 'cyan' },
  { id: 'developer', label: 'Developer Spotlight', icon: Star, color: 'purple' },
];

const ARROW_BASE = 'flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 pointer-events-auto';
const ARROW_STYLE = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.18)',
  backdropFilter: 'blur(8px)',
};

function DashboardFeatureRailOverlay({ visible }) {
  if (typeof document === 'undefined' || !visible) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      className="fixed pointer-events-auto z-[29]"
      style={{
        left: '330px',
        right: '60px',
        top: '184px',
      }}
      data-dashboard-feature-rail="true"
    >
      <AvatarFeatureRail />
    </motion.div>,
    document.body
  );
}

export default function HomeSectionSwitcher({ currentSection, onSectionChange }) {
  const currentIdx = Math.max(0, SECTIONS.findIndex(s => s.id === currentSection));
  const section = SECTIONS[currentIdx];
  const [dashboardUiOpen, setDashboardUiOpen] = useState(false);

  const goRight = () => onSectionChange(SECTIONS[(currentIdx + 1) % SECTIONS.length].id);

  useEffect(() => {
    if (currentSection !== 'avatar') {
      setDashboardUiOpen(false);
      return undefined;
    }

    const detectDashboardState = () => {
      // Avatar focus remains intentionally blank: only the Y-Bot + stats should remain visible.
      const avatarFocusOpen = !!document.querySelector('[data-avatar-focus-hub="true"]');

      // Full Library uses the dashboard's established right-hand overlay geometry.
      const libraryOpen = Array.from(document.querySelectorAll('[style]')).some((el) => {
        const style = el.style;
        return style.left === '330px' && style.top === '64px' && style.bottom === '32px';
      });

      // Selecting a game opens the existing GamePageView area underneath the banner.
      const gameOpen = Array.from(document.querySelectorAll('[style]')).some((el) => {
        const height = el.style.height || '';
        return height.includes('calc(100vh - 224px)');
      });

      setDashboardUiOpen(!avatarFocusOpen && !libraryOpen && !gameOpen);
    };

    detectDashboardState();
    const observer = new MutationObserver(detectDashboardState);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    return () => observer.disconnect();
  }, [currentSection]);

  return (
    <>
      {/* RIGHT arrow — vertically centered, at far right */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={goRight}
        title="Next section"
        className={`${ARROW_BASE} absolute z-50 pointer-events-auto`}
        style={{ right: '16px', top: '50%', transform: 'translateY(-50%)', ...ARROW_STYLE }}
      >
        <ChevronRight className="w-5 h-5 text-white/80" />
      </motion.button>

      {/* Seven compact feature buttons restored beneath Environment Hub / presence row. */}
      <DashboardFeatureRailOverlay visible={dashboardUiOpen && section?.id === 'avatar'} />
    </>
  );
}

export { SECTIONS };