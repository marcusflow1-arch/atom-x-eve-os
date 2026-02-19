import React, { useState, useRef, useEffect, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, Trash2, Loader2, Sparkles, Copy, Check, 
  FileCode, FileJson, FileSpreadsheet, File, Eye, EyeOff, X,
  Zap, Brain, Search, Pin, PinOff, BookOpen,
  FolderOpen, AlertTriangle, CheckCircle2, XCircle, Clock, RotateCcw, SkipForward
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showError, showSuccess } from '@/components/error/ErrorToast';
import ReactMarkdown from 'react-markdown';
import { subscribe, getState, enqueueFiles, clearAll, removeFromQueue, getInterruptedSession, resumeInterrupted, refillContentFromFiles, invalidateKnowledgeCache } from './knowledgeLearner';
import CloudKnowledgeImporter from './CloudKnowledgeImporter';
import ZipBatchUploader from './ZipBatchUploader';

// Note: Content is now persisted to IndexedDB by the learner engine,
// so learning survives page refreshes automatically.

// ─── Helpers ────────────────────────────────────────
const FILE_ICONS = {
  json: FileJson, js: FileCode, jsx: FileCode, ts: FileCode, tsx: FileCode,
  css: FileCode, html: FileCode, csv: FileSpreadsheet, xlsx: FileSpreadsheet,
  txt: FileText, md: FileText, pdf: FileText, png: File, jpg: File, jpeg: File,
};
function getFileIcon(name) { return FILE_ICONS[name.split('.').pop()?.toLowerCase()] || File; }

function classifyFile(name) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['json','yaml','yml','env','config','toml'].includes(ext)) return 'config';
  if (['js','jsx','ts','tsx','py','cs','cpp','c','java','rb','go','rs'].includes(ext)) return 'code';
  if (['csv','xlsx','xls','tsv'].includes(ext)) return 'data';
  if (['md','txt','doc','docx','pdf'].includes(ext)) return 'documentation';
  if (['png','jpg','jpeg','gif','webp','svg','glb','gltf','fbx','obj'].includes(ext)) return 'asset';
  if (['psd','ai','fig','sketch','xd'].includes(ext)) return 'design';
  return 'other';
}

const CATEGORY_COLORS = {
  code: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  data: 'bg-green-500/15 text-green-400 border-green-500/25',
  config: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  asset: 'bg-pink-500/15 text-pink-400 border-pink-500/25',
  documentation: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
  design: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  other: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
};

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// ─── Hook into global learner engine ────────────────
function useLearnerState() {
  const [state, setState] = useState(getState);
  useEffect(() => subscribe(setState), []);
  return state;
}

// ─── Knowledge Card ─────────────────────────────────
function KnowledgeCard({ entry, onDelete, onTogglePin }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const Icon = getFileIcon(entry.source_filename);
  const catColor = CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.other;

  const handleCopy = () => {
    navigator.clipboard.writeText(entry.full_analysis + (entry.extracted_code ? '\n\n--- CODE ---\n' + entry.extracted_code : ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-slate-800/50 border rounded-xl overflow-hidden ${entry.is_pinned ? 'border-amber-500/40' : 'border-slate-700'}`}
    >
      <div className="flex items-center gap-3 p-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${catColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-white font-semibold text-sm truncate">{entry.source_filename}</h4>
            {entry.is_pinned && <Pin className="w-3 h-3 text-amber-400 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-slate-500 text-xs truncate">{entry.summary || 'Knowledge entry'}</p>
            <span className="text-slate-600 text-[10px] flex-shrink-0">
              {entry.analyzed_date ? new Date(entry.analyzed_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : entry.created_date ? new Date(entry.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <Badge variant="outline" className={`text-[9px] py-0 ${catColor}`}>{entry.category}</Badge>
            {entry.tags?.slice(0, 4).map(tag => (
              <Badge key={tag} variant="outline" className="text-[9px] py-0 text-slate-500 border-slate-700">{tag}</Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button size="icon" variant="ghost" onClick={() => onTogglePin(entry)} className="h-7 w-7 text-amber-400/60 hover:text-amber-400">
            {entry.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={handleCopy} className="h-7 w-7 text-cyan-400/60 hover:text-cyan-400">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setExpanded(!expanded)} className="h-7 w-7 text-slate-400 hover:text-white">
            {expanded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onDelete(entry.id)} className="h-7 w-7 text-red-400/60 hover:text-red-400">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="border-t border-slate-700 p-4 space-y-4">
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-3">
                  <Brain className="w-3.5 h-3.5" /> Full Analysis
                </div>
                <div className="text-sm text-slate-300 leading-relaxed prose prose-invert prose-sm max-w-none max-h-[400px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  <ReactMarkdown>{entry.full_analysis}</ReactMarkdown>
                </div>
              </div>
              {entry.extracted_code && (
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                  <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-3">
                    <FileCode className="w-3.5 h-3.5" /> Extracted Code / Data
                  </div>
                  <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap max-h-[300px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    {entry.extracted_code}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Live Progress Dashboard ────────────────────────
function LearnerDashboard({ learner, onRefreshKnowledge, onReselectFolder }) {
  const { queue, completed, failed, skipped, currentId, isRunning, progress, folderName, lastLog } = learner;
  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  const needsReread = queue.filter(q => q.needsReread).length;

  // Auto-refresh knowledge bank when items complete
  const prevDone = useRef(progress.done);
  useEffect(() => {
    if (progress.done > prevDone.current) {
      onRefreshKnowledge();
      prevDone.current = progress.done;
    }
  }, [progress.done, onRefreshKnowledge]);

  if (!isRunning && progress.total === 0 && completed.length === 0 && failed.length === 0 && skipped.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-purple-500/30 bg-purple-500/5 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-purple-500/10 border-b border-purple-500/20">
        <div className="flex items-center gap-3">
          {isRunning ? (
            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
          ) : needsReread > 0 ? (
            <RotateCcw className="w-5 h-5 text-amber-400" />
          ) : progress.total > 0 ? (
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          ) : null}
          <div>
            <span className="text-white font-bold text-sm">
              {isRunning ? 'Learning in progress...' : needsReread > 0 ? `${needsReread} files need folder re-select to resume` : 'Learning complete'}
            </span>
            {folderName && <span className="text-purple-300/60 text-xs ml-2">from {folderName}/</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-purple-300 text-xs font-mono">{progress.done}/{progress.total}</span>
          {needsReread > 0 && !isRunning && (
            <Button size="sm" onClick={onReselectFolder} className="bg-amber-600 hover:bg-amber-700 text-white h-7 text-xs">
              <FolderOpen className="w-3 h-3 mr-1" /> Re-select Folder
            </Button>
          )}
          {!isRunning && (
            <Button size="sm" variant="ghost" onClick={clearAll} className="text-slate-400 hover:text-white h-7 text-xs">
              Dismiss
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-purple-900/40">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Live status */}
      <div className="px-4 py-3">
        {/* Current file being analyzed */}
        {isRunning && currentId && (() => {
          const current = queue.find(f => f.id === currentId) || { name: '...' };
          return (
            <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-slate-800/60 border border-slate-700">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin flex-shrink-0" />
              <span className="text-cyan-300 text-xs font-medium truncate flex-1">{current.name}</span>
              <Badge className="bg-cyan-500/20 text-cyan-400 text-[9px]">Analyzing</Badge>
            </div>
          );
        })()}

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs flex-wrap">
          {completed.length > 0 && (
            <span className="flex items-center gap-1 text-green-400">
              <CheckCircle2 className="w-3 h-3" /> {completed.length} learned
            </span>
          )}
          {skipped.length > 0 && (
            <span className="flex items-center gap-1 text-slate-400">
              <SkipForward className="w-3 h-3" /> {skipped.length} skipped (duplicates)
            </span>
          )}
          {failed.length > 0 && (
            <span className="flex items-center gap-1 text-red-400">
              <XCircle className="w-3 h-3" /> {failed.length} failed
            </span>
          )}
          {isRunning && queue.length > 1 && (
            <span className="text-slate-500">{queue.length - 1} remaining in queue</span>
          )}
          {needsReread > 0 && !isRunning && (
            <span className="text-amber-400">{needsReread} waiting for folder re-select</span>
          )}
        </div>

        {/* Last log message */}
        {lastLog && (
          <div className="mt-2 text-[11px] text-slate-500 font-mono truncate px-1">
            {lastLog}
          </div>
        )}

        {/* Failed files details */}
        {failed.length > 0 && (
          <div className="mt-3 space-y-1 max-h-32 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {failed.map(f => (
              <div key={f.id} className="flex items-center gap-2 text-xs text-red-400/70 px-2">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{f.name}: {f.error}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────
export default function GameFileAnalyzer() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const resumeFolderInputRef = useRef(null);
  const [readingFolder, setReadingFolder] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [interruptedSession, setInterruptedSession] = useState(null);
  const [resuming, setResuming] = useState(false);

  // Subscribe to the global learner engine (persists across tab switches)
  const learner = useLearnerState();

  // On mount, check for interrupted session
  useEffect(() => {
    const session = getInterruptedSession();
    if (session) setInterruptedSession(session);
  }, []);

  // Knowledge bank from DB
  const { data: knowledgeEntries = [], isLoading } = useQuery({
    queryKey: ['knowledge-entries'],
    queryFn: () => base44.entities.KnowledgeEntry.list('-created_date', 100),
  });

  const refreshKnowledge = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['knowledge-entries'] });
    invalidateKnowledgeCache();
  }, [queryClient]);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.KnowledgeEntry.delete(id),
    onSuccess: () => { refreshKnowledge(); showSuccess('Knowledge removed'); },
  });

  const togglePinMutation = useMutation({
    mutationFn: (entry) => base44.entities.KnowledgeEntry.update(entry.id, { is_pinned: !entry.is_pinned }),
    onSuccess: refreshKnowledge,
  });

  // ─── Read files from filesystem into items ────────
  const processFileList = async (fileList, isFolder) => {
    const items = [];
    for (const file of fileList) {
      const displayName = (isFolder && file.webkitRelativePath) ? file.webkitRelativePath : file.name;

      // Skip junk
      if (displayName.includes('node_modules/') || displayName.includes('.git/') ||
          displayName.includes('__pycache__/') || displayName.includes('.DS_Store') ||
          displayName.includes('dist/') || displayName.includes('build/') ||
          file.name.startsWith('.')) continue;

      // Skip very large files (over 2MB)
      if (file.size > 2 * 1024 * 1024) continue;

      const category = classifyFile(file.name);
      const isTextBased = !['asset', 'design'].includes(category);

      let content = '';
      if (isTextBased) {
        try { content = await readFileAsText(file); } catch { content = '[Could not read]'; }
      }

      items.push({
        id: Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '_' + file.name,
        name: displayName,
        size: file.size,
        category,
        content: content.substring(0, 50000),
        rawFile: file,
        needsUpload: !isTextBased,
        status: 'queued',
      });
    }
    return items;
  };

  // Individual file picker
  const handleFilePick = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    const items = await processFileList(selected, false);
    const { added, dupes } = await enqueueFiles(items, null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showSuccess(dupes > 0 ? `Queued ${added} file(s), ${dupes} duplicate(s) skipped` : `Queued ${added} file(s) for learning`);
  };

  // Folder picker — THE MAIN FEATURE
  const handleFolderPick = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    setReadingFolder(true);

    const folderName = selected[0]?.webkitRelativePath?.split('/')[0] || 'folder';
    const items = await processFileList(selected, true);

    setReadingFolder(false);

    if (items.length === 0) {
      showError('No readable files found in that folder');
      return;
    }

    // Enqueue everything — engine deduplicates automatically and keeps running across tab switches
    const { added, dupes } = await enqueueFiles(items, folderName);
    if (folderInputRef.current) folderInputRef.current.value = '';
    setInterruptedSession(null); // clear any old interrupted session banner
    const msg = dupes > 0
      ? `Queued ${added} new files from "${folderName}" (${dupes} duplicates skipped)`
      : `Queued ${added} files from "${folderName}" — learning continues even if you switch tabs`;
    showSuccess(msg);
  };

  // Filter knowledge
  const filtered = knowledgeEntries
    .filter(e => filterCat === 'all' || e.category === filterCat)
    .filter(e => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return e.source_filename?.toLowerCase().includes(q) ||
             e.summary?.toLowerCase().includes(q) ||
             e.tags?.some(t => t.toLowerCase().includes(q));
    })
    .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));

  const categories = ['all', 'code', 'data', 'config', 'asset', 'documentation', 'design', 'other'];

  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-cyan-500" />
            Knowledge Bank
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Select a folder from your PC — AI reads every file locally, extracts knowledge, and stores it permanently
          </p>
        </div>
        <Badge variant="outline" className="text-slate-400">
          <BookOpen className="w-3 h-3 mr-1" />
          {knowledgeEntries.length} Entries
        </Badge>
      </div>

      {/* ─── INTERRUPTED SESSION BANNER ─── */}
      {interruptedSession && !learner.isRunning && learner.queue.length === 0 && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RotateCcw className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-white font-bold text-sm">Interrupted session found</p>
                <p className="text-amber-300/60 text-xs mt-0.5">
                  {interruptedSession.fileCount} file{interruptedSession.fileCount !== 1 ? 's' : ''} from
                  {interruptedSession.folderName ? ` "${interruptedSession.folderName}/"` : ' a previous session'} were not finished.
                  Re-select the same folder to resume where you left off.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button size="sm" onClick={async () => {
                setResuming(true);
                await resumeInterrupted();
                setInterruptedSession(null);
                setResuming(false);
                // The queue now has items with needsReread=true, prompt user to re-select folder
              }} disabled={resuming} className="bg-amber-600 hover:bg-amber-700 text-white">
                {resuming ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RotateCcw className="w-3.5 h-3.5 mr-1" />}
                Resume
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { clearAll(); setInterruptedSession(null); }} className="text-slate-400 hover:text-white">
                Discard
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden input for re-selecting folder to refill content */}
      <input ref={resumeFolderInputRef} type="file" webkitdirectory="" directory="" multiple className="hidden"
        onChange={async (e) => {
          const files = Array.from(e.target.files || []);
          if (!files.length) return;
          const matched = await refillContentFromFiles(files);
          if (resumeFolderInputRef.current) resumeFolderInputRef.current.value = '';
          showSuccess(matched > 0 ? `Matched ${matched} file(s) — resuming learning!` : 'No matching files found. Make sure you selected the same folder.');
        }}
      />

      {/* ─── ZIP BATCH UPLOAD ─── */}
      <div className="mb-6">
        <ZipBatchUploader onRefreshKnowledge={refreshKnowledge} />
      </div>

      {/* ─── CLOUD / URL IMPORT (server-side — no refresh issues) ─── */}
      <div className="mb-6">
        <CloudKnowledgeImporter onComplete={refreshKnowledge} />
      </div>

      {/* ─── FOLDER / FILE PICKER (local — can be interrupted by refresh) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* PRIMARY: Folder Picker */}
        <div 
          className="border-2 border-dashed border-purple-500/30 hover:border-purple-400/60 rounded-xl p-8 text-center transition-all cursor-pointer group bg-purple-500/[0.03] hover:bg-purple-500/[0.06] md:col-span-1"
          onClick={() => !readingFolder && folderInputRef.current?.click()}
        >
          <input ref={folderInputRef} type="file" webkitdirectory="" directory="" multiple onChange={handleFolderPick} className="hidden" />
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 group-hover:border-purple-400/40 flex items-center justify-center transition-colors">
              {readingFolder 
                ? <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                : <FolderOpen className="w-8 h-8 text-purple-400 group-hover:text-purple-300 transition-colors" />
              }
            </div>
            <div>
              <p className="text-white font-bold text-lg">Select Folder</p>
              <p className="text-slate-400 text-xs mt-1 max-w-[260px] mx-auto">
                Opens your file explorer — select any project folder. Every file inside is read locally, analyzed by AI, and stored as knowledge.
              </p>
              <p className="text-purple-400/60 text-[10px] mt-2 font-mono">
                Continues running even if you switch tabs
              </p>
            </div>
          </div>
        </div>

        {/* SECONDARY: Individual Files */}
        <div 
          className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl p-8 text-center transition-colors cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" multiple onChange={handleFilePick} className="hidden" />
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 group-hover:border-cyan-500/30 flex items-center justify-center transition-colors">
              <Upload className="w-8 h-8 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </div>
            <div>
              <p className="text-white font-semibold">Select Individual Files</p>
              <p className="text-slate-500 text-xs mt-1">Pick specific files instead of a whole folder</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── LIVE PROGRESS DASHBOARD ─── */}
      <LearnerDashboard learner={learner} onRefreshKnowledge={refreshKnowledge} onReselectFolder={() => resumeFolderInputRef.current?.click()} />

      {/* ─── KNOWLEDGE BANK ─── */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input placeholder="Search knowledge..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-slate-800/50 border-slate-700 pl-10" />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {categories.map(cat => (
            <Button key={cat} size="sm" variant={filterCat === cat ? 'default' : 'ghost'} onClick={() => setFilterCat(cat)} className={`text-xs capitalize ${filterCat === cat ? '' : 'text-slate-500'}`}>
              {cat === 'all' ? 'All' : cat}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          Loading knowledge bank...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500 border border-slate-800 rounded-xl bg-slate-900/30">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{knowledgeEntries.length === 0 ? 'Knowledge bank is empty' : 'No matches found'}</p>
          <p className="text-sm mt-1">{knowledgeEntries.length === 0 ? 'Select a folder above to start building your knowledge base' : 'Try a different search or category'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map(entry => (
              <KnowledgeCard key={entry.id} entry={entry} onDelete={(id) => deleteMutation.mutate(id)} onTogglePin={(e) => togglePinMutation.mutate(e)} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}