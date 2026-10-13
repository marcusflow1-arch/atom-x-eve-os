import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROLES = Object.freeze({
  project_manager: ['docs/game5/'],
  quest_npc: ['src/game5/quests/', 'tests/game5/quests/'],
  qa_security: ['tests/game5/', 'docs/game5/qa/'],
});
const ALLOWED = new Set(['planned', 'ready']);
const ID = /^G5-[0-9]{4,}$/;

export function planTask(task, completedIds = []) {
  if (!task || task.schema_version !== 'game5.task.v1') throw Error('Unsupported task schema');
  if (!ID.test(task.task_id ?? '')) throw Error('Invalid task id');
  if (!Object.hasOwn(ROLES, task.agent_role)) throw Error('Unknown agent role');
  if (!ALLOWED.has(task.status)) throw Error('Task is not dispatchable');
  if (!Array.isArray(task.depends_on) || !Array.isArray(task.allowed_paths) || !Array.isArray(task.acceptance_tests)) throw Error('Required arrays missing');
  if (task.acceptance_tests.length === 0 || task.acceptance_tests.some(t => typeof t !== 'string' || !t.trim())) throw Error('Missing acceptance tests');
  if (task.allowed_paths.length === 0 || task.allowed_paths.some(path => typeof path !== 'string' || path.startsWith('/') || path.includes('..') || !ROLES[task.agent_role].some(prefix => path.startsWith(prefix)))) throw Error('Unauthorized path');
  if (task.depends_on.includes(task.task_id) || task.depends_on.some(id => !ID.test(id))) throw Error('Invalid dependencies');
  const completed = new Set(completedIds);
  const missing = task.depends_on.filter(id => !completed.has(id));
  return { task_id: task.task_id, role: task.agent_role, next_status: missing.length ? 'blocked' : 'ready',
    missing_dependencies: missing, action: missing.length ? 'no_dispatch' : 'simulate_worker_handoff',
    assignment: { title: task.title, allowed_paths: task.allowed_paths, acceptance_tests: task.acceptance_tests },
    execution: 'dry_run_only', code_written: false, tests_executed: false, qa_passed: false,
    requires_owner_approval: true };
}

export function simulateHandoff(task) {
  const plan = planTask(task);
  if (plan.next_status !== 'ready') return plan;
  return { ...plan, handoff_chain: [
    { role: 'project_manager', status: 'task_prepared' },
    { role: task.agent_role, status: 'assignment_queued_simulated' },
    { role: 'qa_security', status: 'awaiting_real_worker_result' },
    { role: 'project_manager', status: 'awaiting_owner_approval' }
  ] };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const filename = process.argv[2];
    if (!filename) throw Error('Usage: node tools/game5/dispatcher.mjs path/to/task.json');
    const task = JSON.parse(readFileSync(filename, 'utf8'));
    process.stdout.write(JSON.stringify(simulateHandoff(task), null, 2) + '\n');
  } catch (e) {
    process.stderr.write('Game 5 dispatcher: ' + e.message + '\n');
    process.exitCode = 1;
  }
}
