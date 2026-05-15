import * as THREE from 'three';
import { setTarget, clearTarget } from './abilityStore';

const raycaster = new THREE.Raycaster();

/**
 * Handle a middle-click in the 3D game world. Priority:
 *   1. Hits on a remote player → open the player interaction menu.
 *   2. Hits on an enemy → set as active combat target.
 *   3. Empty space → clear current target.
 */
export function handleMiddleClick({ event, renderer, camera, enemies, remoteManager, setPlayerMenu }) {
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
        setPlayerMenu({ x: event.clientX, y: event.clientY, player: { id: pid, name: pname } });
        return;
      }
    }
  }

  // 2. Enemies
  const enemyMeshes = [];
  enemies.forEach((en) => {
    if (!en.alive || en.dying) return;
    en.group.traverse((node) => { if (node.isMesh) enemyMeshes.push(node); });
  });
  const hits = raycaster.intersectObjects(enemyMeshes, false);
  if (hits.length > 0) {
    let hitMesh = hits[0].object;
    let foundEnemy = null;
    for (const en of enemies) {
      en.group.traverse((node) => { if (node === hitMesh) foundEnemy = en; });
      if (foundEnemy) break;
    }
    if (foundEnemy) {
      setTarget({
        id: foundEnemy.id,
        name: foundEnemy.bossName || (foundEnemy.tier ? `${foundEnemy.tier.charAt(0).toUpperCase() + foundEnemy.tier.slice(1)} Enemy` : 'Enemy'),
        hp: foundEnemy.hp,
        maxHp: foundEnemy.maxHp,
        level: foundEnemy.level,
        tier: foundEnemy.tier || 'normal',
        bossName: foundEnemy.bossName || null,
      });
      return;
    }
  }

  // 3. Empty space → clear
  clearTarget();
}