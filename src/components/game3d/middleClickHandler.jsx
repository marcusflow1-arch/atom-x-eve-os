import * as THREE from 'three';
import { setTarget, clearTarget } from './abilityStore';

const raycaster = new THREE.Raycaster();

/**
 * Handle a middle-click lock-on in the 3D game world. Priority:
 *   1. Hits on a remote player → lock camera/combat target.
 *   2. Hits on an enemy → lock camera/combat target.
 *   3. Empty space → clear current target.
 */
export function handleMiddleClick({ event, renderer, camera, enemies, remoteManager, setPlayerMenu, rogues = [], bosses = [] }) {
  const rect = renderer.domElement.getBoundingClientRect();
  const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const ndcY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera({ x: ndcX, y: ndcY }, camera);

  // 1. Remote players first
  const remoteMeshes = remoteManager ? remoteManager.getMeshes() : [];
  if (remoteMeshes.length > 0) {
    const remoteHits = raycaster.intersectObjects(remoteMeshes, false);
    if (remoteHits.length > 0) {
      const hitMesh = remoteHits[0].object;
      const pid = hitMesh.userData?.remotePlayerId;
      const pname = hitMesh.userData?.remotePlayerName || 'Player';
      if (pid) {
        // If we're in an active duel and this is the opponent → strike instead of opening the menu.
        const activeDuel = (typeof window !== 'undefined') ? window.__activeDuel : null;
        if (activeDuel && activeDuel.opponentId === pid) {
          const point = remoteHits[0].point;
          let distance = 0;
          if (window.__localPlayerPos) {
            const lp = window.__localPlayerPos;
            const dx = point.x - lp.x, dz = point.z - lp.z;
            distance = Math.sqrt(dx * dx + dz * dz);
          }
          window.dispatchEvent(new CustomEvent('duelAttack', {
            detail: { targetPlayerId: pid, distance },
          }));
          const remote = remoteManager?.getRemotes?.()?.get(pid);
          return remote?.group ? {
            id: pid,
            group: remote.group,
            name: pname,
            kind: 'player',
            aliveRef: () => remoteManager?.getRemotes?.()?.has(pid),
          } : null;
        }
        // Also set the player as the active ability target so dual-mode skills
        // (e.g. Lightning Strike, Frost Tornado) know the target is a player
        // and apply their PvP effect instead of enemy damage.
        setTarget({
          id: pid,
          name: pname,
          kind: 'player',
        });
        const remote = remoteManager?.getRemotes?.()?.get(pid);
        return remote?.group ? {
          id: pid,
          group: remote.group,
          name: pname,
          kind: 'player',
          aliveRef: () => remoteManager?.getRemotes?.()?.has(pid),
        } : null;
      }
    }
  }

  // 2. Enemies + hostile rogue-AI + world bosses (all targetable via lock-on)
  const enemyMeshes = [];
  enemies.forEach((en) => {
    if (!en.alive || en.dying) return;
    en.group.traverse((node) => { if (node.isMesh) enemyMeshes.push(node); });
  });
  rogues.forEach((r) => {
    if (!r.alive || r.dying || !r.group?.visible) return;
    r.group.traverse((node) => { if (node.isMesh) enemyMeshes.push(node); });
  });
  bosses.forEach((b) => {
    if (!b.alive || b.dying || !b.group?.visible) return;
    b.group.traverse((node) => { if (node.isMesh) enemyMeshes.push(node); });
  });
  const hits = raycaster.intersectObjects(enemyMeshes, false);
  if (hits.length > 0) {
    const hitMesh = hits[0].object;
    let foundEnemy = null;
    for (const en of enemies) {
      en.group.traverse((node) => { if (node === hitMesh) foundEnemy = en; });
      if (foundEnemy) break;
    }
    if (!foundEnemy) {
      for (const b of bosses) {
        b.group.traverse((node) => { if (node === hitMesh) foundEnemy = b; });
        if (foundEnemy) break;
      }
    }
    if (!foundEnemy) {
      for (const r of rogues) {
        r.group.traverse((node) => { if (node === hitMesh) foundEnemy = r; });
        if (foundEnemy) break;
      }
    }
    if (foundEnemy) {
      const isWorldBoss = !!foundEnemy.isBoss;
      setTarget({
        id: foundEnemy.id,
        name: foundEnemy.name || foundEnemy.bossName || (foundEnemy.tier ? `${foundEnemy.tier.charAt(0).toUpperCase() + foundEnemy.tier.slice(1)} Enemy` : 'Enemy'),
        hp: foundEnemy.hp,
        maxHp: foundEnemy.maxHp,
        level: foundEnemy.level,
        tier: isWorldBoss ? 'boss' : (foundEnemy.tier || (foundEnemy.color !== undefined ? 'rogue' : 'normal')),
        bossName: foundEnemy.bossName || foundEnemy.name || null,
      });
      return {
        id: foundEnemy.id,
        group: foundEnemy.group,
        name: foundEnemy.name || foundEnemy.bossName || 'Enemy',
        kind: isWorldBoss ? 'boss' : (foundEnemy.color !== undefined ? 'rogue' : 'enemy'),
        aliveRef: () => !!foundEnemy.alive && !foundEnemy.dying && foundEnemy.group?.visible !== false,
      };
    }
  }

  // 3. Empty space → clear
  clearTarget();
  setPlayerMenu?.(null);
  return null;
}