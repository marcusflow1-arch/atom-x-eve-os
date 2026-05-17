// Single mount point for the host-authoritative enemy/boss sync layer.
// Drop this once inside GameView (it's tiny + renders nothing). It:
//   1. Registers the local user id with hostElectionStore.
//   2. Starts the broadcaster + receiver pairs for enemies and bosses.
//
// All four sync modules are safe to run unconditionally — they no-op when
// they shouldn't apply (broadcasters only emit when this client is the host;
// receivers ignore snapshots when this client IS the host).

import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { setMyId } from './hostElectionStore';
import { startEnemySyncBroadcaster } from './enemySyncBroadcaster';
import { startEnemySyncReceiver } from './enemySyncReceiver';
import { startBossSyncBroadcaster } from './bossSyncBroadcaster';
import { startBossSyncReceiver } from './bossSyncReceiver';

export default function WorldSyncMount() {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) setMyId(user.id);
  }, [user?.id]);

  useEffect(() => {
    const stopEnemyB = startEnemySyncBroadcaster();
    const stopEnemyR = startEnemySyncReceiver();
    const stopBossB = startBossSyncBroadcaster();
    const stopBossR = startBossSyncReceiver();
    return () => {
      stopEnemyB && stopEnemyB();
      stopEnemyR && stopEnemyR();
      stopBossB && stopBossB();
      stopBossR && stopBossR();
    };
  }, []);

  return null;
}