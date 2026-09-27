import { useEffect } from 'react';
import useAIBattleQueue from '@/components/battle/useAIBattleQueue';
import { startLoopSound, stopLoopSound } from '@/components/game3d/combatAudioStore';

// Keep matchmaking hooks independent of the environment presentation lifecycle.
export default function AIBattleSessionBridge() {
  const { queue, match } = useAIBattleQueue();
  const queuedForPvp = queue?.status === 'waiting' && queue?.mode === 'pvp';
  const activePvpMatch = match?.mode === 'pvp'
    && ['matched', 'countdown', 'fighting'].includes(String(match?.status || ''));
  const musicActive = queuedForPvp || activePvpMatch;

  useEffect(() => {
    if (musicActive) startLoopSound('bgm_boss');
    else stopLoopSound('bgm_boss');
  }, [musicActive]);
  useEffect(() => () => stopLoopSound('bgm_boss'), []);

  return null;
}