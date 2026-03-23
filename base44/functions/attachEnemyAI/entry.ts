import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1) Ensure EnemyAI Model3DScript exists/updated
    const existing = await base44.entities.Model3DScript.filter({ name: 'EnemyAI' });
    let script = existing && existing.length ? existing[0] : null;

    const enemyAIScript = `export default class EnemyAI {
  constructor() {
    this.characterController = null;
    this.animator = null;
    this.player = null;

    // Tunables
    this.detectRange = 12; // start chasing within this distance
    this.attackRange = 1.8; // attack when closer than this
    this.moveSpeed = 3.5; // enemy movement speed
    this.damagePerHit = 10; // damage per strike
    this.attackIntervalMs = 1000; // time between hits

    this._lastAttackAt = 0;
    this._lastPlayerLookup = 0;
    this._lookupIntervalMs = 1000;
  }

  onStart() {
    this.characterController = this.entity.getComponent("CharacterController");
    this.animator = this.entity.getComponent("Animator");

    if (this.characterController) {
      // Make sure default input isn't active on enemies
      if (typeof this.characterController.setDefaultInput === 'function') {
        this.characterController.setDefaultInput(false);
      } else if ('defaultInput' in this.characterController) {
        this.characterController.defaultInput = false;
      } else if ('useDefaultInput' in this.characterController) {
        this.characterController.useDefaultInput = false;
      }
      this.characterController.speed = this.moveSpeed;
    }

    // Idle baseline
    if (this.animator) {
      if (typeof this.animator.stopAllAction === 'function') this.animator.stopAllAction();
      this._setAnim("Y Bot@Breathing Idle", 0.1);
    }
  }

  onDestroy() {
    // nothing to cleanup for now
  }

  onUpdate(deltaMs) {
    const now = Date.now();

    // Periodically try to find the player
    if (!this.player && now - this._lastPlayerLookup > this._lookupIntervalMs) {
      this._lastPlayerLookup = now;
      this.player = this._findPlayer();
    }

    if (!this.player || !this.characterController) return;

    const playerPos = this._getPosition(this.player);
    const myPos = this._getPosition(this.entity);
    if (!playerPos || !myPos) return;

    const dx = playerPos.x - myPos.x;
    const dz = playerPos.z - myPos.z;
    const dist = Math.hypot(dx, dz);

    if (dist <= this.detectRange && dist > this.attackRange) {
      // Move towards player
      const len = dist || 1;
      const dirX = dx / len;
      const dirZ = dz / len;

      if (typeof this.characterController.setMovementDirection === 'function') {
        this.characterController.setMovementDirection({ x: dirX, z: dirZ });
      } else if (typeof this.characterController.setInput === 'function') {
        this.characterController.setInput({ x: dirX, z: dirZ });
      } else if (typeof this.characterController.move === 'function') {
        this.characterController.move({ x: dirX, z: dirZ });
      } else {
        this.characterController.movementDirection = { x: dirX, z: dirZ };
      }

      this._setAnim("Y Bot@Running", 0.1);
    } else if (dist <= this.attackRange) {
      // In attack range: stop and attack periodically
      if (typeof this.characterController.setMovementDirection === 'function') {
        this.characterController.setMovementDirection({ x: 0, z: 0 });
      } else if (typeof this.characterController.setInput === 'function') {
        this.characterController.setInput({ x: 0, z: 0 });
      } else {
        this.characterController.movementDirection = { x: 0, z: 0 };
      }

      // Attack throttle
      if (now - this._lastAttackAt >= this.attackIntervalMs) {
        this._lastAttackAt = now;
        this._playAttack();
        this._dealDamage(this.player, this.damagePerHit);
      }
    } else {
      // Idle
      if (typeof this.characterController.setMovementDirection === 'function') {
        this.characterController.setMovementDirection({ x: 0, z: 0 });
      } else if (typeof this.characterController.setInput === 'function') {
        this.characterController.setInput({ x: 0, z: 0 });
      } else {
        this.characterController.movementDirection = { x: 0, z: 0 };
      }
      this._setAnim("Y Bot@Breathing Idle", 0.1);
    }
  }

  _playAttack() {
    if (!this.animator) return;
    if (typeof this.animator.setLayer === 'function') this.animator.setLayer('attack 1', 'override');
    if (typeof this.animator.setPriority === 'function') this.animator.setPriority('attack 1', 10);
    if (typeof this.animator.stop === 'function') this.animator.stop('Y Bot@Running');

    this.animator.setBaseAction('attack 1');
    this.animator.mix('attack 1', 0.05, 1);
  }

  _dealDamage(playerEntity, amount) {
    // Prefer a native Health component if it exists
    try {
      const health = playerEntity.getComponent ? playerEntity.getComponent('Health') : null;
      if (health) {
        if (typeof health.takeDamage === 'function') {
          health.takeDamage(amount);
          return;
        }
        if (typeof health.current === 'number') {
          health.current = Math.max(0, (health.current || 0) - amount);
          return;
        }
      }
    } catch (_) {}

    // Fallback: emit a global event that UI/logic can listen to
    try {
      const detail = { amount, source: this.entity?.id || this.entity?.name || 'enemy' };
      window.dispatchEvent(new CustomEvent('player_take_damage', { detail }));
      // Optional console for debugging
      console.log('[EnemyAI] damage', detail);
    } catch (_) {}
  }

  _setAnim(name, blend = 0.1) {
    if (!this.animator) return;
    this.animator.setBaseAction(name);
    this.animator.mix(name, blend, 1);
  }

  _findPlayer() {
    // Try common discovery patterns
    try {
      if (typeof this.entity.findByRole === 'function') {
        return this.entity.findByRole('player');
      }
      const scene = (typeof this.entity.getScene === 'function') ? this.entity.getScene() : (this.entity.scene || null);
      if (scene) {
        if (typeof scene.findEntitiesByRole === 'function') {
          const p = scene.findEntitiesByRole('player');
          if (Array.isArray(p)) return p[0] || null;
          return p || null;
        }
        if (Array.isArray(scene.entities)) {
          const cand = scene.entities.find(e => (e.role === 'player' || (e.entity?.role === 'player')));
          if (cand) return cand.entity || cand;
        }
      }
    } catch (_) {}
    // Last resort: stash on window by other scripts
    try { return window.YBOT_PLAYER || null; } catch (_) {}
    return null;
  }

  _getPosition(entity) {
    if (!entity) return null;
    try {
      if (typeof entity.getWorldPosition === 'function') {
        const v = entity.getWorldPosition();
        if (v && typeof v.x === 'number') return { x: v.x || 0, y: v.y || 0, z: v.z || 0 };
      }
    } catch (_) {}
    try {
      if (entity.position && (typeof entity.position.x === 'number')) {
        return { x: entity.position.x || 0, y: entity.position.y || 0, z: entity.position.z || 0 };
      }
    } catch (_) {}
    try {
      if (entity.transform && entity.transform.position) {
        const p = entity.transform.position;
        return { x: p.x || 0, y: p.y || 0, z: p.z || 0 };
      }
    } catch (_) {}
    return null;
  }
}`;

    if (!script) {
      script = await base44.entities.Model3DScript.create({
        name: 'EnemyAI',
        description: 'Simple chase-and-attack AI for enemies',
        model_reference: 'Enemy',
        page_location: 'Dashboard',
        script_code: enemyAIScript,
        model_url: '',
        script_type: 'behavior',
        is_active: true,
      });
    } else {
      await base44.entities.Model3DScript.update(script.id, { script_code: enemyAIScript, is_active: true });
    }

    // 2) Find active scene
    const activeScenes = await base44.entities.SceneLayout.filter({ is_active: true }, '-updated_date', 1);
    if (!activeScenes || activeScenes.length === 0) {
      return Response.json({ error: 'No active scene found' }, { status: 404 });
    }
    const active = activeScenes[0];

    const objects = Array.isArray(active.objects) ? [...active.objects] : [];

    // 3) Attach EnemyAI to enemy entities (heuristics: role npc/autonomous, or name contains 'enemy')
    let attachCount = 0;
    const lower = (s) => ((s || '') + '').toLowerCase();

    for (let i = 0; i < objects.length; i++) {
      const o = { ...objects[i] };
      const nameL = lower(o.name || o.instance_name);
      const role = o.role || 'static';

      const isEnemy = (role !== 'player') && (role === 'npc' || role === 'autonomous' || nameL.includes('enemy'));
      if (!isEnemy) continue;

      if (!Array.isArray(o.scripts)) o.scripts = [];
      const already = o.scripts.some((s) => s.script_id === script.id);
      if (!already) {
        o.scripts.push({ script_id: script.id, params: { detectRange: 12, attackRange: 1.8, damagePerHit: 10 } });
        objects[i] = o;
        attachCount++;
      }
    }

    if (attachCount > 0) {
      await base44.entities.SceneLayout.update(active.id, { objects });
    }

    return Response.json({ status: 'ok', script_id: script.id, scene_id: active.id, attached: attachCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});