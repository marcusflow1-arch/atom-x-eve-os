import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, FileText, Trash2, RefreshCw, Eye, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { KNOWLEDGE_CATEGORIES } from './knowledgeIngestService';
import { showSuccess, showError } from '@/components/error/ErrorToast';

function catColor(id) {
  return KNOWLEDGE_CATEGORIES.find((c) => c.id === id)?.color || '#64748b';
}
function catLabel(id) {
  return KNOWLEDGE_CATEGORIES.find((c) => c.id === id)?.label || id;
}

export default function KnowledgeLibraryTab() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState(null);

  const { data: docs = [], isLoading, refetch } = useQuery({
    queryKey: ['knowledgeDocuments'],
    queryFn: () => base44.entities.KnowledgeDocument.list('-created_date', 200),
  });

  const { data: chunks = [] } = useQuery({
    queryKey: ['knowledgeChunks', selectedDoc?.id],
    queryFn: () => base44.entities.KnowledgeChunk.filter({ document_id: selectedDoc.id }, 'order_index', 100),
    enabled: !!selectedDoc,
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc) => {
      // Delete chunks first, then the document.
      const docChunks = await base44.entities.KnowledgeChunk.filter({ document_id: doc.id }, 'order_index', 500);
      await Promise.all(docChunks.map((c) => base44.entities.KnowledgeChunk.delete(c.id)));
      await base44.entities.KnowledgeDocument.delete(doc.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['knowledgeDocuments'] });
      setSelectedDoc(null);
      showSuccess('Document removed from databank.');
    },
    onError: (err) => showError(err, 'Delete Knowledge Doc'),
  });

  const filtered = filter === 'all' ? docs : docs.filter((d) => d.category === filter);

  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-violet-400" />
            Knowledge Library
          </h2>
          <p className="text-slate-400 text-sm mt-1">{docs.length} indexed documents</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setFilter('all')}
          className={`text-xs px-3 py-1.5 rounded-full border ${filter === 'all' ? 'bg-white/10 border-white/30 text-white' : 'border-slate-700 text-slate-400 hover:text-white'}`}
        >
          All ({docs.length})
        </button>
        {KNOWLEDGE_CATEGORIES.map((cat) => {
          const count = docs.filter((d) => d.category === cat.id).length;
          if (count === 0) return null;
          const active = filter === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className="text-xs px-3 py-1.5 rounded-full border"
              style={{
                borderColor: active ? cat.color : 'rgba(148,163,184,0.3)',
                color: active ? cat.color : 'rgba(148,163,184,0.85)',
                background: active ? `${cat.color}18` : 'transparent',
              }}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          Loading knowledge databank…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No documents in this category yet.</p>
          <p className="text-sm">Ingest a Google Doc or engine file to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm leading-tight truncate flex-1">{doc.title}</h4>
                  <Badge
                    className="text-[10px] flex-shrink-0"
                    style={{ background: `${catColor(doc.category)}22`, color: catColor(doc.category), border: `1px solid ${catColor(doc.category)}55` }}
                  >
                    {catLabel(doc.category)}
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">
                  {doc.source_type.replace('_', ' ')} · {doc.section_count || 0} chunks
                </div>
                {doc.summary && (
                  <p className="text-xs text-slate-300/80 line-clamp-3 italic">{doc.summary}</p>
                )}
                {doc.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {doc.tags.slice(0, 4).map((t) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-300">
                        <Tag className="inline w-2.5 h-2.5 mr-0.5" />{t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <Button size="sm" variant="ghost" onClick={() => setSelectedDoc(doc)}>
                    <Eye className="w-3.5 h-3.5 mr-1" /> View
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => { if (window.confirm(`Delete "${doc.title}"?`)) deleteMutation.mutate(doc); }}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Doc detail modal */}
      <AnimatePresence>
        {selectedDoc && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setSelectedDoc(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">{selectedDoc.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {catLabel(selectedDoc.category)} · {selectedDoc.section_count || 0} chunks
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedDoc(null)}>Close</Button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {selectedDoc.summary && (
                  <div className="text-sm text-slate-200 italic">{selectedDoc.summary}</div>
                )}
                {chunks.map((c) => (
                  <div key={c.id} className="border-l-2 border-slate-700 pl-3">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                      {c.section_path || c.heading || 'Section'} · {c.chunk_type}
                    </div>
                    {c.chunk_type === 'code' ? (
                      <pre className="text-xs bg-black/50 border border-slate-800 rounded p-2 overflow-x-auto text-slate-200">
                        <code>{c.content}</code>
                      </pre>
                    ) : (
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{c.content}</p>
                    )}
                  </div>
                ))}
                {chunks.length === 0 && (
                  <p className="text-sm text-slate-500 italic">No chunks loaded.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}