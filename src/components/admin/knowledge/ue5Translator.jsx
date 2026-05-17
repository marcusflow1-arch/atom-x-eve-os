// ─── UE5 Architecture Translator ─────────────────────────────────────────
// Converts natural-language gameplay feature requests into structured Unreal
// Engine 5 implementation blueprints using the existing Knowledge Engine
// (vector memory + Unreal docs index + Google Docs design library).
//
// Pipeline:
//   1. Intent mapping   — classify request into UE5 system categories.
//   2. Context retrieval — query vector memory + Unreal docs (smartQuery).
//   3. Blueprint build  — InvokeLLM with strict 8-section schema.
//   4. Persist          — save as a KnowledgeDocument (file_type='ue5_blueprint').

import { base44 } from '@/api/base44Client';
import { smartQueryUnrealKnowledge, mapRequestToCategories } from './unrealDocsIndexer';

// Maps high-level requests to UE5 system buckets used in the prompt header.
const UE5_SYSTEM_MAP = [
  { match: /combat|damage|hit|weapon|attack/i,      systems: ['Actor', 'ActorComponent', 'GameplayAbilitySystem', 'AnimMontage', 'DamageType'] },
  { match: /skill|ability|spell|cooldown/i,         systems: ['GameplayAbility', 'GameplayEffect', 'DataAsset', 'AbilitySystemComponent'] },
  { match: /ui|hud|widget|menu/i,                   systems: ['UMG UserWidget', 'ViewModel', 'WidgetController', 'EventBinding'] },
  { match: /movement|locomotion|character\s*move/i, systems: ['CharacterMovementComponent', 'EnhancedInput', 'InputMappingContext', 'AnimBlueprint'] },
  { match: /ai|enemy|npc|behavior/i,                systems: ['AIController', 'BehaviorTree', 'Blackboard', 'EQS', 'Perception'] },
  { match: /inventory|item|loot/i,                  systems: ['InventoryComponent', 'DataTable', 'ItemDataAsset', 'PickupActor'] },
  { match: /progression|level|experience|xp/i,      systems: ['PlayerState', 'AttributeSet', 'GameplayEffect', 'CurveFloat'] },
  { match: /multiplayer|replication|network/i,      systems: ['Replication', 'RPCs', 'GameMode', 'GameState'] },
];

function mapRequestToUE5Systems(prompt) {
  const hits = new Set();
  UE5_SYSTEM_MAP.forEach((r) => { if (r.match.test(prompt)) r.systems.forEach((s) => hits.add(s)); });
  return Array.from(hits);
}

// ─── Strict output schema for the blueprint ──────────────────────────────
const BLUEPRINT_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },

    system_overview: {
      type: 'object',
      properties: {
        what:       { type: 'string' },
        purpose:    { type: 'string' },
        core_loop:  { type: 'string' },
      },
    },

    class_architecture: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name:        { type: 'string' },
          kind:        { type: 'string' }, // Actor | Component | Interface | DataAsset | Subsystem | Blueprint | Widget
          parent:      { type: 'string' },
          responsibility: { type: 'string' },
        },
      },
    },

    system_flow: {
      type: 'array',
      items: { type: 'string' }, // ordered pipeline steps
    },

    data_architecture: {
      type: 'object',
      properties: {
        structs:    { type: 'array', items: { type: 'string' } },
        data_tables:{ type: 'array', items: { type: 'string' } },
        curves:     { type: 'array', items: { type: 'string' } },
        formulas:   { type: 'array', items: { type: 'string' } },
        stat_relationships: { type: 'array', items: { type: 'string' } },
      },
    },

    blueprint_logic: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          graph:     { type: 'string' }, // e.g. "BP_PlayerCharacter event graph"
          flow:      { type: 'string' },
          triggers:  { type: 'array', items: { type: 'string' } },
          delegates: { type: 'array', items: { type: 'string' } },
          bindings:  { type: 'array', items: { type: 'string' } },
        },
      },
    },

    ability_logic: {
      type: 'object',
      properties: {
        cooldowns:        { type: 'string' },
        buffs_debuffs:    { type: 'string' },
        stacking_rules:   { type: 'string' },
        damage_scaling:   { type: 'string' },
        hit_detection:    { type: 'string' },
      },
    },

    ui_integration: {
      type: 'object',
      properties: {
        hud_elements:        { type: 'array', items: { type: 'string' } },
        widget_hierarchy:    { type: 'array', items: { type: 'string' } },
        event_bindings:      { type: 'array', items: { type: 'string' } },
        live_stat_updates:   { type: 'array', items: { type: 'string' } },
      },
    },

    implementation_notes: {
      type: 'object',
      properties: {
        cpp_systems:           { type: 'array', items: { type: 'string' } },
        blueprint_systems:     { type: 'array', items: { type: 'string' } },
        performance_notes:     { type: 'array', items: { type: 'string' } },
        replication_notes:     { type: 'array', items: { type: 'string' } },
        modular_design_rules:  { type: 'array', items: { type: 'string' } },
      },
    },

    referenced_context: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          source:  { type: 'string' },
          excerpt: { type: 'string' },
        },
      },
    },
  },
};

// ─── Public API ──────────────────────────────────────────────────────────

// Step 1+2: retrieve context. Returns matched categories, systems, and chunks.
export async function gatherTranslatorContext(userPrompt, { limit = 12 } = {}) {
  const ue5Systems   = mapRequestToUE5Systems(userPrompt);
  const docCategories = mapRequestToCategories(userPrompt);
  const retrieval    = await smartQueryUnrealKnowledge(userPrompt, { limit });
  return { ue5Systems, docCategories, retrieval };
}

// Step 3+4: build the blueprint from retrieved context.
export async function translateToUE5Blueprint(userPrompt, { save = false, limit = 12 } = {}) {
  if (!userPrompt || !userPrompt.trim()) throw new Error('A request is required.');

  const ctx = await gatherTranslatorContext(userPrompt, { limit });

  // Build a compact, structured context block. Keep it under ~8k chars for LLM.
  const contextLines = (ctx.retrieval.chunks || []).map((ch, i) => {
    const head = ch.heading || ch.section_path || `Chunk ${i + 1}`;
    const body = (ch.content || '').replace(/\s+/g, ' ').slice(0, 600);
    const src  = ch.document_title || 'Internal';
    return `[#${i + 1}] (${src}) ${head}\n${body}`;
  });
  const contextBlock = contextLines.join('\n\n').slice(0, 8000);

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are the UE5 ARCHITECTURE TRANSLATOR for the Base44 Knowledge Engine.

Convert the user's natural-language request into a structured Unreal Engine 5
implementation blueprint. Be engine-aligned, not generic. Follow Unreal
conventions (Actor / Component / GAS / UMG / EnhancedInput / Replication).

USER REQUEST:
"${userPrompt}"

MAPPED UE5 SYSTEMS (hint): ${ctx.ue5Systems.join(', ') || '(none — infer from request)'}
DOC CATEGORIES (hint):     ${ctx.docCategories.join(', ') || '(none)'}
RETRIEVAL MODE:            ${ctx.retrieval.retrieval || 'unknown'}

RETRIEVED KNOWLEDGE CONTEXT (use these as ground truth; reuse patterns; do NOT contradict):
${contextBlock || '(no prior context — apply standard UE5 patterns)'}

OUTPUT RULES (STRICT):
- Fill every section of the schema.
- Use real UE5 class names (APlayerCharacter, UCombatComponent, UGameplayAbility_*, UDataAsset_*, etc.).
- class_architecture: 4-10 entries minimum, each with kind + parent + responsibility.
- system_flow: ordered pipeline (Input → ... → State Update), 6-12 steps.
- Prefer modular components over monolithic actors.
- If multiplayer is relevant, fill replication_notes; otherwise mark "single-player".
- If something is ambiguous, default to GAS + EnhancedInput + UMG ViewModel.
- referenced_context: cite which retrieved chunks (by source/heading) influenced the design. Do NOT fabricate sources.

Return ONLY the JSON object matching the schema.`,
    response_json_schema: BLUEPRINT_SCHEMA,
  });

  const blueprint = result || {};
  let savedDoc = null;
  if (save) savedDoc = await persistBlueprint({ userPrompt, blueprint, ctx });

  return { userPrompt, blueprint, context: ctx, savedDoc };
}

// Persist the blueprint as a KnowledgeDocument so it joins the memory loop.
async function persistBlueprint({ userPrompt, blueprint, ctx }) {
  const KnowledgeDocument = base44.entities.KnowledgeDocument;
  const title = blueprint.title || `UE5 Blueprint: ${userPrompt.slice(0, 60)}`;

  const flat = JSON.stringify(blueprint, null, 2);
  return await KnowledgeDocument.create({
    title,
    source_type: 'manual_entry',
    source_url:  '',
    source_id:   `ue5_blueprint_${Date.now()}`,
    file_type:   'ue5_blueprint',
    raw_content: flat.slice(0, 30000),
    summary:     blueprint?.system_overview?.what || '',
    category:    'technical_implementation_notes',
    tags:        Array.from(new Set([...(ctx.ue5Systems || []), ...(ctx.docCategories || [])])),
    keywords:    (blueprint.class_architecture || []).map((c) => c.name).filter(Boolean).slice(0, 50),
    section_count: 8,
    status:      'indexed',
    indexed_at:  new Date().toISOString(),
  });
}