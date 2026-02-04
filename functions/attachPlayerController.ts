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

    _keyDownRef;
    _keyUpRef;

    onStart() {
        this.characterController = this.entity.getComponent("CharacterController");
        this.animator = this.entity.getComponent("Animator");

        if (this.characterController) {
            this.characterController.speed = this.runSpeed;
        }

        this.changeState("Y Bot@Breathing Idle");

        this._keyDownRef = (e) => this.handleKey(e, true);
        this._keyUpRef = (e) => this.handleKey(e, false);

        window.addEventListener("keydown", this._keyDownRef);
        window.addEventListener("keyup", this._keyUpRef);
    }

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

        const grounded = this.characterController.isGrounded();
        const movement = this.characterController.getMovementDirection();
        const isMoving = movement.x !== 0 || movement.z !== 0;

        if (grounded && this.keys.jump) {
            this.characterController.jump();
            this.isJumping = true;
            this.jumpStartTime = Date.now();
        }

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
                    this.currentState = ""; 
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