// ─── Unreal Engine Web Documentation Indexer ──────────────────────────────
// Reference + indexing layer for the official Unreal Engine documentation at
//   https://dev.epicgames.com/documentation/en-us/unreal-engine
//
// What this module does:
//   • Takes a docs URL OR a free-text topic.
//   • Uses InvokeLLM with web context (gemini_3_flash) to retrieve and
//     distill the relevant page(s) into structured "concept" entries.
//   • Saves each concept as a KnowledgeChunk under a parent KnowledgeDocument
//     marked source_type='web_research', file_type='unreal_doc'.
//   • Provides smartQueryUnrealKnowledge(prompt) — maps a user request like
//     "build combat system" to Unreal categories and returns the best
//     matching chunks (web + private docs combined) for use as context.
//
// What this module is NOT:
//   • An engine emulator
//   • A full mirror of the documentation
//   • A continuous scraper
//
// All persistence is done via the existing KnowledgeDocument / KnowledgeChunk
// entities and the InvokeLLM integration — no new backend functions required.

import { base44 } from '@/api/base44Client';

const UNREAL_DOCS_ROOT = 'https://dev.epicgames.com/documentation/en-us/unreal-engine';

// ─── Category mapping (request → Unreal docs categories) ──────────────────
// Used by the Smart Matching System to translate free-text prompts into the
// canonical buckets the documentation organises content under.
export const UNREAL_CATEGORIES = [
  'Gameplay',
  'Rendering',
  'Input',
  'Physics',
  'Animation',
  'Audio',
  'Networking',
  'UI',
  'AI',
  'Editor / Tools',
  'Build / Packaging',
];

const REQUEST_INTENT_MAP = [
  { match: /combat|damage|hit|weapon|attack/i,        categories: ['Gameplay', 'Animation', 'Physics'] },
  { match: /movement|locomotion|character\s*move/i,   categories: ['Gameplay', 'Physics', 'Animation', 'Input'] },
  { match: /ui|hud|widget|menu/i,                     categories: ['UI'] },
  { match: /skill|ability|spell|cooldown/i,           categories: ['Gameplay', 'AI'] },
  { match: /ai|enemy|npc|behavior\s*tree/i,           categories: ['AI', 'Gameplay'] },
  { match: /input|keyboard|controller|binding/i,      categories: ['Input'] },
  { match: /multiplayer|replication|net/i,            categories: ['Networking', 'Gameplay'] },
  { match: /sound|audio|music/i,                      categories: ['Audio'] },
  { match: /render|shader|material|lighting/i,        categories: ['Rendering'] },
  { match: /animation|skeletal|montage|anim\s*bp/i,   categories: ['Animation'] },
];

export function mapRequestToCategories(userPrompt) {
  const hits = new Set();
  REQUEST_INTENT_MAP.forEach((r) => { if (r.match.test(userPrompt)) r.categories.forEach((c) => hits.add(c)); });
  return Array.from(hits);
}

// ─── Concept schema returned by the LLM ───────────────────────────────────
const CONCEPT_SCHEMA = {
  type: 'object',
  properties: {
    page_title:  { type: 'string' },
    page_url:    { type: 'string' },
    overview:    { type: 'string' },
    concepts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          concept_name:           { type: 'string' },
          category:               { type: 'string' },
          summary:                { type: 'string' },
          implementation_patterns:{ type: 'array', items: { type: 'string' } },
          dependencies:           { type: 'array', items: { type: 'string' } },
          usage_examples:         { type: 'array', items: { type: 'string' } },
          related_apis:           { type: 'array', items: { type: 'string' } },
        },
      },
    },
    sources: {
      type: 'array',
      items: { type: 'object', properties: { title: { type: 'string' }, url: { type: 'string' } } },
    },
  },
};

// ─── Core: retrieve + structure a docs page or topic ──────────────────────
export async function indexUnrealDocs({ url, topic }) {
  const target = url || topic;
  if (!target) throw new Error('Provide an Unreal docs URL or a topic.');

  const isUrl = /^https?:\/\//i.test(target);
  const focusHint = isUrl
    ? `Retrieve and read the following Unreal Engine documentation page (and only that page or pages it directly links to):\n${target}`
    : `Search the official Unreal Engine documentation at ${UNREAL_DOCS_ROOT} for: "${target}".`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a structured-knowledge extractor for official Unreal Engine documentation.

${focusHint}

Extract a structured technical reference. Output rules:
- Identify distinct concepts (Actor system, Component model, Game Mode, etc.).
- For each concept include:
    concept_name, category (one of: ${UNREAL_CATEGORIES.join(', ')}),
    summary (2-3 sentences, factual),
    implementation_patterns (how it's typically used),
    dependencies (other engine systems it connects to),
    usage_examples (short, real, from the docs),
    related_apis (class / function names referenced).
- Ignore web chrome, navigation, footer, "edit this page" links, and ads.
- Do NOT fabricate URLs — only cite URLs you actually retrieved.
- This is a REFERENCE INDEX, not a replication: keep summaries concise.

Return the JSON object matching the provided schema.`,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: CONCEPT_SCHEMA,
  });

  return result || {};
}

// ─── Persistence: store the extracted reference as Knowledge entities ─────
export async function persistUnrealReference({ result, topicOrUrl }) {
  const KnowledgeDocument = base44.entities.KnowledgeDocument;
  const KnowledgeChunk    = base44.entities.KnowledgeChunk;

  const title = result?.page_title || `Unreal Reference: ${topicOrUrl}`;
  const primaryUrl = result?.page_url || (/^https?:\/\//.test(topicOrUrl) ? topicOrUrl : (result?.sources?.[0]?.url || UNREAL_DOCS_ROOT));

  const doc = await KnowledgeDocument.create({
    title,
    source_type: 'web_research',
    source_url:  primaryUrl,
    source_id:   topicOrUrl,
    file_type:   'unreal_doc',
    raw_content: (result?.overview || '').slice(0, 30000),
    summary:     result?.overview || '',
    category:    'reference_documentation',
    tags:        Array.from(new Set((result?.concepts || []).map((c) => c.category).filter(Boolean))),
    keywords:    Array.from(new Set((result?.concepts || []).flatMap((c) => c.related_apis || []))).slice(0, 80),
    section_count: (result?.concepts || []).length,
    status:      'indexed',
    indexed_at:  new Date().toISOString(),
  });

  const chunks = (result?.concepts || []).map((c, idx) => ({
    document_id:    doc.id,
    document_title: doc.title,
    section_path:   `Unreal > ${c.category || 'General'} > ${c.concept_name || ''}`,
    heading:        c.concept_name || '',
    heading_level:  2,
    order_index:    idx,
    chunk_type:     'note',
    content: [
      `**${c.concept_name}** — ${c.category}`,
      '',
      c.summary || '',
      '',
      c.implementation_patterns?.length ? `Patterns:\n${c.implementation_patterns.map((p) => `- ${p}`).join('\n')}` : '',
      c.dependencies?.length          ? `Dependencies:\n${c.dependencies.map((d) => `- ${d}`).join('\n')}`           : '',
      c.usage_examples?.length        ? `Examples:\n${c.usage_examples.map((e) => `- ${e}`).join('\n')}`             : '',
      c.related_apis?.length          ? `APIs: ${c.related_apis.join(', ')}`                                          : '',
    ].filter(Boolean).join('\n'),
    category: 'reference_documentation',
    tags: [c.category, ...(c.related_apis || [])].filter(Boolean),
    entities_detected: {
      classes:   c.related_apis || [],
      systems:   c.dependencies || [],
      mechanics: c.implementation_patterns || [],
    },
  })).filter((ch) => ch.content && ch.content.trim().length > 0);

  if (chunks.length > 0) {
    await KnowledgeChunk.bulkCreate(chunks);
  }
  return { doc, chunkCount: chunks.length };
}

// ─── Smart Matching: query both internal + web-indexed knowledge ──────────
// Returns up to `limit` chunks that look most relevant to the user's request.
// Used as the context-retrieval step before generating any system.
//
// Prefers semantic vector search when embeddings exist; falls back to keyword
// + category scoring when the vector memory is still empty.
export async function smartQueryUnrealKnowledge(userPrompt, { limit = 12 } = {}) {
  const KnowledgeChunk     = base44.entities.KnowledgeChunk;
  const KnowledgeEmbedding = base44.entities.KnowledgeEmbedding;
  const categories         = mapRequestToCategories(userPrompt);

  // 1. Try semantic search first (lazy import to avoid pulling embedding code
  //    into bundles that don't need it).
  let semanticChunks = [];
  try {
    const embCount = (await KnowledgeEmbedding.list('-created_date', 1)).length;
    if (embCount > 0) {
      const { semanticSearch } = await import('./embeddingService');
      const r = await semanticSearch(userPrompt, { topK: limit });
      semanticChunks = r.results.map((x) => x.chunk).filter(Boolean);
    }
  } catch (e) {
    console.warn('[smartQuery] semantic path unavailable, falling back to keyword:', e);
  }

  if (semanticChunks.length > 0) {
    return {
      matched_categories: categories,
      chunk_count:        semanticChunks.length,
      chunks:             semanticChunks,
      retrieval:          'semantic',
    };
  }

  // 2. Keyword + category fallback.
  const pool  = await KnowledgeChunk.list('-created_date', 400);
  const terms = userPrompt
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter((t) => t.length >= 3);

  const scored = pool.map((ch) => {
    const hay = `${ch.heading || ''} ${ch.section_path || ''} ${ch.content || ''} ${(ch.tags || []).join(' ')}`.toLowerCase();
    let score = 0;
    terms.forEach((t) => { if (hay.includes(t)) score += 2; });
    categories.forEach((c) => { if (hay.includes(c.toLowerCase())) score += 3; });
    if (ch.section_path?.toLowerCase().includes('unreal')) score += 1;
    return { chunk: ch, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score > 0).slice(0, limit).map((s) => s.chunk);

  return {
    matched_categories: categories,
    chunk_count:        top.length,
    chunks:             top,
    retrieval:          'keyword',
  };
}