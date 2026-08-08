import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { STATUS_STYLES } from './viShared';

export default function PastAnalyses({ analyses, onReopen, onNew }) {
  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold">Past Analyses</h2>
        <Button onClick={onNew} variant="outline" size="sm" className="border-slate-600 text-slate-200">New Analysis</Button>
      </div>
      {!analyses.length ? (
        <p className="text-slate-500 text-sm py-6 text-center border-2 border-dashed border-slate-800 rounded-xl">No saved analyses yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-left border-b border-slate-700">
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Source</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Frames</th>
                <th className="py-2 pr-4">Scenes</th>
                <th className="py-2 pr-4">Exports</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {analyses.map((a) => (
                <tr key={a.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                  <td className="py-2 pr-4 text-slate-200 truncate max-w-[180px]">{a.title || 'Untitled'}</td>
                  <td className="py-2 pr-4 text-slate-400">{a.created_date ? new Date(a.created_date).toLocaleDateString() : '—'}</td>
                  <td className="py-2 pr-4 text-cyan-400 truncate max-w-[180px]"><a href={a.video_url} target="_blank" rel="noreferrer" className="hover:underline">{a.video_url}</a></td>
                  <td className="py-2 pr-4"><Badge className={STATUS_STYLES[a.status] || 'bg-slate-500/20 text-slate-300'}>{a.status}</Badge></td>
                  <td className="py-2 pr-4 text-slate-300">{a.total_frames ?? '—'}</td>
                  <td className="py-2 pr-4 text-slate-300">{a.total_scenes ?? '—'}</td>
                  <td className="py-2 pr-4 text-slate-300">{a.fallback_package_generated ? 'ZIP' : '—'}</td>
                  <td className="py-2 pr-4"><Button size="sm" variant="ghost" onClick={() => onReopen(a.id)} className="text-cyan-400">Reopen</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}