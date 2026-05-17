// ─── Persistent, resumable Google Docs ingestion runner ───────────────────
// Large Unreal Engine knowledge docs can't be parsed in a single LLM call —
// we slice them into character-bounded batches, parse each batch separately,
// and append its chunks to the parent KnowledgeDocument. After every batch
// we write a checkpoint to localStorage so an interrupted run (tab refresh,
// network glitch, accidental navigation) can resume exactly where it stopped.
//
// Public API
//   startIngestion({ url, title, onProgress }) → starts a fresh job
//   resumeIngestion({ jobId, onProgress })     → resumes an existing job
//   listJobs()                                 → all saved jobs (newest first)
//   getJob(jobId)                              → one job
//   getResumableJobs()                         → jobs that aren't done/failed
//   deleteJob(jobId)                           → forget a job
//
// Notes
// • All persistence is local-only (browser localStorage). That's enough for
//   our resume requirement and avoids any backend-function dependency.
// • The Google Doc text is re-fetched if missing from the checkpoint, so we
//   never have to keep multi-megabyte payloads in localStorage.

import { base44 } from '@/api/base44Client';
import {
  extractGoogleDocId,
  fetchGoogleDocText,
  parseContentWithLLM,
} from './knowledgeIngestService';

const STORAGE_KEY = 'kb_ingest_jobs_v1';
const BATCH_CHARS = 22000;        // per-batch slice — comfortably inside LLM limits
const BATCH_OVERLAP_CHARS = 400;  // soft overlap to avoid splitting mid-section

// ─── Storage helpers ──────────────────────────────────────────────────────
function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveAll(map) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch {}
}
function writeJob(job) {
  const all = loadAll();
  all[job.id] = { ...job, updated_at: Date.now() };
  saveAll(all);
}
export function getJob(jobId) {
  return loadAll()[jobId] || null;
}
export function listJobs() {
  return Object.values(loadAll()).sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
}
export function getResumableJobs() {
  return listJobs().filter((j) => j.status !== 'done' && j.status !== 'failed');
}
export function deleteJob(jobId) {
  const all = loadAll();
  delete all[jobId];
  saveAll(all);
}

// ─── Slicing ──────────────────────────────────────────────────────────────
function sliceIntoBatches(text) {
  const out = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + BATCH_CHARS, text.length);
    out.push({ start: i, end, content: text.slice(i, end) });
    if (end >= text.length) break;
    i = end - BATCH_OVERLAP_CHARS;
    if (i < 0) i = 0;
  }
  return out;
}

// ─── Document / chunk persistence (per-batch append model) ────────────────
async function ensureKnowledgeDocument(job) {
  const KnowledgeDocument = base44.entities.KnowledgeDocument;
  if (job.document_id) {
    // Re-fetch to make sure it still exists
    try {
      const existing = await KnowledgeDocument.filter({ id: job.document_id });
      if (existing && existing[0]) return existing[0];
    } catch {}
  }
  const doc = await KnowledgeDocument.create({
    title:       job.title || `Google Doc ${job.doc_id}`,
    source_type: 'google_docs',
    source_url:  job.url,
    source_id:   job.doc_id,
    file_type:   'gdoc',
    raw_content: (job.text_preview || '').slice(0, 30000),
    status:      'parsing',
    section_count: 0,
  });
  job.document_id = doc.id;
  writeJob(job);
  return doc;
}

async function appendChunks(documentId, documentTitle, parsedChunks, baseOrderIndex) {
  if (!parsedChunks || parsedChunks.length === 0) return 0;
  const KnowledgeChunk = base44.entities.KnowledgeChunk;
  const rows = parsedChunks
    .map((c, idx) => ({
      document_id:       documentId,
      document_title:    documentTitle,
      section_path:      c.section_path || '',
      heading:           c.heading || '',
      heading_level:     c.heading_level || 1,
      order_index:       baseOrderIndex + idx,
      chunk_type:        c.chunk_type || 'text',
      language:          c.language || '',
      content:           c.content || '',
      category:          c.category || 'uncategorized',
      tags:              c.tags || [],
      entities_detected: c.entities_detected || {},
    }))
    .filter((r) => r.content && r.content.trim().length > 0);
  if (rows.length === 0) return 0;
  await KnowledgeChunk.bulkCreate(rows);
  return rows.length;
}

// Merge per-batch document-level fields into a running aggregate kept on the job
function mergeAggregate(agg, parsed) {
  if (parsed.summary && !agg.summary) agg.summary = parsed.summary;
  if (parsed.category && (!agg.category || agg.category === 'uncategorized')) {
    agg.category = parsed.category;
  }
  agg.tags     = unique([...(agg.tags || []),     ...(parsed.tags || [])]).slice(0, 80);
  agg.keywords = unique([...(agg.keywords || []), ...(parsed.keywords || [])]).slice(0, 120);
  const em = parsed.engine_mapping || {};
  agg.engine_mapping = agg.engine_mapping || {};
  ['actors','components','blueprints','game_modes','functions','classes'].forEach((k) => {
    agg.engine_mapping[k] = unique([...(agg.engine_mapping[k] || []), ...(em[k] || [])]).slice(0, 200);
  });
  return agg;
}
function unique(arr) { return Array.from(new Set(arr.filter(Boolean))); }

// ─── Core run loop ────────────────────────────────────────────────────────
async function runJobLoop(job, onProgress) {
  // Re-fetch text if not in memory (e.g. resuming after refresh)
  let text = job._text;
  if (!text) {
    const { text: fresh } = await fetchGoogleDocText(job.url);
    text = fresh;
    job.total_chars = text.length;
    job.text_preview = text.slice(0, 4000);
    writeJob(job);
  }
  job._text = text;

  // Compute batches (idempotent — deterministic from text length)
  const batches = sliceIntoBatches(text);
  job.total_batches = batches.length;
  writeJob(job);

  const doc = await ensureKnowledgeDocument(job);

  for (let i = job.next_batch_index || 0; i < batches.length; i++) {
    job.status = 'parsing';
    job.current_batch_index = i;
    writeJob(job);
    onProgress && onProgress(job);

    let parsed;
    try {
      parsed = await parseContentWithLLM(batches[i].content, {
        sourceType: 'google_docs',
        fileType:   'gdoc',
      });
    } catch (err) {
      // Soft-fail this batch and continue — never stop mid-ingestion.
      job.batch_errors = job.batch_errors || [];
      job.batch_errors.push({ batch: i, message: err?.message || String(err) });
      writeJob(job);
      onProgress && onProgress(job);
      continue;
    }

    const added = await appendChunks(doc.id, doc.title, parsed.chunks || [], job.chunks_stored || 0);
    job.chunks_stored = (job.chunks_stored || 0) + added;
    job.aggregate = mergeAggregate(job.aggregate || {}, parsed);
    job.next_batch_index = i + 1;
    writeJob(job);
    onProgress && onProgress(job);

    // Yield to the event loop so the UI stays responsive.
    await new Promise((r) => setTimeout(r, 30));
  }

  // Finalize the parent document with aggregated metadata
  try {
    await base44.entities.KnowledgeDocument.update(doc.id, {
      title:          job.title || job.aggregate?.summary?.slice(0, 80) || doc.title,
      summary:        job.aggregate?.summary || '',
      category:       job.aggregate?.category || 'uncategorized',
      tags:           job.aggregate?.tags || [],
      keywords:       job.aggregate?.keywords || [],
      engine_mapping: job.aggregate?.engine_mapping || {},
      section_count:  job.chunks_stored || 0,
      status:         'indexed',
      indexed_at:     new Date().toISOString(),
    });
  } catch (err) {
    // Non-fatal — chunks are saved either way.
    job.batch_errors = job.batch_errors || [];
    job.batch_errors.push({ batch: -1, message: `Finalize: ${err?.message || err}` });
  }

  job.status = 'done';
  job.finished_at = Date.now();
  writeJob(job);
  onProgress && onProgress(job);
  return job;
}

// ─── Public entry points ──────────────────────────────────────────────────
export async function startIngestion({ url, title, onProgress }) {
  const docId = extractGoogleDocId(url);
  if (!docId) throw new Error('Invalid Google Docs URL.');

  // If a job for the same doc is already in progress, resume it instead.
  const existing = listJobs().find((j) => j.doc_id === docId && j.status !== 'done' && j.status !== 'failed');
  if (existing) {
    return resumeIngestion({ jobId: existing.id, onProgress });
  }

  const job = {
    id:                 `ingest_${docId}_${Date.now()}`,
    doc_id:             docId,
    url,
    title:              title || '',
    status:             'queued',
    created_at:         Date.now(),
    next_batch_index:   0,
    chunks_stored:      0,
    total_chars:        0,
    total_batches:      0,
    document_id:        null,
    aggregate:          {},
    batch_errors:       [],
  };
  writeJob(job);
  onProgress && onProgress(job);
  try {
    return await runJobLoop(job, onProgress);
  } catch (err) {
    job.status = 'failed';
    job.error_message = err?.message || String(err);
    writeJob(job);
    onProgress && onProgress(job);
    throw err;
  }
}

export async function resumeIngestion({ jobId, onProgress }) {
  const job = getJob(jobId);
  if (!job) throw new Error('Job not found.');
  if (job.status === 'done') { onProgress && onProgress(job); return job; }
  job.status = 'parsing';
  job.resumed_at = Date.now();
  writeJob(job);
  onProgress && onProgress(job);
  try {
    return await runJobLoop(job, onProgress);
  } catch (err) {
    job.status = 'failed';
    job.error_message = err?.message || String(err);
    writeJob(job);
    onProgress && onProgress(job);
    throw err;
  }
}

export function summarizeProgress(job) {
  if (!job) return null;
  const total = job.total_batches || 0;
  const done  = job.next_batch_index || 0;
  const pct   = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return {
    pct,
    done,
    total,
    chunks: job.chunks_stored || 0,
    status: job.status,
    errors: (job.batch_errors || []).length,
  };
}