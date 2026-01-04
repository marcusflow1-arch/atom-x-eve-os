import React from 'react';
import ProfileGameLibrary from '@/components/profile/ProfileGameLibrary';
import PersonalityCarousel from '@/components/profile/PersonalityCarousel';
import FloatingLiveChat from '@/components/profile/FloatingLiveChat';
import GlassPanel from '@/components/shared/GlassPanel';

export default function ProfileHub() {
  return (
    <div className="min-h-screen w-full p-4 md:p-8">
      {/* 10/70/20 layout using explicit column sizes to match spec */}
      <div
        className="w-full h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] grid gap-4 profile-grid"
        style={{ gridTemplateColumns: '10% 1fr 20%', gridTemplateRows: '1fr' }}
      >
        {/* Left 10% - Vertical Game Library (#23) */}
        <div className="h-full">
          <GlassPanel variant="left">
            <ProfileGameLibrary />
          </GlassPanel>
        </div>

        {/* Center 70% - Personality Carousel with Ripple Avatar (#22) and Dark Bio Layer (#24) */}
        <div className="h-full flex flex-col">
          <GlassPanel variant="center" className="flex items-center justify-start">
            <PersonalityCarousel />
          </GlassPanel>
        </div>

        {/* Right 20% - Floating Live Chat (#27) */}
        <div className="h-full">
          <GlassPanel variant="right">
            <FloatingLiveChat />
          </GlassPanel>
        </div>
      </div>

      {/* Mobile stacking (override grid to vertical) */}
      <style>{`
        @media (max-width: 1024px) {
          .profile-grid { display: flex !important; flex-direction: column; }
        }
      `}</style>
    </div>
  );
}