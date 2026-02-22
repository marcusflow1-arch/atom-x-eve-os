import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Loader2, Plus, Trash2, CheckCircle2, XCircle, Cloud, FileText, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { showSuccess, showError } from '@/components/error/ErrorToast';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function CloudKnowledgeImporter({ onComplete }) {
  const queryClient = useQueryClient();
  const [urls, setUrls] = useState([{ url: '', label: '' }]);
  const [folderLabel, setFolderLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Watch pending queue
  const { data: pending = [] } = useQuery({
    queryKey: ['pending-knowledge-urls'],
    queryFn: () => base44.entities.PendingKnowledgeURL.list('-created_date', 50),
    refetchInterval: 5000,
  });

  const activePending = pending.filter(p => p.status === 'pending' || p.status === 'processing');
  const recentCompleted = pending.filter(p => p.status === 'completed').slice(0, 5);
  const recentFailed = pending.filter(p => p.status === 'failed').slice(0, 5);

  const addRow = () => setUrls(prev => [...prev, { url: '', label: '' }]);
  const removeRow = (i) => setUrls(prev => prev.filter((_, idx) => idx !== i));
  const updateRow = (i, field, value) => setUrls(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const handleSubmit = async () => {
    const validUrls = urls.filter(u => u.url.trim());
    if (validUrls.length === 0) { showError('Add at least one URL'); return; }

    setSubmitting(true);
    try {
      // Create PendingKnowledgeURL records — the automation handles everything server-side
      for (const u of validUrls) {
        await base44.entities.PendingKnowledgeURL.create({
          url: u.url.trim(),
          label: u.label.trim() || undefined,
          folder_label: folderLabel || undefined,
          status: 'pending',
        });
      }
      showSuccess(`Queued ${validUrls.length} URL(s) — analysis runs automatically on the server, even if you close the browser.`);
      setUrls([{ url: '', label: '' }]);
      setFolderLabel('');
      queryClient.invalidateQueries({ queryKey: ['pending-knowledge-urls'] });
    } catch (err) {
      showError('Failed to queue: ' + (err?.message || 'Unknown error'));
    }
    setSubmitting(false);
  };

  // When completed items appear, refresh knowledge bank
  React.useEffect(() => {
    if (recentCompleted.length > 0 && onComplete) onComplete();
  }, [recentCompleted.length]);

  const clearCompleted = async () => {
    for (const item of pending.filter(p => p.status === 'completed' || p.status === 'failed')) {
      try {
        await base44.entities.PendingKnowledgeURL.delete(item.id);
      } catch (err) {
        // Ignore if already deleted or not found
        console.log(`Skipped deleting ${item.id}:`, err);
      }
    }
    queryClient.invalidateQueries({ queryKey: ['pending-knowledge-urls'] });
  };

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Cloud className="w-5 h-5 text-indigo-400" />
        <h3 className="text-white font-bold text-sm">Cloud / URL Import</h3>
        <Badge variant="outline" className="text-indigo-400 border-indigo-500/30 text-[9px]">Fully Automatic — Learning & Adapting</Badge>
      </div>
      <p className="text-slate-400 text-xs mb-4">
        Paste any URL and hit submit. The system will <strong className="text-white">study, learn, and adapt</strong> from each file automatically on the server. If a file fails, it will be skipped while the rest continue processing. You can close the browser; the knowledge will be stored in your bank.
      </p>

      {/* Active Queue Indicator */}
      {activePending.length > 0 && (
        <div className="mb-4 rounded-lg border border-purple-500/30 bg-purple-500/10 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
              <span className="text-white font-bold text-xs">{activePending.length} URL(s) being analyzed on server...</span>
            </div>
            <Badge className="bg-purple-500/20 text-purple-300 text-[9px]">Runs Without You</Badge>
          </div>
          <div className="space-y-1">
            {activePending.map(item => (
              <div key={item.id} className="flex items-center gap-2 text-[10px]">
                {item.status === 'processing' 
                  ? <Loader2 className="w-3 h-3 text-cyan-400 animate-spin flex-shrink-0" />
                  : <Clock className="w-3 h-3 text-slate-500 flex-shrink-0" />
                }
                <span className={`flex-1 truncate ${item.status === 'processing' ? 'text-cyan-300' : 'text-slate-400'}`}>
                  {item.label || item.url}
                </span>
                <Badge className={`text-[8px] ${item.status === 'processing' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-400'}`}>
                  {item.status}
                </Badge>
                {item.status === 'pending' && (
                  <button
                    onClick={async () => {
                      try {
                        await base44.entities.PendingKnowledgeURL.delete(item.id);
                        showSuccess('Removed pending URL');
                      } catch (e) { console.log('Already deleted', e); }
                      queryClient.invalidateQueries({ queryKey: ['pending-knowledge-urls'] });
                    }}
                    className="text-red-400/60 hover:text-red-400 transition-colors p-0.5 flex-shrink-0"
                    title="Remove from queue"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Results */}
      {(recentCompleted.length > 0 || recentFailed.length > 0) && (
        <div className="mb-4 rounded-lg border border-slate-700 bg-slate-800/40 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Recent Results</span>
            <Button size="sm" variant="ghost" onClick={clearCompleted} className="text-slate-500 hover:text-white h-6 text-[9px]">
              Clear History
            </Button>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {recentCompleted.length > 0 && (
              <span className="flex items-center gap-1 text-green-400">
                <CheckCircle2 className="w-3 h-3" /> {recentCompleted.length} analyzed
              </span>
            )}
            {recentFailed.length > 0 && (
              <span className="flex items-center gap-1 text-red-400">
                <XCircle className="w-3 h-3" /> {recentFailed.length} failed
              </span>
            )}
          </div>
          {recentFailed.map(item => (
            <p key={item.id} className="text-[9px] text-red-400/70 mt-1 truncate">{item.label || item.url}: {item.error_message}</p>
          ))}
        </div>
      )}

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
              placeholder="Paste URL (Google Doc, GitHub, any public link)"
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

      {/* Supported Formats */}
      <div className="mb-4 p-3 rounded-lg bg-slate-800/40 border border-slate-700">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Supported Sources</p>
        <div className="flex gap-2 flex-wrap">
          {['Google Docs', 'Google Sheets', 'Google Drive Files', 'GitHub Files', 'Raw Text URLs', 'JSON APIs', 'CSV Files'].map(s => (
            <Badge key={s} variant="outline" className="text-[9px] text-slate-400 border-slate-700">{s}</Badge>
          ))}
        </div>
        <p className="text-[9px] text-slate-600 mt-2">
          Google links auto-convert. Make sure "Anyone with the link can view" is enabled. The analysis extracts ALL code, structure, patterns, architecture — everything.
        </p>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={submitting || urls.every(u => !u.url.trim())}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40"
      >
        {submitting ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Queuing...</>
        ) : (
          <><Globe className="w-4 h-4 mr-2" /> Submit for Auto-Analysis</>
        )}
      </Button>
    </div>
  );
}