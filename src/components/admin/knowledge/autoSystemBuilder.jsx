// ─── AUTO SYSTEM BUILDER — UE5 Game System Factory ──────────────────────
// Single entry point that converts ANY gameplay idea into a complete,
// interconnected UE5 system module. It composes the existing engines
// (no duplication, no backend functions):
//
//   1. SYSTEM CLASSIFICATION       — classify request into UE5 buckets.
//   2. VECTOR MEMORY RETRIEVAL     — mandatory grounding before generation.
//   3. UE5 ARCHITECTURE TRANSLATE  — ue5Translator → class/flow/data/UI.
//   4. BLUEPRINT EXECUTION PLAN    — blueprintGenerator → node-level graphs.
//   5. GAS ARCHITECTURE (if combat/skill) — gasDesigner → abilities/effects.
//   6. KERNEL REGISTRATION         — gameDesignOS → versioned, validated.
//   7. SELF-IMPROVING WRITEBACK    — translator persists, kernel saves refs.
//
// Output is one unified "system module" payload + the kernel record.

import { base44 } from '@/api/base44Client';
import { translateToUE5Blueprint } from './ue5Translator';
import { generateBlueprintPlan }   from './blueprintGenerator';
import { designGASSystem }         from './gasDesigner';
import { createSystemThroughKernel } from './gameDesignOS';

// ─── 1. CLASSIFIER ───────────────────────────────────────────────────────
// Heuristic first (fast, deterministic), LLM refinement only if ambiguous.
const TYPE_RULES = [
  { type: 'combat',      gas: true,  match: /\b(combat|damage|hit|attack|weapon|strike|fight)\b/i },
  { type: 'skills',      gas: true,  match: /\b(skill|ability|spell|cast|cooldown|fireball|halo|aura)\b/i },
  { type: 'abilities',   gas: true,  match: /\b(passive|buff|debuff|stance|talent)\b/i },
  { type: 'progression', gas: false, match: /\b(progression|level|xp|experience|mastery|evolution|rank)\b/i },
  { type: 'inventory',   gas: false, match: /\b(inventory|item|loot|stash|bag|drop)\b/i },
  { type: 'equipment',   gas: false, match: /\b(equip|gear|armor|slot|loadout|enchant|upgrade)\b/i },
  { type: 'weapons',     gas: true,  match: /\b(weapon|sword|bow|staff|dagger|gun)\b/i },
  { type: 'titles',      gas: false, match: /\b(title|prestige|rank\s*name)\b/i },
  { type: 'halos',       gas: true,  match: /\b(halo|aura\s*field|orbit\s*buff)\b/i },
  { type: 'companions',  gas: true,  match: /\b(companion|pet|summon|familiar|minion)\b/i },
  { type: 'ai',          gas: false, match: /\b(ai|enemy|npc|behavior\s*tree|aggro)\b/i },
  { type: 'movement',    gas: false, match: /\b(movement|locomotion|dash|jump|sprint|climb)\b/i },
  { type: 'input',       gas: false, match: /\b(input|keybind|control\s*scheme)\b/i },
  { type: 'audio',       gas: false, match: /\b(audio|sound|sfx|music|voice)\b/i },
  { type: 'vfx',         gas: false, match: /\b(vfx|particle|niagara|effect\s*system)\b/i },
  { type: 'economy',     gas: false, match: /\b(economy|currency|gold|market|shop|trade)\b/i },
  { type: 'social',      gas: false, match: /\b(social|friend|party|clan|guild|chat)\b/i },
  { type: 'networking',  gas: false, match: /\b(network|replication|multiplayer|server|rpc)\b/i },
  { type: 'ui',          gas: false, match: /\b(ui|hud|widget|menu|umg|overlay)\b/i },
  { type: 'data',        gas: false, match: /\b(data\s*table|struct|curve|save\s*game)\b/i },
];

const COMPLEXITY_HINTS = [
  { level: 'hybrid', match: /\b(full|entire|complete|whole)\s+(system|loop|pipeline)\b|\bmmo\b|\bsynergy\b|\bend\s*to\s*end\b/i },
  { level: 'high',   match: /\b(progression|evolution|tree|chain|stacking|multi)\b/i },
];

export function classifyRequest(prompt) {
  const text = String(prompt || '').trim();
  const hits = TYPE_RULES.filter((r) => r.match.test(text));
  const primary = hits[0]?.type || 'other';
  const secondary = hits.slice(1, 4).map((h) => h.type);
  const hybrid = hits.length >= 2;

  const gasRequired = hits.some((h) => h.gas);

  let complexity = 'standard';
  for (const c of COMPLEXITY_HINTS) if (c.match.test(text)) { complexity = c.level; break; }
  if (hybrid && complexity === 'standard') complexity = 'high';

  // Suggest a slug from the first 6 meaningful words.
  const slugBase = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !/^(a|an|the|of|for|with|and|or|to|my|make|build|design|create)$/.test(w))
    .slice(0, 6)
    .join('_')
    .slice(0, 50) || `system_${Date.now()}`;

  return {
    primary_type: primary,
    secondary_types: secondary,
    hybrid,
    gas_required: gasRequired,
    complexity,
    suggested_system_id: slugBase,
    suggested_name: deriveName(text),
  };
}

function deriveName(text) {
  const cleaned = text
    .replace(/^(create|build|design|make|generate|please|i\s+want|i\s+need)\s+(a|an|the|my)?\s*/i, '')
    .replace(/\s+system\b.*$/i, ' System')
    .trim();
  const short = cleaned.slice(0, 60);
  return short.charAt(0).toUpperCase() + short.slice(1);
}

// ─── 2. ORCHESTRATOR ─────────────────────────────────────────────────────
// Runs the full factory pipeline. Emits progress events via onStep(name, status, detail).
export async function buildSystemFromIdea(rawPrompt, { onStep, overrides = {} } = {}) {
  const emit = (name, status, detail) => onStep && onStep({ name, status, detail });

  const prompt = String(rawPrompt || '').trim();
  if (!prompt) throw new Error('Describe the system you want to build.');

  // ─ Step 1: Classify ─────────────────────────────────────────────────
  emit('Classify', 'running', 'Parsing request…');
  const classification = classifyRequest(prompt);
  emit('Classify', 'done',
    `${classification.primary_type}${classification.hybrid ? ' (hybrid)' : ''} · ${classification.complexity}${classification.gas_required ? ' · GAS' : ''}`);

  // ─ Step 2 + 3: UE5 architecture (handles memory retrieval internally) ─
  emit('Architect', 'running', 'Retrieving vector memory + Unreal docs…');
  const translation = await translateToUE5Blueprint(prompt, { save: false, limit: 12 });
  const blueprint   = translation.blueprint || {};
  const retrieval   = translation.context?.retrieval || {};
  emit('Architect', 'done',
    `${(blueprint.class_architecture || []).length} classes · ${(blueprint.system_flow || []).length} flow steps · ${retrieval.chunk_count || 0} memory chunks`);

  // ─ Step 4: Blueprint execution plan ─────────────────────────────────
  emit('Blueprint', 'running', 'Generating node-level event graphs…');
  const bp = await generateBlueprintPlan(prompt, { save: false, limit: 8 });
  const plan = bp.plan || {};
  emit('Blueprint', 'done',
    `${(plan.event_graphs || []).length} event graphs · ${(plan.function_graphs || []).length} functions · ${(plan.custom_events || []).length} custom events`);

  // ─ Step 5: GAS (only if combat/skill/ability) ───────────────────────
  let gas = null;
  if (classification.gas_required) {
    emit('GAS', 'running', 'Designing abilities, effects, attributes & tags…');
    const gasRes = await designGASSystem(prompt, { save: false, limit: 8 });
    gas = gasRes.design || {};
    emit('GAS', 'done',
      `${(gas.abilities || []).length} abilities · ${(gas.gameplay_effects || []).length} effects · ${(gas.gameplay_tags || []).length} tags`);
  } else {
    emit('GAS', 'skipped', 'Not required for this system type.');
  }

  // ─ Step 6: Kernel registration (validates + versions + persists) ───
  emit('Register', 'running', 'Kernel pipeline: registry → rules → persist…');
  const statContract = deriveStatContract({ blueprint, gas });
  const { dependencies, connected_systems } = deriveIntegration({ classification, blueprint });

  const kernelInput = {
    system_id:        overrides.system_id   || classification.suggested_system_id,
    system_name:      overrides.system_name || classification.suggested_name || 'New System',
    system_type:      overrides.system_type || classification.primary_type,
    summary:          overrides.summary     || blueprint?.system_overview?.what || prompt.slice(0, 240),
    dependencies:     overrides.dependencies     || dependencies,
    connected_systems:overrides.connected_systems|| connected_systems,
    stat_contract:    overrides.stat_contract    || statContract,
    source_origin:    'kernel_generated',
    prompt,
  };

  const kernelResult = await createSystemThroughKernel(kernelInput);
  emit('Register', kernelResult.validation?.passed ? 'done' : 'warn',
    kernelResult.validation?.passed
      ? `v${kernelResult.saved.version} registered & validated`
      : `v${kernelResult.saved.version} saved as DRAFT — ${kernelResult.validation.violations.length} violation(s)`);

  // ─ Step 7: Persist the full module as a KnowledgeDocument ──────────
  emit('Index', 'running', 'Writing unified system module to memory…');
  const moduleDoc = await persistModule({
    prompt, classification, blueprint, plan, gas, kernel: kernelResult,
  });
  emit('Index', 'done', 'Module indexed — future generations will reference it.');

  return {
    classification,
    architecture: blueprint,
    blueprint_plan: plan,
    gas,
    kernel: kernelResult,
    module_doc: moduleDoc,
    retrieval,
  };
}

// ─── Helpers: derive stat contract + integration edges from generated data ─
function deriveStatContract({ blueprint, gas }) {
  const reads  = new Set();
  const writes = new Set();
  const canon = new Set([
    'Strength','Vitality','Dexterity','Spirit',
    'Health','Stamina','Mana','CritChance','CritDamage','Defense',
  ]);

  // From GAS attributes: anything written via modifiers is a "write".
  (gas?.gameplay_effects || []).forEach((ge) => {
    (ge.modifiers || []).forEach((m) => {
      if (m.attribute && canon.has(m.attribute)) writes.add(m.attribute);
    });
  });
  // Anything declared in attribute_set/derived is read by the system.
  (gas?.attribute_set?.attributes || []).forEach((a) => {
    if (a.name && canon.has(a.name)) reads.add(a.name);
  });
  (gas?.attribute_set?.derived_attributes || []).forEach((d) => {
    canon.forEach((s) => { if (typeof d === 'string' && d.includes(s)) reads.add(s); });
  });

  // From architecture stat_relationships strings: pick canon mentions as reads.
  (blueprint?.data_architecture?.stat_relationships || []).forEach((s) => {
    canon.forEach((c) => { if (s.includes(c)) reads.add(c); });
  });

  return { reads: Array.from(reads), writes: Array.from(writes) };
}

function deriveIntegration({ classification, blueprint }) {
  // Soft mapping: every system declares the cores it touches. These IDs are the
  // conventional kernel slugs the team uses; the rule engine will warn if any
  // referenced id doesn't yet exist — which is the desired prompt to register them.
  const integrationMap = {
    combat:      { deps: ['damage_core'], conn: ['ui_core', 'animation_core', 'vfx_core'] },
    skills:      { deps: ['ability_core'], conn: ['ui_core', 'combat_core', 'progression_core'] },
    abilities:   { deps: ['ability_core'], conn: ['ui_core', 'combat_core'] },
    weapons:     { deps: ['equipment_core'], conn: ['combat_core', 'ui_core'] },
    halos:       { deps: ['ability_core'], conn: ['ui_core', 'progression_core'] },
    titles:      { deps: ['progression_core'], conn: ['ui_core'] },
    progression: { deps: [], conn: ['ui_core', 'combat_core'] },
    inventory:   { deps: [], conn: ['ui_core', 'equipment_core'] },
    equipment:   { deps: ['inventory_core'], conn: ['combat_core', 'ui_core'] },
    companions:  { deps: ['ai_core'], conn: ['combat_core', 'ui_core'] },
    ai:          { deps: [], conn: ['combat_core'] },
    movement:    { deps: [], conn: ['input_core', 'animation_core'] },
    input:       { deps: [], conn: ['movement_core', 'ability_core'] },
    ui:          { deps: [], conn: [] },
    vfx:         { deps: [], conn: ['combat_core'] },
    audio:       { deps: [], conn: ['combat_core', 'ui_core'] },
    economy:     { deps: ['inventory_core'], conn: ['ui_core'] },
    social:      { deps: [], conn: ['ui_core'] },
    networking:  { deps: [], conn: [] },
    data:        { deps: [], conn: [] },
    other:       { deps: [], conn: [] },
  };

  const main = integrationMap[classification.primary_type] || integrationMap.other;
  const conn = new Set(main.conn);
  classification.secondary_types.forEach((t) => {
    const m = integrationMap[t];
    if (m) m.conn.forEach((c) => conn.add(c));
  });

  return {
    dependencies: main.deps,
    connected_systems: Array.from(conn),
  };
}

async function persistModule({ prompt, classification, blueprint, plan, gas, kernel }) {
  const payload = {
    prompt,
    classification,
    architecture: blueprint,
    blueprint_plan: plan,
    gas,
    kernel_record_id: kernel?.saved?.id,
    kernel_validation: kernel?.validation,
  };
  return await base44.entities.KnowledgeDocument.create({
    title:       `System Module: ${kernel?.saved?.system_name || 'Untitled'}`,
    source_type: 'manual_entry',
    source_id:   `system_module_${Date.now()}`,
    file_type:   'system_module',
    raw_content: JSON.stringify(payload, null, 2).slice(0, 30000),
    summary:     blueprint?.system_overview?.what || prompt.slice(0, 240),
    category:    classification.primary_type === 'combat' ? 'combat_systems'
              : classification.primary_type === 'ui' ? 'ui_ux_systems'
              : classification.primary_type === 'progression' ? 'progression_systems'
              : 'game_design_systems',
    tags: Array.from(new Set([
      classification.primary_type,
      ...classification.secondary_types,
      classification.complexity,
      ...(gas ? ['gas'] : []),
    ])),
    keywords: (blueprint.class_architecture || []).map((c) => c.name).filter(Boolean).slice(0, 50),
    section_count: 8,
    status:        'indexed',
    indexed_at:    new Date().toISOString(),
  });
}