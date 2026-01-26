import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import BattleModeOverlay from '../components/dashboard/BattleModeOverlay';
import MiniLunaNav from '../components/nav/MiniLunaNav';

export default function AIBattle() {
  const navigate = useNavigate();

  // Escape key to go back to Luna
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        navigate(createPageUrl('LunaTemplate'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div 
      className="min-h-screen w-full relative"
      style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}
    >
      <div className="relative z-30">
        <MiniLunaNav title="AI Battle" />
      </div>
      <div className="relative z-20">
        <BattleModeOverlay onClose={() => navigate(createPageUrl('LunaTemplate'))} />
      </div>
    </div>
  );
}