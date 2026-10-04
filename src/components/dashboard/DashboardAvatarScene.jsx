import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, UserPlus, X } from 'lucide-react';
import { useDashboardSession } from '@/components/social/dashboardSession';
import { useAuth } from '@/components/auth/AuthContext';
import GenesisModelPreview from '@/components/onboarding/GenesisModelPreview';
import PlayerAvatarPreview from '@/components/onboarding/PlayerAvatarPreview';
import EnvironmentHubWorkspace from '@/components/avatarHome/EnvironmentHubWorkspace';
import EnvironmentHubStageLayer from '@/components/avatarHome/EnvironmentHubStageLayer';
import { useAIBattleSnapshot } from '@/components/battle/useAIBattleQueue';
import { useAIBattleSurfaceState } from '@/components/battle/aiBattleSurfaceState';
import { companionModel } from '@/components/onboarding/genesisAssets';
import { base44 } from '@/api/base44Client';
import { CREATOR_PARENTING_PREVIEW, canUseCreatorParentingPreview, findCreatorChildAnimation, findCreatorChildModel } from '@/components/parenting/parentingSystem';

const FALLBACK_AVATAR = { gender: 'male', name: 'Player' };
const CREATOR_CHILD = CREATOR_PARENTING_PREVIEW.children[0];

export default function DashboardAvatarScene({ focusMode: _focusMode = false }) {
  const { user } = useAuth();
  const session = useDashboardSession();
  const [creatorChild, setCreatorChild] = useState(null);
  const [postMatchAction, setPostMatchAction] = useState({ friend: '', rematch: '' });

  // The PvP arena is owned by AIBattleHost at the page root so dashboard panel
  // changes can never unmount a live match. This scene only steps aside while
  // the arena is up, so two WebGL avatar stages do not render underneath it.
  const { arenaActive, match, isParticipant } = useAIBattleSnapshot();
  const battleSurface = useAIBattleSurfaceState();
  const matchStatus = String(match?.status || '');
  const dashboardPvP = Boolean(
    isParticipant
    && ['connecting', 'countdown', 'fighting'].includes(matchStatus)
    && battleSurface.dashboardMode
    && String(battleSurface.matchId || '') === String(match?.id || '')
  );

  const visitors = session.players.filter((p) => p.player_id !== session.host_id);
  const host = session.players.find((p) => p.player_id === session.host_id);
  const showCreatorDaughter = canUseCreatorParentingPreview(user);

  useEffect(() => {
    if (!showCreatorDaughter) { setCreatorChild(null); return undefined; }
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
        if (!model?.file_url) { setCreatorChild(null); return; }
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
    return () => { cancelled = true; };
  }, [showCreatorDaughter]);

  const roster = host ? [...visitors.slice().reverse(), host] : [];
  const postMatch = battleSurface.postMatch;
  const liveLocalFighter = (match?.players || []).find((player) => String(player.id || player.player_id) === String(user?.id));
  const liveOpponentFighter = (match?.players || []).find((player) => String(player.id || player.player_id) !== String(user?.id));
  const resultLocalFighter = (postMatch?.players || []).find((player) => String(player.id || player.player_id) === String(user?.id));
  const resultOpponentFighter = (postMatch?.players || []).find((player) => String(player.id || player.player_id) !== String(user?.id));
  const showingPostMatch = Boolean(!dashboardPvP && postMatch?.matchId && resultLocalFighter && resultOpponentFighter);
  const localFighter = dashboardPvP ? liveLocalFighter : resultLocalFighter;
  const opponentFighter = dashboardPvP ? liveOpponentFighter : resultOpponentFighter;
  const localAppearance = localFighter?.appearance || { gender: localFighter?.gender || 'male' };
  const opponentAppearance = opponentFighter?.appearance || { gender: opponentFighter?.gender || 'male' };
  const opponentModelUrl = opponentFighter?.model_url || opponentAppearance?.model_url || (opponentFighter ? companionModel(opponentAppearance) : '');
  const faceoffSecondary = opponentModelUrl ? {
    modelUrl: opponentModelUrl,
    appearance: opponentAppearance,
    // Both fighters use the same presentation height and share one camera.
    // This is intentionally a single Three.js composition, not two viewers.
    height: 1.8,
    offsetX: 1.15,
    parentOffsetX: -1.15,
    targetX: 0,
    cameraDistance: 5.6,
    yaw: -Math.PI / 2,
  } : null;

  useEffect(() => {
    setPostMatchAction({ friend: '', rematch: '' });
  }, [postMatch?.matchId]);

  const addPostMatchFriend = async () => {
    const opponentId = String(opponentFighter?.id || opponentFighter?.player_id || '');
    if (!opponentId || postMatchAction.friend === 'sending') return;
    setPostMatchAction((state) => ({ ...state, friend: 'sending' }));
    try {
      const response = await base44.functions.invoke('socialActions', { action: 'send_friend_request', data: { target_user_id: opponentId } });
      const body = response?.data ?? response ?? {};
      if (body?.error) throw new Error(body.error);
      setPostMatchAction((state) => ({ ...state, friend: body.accepted || body.already_friends ? 'friends' : 'sent' }));
    } catch (error) {
      console.warn('[PvP post match] friend request failed', error);
      setPostMatchAction((state) => ({ ...state, friend: 'error' }));
    }
  };

  const requestPostMatchRematch = () => {
    const opponentId = String(opponentFighter?.id || opponentFighter?.player_id || '');
    if (!opponentId || postMatchAction.rematch === 'queued') return;
    setPostMatchAction((state) => ({ ...state, rematch: 'queued' }));
    window.dispatchEvent(new CustomEvent('lunaAIBattleRematchRequest', { detail: { opponentId, previousMatchId: postMatch?.matchId || '' } }));
  };

  const socialAvatarStage = roster.length > 1 ? (
    <div className="absolute inset-y-0 left-0 flex items-stretch justify-center" style={{ right: 'min(410px, 36vw)' }} aria-label="Shared dashboard">
      {roster.map((player) => (
        <div key={player.player_id} data-dashboard-player={player.player_id} className="relative h-full min-w-0 flex-1" style={{ maxWidth: 190 }}>
          {player.player_id === user?.id
            ? <PlayerAvatarPreview controls="none" idleOnly secondaryCharacter={creatorChild} skillEffects />
            : <GenesisModelPreview config={player.appearance || FALLBACK_AVATAR} compact controls="none" idleOnly />}
          <div className="pointer-events-none absolute bottom-[12%] inset-x-0 text-center text-[10px] text-white/80 truncate">{player.player_id === user?.id ? 'You' : player.display_name}</div>
        </div>
      ))}
    </div>
  ) : <PlayerAvatarPreview controls="none" idleOnly secondaryCharacter={creatorChild} skillEffects />;

  const pvpFaceoffStage = (dashboardPvP || showingPostMatch) && localFighter && opponentFighter && faceoffSecondary ? (
    <div className="absolute inset-y-0 left-0" style={{ right: 'min(410px, 36vw)' }} aria-label={showingPostMatch ? 'PvP post match face off' : 'PvP face off'}>
      <div className="absolute inset-0">
        <PlayerAvatarPreview
          config={localAppearance}
          controls="none"
          idleOnly
          secondaryCharacter={faceoffSecondary}
          initialYaw={Math.PI / 2}
        />
      </div>
      <motion.div
        className="pointer-events-none absolute left-1/2 top-[48%] z-30 -translate-x-1/2 -translate-y-1/2 text-center"
        initial={{ opacity: 0, scale: 0.72 }}
        animate={{ opacity: [0.55, 1, 0.7, 1], scale: [0.92, 1.08, 1, 1.04] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="text-[10px] font-black uppercase tracking-[0.48em] text-cyan-100/35">{showingPostMatch ? (String(postMatch?.winnerId) === String(user?.id) ? 'Victory' : 'Match Complete') : 'PvP'}</div>
        <div className="mt-1 bg-gradient-to-r from-white/45 via-cyan-100 to-white/45 bg-clip-text text-3xl font-black italic tracking-[0.18em] text-transparent drop-shadow-[0_0_18px_rgba(103,232,249,.38)]">VERSUS</div>
      </motion.div>
      <div className="pointer-events-none absolute bottom-[13%] left-[15%] text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">{localFighter?.name || 'You'}</div>
      <div className="pointer-events-none absolute bottom-[13%] right-[15%] text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">{opponentFighter?.name || 'Opponent'}</div>

      {showingPostMatch && (
        <div className="absolute bottom-[5.5%] left-1/2 z-40 flex -translate-x-1/2 items-center gap-2">
          <button type="button" onClick={addPostMatchFriend} disabled={postMatchAction.friend === 'sending' || postMatchAction.friend === 'sent' || postMatchAction.friend === 'friends'} className="flex items-center gap-2 border border-white/12 bg-slate-950/78 px-4 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-white/75 backdrop-blur-xl transition hover:bg-white/[0.08] disabled:opacity-50">
            <UserPlus className="h-3.5 w-3.5 text-cyan-200" />
            {postMatchAction.friend === 'sending' ? 'Sending…' : postMatchAction.friend === 'sent' ? 'Request Sent' : postMatchAction.friend === 'friends' ? 'Friends' : postMatchAction.friend === 'error' ? 'Retry Friend' : 'Add Friend'}
          </button>
          <button type="button" onClick={requestPostMatchRematch} disabled={postMatchAction.rematch === 'queued'} className="flex items-center gap-2 border border-cyan-100/22 bg-cyan-200/[0.10] px-4 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-cyan-100 backdrop-blur-xl transition hover:bg-cyan-200/[0.16] disabled:opacity-50">
            <RotateCcw className="h-3.5 w-3.5" />
            {postMatchAction.rematch === 'queued' ? 'Rematch Queued' : 'Rematch'}
          </button>
          <button type="button" aria-label="Close post-match face off" onClick={() => window.dispatchEvent(new Event('lunaAIBattlePostMatchDismiss'))} className="grid h-8 w-8 place-items-center border border-white/10 bg-slate-950/70 text-white/45 backdrop-blur-xl hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
      <EnvironmentHubStageLayer />
      {(dashboardPvP || showingPostMatch) ? pvpFaceoffStage : (arenaActive ? null : socialAvatarStage)}
      {(session.status === 'connecting' || session.error) && !arenaActive && !dashboardPvP && !showingPostMatch && (
        <div role="status" className="absolute left-4 top-4 z-40 max-w-xs rounded-xl bg-slate-950/85 p-3 text-xs text-white/80">
          {session.error || 'Connecting to dashboard…'}
          {session.host_id !== user?.id && <button type="button" className="mt-2 block text-cyan-200" onClick={() => window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', { detail: { channelId: `dashboard_${user.id}`, hostId: user.id, hostName: 'My' } }))}>Return to my dashboard</button>}
        </div>
      )}
      <EnvironmentHubWorkspace />
    </>
  );
}