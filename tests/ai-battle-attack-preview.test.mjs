import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeAttackPreview, isAttackPreview, PREVIEW_KINDS } from '../src/components/battle/attackPreview.js';

test('skill previews contain a cast ID and animation identity but no server-owned hit data', () => {
  const packet = makeAttackPreview({ type: 'skill', matchId: 'arena-1', castId: 'cast-1', slot: 3, effectId: 'chidori' });
  assert.deepEqual(packet, {
    kind: PREVIEW_KINDS.skill, matchId: 'arena-1', cast_id: 'cast-1', slot: 3, effect_id: 'chidori',
  });
  for (const field of ['damage','crit','missed','stun_ms','hp','turn','resolves_at','atb','cooldown']) {
    assert.equal(Object.hasOwn(packet, field), false, field + ' must be server-authoritative');
  }
  assert.equal(isAttackPreview(packet.kind), true);
  assert.equal(isAttackPreview('pvp_cast'), false);
});

test('melee previews contain only routing keys and never send a predicted hit', () => {
  assert.deepEqual(makeAttackPreview({ type: 'melee', matchId: 'arena-1', castId: 'cast-2' }), {
    kind: PREVIEW_KINDS.melee, matchId: 'arena-1', cast_id: 'cast-2',
  });
});

test('invalid preview requests are rejected before broadcast', () => {
  for (const packet of [
    { type: 'bad', matchId: 'm', castId: 'c' },
    { type: 'melee', matchId: '', castId: 'c' },
    { type: 'skill', matchId: 'm', castId: '', slot: 1 },
    { type: 'skill', matchId: 'm', castId: 'c', slot: -1 },
    { type: 'skill', matchId: 'm', castId: 'c', slot: 'unknown' },
  ]) assert.equal(makeAttackPreview(packet), null);
});

test('attack animation sends before awaiting server, confirmation still follows', () => {
  const arena = readFileSync(new URL('../src/components/battle/PvPArenaStage.jsx', import.meta.url), 'utf8');
  const skills = arena.slice(arena.indexOf('const requestSkill ='), arena.indexOf('requestSkillRef.current ='));
  const melee = arena.slice(arena.indexOf('const requestMelee ='), arena.indexOf('requestMeleeRef.current ='));
  assert.ok(skills.indexOf("makeAttackPreview({ type: 'skill'") < skills.indexOf("await invoke('use_skill'"));
  assert.ok(melee.indexOf("makeAttackPreview({ type: 'melee'") < melee.indexOf("await invoke('basic_attack'"));
  assert.ok(skills.includes("kind: 'pvp_cast'"), 'server confirmation still publishes');
  assert.ok(melee.includes("kind: 'pvp_melee'"), 'server confirmation still publishes');
});

test('preview is handled only as a peer-side animation, without requesting a new backend poll', () => {
  const queue = readFileSync(new URL('../src/components/battle/useAIBattleQueue.js', import.meta.url), 'utf8');
  assert.ok(queue.includes("const preview = isAttackPreview(kind)"));
  assert.ok(queue.includes("if (!preview) refreshSignal.current?.()"));
  const arena = readFileSync(new URL('../src/components/battle/PvPArenaStage.jsx', import.meta.url), 'utf8');
  assert.ok(arena.includes("predictedRemoteCasts.current.has(id)"), 'repeated previews must not restart animations');
  assert.ok(arena.includes("predictedRemoteCasts.current.delete(castId)"), 'server acknowledgments must reuse previews');
  assert.ok(arena.includes("if (d.kind === PREVIEW_KINDS.melee)"));
});
