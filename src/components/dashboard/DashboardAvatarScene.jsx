import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { useCompanionIdentity } from '@/components/onboarding/CompanionIdentityContext';
import GenesisModelPreview from '@/components/onboarding/GenesisModelPreview';
import FriendsListContent from '@/components/dashboard/FriendsListContent';
import EnvironmentHubWorkspace from '@/components/avatarHome/EnvironmentHubWorkspace';
import EnvironmentHubStageLayer from '@/components/avatarHome/EnvironmentHubStageLayer';

const FALLBACK_AVATAR = { gender: 'male', name: 'Player' };

export default function DashboardAvatarScene() {
  const { user } = useAuth();
  const localAvatar = useCompanionIdentity();
  const [socialHost, setSocialHost] = useState(null);
  const [hostAvatar, setHostAvatar] = useState(null);
  const [remoteGuest, setRemoteGuest] = useState(null);
  const [remoteGuestAvatar, setRemoteGuestAvatar] = useState(null);
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

      // Joining from the Friends workspace should immediately return the user
      // to the dashboard stage so neither avatar is hidden behind that overlay.
      requestAnimationFrame(() => {
        const friendsControl = document.querySelector('[data-dashboard-quick-control][aria-label="Friends"]');
        if (friendsControl?.getAttribute('aria-pressed') === 'true') friendsControl.click();
      });

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

  // Owners of a dashboard receive the joined visitor through the existing real
  // multiplayer PlayerState stream. Mirror the newest visitor into this active
  // dashboard renderer so the host sees the same side-by-side social stage.
  useEffect(() => {
    const handlePlayers = (event) => {
      const players = (event.detail?.players || [])
        .filter((player) => player?.player_id && String(player.player_id) !== String(user?.id))
        .sort((a, b) => Number(b.last_update || 0) - Number(a.last_update || 0));
      setRemoteGuest(players[0] || null);
    };
    window.addEventListener('multiplayerPlayersUpdate', handlePlayers);
    return () => window.removeEventListener('multiplayerPlayersUpdate', handlePlayers);
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;
    const guestId = remoteGuest?.player_id;
    if (!guestId) {
      setRemoteGuestAvatar(null);
      return undefined;
    }
    (async () => {
      try {
        const rows = await base44.entities.Avatar.filter({ user_id: guestId });
        if (cancelled) return;
        const record = rows?.[0];
        setRemoteGuestAvatar(record ? {
          ...record,
          gender: record.gender || 'male',
          name: record.name || remoteGuest.display_name || 'Visitor',
        } : { ...FALLBACK_AVATAR, name: remoteGuest.display_name || 'Visitor' });
      } catch (error) {
        if (!cancelled) setRemoteGuestAvatar({ ...FALLBACK_AVATAR, name: remoteGuest.display_name || 'Visitor' });
      }
    })();
    return () => { cancelled = true; };
  }, [remoteGuest?.player_id, remoteGuest?.display_name]);

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

  const joinedElsewhere = Boolean(socialHost);
  const hostingVisitor = !joinedElsewhere && Boolean(remoteGuest);

  const pairedStage = (leftConfig, leftName, rightConfig, rightName, rightIsLocal = false) => (
    <div
      className="absolute inset-y-0 left-0 flex items-stretch justify-center overflow-visible"
      style={{ right: '338px' }}
      aria-label={`Shared dashboard with ${rightIsLocal ? leftName : rightName}`}
    >
      {/* DashboardAvatarOverview starts to the right of the Library at x=390.
          This lane additionally reserves the final 338px for AI Attributes.
          The two 150–190px pedestals touch edge-to-edge, which keeps avatar
          centerlines roughly one rendered body-width apart in the open lane. */}
      <div className="relative h-full w-[clamp(150px,14%,190px)] overflow-visible">
        <GenesisModelPreview config={leftConfig} compact />
        <div className="pointer-events-none absolute bottom-[10%] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/70 backdrop-blur-md">{leftName}</div>
      </div>
      <div className="relative h-full w-[clamp(150px,14%,190px)] overflow-visible">
        <GenesisModelPreview config={rightConfig} compact />
        <div className={`pointer-events-none absolute bottom-[10%] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border bg-black/35 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] backdrop-blur-md ${rightIsLocal ? 'border-cyan-200/15 text-cyan-100/80' : 'border-white/10 text-white/70'}`}>{rightName}</div>
      </div>
    </div>
  );

  let avatarStage = <GenesisModelPreview config={localAvatar || FALLBACK_AVATAR} compact />;
  if (joinedElsewhere) {
    avatarStage = pairedStage(
      hostAvatar || { ...FALLBACK_AVATAR, name: socialHost.name },
      socialHost.name,
      localAvatar || FALLBACK_AVATAR,
      'You',
      true
    );
  } else if (hostingVisitor) {
    avatarStage = pairedStage(
      localAvatar || FALLBACK_AVATAR,
      'You',
      remoteGuestAvatar || { ...FALLBACK_AVATAR, name: remoteGuest.display_name || 'Visitor' },
      remoteGuest.display_name || 'Visitor',
      false
    );
  }

  return (
    <>
      <EnvironmentHubStageLayer />
      {avatarStage}
      {friendsWorkspace && createPortal(
        <div className="relative z-10 h-full w-full p-4 md:p-5">
          <FriendsListContent />
        </div>,
        friendsWorkspace
      )}
      <EnvironmentHubWorkspace />
    </>
  );
}
