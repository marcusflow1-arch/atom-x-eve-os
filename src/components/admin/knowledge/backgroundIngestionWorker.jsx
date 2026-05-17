// ─── Background Ingestion Worker ──────────────────────────────────────────
// Singleton, tab-side worker that runs as long as the page is open. It loops
// over the database-backed queue, processes ONE chunk at a time, and saves a
// checkpoint after each chunk. The worker never relies on chat or session
// state — all progress lives in `PendingKnowledgeURL` rows + the
// `KnowledgeDocument` / `KnowledgeChunk` entities.
//
// Resume model:
//   • On startup we just call `start()` — the loop calls `claimNextJob()`,
//     which also recovers any "processing" job whose heartbeat is stale.
//   • Each chunk is parsed independently, so a crash only loses the
//     in-flight chunk (which is retried automatically).
//
// The worker is intentionally serial within a tab (no parallelism) to keep
// the LLM call rate predictable.

import { base44 } from '@/api/base44Client';
import {
  fetchGoogleDocText,
  parseContentWithLLM,
} from './knowledgeIngestService';
import {
  claimNextJob,
  saveCheckpoint,
  markCompleted,
  recordFailure,
} from './ingestionQueue';

const BATCH_CHARS         = 22000;
const BATCH_OVERLAP_CHARS = 400;
const TICK_DELAY_MS       = 60;     // breathing room between chunks
const IDLE_POLL_MS        = 4000;   // when queue is empty
const TEXT_CACHE          = new Map(); // jobId → fetched text (per-tab cache)

let _running   = false;
let _listeners = new Set();
let _lastTick  = { state: 'idle', job: null, progress: null };

// ─── Subscriptions for UI ─────────────────────────────────────────────────
export function subscribeWorker(fn) {
  _listeners.add(fn);
  fn(_lastTick);
  return () => _listeners.delete(fn);
}
function emit(state) {
  _lastTick = { ..._lastTick, ...state };
  _listeners.forEach((fn) => { try { fn(_lastTick); } catch {} });
}

// ─── Slicing — deterministic from text length ─────────────────────────────
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

// ─── Per-job helpers ──────────────────────────────────────────────────────
async function ensureKnowledgeDoc(job, text) {
  const KnowledgeDocument = base44.entities.KnowledgeDocument;
  if (job.document_id) {
    try {
      const existing = await KnowledgeDocument.filter({ id: job.document_id });
      if (existing && existing[0]) return existing[0];
    } catch {}
  }
  const doc = await KnowledgeDocument.create({
    title:       job.label || `Google Doc ${job.url.slice(-12)}`,
    source_type: 'google_docs',
    source_url:  job.url,
    source_id:   job.url,
    file_type:   'gdoc',
    raw_content: (text || '').slice(0, 30000),
    status:      'parsing',
    section_count: 0,
  });
  await saveCheckpoint(job.id, { document_id: doc.id });
  return doc;
}

async function appendChunks(documentId, documentTitle, parsedChunks, baseOrderIndex) {
  if (!parsedChunks || parsedChunks.length === 0) return 0;
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
  await base44.entities.KnowledgeChunk.bulkCreate(rows);
  return rows.length;
}

// ─── Per-chunk tick ───────────────────────────────────────────────────────
async function processOneChunk(job) {
  // Fetch text (cached per-tab)
  let text = TEXT_CACHE.get(job.id);
  if (!text) {
    const { text: fresh } = await fetchGoogleDocText(job.url);
    text = fresh;
    TEXT_CACHE.set(job.id, text);
  }
  const batches = sliceIntoBatches(text);
  if ((job.total_chunks || 0) !== batches.length) {
    await saveCheckpoint(job.id, { total_chunks: batches.length });
    job.total_chunks = batches.length;
  }

  const idx = job.next_chunk_index || 0;
  if (idx >= batches.length) {
    // All chunks done — finalize parent doc + mark completed
    if (job.document_id) {
      try {
        await base44.entities.KnowledgeDocument.update(job.document_id, {
          status:        'indexed',
          section_count: job.chunks_stored || 0,
          indexed_at:    new Date().toISOString(),
        });
      } catch {}
    }
    await markCompleted(job.id, job.document_id);
    TEXT_CACHE.delete(job.id);
    return { done: true };
  }

  const doc = await ensureKnowledgeDoc(job, text);
  const parsed = await parseContentWithLLM(batches[idx].content, {
    sourceType: 'google_docs',
    fileType:   'gdoc',
  });
  const added = await appendChunks(doc.id, doc.title, parsed.chunks || [], job.chunks_stored || 0);

  await saveCheckpoint(job.id, {
    next_chunk_index: idx + 1,
    chunks_stored:    (job.chunks_stored || 0) + added,
  });
  job.next_chunk_index = idx + 1;
  job.chunks_stored    = (job.chunks_stored || 0) + added;
  return { done: false };
}

// ─── Main loop ────────────────────────────────────────────────────────────
async function loop() {
  while (_running) {
    let job;
    try { job = await claimNextJob(); }
    catch (e) { console.warn('[KB Worker] claim failed:', e); }

    if (!job) {
      emit({ state: 'idle', job: null });
      await new Promise((r) => setTimeout(r, IDLE_POLL_MS));
      continue;
    }

    emit({ state: 'working', job, progress: { done: job.next_chunk_index || 0, total: job.total_chunks || 0 } });

    try {
      // Walk all chunks of this job inside this loop iteration. Each chunk
      // checkpoints to DB, so a refresh mid-way just resumes from there.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const r = await processOneChunk(job);
        emit({ state: 'working', job, progress: { done: job.next_chunk_index || 0, total: job.total_chunks || 0 } });
        if (r.done) break;
        await new Promise((res) => setTimeout(res, TICK_DELAY_MS));
        // Check pause/cancel by re-reading the row occasionally
        if (((job.next_chunk_index || 0) % 5) === 0) {
          const fresh = await base44.entities.PendingKnowledgeURL.filter({ id: job.id });
          if (fresh[0] && (fresh[0].status === 'paused' || fresh[0].status === 'failed')) {
            break;
          }
          if (fresh[0]) Object.assign(job, fresh[0]);
        }
      }
    } catch (err) {
      console.warn('[KB Worker] job failed:', err);
      await recordFailure(job.id, err?.message || String(err), job.retry_count, job.max_retries);
      TEXT_CACHE.delete(job.id);
      emit({ state: 'error', job, error: err?.message || String(err) });
    }
  }
  emit({ state: 'stopped', job: null });
}

// ─── Public lifecycle ─────────────────────────────────────────────────────
export function startWorker() {
  if (_running) return;
  _running = true;
  emit({ state: 'starting', job: null });
  loop();
}
export function stopWorker() {
  _running = false;
}
export function isWorkerRunning() { return _running; }
export function getLastTick() { return _lastTick; }