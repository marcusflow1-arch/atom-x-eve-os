import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    /* -------------------------------------------------
       1) ENSURE GENERIC PLAYER CONTROLLER SCRIPT EXISTS
    -------------------------------------------------- */

    const existing = await base44.entities.Model3DScript.filter({
      name: 'PlayerController',
    });

    let script = existing?.length ? existing[0] : null;

    const scriptCode = `export default class PlayerController {
  static stateBuffer = (typeof window !== 'undefined' &&
    (window.__B44_PC_STATE = window.__B44_PC_STATE || {}))
    ? window.__B44_PC_STATE
    : {};

  constructor() {
    this.entity = null;
    this.characterController = null;
    this.animator = null;

    this.currentState = '';
    this.exclusiveAction = null;

    this.isJumping = false;
    this.jumpStartTime = 0;
    this.jumpDuration = 500;

    this.runSpeed = 8.0;

    this.keys = {
      attack: false,
      roll: false,
      jump: false,
      w: false,
      a: false,
      s: false,
      d: false,
    };

    this._lockCount = 0;
    this._id = null;

    this._keyDownRef = null;
    this._keyUpRef = null;
    this._uiOpenRef = null;
    this._uiCloseRef = null;
  }

  /* -------------------- STATE -------------------- */

  _restoreState() {
    const buf = PlayerController.stateBuffer[this._id] || {};
    this._lockCount = buf.lockCount || 0;
  }

  _saveState() {
    PlayerController.stateBuffer[this._id] = {
      lockCount: this._lockCount,
    };
  }

  _applyLockState() {
    if (this.characterController) {
      this.characterController.speed =
        this._lockCount > 0 ? 0 : this.runSpeed;
    }
  }

  /* -------------------- LIFECYCLE -------------------- */

  onStart() {
    this._id =
      (this.entity &&
        (this.entity.id || this.entity.uuid || this.entity.name)) ||
      'player';

    this._restoreState();

    this.keys = {
      attack: false,
      roll: false,
      jump: false,
      w: false,
      a: false,
      s: false,
      d: false,
    };

    if (typeof window !== 'undefined') {
      window.__B44_PC_STATE = {};
    }

    this.characterController =
      this.entity.getComponent('CharacterController');
    this.animator = this.entity.getComponent('Animator');

    this.animator?.stopAllAction?.();

    if (this.characterController) {
      this.characterController.setDefaultInput?.(false);
      this.characterController.speed = this.runSpeed;
    }

    this.changeState('idle');

    this._keyDownRef = (e) => this.handleKey(e, true);
    this._keyUpRef = (e) => this.handleKey(e, false);

    window.addEventListener('keydown', this._keyDownRef);
    window.addEventListener('keyup', this._keyUpRef);

    this._uiOpenRef = () => {
      this._lockCount++;
      this._applyLockState();
      this.changeState('idle');
      this._saveState();
    };

    this._uiCloseRef = () => {
      this._lockCount = Math.max(0, this._lockCount - 1);
      this._applyLockState();
      this._saveState();
    };

    window.addEventListener('ui_panel_open', this._uiOpenRef);
    window.addEventListener('ui_panel_close', this._uiCloseRef);

    this._applyLockState();
  }

  onDestroy() {
    window.removeEventListener('keydown', this._keyDownRef);
    window.removeEventListener('keyup', this._keyUpRef);
    window.removeEventListener('ui_panel_open', this._uiOpenRef);
    window.removeEventListener('ui_panel_close', this._uiCloseRef);
    this._saveState();
  }

  /* -------------------- INPUT -------------------- */

  handleKey(e, isDown) {
    if (this._lockCount > 0) return;

    const k = (e.key || '').toLowerCase();

    if (k === '1') this.keys.attack = isDown;
    if (k === 'c') this.keys.roll = isDown;
    if (e.code === 'Space') this.keys.jump = isDown;
    if (['w', 'a', 's', 'd'].includes(k)) this.keys[k] = isDown;

    if (!isDown && (k === 'c' || k === '1' || e.code === 'Space')) {
      this.exclusiveAction = null;
      this.changeState('idle');
    }
  }

  /* -------------------- UPDATE -------------------- */

  onUpdate() {
    if (!this.characterController || !this.animator) return;

    if (this._lockCount > 0) {
      this.changeState('idle');
      return;
    }

    if (!this.exclusiveAction) {
      if (this.keys.attack) {
        this.startExclusive('attack 1');
        this.keys.attack = false;
      } else if (this.keys.roll) {
        this.startExclusive('row');
        this.keys.roll = false;
      }
    }

    if (this.exclusiveAction) {
      this.characterController.setMovementDirection?.({ x: 0, z: 0 });
      return;
    }

    let x = 0,
      z = 0;
    if (this.keys.w) z -= 1;
    if (this.keys.s) z += 1;
    if (this.keys.a) x -= 1;
    if (this.keys.d) x += 1;

    if (x || z) {
      const len = Math.hypot(x, z);
      x /= len;
      z /= len;
    }

    this.characterController.setMovementDirection?.({ x, z });

    const moving = x !== 0 || z !== 0;
    const grounded = this.characterController.isGrounded?.() ?? true;

    if (grounded && this.keys.jump) {
      this.characterController.jump?.();
      this.isJumping = true;
    }

    if (grounded) {
      this.changeState(moving ? 'run' : 'idle');
    } else {
      this.changeState(this.isJumping ? 'jump' : 'fall');
    }
  }

  /* -------------------- ANIMATION -------------------- */

  _resolveClip(state) {
    const map = {
      idle: 'idle',
      run: 'run',
      jump: 'jump',
      fall: 'fall',
      roll: 'row',
      row: 'row',
      'attack 1': 'attack 1',
    };
    return map[state] || state;
  }

  changeState(state) {
    const clip = this._resolveClip(state);
    if (this.currentState === clip) return;
    this.currentState = clip;
    this.animator.setBaseAction?.(clip);
    this.animator.mix?.(clip, 0.1, 1);
  }

  startExclusive(action) {
    const clip = this._resolveClip(action);
    this.exclusiveAction = clip;
    this.animator.stop?.('run');
    this.animator.setBaseAction?.(clip);
    this.animator.mix?.(clip, 0.05, 1);

    this.animator.onFinish?.((name) => {
      if (name === clip) {
        this.exclusiveAction = null;
        this.changeState('idle');
      }
    });
  }
}`;

    if (!script) {
      script = await base44.entities.Model3DScript.create({
        name: 'PlayerController',
        description: 'Generic keyboard-driven player controller',
        model_reference: '',
        page_location: 'Dashboard',
        script_code: scriptCode,
        script_type: 'behavior',
        is_active: true,
      });
    } else {
      await base44.entities.Model3DScript.update(script.id, {
        script_code: scriptCode,
      });
    }

    /* -------------------------------------------------
       2) ATTACH SCRIPT TO PLAYER ENTITY (GENERIC)
    -------------------------------------------------- */

    const scenes = await base44.entities.SceneLayout.filter(
      { is_active: true },
      '-updated_date',
      1
    );

    if (!scenes?.length) {
      return Response.json({ error: 'No active scene found' }, { status: 404 });
    }

    const scene = scenes[0];
    const objects = Array.isArray(scene.objects)
      ? [...scene.objects]
      : [];

    const idx = objects.findIndex((o) => o.role === 'player');

    if (idx === -1) {
      return Response.json(
        { error: 'No player entity found (role: player)' },
        { status: 404 }
      );
    }

    const target = { ...objects[idx] };
    if (!Array.isArray(target.scripts)) target.scripts = [];

    const already = target.scripts.some((s) => s.script_id === script.id);

    if (!already) {
      target.scripts.push({ script_id: script.id });
      objects[idx] = target;
      await base44.entities.SceneLayout.update(scene.id, { objects });
    }

    return Response.json({
      status: 'ok',
      script_id: script.id,
      scene_id: scene.id,
      attached_to: target.name || 'player entity',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
