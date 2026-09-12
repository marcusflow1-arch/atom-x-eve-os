import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { useCompanionIdentity } from '@/components/onboarding/CompanionIdentityContext';
import GenesisModelPreview from '@/components/onboarding/GenesisModelPreview';
import FriendsListContent from '@/components/dashboard/FriendsListContent';

const FALLBACK_AVATAR = { gender: 'male', name: 'Player' };

export default function DashboardAvatarScene() {
  const { user } = useAuth();
  const localAvatar = useCompanionIdentity();
  const [socialHost, setSocialHost] = useState(null);
  const [hostAvatar, setHostAvatar] = useState(null);
  const [friendsWorkspace, setFriendsWorkspace] = useState(null);

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

  // The Friends quick-control workspace is owned by DashboardAvatarOverview.
  // Portal the live Friends/Global Online browser into that existing glass
  // surface so clicking the Friends quick control opens the real social UI.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const resolveWorkspace = () => {
      const node = document.querySelector('[aria-label="friends workspace"]');
      setFriendsWorkspace((current) => current === node ? current : node);
    };
    resolveWorkspace();
    const observer = new MutationObserver(resolveWorkspace);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const avatarStage = !socialHost ? (
    <GenesisModelPreview config={localAvatar || FALLBACK_AVATAR} compact />
  ) : (
    <div
      className="absolute inset-y-0 left-0 flex items-stretch justify-center overflow-visible"
      style={{ right: '338px' }}
      aria-label={`Shared dashboard with ${socialHost.name}`}
    >
      {/* DashboardAvatarOverview already starts to the right of the Library at
          x=390. This lane additionally reserves the final 338px for AI
          Attributes. The two narrow model pedestals sit directly together in
          the remaining open lane so their centerlines are approximately one
          rendered body-width apart, never under either UI surface. */}
      <div className="relative h-full w-[clamp(150px,14%,190px)] overflow-visible">
        <GenesisModelPreview config={hostAvatar || { ...FALLBACK_AVATAR, name: socialHost.name }} compact />
        <div className="pointer-events-none absolute bottom-[10%] left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/70 backdrop-blur-md">
          {socialHost.name}
        </div>
      </div>
      <div className="relative h-full w-[clamp(150px,14%,190px)] overflow-visible">
        <GenesisModelPreview config={localAvatar || FALLBACK_AVATAR} compact />
        <div className="pointer-events-none absolute bottom-[10%] left-1/2 z-20 -translate-x-1/2 rounded-full border border-cyan-200/15 bg-black/35 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-cyan-100/80 backdrop-blur-md">
          You
        </div>
      </div>
    </div>
  );

  return (
    <>
      {avatarStage}
      {friendsWorkspace && createPortal(
        <div className="relative z-10 h-full w-full p-4 md:p-5">
          <FriendsListContent />
        </div>,
        friendsWorkspace
      )}
    </>
  );
}
