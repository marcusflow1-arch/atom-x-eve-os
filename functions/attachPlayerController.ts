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
    this.isCrouching = false;
    this.isBlocking = false;
    this.isRunning = false;

    // Movement speeds
    this.speeds = {
      walk: 4.0,
      run: 8.0,
      crouch: 2.0,
      block: 1.5
    };

    this.keys = {
      w: false, a: false, s: false, d: false,
      space: false,
      shift: false,
      c: false, // Crouch (toggle)
      x: false, // Draw sword
      q: false, // Cast spell
      lmb: false, // Attack
      rmb: false, // Block
    };

    this._lockCount = 0;
    this._id = null;

    // Event References
    this._keyDownRef = null;
    this._keyUpRef = null;
    this._mouseDownRef = null;
    this._mouseUpRef = null;
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
      // If locked, stop. Else default to walk speed initially.
      this.characterController.speed =
        this._lockCount > 0 ? 0 : this.speeds.walk;
    }
  }

  /* -------------------- LIFECYCLE -------------------- */

  onStart() {
    this._id =
      (this.entity &&
        (this.entity.id || this.entity.uuid || this.entity.name)) ||
      'player';

    this._restoreState();

    if (typeof window !== 'undefined') {
      window.__B44_PC_STATE = {};
    }

    this.characterController =
      this.entity.getComponent('CharacterController');
    this.animator = this.entity.getComponent('Animator');

    this.animator?.stopAllAction?.();

    if (this.characterController) {
      this.characterController.setDefaultInput?.(false);
      this.characterController.speed = this.speeds.walk;
    }

    this.changeState('idle');

    // Bind Event Handlers
    this._keyDownRef = (e) => this.handleKey(e, true);
    this._keyUpRef = (e) => this.handleKey(e, false);
    this._mouseDownRef = (e) => this.handleMouse(e, true);
    this._mouseUpRef = (e) => this.handleMouse(e, false);

    window.addEventListener('keydown', this._keyDownRef);
    window.addEventListener('keyup', this._keyUpRef);
    window.addEventListener('mousedown', this._mouseDownRef);
    window.addEventListener('mouseup', this._mouseUpRef);

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
    window.removeEventListener('mousedown', this._mouseDownRef);
    window.removeEventListener('mouseup', this._mouseUpRef);
    window.removeEventListener('ui_panel_open', this._uiOpenRef);
    window.removeEventListener('ui_panel_close', this._uiCloseRef);
    this._saveState();
  }

  /* -------------------- INPUT -------------------- */

  handleKey(e, isDown) {
    if (this._lockCount > 0) return;

    const k = (e.key || '').toLowerCase();

    // Movement
    if (['w', 'a', 's', 'd'].includes(k)) this.keys[k] = isDown;
    if (e.code === 'Space') this.keys.space = isDown;
    if (e.shiftKey !== undefined) this.keys.shift = e.shiftKey;

    // Actions
    if (k === 'q') this.keys.q = isDown; // Cast
    if (k === 'x') this.keys.x = isDown; // Draw
    if (k === 'c') {
      if (isDown && !this.keys.c) { // Toggle on key press
         this.isCrouching = !this.isCrouching;
      }
      this.keys.c = isDown;
    }

    // Trigger exclusives on press (not hold)
    if (isDown) {
      if (k === 'q' && !this.exclusiveAction) this.startExclusive('cast');
      if (k === 'x' && !this.exclusiveAction) this.startExclusive('draw');
    }
  }

  handleMouse(e, isDown) {
    if (this._lockCount > 0) return;
    
    // 0 = Left, 2 = Right
    if (e.button === 0) {
        this.keys.lmb = isDown;
        if (isDown && !this.exclusiveAction) this.startExclusive('attack');
    }
    if (e.button === 2) {
        this.keys.rmb = isDown;
        this.isBlocking = isDown;
    }
  }

  /* -------------------- UPDATE -------------------- */

  onUpdate() {
    if (!this.characterController || !this.animator) return;

    // 1. UI Lock
    if (this._lockCount > 0) {
      this.changeState('idle');
      return;
    }

    // 2. Exclusive Actions (Attack, Cast, Draw)
    // If blocked, we also prevent movement? 
    // Usually attacking stops movement or allows very slow sliding.
    // Let's stop movement for exclusive actions.
    if (this.exclusiveAction) {
      this.characterController.setMovementDirection?.({ x: 0, z: 0 });
      return;
    }

    // 3. Movement Calculation
    let x = 0, z = 0;
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

    // 4. Determine Speed & State
    const moving = x !== 0 || z !== 0;
    const grounded = this.characterController.isGrounded?.() ?? true;

    // Handle Jumping
    if (grounded && this.keys.space && !this.isBlocking && !this.isCrouching) {
      this.characterController.jump?.();
      this.isJumping = true;
      // Note: Animator usually handles 'jump' state until grounded again
    } else if (grounded) {
        this.isJumping = false;
    }

    // Determine Animation State
    let targetState = 'idle';
    let targetSpeed = this.speeds.walk;

    if (!grounded) {
        targetState = 'jump';
    } else if (this.isBlocking) {
        targetState = 'block';
        targetSpeed = this.speeds.block;
    } else if (this.isCrouching) {
        targetState = 'crouch'; // If moving, we might need 'crouch_walk' if available, otherwise slide in crouch pose
        targetSpeed = this.speeds.crouch;
    } else if (moving) {
        if (this.keys.shift) {
            targetState = 'run';
            targetSpeed = this.speeds.run;
        } else {
            targetState = 'walk';
            targetSpeed = this.speeds.walk;
        }
    } else {
        targetState = 'idle';
    }

    // Apply Speed
    this.characterController.speed = targetSpeed;

    // Apply Animation
    this.changeState(targetState);
  }

  /* -------------------- ANIMATION -------------------- */

  _resolveClip(state) {
    // Mapping internal states to FBX Animation names
    const map = {
      idle: 'great sword idle',
      walk: 'great sword walk',
      run: 'great sword run',
      jump: 'great sword jump',
      fall: 'great sword jump', // Fallback
      crouch: 'great sword crouching',
      block: 'great sword blocking',
      attack: 'great sword attack',
      cast: 'great sword casting', // Or 'spell cast' if preferred
      draw: 'draw a great sword 1'
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
    // Stop movement animations immediately
    this.animator.setBaseAction?.(clip);
    this.animator.mix?.(clip, 0.05, 1);

    this.animator.onFinish?.((name) => {
      // Check if the finished animation is the one we started
      // (Handles case where multiple exclusives trigger rapidly)
      if (name === clip) {
        this.exclusiveAction = null;
        // Re-evaluate state on next frame
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