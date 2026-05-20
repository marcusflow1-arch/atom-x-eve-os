import * as THREE from 'three';
import { QUESTS, getAvailableQuestForNPC } from '../questData';
import { getAbilityState, updateTargetHP, clearTarget } from '../abilityStore';

const tmpVec = new THREE.Vector3();
const frustum = new THREE.Frustum();
const projectionMatrix = new THREE.Matrix4();

function projectPoint(camera, w, h, x, y, z) {
  tmpVec.set(x, y, z);
  if (!frustum.containsPoint(tmpVec)) return null;
  tmpVec.project(camera);
  if (tmpVec.z < -1 || tmpVec.z > 1 || Math.abs(tmpVec.x) > 1.2 || Math.abs(tmpVec.y) > 1.2) return null;
  return { x: (tmpVec.x * 0.5 + 0.5) * w, y: (-tmpVec.y * 0.5 + 0.5) * h };
}

export class UISystem {
  constructor(options) {
    Object.assign(this, options);
    this.maxDistanceSq = options.maxDistanceSq ?? 10000;
  }

  update() {
    const model = this.getModel?.();
    const camera = this.camera;
    if (!model || !camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    projectionMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projectionMatrix);

    const enemyUI = [];
    const enemies = this.getEnemies?.() || [];
    for (const enemy of enemies) {
      if (!enemy.alive || enemy.dying || !enemy.group) continue;
      const dx = enemy.group.position.x - model.position.x;
      const dz = enemy.group.position.z - model.position.z;
      if (dx * dx + dz * dz > this.maxDistanceSq) continue;
      const p = projectPoint(camera, w, h, enemy.group.position.x, enemy.group.position.y + 2.2, enemy.group.position.z);
      if (!p) continue;
      enemyUI.push({
        id: enemy.id,
        x: p.x,
        y: p.y,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        level: enemy.level,
        name: enemy.bossName || (enemy.tier ? `${enemy.tier.charAt(0).toUpperCase() + enemy.tier.slice(1)} Enemy` : 'Enemy'),
      });
    }
    this.setEnemiesUI(enemyUI);

    const qUI = [];
    const qs = this.getQuestState();
    const lvl = this.getPlayerLevel();
    for (const qn of this.getQuestNPCs?.() || []) {
      if (!qn.group) continue;
      const acceptedFromHere = QUESTS.find((q) => q.npcId === qn.id && qs.acceptedIds.includes(q.id));
      let status = null;
      if (acceptedFromHere) {
        const prog = qs.progress[acceptedFromHere.id] || 0;
        status = prog >= acceptedFromHere.objective.count ? 'turn_in' : 'in_progress';
      } else if (getAvailableQuestForNPC(qn.id, lvl, qs.acceptedIds, qs.completedIds)) {
        status = 'available';
      }
      if (!status) continue;
      const p = projectPoint(camera, w, h, qn.group.position.x, qn.group.position.y + 2.4, qn.group.position.z);
      if (p) qUI.push({ id: qn.id, x: p.x, y: p.y, status });
    }
    this.setQuestNPCsUI(qUI);

    const projectedFloats = [];
    for (const f of this.floatingTextSystem.getLiveEntries()) {
      let wx = model.position.x, wy = model.position.y + 2.6, wz = model.position.z;
      if (f.enemyId !== 'player') {
        const en = enemies.find((e) => e.id === f.enemyId);
        if (!en?.group) continue;
        wx = en.group.position.x; wy = en.group.position.y + 2.4; wz = en.group.position.z;
      }
      const p = projectPoint(camera, w, h, wx, wy, wz);
      if (p) projectedFloats.push({ id: f.id, x: p.x, y: p.y, value: f.value, type: f.type, born: f.born });
    }
    this.setFloats(projectedFloats);

    const currentTarget = getAbilityState().target;
    if (currentTarget) {
      const targetEnemy = enemies.find((e) => e.id === currentTarget.id);
      if (targetEnemy && targetEnemy.alive && !targetEnemy.dying) updateTargetHP(targetEnemy.id, Math.max(0, targetEnemy.hp));
      else clearTarget();
    }

    const cg = this.getCompanion?.();
    const cs = this.getCompanionStats?.();
    if (cg) window.__localCompanionPos = { x: cg.position.x, y: cg.position.y, z: cg.position.z, yaw: cg.rotation.y };
    if (cg && cs && !this.isMounted()) {
      const p = projectPoint(camera, w, h, cg.position.x, cg.position.y + 2.4, cg.position.z);
      this.setCompanionUI(p ? { x: p.x, y: p.y, hp: cs.hp, maxHp: cs.maxHp, level: cs.level } : null);
    } else this.setCompanionUI(null);

    const playerP = !this.isMounted() ? projectPoint(camera, w, h, model.position.x, model.position.y + 2.6, model.position.z) : null;
    this.setPlayerNameUI(playerP);

    const rmUI = [];
    const rmFeet = {};
    const remotes = this.getRemotes?.();
    if (remotes) remotes.forEach((r, pid) => {
      if (!r.group) return;
      const head = projectPoint(camera, w, h, r.group.position.x, r.group.position.y + 2.6, r.group.position.z);
      if (head) rmUI.push({ id: pid, x: head.x, y: head.y });
      const feet = projectPoint(camera, w, h, r.group.position.x, r.group.position.y + 0.05, r.group.position.z);
      if (feet) rmFeet[pid] = feet;
    });
    this.setRemoteMicUI(rmUI);
    const localFeet = projectPoint(camera, w, h, model.position.x, model.position.y + 0.05, model.position.z);
    window.__duelFeetPositions = { local: localFeet, remotes: rmFeet };

    for (const boss of this.getBosses?.() || []) {
      this.updateBoss(boss.id, { x: boss.group.position.x, z: boss.group.position.z, hp: Math.max(0, boss.hp), maxHp: boss.maxHp, alive: boss.alive && !boss.dying });
    }
  }

  dispose() {
    this.setEnemiesUI([]);
    this.setQuestNPCsUI([]);
    this.setFloats([]);
    this.setCompanionUI(null);
    this.setPlayerNameUI(null);
    this.setRemoteMicUI([]);
  }
}