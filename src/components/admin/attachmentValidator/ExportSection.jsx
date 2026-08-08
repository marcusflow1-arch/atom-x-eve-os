import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Archive, FileJson, FileSpreadsheet, FileText, Package, Loader2 } from 'lucide-react';

export default function ExportSection({
  exports, onDownloadZip, onDownloadJson, onDownloadCsv, onDownloadSummary,
  onPackage, busy, action, hasSession,
}) {
  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-1">Export & Fallback Evidence Package</h2>
      <p className="text-slate-400 text-sm mb-4">Download the frame evidence set for re-upload and further inspection if needed.</p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={onDownloadZip} disabled={!hasSession} className="bg-violet-600 hover:bg-violet-700"><Archive className="w-4 h-4 mr-2" /> Download ZIP package</Button>
        <Button onClick={onDownloadJson} disabled={!hasSession} variant="outline" className="border-slate-600 text-slate-200"><FileJson className="w-4 h-4 mr-2" /> JSON manifest</Button>
        <Button onClick={onDownloadCsv} disabled={!hasSession} variant="outline" className="border-slate-600 text-slate-200"><FileSpreadsheet className="w-4 h-4 mr-2" /> CSV frame index</Button>
        <Button onClick={onDownloadSummary} disabled={!hasSession} variant="outline" className="border-slate-600 text-slate-200"><FileText className="w-4 h-4 mr-2" /> Summary markdown</Button>
        <Button onClick={onPackage} disabled={!hasSession || busy} className="bg-cyan-600 hover:bg-cyan-700">
          {busy && action === 'package' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Packaging…</> : <><Package className="w-4 h-4 mr-2" /> Generate package</>}
        </Button>
      </div>
      {exports.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Saved exports</h3>
          <div className="space-y-2">
            {exports.map((e) => (
              <div key={e.id} className="flex items-center justify-between bg-slate-800/40 border border-slate-700 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline" className="text-xs uppercase shrink-0">{e.export_type}</Badge>
                  <span className="text-sm text-slate-300 truncate">{e.label}</span>
                </div>
                <a href={e.file_url} target="_blank" rel="noreferrer" download className="text-cyan-400 text-sm hover:underline shrink-0 ml-3">Open</a>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}