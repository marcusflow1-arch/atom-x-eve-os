import { useEffect, useState } from 'react';
import { useDashboardSession } from '@/components/social/dashboardSession';
import { useAuth } from '@/components/auth/AuthContext';
import GenesisModelPreview from '@/components/onboarding/GenesisModelPreview';
import PlayerAvatarPreview from '@/components/onboarding/PlayerAvatarPreview';
import EnvironmentHubWorkspace from '@/components/avatarHome/EnvironmentHubWorkspace';
import EnvironmentHubStageLayer from '@/components/avatarHome/EnvironmentHubStageLayer';
import { base44 } from '@/api/base44Client';
import {
  CREATOR_PARENTING_PREVIEW,
  canUseCreatorParentingPreview,
  findCreatorChildAnimation,
  findCreatorChildModel,
} from '@/components/parenting/parentingSystem';

const FALLBACK_AVATAR = { gender: 'male', name: 'Player' };
const CREATOR_CHILD = CREATOR_PARENTING_PREVIEW.children[0];

export default function DashboardAvatarScene({ focusMode: _focusMode = false }) {
  const { user } = useAuth();
  const session = useDashboardSession();
  const [creatorChild, setCreatorChild] = useState(null);

  const visitors = session.players.filter(p => p.player_id !== session.host_id);
  const host = session.players.find(p => p.player_id === session.host_id);
  const showCreatorDaughter = canUseCreatorParentingPreview(user);

  useEffect(() => {
    if (!showCreatorDaughter) {
      setCreatorChild(null);
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        const [models, animations] = await Promise.all([
          base44.entities.Model3D.filter({ id: CREATOR_CHILD.adminModelId }),
          base44.entities.AnimationFBX.filter({ name: CREATOR_CHILD.animationName }),
        ]);

        if (cancelled) return;

        const model = findCreatorChildModel(models, CREATOR_CHILD);
        const animation = findCreatorChildAnimation(animations, CREATOR_CHILD);

        if (!model?.file_url) {
          setCreatorChild(null);
          return;
        }

        setCreatorChild({
          modelUrl: model.file_url,
          animationUrl: animation?.file_url || null,
          animationName: animation?.name || CREATOR_CHILD.animationName,
          loop: animation?.is_loopable !== false,
          height: 1.24,
          offsetX: 0.94,
          parentOffsetX: -0.34,
          targetX: 0.24,
          cameraDistance: 4.3,
          yaw: 0,
        });
      } catch (error) {
        console.warn('Creator adaptive child assets unavailable', error);
        if (!cancelled) setCreatorChild(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showCreatorDaughter]);

  // Host stays on the right on every client. Guests occupy adjacent body lanes to the left.
  const roster = host ? [...visitors.slice().reverse(), host] : [];
  const avatarStage = roster.length > 1 ? (
    <div className="absolute inset-y-0 left-0 flex items-stretch justify-center" style={{right:'min(410px, 36vw)'}} aria-label="Shared dashboard">
      {roster.map(player => <div key={player.player_id} data-dashboard-player={player.player_id} className="relative h-full min-w-0 flex-1" style={{maxWidth:190}}>
        {player.player_id === user?.id
          ? <PlayerAvatarPreview controls="none" idleOnly secondaryCharacter={creatorChild} />
          : <GenesisModelPreview config={player.appearance || FALLBACK_AVATAR} compact controls="none" idleOnly />}
        <div className="pointer-events-none absolute bottom-[12%] inset-x-0 text-center text-[10px] text-white/80 truncate">{player.player_id === user?.id ? 'You' : player.display_name}</div>
      </div>)}
    </div>
  ) : <PlayerAvatarPreview controls="none" idleOnly secondaryCharacter={creatorChild} />;

  return (
    <>
      <EnvironmentHubStageLayer />
      {avatarStage}
      {(session.status === 'connecting' || session.error) && <div role="status" className="absolute left-4 top-4 z-40 max-w-xs rounded-xl bg-slate-950/85 p-3 text-xs text-white/80">
        {session.error || 'Connecting to dashboard…'}
        {session.host_id !== user?.id && <button type="button" className="mt-2 block text-cyan-200" onClick={() => window.dispatchEvent(new CustomEvent('joinMultiplayerChannel',{detail:{channelId:`dashboard_${user.id}`,hostId:user.id,hostName:'My'}}))}>Return to my dashboard</button>}
      </div>}
      <EnvironmentHubWorkspace />
    </>
  );
}
