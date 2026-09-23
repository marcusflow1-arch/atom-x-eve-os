import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDashboardSession } from '@/components/social/dashboardSession';
import { useAuth } from '@/components/auth/AuthContext';
import GenesisModelPreview from '@/components/onboarding/GenesisModelPreview';
import PlayerAvatarPreview from '@/components/onboarding/PlayerAvatarPreview';
import EnvironmentHubWorkspace from '@/components/avatarHome/EnvironmentHubWorkspace';
import EnvironmentHubStageLayer from '@/components/avatarHome/EnvironmentHubStageLayer';
import BattleSkillRail from '@/components/battle/BattleSkillRail';
import { base44 } from '@/api/base44Client';
import {
  CREATOR_PARENTING_PREVIEW,
  canUseCreatorParentingPreview,
  findCreatorChildAnimation,
  findCreatorChildModel,
} from '@/components/parenting/parentingSystem';

const FALLBACK_AVATAR = { gender: 'male', name: 'Player' };
const CREATOR_CHILD = CREATOR_PARENTING_PREVIEW.children[0];

const unwrapBattleStatus = (response) => {
  const body = response?.data ?? response ?? {};
  if (body?.error) throw new Error(body.error);
  return body;
};

export default function DashboardAvatarScene({ focusMode: _focusMode = false }) {
  const { user } = useAuth();
  const session = useDashboardSession();
  const [creatorChild, setCreatorChild] = useState(null);

  const { data: battleStatus } = useQuery({
    queryKey: ['ai-battle-matchmaking', user?.id],
    enabled: !!user?.id,
    queryFn: async () => unwrapBattleStatus(await base44.functions.invoke('aiBattleMatchmaker', { action: 'status', data: {} })),
    refetchInterval: (query) => query.state.data?.match?.status === 'matched' ? 2000 : 10000,
    refetchOnWindowFocus: true,
    retry: false,
    staleTime: 1000,
  });

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

  const battleMatch = battleStatus?.match || null;
  const battlePair = useMemo(() => {
    if (!battleMatch?.id || !['matched', 'ready'].includes(battleMatch.status) || !user?.id) return null;
    if (String(session.channel_id || '') !== String(battleMatch.dashboard_channel || '')) return null;

    const matchIds = (battleMatch.player_ids || []).map(String);
    if (matchIds.length !== 2 || !matchIds.includes(String(user.id))) return null;

    const playersById = new Map((session.players || []).map((player) => [String(player.player_id), player]));
    if (!matchIds.every((id) => playersById.has(id))) return null;

    const local = playersById.get(String(user.id));
    const opponentId = matchIds.find((id) => id !== String(user.id));
    const opponent = playersById.get(opponentId);
    return local && opponent ? { local, opponent } : null;
  }, [battleMatch?.id, battleMatch?.status, battleMatch?.dashboard_channel, battleMatch?.player_ids, session.channel_id, session.players, user?.id]);

  // Normal social dashboard layout. AI Battle replaces only this avatar staging,
  // never the Environment Hub or the surrounding Luna dashboard.
  const roster = host ? [...visitors.slice().reverse(), host] : [];
  const socialAvatarStage = roster.length > 1 ? (
    <div className="absolute inset-y-0 left-0 flex items-stretch justify-center" style={{ right: 'min(410px, 36vw)' }} aria-label="Shared dashboard">
      {roster.map(player => <div key={player.player_id} data-dashboard-player={player.player_id} className="relative h-full min-w-0 flex-1" style={{ maxWidth: 190 }}>
        {player.player_id === user?.id
          ? <PlayerAvatarPreview controls="none" idleOnly secondaryCharacter={creatorChild} skillEffects />
          : <GenesisModelPreview config={player.appearance || FALLBACK_AVATAR} compact controls="none" idleOnly />}
        <div className="pointer-events-none absolute bottom-[12%] inset-x-0 text-center text-[10px] text-white/80 truncate">{player.player_id === user?.id ? 'You' : player.display_name}</div>
      </div>)}
    </div>
  ) : <PlayerAvatarPreview controls="none" idleOnly secondaryCharacter={creatorChild} skillEffects />;

  // Battle staging is intentionally presentation-only for this milestone.
  // Every client renders itself in the Cloud-style foreground lane with its back
  // toward the camera, while the other matched player is framed farther away and
  // rotated back toward the local player. Because "local" is resolved per client,
  // the perspective automatically mirrors correctly on the opponent's screen.
  const battleAvatarStage = battlePair ? (
    <div
      className="pointer-events-none absolute inset-y-0 left-0 overflow-visible"
      style={{ right: 'min(410px, 36vw)' }}
      aria-label="AI Battle third-person staging"
      data-ai-battle-staging="third-person"
    >
      <BattleSkillRail />

      <div
        className="absolute bottom-[-5%] left-0 z-30 h-[105%] w-[52%] overflow-visible"
        style={{ transform: 'translate3d(-6%, 7%, 0)', transformOrigin: '42% 100%' }}
        data-ai-battle-player="local"
      >
        <PlayerAvatarPreview
          controls="none"
          idleOnly
          skillEffects
          initialYaw={Math.PI}
        />
      </div>

      <div
        className="absolute bottom-[16%] right-[13%] z-20 h-[68%] w-[41%] overflow-visible"
        style={{ transform: 'translate3d(0, -1%, 0) scale(0.95)', transformOrigin: '50% 100%' }}
        data-ai-battle-player="opponent"
      >
        <GenesisModelPreview
          config={battlePair.opponent.appearance || FALLBACK_AVATAR}
          compact
          controls="none"
          idleOnly
          initialYaw={0}
        />
      </div>
    </div>
  ) : null;

  return (
    <>
      <EnvironmentHubStageLayer />
      {battleAvatarStage || socialAvatarStage}
      {(session.status === 'connecting' || session.error) && <div role="status" className="absolute left-4 top-4 z-40 max-w-xs rounded-xl bg-slate-950/85 p-3 text-xs text-white/80">
        {session.error || 'Connecting to dashboard…'}
        {session.host_id !== user?.id && <button type="button" className="mt-2 block text-cyan-200" onClick={() => window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', { detail: { channelId: `dashboard_${user.id}`, hostId: user.id, hostName: 'My' } }))}>Return to my dashboard</button>}
      </div>}
      <EnvironmentHubWorkspace />
    </>
  );
}
