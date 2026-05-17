// ─── UE5 Auto Blueprint Generator ────────────────────────────────────────
// Stage 2 of the UE5 pipeline. Takes an architecture blueprint (from the UE5
// Translator) OR a free-text system description, and produces explicit
// node-level Blueprint graphs a developer can rebuild visually in the
// Unreal Blueprint Editor.
//
// Output is strictly schema-bound so the UI can render graph cards.

import { base44 } from '@/api/base44Client';
import { gatherTranslatorContext } from './ue5Translator';

const GRAPH_KINDS = ['EventGraph', 'FunctionGraph', 'Macro', 'CustomEvent', 'EventDispatcher'];

// ─── Schema ──────────────────────────────────────────────────────────────
const BP_GENERATOR_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },

    actor_binding: {
      type: 'object',
      properties: {
        owning_actor:        { type: 'string' },
        executing_component: { type: 'string' },
        ui_communicator:     { type: 'string' },
        replicated_systems:  { type: 'array', items: { type: 'string' } },
      },
    },

    variables: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name:        { type: 'string' },
          type:        { type: 'string' },   // float, int, bool, FVector, FGameplayTag, etc.
          default:     { type: 'string' },
          replicated:  { type: 'boolean' },
          scope:       { type: 'string' },   // BP_PlayerCharacter, UCombatComponent, etc.
          purpose:     { type: 'string' },
        },
      },
    },

    graphs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          graph_name: { type: 'string' },
          graph_kind: { type: 'string' }, // one of GRAPH_KINDS
          owner:      { type: 'string' }, // which BP/Component this graph lives in
          purpose:    { type: 'string' },

          // Ordered list of nodes the developer drags in.
          nodes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                step:         { type: 'number' },
                node_type:    { type: 'string' },   // "InputAction Fire", "Branch", "Call CombatComponent.StartFire", "Sequence", "Play Anim Montage", etc.
                category:     { type: 'string' },   // Input | FlowControl | Function | Variable | Event | VFX | SFX | UI | State
                inputs:       { type: 'array', items: { type: 'string' } },
                outputs:      { type: 'array', items: { type: 'string' } },
                notes:        { type: 'string' },
              },
            },
          },

          // Human-readable arrow flow string.
          flow_summary: { type: 'string' },
        },
      },
    },

    ability_mapping: {
      type: 'object',
      properties: {
        ability_class:        { type: 'string' },
        activation:           { type: 'string' },
        cooldown_tracking:    { type: 'string' },
        damage_execution:     { type: 'string' },
        animation_montage:    { type: 'string' },
        hit_detection:        { type: 'string' }, // trace OR projectile
        applied_effects:      { type: 'array', items: { type: 'string' } },
      },
    },

    rebuild_checklist: {
      type: 'array',
      items: { type: 'string' },
    },
  },
};

// ─── Public API ──────────────────────────────────────────────────────────
//
// Accepts either:
//   { architectureBlueprint }   — output from ue5Translator
//   { userPrompt }              — free-text fallback (we'll fetch context)
// Both may be supplied; architectureBlueprint takes precedence.
export async function generateBlueprintGraphs({ userPrompt, architectureBlueprint, save = false } = {}) {
  if (!architectureBlueprint && !userPrompt) {
    throw new Error('Provide either a userPrompt or an architectureBlueprint.');
  }

  // Pull retrieval context so the generator stays grounded in the memory layer.
  const promptForCtx = userPrompt
    || architectureBlueprint?.title
    || architectureBlueprint?.system_overview?.what
    || 'Unreal Engine system';
  const ctx = await gatherTranslatorContext(promptForCtx, { limit: 8 });

  const contextLines = (ctx.retrieval.chunks || []).map((ch, i) => {
    const head = ch.heading || ch.section_path || `Chunk ${i + 1}`;
    const body = (ch.content || '').replace(/\s+/g, ' ').slice(0, 400);
    return `[#${i + 1}] ${head}\n${body}`;
  });
  const contextBlock = contextLines.join('\n\n').slice(0, 6000);

  // Compact architecture summary (avoid blowing prompt size).
  const archSummary = architectureBlueprint
    ? JSON.stringify({
        title: architectureBlueprint.title,
        system_overview: architectureBlueprint.system_overview,
        class_architecture: architectureBlueprint.class_architecture,
        system_flow: architectureBlueprint.system_flow,
        ability_logic: architectureBlueprint.ability_logic,
      }, null, 2).slice(0, 6000)
    : '(no architecture supplied — derive from userPrompt and context)';

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are the UE5 AUTO BLUEPRINT GENERATOR for Base44.

You convert an architecture plan into explicit, node-level Blueprint graphs a
developer can recreate inside Unreal Engine's Blueprint Editor. This is the
EXECUTION LAYER — do NOT restate the architecture; produce node flow.

USER REQUEST: "${userPrompt || '(use architecture only)'}"

ARCHITECTURE INPUT:
${archSummary}

RETRIEVED KNOWLEDGE CONTEXT (use as ground truth — do not contradict patterns):
${contextBlock || '(no prior context — apply standard UE5 Blueprint patterns)'}

RULES:
- Break the system into graphs. Allowed graph_kind: ${GRAPH_KINDS.join(', ')}.
- Each graph must have an ordered nodes[] list. step starts at 1.
- node_type must use real Unreal Blueprint node names:
    Examples: "InputAction Fire", "Branch", "Sequence", "Switch on Int",
    "Cast To BP_PlayerCharacter", "Call CombatComponent.StartFire",
    "Get/Set Variable: Stamina", "Play Anim Montage", "Spawn Actor From Class",
    "Apply Damage", "Multi Sphere Trace By Channel", "Bind Event to OnDeath",
    "Event Dispatcher: OnHealthChanged", "Custom Event: ServerStartFire (Run on Server, Reliable)",
    "Update Widget: Set Percent (Cooldown Bar)".
- category MUST be one of: Input | FlowControl | Function | Variable | Event | VFX | SFX | UI | State.
- Provide a short flow_summary per graph using arrows:
    "InputAction_Fire → Branch(HasAmmo) → Call StartFire → Play Montage → Apply Damage → Update HUD".
- variables[]: list every variable referenced, with type and scope.
- actor_binding: specify owning_actor, executing_component, ui_communicator,
  replicated_systems[]. If single-player, replicated_systems = [].
- ability_mapping: fill ONLY if the system is a Gameplay Ability; otherwise leave fields empty strings / empty arrays.
- rebuild_checklist: 6-12 concise steps a developer follows in order to recreate this in the editor.
- Do NOT invent classes that aren't in the architecture; if missing, use standard UE5 defaults (APawn, UActorComponent, UUserWidget, etc.).

Return ONLY the JSON object matching the schema.`,
    response_json_schema: BP_GENERATOR_SCHEMA,
  });

  const generated = result || {};
  let savedDoc = null;
  if (save) savedDoc = await persistGeneratedBlueprint({ userPrompt, generated, ctx });

  return { userPrompt, generated, context: ctx, savedDoc };
}

async function persistGeneratedBlueprint({ userPrompt, generated, ctx }) {
  const KnowledgeDocument = base44.entities.KnowledgeDocument;
  const title = generated.title || `UE5 BP Graphs: ${(userPrompt || '').slice(0, 60)}`;
  const flat  = JSON.stringify(generated, null, 2);
  return await KnowledgeDocument.create({
    title,
    source_type: 'manual_entry',
    source_url:  '',
    source_id:   `ue5_bp_graphs_${Date.now()}`,
    file_type:   'ue5_bp_graphs',
    raw_content: flat.slice(0, 30000),
    summary:     generated?.actor_binding?.owning_actor || '',
    category:    'technical_implementation_notes',
    tags:        Array.from(new Set([...(ctx.ue5Systems || []), 'blueprints', 'node_graphs'])),
    keywords:    (generated.graphs || []).map((g) => g.graph_name).filter(Boolean).slice(0, 50),
    section_count: (generated.graphs || []).length,
    status:      'indexed',
    indexed_at:  new Date().toISOString(),
  });
}