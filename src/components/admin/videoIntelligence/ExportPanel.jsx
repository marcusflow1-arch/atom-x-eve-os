import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileJson, FileSpreadsheet, Archive, Copy, Save, Package, Loader2, FileText } from 'lucide-react';

export default function ExportPanel({
  exports, onDownloadZip, onDownloadJson, onDownloadCsv, onDownloadFrames,
  onCopySummary, onSaveRecord, onPackage, busy, action, analysis,
}) {
  const has = !!analysis;
  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-1">Export & Fallback Package</h2>
      <p className="text-slate-400 text-sm mb-4">Download structured artifacts or the full ZIP fallback package for re-upload and review.</p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={onDownloadZip} disabled={!has} className="bg-violet-600 hover:bg-violet-700"><Archive className="w-4 h-4 mr-2" /> Download ZIP package</Button>
        <Button onClick={onDownloadJson} disabled={!has} variant="outline" className="border-slate-600 text-slate-200"><FileJson className="w-4 h-4 mr-2" /> JSON manifest</Button>
        <Button onClick={onDownloadCsv} disabled={!has} variant="outline" className="border-slate-600 text-slate-200"><FileSpreadsheet className="w-4 h-4 mr-2" /> CSV index</Button>
        <Button onClick={onDownloadFrames} disabled={!has} variant="outline" className="border-slate-600 text-slate-200"><Package className="w-4 h-4 mr-2" /> Frames only (ZIP)</Button>
        <Button onClick={onCopySummary} disabled={!has} variant="outline" className="border-slate-600 text-slate-200"><Copy className="w-4 h-4 mr-2" /> Copy summary</Button>
        <Button onClick={onSaveRecord} disabled={!has} variant="outline" className="border-slate-600 text-slate-200"><Save className="w-4 h-4 mr-2" /> Save to database</Button>
        <Button onClick={onPackage} disabled={!has || busy} className="bg-cyan-600 hover:bg-cyan-700">
          {busy && action === 'package' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Packaging…</> : <><Package className="w-4 h-4 mr-2" /> Generate package</>}
        </Button>
      </div>
      {exports.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-500" /> Saved exports</h3>
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