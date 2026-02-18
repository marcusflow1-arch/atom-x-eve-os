import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, FolderOpen, Upload, Loader2, CheckCircle2, XCircle, SkipForward,
  AlertTriangle, RotateCcw, Clock, X, HardDrive, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  subscribe, getState, enqueueFiles, clearAll,
  getInterruptedSession, resumeInterrupted, refillContentFromFiles, invalidateKnowledgeCache
} from '../admin/knowledgeLearner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { showSuccess, showError } from '@/components/error/ErrorToast';
import { saveKnowledgeLocally, getLocalKnowledgeCount, exportLocalKnowledge } from './localKnowledgeStore';

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

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function useLearnerState() {
  const [state, setState] = useState(getState);
  useEffect(() => subscribe(setState), []);
  return state;
}

export default function KnowledgeLearnerPanel({ onClose }) {
  const queryClient = useQueryClient();
  const folderInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const resumeFolderInputRef = useRef(null);
  const [readingFolder, setReadingFolder] = useState(false);
  const [interruptedSession, setInterruptedSession] = useState(null);
  const [resuming, setResuming] = useState(false);
  const [localCount, setLocalCount] = useState(0);
  const learner = useLearnerState();

  useEffect(() => {
    const session = getInterruptedSession();
    if (session) setInterruptedSession(session);
    getLocalKnowledgeCount().then(setLocalCount);
  }, []);

  // Sync cloud knowledge to local storage whenever knowledge bank updates
  const { data: knowledgeEntries = [] } = useQuery({
    queryKey: ['knowledge-entries'],
    queryFn: () => base44.entities.KnowledgeEntry.list('-created_date', 500),
  });

  // Auto-save to local storage when entries change
  useEffect(() => {
    if (knowledgeEntries.length > 0) {
      saveKnowledgeLocally(knowledgeEntries).then(() => {
        getLocalKnowledgeCount().then(setLocalCount);
      });
    }
  }, [knowledgeEntries]);

  // Auto-refresh when learner completes items
  const prevDone = useRef(learner.progress.done);
  useEffect(() => {
    if (learner.progress.done > prevDone.current) {
      queryClient.invalidateQueries({ queryKey: ['knowledge-entries'] });
      invalidateKnowledgeCache();
      prevDone.current = learner.progress.done;
    }
  }, [learner.progress.done]);

  const processFileList = async (fileList, isFolder) => {
    const items = [];
    for (const file of fileList) {
      const displayName = (isFolder && file.webkitRelativePath) ? file.webkitRelativePath : file.name;
      if (displayName.includes('node_modules/') || displayName.includes('.git/') ||
          displayName.includes('__pycache__/') || displayName.includes('.DS_Store') ||
          displayName.includes('dist/') || displayName.includes('build/') ||
          file.name.startsWith('.')) continue;
      if (file.size > 2 * 1024 * 1024) continue;

      const category = classifyFile(file.name);
      const isTextBased = !['asset', 'design'].includes(category);
      let content = '';
      if (isTextBased) {
        try { content = await readFileAsText(file); } catch { content = '[Could not read]'; }
      }
      items.push({
        id: Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '_' + file.name,
        name: displayName, size: file.size, category,
        content: content.substring(0, 50000), rawFile: file,
        needsUpload: !isTextBased, status: 'queued',
      });
    }
    return items;
  };

  const handleFolderPick = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    setReadingFolder(true);
    const folderName = selected[0]?.webkitRelativePath?.split('/')[0] || 'folder';
    const items = await processFileList(selected, true);
    setReadingFolder(false);
    if (items.length === 0) { showError('No readable files found'); return; }
    const { added, dupes } = await enqueueFiles(items, folderName);
    if (folderInputRef.current) folderInputRef.current.value = '';
    setInterruptedSession(null);
    showSuccess(dupes > 0 ? `Queued ${added} files (${dupes} duplicates skipped)` : `Queued ${added} files — learning continues in background`);
  };

  const handleFilePick = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    const items = await processFileList(selected, false);
    const { added, dupes } = await enqueueFiles(items, null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showSuccess(dupes > 0 ? `Queued ${added}, ${dupes} skipped` : `Queued ${added} file(s)`);
  };

  const handleExportLocal = async () => {
    const blob = await exportLocalKnowledge();
    if (!blob) { showError('No local knowledge to export'); return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'atom_eve_knowledge_bank.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    showSuccess('Knowledge bank exported');
  };

  const pct = learner.progress.total > 0 ? Math.round((learner.progress.done / learner.progress.total) * 100) : 0;
  const needsReread = learner.queue.filter(q => q.needsReread).length;
  const isActive = learner.isRunning || learner.progress.total > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-cyan-400" />
          <span className="text-white font-bold text-sm tracking-wider">KNOWLEDGE LEARNER</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center">
            <X className="w-3.5 h-3.5 text-white/60" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
        {/* Interrupted Session Banner */}
        {interruptedSession && !learner.isRunning && learner.queue.length === 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span className="text-white text-xs font-bold">Interrupted session ({interruptedSession.fileCount} files)</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={async () => {
                setResuming(true);
                await resumeInterrupted();
                setInterruptedSession(null);
                setResuming(false);
              }} disabled={resuming} className="bg-amber-600 hover:bg-amber-700 text-white h-7 text-xs flex-1">
                {resuming ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RotateCcw className="w-3 h-3 mr-1" />}
                Resume
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { clearAll(); setInterruptedSession(null); }} className="text-slate-400 h-7 text-xs">
                Discard
              </Button>
            </div>
          </div>
        )}

        {/* Folder Picker */}
        <div
          className="border-2 border-dashed border-purple-500/30 hover:border-purple-400/60 rounded-xl p-6 text-center transition-all cursor-pointer group bg-purple-500/[0.03]"
          onClick={() => !readingFolder && folderInputRef.current?.click()}
        >
          <input ref={folderInputRef} type="file" webkitdirectory="" directory="" multiple onChange={handleFolderPick} className="hidden" />
          <div className="flex flex-col items-center gap-2">
            {readingFolder 
              ? <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
              : <FolderOpen className="w-10 h-10 text-purple-400 group-hover:text-purple-300 transition-colors" />
            }
            <p className="text-white font-bold text-sm">Select Folder</p>
            <p className="text-slate-500 text-[10px]">AI analyzes every file and stores knowledge permanently</p>
          </div>
        </div>

        {/* Individual Files */}
        <div
          className="border border-dashed border-slate-700 hover:border-cyan-500/40 rounded-xl p-4 text-center cursor-pointer group transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" multiple onChange={handleFilePick} className="hidden" />
          <div className="flex items-center justify-center gap-3">
            <Upload className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            <span className="text-slate-400 text-sm group-hover:text-white transition-colors">Or select individual files</span>
          </div>
        </div>

        {/* Hidden resume folder input */}
        <input ref={resumeFolderInputRef} type="file" webkitdirectory="" directory="" multiple className="hidden"
          onChange={async (e) => {
            const files = Array.from(e.target.files || []);
            if (!files.length) return;
            const matched = await refillContentFromFiles(files);
            if (resumeFolderInputRef.current) resumeFolderInputRef.current.value = '';
            showSuccess(matched > 0 ? `Matched ${matched} file(s) — resuming!` : 'No matching files found.');
          }}
        />

        {/* Progress */}
        {isActive && (
          <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-purple-500/10">
              <div className="flex items-center gap-2">
                {learner.isRunning ? (
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                ) : needsReread > 0 ? (
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                )}
                <span className="text-white text-xs font-bold">
                  {learner.isRunning ? 'Learning...' : needsReread > 0 ? 'Needs folder re-select' : 'Complete'}
                </span>
              </div>
              <span className="text-purple-300 text-[10px] font-mono">{learner.progress.done}/{learner.progress.total}</span>
            </div>
            <div className="h-1 bg-purple-900/40">
              <motion.div className="h-full bg-gradient-to-r from-purple-500 to-cyan-400" animate={{ width: `${pct}%` }} />
            </div>
            <div className="px-3 py-2 flex items-center gap-3 text-[10px] flex-wrap">
              {learner.completed.length > 0 && (
                <span className="flex items-center gap-1 text-green-400"><CheckCircle2 className="w-2.5 h-2.5" /> {learner.completed.length}</span>
              )}
              {learner.skipped.length > 0 && (
                <span className="flex items-center gap-1 text-slate-400"><SkipForward className="w-2.5 h-2.5" /> {learner.skipped.length}</span>
              )}
              {learner.failed.length > 0 && (
                <span className="flex items-center gap-1 text-red-400"><XCircle className="w-2.5 h-2.5" /> {learner.failed.length}</span>
              )}
              {needsReread > 0 && !learner.isRunning && (
                <Button size="sm" onClick={() => resumeFolderInputRef.current?.click()} className="bg-amber-600 hover:bg-amber-700 text-white h-5 text-[9px] px-2">
                  Re-select Folder
                </Button>
              )}
              {!learner.isRunning && (
                <Button size="sm" variant="ghost" onClick={clearAll} className="text-slate-500 h-5 text-[9px] px-2 ml-auto">
                  Dismiss
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Local Storage Status */}
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span className="text-white text-xs font-bold">Local Storage</span>
            </div>
            <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/30">
              {localCount} entries cached
            </Badge>
          </div>
          <p className="text-slate-500 text-[10px] mb-2">
            Knowledge is auto-saved to your device. When you install the desktop app, this data persists offline.
          </p>
          <Button size="sm" variant="outline" onClick={handleExportLocal} className="w-full h-7 text-xs text-slate-300 border-slate-600">
            <Download className="w-3 h-3 mr-1" /> Export Knowledge Bank (JSON)
          </Button>
        </div>

        {/* Cloud stats */}
        <div className="text-center text-slate-500 text-[10px] py-2">
          <span className="text-cyan-400 font-bold">{knowledgeEntries.length}</span> entries in cloud • <span className="text-emerald-400 font-bold">{localCount}</span> cached locally
        </div>
      </div>
    </div>
  );
}