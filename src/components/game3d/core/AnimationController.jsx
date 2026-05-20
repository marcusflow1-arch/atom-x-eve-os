import * as THREE from 'three';

export class AnimationController {
  constructor(mixer, actions = {}, { fadeDuration = 0.2 } = {}) {
    this.mixer = mixer;
    this.actions = actions;
    this.current = null;
    this.fadeDuration = fadeDuration;
  }

  setActions(actions = {}) {
    this.actions = actions;
  }

  play(name, options = {}) {
    if (!name || this.current === name) return false;
    const next = this.actions[name];
    if (!next) return false;

    const currentAction = this.current ? this.actions[this.current] : null;
    if (currentAction && currentAction !== next) {
      currentAction.fadeOut(options.fadeOut ?? this.fadeDuration);
    }

    next.enabled = true;
    next.setEffectiveWeight(options.weight ?? 1);
    next.setEffectiveTimeScale(options.timeScale ?? 1);
    next.reset().fadeIn(options.fadeIn ?? this.fadeDuration).play();
    this.current = name;
    return true;
  }

  playOneShot(name, options = {}) {
    const action = this.actions[name];
    if (!action) return false;
    action.enabled = true;
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.reset().fadeIn(options.fadeIn ?? 0.1).play();
    return true;
  }

  update(delta) {
    this.mixer?.update?.(delta);
  }
}