/**
 * Knowledge Learner Engine — Module-level singleton
 * 
 * Runs analysis jobs in the background. Survives React re-renders and tab switches.
 * Components subscribe to state changes via listeners.
 */
import { base44 } from '@/api/base44Client';

// ─── State ──────────────────────────────────────────
let _state = {
  queue: [],           // Array of pending file items { id, name, size, category, content, rawFile, needsUpload, status:'queued' }
  completed: [],       // IDs of successfully learned files
  failed: [],          // { id, name, error }
  currentId: null,     // ID of file currently being analyzed
  isRunning: false,    // Is the engine actively processing?
  progress: { done: 0, total: 0 },
  folderName: null,    // Name of the folder being processed
  lastLog: '',         // Last status message
};

let _listeners = new Set();

function _notify() {
  // Shallow clone so React sees a new reference
  const snapshot = { ..._state, queue: [..._state.queue], completed: [..._state.completed], failed: [..._state.failed], progress: { ..._state.progress } };
  _listeners.forEach(fn => fn(snapshot));
}

// ─── Public API ─────────────────────────────────────

export function subscribe(fn) {
  _listeners.add(fn);
  // Immediately give current state
  fn({ ..._state, queue: [..._state.queue], completed: [..._state.completed], failed: [..._state.failed], progress: { ..._state.progress } });
  return () => _listeners.delete(fn);
}

export function getState() {
  return _state;
}

/**
 * Enqueue files for learning. Starts processing automatically.
 */
export function enqueueFiles(files, folderName) {
  _state.queue = [..._state.queue, ...files];
  _state.progress.total += files.length;
  if (folderName) _state.folderName = folderName;
  _notify();

  // Auto-start if not already running
  if (!_state.isRunning) {
    _processQueue();
  }
}

/**
 * Clear everything and stop
 */
export function clearAll() {
  _state = {
    queue: [],
    completed: [],
    failed: [],
    currentId: null,
    isRunning: false,
    progress: { done: 0, total: 0 },
    folderName: null,
    lastLog: 'Cleared.',
  };
  _notify();
}

/**
 * Remove a single queued (not yet processing) item
 */
export function removeFromQueue(id) {
  if (_state.currentId === id) return; // can't remove active
  _state.queue = _state.queue.filter(f => f.id !== id);
  _state.progress.total = Math.max(0, _state.progress.total - 1);
  _notify();
}

// ─── Internal Processing Loop ───────────────────────

async function _processQueue() {
  _state.isRunning = true;
  _notify();

  while (_state.queue.length > 0) {
    const item = _state.queue[0];
    _state.currentId = item.id;
    _state.lastLog = `Analyzing: ${item.name}`;
    _notify();

    try {
      await _learnSingleFile(item);
      _state.completed.push(item.id);
      _state.progress.done += 1;
      _state.lastLog = `Learned: ${item.name}`;
    } catch (err) {
      console.error(`[KnowledgeLearner] Failed on ${item.name}:`, err);
      _state.failed.push({ id: item.id, name: item.name, error: err?.message || String(err) });
      _state.progress.done += 1;
      _state.lastLog = `Failed: ${item.name} — ${err?.message || 'unknown error'}`;
    }

    // Remove from queue regardless of success/failure
    _state.queue = _state.queue.filter(f => f.id !== item.id);
    _state.currentId = null;
    _notify();
  }

  _state.isRunning = false;
  _state.lastLog = `Done! ${_state.completed.length} learned, ${_state.failed.length} failed.`;
  _notify();
}

// ─── AI Analysis (unchanged logic, just isolated here) ──

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

async function _learnSingleFile(pf) {
  let contentForAI = pf.content || '';
  let fileUrls = [];

  // For binary files (images, PDFs, 3D), upload temporarily so AI can see them
  if (pf.needsUpload && pf.rawFile) {
    const { file_url } = await base44.integrations.Core.UploadFile({ file: pf.rawFile });
    fileUrls = [file_url];
    contentForAI = `[Binary file - sent as attachment for visual analysis]`;
  }

  const analysis = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a knowledge extraction engine for a game development platform (React, Three.js, TailwindCSS, Base44).

A developer has given you a file to LEARN from. Extract EVERY piece of useful knowledge.

FILE: "${pf.name}" (${pf.category} file, ${(pf.size / 1024).toFixed(1)} KB)

${contentForAI ? `--- FILE CONTENT ---\n${contentForAI.substring(0, 30000)}\n--- END ---\n\n` : ''}

Respond with this structure:

## Summary
One paragraph — what this file is and what it contains.

## Key Knowledge Extracted
- Every important data point, pattern, function, config, schema, endpoint, or concept
- Be exhaustive

## Code Patterns & Snippets
Any reusable patterns, component structures, API calls, schemas, configs found. Use code blocks.

## Integration Guide
How to practically use this in React + Three.js + TailwindCSS + Base44. Be specific.

## Tags
5-10 single-word tags (e.g., "react", "animation", "api", "three.js", "game-data")`,
    file_urls: fileUrls.length > 0 ? fileUrls : undefined,
  });

  // Parse analysis
  const tagMatch = analysis.match(/##\s*Tags\s*\n([\s\S]*?)(?:\n##|$)/i);
  let tags = [];
  if (tagMatch) {
    tags = tagMatch[1].match(/[\w.-]+/g)?.filter(t => t.length > 1 && t.length < 30).slice(0, 10) || [];
  }

  const codeBlocks = [];
  const codeRegex = /```[\w]*\n([\s\S]*?)```/g;
  let match;
  while ((match = codeRegex.exec(analysis)) !== null) {
    codeBlocks.push(match[1].trim());
  }

  const summaryMatch = analysis.match(/##\s*Summary\s*\n([\s\S]*?)(?:\n##|$)/i);
  const summary = summaryMatch ? summaryMatch[1].trim().substring(0, 500) : pf.name;

  // Save to database
  await base44.entities.KnowledgeEntry.create({
    source_filename: pf.name,
    file_type: pf.name.split('.').pop()?.toLowerCase() || 'unknown',
    file_size: pf.size,
    summary,
    full_analysis: analysis,
    extracted_code: codeBlocks.join('\n\n// ───────────────────\n\n'),
    tags,
    category: pf.category || classifyFile(pf.name),
    is_pinned: false,
  });
}