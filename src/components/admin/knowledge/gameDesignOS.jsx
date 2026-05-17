// ─── Game Design OS — Kernel ─────────────────────────────────────────────
// The central backbone all other systems route through:
//   1. System Registry         (GameSystem entity)
//   2. Memory Kernel           (vector retrieval + writeback)
//   3. System Interaction Graph
//   4. Global Rule Engine
//   5. UE5 Translation Hook
//   6. System Creation Pipeline
//   7. Persistence + Versioning
//
// No backend functions are required — the kernel composes existing services:
//   • semanticSearch        (Vector Memory)
//   • smartQueryUnrealKnowledge (Unreal Docs + memory)
//   • translateToUE5Blueprint   (UE5 Translator)

import { base44 } from '@/api/base44Client';
import { smartQueryUnrealKnowledge } from './unrealDocsIndexer';
import { translateToUE5Blueprint }   from './ue5Translator';

// ─── Canon: core stats every system shares ───────────────────────────────
export const CORE_STATS = ['Strength', 'Vitality', 'Dexterity', 'Spirit'];
export const DERIVED_STATS = ['Health', 'Stamina', 'Mana', 'CritChance', 'CritDamage', 'Defense'];

const slug = (s) => String(s || '').toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60);

// ─── 1. Registry ─────────────────────────────────────────────────────────
export async function listSystems() {
  return base44.entities.GameSystem.list('-updated_date', 500);
}
export async function getSystemById(system_id) {
  const arr = await base44.entities.GameSystem.filter({ system_id });
  // Latest version wins (highest version number)
  return arr.sort((a, b) => (b.version || 0) - (a.version || 0))[0] || null;
}
export async function getAllVersions(system_id) {
  const arr = await base44.entities.GameSystem.filter({ system_id });
  return arr.sort((a, b) => (a.version || 0) - (b.version || 0));
}

// ─── 4. Global Rule Engine ───────────────────────────────────────────────
export function validateSystem(candidate, existingRegistry = []) {
  const violations = [];

  if (!candidate.system_id)   violations.push('Missing system_id.');
  if (!candidate.system_name) violations.push('Missing system_name.');
  if (!candidate.system_type) violations.push('Missing system_type.');

  // Rule: no isolated systems — must connect to ≥1 other system.
  const deps   = candidate.dependencies || [];
  const conns  = candidate.connected_systems || [];
  if (deps.length === 0 && conns.length === 0 && existingRegistry.length > 0) {
    violations.push('System is isolated — it must declare at least one dependency or connected_systems entry.');
  }

  // Rule: all referenced systems must exist in registry (or be queued in candidate batch).
  const knownIds = new Set(existingRegistry.map((s) => s.system_id));
  [...deps, ...conns].forEach((id) => {
    if (id !== candidate.system_id && !knownIds.has(id)) {
      violations.push(`References unknown system: "${id}".`);
    }
  });

  // Rule: must reference at least one memory chunk OR UE5 mapping.
  const hasMemory = (candidate.memory_refs || []).length > 0;
  const hasUE5    = candidate.ue5_mapping && Object.values(candidate.ue5_mapping)
                      .some((v) => Array.isArray(v) && v.length > 0);
  if (!hasMemory && !hasUE5) {
    violations.push('System has no grounding — needs at least one memory_ref OR a populated ue5_mapping.');
  }

  // Stat contract sanity: declared reads/writes must be from the canon.
  const allStats = new Set([...CORE_STATS, ...DERIVED_STATS]);
  ['reads', 'writes'].forEach((k) => {
    (candidate.stat_contract?.[k] || []).forEach((stat) => {
      if (!allStats.has(stat)) {
        violations.push(`Stat "${stat}" in stat_contract.${k} is not part of the canon (${[...allStats].join(', ')}).`);
      }
    });
  });

  return {
    passed:     violations.length === 0,
    violations,
    checked_at: new Date().toISOString(),
  };
}

// ─── 3. Interaction Graph ────────────────────────────────────────────────
export function buildInteractionGraph(systems) {
  const nodes = systems.map((s) => ({
    id:    s.system_id,
    label: s.system_name,
    type:  s.system_type,
    status: s.status,
    version: s.version || 1,
  }));
  const edges = [];
  systems.forEach((s) => {
    (s.dependencies || []).forEach((d) => edges.push({ from: s.system_id, to: d, kind: 'dependency' }));
    (s.connected_systems || []).forEach((c) => edges.push({ from: s.system_id, to: c, kind: 'connection' }));
  });
  // Identify isolates (allowed only when registry is otherwise empty)
  const inEdges = new Set();
  edges.forEach((e) => { inEdges.add(e.from); inEdges.add(e.to); });
  const isolated = nodes.filter((n) => !inEdges.has(n.id)).map((n) => n.id);
  return { nodes, edges, isolated };
}

// ─── 2 + 5: Memory + UE5 hooks ───────────────────────────────────────────
async function retrieveContext(prompt) {
  // smartQueryUnrealKnowledge already prefers semantic vector search and
  // falls back to keyword. It returns {chunks, matched_categories, retrieval}.
  return await smartQueryUnrealKnowledge(prompt, { limit: 10 });
}

async function generateUE5Mapping(prompt) {
  const { blueprint } = await translateToUE5Blueprint(prompt, { save: false, limit: 8 });
  const classes = blueprint?.class_architecture || [];
  const bucket = (kindRegex) => classes
    .filter((c) => kindRegex.test(c.kind || ''))
    .map((c) => c.name)
    .filter(Boolean);
  return {
    blueprint,
    mapping: {
      actors:     bucket(/actor/i),
      components: bucket(/component/i),
      blueprints: bucket(/blueprint/i),
      abilities:  bucket(/ability|gas/i),
      ui_widgets: bucket(/widget|umg|ui/i),
    },
  };
}

// ─── 6. System Creation Pipeline ─────────────────────────────────────────
// The single entry point through which all systems must be created.
//
// Steps (enforced in order):
//   1) Registry check    — does system_id exist? capture previous_version_id.
//   2) Memory retrieval  — pull grounding chunks. REQUIRED before generation.
//   3) UE5 pattern match — translate request to architecture.
//   4) Rule validation   — Global Rule Engine.
//   5) Persist           — versioned write to GameSystem; bump version when system_id reused.
//   6) Writeback         — register memory_refs into the candidate.
export async function createSystemThroughKernel(input, { progress } = {}) {
  const log = (step, msg) => progress && progress({ step, msg });

  const {
    system_id: rawId,
    system_name,
    system_type = 'other',
    summary = '',
    dependencies = [],
    connected_systems = [],
    stat_contract = { reads: [], writes: [] },
    source_origin = 'kernel_generated',
    prompt,
  } = input;

  const system_id = slug(rawId || system_name);
  if (!system_id) throw new Error('A system_id or system_name is required.');
  if (!system_name) throw new Error('A system_name is required.');

  // ── Step 1: Registry check ─────────────────────────────────────────────
  log(1, 'Registry check…');
  const registry  = await listSystems();
  const previous  = registry.find((s) => s.system_id === system_id) || null;
  const nextVer   = previous ? (previous.version || 1) + 1 : 1;

  // ── Step 2: Vector memory retrieval (REQUIRED before generation) ───────
  log(2, 'Vector memory retrieval…');
  const ctx = await retrieveContext(prompt || `${system_name}. ${summary}`);
  const memory_refs = (ctx.chunks || []).map((c) => c.id).filter(Boolean);

  // ── Step 3: UE5 translation hook ───────────────────────────────────────
  log(3, 'UE5 translation hook…');
  const { blueprint, mapping: ue5_mapping } = await generateUE5Mapping(
    prompt || `${system_name}: ${summary}. Type: ${system_type}.`
  );

  // ── Step 4: Rule validation ────────────────────────────────────────────
  log(4, 'Rule engine validation…');
  const candidate = {
    system_id,
    system_name,
    system_type,
    summary,
    dependencies,
    connected_systems,
    version: nextVer,
    source_origin,
    memory_refs,
    ue5_mapping,
    stat_contract,
    architecture_payload: blueprint,
    previous_version_id: previous?.id || '',
    status: 'draft',
  };
  const rule_validation = validateSystem(candidate, registry);
  candidate.rule_validation = rule_validation;
  candidate.status = rule_validation.passed ? 'validated' : 'draft';

  // ── Step 5: Persist (versioned, never overwrite) ───────────────────────
  log(5, 'Persisting to registry…');
  if (previous) {
    // Mark previous active record as deprecated to preserve history without deletion.
    try { await base44.entities.GameSystem.update(previous.id, { status: 'deprecated' }); } catch {}
  }
  const saved = await base44.entities.GameSystem.create(candidate);

  log(6, 'Done.');
  return { saved, validation: rule_validation, previous, retrieval: ctx };
}

// ─── Activate a validated draft ──────────────────────────────────────────
export async function activateSystem(recordId) {
  return base44.entities.GameSystem.update(recordId, { status: 'active' });
}