/**
 * enemyLootBroadcaster
 * Listens for the existing `webrtcRemoteAction` enemy_killed events AND a new
 * local `localEnemyKilled` event, then re-dispatches `enemyLootDrop` so that
 * GameWorldLootLayer can roll drops without touching the huge GameWorld3D file.
 *
 * Usage: call attachLootBroadcaster() once on mount, returns a cleanup fn.
 */
export function attachLootBroadcaster() {
  const handleLocal = (e) => {
    const d = e.detail;
    if (!d) return;
    window.dispatchEvent(new CustomEvent('enemyLootDrop', {
      detail: {
        enemyId: d.enemyId || d.enemy_id,
        tier: d.tier || 'normal',
        isBoss: !!d.isBoss,
        x: d.x ?? 0,
        y: d.y ?? 0,
        z: d.z ?? 0,
      },
    }));
  };

  window.addEventListener('localEnemyKilled', handleLocal);
  return () => window.removeEventListener('localEnemyKilled', handleLocal);
}