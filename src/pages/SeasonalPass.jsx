import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SeasonalPassContent from '../components/dashboard/SeasonalPassContent';
import MiniLunaNav from '../components/nav/MiniLunaNav';
import GlassPageFrame from '../components/shared/GlassPageFrame';

export default function SeasonalPass() {
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
    <GlassPageFrame>
    <div className="min-h-screen">
      <MiniLunaNav title="Season Pass" />
      <div className="mt-2 md:mt-4">
      <SeasonalPassContent />
      </div>
    </div>
    </GlassPageFrame>
  );
}