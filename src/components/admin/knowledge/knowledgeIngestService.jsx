// ─── Knowledge Ingestion Service ──────────────────────────────────────────
// Pure logic layer used by every Knowledge Engine tab.
//
// Important: backend functions on this app require a Builder+ subscription.
// To avoid creating new backend functions, this service uses the platform's
// InvokeLLM integration to parse and classify content — that integration is
// available on all plans. When a Google Docs link is provided we use the
// public-export URL (works for any doc shared "Anyone with the link"); if
// the doc isn't public we surface a clear error so the admin can adjust
// sharing settings.
//
// The whole module is intentionally framework-free so it can be tested in
// isolation and reused by any future Engine workflow.
import { base44 } from '@/api/base44Client';

// ─── Categories used across the system ────────────────────────────────────
export const KNOWLEDGE_CATEGORIES = [
  { id: 'game_design_systems',          label: 'Game Design Systems',          color: '#a78bfa' },
  { id: 'ui_ux_systems',                label: 'UI / UX Systems',              color: '#60a5fa' },
  { id: 'combat_systems',               label: 'Combat Systems',               color: '#ef4444' },
  { id: 'progression_systems',          label: 'Progression Systems',          color: '#f59e0b' },
  { id: 'engine_logic_notes',           label: 'Engine Logic Notes',           color: '#10b981' },
  { id: 'technical_implementation_notes', label: 'Technical Implementation',   color: '#22d3ee' },
  { id: 'reference_documentation',      label: 'Reference Documentation',      color: '#94a3b8' },
  { id: 'uncategorized',                label: 'Uncategorized',                color: '#64748b' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────
export function extractGoogleDocId(url) {
  if (!url) return null;
  // Matches /document/d/<id>/ or ?id=<id>
  const m = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

export function googleDocExportUrl(docId, format = 'txt') {
  return `https://docs.google.com/document/d/${docId}/export?format=${format}`;
}

// Fetch raw text from a public Google Doc.
// Throws a friendly error if the doc isn't accessible.
export async function fetchGoogleDocText(url) {
  const docId = extractGoogleDocId(url);
  if (!docId) throw new Error('Could not parse Google Doc ID from URL.');
  const exportUrl = googleDocExportUrl(docId, 'txt');
  let resp;
  try {
    resp = await fetch(exportUrl, { method: 'GET', credentials: 'omit' });
  } catch (e) {
    throw new Error('Network error fetching Google Doc — ensure the doc is shared as "Anyone with the link can view".');
  }
  if (!resp.ok) {
    throw new Error(`Google Doc not accessible (HTTP ${resp.status}). Make sure sharing is set to "Anyone with the link can view".`);
  }
  const text = await resp.text();
  if (!text || text.length < 10) throw new Error('Google Doc returned empty content.');
  return { docId, text };
}

// Fetch raw text from a file URL we uploaded ourselves (UploadFile result).
export async function fetchUploadedFileText(fileUrl) {
  const resp = await fetch(fileUrl);
  if (!resp.ok) throw new Error(`Could not read uploaded file (HTTP ${resp.status}).`);
  return await resp.text();
}

// ─── LLM parsing prompt — produces structured chunks + classification ─────
const PARSER_SCHEMA = {
  type: 'object',
  properties: {
    summary:  { type: 'string' },
    category: {
      type: 'string',
      enum: [
        'game_design_systems', 'ui_ux_systems', 'combat_systems', 'progression_systems',
        'engine_logic_notes', 'technical_implementation_notes', 'reference_documentation', 'uncategorized',
      ],
    },
    tags:     { type: 'array', items: { type: 'string' } },
    keywords: { type: 'array', items: { type: 'string' } },
    engine_mapping: {
      type: 'object',
      properties: {
        actors:     { type: 'array', items: { type: 'string' } },
        components: { type: 'array', items: { type: 'string' } },
        blueprints: { type: 'array', items: { type: 'string' } },
        game_modes: { type: 'array', items: { type: 'string' } },
        functions:  { type: 'array', items: { type: 'string' } },
        classes:    { type: 'array', items: { type: 'string' } },
      },
    },
    chunks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          section_path: { type: 'string' },
          heading:      { type: 'string' },
          heading_level:{ type: 'number' },
          chunk_type:   { type: 'string', enum: ['text', 'code', 'table', 'list', 'formula', 'note'] },
          language:     { type: 'string' },
          content:      { type: 'string' },
          category:     { type: 'string' },
          tags:         { type: 'array', items: { type: 'string' } },
          entities_detected: {
            type: 'object',
            properties: {
              systems:   { type: 'array', items: { type: 'string' } },
              mechanics: { type: 'array', items: { type: 'string' } },
              formulas:  { type: 'array', items: { type: 'string' } },
              functions: { type: 'array', items: { type: 'string' } },
              classes:   { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
  },
};

// LLM input is bounded to avoid runaway costs.
const MAX_PARSE_CHARS = 28000;

export async function parseContentWithLLM(rawText, hints = {}) {
  const truncated = (rawText || '').slice(0, MAX_PARSE_CHARS);
  const sourceHint = hints.sourceType ? `Source type: ${hints.sourceType}.` : '';
  const fileHint   = hints.fileType   ? `File type: ${hints.fileType}.` : '';

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a structured-knowledge parser for a game-development knowledge base.
${sourceHint} ${fileHint}

Parse the document below into structured chunks. For each section:
- preserve heading hierarchy (use "Parent > Child" in section_path)
- detect chunk_type: text, code, table, list, formula, note
- if code, set "language" (cpp, h, json, blueprint, md, etc.)
- extract entities: systems, mechanics, formulas, functions, classes
- assign a category to each chunk

Then for the whole doc produce: summary (2-3 sentences), primary category, tags, keywords, and engine_mapping
(actors, components, blueprints, game_modes, functions, classes referenced in the text).

If the source is an Unreal Engine reference, treat Actors/Components/Blueprints/GameModes
as the primary mappable concepts — these become Entity Systems, Modular Gameplay Modules,
Visual Logic Graphs, and System States respectively inside our app.

DO NOT invent content not in the source. Keep "content" verbatim where possible.

=== DOCUMENT START ===
${truncated}
=== DOCUMENT END ===`,
    response_json_schema: PARSER_SCHEMA,
  });

  return result || {};
}

// Persist a fully-parsed document and its chunks into Base44 entities.
export async function persistParsedDocument({ documentMeta, parsed }) {
  const KnowledgeDocument = base44.entities.KnowledgeDocument;
  const KnowledgeChunk    = base44.entities.KnowledgeChunk;

  const doc = await KnowledgeDocument.create({
    ...documentMeta,
    summary:        parsed.summary || '',
    category:       parsed.category || 'uncategorized',
    tags:           parsed.tags || [],
    keywords:       parsed.keywords || [],
    engine_mapping: parsed.engine_mapping || {},
    section_count:  (parsed.chunks || []).length,
    status:         'indexed',
    indexed_at:     new Date().toISOString(),
  });

  const chunks = (parsed.chunks || []).map((c, idx) => ({
    document_id:       doc.id,
    document_title:    doc.title,
    section_path:      c.section_path || '',
    heading:           c.heading || '',
    heading_level:     c.heading_level || 1,
    order_index:       idx,
    chunk_type:        c.chunk_type || 'text',
    language:          c.language || '',
    content:           c.content || '',
    category:          c.category || parsed.category || 'uncategorized',
    tags:              c.tags || [],
    entities_detected: c.entities_detected || {},
  })).filter((c) => c.content && c.content.trim().length > 0);

  if (chunks.length > 0) {
    await KnowledgeChunk.bulkCreate(chunks);
  }

  return { doc, chunkCount: chunks.length };
}

// Web research using InvokeLLM with internet context.
export async function researchEngineTopic(topic) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Research the following Unreal Engine topic from official documentation
and developer guides. Return a structured technical reference. Topic: "${topic}"

Provide: a 3-4 sentence overview, key APIs/classes referenced, links to official
sources you used, and example usage notes. Do NOT fabricate URLs — only cite
URLs you actually retrieved.`,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        overview:    { type: 'string' },
        key_apis:    { type: 'array', items: { type: 'string' } },
        sources:     { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, url: { type: 'string' } } } },
        usage_notes: { type: 'string' },
      },
    },
  });
  return result || {};
}