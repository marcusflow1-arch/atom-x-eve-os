import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1) Ensure Model3DScript "PlayerController" exists
    const existing = await base44.entities.Model3DScript.filter({ name: 'PlayerController' });
    let script = existing && existing.length ? existing[0] : null;

    // The logic inside this string is the "Game Brain"
    const scriptCode = `export default class PlayerController {
  static stateBuffer = (typeof window !== 'undefined' && (window.__B44_PC_STATE = window.__B44_PC_STATE || {})) ? window.__B44_PC_STATE : {};

  constructor() {
    this.characterController = null;
    this.animator = null;

    this.currentState = "";
    this.exclusiveAction = null;
    this.animationFinishedCallback = null;

    this.isJumping = false;
    this.jumpStartTime = 0;
    this.jumpDuration = 500;

    this.runSpeed = 8.0;

    this.keys = { attack: false, roll: false, jump: false, w: false, a: false, s: false, d: false };

    this._keyDownRef = null;
    this._keyUpRef = null;
    this._uiOpenRef = null;
    this._uiCloseRef = null;

    this._lockCount = 0;
    this._id = null;
  }

  _restoreState() {
    const buf = PlayerController.stateBuffer[this._id] || {};
    this._lockCount = buf.lockCount || 0;
  }

  _saveState() {
    PlayerController.stateBuffer[this._id] = { lockCount: this._lockCount };
  }

  _applyLockState() {
    if (this.characterController) {
      this.characterController.speed = this._lockCount > 0 ? 0 : this.runSpeed;
    }
  }

  onStart() {
    // stable ID across re-inits
    this._id = (this.entity && (this.entity.id || this.entity.uuid || this.entity.name)) || 'player';
    this._restoreState();

    // 1. HARD WIPE: Clear any stuck keys from previous sessions
    this.keys = { attack: false, roll: false, jump: false, w: false, a: false, s: false, d: false };

    // 2. CLEAR BUFFER: Don't let the window memory force an animation
    if (typeof window !== 'undefined' && window.__B44_PC_STATE) {
      window.__B44_PC_STATE = {};
    }

    this.characterController = this.entity.getComponent("CharacterController");
    this.animator = this.entity.getComponent("Animator");

    // 3. STOP ALL: Kill any 'Default' animations playing from the FBX
    if (this.animator && typeof this.animator.stopAllAction === 'function') {
      this.animator.stopAllAction();
    }

    if (this.characterController) {
      // Disable built-in default input so the script fully owns controls
      if (typeof this.characterController.setDefaultInput === 'function') {
        this.characterController.setDefaultInput(false);
      } else if ('defaultInput' in this.characterController) {
        this.characterController.defaultInput = false;
      } else if ('useDefaultInput' in this.characterController) {
        this.characterController.useDefaultInput = false;
      }
      this.characterController.speed = this.runSpeed;
    }

    // Debug: list available actions if API exists
    if (this.animator) {
      if (typeof this.animator.getAvailableActions === 'function') {
        console.log('Animator actions:', this.animator.getAvailableActions());
      } else if (typeof this.animator.listActions === 'function') {
        console.log('Animator actions:', this.animator.listActions());
      }
    }

    this.changeState("idle");

    if (!this._keyDownRef) this._keyDownRef = (e) => this.handleKey(e, true);
    if (!this._keyUpRef) this._keyUpRef = (e) => this.handleKey(e, false);

    window.addEventListener("keydown", this._keyDownRef);
    window.addEventListener("keyup", this._keyUpRef);

    if (!this._uiOpenRef) this._uiOpenRef = () => { this._lockCount++; this._applyLockState(); this.changeState("idle"); this._saveState(); };
    if (!this._uiCloseRef) this._uiCloseRef = () => { this._lockCount = Math.max(0, this._lockCount - 1); this._applyLockState(); this._saveState(); };

    window.addEventListener("ui_panel_open", this._uiOpenRef);
    window.addEventListener("ui_panel_close", this._uiCloseRef);

    this._applyLockState();
  }

  onDestroy() {
    window.removeEventListener("keydown", this._keyDownRef);
    window.removeEventListener("keyup", this._keyUpRef);
    window.removeEventListener("ui_panel_open", this._uiOpenRef);
    window.removeEventListener("ui_panel_close", this._uiCloseRef);
    this._saveState();
  }

  handleKey(e, isDown) {
  if (this._lockCount > 0) return; // ignore input when locked
  const k = (e.key || '').toLowerCase();
  if (k === "1") this.keys.attack = isDown;
  if (k === "c") this.keys.roll = isDown;
  if (e.code === "Space" || k === " ") this.keys.jump = isDown;
  if (k === 'w' || k === 'a' || k === 's' || k === 'd') this.keys[k] = isDown;

  // Stop animations on key release as requested
  if (!isDown) {
    // Stop row (roll) animation with 'C'
    if (k === 'c') {
      const rowClip = this._resolveClipForState('row');
      if (this.animator && typeof this.animator.stop === 'function') this.animator.stop(rowClip);
      if (this.exclusiveAction === rowClip) {
        this.exclusiveAction = null;
        this.currentState = '';
      }
    }
    // Stop attack animation with '1'
    if (k === '1') {
      const attackClip = this._resolveClipForState('attack 1');
      if (this.animator && typeof this.animator.stop === 'function') this.animator.stop(attackClip);
      if (this.exclusiveAction === attackClip) {
        this.exclusiveAction = null;
        this.currentState = '';
      }
    }
    // Stop jump animation with Spacebar
    if (e.code === 'Space' || k === ' ') {
      this.isJumping = false;
      this.jumpStartTime = 0;
      // Force back to idle immediately
      this.changeState('Y Bot@Breathing Idle');
    }
  }
  }

  onUpdate() {
    if (!this.characterController || !this.animator) return;

    if (this._lockCount > 0) {
      // Locked: force idle
      this.changeState("idle");
      return;
    }

    if (!this.exclusiveAction) {
      if (this.keys.attack) {
        this.startExclusive("attack 1");
        this.keys.attack = false;
      } else if (this.keys.roll) {
        // map roll->row (project clip name is 'row')
        this.startExclusive("row");
        this.keys.roll = false;
      }
    }

    if (this.exclusiveAction) {
      // freeze movement to avoid sliding while playing exclusive action
      if (this.characterController) {
        if (typeof this.characterController.setMovementDirection === 'function') {
          this.characterController.setMovementDirection({ x: 0, z: 0 });
        } else if (typeof this.characterController.setInput === 'function') {
          this.characterController.setInput({ x: 0, z: 0 });
        } else {
          this.characterController.movementDirection = { x: 0, z: 0 };
        }
      }
      return;
    }

    const grounded = this.characterController.isGrounded ? this.characterController.isGrounded() : true;

    // Script-controlled movement (overrides component listener)
    let moveX = 0, moveZ = 0;
    if (this.keys.w) moveZ -= 1;
    if (this.keys.s) moveZ += 1;
    if (this.keys.a) moveX -= 1;
    if (this.keys.d) moveX += 1;
    if (moveX !== 0 || moveZ !== 0) {
      const len = Math.hypot(moveX, moveZ);
      moveX /= len; moveZ /= len;
      if (typeof this.characterController.setMovementDirection === 'function') {
        this.characterController.setMovementDirection({ x: moveX, z: moveZ });
      } else if (typeof this.characterController.setInput === 'function') {
        this.characterController.setInput({ x: moveX, z: moveZ });
      } else if (typeof this.characterController.move === 'function') {
        this.characterController.move({ x: moveX, z: moveZ });
      } else {
        this.characterController.movementDirection = { x: moveX, z: moveZ };
      }
    } else {
      if (typeof this.characterController.setMovementDirection === 'function') {
        this.characterController.setMovementDirection({ x: 0, z: 0 });
      } else if (typeof this.characterController.setInput === 'function') {
        this.characterController.setInput({ x: 0, z: 0 });
      } else {
        this.characterController.movementDirection = { x: 0, z: 0 };
      }
    }
    const isMoving = moveX !== 0 || moveZ !== 0;

    if (grounded && this.keys.jump) {
      if (this.characterController.jump) this.characterController.jump();
      this.isJumping = true;
      this.jumpStartTime = Date.now();
    }

    if (grounded) {
      this.isJumping = false;
      this.changeState(isMoving ? "run" : "idle");
    } else {
      const timeSinceJump = Date.now() - this.jumpStartTime;
      const state = (this.isJumping && timeSinceJump < this.jumpDuration) ? "jump" : "fall";
      this.changeState(state);
    }

    // keep speed enforced
    if (this.characterController && typeof this.characterController.speed === "number" && this._lockCount === 0 && this.characterController.speed !== this.runSpeed) {
      this.characterController.speed = this.runSpeed;
    }
  }

  // Map logical states to animator clip names. Update this map to match your project's clip naming.
  _resolveClipForState(state) {
    const map = {
      'jump': 'Y Bot@Jump',
      'fall': 'Y Bot@Fall',
      'landing': 'Y Bot@Fall To Ground',
      // Accept both 'roll' and 'row' as inputs and map to the actual clip name 'row'
      'roll': 'row',
      'row': 'row',
      // The attack clip is named exactly 'attack 1' in the project
      'attack 1': 'attack 1',
      // New simplified clip names
      'run': 'run',
      'idle': 'idle',
      // Backwards compatibility with previous clip names
      'Y Bot@Running': 'run',
      'Y Bot@Breathing Idle': 'idle'
    };
    if (map[state]) return map[state];
    if (state.includes('@') || state.includes(' ')) return state;
    return 'Y Bot@' + state.charAt(0).toUpperCase() + state.slice(1);
  }

  changeState(newState) {
    const clip = this._resolveClipForState(newState);
    if (this.currentState === clip) return;
    this.currentState = clip;
    if (!this.animator) return;
    console.log('Changing state ->', newState, '-> clip:', clip);
    if (typeof this.animator.setBaseAction === 'function') this.animator.setBaseAction(clip);
    if (typeof this.animator.mix === 'function') this.animator.mix(clip, 0.1, 1);
  }

  startExclusive(actionName) {
    const clip = this._resolveClipForState(actionName);
    this.exclusiveAction = clip;
    this.currentState = clip;

    if (!this.animator) return;

    if (typeof this.animator.setLayer === 'function') {
      this.animator.setLayer(clip, 'override');
    }
    if (typeof this.animator.setPriority === 'function') {
      this.animator.setPriority(clip, 10);
    }
    if (typeof this.animator.stop === 'function') {
      this.animator.stop('run');
    } else if (typeof this.animator.setWeight === 'function') {
      this.animator.setWeight('run', 0);
    }

    if (typeof this.animator.setBaseAction === 'function') this.animator.setBaseAction(clip);
    if (typeof this.animator.mix === 'function') this.animator.mix(clip, 0.05, 1);

    const captured = clip;
    const finishHandler = (name) => {
      if (!name) return;
      if (name === captured || name === actionName) {
        this.exclusiveAction = null;
        this.currentState = '';
        if (typeof this.animator.setWeight === 'function') {
          this.animator.setWeight('run', 1);
        }
      }
    };

    this.animationFinishedCallback = finishHandler;
    if (typeof this.animator.onFinish === 'function') {
      this.animator.onFinish(finishHandler);
    } else {
      console.log('Animator has no onFinish hook; exclusive animations may not clear automatically.');
    }
  }
}`;

    if (!script) {
      script = await base44.entities.Model3DScript.create({
        name: 'PlayerController',
        description: 'Keyboard-driven player controller for Y Bot',
        model_reference: 'Y Bot',
        page_location: 'Dashboard',
        script_code: scriptCode,
        model_url: '',
        script_type: 'behavior',
        is_active: true,
      });
    } else {
      // OPTIONAL: Update the script code if it already exists to ensure it's the latest version
      await base44.entities.Model3DScript.update(script.id, { script_code: scriptCode });
    }

    // 2) Find the active scene
    const activeScenes = await base44.entities.SceneLayout.filter({ is_active: true }, '-updated_date', 1);
    if (!activeScenes || activeScenes.length === 0) {
      return Response.json({ error: 'No active scene found' }, { status: 404 });
    }
    const active = activeScenes[0];
    const objects = Array.isArray(active.objects) ? [...active.objects] : [];

    // 3) Find Y Bot 
    const idx = objects.findIndex(o => {
      const name = ((o.name || o.instance_name || '') + '').toLowerCase();
      return name.includes('ybot') || name.includes('y bot');
    });

    if (idx === -1) {
      return Response.json({ error: 'No Y Bot found in active scene' }, { status: 404 });
    }

    const target = { ...objects[idx] };
    
    // Ensure scripts array exists
    if (!Array.isArray(target.scripts)) target.scripts = [];

    // Check if script is already attached
    const isAlreadyAttached = target.scripts.some(s => s.script_id === script.id);

    if (!isAlreadyAttached) {
      target.scripts.push({ script_id: script.id });
      // Set role to player so camera/AI scripts can find the main user
      target.role = 'player'; 
      
      objects[idx] = target;

      // 4) Update SceneLayout
      await base44.entities.SceneLayout.update(active.id, { objects });
    }

    return Response.json({
      status: 'ok',
      script_id: script.id,
      scene_id: active.id,
      message: isAlreadyAttached ? 'Script already attached' : 'Script attached and role set to Player',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});