// ─── Embedding Service ────────────────────────────────────────────────────
// Lightweight vector memory built on the InvokeLLM integration. Real embedding
// APIs (OpenAI / Gemini text-embedding) require backend functions, which this
// app's current plan doesn't include — so we use a deterministic LLM-driven
// "semantic signature" instead: the LLM scores the chunk against a fixed set
// of conceptual axes, producing a fixed-length numeric vector we can compare
// with cosine similarity. It is NOT as expressive as a real embedding model
// but it captures meaning far better than keyword matching, and it works
// without any backend upgrade.
//
// Vectors are persisted in the KnowledgeEmbedding entity so retrieval is
// instant and survives refresh / logout / crash.

import { base44 } from '@/api/base44Client';

// ─── Conceptual axes ──────────────────────────────────────────────────────
// Each axis represents a meaningful dimension a knowledge chunk can occupy.
// Adding or removing axes requires re-embedding (see backfillMissingEmbeddings).
export const EMBEDDING_AXES = [
  'combat',          'damage',         'weapons',           'melee',
  'ranged',          'magic_spells',   'cooldowns',         'abilities',
  'movement',        'animation',      'character_control', 'input_handling',
  'ui',              'hud',            'menus',             'widgets',
  'progression',     'leveling',       'experience',        'rewards',
  'inventory',       'items',          'loot',              'crafting',
  'ai_behavior',     'npc',            'enemy_logic',       'pathfinding',
  'networking',      'replication',    'multiplayer',
  'physics',         'collision',
  'rendering',       'materials',      'lighting',
  'audio',           'sound_effects',
  'gameplay_framework', 'actor_system', 'component_model',  'blueprints',
  'game_mode',       'interfaces',
  'economy',         'trading',        'marketplace',
  'social',          'clans_guilds',
  'data_modeling',   'configuration',  'code_pattern',
];
export const EMBEDDING_DIM = EMBEDDING_AXES.length;
export const EMBEDDING_MODEL_ID = 'base44_axis_v1';

// ─── Generate a vector for a chunk ────────────────────────────────────────
// Returns Array<number> of length EMBEDDING_DIM, values in [0,1].
export async function embedText(rawText) {
  const text = (rawText || '').trim().slice(0, 8000);
  if (!text) return new Array(EMBEDDING_DIM).fill(0);

  const schemaProperties = {};
  EMBEDDING_AXES.forEach((axis) => {
    schemaProperties[axis] = { type: 'number' };
  });

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a semantic-axis scorer for a game-development knowledge base.

Given the text below, output a JSON object where every property is a number from 0 to 1
representing how strongly the text is about that concept. Be analytical and consistent:
0 = unrelated, 1 = the text is centrally about this concept.

Score these axes:
${EMBEDDING_AXES.join(', ')}

=== TEXT START ===
${text}
=== TEXT END ===

Return ONLY the JSON object.`,
    response_json_schema: {
      type: 'object',
      properties: schemaProperties,
    },
  });

  const vec = EMBEDDING_AXES.map((axis) => {
    const v = Number(result?.[axis]);
    if (!Number.isFinite(v)) return 0;
    return Math.max(0, Math.min(1, v));
  });
  return vec;
}

// ─── Math helpers ─────────────────────────────────────────────────────────
export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// ─── Persistence ──────────────────────────────────────────────────────────
export async function saveEmbedding({ chunk, vector }) {
  const KnowledgeEmbedding = base44.entities.KnowledgeEmbedding;
  // Replace any existing embedding for the same chunk
  try {
    const existing = await KnowledgeEmbedding.filter({ chunk_id: chunk.id });
    for (const e of existing) { try { await KnowledgeEmbedding.delete(e.id); } catch {} }
  } catch {}

  return await KnowledgeEmbedding.create({
    chunk_id:         chunk.id,
    document_id:      chunk.document_id || '',
    source_reference: chunk.document_title || chunk.section_path || '',
    category:         chunk.category || 'uncategorized',
    tags:             chunk.tags || [],
    vector,
    vector_dim:       vector.length,
    model:            EMBEDDING_MODEL_ID,
    importance_score: 1,
    usage_count:      0,
    preview:          (chunk.content || '').slice(0, 300),
  });
}

// Embed + save in one shot.
export async function embedAndSaveChunk(chunk) {
  const vector = await embedText(`${chunk.heading || ''}\n${chunk.section_path || ''}\n${chunk.content || ''}`);
  return await saveEmbedding({ chunk, vector });
}

// ─── Backfill: embed any chunks that don't yet have an embedding row ──────
// Returns a generator-like state object via onProgress callbacks. Safe to
// re-run — already-embedded chunks are skipped.
export async function backfillMissingEmbeddings({ limit = 50, onProgress } = {}) {
  const KnowledgeChunk     = base44.entities.KnowledgeChunk;
  const KnowledgeEmbedding = base44.entities.KnowledgeEmbedding;

  const allEmbeddings = await KnowledgeEmbedding.list('-created_date', 5000);
  const embeddedIds   = new Set(allEmbeddings.map((e) => e.chunk_id));

  // Pull a window of recent chunks
  const chunks = await KnowledgeChunk.list('-created_date', 1000);
  const todo   = chunks.filter((c) => !embeddedIds.has(c.id)).slice(0, limit);

  let done = 0, failed = 0;
  for (const chunk of todo) {
    try {
      await embedAndSaveChunk(chunk);
      done++;
    } catch (err) {
      failed++;
      console.warn('[Embeddings] failed for chunk', chunk.id, err);
    }
    onProgress && onProgress({ done, failed, total: todo.length, current: chunk });
    await new Promise((r) => setTimeout(r, 40));
  }
  return { done, failed, totalConsidered: todo.length, pending: chunks.length - embeddedIds.size - done };
}

// ─── Retrieval: top-k semantic matches for a query ────────────────────────
export async function semanticSearch(query, { topK = 12, categoryFilter = null } = {}) {
  const KnowledgeEmbedding = base44.entities.KnowledgeEmbedding;
  const KnowledgeChunk     = base44.entities.KnowledgeChunk;

  const qVec = await embedText(query);

  // Pull a working set — for our scale this is fine; if it grows huge we'd
  // page or pre-filter by category.
  const all = await KnowledgeEmbedding.list('-created_date', 5000);
  const pool = categoryFilter ? all.filter((e) => e.category === categoryFilter) : all;

  // Score each candidate
  const scored = pool.map((e) => {
    const sim   = cosineSimilarity(qVec, e.vector || []);
    const imp   = Number(e.importance_score) || 1;
    const usage = Math.log10(1 + (Number(e.usage_count) || 0)) * 0.05;
    return { embedding: e, score: sim * imp + usage };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score > 0.05).slice(0, topK);

  // Hydrate full chunk content
  const chunkIds = top.map((t) => t.embedding.chunk_id).filter(Boolean);
  const chunks   = [];
  for (const id of chunkIds) {
    try {
      const arr = await KnowledgeChunk.filter({ id });
      if (arr[0]) chunks.push(arr[0]);
    } catch {}
  }

  // Increment usage counts (best-effort)
  top.slice(0, 5).forEach((t) => {
    try {
      KnowledgeEmbedding.update(t.embedding.id, {
        usage_count: (Number(t.embedding.usage_count) || 0) + 1,
      });
    } catch {}
  });

  return {
    query,
    query_vector: qVec,
    results: top.map((t, i) => ({
      rank:      i + 1,
      score:     Number(t.score.toFixed(4)),
      embedding: t.embedding,
      chunk:     chunks.find((c) => c.id === t.embedding.chunk_id) || null,
    })),
  };
}

// ─── Importance tuning ────────────────────────────────────────────────────
export async function setImportance(embeddingId, value) {
  const clamped = Math.max(0.1, Math.min(5, Number(value) || 1));
  return await base44.entities.KnowledgeEmbedding.update(embeddingId, { importance_score: clamped });
}