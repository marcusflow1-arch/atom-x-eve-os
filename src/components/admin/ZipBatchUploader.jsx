import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Archive, Upload, Loader2, CheckCircle2, XCircle, AlertTriangle,
  Trash2, Play, FileArchive, FolderOpen, X, Brain, SkipForward
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { showError, showSuccess } from '@/components/error/ErrorToast';
import { enqueueFiles, invalidateKnowledgeCache } from './knowledgeLearner';

// JSZip loaded from CDN on demand
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

// Skip junk paths
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

// Check if the file extension is text-based (analyzable)
function isTextFile(name) {
  const cat = classifyFile(name);
  return !['asset', 'design'].includes(cat);
}

export default function ZipBatchUploader({ onRefreshKnowledge }) {
  const fileInputRef = useRef(null);
  const [zipQueue, setZipQueue] = useState([]); // { id, file, name, size, status, fileCount, error }
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentZip, setCurrentZip] = useState(null);
  const [stats, setStats] = useState({ totalZips: 0, processedZips: 0, totalFiles: 0, enqueuedFiles: 0, skippedFiles: 0 });

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Accept .zip and multi-part zip archives (.z01, .z02, etc.)
    const archiveFiles = files.filter(f => {
      const name = f.name.toLowerCase();
      const ext = name.split('.').pop();
      // .zip files
      if (ext === 'zip' || f.type === 'application/zip' || f.type === 'application/x-zip-compressed') return true;
      // Multi-part zip: .z01, .z02, ... .z99
      if (/^z\d{1,2}$/.test(ext)) return true;
      // 7z and rar — accept for queuing but warn
      if (['rar', '7z'].includes(ext)) return true;
      return false;
    });

    if (archiveFiles.length === 0) {
      showError('No archive files detected. Supported: .zip, .z01-.z99, .rar, .7z');
      return;
    }

    const nonArchives = files.length - archiveFiles.length;
    if (nonArchives > 0) {
      showError(`${nonArchives} non-archive file(s) were ignored.`);
    }

    const newItems = archiveFiles.map(f => ({
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      file: f,
      name: f.name,
      size: f.size,
      status: 'queued', // queued | extracting | analyzing | done | failed
      fileCount: null,
      enqueuedCount: 0,
      error: null,
    }));

    setZipQueue(prev => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showSuccess(`Added ${zips.length} ZIP file(s) to queue`);
  };

  const removeFromQueue = (id) => {
    setZipQueue(prev => prev.filter(z => z.id !== id));
  };

  const clearQueue = () => {
    if (isProcessing) return;
    setZipQueue([]);
    setStats({ totalZips: 0, processedZips: 0, totalFiles: 0, enqueuedFiles: 0, skippedFiles: 0 });
  };

  const processAllZips = useCallback(async () => {
    const pending = zipQueue.filter(z => z.status === 'queued');
    if (pending.length === 0) return;

    setIsProcessing(true);
    const newStats = { totalZips: pending.length, processedZips: 0, totalFiles: 0, enqueuedFiles: 0, skippedFiles: 0 };
    setStats(newStats);

    let JSZip;
    try {
      JSZip = await loadJSZip();
    } catch (err) {
      showError('Failed to load ZIP library. Please try again.');
      setIsProcessing(false);
      return;
    }

    for (const zipItem of pending) {
      setCurrentZip(zipItem.id);

      // Update status to extracting
      setZipQueue(prev => prev.map(z => z.id === zipItem.id ? { ...z, status: 'extracting' } : z));

      try {
        // Read the ZIP file
        const arrayBuffer = await zipItem.file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);

        // Collect all text-based files from the ZIP
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

        // Extract and prepare files for the learner queue
        const items = [];
        for (const { path, entry } of entries) {
          // Only read files under 2MB
          if (entry._data?.uncompressedSize > 2 * 1024 * 1024) continue;

          let content = '';
          try {
            content = await entry.async('string');
          } catch {
            // Binary file that can't be read as string — skip
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

        // Enqueue into the knowledge learner (processes one by one)
        const folderLabel = zipItem.name.replace(/\.zip$/i, '');
        const { added, dupes } = await enqueueFiles(items, folderLabel);

        newStats.enqueuedFiles += added;
        newStats.skippedFiles += dupes;
        newStats.processedZips += 1;
        setStats({ ...newStats });

        setZipQueue(prev => prev.map(z => z.id === zipItem.id ? { ...z, status: 'done', fileCount, enqueuedCount: added } : z));

      } catch (err) {
        console.error(`Failed to process ZIP: ${zipItem.name}`, err);
        newStats.processedZips += 1;
        setStats({ ...newStats });
        setZipQueue(prev => prev.map(z => z.id === zipItem.id ? { ...z, status: 'failed', error: err.message || 'Unknown error' } : z));
      }
    }

    setCurrentZip(null);
    setIsProcessing(false);
    if (onRefreshKnowledge) onRefreshKnowledge();
    showSuccess(`Finished processing ${newStats.processedZips} ZIP(s) — ${newStats.enqueuedFiles} files queued for AI analysis`);
  }, [zipQueue, onRefreshKnowledge]);

  const pendingCount = zipQueue.filter(z => z.status === 'queued').length;
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
            <h3 className="text-white font-bold text-sm">ZIP Batch Upload</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Select multiple ZIP files (up to 50MB each) — they'll be extracted and analyzed one by one
            </p>
          </div>
        </div>
        {zipQueue.length > 0 && !isProcessing && (
          <Button size="sm" variant="ghost" onClick={clearQueue} className="text-slate-500 hover:text-white text-xs">
            Clear All
          </Button>
        )}
      </div>

      {/* Drop Zone / File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".zip,application/zip,application/x-zip-compressed"
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
            {isProcessing ? 'Processing in progress...' : 'Click to select ZIP files'}
          </p>
          <p className="text-slate-500 text-xs max-w-sm">
            Select as many ZIP files as you want. Each can be up to 50MB. They'll be queued and processed sequentially.
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
            </span>
            {pendingCount > 0 && !isProcessing && (
              <Button size="sm" onClick={processAllZips} className="bg-orange-600 hover:bg-orange-700 text-white h-7 text-xs">
                <Play className="w-3 h-3 mr-1" />
                Process {pendingCount} ZIP{pendingCount > 1 ? 's' : ''}
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
                  z.status === 'extracting' || z.status === 'analyzing' ? 'bg-orange-500/5 border-orange-500/20' :
                  'bg-slate-800/40 border-slate-700'
                }`}
              >
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {z.status === 'queued' && <Archive className="w-5 h-5 text-slate-500" />}
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
                {z.status === 'queued' && !isProcessing && (
                  <Button size="icon" variant="ghost" onClick={() => removeFromQueue(z.id)} className="h-7 w-7 text-slate-500 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
                {z.status === 'done' && (
                  <Badge className="bg-green-500/15 text-green-400 text-[10px] border border-green-500/25">Done</Badge>
                )}
                {z.status === 'failed' && (
                  <Badge className="bg-red-500/15 text-red-400 text-[10px] border border-red-500/25">Failed</Badge>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Overall Stats */}
      {stats.totalZips > 0 && (
        <div className="flex items-center gap-4 text-xs text-slate-400 pt-3 border-t border-slate-700/50">
          <span>ZIPs: {stats.processedZips}/{stats.totalZips}</span>
          <span>Files found: {stats.totalFiles}</span>
          <span className="text-green-400">Queued: {stats.enqueuedFiles}</span>
          {stats.skippedFiles > 0 && <span className="text-slate-500">Skipped (dupes): {stats.skippedFiles}</span>}
        </div>
      )}
    </div>
  );
}