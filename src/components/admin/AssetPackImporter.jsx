import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Upload, Loader2, CheckCircle2, XCircle, FolderOpen,
  Box, Film, Image, FileText, Layers, Play, Trash2, ChevronDown, ChevronRight,
  RefreshCw, AlertTriangle, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { showError, showSuccess } from '@/components/error/ErrorToast';

// ─── File Classification ────────────────────────────

const MODEL_EXTS = ['glb', 'gltf', 'obj'];
const ANIMATION_EXTS = ['fbx']; // FBX can be either model or animation
const TEXTURE_EXTS = ['png', 'jpg', 'jpeg', 'tga', 'bmp', 'webp', 'psd', 'tif', 'tiff', 'dds'];
const MATERIAL_EXTS = ['mtl', 'mat'];
const CONFIG_EXTS = ['json', 'yaml', 'yml', 'xml', 'ini', 'cfg', 'toml'];
const DOC_EXTS = ['txt', 'md', 'pdf', 'doc', 'docx', 'rtf'];
const AUDIO_EXTS = ['wav', 'mp3', 'ogg', 'flac'];
const VIDEO_EXTS = ['mp4', 'avi', 'mov', 'webm'];

function getExt(filename) {
  return (filename || '').split('.').pop()?.toLowerCase() || '';
}

function classifyAsset(filepath) {
  const ext = getExt(filepath);
  const lower = filepath.toLowerCase();

  // Folder path hints for FBX classification
  const isAnimPath = /\b(anim|animation|motions?|clips?|actions?|sequences?)\b/i.test(lower);
  const isModelPath = /\b(models?|mesh|character|body|outfit|costume|cloth|skin|weapon|prop|static)\b/i.test(lower);

  if (MODEL_EXTS.includes(ext)) return 'model';
  if (ext === 'fbx') {
    // Heuristic: if path contains animation-related words, classify as animation
    if (isAnimPath && !isModelPath) return 'animation';
    if (isModelPath && !isAnimPath) return 'model';
    // Default FBX to animation (most common use case for loose FBX in packs)
    return 'animation';
  }
  if (TEXTURE_EXTS.includes(ext)) return 'texture';
  if (MATERIAL_EXTS.includes(ext)) return 'material';
  if (CONFIG_EXTS.includes(ext)) return 'config';
  if (DOC_EXTS.includes(ext)) return 'documentation';
  if (AUDIO_EXTS.includes(ext)) return 'audio';
  if (VIDEO_EXTS.includes(ext)) return 'video';
  return 'other';
}

function shouldSkipFile(path) {
  const lower = path.toLowerCase();
  const skipPatterns = [
    'node_modules/', '.git/', '__pycache__/', '.ds_store', 'thumbs.db',
    '__macosx/', '.egstore/', '.meta', 'desktop.ini',
  ];
  if (path.startsWith('.') || path.includes('/.')) return true;
  return skipPatterns.some(p => lower.includes(p));
}

// Guess animation type from filename
function guessAnimationType(filename) {
  const lower = filename.toLowerCase();
  if (/\bidle\b/.test(lower)) return 'idle';
  if (/\bwalk\b/.test(lower)) return 'walk';
  if (/\brun\b/.test(lower)) return 'run';
  if (/\bjump\b/.test(lower)) return 'jump';
  if (/\battack\b|\bhit\b|\bslash\b|\bstrike\b/.test(lower)) return 'attack';
  if (/\bswing\b/.test(lower)) return 'swing';
  if (/\bdance\b/.test(lower)) return 'dance';
  if (/\bemote\b|\bgesture\b/.test(lower)) return 'emote';
  return 'other';
}

// Extract a folder/group name from the path
function extractGroupName(filepath, packName) {
  const parts = filepath.split('/').filter(Boolean);
  // Skip the root archive folder, take the next meaningful folder
  if (parts.length >= 3) return parts[1]; // e.g. "PackRoot/Animations/file.fbx" → "Animations"
  if (parts.length >= 2) return parts[0]; // e.g. "Animations/file.fbx" → "Animations"
  return packName || 'Imported';
}

// ─── Category config ────────────────────────────
const CATEGORY_CONFIG = {
  animation: { label: 'Animations', icon: Film, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', dest: 'FBX Animations' },
  model:     { label: '3D Models', icon: Box, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', dest: '3D Models' },
  texture:   { label: 'Textures', icon: Image, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', dest: 'Skipped (textures)' },
  material:  { label: 'Materials', icon: Layers, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', dest: 'Skipped' },
  config:    { label: 'Configs', icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', dest: 'Skipped' },
  documentation: { label: 'Docs', icon: FileText, color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', dest: 'Skipped' },
  audio:     { label: 'Audio', icon: Play, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20', dest: 'Skipped' },
  video:     { label: 'Video', icon: Play, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', dest: 'Skipped' },
  other:     { label: 'Other', icon: FileText, color: 'text-slate-500', bg: 'bg-slate-500/10 border-slate-500/20', dest: 'Skipped' },
};

// Load JSZip lazily
let JSZipLib = null;
async function loadJSZip() {
  if (JSZipLib) return JSZipLib;
  const mod = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
  JSZipLib = mod.default || mod;
  return JSZipLib;
}

export default function AssetPackImporter() {
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const [phase, setPhase] = useState('idle'); // idle, scanning, review, importing, done
  const [packName, setPackName] = useState('');
  const [scanResults, setScanResults] = useState(null); // { categories, fileList, raw }
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, currentFile: '', errors: [] });
  const [expandedCategories, setExpandedCategories] = useState({});
  const [reclassifications, setReclassifications] = useState({}); // fileIndex -> newCategory
  const [selectedFile, setSelectedFile] = useState(null);
  const zipDataRef = useRef(null); // holds the JSZip instance for extraction during import
  const rawFilesRef = useRef([]); // holds raw File objects for folder upload

  // Toggle a category expansion
  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Reclassify a file (e.g. switch an FBX from animation to model)
  const reclassifyFile = (fileIndex, newCategory) => {
    setReclassifications(prev => ({ ...prev, [fileIndex]: newCategory }));
  };

  // ─── SCAN Phase: Archive ────────────────────────────
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = getExt(file.name);
    if (!['zip', 'rar'].includes(ext)) {
      showError('Please select a .zip or .rar archive file.');
      return;
    }

    const name = file.name.replace(/\.(zip|rar)$/i, '');
    setPackName(name);
    setPhase('scanning');
    setScanResults(null);
    setReclassifications({});

    try {
      if (ext === 'zip') {
        await scanZipFile(file, name);
      } else {
        await scanRarFile(file, name);
      }
    } catch (err) {
      console.error('Scan failed:', err);
      showError('Failed to scan archive: ' + (err.message || 'Unknown error'));
      setPhase('idle');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── SCAN Phase: Folder ────────────────────────────
  const handleFolderSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Derive pack name from the first file's root folder
    const firstPath = files[0].webkitRelativePath || files[0].name;
    const rootFolder = firstPath.split('/')[0] || 'Imported';
    setPackName(rootFolder);
    setPhase('scanning');
    setScanResults(null);
    setReclassifications({});

    const fileList = [];
    const rawFiles = [];

    for (const f of files) {
      const relativePath = f.webkitRelativePath || f.name;
      if (shouldSkipFile(relativePath)) continue;
      const category = classifyAsset(relativePath);
      rawFiles.push(f);
      fileList.push({
        path: relativePath,
        name: f.name,
        size: f.size || 0,
        category,
        group: extractGroupName(relativePath, rootFolder),
        rawFileIndex: rawFiles.length - 1, // index into rawFilesRef
      });
    }

    rawFilesRef.current = rawFiles;
    const categories = buildCategories(fileList);
    setScanResults({ categories, fileList, source: 'folder' });
    setPhase('review');

    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const scanZipFile = async (file, name) => {
    const JSZip = await loadJSZip();
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    zipDataRef.current = zip;

    const fileList = [];
    zip.forEach((relativePath, zipEntry) => {
      if (zipEntry.dir) return;
      if (shouldSkipFile(relativePath)) return;
      const category = classifyAsset(relativePath);
      fileList.push({
        path: relativePath,
        name: relativePath.split('/').pop(),
        size: zipEntry._data?.uncompressedSize || 0,
        category,
        group: extractGroupName(relativePath, name),
        zipEntry,
      });
    });

    const categories = buildCategories(fileList);
    setScanResults({ categories, fileList, source: 'zip' });
    setPhase('review');
  };

  const scanRarFile = async (file, name) => {
    // Upload to server, then use backend to list contents
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    const { extractRarArchive } = await import('@/functions/extractRarArchive');
    const response = await extractRarArchive({ file_url });
    const result = response?.data || response;

    if (result.error && (!result.files || result.files.length === 0)) {
      showError('Could not read RAR archive: ' + result.error);
      setPhase('idle');
      return;
    }

    // For RAR, we have extracted content — store it
    const files = result.files || [];
    const fileList = files.filter(f => !shouldSkipFile(f.path)).map((f, i) => ({
      path: f.path,
      name: (f.path || '').split('/').pop(),
      size: f.size || (f.content || '').length,
      category: classifyAsset(f.path),
      group: extractGroupName(f.path, name),
      content: f.content, // text content from RAR extraction
      rarFileUrl: file_url,
    }));

    const categories = buildCategories(fileList);
    setScanResults({ categories, fileList, source: 'rar', rarFileUrl: file_url });
    setPhase('review');
  };

  function buildCategories(fileList) {
    const cats = {};
    fileList.forEach((f, idx) => {
      const cat = f.category;
      if (!cats[cat]) cats[cat] = { count: 0, totalSize: 0, files: [] };
      cats[cat].count++;
      cats[cat].totalSize += f.size || 0;
      cats[cat].files.push(idx);
    });
    return cats;
  };

  // ─── IMPORT Phase ────────────────────────────
  const startImport = async () => {
    if (!scanResults) return;

    setPhase('importing');
    const { fileList, source } = scanResults;
    const errors = [];

    // Only import animations and models
    const importableFiles = fileList.map((f, idx) => ({
      ...f,
      effectiveCategory: reclassifications[idx] || f.category,
      originalIndex: idx,
    })).filter(f => f.effectiveCategory === 'animation' || f.effectiveCategory === 'model');

    setImportProgress({ current: 0, total: importableFiles.length, currentFile: '', errors: [] });

    // Ensure animation folders exist
    const folderNames = new Set();
    importableFiles.forEach(f => {
      if (f.effectiveCategory === 'animation') {
        folderNames.add(f.group || packName);
      }
    });

    // Create animation folders if they don't exist
    for (const folderName of folderNames) {
      try {
        const existingFolders = await base44.entities.AnimationFolder.filter({ name: folderName });
        if (existingFolders.length === 0) {
          await base44.entities.AnimationFolder.create({ name: folderName });
        }
      } catch (e) {
        console.warn('Folder creation issue:', e);
      }
    }

    // Process files one by one
    for (let i = 0; i < importableFiles.length; i++) {
      const file = importableFiles[i];
      setImportProgress(prev => ({ ...prev, current: i + 1, currentFile: file.name }));

      try {
        let file_url;

        if (source === 'folder' && file.rawFileIndex !== undefined) {
          // Direct folder upload — use the raw File object
          const rawFile = rawFilesRef.current[file.rawFileIndex];
          if (!rawFile) { errors.push({ file: file.name, error: 'File reference lost' }); continue; }
          const result = await base44.integrations.Core.UploadFile({ file: rawFile });
          file_url = result.file_url;
        } else if (source === 'zip' && file.zipEntry) {
          // Extract from ZIP and upload
          const blob = await file.zipEntry.async('blob');
          const uploadFile = new File([blob], file.name, { type: 'application/octet-stream' });
          const result = await base44.integrations.Core.UploadFile({ file: uploadFile });
          file_url = result.file_url;
        } else if (source === 'rar' && file.content) {
          const blob = new Blob([file.content], { type: 'application/octet-stream' });
          const uploadFile = new File([blob], file.name, { type: 'application/octet-stream' });
          const result = await base44.integrations.Core.UploadFile({ file: uploadFile });
          file_url = result.file_url;
        } else {
          errors.push({ file: file.name, error: 'No extractable content' });
          continue;
        }

        if (file.effectiveCategory === 'animation') {
          await base44.entities.AnimationFBX.create({
            name: file.name.replace(/\.(fbx|glb|gltf)$/i, ''),
            file_url,
            animation_type: guessAnimationType(file.name),
            is_loopable: /\b(idle|walk|run|dance)\b/i.test(file.name),
            tags: [packName, file.group].filter(Boolean),
            folder: file.group || packName,
          });
        } else if (file.effectiveCategory === 'model') {
          const ext = getExt(file.name);
          await base44.entities.Model3D.create({
            name: file.name.replace(/\.(fbx|glb|gltf|obj)$/i, ''),
            file_url,
            file_type: ext,
            category: file.group || packName,
            tags: [packName, file.group].filter(Boolean),
            file_size: file.size || 0,
            is_public: false,
          });
        }
      } catch (err) {
        console.error(`Import failed for ${file.name}:`, err);
        errors.push({ file: file.name, error: err.message || 'Upload failed' });
      }
    }

    setImportProgress(prev => ({ ...prev, errors }));
    setPhase('done');
    zipDataRef.current = null;

    const successCount = importableFiles.length - errors.length;
    if (errors.length > 0) {
      showSuccess(`Imported ${successCount} assets (${errors.length} failed)`);
    } else {
      showSuccess(`Successfully imported ${successCount} assets from "${packName}"`);
    }
  };

  const resetImporter = () => {
    setPhase('idle');
    setScanResults(null);
    setImportProgress({ current: 0, total: 0, currentFile: '', errors: [] });
    setExpandedCategories({});
    setReclassifications({});
    setPackName('');
    zipDataRef.current = null;
  };

  // Get effective category for a file
  const getEffectiveCategory = (idx) => reclassifications[idx] || scanResults?.fileList[idx]?.category;

  // Recalculate categories with reclassifications
  const getEffectiveCategories = () => {
    if (!scanResults) return {};
    const cats = {};
    scanResults.fileList.forEach((f, idx) => {
      const cat = reclassifications[idx] || f.category;
      if (!cats[cat]) cats[cat] = { count: 0, totalSize: 0, files: [] };
      cats[cat].count++;
      cats[cat].totalSize += f.size || 0;
      cats[cat].files.push(idx);
    });
    return cats;
  };

  const effectiveCategories = phase === 'review' ? getEffectiveCategories() : (scanResults?.categories || {});
  const importableCount = (effectiveCategories.animation?.count || 0) + (effectiveCategories.model?.count || 0);
  const totalFileCount = scanResults?.fileList?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
            <Package className="w-6 h-6 text-violet-500" />
            Asset Pack Importer
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Upload a character/asset pack (.zip or .rar) — animations go to FBX Animations, models go to 3D Models
          </p>
        </div>
        {phase !== 'idle' && phase !== 'importing' && (
          <Button variant="ghost" onClick={resetImporter} className="text-slate-400 hover:text-white">
            <RefreshCw className="w-4 h-4 mr-2" /> Start Over
          </Button>
        )}
      </div>

      {/* ─── IDLE: File / Folder Picker ────────────────────────── */}
      {phase === 'idle' && (
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.03] p-8">
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,.rar"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={folderInputRef}
            type="file"
            webkitdirectory=""
            directory=""
            multiple
            onChange={handleFolderSelect}
            className="hidden"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Folder upload */}
            <div
              className="border-2 border-dashed border-violet-500/25 hover:border-violet-400/50 rounded-xl p-10 text-center transition-all cursor-pointer group"
              onClick={() => folderInputRef.current?.click()}
            >
              <FolderOpen className="w-14 h-14 text-violet-400/40 mx-auto mb-3 group-hover:text-violet-300 transition-colors" />
              <p className="text-white font-bold text-base mb-1">Drop a Folder</p>
              <p className="text-slate-400 text-sm max-w-xs mx-auto">
                Select a folder containing models, animations, textures, etc. Files are uploaded directly — no zipping needed.
              </p>
            </div>

            {/* Archive upload */}
            <div
              className="border-2 border-dashed border-slate-600/40 hover:border-violet-400/50 rounded-xl p-10 text-center transition-all cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <Package className="w-14 h-14 text-slate-500/40 mx-auto mb-3 group-hover:text-violet-300 transition-colors" />
              <p className="text-white font-bold text-base mb-1">Upload an Archive</p>
              <p className="text-slate-400 text-sm max-w-xs mx-auto">
                Upload a .zip or .rar archive. ZIP is extracted locally, RAR is uploaded then extracted on the server.
              </p>
            </div>
          </div>

          <p className="text-slate-500 text-xs mt-4 text-center">
            The importer scans the contents, classifies each file, and routes animations to FBX Animations and models to 3D Models — each in their own folder.
          </p>
        </div>
      )}

      {/* ─── SCANNING ────────────────────────── */}
      {phase === 'scanning' && (
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.03] p-12 text-center">
          <Loader2 className="w-12 h-12 text-violet-400 animate-spin mx-auto mb-4" />
          <p className="text-white font-bold text-lg mb-1">Scanning archive...</p>
          <p className="text-slate-400 text-sm">Reading file structure and classifying assets from "{packName}"</p>
        </div>
      )}

      {/* ─── REVIEW: Breakdown ────────────────────────── */}
      {phase === 'review' && scanResults && (
        <div className="space-y-4">
          {/* Summary Bar */}
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.03] p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-white font-bold text-lg">{packName}</h3>
                <p className="text-slate-400 text-sm">{totalFileCount} files found — {importableCount} importable (animations + models)</p>
              </div>
              <Button
                onClick={startImport}
                disabled={importableCount === 0}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Import {importableCount} Assets
              </Button>
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(effectiveCategories)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([cat, data]) => {
                  const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.other;
                  const Icon = cfg.icon;
                  const isImportable = cat === 'animation' || cat === 'model';
                  return (
                    <div key={cat} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {cfg.label}: {data.count}
                      {isImportable && <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] ml-1">Import</Badge>}
                      {!isImportable && <span className="text-slate-500 ml-1">skip</span>}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="space-y-2">
            {Object.entries(effectiveCategories)
              .sort((a, b) => {
                const order = ['animation', 'model', 'texture', 'material', 'config', 'audio', 'video', 'documentation', 'other'];
                return order.indexOf(a[0]) - order.indexOf(b[0]);
              })
              .map(([cat, data]) => {
                const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.other;
                const Icon = cfg.icon;
                const isExpanded = expandedCategories[cat];
                const isImportable = cat === 'animation' || cat === 'model';

                return (
                  <div key={cat} className={`rounded-xl border ${cfg.bg} overflow-hidden`}>
                    <button
                      onClick={() => toggleCategory(cat)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${cfg.color}`} />
                        <div>
                          <span className="text-white font-semibold text-sm">{cfg.label}</span>
                          <span className="text-slate-500 text-xs ml-2">
                            {data.count} file{data.count !== 1 ? 's' : ''} • {((data.totalSize || 0) / (1024 * 1024)).toFixed(1)} MB
                          </span>
                        </div>
                        {isImportable && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">
                            → {cfg.dest}
                          </Badge>
                        )}
                        {!isImportable && (
                          <Badge className="bg-slate-600/20 text-slate-500 border-slate-600/30 text-[10px]">
                            Will skip
                          </Badge>
                        )}
                      </div>
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-1 max-h-64 overflow-y-auto">
                            {data.files.map((fileIdx) => {
                              const f = scanResults.fileList[fileIdx];
                              const effectiveCat = getEffectiveCategory(fileIdx);
                              const isReclassified = reclassifications[fileIdx] !== undefined;
                              const ext = getExt(f.name);

                              return (
                                <div key={fileIdx} className={`flex items-center justify-between py-1.5 px-2 rounded-lg text-xs ${isReclassified ? 'bg-yellow-500/10 border border-yellow-500/20' : 'hover:bg-white/5'} transition-colors`}>
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className="text-slate-500 font-mono w-8 text-right flex-shrink-0">.{ext}</span>
                                    <span className="text-white/80 truncate">{f.path}</span>
                                    {f.size > 0 && <span className="text-slate-600 flex-shrink-0">({(f.size / 1024).toFixed(0)} KB)</span>}
                                  </div>

                                  {/* Reclassify FBX files between animation/model */}
                                  {ext === 'fbx' && (
                                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                      <button
                                        onClick={() => reclassifyFile(fileIdx, 'animation')}
                                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                                          effectiveCat === 'animation' ? 'bg-purple-500/30 text-purple-300 border border-purple-500/40' : 'text-slate-500 hover:text-purple-400 hover:bg-purple-500/10'
                                        }`}
                                      >
                                        Anim
                                      </button>
                                      <button
                                        onClick={() => reclassifyFile(fileIdx, 'model')}
                                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                                          effectiveCat === 'model' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40' : 'text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10'
                                        }`}
                                      >
                                        Model
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ─── IMPORTING ────────────────────────── */}
      {phase === 'importing' && (
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.03] p-8">
          <div className="text-center mb-6">
            <Loader2 className="w-10 h-10 text-violet-400 animate-spin mx-auto mb-3" />
            <p className="text-white font-bold text-lg">Importing assets...</p>
            <p className="text-slate-400 text-sm">{importProgress.current} / {importProgress.total}</p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-3 mb-4 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
              animate={{ width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {importProgress.currentFile && (
            <p className="text-slate-500 text-xs text-center truncate">
              Current: {importProgress.currentFile}
            </p>
          )}
        </div>
      )}

      {/* ─── DONE ────────────────────────── */}
      {phase === 'done' && (
        <div className="rounded-2xl border border-green-500/20 bg-green-500/[0.03] p-8">
          <div className="text-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-white font-bold text-lg">Import Complete!</p>
            <p className="text-slate-400 text-sm">
              {importProgress.total - importProgress.errors.length} of {importProgress.total} assets imported from "{packName}"
            </p>
          </div>

          {importProgress.errors.length > 0 && (
            <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-red-400 font-semibold text-sm mb-2">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                {importProgress.errors.length} file(s) failed:
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {importProgress.errors.map((err, i) => (
                  <div key={i} className="text-xs text-red-300/70 flex gap-2">
                    <XCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span>{err.file}: {err.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center mt-6">
            <Button onClick={resetImporter} className="bg-violet-600 hover:bg-violet-700 text-white">
              Import Another Pack
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}