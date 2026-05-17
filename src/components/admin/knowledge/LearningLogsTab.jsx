import React from 'react';
import { Terminal, Loader2, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

// Read-only feed of recently indexed documents — the "AI Learning Log".
export default function LearningLogsTab() {
  const { data: docs = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['knowledgeDocuments', 'recent'],
    queryFn: () => base44.entities.KnowledgeDocument.list('-created_date', 50),
  });

  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Terminal className="w-6 h-6 text-green-400" />
            AI Learning Logs
          </h2>
          <p className="text-slate-400 text-sm mt-1">Most recent ingestions and indexing events.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Refresh
        </Button>
      </div>

      <div className="bg-black border border-slate-800 rounded-xl font-mono text-xs p-4 h-[480px] overflow-y-auto">
        {isLoading ? (
          <div className="text-slate-500">Loading…</div>
        ) : docs.length === 0 ? (
          <div className="text-slate-500 italic">No ingestion events yet.</div>
        ) : (
          docs.map((d) => (
            <div key={d.id} className="mb-2 flex gap-2 items-start">
              <span className="text-slate-600 text-[10px] pt-0.5">
                [{new Date(d.created_date).toLocaleString()}]
              </span>
              <span className="flex-1 break-words">
                <span className={d.status === 'indexed' ? 'text-green-400' : d.status === 'failed' ? 'text-red-400' : 'text-yellow-400'}>
                  {`> ${d.status?.toUpperCase()}`}
                </span>{' '}
                <span className="text-slate-300">{d.source_type}</span>{' · '}
                <span className="text-slate-200">{d.title}</span>{' · '}
                <span className="text-slate-500">{d.section_count || 0} chunks</span>
                {d.error_message && (
                  <div className="text-red-400 mt-0.5">{d.error_message}</div>
                )}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}