// Slice C — animation crossfade controller for a single remote player.
// Holds a THREE.AnimationMixer + named AnimationActions and crossfades
// smoothly between idle / walk / run / jump / fall / crouch / attack
// based on the latest network-provided `anim` string.

const CROSSFADE_S = 0.2;

export function createNetworkRemoteAnimator(mixer, clipMap) {
  // clipMap: { idle: AnimationClip, walk?: ..., run?: ..., jump?: ..., ... }
  const actions = {};
  Object.entries(clipMap || {}).forEach(([name, clip]) => {
    if (!clip) return;
    actions[name] = mixer.clipAction(clip);
  });

  let current = null;

  function play(name) {
    // Normalize aliases — the local player uses 'walk'/'run', some pipelines emit 'sprint' etc.
    const aliased =
      name === 'sprint' ? 'run' :
      name === 'falling' ? 'fall' :
      name;

    // Fallback chain — prefer requested anim, fall back through sensible defaults.
    const candidates = [aliased, aliased === 'run' ? 'walk' : null, 'idle'].filter(Boolean);
    let target = null;
    for (const c of candidates) {
      if (actions[c]) { target = c; break; }
    }
    if (!target || target === current) return;

    const next = actions[target];
    const prev = actions[current];
    next.reset().fadeIn(CROSSFADE_S).play();
    if (prev) prev.fadeOut(CROSSFADE_S);
    current = target;
  }

  function update(dt) {
    mixer.update(dt);
  }

  function getCurrent() { return current; }

  function dispose() {
    try { mixer.stopAllAction(); } catch {}
  }

  return { play, update, getCurrent, dispose };
}