// ─── Ingestion Queue (database-backed) ────────────────────────────────────
// Every ingestion request becomes a `PendingKnowledgeURL` row. The queue is
// just a typed view over that entity — so it survives refresh, logout, and
// crashes. No chat / no session state involved.
//
// One job per source URL. Within a job, chunks are processed sequentially
// and `next_chunk_index` acts as the checkpoint. Workers always read the
// row fresh before claiming, so multiple tabs can't double-process.

import { base44 } from '@/api/base44Client';
import { extractGoogleDocId } from './knowledgeIngestService';

const ENTITY = 'PendingKnowledgeURL';

// ─── Enqueue ──────────────────────────────────────────────────────────────
export async function enqueueGoogleDoc({ url, label, folder_label }) {
  if (!extractGoogleDocId(url)) throw new Error('Invalid Google Docs URL.');
  // De-dupe: if there's an existing non-completed job for the same URL, reuse it
  const existing = await base44.entities[ENTITY].filter({ url });
  const active   = (existing || []).find((j) => j.status !== 'completed');
  if (active) return active;

  return await base44.entities[ENTITY].create({
    url,
    label:        label || '',
    folder_label: folder_label || '',
    kind:         'google_doc',
    status:       'pending',
    next_chunk_index: 0,
    total_chunks:     0,
    chunks_stored:    0,
    retry_count:      0,
    max_retries:      3,
  });
}

export async function enqueueBulkGoogleDocs(urls, folder_label = '') {
  const out = [];
  for (const url of urls) {
    try { out.push(await enqueueGoogleDoc({ url, folder_label })); }
    catch (e) { out.push({ url, error: e?.message || String(e) }); }
  }
  return out;
}

// ─── Read ─────────────────────────────────────────────────────────────────
export async function listJobs() {
  return await base44.entities[ENTITY].list('-updated_date', 200);
}
export async function listActiveJobs() {
  // Anything not completed/failed is "active" — pending, processing, paused.
  const all = await listJobs();
  return all.filter((j) => j.status === 'pending' || j.status === 'processing');
}
export async function countByStatus() {
  const all = await listJobs();
  return all.reduce((m, j) => { m[j.status] = (m[j.status] || 0) + 1; return m; }, {});
}

// Atomically-ish claim the next pending job. Re-checks status after update.
export async function claimNextJob() {
  const all = await base44.entities[ENTITY].filter({ status: 'pending' }, 'created_date', 10);
  if (!all || all.length === 0) {
    // Also pick up jobs that are 'processing' but stalled (heartbeat > 60s ago)
    const stalled = (await base44.entities[ENTITY].filter({ status: 'processing' }, 'created_date', 10)) || [];
    const cutoff  = Date.now() - 60 * 1000;
    const recover = stalled.find((j) => !j.last_heartbeat || new Date(j.last_heartbeat).getTime() < cutoff);
    if (!recover) return null;
    await base44.entities[ENTITY].update(recover.id, {
      last_heartbeat: new Date().toISOString(),
    });
    return await base44.entities[ENTITY].filter({ id: recover.id }).then((r) => r[0]);
  }
  const job = all[0];
  await base44.entities[ENTITY].update(job.id, {
    status:         'processing',
    last_heartbeat: new Date().toISOString(),
  });
  return await base44.entities[ENTITY].filter({ id: job.id }).then((r) => r[0]);
}

// ─── Checkpoint / status transitions ──────────────────────────────────────
export async function saveCheckpoint(jobId, patch) {
  return await base44.entities[ENTITY].update(jobId, {
    ...patch,
    last_heartbeat: new Date().toISOString(),
  });
}
export async function markCompleted(jobId, knowledgeDocId) {
  return await base44.entities[ENTITY].update(jobId, {
    status:             'completed',
    knowledge_entry_id: knowledgeDocId || '',
    last_heartbeat:     new Date().toISOString(),
  });
}
export async function recordFailure(jobId, message, currentRetry, maxRetries) {
  // Retry budget not exhausted → keep job pending so the worker picks it up again.
  if ((currentRetry || 0) + 1 < (maxRetries || 3)) {
    return await base44.entities[ENTITY].update(jobId, {
      status:         'pending',
      retry_count:    (currentRetry || 0) + 1,
      error_message:  String(message || '').slice(0, 500),
      last_heartbeat: new Date().toISOString(),
    });
  }
  return await base44.entities[ENTITY].update(jobId, {
    status:         'failed',
    retry_count:    (currentRetry || 0) + 1,
    error_message:  String(message || '').slice(0, 500),
    last_heartbeat: new Date().toISOString(),
  });
}

// ─── Manual controls ──────────────────────────────────────────────────────
export async function retryJob(jobId) {
  return await base44.entities[ENTITY].update(jobId, {
    status:        'pending',
    error_message: '',
    retry_count:   0,
  });
}
export async function pauseJob(jobId) {
  return await base44.entities[ENTITY].update(jobId, { status: 'paused' });
}
export async function resumeJob(jobId) {
  return await base44.entities[ENTITY].update(jobId, { status: 'pending' });
}
export async function deleteJob(jobId) {
  return await base44.entities[ENTITY].delete(jobId);
}
export async function clearCompleted() {
  const completed = await base44.entities[ENTITY].filter({ status: 'completed' });
  for (const j of completed) { try { await base44.entities[ENTITY].delete(j.id); } catch {} }
  return completed.length;
}

export function progressOf(job) {
  if (!job) return { pct: 0, done: 0, total: 0 };
  const total = job.total_chunks || 0;
  const done  = Math.min(job.next_chunk_index || 0, total || job.next_chunk_index || 0);
  const pct   = total > 0 ? Math.round((done / total) * 100) : (job.status === 'completed' ? 100 : 0);
  return { pct, done, total };
}