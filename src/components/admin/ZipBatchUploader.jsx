import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Archive, Upload, Loader2, CheckCircle2, XCircle, AlertTriangle,
  Trash2, Play, FileArchive, FolderOpen, X, Brain, SkipForward, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { showError, showSuccess } from '@/components/error/ErrorToast';
import { enqueueFiles, invalidateKnowledgeCache } from './knowledgeLearner';

const UPLOADER_STORAGE_KEY = 'zip_batch_uploader_state';

// JSZip for client-side ZIP extraction
let JSZipLib = null;
async function loadJSZip() {
  if (JSZipLib) return JSZipLib;
  const mod = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
  JSZipLib = mod.default || mod;
  return JSZipLib;
}

function classifyFile(name) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['json','yaml','yml','env','config','toml','ini','cfg'].includes(ext)) return 'config';
  if (['js','jsx','ts','tsx','py','cs','cpp','c','java','rb','go','rs','h','hpp','lua','swift','kt'].includes(ext)) return 'code';
  if (['csv','xlsx','xls','tsv'].includes(ext)) return 'data';
  if (['md','txt','doc','docx','pdf','rst','log'].includes(ext)) return 'documentation';
  if (['png','jpg','jpeg','gif','webp','svg','glb','gltf','fbx','obj','uasset','umap'].includes(ext)) return 'asset';
  if (['psd','ai','fig','sketch','xd'].includes(ext)) return 'design';
  return 'other';
}

function shouldSkip(path) {
  const lower = path.toLowerCase();
  const skipPatterns = [
    'node_modules/', '.git/', '__pycache__/', '.ds_store', 'thumbs.db',
    'dist/', 'build/', '.vs/', '.idea/', '__macosx/', '.egstore/',
    'intermediate/', 'saved/', 'deriveddatacache/', 'binaries/',
  ];
  if (path.startsWith('.') || path.includes('/.')) return true;
  return skipPatterns.some(p => lower.includes(p));
}

function isTextFile(name) {
  const cat = classifyFile(name);
  return !['asset', 'design'].includes(cat);
}

// ─── Persistence helpers ────────────────────────────
function _persistUploaderState(queue, stats) {
  try {
    const serializable = queue.map(z => ({
      id: z.id,
      name: z.name,
      size: z.size,
      status: z.status,
      fileCount: z.fileCount,
      enqueuedCount: z.enqueuedCount,
      error: z.error,
      // If the file was already uploaded to server, store the URL so we can re-extract on resume
      uploadedUrl: z.uploadedUrl || null,
    }));
    localStorage.setItem(UPLOADER_STORAGE_KEY, JSON.stringify({
      queue: serializable,
      stats,
      timestamp: Date.now(),
    }));
  } catch {}
}

function _loadUploaderState() {
  try {
    const raw = localStorage.getItem(UPLOADER_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Discard if older than 24 hours
    if (Date.now() - (data.timestamp || 0) > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(UPLOADER_STORAGE_KEY);
      return null;
    }
    return data;
  } catch { return null; }
}

function _clearUploaderState() {
  try { localStorage.removeItem(UPLOADER_STORAGE_KEY); } catch {}
}

export default function ZipBatchUploader({ onRefreshKnowledge }) {
  const fileInputRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentZip, setCurrentZip] = useState(null);
  const autoResumeTriggered = useRef(false);

  // Restore persisted state on mount
  const [zipQueue, setZipQueue] = useState(() => {
    const saved = _loadUploaderState();
    if (saved?.queue?.length > 0) {
      return saved.queue.map(z => ({
        ...z,
        file: null, // File objects can't be persisted — will need re-selection
        // RAR files that were already uploaded to the server CAN be auto-resumed
        status: z.status === 'done' ? 'done'
          : z.status === 'failed' ? 'failed'
          : z.uploadedUrl ? 'resumable_rar'  // server has the file, can re-extract
          : (z.status === 'extracting' || z.status === 'analyzing') ? 'needs_file'
          : z.status,
      }));
    }
    return [];
  });

  const [stats, setStats] = useState(() => {
    const saved = _loadUploaderState();
    return saved?.stats || { totalZips: 0, processedZips: 0, totalFiles: 0, enqueuedFiles: 0, skippedFiles: 0 };
  });

  // Persist state whenever queue or stats change
  useEffect(() => {
    if (zipQueue.length > 0) {
      _persistUploaderState(zipQueue, stats);
    } else if (stats.totalZips === 0) {
      _clearUploaderState();
    }
  }, [zipQueue, stats]);

  // Auto-resume RAR files that were already uploaded to the server (survives refresh)
  useEffect(() => {
    if (autoResumeTriggered.current) return;
    const resumableRars = zipQueue.filter(z => z.status === 'resumable_rar' && z.uploadedUrl);
    if (resumableRars.length > 0 && !isProcessing) {
      autoResumeTriggered.current = true;
      console.log(`[ZipUploader] Auto-resuming ${resumableRars.length} RAR(s) that are already on the server...`);
      // Small delay so the UI renders first
      setTimeout(() => processResumableRars(resumableRars), 1500);
    }
  }, []);

  const needsFileReselect = zipQueue.some(z => z.status === 'needs_file' && !z.file);
  const resumableRarCount = zipQueue.filter(z => z.status === 'resumable_rar' && z.uploadedUrl).length;

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const archiveFiles = files.filter(f => {
      const name = f.name.toLowerCase();
      return name.endsWith('.zip') || name.endsWith('.rar') || 
             f.type === 'application/zip' || f.type === 'application/x-zip-compressed';
    });

    if (archiveFiles.length === 0) {
      showError('No archive files detected. Please select .zip or .rar files.');
      return;
    }

    const nonArchives = files.length - archiveFiles.length;
    if (nonArchives > 0) {
      showError(`${nonArchives} non-archive file(s) were ignored.`);
    }

    // Sort multi-part files in order
    archiveFiles.sort((a, b) => {
      const partA = a.name.match(/part(\d+)/i)?.[1] || '0';
      const partB = b.name.match(/part(\d+)/i)?.[1] || '0';
      return parseInt(partA) - parseInt(partB);
    });

    // Try to match re-selected files to existing "needs_file" items
    const updatedQueue = [...zipQueue];
    const newItems = [];

    for (const f of archiveFiles) {
      // Check if this file matches a persisted item that needs re-selection
      const matchIdx = updatedQueue.findIndex(z => 
        z.status === 'needs_file' && z.name === f.name && z.size === f.size && !z.file
      );

      if (matchIdx !== -1) {
        // Re-attach the File object and mark as queued again
        updatedQueue[matchIdx] = {
          ...updatedQueue[matchIdx],
          file: f,
          status: 'queued',
          error: null,
        };
      } else {
        // Check if this exact file is already in the queue (by name+size)
        const alreadyExists = updatedQueue.some(z => z.name === f.name && z.size === f.size && z.status !== 'failed');
        if (!alreadyExists) {
          newItems.push({
            id: Date.now() + '_' + Math.random().toString(36).slice(2, 8),
            file: f,
            name: f.name,
            size: f.size,
            status: 'queued',
            fileCount: null,
            enqueuedCount: 0,
            error: null,
            uploadedUrl: null,
          });
        }
      }
    }

    setZipQueue([...updatedQueue, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const matchedCount = archiveFiles.length - newItems.length;
    if (matchedCount > 0 && newItems.length > 0) {
      showSuccess(`Matched ${matchedCount} file(s) from previous session, added ${newItems.length} new archive(s)`);
    } else if (matchedCount > 0) {
      showSuccess(`Re-attached ${matchedCount} file(s) — ready to resume processing`);
    } else if (newItems.length > 0) {
      showSuccess(`Added ${newItems.length} archive(s) to queue`);
    }
  };

  const removeFromQueue = (id) => {
    setZipQueue(prev => {
      const updated = prev.filter(z => z.id !== id);
      if (updated.length === 0) _clearUploaderState();
      return updated;
    });
  };

  const clearQueue = () => {
    if (isProcessing) return;
    setZipQueue([]);
    setStats({ totalZips: 0, processedZips: 0, totalFiles: 0, enqueuedFiles: 0, skippedFiles: 0 });
    _clearUploaderState();
  };

  const processZipFile = async (zipItem, JSZip, newStats) => {
    const arrayBuffer = await zipItem.file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const entries = [];
    zip.forEach((relativePath, zipEntry) => {
      if (zipEntry.dir) return;
      if (shouldSkip(relativePath)) return;
      if (!isTextFile(relativePath)) return;
      entries.push({ path: relativePath, entry: zipEntry });
    });

    const fileCount = entries.length;
    setZipQueue(prev => prev.map(z => z.id === zipItem.id ? { ...z, status: 'analyzing', fileCount } : z));
    newStats.totalFiles += fileCount;
    setStats({ ...newStats });

    const items = [];
    for (const { path, entry } of entries) {
      if (entry._data?.uncompressedSize > 2 * 1024 * 1024) continue;
      let content = '';
      try {
        content = await entry.async('string');
      } catch {
        continue;
      }
      if (!content || content.length < 5) continue;

      const category = classifyFile(path);
      const displayName = `[${zipItem.name}] ${path}`;
      items.push({
        id: Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '_' + path.split('/').pop(),
        name: displayName,
        size: content.length,
        category,
        content: content.substring(0, 50000),
        rawFile: null,
        needsUpload: false,
        status: 'queued',
      });
    }
    return { items, fileCount };
  };

  // Shared RAR extraction logic — works with either a file_url (already uploaded) or by uploading zipItem.file
  const extractRarFromUrl = async (zipItem, file_url, newStats) => {
    setZipQueue(prev => prev.map(z => z.id === zipItem.id ? { ...z, status: 'extracting' } : z));

    let result;
    try {
      const { extractRarArchive } = await import('@/functions/extractRarArchive');
      console.log('[RAR] Calling extractRarArchive backend with URL:', file_url);
      const response = await extractRarArchive({ file_url });
      result = response?.data || response;
    } catch (apiErr) {
      console.warn('[RAR] Backend call failed:', apiErr?.response?.status, apiErr.message);
      return { items: [], fileCount: 0 };
    }
    console.log('[RAR] Backend response:', { files: result?.files?.length, error: result?.error, note: result?.note });

    if (result.error && (!result.files || result.files.length === 0)) {
      console.warn('[RAR] Part returned error:', result.error);
      return { items: [], fileCount: 0 };
    }

    const files = result.files || [];
    const fileCount = files.length;
    setZipQueue(prev => prev.map(z => z.id === zipItem.id ? { ...z, status: 'analyzing', fileCount } : z));
    if (newStats) {
      newStats.totalFiles += fileCount;
      setStats({ ...newStats });
    }

    const items = files.map(f => ({
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '_' + (f.path || '').split('/').pop(),
      name: `[${zipItem.name}] ${f.path}`,
      size: (f.content || '').length,
      category: classifyFile(f.path),
      content: (f.content || '').substring(0, 50000),
      rawFile: null,
      needsUpload: false,
      status: 'queued',
    })).filter(f => f.size >= 5);

    return { items, fileCount };
  };

  const processRarFile = async (zipItem, newStats) => {
    setZipQueue(prev => prev.map(z => z.id === zipItem.id ? { ...z, status: 'extracting' } : z));

    console.log(`[RAR] Uploading ${zipItem.name} (${(zipItem.size / (1024*1024)).toFixed(1)} MB)...`);

    const { file_url } = await base44.integrations.Core.UploadFile({ file: zipItem.file });
    console.log(`[RAR] Uploaded to: ${file_url}`);

    // Persist the uploaded URL so we can resume if page refreshes after upload
    setZipQueue(prev => prev.map(z => z.id === zipItem.id ? { ...z, uploadedUrl: file_url } : z));

    return extractRarFromUrl(zipItem, file_url, newStats);
  };

  // Auto-resume RAR files that were already uploaded to the server before a refresh
  const processResumableRars = async (resumableItems) => {
    if (isProcessing || resumableItems.length === 0) return;
    
    setIsProcessing(true);
    console.log(`[ZipUploader] Resuming ${resumableItems.length} RAR(s) from server...`);
    
    const newStats = { ...stats, totalZips: stats.totalZips || resumableItems.length };
    
    for (const zipItem of resumableItems) {
      setCurrentZip(zipItem.id);
      try {
        const { items, fileCount } = await extractRarFromUrl(zipItem, zipItem.uploadedUrl, newStats);
        
        if (items.length === 0) {
          setZipQueue(prev => prev.map(z => z.id === zipItem.id ? { ...z, status: 'done', fileCount: 0, enqueuedCount: 0, error: 'No extractable text files in this part' } : z));
          newStats.processedZips = (newStats.processedZips || 0) + 1;
          setStats({ ...newStats });
          continue;
        }
        
        const folderLabel = zipItem.name.replace(/\.(zip|rar|7z|tar|gz)$/i, '');
        const { added, dupes } = await enqueueFiles(items, folderLabel);
        
        newStats.enqueuedFiles = (newStats.enqueuedFiles || 0) + added;
        newStats.skippedFiles = (newStats.skippedFiles || 0) + dupes;
        newStats.processedZips = (newStats.processedZips || 0) + 1;
        setStats({ ...newStats });
        
        setZipQueue(prev => prev.map(z => z.id === zipItem.id ? { ...z, status: 'done', fileCount, enqueuedCount: added } : z));
      } catch (err) {
        console.error(`[ZipUploader] Resume failed for ${zipItem.name}:`, err);
        newStats.processedZips = (newStats.processedZips || 0) + 1;
        setStats({ ...newStats });
        setZipQueue(prev => prev.map(z => z.id === zipItem.id ? { ...z, status: 'failed', error: err.message || 'Resume failed' } : z));
      }
    }
    
    setCurrentZip(null);
    setIsProcessing(false);
    if (onRefreshKnowledge) onRefreshKnowledge();
    showSuccess(`Resumed & finished ${resumableItems.length} archive(s) from previous session`);
  };

  const processAllZips = useCallback(async () => {
    const pending = zipQueue.filter(z => (z.status === 'queued' && z.file) || (z.status === 'resumable_rar' && z.uploadedUrl));
    if (pending.length === 0) return;

    setIsProcessing(true);
    const newStats = { totalZips: pending.length, processedZips: 0, totalFiles: 0, enqueuedFiles: 0, skippedFiles: 0 };
    setStats(newStats);

    let JSZip;
    try {
      JSZip = await loadJSZip();
    } catch (err) {
      console.error('Failed to load JSZip:', err);
      showError('Failed to load ZIP library.');
      setIsProcessing(false);
      return;
    }

    for (const zipItem of pending) {
      setCurrentZip(zipItem.id);
      setZipQueue(prev => prev.map(z => z.id === zipItem.id ? { ...z, status: 'extracting' } : z));

      try {
        const ext = (zipItem.file?.name || zipItem.name || '').split('.').pop()?.toLowerCase();
        let items, fileCount;

        if (zipItem.status === 'resumable_rar' && zipItem.uploadedUrl) {
          // Already uploaded to server — just re-extract
          ({ items, fileCount } = await extractRarFromUrl(zipItem, zipItem.uploadedUrl, newStats));
        } else if (ext === 'rar') {
          ({ items, fileCount } = await processRarFile(zipItem, newStats));
          if (items.length === 0) {
            setZipQueue(prev => prev.map(z => z.id === zipItem.id ? { ...z, status: 'done', fileCount: 0, enqueuedCount: 0, error: 'No extractable text files in this part' } : z));
            newStats.processedZips += 1;
            setStats({ ...newStats });
            continue;
          }
        } else {
          ({ items, fileCount } = await processZipFile(zipItem, JSZip, newStats));
        }
        
        if (items.length === 0 && zipItem.status === 'resumable_rar') {
          setZipQueue(prev => prev.map(z => z.id === zipItem.id ? { ...z, status: 'done', fileCount: 0, enqueuedCount: 0, error: 'No extractable text files in this part' } : z));
          newStats.processedZips += 1;
          setStats({ ...newStats });
          continue;
        }

        const folderLabel = zipItem.name.replace(/\.(zip|rar|7z|tar|gz)$/i, '');
        const { added, dupes } = await enqueueFiles(items, folderLabel);

        newStats.enqueuedFiles += added;
        newStats.skippedFiles += dupes;
        newStats.processedZips += 1;
        setStats({ ...newStats });

        setZipQueue(prev => prev.map(z => z.id === zipItem.id ? { ...z, status: 'done', fileCount, enqueuedCount: added } : z));

      } catch (err) {
        console.error(`Failed to process archive: ${zipItem.name}`, err);
        newStats.processedZips += 1;
        setStats({ ...newStats });
        setZipQueue(prev => prev.map(z => z.id === zipItem.id ? { ...z, status: 'failed', error: err.message || 'Unknown error' } : z));
      }
    }

    setCurrentZip(null);
    setIsProcessing(false);
    if (onRefreshKnowledge) onRefreshKnowledge();
    showSuccess(`Finished processing ${newStats.processedZips} archive(s) — ${newStats.enqueuedFiles} files queued for AI analysis`);
  }, [zipQueue, onRefreshKnowledge]);

  const pendingCount = zipQueue.filter(z => (z.status === 'queued' && z.file) || (z.status === 'resumable_rar' && z.uploadedUrl)).length;
  const needsFileCount = zipQueue.filter(z => z.status === 'needs_file').length;
  const doneCount = zipQueue.filter(z => z.status === 'done').length;
  const failedCount = zipQueue.filter(z => z.status === 'failed').length;

  return (
    <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.03] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Archive className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Archive Batch Upload</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Select multiple .zip or .rar files — supports split archives (part001, part002, etc.)
            </p>
          </div>
        </div>
        {zipQueue.length > 0 && !isProcessing && (
          <Button size="sm" variant="ghost" onClick={clearQueue} className="text-slate-500 hover:text-white text-xs">
            Clear All
          </Button>
        )}
      </div>

      {/* Auto-Resume Banner — RAR files already on server, resuming automatically */}
      {resumableRarCount > 0 && !isProcessing && (
        <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/5 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-green-400 flex-shrink-0 animate-spin" />
              <div>
                <p className="text-white font-semibold text-xs">Auto-resuming {resumableRarCount} archive(s)</p>
                <p className="text-green-300/60 text-[11px] mt-0.5">
                  These files were already uploaded to the server — resuming extraction automatically.
                </p>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={clearQueue} className="text-slate-400 hover:text-white text-xs h-7">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Resume Banner — shown when items exist from a previous session that need files re-selected */}
      {needsFileCount > 0 && !isProcessing && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-white font-semibold text-xs">Previous session interrupted</p>
                <p className="text-amber-300/60 text-[11px] mt-0.5">
                  {needsFileCount} archive(s) need to be re-selected to continue. Select the same files again below.
                </p>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={clearQueue} className="text-slate-400 hover:text-white text-xs h-7">
              Discard
            </Button>
          </div>
          {/* Show which files are needed */}
          <div className="mt-2 space-y-1">
            {zipQueue.filter(z => z.status === 'needs_file').map(z => (
              <div key={z.id} className="flex items-center gap-2 text-xs text-amber-300/70 pl-6">
                <Archive className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{z.name}</span>
                <span className="text-slate-500">({(z.size / (1024*1024)).toFixed(1)} MB)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drop Zone / File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".zip,.rar,application/zip,application/x-zip-compressed"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        className="border-2 border-dashed border-orange-500/25 hover:border-orange-400/50 rounded-xl p-6 text-center transition-all cursor-pointer group mb-4"
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-2">
          <FileArchive className="w-10 h-10 text-orange-400/60 group-hover:text-orange-300 transition-colors" />
          <p className="text-white font-semibold text-sm">
            {isProcessing ? 'Processing in progress...' : needsFileCount > 0 ? 'Re-select your archive files to resume' : 'Click to select archive files (.zip, .rar) — multi-part supported'}
          </p>
          <p className="text-slate-500 text-xs max-w-sm">
            {needsFileCount > 0 
              ? 'Select the same files you uploaded before — they will be matched automatically and processing will continue where it left off.'
              : 'Select any number of .zip or .rar files. Multi-part archives (part001, part002...) are processed individually — each part extracts whatever files it contains.'
            }
          </p>
        </div>
      </div>

      {/* Queue List */}
      {zipQueue.length > 0 && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">
              Queue: {doneCount}/{zipQueue.length} complete
              {failedCount > 0 && <span className="text-red-400 ml-2">({failedCount} failed)</span>}
              {needsFileCount > 0 && <span className="text-amber-400 ml-2">({needsFileCount} need re-select)</span>}
            </span>
            {pendingCount > 0 && !isProcessing && (
              <Button size="sm" onClick={processAllZips} className="bg-orange-600 hover:bg-orange-700 text-white h-7 text-xs">
                <Play className="w-3 h-3 mr-1" />
                Process {pendingCount} file{pendingCount > 1 ? 's' : ''}
              </Button>
            )}
          </div>

          <AnimatePresence>
            {zipQueue.map(z => (
              <motion.div
                key={z.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  z.status === 'done' ? 'bg-green-500/5 border-green-500/20' :
                  z.status === 'failed' ? 'bg-red-500/5 border-red-500/20' :
                  z.status === 'needs_file' ? 'bg-amber-500/5 border-amber-500/20' :
                  z.status === 'resumable_rar' ? 'bg-cyan-500/5 border-cyan-500/20' :
                  z.status === 'extracting' || z.status === 'analyzing' ? 'bg-orange-500/5 border-orange-500/20' :
                  'bg-slate-800/40 border-slate-700'
                }`}
              >
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {z.status === 'queued' && <Archive className="w-5 h-5 text-slate-500" />}
                  {z.status === 'needs_file' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                  {z.status === 'resumable_rar' && <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />}
                  {z.status === 'extracting' && <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />}
                  {z.status === 'analyzing' && <Brain className="w-5 h-5 text-orange-400 animate-pulse" />}
                  {z.status === 'done' && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                  {z.status === 'failed' && <XCircle className="w-5 h-5 text-red-400" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{z.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-slate-500 text-xs">{(z.size / (1024 * 1024)).toFixed(1)} MB</span>
                    {z.fileCount !== null && (
                      <span className="text-slate-500 text-xs">• {z.fileCount} text files found</span>
                    )}
                    {z.status === 'done' && z.enqueuedCount !== undefined && (
                      <span className="text-green-400 text-xs">• {z.enqueuedCount} queued for analysis</span>
                    )}
                    {z.status === 'needs_file' && (
                      <span className="text-amber-400 text-xs">Re-select this file to resume</span>
                    )}
                    {z.status === 'resumable_rar' && (
                      <span className="text-cyan-400 text-xs">On server — will auto-resume</span>
                    )}
                    {z.status === 'extracting' && (
                      <span className="text-orange-400 text-xs">Extracting files...</span>
                    )}
                    {z.status === 'analyzing' && (
                      <span className="text-orange-400 text-xs">Preparing for AI analysis...</span>
                    )}
                    {z.error && (
                      <span className="text-red-400 text-xs truncate">{z.error}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {(z.status === 'queued' || z.status === 'needs_file' || z.status === 'resumable_rar') && !isProcessing && (
                  <Button size="icon" variant="ghost" onClick={() => removeFromQueue(z.id)} className="h-7 w-7 text-slate-500 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
                {z.status === 'failed' && !isProcessing && (
                  <Button size="sm" variant="ghost" onClick={() => {
                    setZipQueue(prev => prev.map(q => q.id === z.id ? { ...q, status: z.file ? 'queued' : 'needs_file', error: null } : q));
                  }} className="text-xs text-orange-400 hover:text-orange-300 h-7">
                    Retry
                  </Button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Overall Stats */}
      {stats.totalZips > 0 && (
        <div className="flex items-center gap-4 text-xs text-slate-400 pt-3 border-t border-slate-700/50">
          <span>Archives: {stats.processedZips}/{stats.totalZips}</span>
          <span>Files found: {stats.totalFiles}</span>
          <span className="text-green-400">Queued: {stats.enqueuedFiles}</span>
          {stats.skippedFiles > 0 && <span className="text-slate-500">Skipped (dupes): {stats.skippedFiles}</span>}
        </div>
      )}
    </div>
  );
}