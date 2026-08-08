import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { STATUS_STYLES } from './avvShared';

export default function PastSessions({ sessions, onReopen, onNew }) {
  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold">Past Sessions</h2>
        <Button onClick={onNew} variant="outline" size="sm" className="border-slate-600 text-slate-200">New Validation</Button>
      </div>
      {!sessions.length ? (
        <p className="text-slate-500 text-sm py-6 text-center border-2 border-dashed border-slate-800 rounded-xl">No saved validation sessions yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-left border-b border-slate-700">
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Model</th>
                <th className="py-2 pr-4">Prop</th>
                <th className="py-2 pr-4">Animation</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Frames</th>
                <th className="py-2 pr-4">Package</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                  <td className="py-2 pr-4 text-slate-200 truncate max-w-[180px]">{s.title || 'Untitled'}</td>
                  <td className="py-2 pr-4 text-slate-300 truncate max-w-[120px]">{s.character_model || '—'}</td>
                  <td className="py-2 pr-4 text-slate-300 truncate max-w-[120px]">{s.weapon_or_prop_name || '—'}</td>
                  <td className="py-2 pr-4 text-slate-300 truncate max-w-[120px]">{s.animation_clip_name || '—'}</td>
                  <td className="py-2 pr-4"><Badge className={STATUS_STYLES[s.status] || 'bg-slate-500/20 text-slate-300'}>{s.status}</Badge></td>
                  <td className="py-2 pr-4 text-slate-300">{s.total_frames ?? '—'}</td>
                  <td className="py-2 pr-4 text-slate-300">{s.packaged ? 'ZIP' : '—'}</td>
                  <td className="py-2 pr-4"><Button size="sm" variant="ghost" onClick={() => onReopen(s.id)} className="text-cyan-400">Reopen</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}