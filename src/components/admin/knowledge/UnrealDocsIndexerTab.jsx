import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookMarked, Loader2, Globe, Save, Search, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import KnowledgeStatusBanner from './KnowledgeStatusBanner';
import {
  indexUnrealDocs,
  persistUnrealReference,
  smartQueryUnrealKnowledge,
  UNREAL_CATEGORIES,
} from './unrealDocsIndexer';
import { showSuccess, showError } from '@/components/error/ErrorToast';

// ─── Unreal Engine Documentation Indexer ──────────────────────────────────
// Fetch official UE docs pages, extract structured concepts, save them to the
// knowledge databank, and test the smart matching layer end-to-end.
export default function UnrealDocsIndexerTab() {
  const [target, setTarget] = useState('');
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  // Smart-match tester
  const [matchPrompt, setMatchPrompt] = useState('');
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState(null);

  const handleIndex = async () => {
    if (!target.trim()) return;
    setRunning(true);
    setResult(null);
    try {
      const r = await indexUnrealDocs(
        /^https?:\/\//i.test(target) ? { url: target.trim() } : { topic: target.trim() }
      );
      setResult(r);
    } catch (err) {
      showError(err, 'Unreal Docs Indexing');
    } finally {
      setRunning(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const saved = await persistUnrealReference({ result, topicOrUrl: target.trim() });
      showSuccess(`Indexed "${saved.doc.title}" — ${saved.chunkCount} concepts stored.`);
      setResult(null);
      setTarget('');
    } catch (err) {
      showError(err, 'Save Reference');
    } finally {
      setSaving(false);
    }
  };

  const handleSmartMatch = async () => {
    if (!matchPrompt.trim()) return;
    setMatching(true);
    setMatchResult(null);
    try {
      const r = await smartQueryUnrealKnowledge(matchPrompt.trim());
      setMatchResult(r);
    } catch (err) {
      showError(err, 'Smart Match');
    } finally {
      setMatching(false);
    }
  };

  return (
    <div>
      <KnowledgeStatusBanner />

      {/* ── Index a docs page / topic ── */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <BookMarked className="w-6 h-6 text-sky-400" />
          <h2 className="text-2xl font-bold">Unreal Engine Documentation Indexer</h2>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Paste an official Unreal Engine docs URL (e.g.{' '}
          <code className="text-slate-300">dev.epicgames.com/documentation/en-us/unreal-engine/...</code>)
          or a topic like "Gameplay Ability System". The system retrieves the page, extracts structured
          concepts (system / category / patterns / dependencies / examples), and stores them as a reference
          layer the AI can pull from when generating game systems.
        </p>

        <div className="flex gap-3 mb-4">
          <Input
            placeholder='URL or topic (e.g. "Enhanced Input System")'
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="bg-slate-800 border-slate-700 flex-1"
            disabled={running || saving}
          />
          <Button onClick={handleIndex} disabled={running || !target.trim()} className="bg-sky-600 hover:bg-sky-700">
            {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Globe className="w-4 h-4 mr-2" />}
            {running ? 'Indexing…' : 'Index Reference'}
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-2">
          {UNREAL_CATEGORIES.map((c) => (
            <span key={c} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
              {c}
            </span>
          ))}
        </div>

        {result && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <div className="text-xs uppercase tracking-widest text-slate-400 mb-1">Page</div>
              <div className="font-semibold">{result.page_title || target}</div>
              {result.page_url && (
                <a href={result.page_url} target="_blank" rel="noreferrer"
                   className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 mt-1">
                  <ExternalLink className="w-3 h-3" /> {result.page_url}
                </a>
              )}
              {result.overview && <p className="text-sm text-slate-300 mt-2 leading-relaxed">{result.overview}</p>}
            </div>

            {result.concepts?.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 max-h-96 overflow-y-auto">
                <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                  Extracted Concepts ({result.concepts.length})
                </div>
                <div className="space-y-3">
                  {result.concepts.map((c, i) => (
                    <div key={i} className="border-l-2 border-sky-500/50 pl-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100">{c.concept_name}</span>
                        {c.category && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-sky-300">
                            {c.category}
                          </span>
                        )}
                      </div>
                      {c.summary && <p className="text-xs text-slate-400 mt-1">{c.summary}</p>}
                      {c.related_apis?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {c.related_apis.slice(0, 8).map((a) => (
                            <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-300">{a}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.sources?.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">Sources Cited</div>
                <div className="space-y-1">
                  {result.sources.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noreferrer"
                       className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> {s.title || s.url}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save to Knowledge Databank
            </Button>
          </motion.div>
        )}
      </section>

      {/* ── Smart Match tester ── */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <Search className="w-6 h-6 text-violet-400" />
          <h2 className="text-xl font-bold">Smart Match — Test Retrieval</h2>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Test the retrieval layer used before any game-system generation. Type a request and see which
          Unreal categories it maps to and which stored chunks would be pulled as context.
        </p>

        <div className="flex gap-3 mb-4">
          <Input
            placeholder='e.g. "build combat system" or "design UI HUD"'
            value={matchPrompt}
            onChange={(e) => setMatchPrompt(e.target.value)}
            className="bg-slate-800 border-slate-700 flex-1"
            disabled={matching}
          />
          <Button onClick={handleSmartMatch} disabled={matching || !matchPrompt.trim()} className="bg-violet-600 hover:bg-violet-700">
            {matching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            Match
          </Button>
        </div>

        {matchResult && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Matched categories:
              {matchResult.matched_categories.length === 0 ? (
                <span className="text-slate-500 italic">none — falling back to keyword match only</span>
              ) : (
                matchResult.matched_categories.map((c) => (
                  <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/15 border border-violet-500/30 text-violet-300">
                    {c}
                  </span>
                ))
              )}
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 max-h-96 overflow-y-auto">
              <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                Top {matchResult.chunk_count} Context Chunks
              </div>
              {matchResult.chunks.length === 0 ? (
                <p className="text-slate-500 text-sm italic">
                  No matching knowledge yet. Index some Unreal docs pages above and try again.
                </p>
              ) : (
                <div className="space-y-2">
                  {matchResult.chunks.map((ch) => (
                    <div key={ch.id} className="border-l-2 border-violet-500/50 pl-3">
                      <div className="text-xs text-slate-400">{ch.section_path || ch.document_title}</div>
                      <div className="text-sm text-slate-200 font-medium">{ch.heading || '(no heading)'}</div>
                      <div className="text-xs text-slate-400 line-clamp-3 mt-1">{ch.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </section>
    </div>
  );
}