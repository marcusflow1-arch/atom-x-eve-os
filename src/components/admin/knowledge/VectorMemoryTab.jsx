import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Loader2, Database, Search, Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import {
  backfillMissingEmbeddings,
  semanticSearch,
  setImportance,
  EMBEDDING_DIM,
  EMBEDDING_AXES,
} from './embeddingService';
import KnowledgeStatusBanner from './KnowledgeStatusBanner';
import { showError, showSuccess } from '@/components/error/ErrorToast';

// ─── Vector Memory Tab ────────────────────────────────────────────────────
// Manage the semantic memory layer:
//   • Stats: how many chunks have embeddings, how many are missing
//   • Backfill: embed pending chunks in batches (resumable, just re-click)
//   • Semantic Search: query test bench with similarity scores
//   • Importance: tune retrieval weight on a per-embedding basis
export default function VectorMemoryTab() {
  const [stats, setStats] = useState({ chunks: 0, embeddings: 0, missing: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);

  const refreshStats = async () => {
    setRefreshing(true);
    try {
      const [chunks, embeddings] = await Promise.all([
        base44.entities.KnowledgeChunk.list('-created_date', 5000),
        base44.entities.KnowledgeEmbedding.list('-created_date', 5000),
      ]);
      const embeddedIds = new Set(embeddings.map((e) => e.chunk_id));
      const missing = chunks.filter((c) => !embeddedIds.has(c.id)).length;
      setStats({ chunks: chunks.length, embeddings: embeddings.length, missing });
    } catch (err) {
      showError(err, 'Vector Memory Stats');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { refreshStats(); }, []);

  const runBackfill = async () => {
    setBusy(true);
    setProgress({ done: 0, total: 0, failed: 0 });
    try {
      const r = await backfillMissingEmbeddings({
        limit: 50,
        onProgress: (p) => setProgress(p),
      });
      showSuccess(`Embedded ${r.done} chunk${r.done !== 1 ? 's' : ''} · ${r.pending} still pending.`);
      refreshStats();
    } catch (err) {
      showError(err, 'Backfill Embeddings');
    } finally {
      setBusy(false);
    }
  };

  const runSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchResult(null);
    try {
      const r = await semanticSearch(query.trim(), { topK: 10 });
      setSearchResult(r);
    } catch (err) {
      showError(err, 'Semantic Search');
    } finally {
      setSearching(false);
    }
  };

  const handleImportance = async (embId, value) => {
    try {
      await setImportance(embId, value);
      setSearchResult((prev) => prev && {
        ...prev,
        results: prev.results.map((r) =>
          r.embedding.id === embId
            ? { ...r, embedding: { ...r.embedding, importance_score: value } }
            : r
        ),
      });
    } catch (err) {
      showError(err, 'Update Importance');
    }
  };

  const coveragePct = stats.chunks > 0 ? Math.round((stats.embeddings / stats.chunks) * 100) : 0;

  return (
    <div>
      <KnowledgeStatusBanner />

      {/* ── Stats + Backfill ── */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-6 h-6 text-fuchsia-400" />
          <h2 className="text-2xl font-bold">Vector Memory</h2>
        </div>
        <p className="text-slate-400 text-sm mb-5">
          Semantic memory layer used before every game-system generation. Each knowledge chunk is
          scored across <span className="text-slate-300">{EMBEDDING_DIM}</span> conceptual axes
          (combat, UI, progression, animation, networking, …) producing a fixed-length vector
          stored in the databank. Retrieval ranks chunks by cosine similarity to the query —
          meaning matches, not keyword matches.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <StatCard icon={Database} label="Chunks"     value={stats.chunks}     color="text-cyan-300" />
          <StatCard icon={Brain}    label="Embeddings" value={stats.embeddings} color="text-fuchsia-300" />
          <StatCard icon={Zap}      label="Coverage"   value={`${coveragePct}%`} color="text-emerald-300" />
          <StatCard icon={Loader2}  label="Pending"    value={stats.missing}    color="text-amber-300" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={runBackfill} disabled={busy || stats.missing === 0} className="bg-fuchsia-600 hover:bg-fuchsia-700">
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
            {busy ? 'Embedding…' : `Embed Next ${Math.min(50, stats.missing)} Chunks`}
          </Button>
          <Button onClick={refreshStats} variant="outline" disabled={refreshing}>
            {refreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Refresh
          </Button>
          {progress && busy && (
            <span className="text-xs text-slate-400">
              {progress.done}/{progress.total} done · {progress.failed} failed
            </span>
          )}
        </div>

        <details className="mt-4">
          <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300">
            View embedding axes ({EMBEDDING_AXES.length})
          </summary>
          <div className="flex flex-wrap gap-1 mt-2">
            {EMBEDDING_AXES.map((a) => (
              <span key={a} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                {a}
              </span>
            ))}
          </div>
        </details>
      </section>

      {/* ── Semantic Search bench ── */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <Search className="w-6 h-6 text-violet-400" />
          <h2 className="text-xl font-bold">Semantic Search</h2>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Test the retrieval engine. The top chunks here are what would be injected as context
          before generating a system for this request.
        </p>

        <div className="flex gap-3 mb-4">
          <Input
            placeholder='e.g. "skill system for ranged weapons"'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-slate-800 border-slate-700 flex-1"
            disabled={searching}
          />
          <Button onClick={runSearch} disabled={searching || !query.trim()} className="bg-violet-600 hover:bg-violet-700">
            {searching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            Search
          </Button>
        </div>

        {searchResult && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 text-xs text-slate-300 mb-3">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {searchResult.results.length} result{searchResult.results.length !== 1 ? 's' : ''} found
            </div>

            {searchResult.results.length === 0 ? (
              <p className="text-sm text-slate-500 italic">
                Nothing matched semantically. Try embedding more chunks first, or rephrase.
              </p>
            ) : (
              <div className="space-y-2 max-h-[28rem] overflow-y-auto">
                {searchResult.results.map((r) => (
                  <div key={r.embedding.id} className="border-l-2 border-violet-500/50 pl-3 py-2 bg-slate-800/40 rounded">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                          #{r.rank} · {r.score.toFixed(3)}
                        </span>
                        <span className="text-xs text-slate-400 truncate">
                          {r.embedding.source_reference}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">importance</span>
                        <select
                          value={r.embedding.importance_score || 1}
                          onChange={(e) => handleImportance(r.embedding.id, Number(e.target.value))}
                          className="text-[10px] bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-slate-300"
                        >
                          {[0.5, 1, 1.5, 2, 3, 5].map((v) => (
                            <option key={v} value={v}>{v}x</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="text-sm text-slate-200 mt-1 font-medium">
                      {r.chunk?.heading || '(no heading)'}
                    </div>
                    <div className="text-xs text-slate-400 line-clamp-3 mt-0.5">
                      {r.chunk?.content || r.embedding.preview}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
    </div>
  );
}