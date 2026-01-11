import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AIStoryOverlay from '../components/dashboard/AIStoryOverlay';

export default function AIStory() {
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
      <AIStoryOverlay onClose={() => navigate(createPageUrl('LunaTemplate'))} />
    </div>
  );
}