import test from 'node:test';
import assert from 'node:assert/strict';
import { planTask, simulateHandoff } from './dispatcher.mjs';
const task = { schema_version: 'game5.task.v1', task_id: 'G5-0001',
  title: 'Retrieve the Lost Card', agent_role: 'quest_npc', status: 'planned',
  depends_on: [], allowed_paths: ['src/game5/quests/**'],
  acceptance_tests: ['collect advances once', 'reward granted once'] };
test('PM→specialist→QA dry-run is explicit simulation', () => {
  const r = simulateHandoff(task);
  assert.deepEqual(r.handoff_chain.map(x => x.role), ['project_manager', 'quest_npc', 'qa_security', 'project_manager']);
  assert.equal(r.execution, 'dry_run_only');
  assert.equal(r.qa_passed, false);
});
test('blocked dependencies prevent dispatch', () => {
  const r = planTask({ ...task, depends_on: ['G5-0002'] });
  assert.equal(r.next_status, 'blocked');
  assert.equal(r.action, 'no_dispatch');
});
test('rejects role and scope escalation', () => {
  assert.throws(() => planTask({ ...task, agent_role: 'admin' }), /Unknown/);
  assert.throws(() => planTask({ ...task, allowed_paths: ['src/pages/Game2.jsx'] }), /Unauthorized/);
  assert.throws(() => planTask({ ...task, allowed_paths: ['src/game5/quests/../../pages/'] }), /Unauthorized/);
});
test('rejects empty test coverage', () => assert.throws(() => planTask({ ...task, acceptance_tests: [] }), /acceptance/));
