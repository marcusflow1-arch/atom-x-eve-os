// ─── RPG System Compiler ─────────────────────────────────────────────────
// Stage 4 of the UE5 pipeline. Synthesizes ALL game systems (skills, titles,
// halos, weapons, inventory, progression, UI, companions) into ONE unified
// architecture. Where the Translator + BP Generator design isolated systems,
// the Compiler ties them together with dependencies, a unified stat engine,
// and cross-system interaction rules.
//
// Uses vector memory + Unreal docs context so the unified world stays
// consistent with prior ingested designs.

import { base44 } from '@/api/base44Client';
import { gatherTranslatorContext } from './ue5Translator';

// ─── Output schema ───────────────────────────────────────────────────────
const COMPILER_SCHEMA = {
  type: 'object',
  properties: {
    title:   { type: 'string' },
    summary: { type: 'string' },

    // 1. Global dependency graph
    dependency_map: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          from:        { type: 'string' }, // e.g. "Skill System"
          to:          { type: 'string' }, // e.g. "Combat System"
          relation:    { type: 'string' }, // "feeds", "modifies", "subscribes_to", "blocks"
          description: { type: 'string' },
        },
      },
    },

    // 2. Unified stat engine
    stat_engine: {
      type: 'object',
      properties: {
        core_attributes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name:        { type: 'string' }, // Strength, Vitality, Dexterity, Spirit
              derived:     { type: 'array', items: { type: 'string' } }, // e.g. ["AttackPower", "CarryWeight"]
              base_range:  { type: 'string' },
              cap:         { type: 'string' },
              regen_rule:  { type: 'string' },
            },
          },
        },
        secondary_systems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name:    { type: 'string' }, // Crit, Defense, Penetration, Resist
              formula: { type: 'string' },
            },
          },
        },
        modifier_pipeline: {
          type: 'array',
          items: { type: 'string' }, // ordered pipeline: Base → Title → Halo → Weapon → Equipment → Buffs → Final
        },
        stacking_rules:    { type: 'array', items: { type: 'string' } },
        override_priority: { type: 'array', items: { type: 'string' } },
      },
    },

    // 3. Progression architecture
    progression: {
      type: 'object',
      properties: {
        leveling_model:        { type: 'string' },
        xp_curve_formula:      { type: 'string' },
        skill_unlock_thresholds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level:   { type: 'number' },
              unlocks: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        drop_rate_integration: { type: 'string' },
        soft_caps:             { type: 'array', items: { type: 'string' } },
      },
    },

    // 4. Item + Skill drop integration
    drop_system: {
      type: 'object',
      properties: {
        drop_tables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name:      { type: 'string' },
              source:    { type: 'string' }, // enemy tier, boss, zone
              entries:   { type: 'array', items: { type: 'string' } }, // "Skill_Fireball @ 2%", "Material_VoidShard @ 8%"
            },
          },
        },
        rarity_tiers:         { type: 'array', items: { type: 'string' } }, // Common → Limitless
        skill_acquisition:    { type: 'string' },
        upgrade_materials:    { type: 'array', items: { type: 'string' } },
        evolution_tiers:      { type: 'array', items: { type: 'string' } }, // Master → Demigod → God → Chosen
      },
    },

    // 5. Cross-system interaction rules
    interaction_rules: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          rule:         { type: 'string' }, // short name
          systems:      { type: 'array', items: { type: 'string' } },
          effect:       { type: 'string' },
          example:      { type: 'string' },
        },
      },
    },

    // UE5 systems involved (for downstream Translator/BP Generator hand-off)
    ue5_systems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          system:        { type: 'string' },
          ue5_modules:   { type: 'array', items: { type: 'string' } }, // GAS, EnhancedInput, UMG, ...
          key_classes:   { type: 'array', items: { type: 'string' } },
        },
      },
    },

    // Integration checklist (build order)
    build_order: { type: 'array', items: { type: 'string' } },

    referenced_context: {
      type: 'array',
      items: {
        type: 'object',
        properties: { source: { type: 'string' }, excerpt: { type: 'string' } },
      },
    },
  },
};

// ─── Public API ──────────────────────────────────────────────────────────
//
// Inputs:
//   userPrompt         — high-level world description ("Action RPG with halos + titles")
//   selectedSystems[]  — array of system names to focus on, e.g.
//                        ["Skills", "Titles", "Halos", "Weapons", "Inventory",
//                         "Progression", "UI", "Companions"]
//   save               — persist as KnowledgeDocument
export async function compileRPGSystem({ userPrompt, selectedSystems = [], save = false } = {}) {
  if (!userPrompt || !userPrompt.trim()) throw new Error('A request is required.');

  const ctx = await gatherTranslatorContext(userPrompt, { limit: 14 });

  const contextLines = (ctx.retrieval.chunks || []).map((ch, i) => {
    const head = ch.heading || ch.section_path || `Chunk ${i + 1}`;
    const body = (ch.content || '').replace(/\s+/g, ' ').slice(0, 500);
    const src  = ch.document_title || 'Internal';
    return `[#${i + 1}] (${src}) ${head}\n${body}`;
  });
  const contextBlock = contextLines.join('\n\n').slice(0, 8000);

  const systems = selectedSystems.length
    ? selectedSystems
    : ['Skills', 'Titles', 'Halos', 'Weapons', 'Inventory', 'Progression', 'UI', 'Companions'];

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are the RPG SYSTEM COMPILER for Base44.

Synthesize a UNIFIED RPG architecture that ties multiple systems into one
interconnected ecosystem. This is NOT a list of isolated systems — every
section must show how the systems connect, modify, and constrain each other.

WORLD / REQUEST:
"${userPrompt}"

SYSTEMS TO UNIFY (treat as required participants):
${systems.map((s) => `- ${s}`).join('\n')}

RETRIEVED KNOWLEDGE CONTEXT (use as ground truth; reuse your existing designs):
${contextBlock || '(no prior context — apply standard MMO/ARPG patterns)'}

RULES:
- dependency_map: 8-20 edges between systems. relation ∈ {feeds, modifies, subscribes_to, blocks, scales}.
- stat_engine.core_attributes: include Strength, Vitality, Dexterity, Spirit at minimum.
- stat_engine.modifier_pipeline: an ORDERED list — typically Base → Title → Halo → Weapon → Equipment → Buffs → Final.
- progression: define a real XP curve formula (e.g. "XP(level) = 100 * level^1.6") and skill_unlock_thresholds.
- drop_system.evolution_tiers: include "Master → Demigod → God → Chosen" if appropriate to the world.
- drop_system.rarity_tiers: include Common, Uncommon, Rare, Epic, Legendary, Mythical, Limitless (or world-appropriate).
- interaction_rules: 6-12 concrete cross-system rules, each with a worked example.
    Examples to follow style: "Title affects skill damage scaling",
    "Halo applies global crit-resist", "Weapon class modifies skill behavior".
- ue5_systems: hand-off info — list UE5 modules (GAS, EnhancedInput, UMG, Replication, DataAssets) per system.
- build_order: 8-15 concise steps the team follows to implement in order.
- referenced_context: cite which retrieved chunks (by source/heading) influenced the design. Do NOT fabricate.

Return ONLY the JSON object matching the schema.`,
    response_json_schema: COMPILER_SCHEMA,
  });

  const compiled = result || {};
  let savedDoc = null;
  if (save) savedDoc = await persistCompiled({ userPrompt, compiled, ctx });

  return { userPrompt, compiled, context: ctx, savedDoc };
}

async function persistCompiled({ userPrompt, compiled, ctx }) {
  const KnowledgeDocument = base44.entities.KnowledgeDocument;
  const title = compiled.title || `RPG Compiled World: ${userPrompt.slice(0, 60)}`;
  const flat  = JSON.stringify(compiled, null, 2);
  return await KnowledgeDocument.create({
    title,
    source_type: 'manual_entry',
    source_url:  '',
    source_id:   `rpg_compiled_${Date.now()}`,
    file_type:   'rpg_compiled',
    raw_content: flat.slice(0, 30000),
    summary:     compiled.summary || '',
    category:    'game_design_systems',
    tags:        Array.from(new Set(['rpg_compiler', ...(ctx.ue5Systems || []), ...(ctx.docCategories || [])])),
    keywords:    (compiled.ue5_systems || []).flatMap((s) => s.key_classes || []).slice(0, 60),
    section_count: 5,
    status:      'indexed',
    indexed_at:  new Date().toISOString(),
  });
}