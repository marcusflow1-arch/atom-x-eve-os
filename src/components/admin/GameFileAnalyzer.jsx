import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, Trash2, Loader2, Sparkles, Copy, Check, 
  FileCode, FileJson, FileSpreadsheet, File, Eye, EyeOff, X,
  Zap, Brain, Layers, Search, Pin, PinOff, BookOpen, Tag,
  FolderOpen, FolderTree
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showError, showSuccess } from '@/components/error/ErrorToast';
import ReactMarkdown from 'react-markdown';

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

// Read text-based files directly in the browser (no upload needed)
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// ─── Knowledge Card (saved entry from DB) ───────────
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
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
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
          <p className="text-slate-500 text-xs truncate mt-0.5">{entry.summary || 'Knowledge entry'}</p>
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
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-700 p-4 space-y-4">
              {/* Analysis */}
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-3">
                  <Brain className="w-3.5 h-3.5" /> Full Analysis
                </div>
                <div className="text-sm text-slate-300 leading-relaxed prose prose-invert prose-sm max-w-none max-h-[400px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  <ReactMarkdown>{entry.full_analysis}</ReactMarkdown>
                </div>
              </div>

              {/* Extracted Code */}
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

// ─── Main Component ─────────────────────────────────
export default function GameFileAnalyzer() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const [pendingFiles, setPendingFiles] = useState([]); // files selected but not yet learned
  const [learningId, setLearningId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [readingFolder, setReadingFolder] = useState(false);

  // Load all knowledge from DB
  const { data: knowledgeEntries = [], isLoading } = useQuery({
    queryKey: ['knowledge-entries'],
    queryFn: () => base44.entities.KnowledgeEntry.list('-created_date', 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.KnowledgeEntry.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['knowledge-entries'] }); showSuccess('Knowledge removed'); },
  });

  const togglePinMutation = useMutation({
    mutationFn: (entry) => base44.entities.KnowledgeEntry.update(entry.id, { is_pinned: !entry.is_pinned }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledge-entries'] }),
  });

  // Shared logic to read a list of File objects into pending items
  const processFiles = async (fileList, isFolder = false) => {
    const newPending = [];
    for (const file of fileList) {
      // Use webkitRelativePath for folder uploads (gives "folder/sub/file.js"), fall back to name
      const displayName = (isFolder && file.webkitRelativePath) ? file.webkitRelativePath : file.name;

      // Skip hidden files, node_modules, .git, etc.
      if (displayName.includes('node_modules/') || displayName.includes('.git/') || displayName.startsWith('.')) continue;

      let content = '';
      const fileType = classifyFile(file.name);
      const isTextBased = !['asset', 'design'].includes(fileType) && file.size < 2 * 1024 * 1024;

      if (isTextBased) {
        try { content = await readFileAsText(file); } catch { content = '[Could not read file as text]'; }
      }

      newPending.push({
        id: Date.now() + '_' + Math.random().toString(36).slice(2) + '_' + file.name,
        name: displayName,
        size: file.size,
        category: fileType,
        content: content.substring(0, 50000),
        rawFile: file,
        needsUpload: !isTextBased,
      });
    }
    return newPending;
  };

  // When user picks individual files
  const handleFilePick = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    const newPending = await processFiles(selected, false);
    setPendingFiles(prev => [...prev, ...newPending]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // When user picks a folder
  const handleFolderPick = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    setReadingFolder(true);

    // Get folder name from the first file's relative path
    const folderName = selected[0]?.webkitRelativePath?.split('/')[0] || 'folder';

    const newPending = await processFiles(selected, true);
    setPendingFiles(prev => [...prev, ...newPending]);
    if (folderInputRef.current) folderInputRef.current.value = '';
    setReadingFolder(false);
    showSuccess(`Read ${newPending.length} files from "${folderName}"`);
  };

  // Learn a single file: analyze content with AI, then save knowledge to DB
  const learnFile = async (pf) => {
    setLearningId(pf.id);

    try {
      let contentForAI = pf.content;
      let fileUrls = [];

      // For binary files (images, PDFs, 3D), upload temporarily so AI can see them
      if (pf.needsUpload) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: pf.rawFile });
        fileUrls = [file_url];
        contentForAI = `[Binary file - sent as attachment for visual analysis]`;
      }

      // Ask AI to deeply analyze and extract all knowledge
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a knowledge extraction engine for a game development platform (React, Three.js, TailwindCSS).

A developer has given you a file to LEARN from. Your job is to extract EVERY piece of useful knowledge from this file and present it in a way that can be referenced later for building features.

FILE: "${pf.name}" (${pf.category} file, ${(pf.size/1024).toFixed(1)} KB)

${contentForAI ? `--- FILE CONTENT ---\n${contentForAI.substring(0, 30000)}\n--- END ---\n\n` : ''}

Provide your analysis in this EXACT structure:

## Summary
One paragraph explaining what this file is and what it contains.

## Key Knowledge Extracted
- Every important piece of data, pattern, function, config, schema, endpoint, or concept found
- Be exhaustive — list everything useful

## Code Patterns & Snippets
Any reusable code patterns, component structures, API calls, schemas, or configurations found. Write them as code blocks.

## Integration Guide
How this knowledge can be practically used in a React + Three.js + TailwindCSS gaming platform. Be specific with component names, entity schemas, and implementation steps.

## Tags
List 5-10 single-word tags that categorize this knowledge (e.g., "react", "animation", "api", "three.js", "game-data", "shader", "ui", "config")`,
        file_urls: fileUrls.length > 0 ? fileUrls : undefined,
      });

      // Extract tags from the analysis
      const tagMatch = analysis.match(/##\s*Tags\s*\n([\s\S]*?)(?:\n##|$)/i);
      let tags = [];
      if (tagMatch) {
        tags = tagMatch[1].match(/[\w.-]+/g)?.filter(t => t.length > 1 && t.length < 30).slice(0, 10) || [];
      }

      // Extract code blocks
      const codeBlocks = [];
      const codeRegex = /```[\w]*\n([\s\S]*?)```/g;
      let match;
      while ((match = codeRegex.exec(analysis)) !== null) {
        codeBlocks.push(match[1].trim());
      }

      // Extract summary
      const summaryMatch = analysis.match(/##\s*Summary\s*\n([\s\S]*?)(?:\n##|$)/i);
      const summary = summaryMatch ? summaryMatch[1].trim().substring(0, 500) : pf.name;

      // Save to database — this is the "knowledge bank"
      await base44.entities.KnowledgeEntry.create({
        source_filename: pf.name,
        file_type: pf.name.split('.').pop()?.toLowerCase() || 'unknown',
        file_size: pf.size,
        summary,
        full_analysis: analysis,
        extracted_code: codeBlocks.join('\n\n// ───────────────────\n\n'),
        tags,
        category: pf.category,
        is_pinned: false,
      });

      // Remove from pending
      setPendingFiles(prev => prev.filter(f => f.id !== pf.id));
      queryClient.invalidateQueries({ queryKey: ['knowledge-entries'] });
      showSuccess(`Learned from "${pf.name}" — knowledge saved!`);
    } catch (error) {
      showError(error, 'Learn File');
    } finally {
      setLearningId(null);
    }
  };

  const learnAll = async () => {
    for (const pf of pendingFiles) {
      await learnFile(pf);
    }
  };

  // Filter knowledge entries
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
            Select files to learn from — AI extracts all knowledge and stores it permanently for future use
          </p>
        </div>
        <Badge variant="outline" className="text-slate-400">
          <BookOpen className="w-3 h-3 mr-1" />
          {knowledgeEntries.length} Entries
        </Badge>
      </div>

      {/* ─── FILE / FOLDER PICKER ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Individual Files */}
        <div 
          className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl p-6 text-center transition-colors cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" multiple onChange={handleFilePick} className="hidden" />
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 group-hover:border-cyan-500/30 flex items-center justify-center transition-colors">
              <Upload className="w-7 h-7 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </div>
            <p className="text-white font-semibold">Select Files</p>
            <p className="text-slate-500 text-xs">Pick individual files to learn from</p>
          </div>
        </div>

        {/* Entire Folder */}
        <div 
          className="border-2 border-dashed border-slate-700 hover:border-purple-500/50 rounded-xl p-6 text-center transition-colors cursor-pointer group"
          onClick={() => folderInputRef.current?.click()}
        >
          {/* webkitdirectory allows selecting an entire folder */}
          <input ref={folderInputRef} type="file" webkitdirectory="" directory="" multiple onChange={handleFolderPick} className="hidden" />
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 group-hover:border-purple-500/30 flex items-center justify-center transition-colors">
              {readingFolder 
                ? <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
                : <FolderOpen className="w-7 h-7 text-slate-500 group-hover:text-purple-400 transition-colors" />
              }
            </div>
            <p className="text-white font-semibold">Select Folder</p>
            <p className="text-slate-500 text-xs">Upload an entire folder — all files inside will be read & broken down</p>
          </div>
        </div>
      </div>

      {/* ─── PENDING FILES (not yet learned) ─── */}
      {pendingFiles.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
              <Sparkles className="w-4 h-4" />
              {pendingFiles.length} file{pendingFiles.length > 1 ? 's' : ''} ready to learn
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setPendingFiles([])} className="text-slate-400 hover:text-white">
                Clear
              </Button>
              <Button size="sm" onClick={learnAll} disabled={!!learningId} className="bg-amber-600 hover:bg-amber-700 text-white">
                <Zap className="w-3.5 h-3.5 mr-1.5" />
                Learn All
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {pendingFiles.map(pf => {
              const Icon = getFileIcon(pf.name);
              const isLearning = learningId === pf.id;
              return (
                <div key={pf.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700">
                  <Icon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate" title={pf.name}>
                      {pf.name.includes('/') ? (
                        <><span className="text-slate-500">{pf.name.substring(0, pf.name.lastIndexOf('/') + 1)}</span>{pf.name.substring(pf.name.lastIndexOf('/') + 1)}</>
                      ) : pf.name}
                    </p>
                    <p className="text-slate-500 text-xs">{(pf.size / 1024).toFixed(1)} KB • {pf.category} • {pf.content ? `${pf.content.length.toLocaleString()} chars read` : 'binary'}</p>
                  </div>
                  <Button size="sm" onClick={() => learnFile(pf)} disabled={!!learningId} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                    {isLearning ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Brain className="w-3.5 h-3.5 mr-1.5" />Learn</>}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-500 hover:text-white" onClick={() => setPendingFiles(prev => prev.filter(f => f.id !== pf.id))}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── KNOWLEDGE BANK (saved entries) ─── */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search knowledge..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-800/50 border-slate-700 pl-10"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {categories.map(cat => (
            <Button
              key={cat}
              size="sm"
              variant={filterCat === cat ? 'default' : 'ghost'}
              onClick={() => setFilterCat(cat)}
              className={`text-xs capitalize ${filterCat === cat ? '' : 'text-slate-500'}`}
            >
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
          <p className="text-sm mt-1">{knowledgeEntries.length === 0 ? 'Select files above to start building your knowledge base' : 'Try a different search or category'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map(entry => (
              <KnowledgeCard
                key={entry.id}
                entry={entry}
                onDelete={(id) => deleteMutation.mutate(id)}
                onTogglePin={(e) => togglePinMutation.mutate(e)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}