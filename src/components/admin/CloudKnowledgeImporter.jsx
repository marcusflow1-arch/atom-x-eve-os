import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Link2, Loader2, Plus, Trash2, CheckCircle2, XCircle, Cloud, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { showSuccess, showError } from '@/components/error/ErrorToast';
import { analyzeRemoteFile } from '@/functions/analyzeRemoteFile';

export default function CloudKnowledgeImporter({ onComplete }) {
  const [urls, setUrls] = useState([{ url: '', label: '' }]);
  const [folderLabel, setFolderLabel] = useState('');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const addRow = () => setUrls(prev => [...prev, { url: '', label: '' }]);
  const removeRow = (i) => setUrls(prev => prev.filter((_, idx) => idx !== i));
  const updateRow = (i, field, value) => setUrls(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const handleProcess = async () => {
    const validUrls = urls.filter(u => u.url.trim());
    if (validUrls.length === 0) { showError('Add at least one URL'); return; }

    setProcessing(true);
    setResults(null);
    try {
      const res = await analyzeRemoteFile({
        urls: validUrls.map(u => ({ url: u.url.trim(), label: u.label.trim() || undefined })),
        folderLabel: folderLabel || undefined,
      });
      setResults(res.data || res);
      showSuccess(`Done! ${res.data?.processed || 0} files analyzed, ${res.data?.skipped || 0} skipped`);
      if (onComplete) onComplete();
    } catch (err) {
      showError('Failed: ' + (err?.message || 'Unknown error'));
    }
    setProcessing(false);
  };

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Cloud className="w-5 h-5 text-indigo-400" />
        <h3 className="text-white font-bold text-sm">Cloud / URL Import</h3>
        <Badge variant="outline" className="text-indigo-400 border-indigo-500/30 text-[9px]">Server-Side — No Refresh Issues</Badge>
      </div>
      <p className="text-slate-400 text-xs mb-4">
        Paste Google Docs, Google Sheets, GitHub, or any public URL. Files are fetched and analyzed <strong className="text-white">server-side</strong> — no local PC dependency, no refresh interruptions. Works even if you close the browser.
      </p>

      {/* Folder Label */}
      <div className="mb-3">
        <Input
          placeholder="Label this batch (optional, e.g. 'Unreal Character System')"
          value={folderLabel}
          onChange={(e) => setFolderLabel(e.target.value)}
          className="bg-slate-800/50 border-slate-700 text-xs"
        />
      </div>

      {/* URL Rows */}
      <div className="space-y-2 mb-4">
        {urls.map((row, i) => (
          <div key={i} className="flex gap-2">
            <Input
              placeholder="Paste URL (Google Doc, GitHub, etc.)"
              value={row.url}
              onChange={(e) => updateRow(i, 'url', e.target.value)}
              className="flex-1 bg-slate-800/50 border-slate-700 text-xs"
            />
            <Input
              placeholder="Label (optional)"
              value={row.label}
              onChange={(e) => updateRow(i, 'label', e.target.value)}
              className="w-40 bg-slate-800/50 border-slate-700 text-xs"
            />
            {urls.length > 1 && (
              <Button size="icon" variant="ghost" onClick={() => removeRow(i)} className="h-9 w-9 text-red-400/60 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Button size="sm" variant="ghost" onClick={addRow} className="text-indigo-400 text-xs">
          <Plus className="w-3 h-3 mr-1" /> Add Another URL
        </Button>
      </div>

      {/* Supported Formats Hint */}
      <div className="mb-4 p-3 rounded-lg bg-slate-800/40 border border-slate-700">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Supported Sources</p>
        <div className="flex gap-2 flex-wrap">
          {['Google Docs', 'Google Sheets', 'GitHub Files', 'Raw Text URLs', 'JSON APIs', 'CSV Files'].map(s => (
            <Badge key={s} variant="outline" className="text-[9px] text-slate-400 border-slate-700">{s}</Badge>
          ))}
        </div>
        <p className="text-[9px] text-slate-600 mt-2">
          Google links auto-convert to downloadable format. Make sure Google Docs/Sheets are set to "Anyone with the link can view".
        </p>
      </div>

      {/* Process Button */}
      <Button
        onClick={handleProcess}
        disabled={processing || urls.every(u => !u.url.trim())}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40"
      >
        {processing ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing on Server...</>
        ) : (
          <><Globe className="w-4 h-4 mr-2" /> Analyze from Cloud</>
        )}
      </Button>

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 rounded-lg border border-slate-700 bg-slate-800/40">
            <div className="flex items-center gap-4 text-xs">
              {results.processed > 0 && (
                <span className="flex items-center gap-1 text-green-400"><CheckCircle2 className="w-3 h-3" />{results.processed} learned</span>
              )}
              {results.skipped > 0 && (
                <span className="flex items-center gap-1 text-slate-400"><FileText className="w-3 h-3" />{results.skipped} skipped (dupes)</span>
              )}
              {results.failed > 0 && (
                <span className="flex items-center gap-1 text-red-400"><XCircle className="w-3 h-3" />{results.failed} failed</span>
              )}
            </div>
            {results.errors?.length > 0 && (
              <div className="mt-2 space-y-1 max-h-24 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                {results.errors.map((e, i) => (
                  <p key={i} className="text-[9px] text-red-400/70 truncate">{e.url}: {e.error}</p>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}