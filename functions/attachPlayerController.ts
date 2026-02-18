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
  constructor() {
    this.entity = null;
    this.animator = null;
    this.controller = null;

    this.speeds = { walk: 4, run: 7, crouch: 2, block: 1.5 };

    // 🔥 UPDATED TO MATCH YOUR UPLOADED FILENAMES EXACTLY
    this.animations = {
      idle: 'great sword idle',
      walk: 'great sword walk',
      run: 'great sword run',
      crouch: 'great sword crouching',
      block: 'great sword blocking',
      draw: 'draw a great sword 1',
      cast: 'spell cast',
      airAttack: 'great sword jump attack',
      powerUp: 'great sword power up',
      // Combo set
      slashes: [
        'great sword slash', 
        'great sword slash (2)', 
        'great sword slash (3)', 
        'great sword slash (4)', 
        'great sword slash (5)'
      ]
    };

    this.state = 'idle';
    this.exclusive = null;
    this.slashStep = 0;

    this.keys = { w: false, a: false, s: false, d: false, space: false, shift: false };
    this.isCrouching = false;
    this.isBlocking = false;
  }

  onStart() {
    this.animator = this.entity.getComponent('Animator');
    this.controller = this.entity.getComponent('CharacterController');

    if (!this.animator || !this.controller) return;

    // Bridge for UI Focus
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.setAttribute('tabindex', '1');
      canvas.addEventListener('mousedown', () => canvas.focus());
    }

    this.controller.setDefaultInput?.(false);
    this._bindInputs();
    this._play('idle');
  }

  _bindInputs() {
    this._kd = (e) => this._key(e, true);
    this._ku = (e) => this._key(e, false);
    this._md = (e) => this._mouse(e, true);
    this._mu = (e) => this._mouse(e, false);

    window.addEventListener('keydown', this._kd);
    window.addEventListener('keyup', this._ku);
    window.addEventListener('mousedown', this._md);
    window.addEventListener('mouseup', this._mu);
  }

  _key(e, down) {
    const k = e.key.toLowerCase();
    if (this.keys.hasOwnProperty(k)) this.keys[k] = down;
    if (e.code === 'Space') this.keys.space = down;
    this.keys.shift = e.shiftKey;

    if (k === 'c' && down) this.isCrouching = !this.isCrouching;
    if (k === 'x' && down && !this.exclusive) this._exclusive(this.animations.draw);
    if (k === '1' && down && !this.exclusive) this._exclusive(this.animations.powerUp);
  }

  _mouse(e, down) {
    if (e.button === 0 && down && !this.exclusive) {
      // Combo logic: Cycle through the 5 slashes
      const nextSlash = this.animations.slashes[this.slashStep];
      this._exclusive(nextSlash);
      this.slashStep = (this.slashStep + 1) % this.animations.slashes.length;
    }
    if (e.button === 2) this.isBlocking = down;
  }

  onUpdate() {
    if (!this.controller || !this.animator) return;

    if (this.exclusive) {
      this.controller.setMovementDirection?.({ x: 0, z: 0 });
      return;
    }

    let x = 0, z = 0;
    if (this.keys.w) z -= 1;
    if (this.keys.s) z += 1;
    if (this.keys.a) x -= 1;
    if (this.keys.d) x += 1;

    if (x || z) {
      const len = Math.hypot(x, z);
      x /= len; z /= len;
    }

    this.controller.setMovementDirection?.({ x, z });

    const moving = x !== 0 || z !== 0;
    const grounded = this.controller.isGrounded?.() ?? true;

    if (grounded && this.keys.space && !this.isBlocking) {
      this.controller.jump?.();
      return;
    }

    if (!grounded) {
      // Jump animation handled by keybind — no animation override here
    } else if (this.isBlocking) {
      this.controller.speed = this.speeds.block;
      this._play('block');
    } else if (this.isCrouching) {
      this.controller.speed = this.speeds.crouch;
      this._play('crouch');
    } else if (moving) {
      this.controller.speed = this.keys.shift ? this.speeds.run : this.speeds.walk;
      this._play(this.keys.shift ? 'run' : 'walk');
    } else {
      this._play('idle');
    }
  }

  _play(state) {
    const clip = (typeof state === 'string') ? this.animations[state] : state;
    if (!clip || this.state === clip) return;
    this.state = clip;
    this.animator.setBaseAction?.(clip);
    this.animator.mix?.(clip, 0.15, 1);
  }

  _exclusive(clip) {
    if (!clip) return;
    this.exclusive = clip;
    this.animator.setBaseAction?.(clip);
    this.animator.mix?.(clip, 0.05, 1);
    this.animator.onFinish?.((name) => {
      if (name === clip) this.exclusive = null;
    });
  }

  onDestroy() {
    window.removeEventListener('keydown', this._kd);
    window.removeEventListener('keyup', this._ku);
    window.removeEventListener('mousedown', this._md);
    window.removeEventListener('mouseup', this._mu);
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