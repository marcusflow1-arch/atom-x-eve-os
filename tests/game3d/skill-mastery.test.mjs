// Skill mastery (docs/game3d/SKILL_MASTERY.md): every skill starts at level 1 and levels up by
// being used in a fight, up to level 30, through Base → Master → Demigod → God → Chosen. The level
// feeds every cast. Runs the real executor, buff engine and mastery store (same harness as
// weapon-affinity.test.mjs; only the Base44 service boundary is stubbed), and the server's save check.
import { test, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const temp = await mkdtemp(path.join(tmpdir(), 'axe-skill-mastery-'));
const dom = new JSDOM('', { url: 'http://localhost/' });
Object.assign(globalThis, { window: dom.window, document: dom.window.document,
  localStorage: dom.window.localStorage, CustomEvent: dom.window.CustomEvent });
const intervals = [];
const nativeSetInterval = globalThis.setInterval;
globalThis.setInterval = (...args) => { const timer = nativeSetInterval(...args); intervals.push(timer); return timer; };
const modules = {
  mastery: 'src/components/game3d/skills/skillMasteryStore.jsx', exec: 'src/components/game3d/skills/skillExecutor.jsx',
  buffs: 'src/components/game3d/skills/buffEngine.jsx', storage: 'src/components/game3d/characterStorage.jsx',
  curve: 'base44/shared/skillMastery.ts', rules: 'base44/shared/characterSaveRules.ts',
};
await build({ stdin: { contents: Object.entries(modules).map(([name, file]) =>
  `export * as ${name} from './${file}';`).join('\n'), resolveDir: root },
  bundle: true, jsx: 'automatic', format: 'esm', platform: 'node', outfile: path.join(temp, 'stores.mjs'),
  alias: { '@': path.join(root, 'src') }, define: { 'import.meta.env': '{}' },
  plugins: [{ name: 'offline-service-boundary', setup(b) {
    b.onResolve({ filter: /api\/base44Client/ }, () => ({ path: 'base44-test', namespace: 'offline' }));
    b.onLoad({ filter: /.*/, namespace: 'offline' }, () => ({ contents:
      'export const base44 = { auth: { updateMe: async () => ({}), me: async () => ({}) } };' }));
  } }], logLevel: 'silent',
});
const { mastery, exec, buffs, storage, curve, rules } = await import(pathToFileURL(path.join(temp, 'stores.mjs')));
after(async () => { intervals.forEach(clearInterval); globalThis.setInterval = nativeSetInterval; dom.window.close(); await rm(temp, { recursive: true, force: true }); });

let user = 0;
function fresh() {
  storage.setStorageUser(`mastery-qa-${++user}`);
  Object.keys(buffs.getBuffs()).forEach(buffs.clearBuff);
}
const xp = (id) => mastery.getSkillMastery(id).xp;
const landHit = () => window.dispatchEvent(new CustomEvent('weaponMasteryEvent', { detail: { type: 'ON_HIT', weaponId: 'w', damage: 10 } }));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// run `fn` with performance.now() moved `ms` ahead
function later(ms, fn) {
  const t = performance.now() + ms;
  const clock = mock.method(performance, 'now', () => t);
  try { return fn(); } finally { clock.mock.restore(); }
}
const events = [];
window.addEventListener('skillMasteryEvent', (e) => events.push(e.detail));
const toasts = [];
window.addEventListener('skillActivatedToast', (e) => toasts.push(e.detail.text));

test('the curve: quick first levels, about 20 hours of use to the max, five ranks', () => {
  const { SKILL_MASTERY, skillMasteryXpForLevel: at, skillMasteryLevel: level, skillMasteryRank: rank } = curve;
  assert.equal(level(0), 1);
  assert.ok(at(2) <= 60, 'one buff cast or a few strikes reach level 2');
  for (let l = 2; l <= 30; l++) assert.ok(at(l) > at(l - 1), `level ${l} needs more XP than ${l - 1}`);
  assert.equal(at(30), SKILL_MASTERY.xpToMax);
  assert.equal(level(SKILL_MASTERY.xpToMax), 30);
  assert.equal(level(SKILL_MASTERY.xpToMax - 1), 29);
  assert.ok(at(30) - at(29) > 30 * at(2), 'the last level takes far longer than the first');
  assert.deepEqual([1, 7, 8, 15, 22, 29, 30].map((l) => rank(l).id), ['base', 'base', 'master', 'demigod', 'god', 'god', 'chosen']);
});

test('a new character casts every skill at level 1', () => {
  fresh();
  assert.equal(mastery.getSkillMasteryLevel('aegis_shield'), 1);
  assert.equal(mastery.getSkillMasteryLevel('axe_offensive_skill_2'), 1);
  assert.ok(exec.castSkill('aegis_shield', { maxHP: 1000, slotIndex: 0 }).ok);
  assert.equal(buffs.getBuffs().aegis_shield.level, 1);
  assert.equal(buffs.getBuffs().aegis_shield.values.shield_amount, 50, '5% of 1000 HP at level 1');
});

test('an attack earns its cooldown in XP per cast, split over the strikes that land', async () => {
  fresh();
  const single = 'axe_offensive_skill_2'; // 1 hit, 5 s cooldown
  assert.ok(exec.castSkill(single, { slotIndex: 0 }).ok, 'cast with the starting sword');
  await wait(200);
  landHit();
  assert.equal(xp(single), 5);

  const combo = 'axe_offensive_skill_5'; // 3 hits, 8 s cooldown
  assert.ok(exec.castSkill(combo, { slotIndex: 0 }).ok);
  await wait(450);
  landHit(); landHit(); // two of the three strikes land
  assert.ok(Math.abs(xp(combo) - 8 * 2 / 3) < 1e-9, `two thirds of 8 XP (got ${xp(combo)})`);
});

test('a strike into the air earns nothing, even if a later hit lands', async () => {
  fresh();
  const single = 'axe_offensive_skill_2';
  assert.ok(exec.castSkill(single, { slotIndex: 0 }).ok);
  await wait(200);
  later(1500, landHit); // the strike missed; this hit comes after its window
  assert.equal(xp(single), 0);
});

test('a buff earns once it is up in a fight, not when cast in town', () => {
  fresh();
  exec.castSkill('aegis_shield', { maxHP: 1000, slotIndex: 0 });
  assert.equal(xp('aegis_shield'), 0, 'cast in town');
  mastery.noteCombatActivity(); // a hit taken (CombatMusicTrigger)
  assert.equal(xp('aegis_shield'), 60, 'the 60 s cooldown in XP');
  mastery.noteCombatActivity();
  assert.equal(xp('aegis_shield'), 60, 'once per cast');

  exec.castSkill('aegis_shield', { maxHP: 1000, slotIndex: 0 });
  window.dispatchEvent(new CustomEvent('rogueAITakeDamage', { detail: {} })); // a hit landed on a rogue
  assert.equal(xp('aegis_shield'), 120);

  exec.castSkill('axe_power_charge', { slotIndex: 0 });
  later(25_000, () => mastery.noteCombatActivity()); // Power Charge (20 s) ran out before the fight
  assert.equal(xp('axe_power_charge'), 0);
});

test('a skill spent as a Critical Focus charge (slot 2) earns on the next hit landed', () => {
  fresh();
  const r = exec.castSkill('axe_offensive_skill_4', { slotIndex: 1 });
  assert.ok(r.ok && r.charge);
  landHit();
  assert.equal(xp('axe_offensive_skill_4'), curve.skillMasteryXpPerUse(4 + 4 * 0.8));
});

test('levels feed the cast, level-ups are announced, and the max level stops gaining', () => {
  fresh();
  const at = curve.skillMasteryXpForLevel;
  storage.characterScopedStorage(curve.SKILL_MASTERY_KEY).set(JSON.stringify({ v: 1, xp: { aegis_shield: at(30), heavens_riposte: at(8) - 1 } }));
  storage.notifyCharacterChange();
  assert.deepEqual(mastery.getSkillMastery('aegis_shield').rank.id, 'chosen');
  exec.castSkill('aegis_shield', { maxHP: 1000, slotIndex: 0 });
  assert.equal(buffs.getBuffs().aegis_shield.level, 30);
  assert.equal(buffs.getBuffs().aegis_shield.values.shield_amount, 150, '15% of 1000 HP at level 30');
  mastery.noteCombatActivity();
  assert.equal(xp('aegis_shield'), at(30), 'no XP past the max level');

  events.length = 0; toasts.length = 0;
  exec.castSkill('heavens_riposte', { slotIndex: 0 });
  mastery.noteCombatActivity();
  assert.equal(mastery.getSkillMasteryLevel('heavens_riposte'), 8);
  assert.deepEqual(events, [{ type: 'LEVEL_UP', skillId: 'heavens_riposte', level: 8 }, { type: 'RANK_UP', skillId: 'heavens_riposte', rank: 'master' }]);
  assert.ok(toasts.some((t) => t.includes("Heaven's Riposte reached level 8 — Master")), toasts.join(' | '));
  const riposte = (level) => buffs.activateBuff('heavens_riposte', level).values.reflect_chance;
  assert.ok(riposte(8) > riposte(1), 'a higher level reflects more');
});

test('mastery is saved per character', () => {
  fresh();
  const me = `mastery-qa-${user}`;
  exec.castSkill('aegis_shield', { maxHP: 1000, slotIndex: 0 });
  mastery.noteCombatActivity();
  assert.equal(xp('aegis_shield'), 60);
  fresh();
  assert.equal(xp('aegis_shield'), 0, 'another character starts over');
  storage.setStorageUser(me);
  assert.equal(xp('aegis_shield'), 60, 'reloaded from the save');
});

test('the server keeps real mastery, rejects impossible values and flags gains faster than play', () => {
  const save = (xpMap) => ({ [curve.SKILL_MASTERY_KEY]: JSON.stringify({ v: 1, xp: xpMap }) });
  assert.deepEqual(rules.checkCharacterSave(save({ aegis_shield: 500, axe_offensive_skill_2: 12.5 })).errors, []);
  assert.ok(!rules.checkCharacterSave(save({ aegis_shield: curve.SKILL_MASTERY.xpToMax + 1 })).ok, 'over the max');
  assert.ok(!rules.checkCharacterSave(save({ aegis_shield: -1 })).ok, 'negative');
  assert.ok(!rules.checkCharacterSave({ [curve.SKILL_MASTERY_KEY]: JSON.stringify({ aegis_shield: 5 }) }).ok, 'wrong shape');

  const before = save({ aegis_shield: 100 });
  const fast = rules.checkCharacterSave(save({ aegis_shield: 5100 }), before, { minutesSincePrevious: 2 });
  assert.ok(fast.ok, 'accepted');
  assert.ok(fast.flags.some((f) => f.startsWith('skill_mastery_rate: aegis_shield')), fast.flags.join(' | '));
  const steady = rules.checkCharacterSave(save({ aegis_shield: 1900 }), before, { minutesSincePrevious: 30 });
  assert.deepEqual(steady.flags, [], '60 XP a minute is normal play');
});
