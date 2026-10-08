import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { base44 } from '@/api/base44Client';
import { retargetAvatarClip } from '@/components/onboarding/retargetAvatarClip';

const NORMALIZE = (value = '') => value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();

const STATE_CANDIDATES = Object.freeze({
  idle: ['unarmed idle 01', 'standing idle 01', 'Idle'],
  walkForward: ['standing walk forward'],
  walkBack: ['standing walk back'],
  walkLeft: ['standing walk left'],
  walkRight: ['standing walk right'],
  runForward: ['standing run forward', 'Run Forward', 'Running'],
  runBack: ['standing run back', 'Running Backward'],
  runLeft: ['standing run left'],
  runRight: ['standing run right'],
  jump: ['Jumping'],
  fall: ['fall a loop'],
  land: ['fall a land to standing idle 01'],
  block: ['standing block'],
  attack1: ['standing melee punch'],
  attack2: ['standing melee kick'],
  roll: ['Sprinting Forward Roll', 'standing dive forward'],
  hurt: ['standing react small from front'],
  death: ['standing death forward 01'],
});

const LOOPING = new Set(['idle', 'walkForward', 'walkBack', 'walkLeft', 'walkRight', 'runForward', 'runBack', 'runLeft', 'runRight', 'fall', 'block']);

function stripRootTranslation(clip) {
  const cloned = clip.clone();
  cloned.tracks = cloned.tracks.filter((track) => {
    if (!/\.position$/i.test(track.name)) return true;
    return !/(hips|pelvis|root|armature)/i.test(track.name);
  });
  cloned.resetDuration();
  return cloned;
}

function exactRow(rows, candidates) {
  for (const candidate of candidates) {
    const normalized = NORMALIZE(candidate);
    const playerRow = rows.find((row) => row.folder === 'player character' && NORMALIZE(row.name) === normalized);
    if (playerRow) return playerRow;
    const anyRow = rows.find((row) => NORMALIZE(row.name) === normalized);
    if (anyRow) return anyRow;
  }
  return null;
}

export async function createYBotJediAnimationAdapter(model) {
  const rows = await base44.entities.AnimationFBX.list('name', 500).catch(() => []);
  const loader = new FBXLoader();
  const mixer = new THREE.AnimationMixer(model);
  const actions = new Map();
  const sources = new Map();

  for (const [state, candidates] of Object.entries(STATE_CANDIDATES)) {
    const row = exactRow(rows, candidates);
    if (!row?.file_url) continue;
    try {
      const source = await loader.loadAsync(row.file_url);
      const sourceClip = source.animations?.[0];
      if (!sourceClip) continue;
      const retargeted = stripRootTranslation(retargetAvatarClip(source, model, sourceClip));
      retargeted.name = `jedi_ybot_${state}`;
      const action = mixer.clipAction(retargeted);
      action.enabled = true;
      action.setEffectiveWeight(1);
      action.setLoop(LOOPING.has(state) ? THREE.LoopRepeat : THREE.LoopOnce, LOOPING.has(state) ? Infinity : 1);
      action.clampWhenFinished = !LOOPING.has(state);
      actions.set(state, action);
      sources.set(state, { name: row.name, file_url: row.file_url });
    } catch (error) {
      console.warn(`Y Bot animation "${state}" could not be loaded:`, error);
    }
  }

  let current = null;
  let currentState = '';
  const play = (state, { fade = 0.12, timeScale = 1, force = false } = {}) => {
    const next = actions.get(state) || actions.get(state.startsWith('run') ? 'runForward' : state.startsWith('walk') ? 'walkForward' : 'idle');
    if (!next) return false;
    if (!force && current === next && currentState === state) return true;
    if (current && current !== next) current.fadeOut(fade);
    next.enabled = true;
    next.setEffectiveTimeScale(timeScale);
    if (!LOOPING.has(state)) {
      next.setLoop(THREE.LoopOnce, 1);
      next.clampWhenFinished = true;
    }
    next.reset().fadeIn(fade).play();
    current = next;
    currentState = state;
    return true;
  };

  play('idle', { force: true });

  return {
    mixer,
    actions,
    sources,
    play,
    has: (state) => actions.has(state),
    getCurrent: () => currentState,
    update: (delta) => mixer.update(delta),
    dispose: () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
    },
  };
}
