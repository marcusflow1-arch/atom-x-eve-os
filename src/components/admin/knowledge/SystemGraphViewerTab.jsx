import React, { useMemo } from 'react';
import { Network, Layers } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { KNOWLEDGE_CATEGORIES } from './knowledgeIngestService';

// Lightweight visual graph of indexed documents grouped by category and engine mapping.
// Pure SVG — no extra deps. Good enough to communicate the relationship map.
export default function SystemGraphViewerTab() {
  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['knowledgeDocuments'],
    queryFn: () => base44.entities.KnowledgeDocument.list('-created_date', 200),
  });

  // Aggregate engine concepts across all documents.
  const engineSummary = useMemo(() => {
    const acc = { actors: new Set(), components: new Set(), blueprints: new Set(), game_modes: new Set(), functions: new Set(), classes: new Set() };
    docs.forEach((d) => {
      const m = d.engine_mapping || {};
      Object.keys(acc).forEach((k) => (m[k] || []).forEach((v) => acc[k].add(v)));
    });
    return Object.fromEntries(Object.entries(acc).map(([k, set]) => [k, [...set]]));
  }, [docs]);

  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Network className="w-6 h-6 text-fuchsia-400" />
          System Graph Viewer
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          High-level relationship map between indexed documents, categories, and engine concepts.
        </p>
      </div>

      {isLoading ? (
        <p className="text-slate-500">Loading graph…</p>
      ) : docs.length === 0 ? (
        <p className="text-slate-500 italic">No knowledge documents yet — the graph will populate after ingestion.</p>
      ) : (
        <>
          {/* Category breakdown */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-300 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Knowledge by Category
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {KNOWLEDGE_CATEGORIES.map((cat) => {
                const count = docs.filter((d) => d.category === cat.id).length;
                return (
                  <div
                    key={cat.id}
                    className="rounded-xl p-3 border"
                    style={{
                      borderColor: count > 0 ? cat.color : 'rgba(148,163,184,0.2)',
                      background: count > 0 ? `${cat.color}10` : 'transparent',
                    }}
                  >
                    <div className="text-xs uppercase tracking-widest" style={{ color: cat.color }}>{cat.label}</div>
                    <div className="text-2xl font-bold text-white mt-1">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Engine concept aggregation */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-300 mb-3">Engine Knowledge Graph</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(engineSummary).map(([key, values]) => (
                <div key={key} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs uppercase tracking-widest text-slate-300 capitalize">{key.replace('_', ' ')}</div>
                    <span className="text-xs text-slate-500">{values.length}</span>
                  </div>
                  {values.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No mappings yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {values.slice(0, 30).map((v) => (
                        <span key={v} className="text-[11px] px-2 py-0.5 rounded bg-slate-700/70 text-slate-200 border border-slate-600/50">
                          {v}
                        </span>
                      ))}
                      {values.length > 30 && <span className="text-[11px] text-slate-500">+{values.length - 30} more</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mapping legend */}
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
            <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">Conceptual Mapping</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-300">
              <div>Actors <span className="text-slate-500">→</span> Entity Systems</div>
              <div>Components <span className="text-slate-500">→</span> Modular Gameplay Modules</div>
              <div>Blueprints <span className="text-slate-500">→</span> Visual Logic Graphs</div>
              <div>Game Modes <span className="text-slate-500">→</span> System States</div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}