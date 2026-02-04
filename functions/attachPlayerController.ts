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

    const scriptCode = `export default class PlayerController {
    characterController;
    animator;
    
    currentState = ""; 
    exclusiveAction = null;
    animationFinishedCallback = null;

    isJumping = false;
    jumpStartTime = 0;
    jumpDuration = 500; 

    runSpeed = 8.0; 

    keys = { attack: false, roll: false, jump: false };

    // Store references to the functions so we can remove them later
    _keyDownRef;
    _keyUpRef;

    onStart() {
        this.characterController = this.entity.getComponent("CharacterController");
        this.animator = this.entity.getComponent("Animator");

        if (this.characterController) {
            this.characterController.speed = this.runSpeed;
        }

        this.changeState("Y Bot@Breathing Idle");

        // Use bound functions so 'this' stays correct
        this._keyDownRef = (e) => this.handleKey(e, true);
        this._keyUpRef = (e) => this.handleKey(e, false);

        window.addEventListener("keydown", this._keyDownRef);
        window.addEventListener("keyup", this._keyUpRef);
    }

    // Call this if the character is removed from the scene
    onDestroy() {
        window.removeEventListener("keydown", this._keyDownRef);
        window.removeEventListener("keyup", this._keyUpRef);
    }

    handleKey(e, isDown) {
        if (e.key === "1") this.keys.attack = isDown;
        if (e.key.toLowerCase() === "c") this.keys.roll = isDown;
        if (e.code === "Space") this.keys.jump = isDown;
    }

    onUpdate() {
        // 1. EXCLUSIVE ACTIONS (Priority)
        if (!this.exclusiveAction) {
            if (this.keys.attack) {
                this.startExclusive("attack 1");
                this.keys.attack = false;
            } else if (this.keys.roll) {
                this.startExclusive("roll");
                this.keys.roll = false;
            }
        }

        if (this.exclusiveAction) return;

        // 2. MOVEMENT & GROUND LOGIC
        const grounded = this.characterController.isGrounded();
        const movement = this.characterController.getMovementDirection();
        const isMoving = movement.x !== 0 || movement.z !== 0;

        if (grounded && this.keys.jump) {
            this.characterController.jump();
            this.isJumping = true;
            this.jumpStartTime = Date.now();
        }

        // 3. STATE SWITCHER
        if (grounded) {
            this.isJumping = false;
            this.changeState(isMoving ? "Y Bot@Running" : "Y Bot@Breathing Idle");
        } else {
            const timeSinceJump = Date.now() - this.jumpStartTime;
            const state = (this.isJumping && timeSinceJump < this.jumpDuration) ? "jump" : "fall";
            this.changeState(state);
        }
    }

    changeState(newState) {
        if (this.currentState === newState) return;
        this.currentState = newState;

        this.animator.setBaseAction(newState);
        this.animator.mix(newState, 0.1, 1);
    }

    startExclusive(actionName) {
        this.exclusiveAction = actionName;
        this.currentState = actionName;

        this.animator.setBaseAction(actionName);
        this.animator.mix(actionName, 0.05, 1);

        if (!this.animationFinishedCallback) {
            this.animationFinishedCallback = (name) => {
                if (name === this.exclusiveAction) {
                    this.exclusiveAction = null;
                    this.currentState = ""; // Allow loop to take over
                }
            };
            this.animator.onFinish(this.animationFinishedCallback);
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
    }

    // 2) Find the active scene
    const activeScenes = await base44.entities.SceneLayout.filter({ is_active: true }, '-updated_date', 1);
    if (!activeScenes || activeScenes.length === 0) {
      return Response.json({ error: 'No active scene found' }, { status: 404 });
    }
    const active = activeScenes[0];

    const objects = Array.isArray(active.objects) ? [...active.objects] : [];

    // 3) Find Y Bot only in this active scene
    const findYBotIndex = () => {
      for (let i = 0; i < objects.length; i++) {
        const o = objects[i] || {};
        const name = ((o.name || o.instance_name || '') + '').toLowerCase();
        if (name.includes('ybot') || name.includes('y bot')) return i;
      }
      return -1;
    };

    const idx = findYBotIndex();
    if (idx === -1) {
      return Response.json({ error: 'No Y Bot object found in active scene' }, { status: 404 });
    }

    const target = { ...objects[idx] };
    const existingScripts = Array.isArray(target.scripts) ? [...target.scripts] : [];

    const already = existingScripts.some((s) => s && (s.script_id === script.id));
    if (!already) {
      existingScripts.push({ script_id: script.id });
      target.scripts = existingScripts;
      objects[idx] = target;

      // 4) Update SceneLayout objects only
      await base44.entities.SceneLayout.update(active.id, { objects });
    }

    return Response.json({
      status: 'ok',
      script_id: script.id,
      scene_id: active.id,
      attached_to_object_id: target.id,
      message: already ? 'Script already attached' : 'Script attached to Y Bot in active scene',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});