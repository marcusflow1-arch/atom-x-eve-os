import React from 'react';
import ProfileGameLibrary from '@/components/profile/ProfileGameLibrary';
import PersonalityCarousel from '@/components/profile/PersonalityCarousel';
import FloatingLiveChat from '@/components/profile/FloatingLiveChat';

export default function ProfileHub() {
  return (
    <div className="min-h-screen w-full p-4 md:p-8">
      {/* 10/70/20 layout using explicit column sizes to match spec */}
      <div
        className="w-full h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] grid gap-4"
        style={{ gridTemplateColumns: '10% 1fr 20%', gridTemplateRows: '1fr' }}
      >
        {/* Left 10% - Vertical Game Library (#23) */}
        <div className="h-full">
          <ProfileGameLibrary />
        </div>

        {/* Center 70% - Personality Carousel with Ripple Avatar (#22) and Dark Bio Layer (#24) */}
        <div className="h-full flex flex-col items-center">
          <PersonalityCarousel />
        </div>

        {/* Right 20% - Floating Live Chat (#27) */}
        <div className="h-full">
          <FloatingLiveChat />
        </div>
      </div>

      {/* Mobile stacking (override grid to vertical) */}
      <style>{`
        @media (max-width: 1024px) {
          .profile-grid-stack { display: flex; flex-direction: column; }
        }
      `}</style>
    </div>
  );
}