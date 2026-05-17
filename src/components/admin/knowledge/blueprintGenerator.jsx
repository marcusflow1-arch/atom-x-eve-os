// ─── UE5 Auto Blueprint Generator ────────────────────────────────────────
// Converts a system (described in natural language OR taken from a UE5
// architecture blueprint) into explicit Blueprint Editor execution plans:
// event graphs, function graphs, custom events, node-level flow, variable
// definitions, component bindings and replication notes.
//
// Pipeline:
//   1. Pull context from vector memory + Unreal docs (smartQueryUnrealKnowledge).
//   2. InvokeLLM with a strict node-level JSON schema.
//   3. (Optional) persist as a KnowledgeDocument under file_type='ue5_bp_graph'.

import { base44 } from '@/api/base44Client';
import { smartQueryUnrealKnowledge } from './unrealDocsIndexer';

const BP_SCHEMA = {
  type: 'object',
  properties: {
    title:        { type: 'string' },
    target_actor: { type: 'string' }, // e.g. BP_PlayerCharacter
    summary:      { type: 'string' },

    owning_components: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          actor:     { type: 'string' },
          component: { type: 'string' },
          role:      { type: 'string' },
          replicated:{ type: 'boolean' },
        },
      },
    },

    variables: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name:        { type: 'string' },
          type:        { type: 'string' }, // float, int, bool, FName, struct, etc.
          default:     { type: 'string' },
          replication: { type: 'string' }, // None, Replicated, RepNotify
          category:    { type: 'string' },
        },
      },
    },

    event_graphs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          graph_name: { type: 'string' }, // e.g. "BP_PlayerCharacter Event Graph"
          entry:      { type: 'string' }, // entry event, e.g. "InputAction Fire (Triggered)"
          nodes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                step:    { type: 'number' },
                node:    { type: 'string' }, // Branch, Sequence, Switch on Int, Cast To, Call Function, etc.
                detail:  { type: 'string' }, // pins / target / params
                next:    { type: 'string' }, // step ids or label of next path
              },
            },
          },
        },
      },
    },

    function_graphs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name:    { type: 'string' },
          inputs:  { type: 'array', items: { type: 'string' } },
          outputs: { type: 'array', items: { type: 'string' } },
          body:    { type: 'array', items: { type: 'string' } }, // ordered node descriptions
          pure:    { type: 'boolean' },
        },
      },
    },

    custom_events: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name:        { type: 'string' },
          params:      { type: 'array', items: { type: 'string' } },
          replicated:  { type: 'string' }, // None | Multicast | Server | Client
          reliable:    { type: 'boolean' },
          description: { type: 'string' },
        },
      },
    },

    delegates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name:       { type: 'string' },
          signature:  { type: 'string' },
          owner:      { type: 'string' },
          listeners:  { type: 'array', items: { type: 'string' } },
        },
      },
    },

    execution_flow: {
      type: 'array',
      items: { type: 'string' }, // canonical "Input → Component Call → Condition → ..." steps
    },

    ability_mapping: {
      type: 'object',
      properties: {
        activation:        { type: 'string' },
        cooldown_tracking: { type: 'string' },
        damage_execution:  { type: 'string' },
        montage_trigger:   { type: 'string' },
        hit_detection:     { type: 'string' }, // trace / projectile / overlap
      },
    },

    ui_bindings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          widget:    { type: 'string' },
          property:  { type: 'string' },
          source:    { type: 'string' }, // variable / delegate / function
          method:    { type: 'string' }, // Bind / Event / Tick poll
        },
      },
    },

    replication_notes: {
      type: 'array',
      items: { type: 'string' },
    },
  },
};

// ─── Public API ──────────────────────────────────────────────────────────
export async function generateBlueprintPlan(systemRequest, { save = false, limit = 10 } = {}) {
  if (!systemRequest?.trim()) throw new Error('A system description is required.');

  const retrieval = await smartQueryUnrealKnowledge(systemRequest, { limit });
  const contextBlock = (retrieval.chunks || [])
    .map((ch, i) => `[#${i + 1}] ${ch.heading || ch.section_path || ''} — ${(ch.content || '').replace(/\s+/g, ' ').slice(0, 500)}`)
    .join('\n')
    .slice(0, 7000);

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are the UE5 AUTO BLUEPRINT GENERATOR.

Convert the following system into explicit Blueprint-Editor-level execution logic.
A developer should be able to recreate this node-for-node inside Unreal.

SYSTEM REQUEST:
"${systemRequest}"

RETRIEVED CONTEXT (reuse patterns; do NOT contradict):
${contextBlock || '(no prior context — apply standard UE5 Blueprint patterns)'}

OUTPUT RULES (STRICT):
- target_actor: the primary Blueprint actor (e.g. BP_PlayerCharacter).
- owning_components: list which Actor/Component owns each piece of logic.
- variables: name + type + default + replication. Use real BP types (float, bool, FName, FVector, struct, class ref).
- event_graphs: 1-3 graphs, each with an entry event and an ordered "nodes" list using real BP node names (InputAction, Branch, Sequence, Switch on Int, Cast To, Spawn Actor From Class, Apply Damage, Play Anim Montage, Set Timer by Function Name, etc.). Steps must be numbered.
- function_graphs: pure helpers and impure functions used by the event graphs.
- custom_events: include replication mode (None / Multicast / Server / Client) and reliable flag.
- delegates: list event dispatchers + bound listeners.
- execution_flow: one canonical end-to-end pipeline like "Input → Component Call → Condition → Execution → VFX/SFX → State Update → UI Update".
- ability_mapping: fill if the system involves an ability/skill; otherwise leave blank strings.
- ui_bindings: HUD widget bindings (property ↔ variable/delegate).
- replication_notes: if multiplayer is relevant; otherwise output ["single-player"].

Return ONLY the JSON object matching the schema.`,
    response_json_schema: BP_SCHEMA,
  });

  const plan = result || {};
  let savedDoc = null;
  if (save) savedDoc = await persistPlan({ systemRequest, plan, retrieval });

  return { systemRequest, plan, retrieval, savedDoc };
}

async function persistPlan({ systemRequest, plan, retrieval }) {
  const KnowledgeDocument = base44.entities.KnowledgeDocument;
  return await KnowledgeDocument.create({
    title:       plan.title || `BP Plan: ${systemRequest.slice(0, 60)}`,
    source_type: 'manual_entry',
    source_id:   `ue5_bp_${Date.now()}`,
    file_type:   'ue5_bp_graph',
    raw_content: JSON.stringify(plan, null, 2).slice(0, 30000),
    summary:     plan.summary || '',
    category:    'technical_implementation_notes',
    tags:        Array.from(new Set([
      ...(retrieval.matched_categories || []),
      ...((plan.owning_components || []).map((c) => c.component).filter(Boolean)),
    ])).slice(0, 30),
    keywords:    (plan.variables || []).map((v) => v.name).filter(Boolean).slice(0, 50),
    section_count: (plan.event_graphs || []).length + (plan.function_graphs || []).length,
    status:      'indexed',
    indexed_at:  new Date().toISOString(),
  });
}