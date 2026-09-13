import { AnimationUtils, LoopOnce, LoopRepeat } from 'three';

export const HI3D_MODEL_URL = '/models/luna-hi3d/warrior.glb';
export const HI3D_COMMANDS = [
  { command: 'idle', label: 'Idle' }, { command: 'afk', label: 'AFK' },
  { command: 'wave', label: 'Wave' }, { command: 'walk', label: 'Walk' },
  { command: 'sit', label: 'Sit' }, { command: 'lean', label: 'Lean back' },
  { command: 'stand', label: 'Stand' },
];

const commandClips = { idle: 'Idle', afk: 'AFK', wave: 'Wave', walk: 'Walk', stand: 'Idle' };
const transitions = {
  Sit_Down: 'sitting', Stand_Up: 'standing', Lean_Back: 'reclined', Sit_Forward: 'sitting',
};
const required = ['Idle', 'AFK', 'Wave', 'Walk', 'Arm_Raise', 'Sit_Down', 'Sit_Idle', 'Lean_Back', 'Lean_Back_Idle', 'Sit_Forward', 'Stand_Up'];

/** Plays this asset's own skeleton clips; seated transitions complete before locomotion. */
export function createEmbeddedAvatarController(model, clips, mixer, onChange = () => {}) {
  const available = new Map(clips.map(clip => [clip.name, clip]));
  const missing = required.filter(name => !available.has(name));
  if (missing.length) throw new Error(`Hi3D animation clips missing: ${missing.join(', ')}`);
  let action = null, active = '', posture = 'standing', desired = 'idle', transitioning = false;
  let disposed = false, armAction = null, armLift = 0;
  const snapshot = () => ({ clip: active, posture, transitioning, command: desired, armLift });
  const notify = () => onChange(snapshot());

  function start(name) {
    if (active === name && action?.isRunning()) return;
    const next = mixer.clipAction(available.get(name), model);
    const once = Boolean(transitions[name]) || name === 'Wave';
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1);
    next.setLoop(once ? LoopOnce : LoopRepeat, once ? 1 : Infinity);
    next.clampWhenFinished = once;
    if (action && action !== next) action.fadeOut(.22);
    next.fadeIn(action ? .22 : 0).play();
    action = next; active = name; transitioning = Boolean(transitions[name]);
    notify();
  }

  function reconcile() {
    if (disposed || transitioning) return;
    if (desired === 'lean') {
      start(posture === 'standing' ? 'Sit_Down' : posture === 'sitting' ? 'Lean_Back' : 'Lean_Back_Idle');
    } else if (desired === 'sit') {
      start(posture === 'standing' ? 'Sit_Down' : posture === 'reclined' ? 'Sit_Forward' : 'Sit_Idle');
    } else if (posture === 'reclined') start('Sit_Forward');
    else if (posture === 'sitting') start('Stand_Up');
    else start(commandClips[desired] || 'Idle');
  }

  function onFinished(event) {
    if (disposed || event.action !== action) return;
    if (transitions[active]) { posture = transitions[active]; transitioning = false; }
    else if (active === 'Wave' && desired === 'wave') desired = 'idle';
    reconcile();
  }
  mixer.addEventListener('finished', onFinished);

  function clearArm() {
    if (armAction && armLift) armAction.fadeOut(.15);
    armLift = 0;
  }
  function command(value) {
    if (disposed || !HI3D_COMMANDS.some(item => item.command === value)) return;
    desired = value; clearArm(); reconcile(); notify();
  }
  function setArmLift(value) {
    if (disposed || posture !== 'standing' || transitioning) return false;
    desired = 'idle'; reconcile();
    if (!armAction) {
      const clip = available.get('Arm_Raise').clone();
      clip.name = 'Manual_Right_Arm';
      clip.tracks = clip.tracks.filter(track => /Right(UpperArm|ForeArm|Hand)\.quaternion$/.test(track.name));
      AnimationUtils.makeClipAdditive(clip);
      armAction = mixer.clipAction(clip, model);
      armAction.setLoop(LoopOnce, 1); armAction.clampWhenFinished = true;
    }
    armLift = Math.max(0, Math.min(1, Number(value) || 0));
    armAction.stopFading().setEffectiveWeight(armLift ? 1 : 0).play();
    armAction.paused = true;
    armAction.time = armLift * armAction.getClip().duration;
    mixer.update(0); notify(); return true;
  }
  start('Idle');
  return {
    command, setArmLift, snapshot,
    canMove: () => !disposed && !transitioning && posture === 'standing' && active === 'Walk',
    dispose: () => { disposed = true; mixer.removeEventListener('finished', onFinished); armAction?.stop(); },
  };
}
