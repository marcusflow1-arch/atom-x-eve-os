import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TYPE_LABEL = { base_rule: 'Base rule', animation_override: 'Anim override', model_override: 'Model override' };

export default function PastCorrections({ sessions, onReopen, onNew }) {
  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold">Correction History</h2>
        <Button onClick={onNew} variant="outline" size="sm" className="border-slate-600 text-slate-200">New Correction</Button>
      </div>
      {!sessions.length ? (
        <p className="text-slate-500 text-sm py-6 text-center border-2 border-dashed border-slate-800 rounded-xl">No saved corrections yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-left border-b border-slate-700">
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Model</th>
                <th className="py-2 pr-4">Prop</th>
                <th className="py-2 pr-4">Rule</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Approved</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                  <td className="py-2 pr-4 text-slate-200 truncate max-w-[180px]">{s.title || 'Untitled'}</td>
                  <td className="py-2 pr-4 text-slate-300 truncate max-w-[120px]">{s.character_model || '—'}</td>
                  <td className="py-2 pr-4 text-slate-300 truncate max-w-[120px]">{s.prop_name || '—'}</td>
                  <td className="py-2 pr-4 text-slate-300 truncate max-w-[120px]">{s.attachment_rule_name || '—'}</td>
                  <td className="py-2 pr-4"><Badge variant="outline" className="text-xs">{TYPE_LABEL[s.correction_type] || s.correction_type}</Badge></td>
                  <td className="py-2 pr-4">{s.approved ? <Badge className="bg-green-500/20 text-green-300">Yes</Badge> : <Badge className="bg-slate-500/20 text-slate-300">No</Badge>}</td>
                  <td className="py-2 pr-4 text-slate-400">{s.created_date ? new Date(s.created_date).toLocaleDateString() : '—'}</td>
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