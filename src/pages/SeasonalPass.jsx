import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SeasonalPassContent from '../components/dashboard/SeasonalPassContent';
import MiniLunaNav from '../components/nav/MiniLunaNav';

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
    <div className="min-h-screen">
      <SeasonalPassContent />
    </div>
  );
}