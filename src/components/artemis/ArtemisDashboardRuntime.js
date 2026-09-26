import * as THREE from 'three';

const ABILITY_EVENTS = {
  Call_Of_The_Husky: { impact: 1.5, end: 2.0 },
  Rain_Of_Arrows: { impact: 1.967, end: 3.0 },
  Lunar_Beam: { impact: 3.1, end: 3.6 },
};

const LOOP_CLIPS = new Set(['Idle', 'Combat_Idle']);

/**
 * Runtime adapter for the authored Artemis GLB.
 *
 * The model, skeleton, bow and skill VFX are one package. We therefore never
 * retarget these attacks onto another body. A female Artemis card selects the
 * matching embedded clip, Bow_Draw is inserted automatically when needed, and
 * the character settles into Combat_Idle before sheathing back to Idle.
 */
export class ArtemisDashboardRuntime {
  constructor({ root, mixer, animations = [], onEvent, relaxAfter = 6 }) {
    this.root = root;
    this.mixer = mixer;
    this.onEvent = onEvent;
    this.relaxAfter = Math.max(0, Number(relaxAfter) || 0);
    this.clips = new Map((animations || []).filter(Boolean).map((clip) => [clip.name, clip]));
    this.actions = new Map();
    this.action = null;
    this.actionName = '';
    this.home = 'Idle';
    this.busy = false;
    this.queued = null;
    this.cast = null;
    this.firedImpact = false;
    this.calmFor = 0;
    this.disposed = false;

    this._onFinished = (event) => {
      if (this.disposed || event.action !== this.action) return;
      this._finishCurrent();
    };
    this.mixer.addEventListener('finished', this._onFinished);

    this._prepareMaterials();
    this.playIdle(true);
  }

  _prepareMaterials() {
    const seen = new Set();
    this.root?.traverse?.((node) => {
      if (!node?.isMesh) return;
      if (node.isSkinnedMesh) node.frustumCulled = false;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      let effectMesh = false;
      materials.filter(Boolean).forEach((material) => {
        if (seen.has(material)) return;
        seen.add(material);
        const name = String(material.name || '');
        if (!/^FX/i.test(name)) return;
        effectMesh = true;
        material.transparent = true;
        material.depthWrite = false;
        material.toneMapped = false;
        if (/^FX_/i.test(name)) material.blending = THREE.AdditiveBlending;
        material.needsUpdate = true;
      });
      if (effectMesh) node.renderOrder = 3;
    });
  }

  hasClip(name) {
    return this.clips.has(String(name || ''));
  }

  clipNames() {
    return [...this.clips.keys()];
  }

  _actionFor(name) {
    const clip = this.clips.get(name);
    if (!clip) return null;
    if (!this.actions.has(name)) {
      const next = this.mixer.clipAction(clip);
      if (LOOP_CLIPS.has(name)) next.setLoop(THREE.LoopRepeat, Infinity);
      else {
        next.setLoop(THREE.LoopOnce, 1);
        next.clampWhenFinished = true;
      }
      this.actions.set(name, next);
    }
    return this.actions.get(name);
  }

  _crossFade(name, fade = 0.16) {
    const next = this._actionFor(name);
    if (!next) return false;
    const previous = this.action;
    next.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).play();
    if (previous && previous !== next) previous.crossFadeTo(next, fade, false);
    this.action = next;
    this.actionName = name;
    return true;
  }

  _emit(name, extra = {}) {
    try {
      this.onEvent?.(name, {
        effectId: this.cast?.effectId || '',
        clipName: this.cast?.clipName || this.actionName,
        card: this.cast?.detail?.card || null,
        target: this.cast?.detail?.target || null,
        damage: this.cast?.detail?.target?.damage,
        autoHit: this.cast?.detail?.target?.autoHit !== false,
        ...extra,
      });
    } catch (error) {
      console.warn('[Artemis] event callback failed', error);
    }
  }

  playIdle(immediate = false) {
    // Movement/key-up handlers may ask the avatar to return to Idle while an
    // authored card animation is still running. Never let that interrupt a cast.
    if (!immediate && this.isPlaying()) return false;
    this.busy = false;
    this.queued = null;
    this.cast = null;
    this.firedImpact = false;
    this.home = 'Idle';
    this.calmFor = 0;
    return this._crossFade('Idle', immediate ? 0 : 0.24);
  }

  playCombatIdle() {
    this.busy = false;
    this.queued = null;
    this.cast = null;
    this.firedImpact = false;
    this.home = this.hasClip('Combat_Idle') ? 'Combat_Idle' : 'Idle';
    this.calmFor = 0;
    return this._crossFade(this.home, 0.2);
  }

  _beginAbility(request) {
    const clipName = request?.clipName;
    if (!clipName || !this.hasClip(clipName)) return false;
    this.cast = request;
    this.busy = true;
    this.firedImpact = false;
    this.calmFor = 0;
    if (!this._crossFade(clipName, 0.1)) {
      this.busy = false;
      this.cast = null;
      return false;
    }
    this._emit('start');
    return true;
  }

  playEffect(effect, detail = {}) {
    if (this.disposed || this.busy) return false;
    const effectId = String(effect?.id || '').toLowerCase();
    if (!effectId.startsWith('artemis_')) return false;
    const clipName = String(effect?.clip_name || effect?.clipName || '');
    if (!this.hasClip(clipName)) {
      console.warn(`[Artemis] embedded clip not found: ${clipName}`);
      return false;
    }

    const request = { effectId, clipName, effect, detail };
    if (this.home === 'Idle' && this.hasClip('Bow_Draw')) {
      this.busy = true;
      this.queued = request;
      this._crossFade('Bow_Draw', 0.12);
      return true;
    }
    return this._beginAbility(request);
  }

  _finishCurrent() {
    const finished = this.actionName;

    if (finished === 'Bow_Draw' && this.queued) {
      const request = this.queued;
      this.queued = null;
      this.home = this.hasClip('Combat_Idle') ? 'Combat_Idle' : 'Idle';
      this.busy = false;
      this._beginAbility(request);
      return;
    }

    if (finished === 'Bow_Sheathe') {
      this.playIdle();
      return;
    }

    if (this.cast && finished === this.cast.clipName) {
      if (!this.firedImpact) {
        this.firedImpact = true;
        this._emit('impact');
      }
      this._emit('end');
      this.playCombatIdle();
      return;
    }

    if (!LOOP_CLIPS.has(finished)) this.playCombatIdle();
  }

  update(dt) {
    if (this.disposed) return;
    if (this.cast && this.action) {
      const event = ABILITY_EVENTS[this.cast.clipName];
      if (event && !this.firedImpact && this.action.time >= event.impact) {
        this.firedImpact = true;
        this._emit('impact');
      }
      return;
    }

    if (!this.busy && this.home === 'Combat_Idle' && this.relaxAfter > 0) {
      this.calmFor += Math.max(0, Number(dt) || 0);
      if (this.calmFor >= this.relaxAfter && this.hasClip('Bow_Sheathe')) {
        this.busy = true;
        this.calmFor = 0;
        this._crossFade('Bow_Sheathe', 0.15);
      }
    }
  }

  isPlaying() {
    return this.busy || Boolean(this.cast);
  }

  dispose() {
    this.disposed = true;
    this.mixer?.removeEventListener?.('finished', this._onFinished);
    this.actions.forEach((action) => action.stop());
    this.actions.clear();
    this.cast = null;
    this.queued = null;
  }
}
