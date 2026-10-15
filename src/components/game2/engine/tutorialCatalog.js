// Data-driven Game 2 training curriculum. Changes to Force.POWERS and bindings appear automatically.
// Other combat systems can register a lesson when they ship a new player-visible move.
import { POWERS, FORCE_HOTKEY_LABELS } from './force.js';

const added = new Map();
export function registerGame2TutorialLesson(lesson) {
  if (!lesson?.id || !lesson?.title || !Array.isArray(lesson.steps) || !lesson.steps.length) throw new Error('Game 2 tutorial lesson needs id, title and steps');
  added.set(lesson.id, { ...lesson });
  return () => { if (added.get(lesson.id)?.title === lesson.title) added.delete(lesson.id); };
}

const fixed = [
  { id: 'draw', title: 'Draw your lightsaber', group: 'Basics', steps: ['Press R to draw and ignite your lightsaber.', 'Watch your character ready the blade.'], goal: 'draw', demo: 'draw' },
  { id: 'attack', title: 'Saber attacks', group: 'Basics', steps: ['Press R to ignite your saber and face the training target.', 'Left-click to perform a real saber swing. Use WASD or a mouse flick to change its direction.'], goal: 'swing', demo: 'attack' },
  { id: 'jump', title: 'Jump & Force Jump', group: 'Basics', steps: ['Press Space to jump.', 'Hold Space to extend into a Force Jump.'], goal: 'jump', demo: 'jump' },
  { id: 'style', title: 'Lightsaber stances', group: 'Basics', kit: 'single', steps: ['Press Tab to switch Fast, Medium, and Strong styles.', 'Each style changes the attacks available.'], goal: 'style', demo: 'style' },
  { id: 'throw', title: 'Saber throw', group: 'Saber techniques', steps: ['Draw your lightsaber with R if needed.', 'Hold right mouse to throw your saber toward the training target.'], goal: 'throw', demo: 'throw' },
  { id: 'kata', title: 'Saber kata', group: 'Saber techniques', steps: ['Draw your lightsaber with R.', 'Press left and right mouse buttons together to perform a full kata (50 Force).'], goal: 'kata', demo: 'kata' },
  { id: 'kick', title: 'Saberstaff kicks', group: 'Saber techniques', kit: 'staff', steps: ['Choose the Double-bladed saber kit in the tutorial menu, then press R to ignite.', 'Hold W, A, S or D while pressing right mouse to kick in that direction.'], goal: 'kick', demo: 'kick' },
  { id: 'taunt', title: 'Taunt', group: 'Basics', steps: ['Stand still with both feet on the floor.', 'Press T to use your side’s taunt animation.'], goal: 'taunt', demo: 'taunt' },
  { id: 'charge-push', title: 'Charged Force Push', group: 'Combos', steps: ['Face the training target.', 'Hold 1 for at least two seconds, then release for a two-handed charged Force Push.'], goal: 'chargedpush', demo: 'charge-push' },
  { id: 'push-speed', title: 'Push → Speed dash', group: 'Combos', steps: ['Cast Force Push with 1 to send the target flying.', 'Quickly press 6 (Force Speed), before the target lands, to intercept them.'], goal: 'pushspeed', demo: 'push-speed' },
  { id: 'pull-push', title: 'Air Pull → Push', group: 'Combos', steps: ['Jump with Space.', 'While airborne, press 2 (Force Pull) to lift the target.', 'Before they fall, press 1 (Force Push) to launch them away.'], goal: 'pullpush', demo: 'pull-push' },
  { id: 'levitate-push', title: 'Levitate → Push', group: 'Combos', steps: ['Face the training target and press G to levitate them.', 'While they are floating, press 1 to launch them away with Force Push.'], goal: 'levitatepush', demo: 'levitate-push' },
  { id: 'throw-lightning', title: 'Saber throw → Lightning', group: 'Combos', steps: ['Hold right mouse to throw your saber.', 'While it spins near the target, hold 4 to channel Lightning into the thrown blade.'], goal: 'chargedblade', demo: 'throw-lightning' },
  { id: 'storm', title: 'Lightning storm', group: 'Combos', steps: ['Face the training target.', 'Hold 4 continuously for at least 1.5 seconds, keeping enough Force to sustain the storm.'], goal: 'storm', demo: 'storm' },
  { id: 'counter', title: 'Parry → Counter', group: 'Combos', steps: ['Press R to ignite your saber; the training target will throw slow, predictable attacks.', 'Block an incoming saber strike to open a counter window.', 'When your foe is staggered, immediately left-click for the critical counter cut.'], goal: 'counter', demo: 'counter' },
  { id: 'repulse', title: 'Force Repulse', group: 'Special abilities', steps: ['The tutorial starts you with a filled special meter.', 'Press X to begin Force Repulse; the burst blasts enemies around you.'], goal: 'repulse', demo: 'repulse' },
  { id: 'dominance', title: 'Mind Dominance', group: 'Special abilities', steps: ['The tutorial fills the special meter for this exercise.', 'Face an enemy with a lightsaber and press V to cast Mind Dominance.'], goal: 'dominance', demo: 'dominance' },
  { id: 'auto-dodge', title: 'Automatic Force Dodge', group: 'Automatic abilities', steps: ['Watch the instructor flash-step aside and leave an afterimage.', 'This is an automatic defensive reaction when a strike passes your guard and you have enough Force. No manual cast exists.'], goal: 'automatic', demo: 'dodge', automatic: true },
];
const description = (p) => {
  const key = FORCE_HOTKEY_LABELS[p.id];
  const cast = key ? `Press ${key}` : `Use the mouse wheel to select ${p.name}, then press F`;
  if (p.id === 'push') return [`${cast} (hold to charge, release to cast).`, 'Aim toward the training target and watch the Force wave.'];
  if (p.hold) return [`${cast} and hold it to channel ${p.name}.`, 'Release the key when you want to stop.'];
  return [`${cast} to activate ${p.name}.`, 'Use the actual in-arena ability and watch its effect.'];
};

export function buildGame2TutorialLessons(game) {
  const kit = game?.player?.saberKit ?? 'single';
  const available = new Set(game?.force?.list || POWERS.map(p => p.id));
  const powers = POWERS.filter(p => available.has(p.id)).map(p => ({
    id: 'power-' + p.id, title: p.name, group: 'Force powers',
    steps: description(p), goal: 'power', powerId: p.id, demo: 'power',
  }));
  const manual = fixed.filter(x => !x.kit || x.kit === kit);
  return [...manual, ...powers, ...added.values()].filter(x => !x.kit || x.kit === kit);
}
