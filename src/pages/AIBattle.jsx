import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { X } from 'lucide-react';
import BattleModeOverlay from '../components/dashboard/BattleModeOverlay';

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
      className="min-h-screen w-full"
      style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}
    >
      {/* Close Button */}
      <button
        onClick={() => navigate(createPageUrl('LunaTemplate'))}
        className="fixed top-6 right-6 z-50 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all group"
      >
        <X className="w-6 h-6 text-white/70 group-hover:text-white" />
      </button>

      <BattleModeOverlay onClose={() => navigate(createPageUrl('LunaTemplate'))} />
    </div>
  );
}