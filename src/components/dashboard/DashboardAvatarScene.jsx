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
const DEFAULT_BATTLE_HP = 1000;
const GETSUGA_DAMAGE = 50;

const unwrapBattleStatus = (response) => {
  const body = response?.data ?? response ?? {};
  if (body?.error) throw new Error(body.error);
  return body;
};

const finitePositive = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export default function DashboardAvatarScene({ focusMode: _focusMode = false }) {
  const { user } = useAuth();
  const session = useDashboardSession();
  const [creatorChild, setCreatorChild] = useState(null);
  const [battleOpponentHp, setBattleOpponentHp] = useState(DEFAULT_BATTLE_HP);
  const [battleLocalHp, setBattleLocalHp] = useState(DEFAULT_BATTLE_HP);
  const [battleTurnOwner, setBattleTurnOwner] = useState('opponent'); // local | resolving | opponent
  const [battleCameraMode, setBattleCameraMode] = useState('wide'); // selection | wide

  const { data: battleStatus } = useQuery({
    queryKey: ['ai-battle-matchmaking', user?.id],
    enabled: !!user?.id,
    queryFn: async () => unwrapBattleStatus(await base44.functions.invoke('aiBattleMatchmaker', { action: 'status', data: {} })),
    refetchInterval: (query) => {
      const status = query.state.data?.match?.status;
      if (status === 'ready') return 3000;
      if (status === 'matched') return 5000;
      return 30000;
    },
    refetchOnWindowFocus: true,
    retry: false,
    staleTime: 1500,
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

  const opponentMaxHp = finitePositive(
    battlePair?.opponent?.max_hp ?? battlePair?.opponent?.maxHp ?? battleMatch?.opponent_max_hp,
    DEFAULT_BATTLE_HP,
  );
  const opponentStartingHp = Math.min(
    opponentMaxHp,
    Math.max(0, Number(battlePair?.opponent?.hp ?? battleMatch?.opponent_hp ?? opponentMaxHp) || opponentMaxHp),
  );
  const localMaxHp = finitePositive(
    battlePair?.local?.max_hp ?? battlePair?.local?.maxHp ?? battleMatch?.local_max_hp,
    DEFAULT_BATTLE_HP,
  );
  const localStartingHp = Math.min(
    localMaxHp,
    Math.max(0, Number(battlePair?.local?.hp ?? battleMatch?.local_hp ?? localMaxHp) || localMaxHp),
  );

  useEffect(() => {
    if (!battlePair?.opponent) {
      setBattleOpponentHp(DEFAULT_BATTLE_HP);
      return;
    }
    setBattleOpponentHp(opponentStartingHp);
    // Reset prototype combat HP only when the match/opponent changes. Polling
    // must not refill HP after a local hit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleMatch?.id, battlePair?.opponent?.player_id, opponentMaxHp]);

  useEffect(() => {
    if (!battlePair?.local) {
      setBattleLocalHp(DEFAULT_BATTLE_HP);
      return;
    }
    setBattleLocalHp(localStartingHp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleMatch?.id, battlePair?.local?.player_id, localMaxHp]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (!battlePair?.opponent) {
      delete window.__lunaAIBattleTarget;
      return undefined;
    }

    const target = {
      type: 'player',
      playerId: String(battlePair.opponent.player_id),
      displayName: battlePair.opponent.display_name || 'Opponent',
      // The Getsuga package travels along its authored +Z axis. With the battle
      // camera looking down -Z, +90° yaw sends the cast screen-right from the
      // local player directly toward the opponent staging area.
      facingYaw: Math.PI / 2,
      screenAnchor: { x: 0.69, y: 0.46 },
      autoLock: true,
      autoHit: true,
      damage: GETSUGA_DAMAGE,
    };
    window.__lunaAIBattleTarget = target;
    window.dispatchEvent(new CustomEvent('lunaAIBattleTargetChanged', { detail: target }));

    return () => {
      if (window.__lunaAIBattleTarget?.playerId === target.playerId) delete window.__lunaAIBattleTarget;
    };
  }, [battlePair?.opponent?.player_id, battlePair?.opponent?.display_name]);

  // PvP camera/turn presentation. No world/player positions are moved here.
  // Only the local visual camera presentation changes: on the player's turn the
  // opponent is shown straight-on with the five equipped cards at chest/hand
  // height; once a card is committed we cut back to the existing wide duel view.
  useEffect(() => {
    if (typeof window === 'undefined' || !battlePair?.opponent || !user?.id || !battleMatch?.id) return undefined;

    const localId = String(user.id);
    const opponentId = String(battlePair.opponent.player_id);
    const isPvp = !battleMatch?.mode || battleMatch.mode === 'pvp';
    if (!isPvp) return undefined;

    const setTurn = (owner, phase) => {
      const isLocal = owner === 'local';
      setBattleTurnOwner(owner);
      setBattleCameraMode(isLocal ? 'selection' : 'wide');
      window.__lunaAIBattleTurn = {
        matchId: String(battleMatch.id),
        actorId: isLocal ? localId : owner === 'opponent' ? opponentId : null,
        revision: Number(battleMatch.turn_revision || 0),
        phase: phase || (isLocal ? 'select' : owner === 'opponent' ? 'wait' : 'resolve'),
        canLocalAct: isLocal,
      };
      window.dispatchEvent(new CustomEvent('lunaAIBattleTurnVisualChanged', {
        detail: { ...window.__lunaAIBattleTurn, cameraMode: isLocal ? 'selection' : 'wide' },
      }));
    };

    // The backend now persists the turn owner. Host-first remains a compatibility
    // fallback for older in-flight matches created before current_turn_id existed.
    const authoritativeActorId = String(battleMatch.current_turn_id || battleMatch.host_id || '');
    const localOwnsTurn = authoritativeActorId === localId;
    setTurn(localOwnsTurn ? 'local' : 'opponent', localOwnsTurn ? 'select' : 'wait');

    const onTurnChanged = (event) => {
      const detail = event?.detail || {};
      if (detail.matchId && String(detail.matchId) !== String(battleMatch.id)) return;
      const actorId = String(detail.actorId || detail.playerId || detail.currentPlayerId || '');
      if (!actorId) return;
      setTurn(actorId === localId ? 'local' : 'opponent', actorId === localId ? 'select' : 'wait');
    };

    const onCardCommitted = (event) => {
      const detail = event?.detail || {};
      const targetId = String(detail.target?.playerId || window.__lunaAIBattleTarget?.playerId || '');
      if (targetId !== opponentId || window.__lunaAIBattleTurn?.canLocalAct === false) return;
      setTurn('resolving', 'resolve');
    };

    const advanceTurn = async () => {
      try {
        const body = unwrapBattleStatus(await base44.functions.invoke('aiBattleMatchmaker', {
          action: 'end_turn',
          data: {
            match_id: battleMatch.id,
            expected_revision: Number(battleMatch.turn_revision || 0),
          },
        }));
        const nextActorId = String(body?.match?.current_turn_id || body?.current_turn_id || '');
        if (nextActorId) {
          window.dispatchEvent(new CustomEvent('lunaAIBattleTurnChanged', {
            detail: {
              matchId: String(battleMatch.id),
              actorId: nextActorId,
              revision: Number(body?.match?.turn_revision || 0),
            },
          }));
        }
      } catch (error) {
        // A stale revision simply means the server already advanced the turn.
        // Polling will reconcile the visual camera with the authoritative match.
        console.warn('[AI Battle] turn advance will reconcile from match status', error);
      }
    };

    const onEffectEvent = (event) => {
      const detail = event?.detail || {};
      if (detail.name !== 'end') return;
      const targetId = String(detail.target?.playerId || '');

      // Local attack ended: cut stays wide while the turn is atomically passed
      // to the opponent on the shared matchmaking record.
      if (targetId === opponentId) {
        setTurn('opponent', 'wait');
        advanceTurn();
        return;
      }

      // Synced remote effects can return the camera immediately. If the remote
      // visual is not streamed, the 3-second match poll performs the same switch.
      if (targetId === localId) setTurn('local', 'select');
    };

    window.addEventListener('lunaAIBattleTurnChanged', onTurnChanged);
    window.addEventListener('lunaCardAnimationEffectProc', onCardCommitted);
    window.addEventListener('lunaCardAnimationEffectEvent', onEffectEvent);
    return () => {
      window.removeEventListener('lunaAIBattleTurnChanged', onTurnChanged);
      window.removeEventListener('lunaCardAnimationEffectProc', onCardCommitted);
      window.removeEventListener('lunaCardAnimationEffectEvent', onEffectEvent);
      if (window.__lunaAIBattleTurn?.matchId === String(battleMatch.id)) delete window.__lunaAIBattleTurn;
    };
  }, [
    battleMatch?.id,
    battleMatch?.mode,
    battleMatch?.host_id,
    battleMatch?.current_turn_id,
    battleMatch?.turn_revision,
    battlePair?.opponent?.player_id,
    user?.id,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined' || !battlePair?.opponent?.player_id) return undefined;
    const opponentId = String(battlePair.opponent.player_id);

    const applyLockedHit = (event) => {
      const detail = event?.detail || {};
      const effectId = String(detail.effectId || '').toLowerCase();
      const isBoundPlayerAttack = effectId === 'getsuga_tensho' || effectId.startsWith('artemis_');
      if (!isBoundPlayerAttack) return;
      if (detail.name !== 'impact' || detail.autoHit === false) return;

      // The target is captured when the card is cast. A Final Fantasy / Pokemon
      // style locked attack does not miss because the visual wave drifted a few
      // pixels; the impact marker resolves against that locked combat target.
      const targetId = String(detail.target?.playerId || window.__lunaAIBattleTarget?.playerId || '');
      if (targetId !== opponentId) return;

      const requestedDamage = Number(detail.damage ?? detail.target?.damage ?? GETSUGA_DAMAGE);
      const damage = Number.isFinite(requestedDamage) && requestedDamage > 0 ? requestedDamage : GETSUGA_DAMAGE;
      setBattleOpponentHp((current) => Math.max(0, Number(current || 0) - damage));

      window.dispatchEvent(new CustomEvent('lunaAIBattleDamageApplied', {
        detail: {
          effectId,
          sourcePlayerId: String(user?.id || ''),
          targetPlayerId: opponentId,
          damage,
          autoHit: true,
          matchId: battleMatch?.id || null,
        },
      }));
    };

    window.addEventListener('lunaCardAnimationEffectEvent', applyLockedHit);
    return () => window.removeEventListener('lunaCardAnimationEffectEvent', applyLockedHit);
  }, [battleMatch?.id, battlePair?.opponent?.player_id, user?.id]);

  useEffect(() => {
    if (typeof window === 'undefined' || !user?.id) return undefined;
    const localId = String(user.id);
    const applyIncomingDamage = (event) => {
      const detail = event?.detail || {};
      if (String(detail.targetPlayerId || '') !== localId) return;
      if (String(detail.sourcePlayerId || '') === localId) return;
      const damage = Math.max(0, Number(detail.damage) || 0);
      if (!damage) return;
      setBattleLocalHp((current) => Math.max(0, Number(current || 0) - damage));
    };
    window.addEventListener('lunaAIBattleDamageApplied', applyIncomingDamage);
    return () => window.removeEventListener('lunaAIBattleDamageApplied', applyIncomingDamage);
  }, [user?.id]);

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

  const opponentHp = Math.min(opponentMaxHp, Math.max(0, Number(battleOpponentHp) || 0));
  const opponentHpPct = opponentMaxHp > 0 ? (opponentHp / opponentMaxHp) * 100 : 0;
  const localHp = Math.min(localMaxHp, Math.max(0, Number(battleLocalHp) || 0));

  const battleAvatarStage = battlePair ? (
    <div
      className="pointer-events-none absolute inset-y-0 left-0 overflow-visible"
      style={{ right: 'min(410px, 36vw)' }}
      aria-label="AI Battle turn-based staging"
      data-ai-battle-staging="turn-based"
      data-ai-battle-camera={battleCameraMode}
      data-ai-battle-turn={battleTurnOwner}
    >
      <style>{`[data-ai-battle-effect-surface] canvas{background:transparent!important}`}</style>

      {/*
        Keep the wide runtime mounted at all times. During card selection it is
        merely transparent, so the player's Three.js skill listener remains live.
        The moment a card is committed, this layer becomes visible and the cast
        can begin without losing the animation event during a React remount.
      */}
      <div
        className={`absolute inset-0 transition-[opacity,transform] duration-300 ease-out ${battleCameraMode === 'wide' ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.025]'}`}
        aria-hidden={battleCameraMode !== 'wide'}
        data-ai-battle-camera-view="wide"
      >
        <BattleSkillRail
          presentation="overhead"
          hp={localHp}
          maxHp={localMaxHp}
          playerName={battlePair.local.display_name || 'You'}
          selectable={battleTurnOwner === 'local'}
        />

        <div
          className="absolute bottom-[-5%] left-0 z-30 h-[105%] w-[132%] overflow-visible bg-transparent"
          style={{ transform: 'translate3d(-24%, 7%, 0)', transformOrigin: '50% 100%' }}
          data-ai-battle-player="local"
          data-ai-battle-effect-surface="true"
        >
          <PlayerAvatarPreview
            controls="none"
            idleOnly={false}
            skillEffects
            combatMovement
            combatCamera
            movementRadius={10}
            initialYaw={Math.PI / 2}
          />
        </div>

        <div
          className="absolute bottom-[16%] right-[13%] z-20 h-[68%] w-[41%] overflow-visible bg-transparent"
          style={{ transform: 'translate3d(0, -1%, 0) scale(0.95)', transformOrigin: '50% 100%' }}
          data-ai-battle-player="opponent"
        >
          <div
            className="absolute left-1/2 top-[1%] z-50 w-[220px] -translate-x-1/2 text-center"
            data-ai-battle-enemy-hp="true"
            aria-label={`${battlePair.opponent.display_name || 'Opponent'} health ${Math.round(opponentHp)} of ${Math.round(opponentMaxHp)}`}
          >
            <div className="mb-1 truncate text-[9px] font-black uppercase tracking-[0.12em] text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,.8)]">
              {battlePair.opponent.display_name || 'Opponent'}
            </div>
            <div className="h-[13px] overflow-hidden rounded-full border border-white/15 bg-slate-950/80 p-[2px] shadow-[0_6px_20px_rgba(0,0,0,.45)] backdrop-blur-md">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 via-red-400 to-orange-300 transition-[width] duration-300"
                style={{ width: `${opponentHpPct}%` }}
              />
            </div>
            <div className="mt-1 text-[9px] font-semibold tabular-nums text-white/85 drop-shadow-[0_2px_8px_rgba(0,0,0,.8)]">
              {Math.round(opponentHp)} / {Math.round(opponentMaxHp)} HP · {Math.round(opponentHpPct)}%
            </div>
          </div>

          <GenesisModelPreview
            config={battlePair.opponent.appearance || FALLBACK_AVATAR}
            compact
            controls="none"
            idleOnly
            skillEffects
            remoteSkillPlayerId={String(battlePair.opponent.player_id)}
            remoteFacingYaw={-Math.PI / 2}
            initialYaw={-Math.PI / 2}
          />
        </div>

        {battleTurnOwner === 'opponent' && (
          <div className="absolute left-1/2 top-[7%] z-60 -translate-x-1/2 text-[8px] font-black uppercase tracking-[0.22em] text-white/45">
            Opponent Turn
          </div>
        )}
      </div>

      {/*
        Cinematic card-selection camera. This does NOT move either gameplay
        character. It is a straight-on visual copy of the opponent so the local
        player sees their face directly, with the four cards floating tightly at
        chest/hand height like a first-person Duel Monsters hand.
      */}
      {battleCameraMode === 'selection' && battleTurnOwner === 'local' && (
        <div
          className="absolute inset-0 z-[65] overflow-visible opacity-100 transition-opacity duration-300"
          data-ai-battle-camera-view="selection"
          aria-label="Your turn card-selection camera"
        >
          <div className="absolute inset-x-[17%] bottom-[-2%] top-[-4%] z-10 overflow-visible bg-transparent">
            <GenesisModelPreview
              config={battlePair.opponent.appearance || FALLBACK_AVATAR}
              compact
              controls="none"
              idleOnly
              initialYaw={0}
            />
          </div>

          <div className="absolute left-1/2 top-[5.5%] z-70 w-[230px] -translate-x-1/2 text-center">
            <div className="mb-1 truncate text-[9px] font-black uppercase tracking-[0.14em] text-white/92 drop-shadow-[0_2px_8px_rgba(0,0,0,.8)]">
              {battlePair.opponent.display_name || 'Opponent'}
            </div>
            <div className="h-[13px] overflow-hidden rounded-full border border-white/15 bg-slate-950/80 p-[2px] shadow-[0_6px_20px_rgba(0,0,0,.45)] backdrop-blur-md">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 via-red-400 to-orange-300 transition-[width] duration-300"
                style={{ width: `${opponentHpPct}%` }}
              />
            </div>
            <div className="mt-1 text-[9px] font-semibold tabular-nums text-white/85 drop-shadow-[0_2px_8px_rgba(0,0,0,.8)]">
              {Math.round(opponentHp)} / {Math.round(opponentMaxHp)} HP · {Math.round(opponentHpPct)}%
            </div>
          </div>

          <BattleSkillRail
            presentation="hand"
            hp={localHp}
            maxHp={localMaxHp}
            playerName={battlePair.local.display_name || 'You'}
            selectable
          />
        </div>
      )}
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
