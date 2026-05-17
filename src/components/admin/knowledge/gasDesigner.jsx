// ─── GAS (Gameplay Ability System) Specialist ───────────────────────────
// Designs Unreal-compliant RPG combat/skill systems using the GAS pattern:
//   • Abilities (UGameplayAbility_*)
//   • Effects (UGameplayEffect)
//   • Attributes (UAttributeSet)
//   • Tags (GameplayTag tree)
//   • Replication + UI bindings
//
// Pulls grounded context from vector memory + Unreal docs before generation.

import { base44 } from '@/api/base44Client';
import { smartQueryUnrealKnowledge } from './unrealDocsIndexer';

const GAS_SCHEMA = {
  type: 'object',
  properties: {
    title:   { type: 'string' },
    summary: { type: 'string' },

    abilities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          class_name:      { type: 'string' }, // UGameplayAbility_Skill_Fireball
          display_name:    { type: 'string' },
          activation_type: { type: 'string' }, // Instant | Toggle | Charged | Channeled | Passive
          input_tag:       { type: 'string' }, // InputTag.Ability.Fire
          ability_tags:    { type: 'array', items: { type: 'string' } },
          cancel_tags:     { type: 'array', items: { type: 'string' } },
          block_tags:      { type: 'array', items: { type: 'string' } },
          required_tags:   { type: 'array', items: { type: 'string' } },
          cost_effect:     { type: 'string' }, // GE_Cost_Mana25
          cooldown_effect: { type: 'string' }, // GE_Cooldown_Fireball
          cooldown_seconds:{ type: 'number' },
          damage_effects:  { type: 'array', items: { type: 'string' } },
          animation_montage:{ type: 'string' },
          replication_policy:{ type: 'string' }, // LocalPredicted | ServerOnly | ServerInitiated | LocalOnly
        },
      },
    },

    gameplay_effects: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          class_name:    { type: 'string' }, // UGameplayEffect_BurnDoT
          kind:          { type: 'string' }, // Damage | Buff | Debuff | Cost | Cooldown
          duration_policy:{ type: 'string' }, // Instant | HasDuration | Infinite
          duration_seconds:{ type: 'number' },
          period_seconds:{ type: 'number' },
          modifiers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                attribute: { type: 'string' }, // Health, Mana, Strength
                op:        { type: 'string' }, // Add | Multiply | Override
                magnitude: { type: 'string' }, // formula or scalar
              },
            },
          },
          stacking: { type: 'string' }, // None | Aggregate | DenyOverride | RefreshDuration
          max_stacks:{ type: 'number' },
          granted_tags:  { type: 'array', items: { type: 'string' } },
          removed_tags:  { type: 'array', items: { type: 'string' } },
        },
      },
    },

    attribute_set: {
      type: 'object',
      properties: {
        class_name: { type: 'string' }, // URPGAttributeSet
        attributes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name:        { type: 'string' }, // Health, Stamina, Mana, Strength, Dexterity, Vital, Spirit
              base:        { type: 'number' },
              cap:         { type: 'string' },
              regen_rule:  { type: 'string' },
              scaling:     { type: 'string' }, // formula
              replicated:  { type: 'boolean' },
            },
          },
        },
        clamping_rules:  { type: 'array', items: { type: 'string' } },
        derived_attributes:{ type: 'array', items: { type: 'string' } }, // e.g. MaxHealth = 100 + Vital*10
      },
    },

    gameplay_tags: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          tag:     { type: 'string' }, // State.Combat, Buff.DamageBoost
          purpose: { type: 'string' }, // blocking / stacking / condition check
          used_by: { type: 'array', items: { type: 'string' } },
        },
      },
    },

    execution_pipeline: {
      type: 'array',
      items: { type: 'string' }, // Input → Activation → Tag Check → Cost → Effect → Animation → Damage → Replication → UI
    },

    replication: {
      type: 'object',
      properties: {
        ability_system_component_owner: { type: 'string' }, // PlayerState | Pawn
        prediction_notes: { type: 'array', items: { type: 'string' } },
        rpcs:             { type: 'array', items: { type: 'string' } },
      },
    },

    ui_integration: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          widget:  { type: 'string' },
          binds_to:{ type: 'string' }, // attribute / tag / cooldown
          method:  { type: 'string' }, // attribute change delegate, tag event, cooldown time remaining
        },
      },
    },
  },
};

// ─── Public API ──────────────────────────────────────────────────────────
export async function designGASSystem(systemRequest, { save = false, limit = 10 } = {}) {
  if (!systemRequest?.trim()) throw new Error('A combat/skill request is required.');

  const retrieval = await smartQueryUnrealKnowledge(systemRequest, { limit });
  const contextBlock = (retrieval.chunks || [])
    .map((ch, i) => `[#${i + 1}] ${ch.heading || ch.section_path || ''} — ${(ch.content || '').replace(/\s+/g, ' ').slice(0, 500)}`)
    .join('\n')
    .slice(0, 7000);

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are the GAS (Gameplay Ability System) SPECIALIST for Base44.

Design an Unreal-compliant GAS architecture for the request below. Be strict about
GAS conventions: ability classes, gameplay effects (Instant/HasDuration/Infinite),
attribute set with clamping + derived attributes, gameplay tag hierarchy
(State.*, Buff.*, Debuff.*, Skill.*, InputTag.*), and replication policy per
ability (LocalPredicted by default for player abilities).

REQUEST:
"${systemRequest}"

RETRIEVED CONTEXT (reuse patterns; do NOT contradict):
${contextBlock || '(no prior context — apply standard GAS patterns)'}

OUTPUT RULES (STRICT):
- abilities: 1-6 entries. Always include activation_type, cost_effect, cooldown_effect, replication_policy, and tag fields (use empty arrays if none).
- gameplay_effects: include every GE referenced by abilities (cost, cooldown, damage, buffs/debuffs). For each: duration_policy + modifiers (attribute/op/magnitude) + stacking rule.
- attribute_set: at minimum Health, Stamina, Mana, plus primary stats (Strength/Dexterity/Vital/Spirit) when relevant. Include clamping rules (e.g. "Health clamped to [0, MaxHealth]") and derived attributes (e.g. "MaxHealth = 100 + Vital*10").
- gameplay_tags: hierarchical dotted tags with their purpose (blocking / stacking / condition).
- execution_pipeline: ordered canonical flow: Input → Ability Activation → Tag Check → Cost Deduction → Effect Application → Animation → Damage → Replication → UI Update.
- replication: specify ASC owner (PlayerState for persistent, Pawn for transient), prediction notes, and RPCs.
- ui_integration: HUD bindings (health bar, cooldown ring, buff icons) with the binding method (AttributeChangeDelegate / GameplayEventReceived / Cooldown remaining).

Return ONLY the JSON object matching the schema.`,
    response_json_schema: GAS_SCHEMA,
  });

  const design = result || {};
  let savedDoc = null;
  if (save) savedDoc = await persistDesign({ systemRequest, design, retrieval });

  return { systemRequest, design, retrieval, savedDoc };
}

async function persistDesign({ systemRequest, design, retrieval }) {
  const KnowledgeDocument = base44.entities.KnowledgeDocument;
  return await KnowledgeDocument.create({
    title:       design.title || `GAS Design: ${systemRequest.slice(0, 60)}`,
    source_type: 'manual_entry',
    source_id:   `gas_${Date.now()}`,
    file_type:   'gas_design',
    raw_content: JSON.stringify(design, null, 2).slice(0, 30000),
    summary:     design.summary || '',
    category:    'combat_systems',
    tags:        Array.from(new Set([
      ...(retrieval.matched_categories || []),
      ...((design.abilities || []).map((a) => a.display_name).filter(Boolean)),
    ])).slice(0, 30),
    keywords:    (design.gameplay_tags || []).map((t) => t.tag).filter(Boolean).slice(0, 50),
    section_count: (design.abilities || []).length + (design.gameplay_effects || []).length,
    status:      'indexed',
    indexed_at:  new Date().toISOString(),
  });
}