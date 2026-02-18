/**
 * Knowledge Learner Engine — Module-level singleton
 * 
 * Runs analysis jobs in the background. Survives React re-renders and tab switches.
 * Persists queue to localStorage so interrupted sessions can resume.
 * Checks for duplicates before saving knowledge.
 */
import { base44 } from '@/api/base44Client';

const STORAGE_KEY = 'knowledge_learner_queue';

// ─── State ──────────────────────────────────────────
let _state = {
  queue: [],           // { id, name, size, category, content, rawFile, needsUpload, status:'queued' }
  completed: [],       // IDs of successfully learned files
  failed: [],          // { id, name, error }
  skipped: [],         // { id, name } — duplicates that were skipped
  currentId: null,
  isRunning: false,
  progress: { done: 0, total: 0 },
  folderName: null,
  lastLog: '',
};

// Cache of existing knowledge filenames+sizes so we don't hit the DB for every file
let _existingKnowledgeCache = null; // Map<string, true>  key = "filename|size"

let _listeners = new Set();

function _notify() {
  const snapshot = {
    ..._state,
    queue: [..._state.queue],
    completed: [..._state.completed],
    failed: [..._state.failed],
    skipped: [..._state.skipped],
    progress: { ..._state.progress },
  };
  _listeners.forEach(fn => fn(snapshot));
}

// ─── LocalStorage persistence ───────────────────────
// We persist a lightweight version of the queue (no rawFile/content — those can't serialize).
// On resume, we mark items that lost their content as "needs re-read" so the UI can prompt.

function _persistQueue() {
  try {
    const serializable = _state.queue.map(f => ({
      id: f.id,
      name: f.name,
      size: f.size,
      category: f.category,
      needsUpload: f.needsUpload,
      // content and rawFile are NOT serializable — mark as needing re-read
      hasContent: !!f.content,
    }));
    const payload = {
      queue: serializable,
      folderName: _state.folderName,
      progress: _state.progress,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch { /* quota exceeded or private browsing — ignore */ }
}

function _loadPersistedQueue() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Discard if older than 24 hours (stale)
    if (Date.now() - (data.timestamp || 0) > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch { return null; }
}

function _clearPersisted() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

// ─── Duplicate cache ────────────────────────────────
function _makeKey(filename, fileSize) {
  return `${filename}|${fileSize}`;
}

async function _loadExistingKnowledge() {
  if (_existingKnowledgeCache) return _existingKnowledgeCache;
  try {
    const entries = await base44.entities.KnowledgeEntry.list('-created_date', 500);
    _existingKnowledgeCache = new Map();
    for (const e of entries) {
      _existingKnowledgeCache.set(_makeKey(e.source_filename, e.file_size), true);
    }
  } catch {
    _existingKnowledgeCache = new Map();
  }
  return _existingKnowledgeCache;
}

// Invalidate cache so next enqueue re-fetches
export function invalidateKnowledgeCache() {
  _existingKnowledgeCache = null;
}

// ─── Public API ─────────────────────────────────────

export function subscribe(fn) {
  _listeners.add(fn);
  fn({
    ..._state,
    queue: [..._state.queue],
    completed: [..._state.completed],
    failed: [..._state.failed],
    skipped: [..._state.skipped],
    progress: { ..._state.progress },
  });
  return () => _listeners.delete(fn);
}

export function getState() {
  return _state;
}

/**
 * Enqueue files for learning. Automatically deduplicates against existing knowledge.
 * Starts processing automatically.
 */
export async function enqueueFiles(files, folderName) {
  // Load existing knowledge for dedup
  const existing = await _loadExistingKnowledge();

  let added = 0;
  let dupes = 0;
  for (const file of files) {
    const key = _makeKey(file.name, file.size);
    if (existing.has(key)) {
      // Already learned — skip
      _state.skipped.push({ id: file.id, name: file.name });
      _state.progress.total += 1;
      _state.progress.done += 1;
      dupes++;
      continue;
    }
    // Also check if already in queue
    if (_state.queue.some(q => q.name === file.name && q.size === file.size)) {
      dupes++;
      continue;
    }
    _state.queue.push(file);
    _state.progress.total += 1;
    added++;
  }

  if (folderName) _state.folderName = folderName;
  _persistQueue();
  _notify();

  // Auto-start if not already running
  if (!_state.isRunning && _state.queue.length > 0) {
    _processQueue();
  }

  return { added, dupes };
}

/**
 * Check for an interrupted session and return info about it.
 * Does NOT auto-resume — the UI calls resumeInterrupted() to do that.
 */
export function getInterruptedSession() {
  const data = _loadPersistedQueue();
  if (!data || !data.queue || data.queue.length === 0) return null;
  // If engine is already running, no need to resume
  if (_state.isRunning) return null;
  return {
    fileCount: data.queue.length,
    folderName: data.folderName,
    fileNames: data.queue.map(f => f.name),
    timestamp: data.timestamp,
  };
}

/**
 * Resume an interrupted session. Files that lost their content (because the browser
 * was closed) are skipped — only binary-type files that need re-upload are affected.
 * Text files we can't re-read without the user re-selecting them, so we skip those
 * and inform the user.
 */
export async function resumeInterrupted() {
  const data = _loadPersistedQueue();
  if (!data || !data.queue || data.queue.length === 0) return { resumed: 0, needsReselect: 0 };

  const existing = await _loadExistingKnowledge();

  let resumed = 0;
  let needsReselect = 0;

  for (const item of data.queue) {
    const key = _makeKey(item.name, item.size);
    // Skip if already learned (maybe it was saved before the crash)
    if (existing.has(key)) continue;
    // Skip if already in current queue
    if (_state.queue.some(q => q.name === item.name && q.size === item.size)) continue;

    // We lost the file content on browser close — mark it
    // The user will need to re-select the folder for these
    _state.queue.push({
      ...item,
      content: null,
      rawFile: null,
      needsReread: true, // flag: content lost
      status: 'queued',
    });
    needsReselect++;
    _state.progress.total += 1;
    resumed++;
  }

  if (data.folderName) _state.folderName = data.folderName;
  _notify();

  // We can't actually process items without content, so we just show them in the UI
  // and prompt the user to re-select the folder. BUT — if some items somehow still have
  // content (shouldn't happen after browser close), start processing those.
  if (!_state.isRunning && _state.queue.some(q => !q.needsReread)) {
    _processQueue();
  }

  return { resumed, needsReselect };
}

/**
 * When user re-selects the same folder, match files by name+size and
 * fill in the missing content so processing can continue.
 */
export async function refillContentFromFiles(files) {
  let matched = 0;
  for (const file of files) {
    const displayName = file.webkitRelativePath || file.name;
    const idx = _state.queue.findIndex(q => q.name === displayName && q.size === file.size && q.needsReread);
    if (idx !== -1) {
      const category = _state.queue[idx].category;
      const isTextBased = !['asset', 'design'].includes(category);
      let content = '';
      if (isTextBased && file.size < 2 * 1024 * 1024) {
        try {
          content = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
          });
        } catch { content = '[Could not read]'; }
      }
      _state.queue[idx] = {
        ..._state.queue[idx],
        content: content.substring(0, 50000),
        rawFile: file,
        needsReread: false,
      };
      matched++;
    }
  }
  _notify();

  // Now start processing if we have items ready
  if (!_state.isRunning && _state.queue.some(q => !q.needsReread)) {
    _processQueue();
  }

  return matched;
}

export function clearAll() {
  _state = {
    queue: [], completed: [], failed: [], skipped: [],
    currentId: null, isRunning: false,
    progress: { done: 0, total: 0 },
    folderName: null, lastLog: 'Cleared.',
  };
  _clearPersisted();
  _notify();
}

export function removeFromQueue(id) {
  if (_state.currentId === id) return;
  _state.queue = _state.queue.filter(f => f.id !== id);
  _state.progress.total = Math.max(0, _state.progress.total - 1);
  _persistQueue();
  _notify();
}

// ─── Internal Processing Loop ───────────────────────

async function _processQueue() {
  _state.isRunning = true;
  _notify();

  while (_state.queue.length > 0) {
    // Find the first item that's ready (has content or is binary with rawFile)
    const readyIdx = _state.queue.findIndex(q => !q.needsReread);
    if (readyIdx === -1) {
      // All remaining items need re-read — stop and wait for user to re-select folder
      _state.lastLog = `Paused: ${_state.queue.length} file(s) need re-selecting the folder to resume.`;
      break;
    }

    const item = _state.queue[readyIdx];
    _state.currentId = item.id;
    _state.lastLog = `Analyzing: ${item.name}`;
    _persistQueue();
    _notify();

    try {
      // Final dedup check right before analyzing (in case another tab created it)
      const existing = await _loadExistingKnowledge();
      const key = _makeKey(item.name, item.size);
      if (existing.has(key)) {
        _state.skipped.push({ id: item.id, name: item.name });
        _state.progress.done += 1;
        _state.lastLog = `Skipped (already exists): ${item.name}`;
      } else {
        await _learnSingleFile(item);
        _state.completed.push(item.id);
        _state.progress.done += 1;
        _state.lastLog = `Learned: ${item.name}`;
        // Update cache so subsequent files in same batch don't duplicate
        existing.set(key, true);
      }
    } catch (err) {
      console.error(`[KnowledgeLearner] Failed on ${item.name}:`, err);
      _state.failed.push({ id: item.id, name: item.name, error: err?.message || String(err) });
      _state.progress.done += 1;
      _state.lastLog = `Failed: ${item.name} — ${err?.message || 'unknown error'}`;
    }

    _state.queue = _state.queue.filter(f => f.id !== item.id);
    _state.currentId = null;
    _persistQueue();
    _notify();
  }

  _state.isRunning = false;
  if (_state.queue.length === 0) {
    _clearPersisted();
  }
  _state.lastLog = _state.queue.length > 0
    ? `Paused — re-select folder to continue (${_state.queue.length} files remaining)`
    : `Done! ${_state.completed.length} learned, ${_state.failed.length} failed, ${_state.skipped.length} skipped (duplicates).`;
  _notify();
}

// ─── AI Analysis ────────────────────────────────────

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

  if (pf.needsUpload && pf.rawFile) {
    const { file_url } = await base44.integrations.Core.UploadFile({ file: pf.rawFile });
    fileUrls = [file_url];
    contentForAI = `[Binary file - sent as attachment for visual analysis]`;
  }

  const analysis = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an EXHAUSTIVE knowledge extraction engine for a game development platform (React, Three.js, TailwindCSS, Base44).

A developer has given you a file to LEARN from. Your job is to extract EVERY SINGLE piece of useful knowledge with MAXIMUM DEPTH AND DETAIL. Leave nothing out. This analysis will be the permanent reference for this file — it must be comprehensive enough to reconstruct the file's purpose, logic, and patterns from your analysis alone.

FILE: "${pf.name}" (${pf.category} file, ${(pf.size / 1024).toFixed(1)} KB)

${contentForAI ? `--- FILE CONTENT ---\n${contentForAI.substring(0, 50000)}\n--- END ---\n\n` : ''}

Respond with ALL of the following sections. Be EXTREMELY thorough in every section:

## Summary
A detailed 3-5 paragraph summary covering: what this file is, its purpose in the project, its relationship to other systems, key design decisions visible in the code, and any notable patterns or anti-patterns.

## Architecture & Structure
- File organization and module structure
- Dependencies and imports (list every one with purpose)
- Export structure (what is exported and why)
- Class/function hierarchy
- State management patterns used
- Component lifecycle and data flow

## Key Knowledge Extracted
- EVERY function, class, method, and variable with its purpose
- All constants, configurations, and magic numbers with explanations
- Every API endpoint, route, or external service interaction
- All data structures, schemas, types, and interfaces
- Business logic rules and conditions
- Error handling strategies
- Performance optimizations present
- Security considerations

## Data Models & Schemas
- All data structures with field-by-field documentation
- Relationships between data models
- Validation rules and constraints
- Default values and their reasoning

## Code Patterns & Snippets
Extract EVERY reusable pattern found. For each one provide:
- The complete code snippet in a code block
- An explanation of what it does and when to use it
- Any gotchas or edge cases

## API & Integration Points
- Every external API call with method, URL, headers, body format
- WebSocket connections and event handlers
- Third-party library usage patterns
- Database queries and operations
- Authentication and authorization flows

## UI/UX Patterns (if applicable)
- Component composition patterns
- Styling approaches and theme usage
- Animation and transition patterns
- Responsive design breakpoints
- Accessibility features

## Integration Guide
Step-by-step guide on how to use this knowledge in a React + Three.js + TailwindCSS + Base44 project. Include:
- Prerequisites and setup
- Import statements needed
- Configuration required
- Example usage code
- Common pitfalls to avoid

## Cross-References
- What other files/modules this likely connects to
- What systems depend on this
- Related patterns in the broader codebase

## Tags
15-25 single-word tags covering technology, domain, patterns, and concepts (e.g., "react", "three.js", "animation", "state-management", "api", "game-data", "shader", "physics", "ui-component")`,
    file_urls: fileUrls.length > 0 ? fileUrls : undefined,
  });

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