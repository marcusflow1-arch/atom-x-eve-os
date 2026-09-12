import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { useCompanionIdentity } from '@/components/onboarding/CompanionIdentityContext';
import GenesisModelPreview from '@/components/onboarding/GenesisModelPreview';

const FALLBACK_AVATAR = { gender: 'male', name: 'Player' };

export default function DashboardAvatarScene() {
  const { user } = useAuth();
  const localAvatar = useCompanionIdentity();
  const [socialHost, setSocialHost] = useState(null);
  const [hostAvatar, setHostAvatar] = useState(null);

  useEffect(() => {
    let requestId = 0;
    const handleJoin = async (event) => {
      const detail = event.detail || {};
      const hostId = detail.hostId;
      const isOwnDashboard = !hostId || String(hostId) === String(user?.id);
      if (!detail.socialJoin || isOwnDashboard) {
        setSocialHost(null);
        setHostAvatar(null);
        return;
      }

      const thisRequest = ++requestId;
      setSocialHost({ id: hostId, name: detail.hostName || 'Friend' });
      setHostAvatar(null);
      try {
        const rows = await base44.entities.Avatar.filter({ user_id: hostId });
        if (thisRequest !== requestId) return;
        const record = rows?.[0];
        setHostAvatar(record ? {
          ...record,
          gender: record.gender || 'male',
          name: record.name || detail.hostName || 'Friend',
        } : { ...FALLBACK_AVATAR, name: detail.hostName || 'Friend' });
      } catch (error) {
        if (thisRequest !== requestId) return;
        console.warn('Could not load dashboard host avatar; using fallback model.', error);
        setHostAvatar({ ...FALLBACK_AVATAR, name: detail.hostName || 'Friend' });
      }
    };

    window.addEventListener('joinMultiplayerChannel', handleJoin);
    return () => {
      requestId += 1;
      window.removeEventListener('joinMultiplayerChannel', handleJoin);
    };
  }, [user?.id]);

  if (!socialHost) {
    return <GenesisModelPreview config={localAvatar || FALLBACK_AVATAR} compact />;
  }

  return (
    <div
      className="absolute inset-y-0 left-0 flex items-stretch justify-center gap-0 overflow-visible"
      style={{ right: '338px' }}
      aria-label={`Shared dashboard with ${socialHost.name}`}
    >
      {/* The shared-avatar lane deliberately excludes the 338px AI Attribute
          box on the right and begins after the Library column supplied by the
          parent overview. Each model owns 34% of the remaining lane, placing
          the bodies directly beside one another without either sitting behind UI. */}
      <div className="relative h-full w-[34%] min-w-[180px] max-w-[420px] overflow-visible">
        <GenesisModelPreview config={hostAvatar || { ...FALLBACK_AVATAR, name: socialHost.name }} compact />
        <div className="pointer-events-none absolute bottom-[10%] left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/70 backdrop-blur-md">
          {socialHost.name}
        </div>
      </div>
      <div className="relative h-full w-[34%] min-w-[180px] max-w-[420px] overflow-visible">
        <GenesisModelPreview config={localAvatar || FALLBACK_AVATAR} compact />
        <div className="pointer-events-none absolute bottom-[10%] left-1/2 z-20 -translate-x-1/2 rounded-full border border-cyan-200/15 bg-black/35 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-cyan-100/80 backdrop-blur-md">
          You
        </div>
      </div>
    </div>
  );
}
