import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDashboardSession } from '@/components/social/dashboardSession';
import { useAuth } from '@/components/auth/AuthContext';
import GenesisModelPreview from '@/components/onboarding/GenesisModelPreview';
import PlayerAvatarPreview from '@/components/onboarding/PlayerAvatarPreview';
import FriendsListContent from '@/components/dashboard/FriendsListContent';
import MessengerHub from '@/components/friends/MessengerHub';
import EnvironmentHubWorkspace from '@/components/avatarHome/EnvironmentHubWorkspace';
import EnvironmentHubStageLayer from '@/components/avatarHome/EnvironmentHubStageLayer';
import AdminParentingChild from '@/components/dashboard/AdminParentingChild';
import { canUseCreatorParentingPreview } from '@/components/parenting/parentingSystem';

const FALLBACK_AVATAR = { gender: 'male', name: 'Player' };

export default function DashboardAvatarScene({ focusMode: _focusMode = false }) {
  const { user } = useAuth();
  const session = useDashboardSession();
  const [friendsWorkspace, setFriendsWorkspace] = useState(null);
  const [messagesWorkspace, setMessagesWorkspace] = useState(null);

  // The Friends quick-control workspace is owned by DashboardAvatarOverview.
  // Portal the live Friends/Global Online browser into that existing glass
  // surface so clicking the Friends quick control opens the real social UI.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const resolveWorkspace = () => {
      const node = document.querySelector('[aria-label="friends workspace"]');
      const messageNode = document.querySelector('[aria-label="messages workspace"]');
      setFriendsWorkspace((current) => current === node ? current : node);
      setMessagesWorkspace((current) => current === messageNode ? current : messageNode);
    };
    resolveWorkspace();
    const observer = new MutationObserver(resolveWorkspace);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const visitors = session.players.filter(p => p.player_id !== session.host_id);
  const host = session.players.find(p => p.player_id === session.host_id);
  const showCreatorDaughter = canUseCreatorParentingPreview(user);
  // Host stays on the right on every client. Guests occupy adjacent body lanes to the left.
  const roster = host ? [...visitors.slice().reverse(), host] : [];
  const avatarStage = roster.length > 1 ? (
    <div className="absolute inset-y-0 left-0 flex items-stretch justify-center" style={{right:'min(410px, 36vw)'}} aria-label="Shared dashboard">
      {roster.map(player => <div key={player.player_id} data-dashboard-player={player.player_id} className="relative h-full min-w-0 flex-1" style={{maxWidth:190}}>
        {player.player_id === user?.id
          ? <PlayerAvatarPreview controls="none" idleOnly />
          : <GenesisModelPreview config={player.appearance || FALLBACK_AVATAR} compact controls="none" idleOnly />}
        <div className="pointer-events-none absolute bottom-[12%] inset-x-0 text-center text-[10px] text-white/80 truncate">{player.player_id === user?.id ? 'You' : player.display_name}</div>
      </div>)}
    </div>
  ) : <PlayerAvatarPreview controls="none" idleOnly />;

  return (
    <>
      <EnvironmentHubStageLayer />
      {avatarStage}
      <AdminParentingChild enabled={showCreatorDaughter} />
      {friendsWorkspace && createPortal(
        <div className="relative z-10 h-full w-full p-4 md:p-5">
          <FriendsListContent />
        </div>,
        friendsWorkspace
      )}
      {messagesWorkspace && createPortal(
        <div className="relative z-10 h-full w-full overflow-hidden">
          <MessengerHub />
        </div>,
        messagesWorkspace
      )}
      <EnvironmentHubWorkspace />
    </>
  );
}
