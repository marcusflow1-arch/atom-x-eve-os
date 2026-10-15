import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame, addFoe, run } from './support/game2Sim.mjs';
import { POWERS } from '../src/components/game2/engine/force.js';
import { registerGame2TutorialLesson, buildGame2TutorialLessons } from '../src/components/game2/engine/tutorialCatalog.js';
import { Game2TutorialDirector } from '../src/components/game2/engine/tutorial.js';

function setup() {
  const g = makeGame();
  const target = addFoe(g, [0, 0, 5], { hp: 500 });
  const trainer = addFoe(g, [2, 0, 0], { hp: 500 });
  trainer.team = 'ally';
  g.tutorialTarget = target; g.tutorialTrainer = trainer; g.boss = target;
  g.aiOff = true; g.openArena = true;
  const director = new Game2TutorialDirector(g);
  g.tutorial = director;
  return { g, director, trainer, target };
}

test('curriculum discovers every currently selectable Force power, without a hardcoded list', () => {
  const { g, director } = setup();
  const ids = director.lessons().map(l => l.id);
  for (const p of POWERS.filter(x => g.force.list.includes(x.id))) {
    assert.ok(ids.includes('power-' + p.id), p.id + ' should have instructions');
  }
  assert.ok(ids.includes('auto-dodge'));
  assert.ok(ids.includes('push-speed'));
  assert.ok(!ids.includes('kick'), 'staff kick is only available with a staff');
  g.player.setSaberKit('staff');
  assert.ok(buildGame2TutorialLessons(g).some(x => x.id === 'kick'));
});

test('new combat features can register and unregister a tutorial lesson', () => {
  const { director } = setup();
  const unregister = registerGame2TutorialLesson({
    id: 'mod-training', title: 'Modded power', group: 'Force powers',
    steps: ['Cast with the custom binding.'], goal: 'power', powerId: 'mod-power', demo: 'power',
  });
  assert.ok(director.lessons().some(x => x.id === 'mod-training'));
  unregister();
  assert.ok(!director.lessons().some(x => x.id === 'mod-training'));
});

test('AI-only reactions can be demonstrated but never offer manual practice', () => {
  const { director, g } = setup();
  director.select('auto-dodge');
  assert.equal(director.practice(), false);
  director.demo();
  assert.equal(director.phase, 'demo');
  run(g, 220);
  assert.equal(director.phase, 'complete');
  assert.ok(director.completed.has('auto-dodge'));
});

test('player must actually cast a power to complete its lesson', () => {
  const { g, director } = setup();
  director.select('power-speed'); director.practice();
  director.update();
  assert.equal(director.phase, 'practice', 'no success on selecting or reading the directions');
  assert.equal(g.force.cast('speed'), true, 'the actual Force implementation casts the ability');
  director.update();
  assert.equal(director.phase, 'complete');
  assert.ok(director.completed.has('power-speed'));
});

test('an unrelated cast does not complete a multi-part combo', () => {
  const { g, director } = setup();
  director.select('push-speed'); director.practice();
  g.force.cast('speed');
  director.update();
  assert.equal(director.phase, 'practice');
  director.select('push-speed');
  assert.equal(director.events.length, 0, 'changing lessons clears combo evidence');
});

test('automatic technique never passes without an AI demonstration', () => {
  const { director } = setup();
  director.select('auto-dodge'); director.update();
  assert.equal(director.phase, 'select');
  assert.ok(!director.completed.has('auto-dodge'));
});
