import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, Trash2, Loader2, Sparkles, Copy, Check, 
  FileCode, FileJson, FileSpreadsheet, File, Eye, X, Download,
  Zap, Brain, Code, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { showError, showSuccess } from '@/components/error/ErrorToast';

const FILE_ICONS = {
  json: FileJson,
  js: FileCode,
  jsx: FileCode,
  ts: FileCode,
  tsx: FileCode,
  css: FileCode,
  html: FileCode,
  csv: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  txt: FileText,
  md: FileText,
  pdf: FileText,
  png: File,
  jpg: File,
  jpeg: File,
};

function getFileIcon(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  return FILE_ICONS[ext] || File;
}

function getFileType(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['json'].includes(ext)) return 'json';
  if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) return 'code';
  if (['css', 'html', 'xml', 'svg'].includes(ext)) return 'markup';
  if (['csv', 'xlsx', 'xls'].includes(ext)) return 'spreadsheet';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'image';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['md', 'txt'].includes(ext)) return 'text';
  return 'unknown';
}

function AnalysisResult({ analysis, onCopy }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(analysis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  return (
    <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-cyan-500/10 border-b border-cyan-500/20">
        <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold">
          <Brain className="w-4 h-4" />
          AI Analysis
        </div>
        <Button size="sm" variant="ghost" onClick={handleCopy} className="text-cyan-400 hover:text-cyan-300 h-7 px-2">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </Button>
      </div>
      <div className="p-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-mono max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {analysis}
      </div>
    </div>
  );
}

function UploadedFileCard({ file, onAnalyze, onRemove, isAnalyzing }) {
  const [showAnalysis, setShowAnalysis] = useState(!!file.analysis);
  const Icon = getFileIcon(file.name);
  const fileType = getFileType(file.name);

  const typeColors = {
    code: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    json: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    markup: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    spreadsheet: 'text-green-400 bg-green-500/10 border-green-500/20',
    image: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    pdf: 'text-red-400 bg-red-500/10 border-red-500/20',
    text: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    unknown: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden"
    >
      <div className="flex items-center gap-4 p-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${typeColors[fileType]}`}>
          <Icon className="w-6 h-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm truncate">{file.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-[10px] py-0">{file.name.split('.').pop()?.toUpperCase()}</Badge>
            <span className="text-slate-500 text-xs">{(file.size / 1024).toFixed(1)} KB</span>
            {file.analysis && (
              <Badge className="bg-cyan-500/20 text-cyan-400 text-[10px] py-0">Analyzed</Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {file.analysis && (
            <Button size="sm" variant="ghost" onClick={() => setShowAnalysis(!showAnalysis)} className="text-cyan-400 hover:text-cyan-300">
              <Eye className="w-4 h-4" />
            </Button>
          )}
          <Button 
            size="sm" 
            onClick={() => onAnalyze(file)}
            disabled={isAnalyzing}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                {file.analysis ? 'Re-Analyze' : 'Analyze'}
              </>
            )}
          </Button>
          <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8" onClick={() => onRemove(file.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showAnalysis && file.analysis && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-700"
          >
            <div className="p-4">
              <AnalysisResult analysis={file.analysis} onCopy={() => showSuccess('Analysis copied to clipboard')} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function GameFileAnalyzer() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const fileInputRef = useRef(null);

  const handleUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setUploading(true);

    for (const file of selectedFiles) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        
        setFiles(prev => [...prev, {
          id: Date.now() + '_' + file.name,
          name: file.name,
          size: file.size,
          type: file.type,
          url: file_url,
          analysis: null,
          uploadedAt: new Date().toISOString(),
        }]);
      } catch (error) {
        showError(error, `Upload ${file.name}`);
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showSuccess(`${selectedFiles.length} file(s) uploaded`);
  };

  const handleAnalyze = async (file) => {
    setAnalyzingId(file.id);
    
    try {
      const fileType = getFileType(file.name);
      const ext = file.name.split('.').pop()?.toLowerCase();
      
      let analysisPrompt = customPrompt || '';
      
      // Build a smart analysis prompt based on file type
      const basePrompt = `You are a senior game developer and software architect. Analyze this uploaded file thoroughly and provide actionable insights.

File: "${file.name}" (${ext} file, ${(file.size / 1024).toFixed(1)} KB)

${analysisPrompt ? `Additional context from the user: "${analysisPrompt}"\n\n` : ''}Provide a comprehensive breakdown including:

1. **FILE OVERVIEW**: What this file is, its purpose, and structure
2. **KEY DATA/CODE BREAKDOWN**: Important elements, schemas, patterns, functions, configurations, or data points found
3. **INTEGRATION OPPORTUNITIES**: How this file's content could be integrated into a React + Three.js gaming platform (entities, components, 3D models, UI features, game mechanics)
4. **CODE SNIPPETS**: If relevant, provide ready-to-use code snippets that leverage this file's data
5. **RECOMMENDATIONS**: Best practices for using this data, potential pitfalls, and optimization tips

Be specific, technical, and practical. Format your response clearly with headers and bullet points.`;

      let result;

      if (['image', 'pdf'].includes(fileType)) {
        // Use file_urls for images and PDFs
        result = await base44.integrations.Core.InvokeLLM({
          prompt: basePrompt,
          file_urls: [file.url],
        });
      } else {
        // For code/text/data files, extract data first then analyze
        const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url: file.url,
          json_schema: {
            type: 'object',
            properties: {
              raw_content: { type: 'string' },
              structure_summary: { type: 'string' },
              key_elements: { type: 'array', items: { type: 'string' } },
            }
          }
        });

        const extractedContent = extractResult?.output 
          ? JSON.stringify(extractResult.output, null, 2).substring(0, 8000)
          : 'Could not extract structured data - analyzing file directly.';

        result = await base44.integrations.Core.InvokeLLM({
          prompt: `${basePrompt}\n\n--- EXTRACTED FILE CONTENT ---\n${extractedContent}`,
          file_urls: [file.url],
        });
      }

      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, analysis: result } : f
      ));

      showSuccess('Analysis complete!');
    } catch (error) {
      showError(error, 'Analyze File');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleRemove = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleAnalyzeAll = async () => {
    const unanalyzed = files.filter(f => !f.analysis);
    for (const file of unanalyzed) {
      await handleAnalyze(file);
    }
  };

  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="w-6 h-6 text-cyan-500" />
            Game File Analyzer
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Upload any file — code, configs, data, images — and AI will analyze it for integration into your project
          </p>
        </div>
        <div className="flex items-center gap-2">
          {files.length > 0 && files.some(f => !f.analysis) && (
            <Button onClick={handleAnalyzeAll} disabled={!!analyzingId} className="bg-purple-600 hover:bg-purple-700">
              <Zap className="w-4 h-4 mr-2" />
              Analyze All
            </Button>
          )}
          <Badge variant="outline" className="text-slate-400">
            {files.length} File{files.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Upload Zone */}
      <div 
        className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl p-8 mb-6 text-center transition-colors cursor-pointer group"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleUpload}
          className="hidden"
          accept=".js,.jsx,.ts,.tsx,.json,.css,.html,.csv,.xlsx,.xls,.txt,.md,.pdf,.png,.jpg,.jpeg,.gif,.webp,.xml,.svg,.yaml,.yml,.env,.config,.glb,.gltf,.fbx"
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
            <p className="text-slate-400">Uploading files...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 group-hover:border-cyan-500/30 flex items-center justify-center transition-colors">
              <Upload className="w-8 h-8 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </div>
            <div>
              <p className="text-white font-semibold">Drop files here or click to upload</p>
              <p className="text-slate-500 text-sm mt-1">
                Supports: JS, JSON, CSS, HTML, CSV, Excel, PDF, Images, Text, 3D Models, and more
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Custom Analysis Prompt */}
      {files.length > 0 && (
        <div className="mb-6">
          <label className="text-sm text-slate-400 mb-2 block">Custom Analysis Instructions (optional)</label>
          <Textarea
            placeholder="e.g., 'Focus on how I can use this data for my card trading system' or 'Extract all API endpoints and show me how to integrate them'..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="bg-slate-800/50 border-slate-700 h-20"
          />
        </div>
      )}

      {/* File List */}
      <div className="space-y-3">
        <AnimatePresence>
          {files.map((file) => (
            <UploadedFileCard
              key={file.id}
              file={file}
              onAnalyze={handleAnalyze}
              onRemove={handleRemove}
              isAnalyzing={analyzingId === file.id}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {files.length === 0 && (
        <div className="text-center py-12 text-slate-500 border border-slate-800 rounded-xl bg-slate-900/30">
          <FileCode className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No files uploaded yet</p>
          <p className="text-sm mt-1">Upload game files, configs, data files, or code to get AI-powered analysis</p>
        </div>
      )}
    </section>
  );
}