import React, { useMemo, useState } from 'react';
import { Search, FileText, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { KNOWLEDGE_CATEGORIES } from './knowledgeIngestService';

function catColor(id) { return KNOWLEDGE_CATEGORIES.find((c) => c.id === id)?.color || '#64748b'; }

// Client-side keyword search across chunks + optional AI synthesis.
export default function KnowledgeSearchTab() {
  const [query, setQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const { data: chunks = [], isLoading } = useQuery({
    queryKey: ['knowledgeChunksAll'],
    queryFn: () => base44.entities.KnowledgeChunk.list('-created_date', 500),
  });

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return chunks
      .filter((c) => {
        const hay = `${c.heading || ''} ${c.section_path || ''} ${c.content || ''} ${(c.tags || []).join(' ')}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 50);
  }, [chunks, query]);

  const runAiSynthesis = async () => {
    if (!query.trim() || results.length === 0) return;
    setAiLoading(true);
    setAiAnswer('');
    try {
      const context = results.slice(0, 15).map((c, i) =>
        `[${i + 1}] (${c.document_title} · ${c.section_path || c.heading || 'section'})\n${c.content?.slice(0, 1200) || ''}`
      ).join('\n\n');
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the Base44 Context Learning Engine. Using ONLY the indexed knowledge chunks
below, answer the user's question. Cite chunk numbers in square brackets like [3] when you use them.
If the answer is not in the chunks, say so plainly — do not fabricate.

User question: "${query}"

=== INDEXED CHUNKS ===
${context}
=== END CHUNKS ===`,
      });
      setAiAnswer(typeof result === 'string' ? result : result?.response || JSON.stringify(result));
    } catch (err) {
      setAiAnswer(`Error: ${err.message || err}`);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Search className="w-6 h-6 text-amber-400" />
          Search Knowledge Base
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Keyword-search across all indexed chunks, or ask the Context Learning Engine to synthesize an answer.
        </p>
      </div>

      <div className="flex gap-3 mb-4">
        <Input
          placeholder="Search for systems, mechanics, formulas, classes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-slate-800 border-slate-700 flex-1"
        />
        <Button onClick={runAiSynthesis} disabled={aiLoading || !query.trim() || results.length === 0} className="bg-amber-600 hover:bg-amber-700">
          {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Ask AI
        </Button>
      </div>

      {isLoading && <p className="text-slate-500">Loading databank…</p>}

      {query && !isLoading && (
        <p className="text-xs text-slate-400 mb-3">{results.length} matching chunks</p>
      )}

      {aiAnswer && (
        <div className="mb-5 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="text-xs uppercase tracking-widest text-amber-300 mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Context Learning Engine
          </div>
          <div className="text-sm text-amber-50 whitespace-pre-wrap leading-relaxed">{aiAnswer}</div>
        </div>
      )}

      <div className="space-y-3">
        {results.map((c, idx) => (
          <div key={c.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-400">
                <FileText className="inline w-3 h-3 mr-1" />
                <span className="text-slate-200">[{idx + 1}] {c.document_title}</span>
                {c.section_path && <span className="text-slate-500"> · {c.section_path}</span>}
              </span>
              <span style={{ color: catColor(c.category) }} className="uppercase tracking-widest">{c.chunk_type}</span>
            </div>
            {c.chunk_type === 'code' ? (
              <pre className="text-xs bg-black/40 border border-slate-800 rounded p-2 overflow-x-auto text-slate-200">
                <code>{c.content}</code>
              </pre>
            ) : (
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{c.content}</p>
            )}
          </div>
        ))}
        {query && !isLoading && results.length === 0 && (
          <p className="text-slate-500 italic text-sm">No matches in the indexed databank.</p>
        )}
      </div>
    </section>
  );
}