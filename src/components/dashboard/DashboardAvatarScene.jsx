import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
  const localFighter = (match?.players || []).find((player) => String(player.id || player.player_id) === String(user?.id));
  const opponentFighter = (match?.players || []).find((player) => String(player.id || player.player_id) !== String(user?.id));
  const localAppearance = localFighter?.appearance || { gender: localFighter?.gender || 'male' };
  const opponentAppearance = opponentFighter?.appearance || { gender: opponentFighter?.gender || 'male' };
  const opponentModelUrl = opponentFighter?.model_url || opponentAppearance?.model_url || (opponentFighter ? companionModel(opponentAppearance) : '');
  const faceoffSecondary = opponentModelUrl ? {
    modelUrl: opponentModelUrl,
    appearance: opponentAppearance,
    height: 1.72,
    offsetX: 0.95,
    parentOffsetX: -0.95,
    targetX: 0,
    cameraDistance: 5.15,
    yaw: -Math.PI / 2,
  } : null;

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

  const pvpFaceoffStage = dashboardPvP && localFighter && opponentFighter && faceoffSecondary ? (
    <div className="absolute inset-y-0 left-0" style={{ right: 'min(410px, 36vw)' }} aria-label="PvP face off">
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
        className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 text-center"
        initial={{ opacity: 0, scale: 0.72 }}
        animate={{ opacity: [0.55, 1, 0.7, 1], scale: [0.92, 1.08, 1, 1.04] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="text-[10px] font-black uppercase tracking-[0.48em] text-cyan-100/35">PvP</div>
        <div className="mt-1 bg-gradient-to-r from-white/45 via-cyan-100 to-white/45 bg-clip-text text-3xl font-black italic tracking-[0.18em] text-transparent drop-shadow-[0_0_18px_rgba(103,232,249,.38)]">VERSUS</div>
      </motion.div>
      <div className="pointer-events-none absolute bottom-[11%] left-[12%] text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">{localFighter?.name || 'You'}</div>
      <div className="pointer-events-none absolute bottom-[11%] right-[12%] text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">{opponentFighter?.name || 'Opponent'}</div>
    </div>
  ) : null;

  return (
    <>
      <EnvironmentHubStageLayer />
      {dashboardPvP ? pvpFaceoffStage : (arenaActive ? null : socialAvatarStage)}
      {(session.status === 'connecting' || session.error) && !arenaActive && !dashboardPvP && (
        <div role="status" className="absolute left-4 top-4 z-40 max-w-xs rounded-xl bg-slate-950/85 p-3 text-xs text-white/80">
          {session.error || 'Connecting to dashboard…'}
          {session.host_id !== user?.id && <button type="button" className="mt-2 block text-cyan-200" onClick={() => window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', { detail: { channelId: `dashboard_${user.id}`, hostId: user.id, hostName: 'My' } }))}>Return to my dashboard</button>}
        </div>
      )}
      <EnvironmentHubWorkspace />
    </>
  );
}