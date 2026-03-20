/**
 * Knowledge Learner Engine — Module-level singleton
 * 
 * Runs analysis jobs in the background. Survives React re-renders and tab switches.
 * 
 * REFRESH-RESILIENT: File content (text) is persisted to IndexedDB alongside the queue.
 * On page refresh, the engine auto-resumes processing without user intervention.
 * Binary/asset files that need upload store a flag and are re-uploaded from cached content.
 */
import { base44 } from '@/api/base44Client';

const STORAGE_KEY = 'knowledge_learner_queue';
const IDB_NAME = 'knowledge_learner_content';
const IDB_VERSION = 1;
const IDB_STORE = 'file_contents';

// ─── IndexedDB for large content persistence ────────
function _openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' });
      }
    };
  });
}

async function _saveContentToIDB(id, content) {
  try {
    const db = await _openIDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put({ id, content });
    await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
    db.close();
  } catch (e) { console.warn('[KnowledgeLearner] IDB save failed:', e); }
}

async function _getContentFromIDB(id) {
  try {
    const db = await _openIDB();
    const tx = db.transaction(IDB_STORE, 'readonly');
    const result = await new Promise((res) => {
      const req = tx.objectStore(IDB_STORE).get(id);
      req.onsuccess = () => res(req.result?.content || null);
      req.onerror = () => res(null);
    });
    db.close();
    return result;
  } catch { return null; }
}

async function _deleteContentFromIDB(id) {
  try {
    const db = await _openIDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(id);
    await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
    db.close();
  } catch {}
}

async function _clearAllContentIDB() {
  try {
    const db = await _openIDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).clear();
    await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
    db.close();
  } catch {}
}

// ─── State ──────────────────────────────────────────
let _state = {
  queue: [],           // { id, name, size, category, content, rawFile, needsUpload, status:'queued', knowledgeDomain }
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

// ─── LocalStorage persistence (metadata only) ───────
function _persistQueue() {
  try {
    const serializable = _state.queue.map(f => ({
      id: f.id,
      name: f.name,
      size: f.size,
      category: f.category,
      needsUpload: f.needsUpload,
    }));
    const payload = {
      queue: serializable,
      folderName: _state.folderName,
      progress: _state.progress,
      completed: _state.completed,
      failed: _state.failed,
      skipped: _state.skipped,
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
    // Discard if older than 48 hours (stale)
    if (Date.now() - (data.timestamp || 0) > 48 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch { return null; }
}

function _clearPersisted() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  _clearAllContentIDB();
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
 * Content is persisted to IndexedDB so it survives page refreshes.
 * Starts processing automatically.
 */
export async function enqueueFiles(files, folderName) {
  const existing = await _loadExistingKnowledge();

  let added = 0;
  let dupes = 0;
  for (const file of files) {
    const key = _makeKey(file.name, file.size);
    if (existing.has(key)) {
      _state.skipped.push({ id: file.id, name: file.name });
      _state.progress.total += 1;
      _state.progress.done += 1;
      dupes++;
      continue;
    }
    if (_state.queue.some(q => q.name === file.name && q.size === file.size)) {
      dupes++;
      continue;
    }

    // Persist content to IndexedDB so it survives refresh
    if (file.content) {
      await _saveContentToIDB(file.id, file.content);
    }

    _state.queue.push(file);
    _state.progress.total += 1;
    added++;
  }

  if (folderName) _state.folderName = folderName;
  _persistQueue();
  _notify();

  if (!_state.isRunning && _state.queue.length > 0) {
    _processQueue();
  }

  return { added, dupes };
}

/**
 * Check for an interrupted session. Returns info or null.
 */
export function getInterruptedSession() {
  const data = _loadPersistedQueue();
  if (!data || !data.queue || data.queue.length === 0) return null;
  if (_state.isRunning) return null;
  return {
    fileCount: data.queue.length,
    folderName: data.folderName,
    fileNames: data.queue.map(f => f.name),
    timestamp: data.timestamp,
  };
}

/**
 * Resume an interrupted session. Since content is stored in IndexedDB,
 * most files can be resumed automatically without re-selecting the folder.
 */
export async function resumeInterrupted() {
  const data = _loadPersistedQueue();
  if (!data || !data.queue || data.queue.length === 0) return { resumed: 0, needsReselect: 0 };

  const existing = await _loadExistingKnowledge();

  // Restore completed/failed/skipped counters from persisted state
  if (data.completed) _state.completed = data.completed;
  if (data.failed) _state.failed = data.failed;
  if (data.skipped) _state.skipped = data.skipped;
  if (data.progress) _state.progress = { ...data.progress };

  let resumed = 0;
  let needsReselect = 0;

  for (const item of data.queue) {
    const key = _makeKey(item.name, item.size);
    if (existing.has(key)) {
      _state.progress.done = (_state.progress.done || 0) + 1;
      continue;
    }
    if (_state.queue.some(q => q.name === item.name && q.size === item.size)) continue;

    // Try to recover content from IndexedDB
    const savedContent = await _getContentFromIDB(item.id);

    if (savedContent) {
      // Content recovered — can process immediately
      _state.queue.push({
        ...item,
        content: savedContent,
        rawFile: null,
        needsReread: false,
        status: 'queued',
      });
      resumed++;
    } else {
      // Content lost — needs re-select
      _state.queue.push({
        ...item,
        content: null,
        rawFile: null,
        needsReread: true,
        status: 'queued',
      });
      needsReselect++;
    }
  }

  if (data.folderName) _state.folderName = data.folderName;
  _notify();

  // Auto-start processing items that have content
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
      const truncated = content.substring(0, 50000);
      _state.queue[idx] = {
        ..._state.queue[idx],
        content: truncated,
        rawFile: file,
        needsReread: false,
      };
      // Also persist the new content to IDB
      await _saveContentToIDB(_state.queue[idx].id, truncated);
      matched++;
    }
  }
  _notify();

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
  _deleteContentFromIDB(id);
  _persistQueue();
  _notify();
}

// ─── Internal Processing Loop ───────────────────────

async function _processQueue() {
  if (_state.isRunning) {
    console.log('[KnowledgeLearner] Already running, skipping duplicate start');
    return;
  }
  _state.isRunning = true;
  _notify();
  console.log(`[KnowledgeLearner] Starting processing loop with ${_state.queue.length} items`);

  while (_state.queue.length > 0) {
    const readyIdx = _state.queue.findIndex(q => !q.needsReread);
    if (readyIdx === -1) {
      _state.lastLog = `Paused: ${_state.queue.length} file(s) need re-selecting the folder to resume.`;
      console.log('[KnowledgeLearner] No ready items, pausing');
      break;
    }

    const item = _state.queue[readyIdx];
    console.log(`[KnowledgeLearner] Processing: ${item.name} (${readyIdx + 1}/${_state.queue.length})`);

    // If content is missing from memory but might be in IDB (e.g. after hot-reload)
    if (!item.content && !item.needsUpload) {
      const idbContent = await _getContentFromIDB(item.id);
      if (idbContent) {
        item.content = idbContent;
      } else {
        console.warn(`[KnowledgeLearner] No content for ${item.name}, marking as needs-reread`);
        item.needsReread = true;
        _persistQueue();
        _notify();
        continue;
      }
    }

    _state.currentId = item.id;
    _state.lastLog = `Analyzing: ${item.name}`;
    _persistQueue();
    _notify();

    const startTime = Date.now();
    try {
      const existing = await _loadExistingKnowledge();
      const key = _makeKey(item.name, item.size);
      if (existing.has(key)) {
        _state.skipped.push({ id: item.id, name: item.name });
        _state.progress.done += 1;
        _state.lastLog = `Skipped (already exists): ${item.name}`;
        console.log(`[KnowledgeLearner] Skipped (dupe): ${item.name}`);
      } else {
        await _learnSingleFile(item);
        _state.completed.push(item.id);
        _state.progress.done += 1;
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        _state.lastLog = `Learned: ${item.name} (${elapsed}s)`;
        existing.set(key, true);
        console.log(`[KnowledgeLearner] Learned: ${item.name} in ${elapsed}s`);
      }
    } catch (err) {
      console.error(`[KnowledgeLearner] Failed on ${item.name}:`, err);
      _state.failed.push({ id: item.id, name: item.name, error: err?.message || String(err) });
      _state.progress.done += 1;
      _state.lastLog = `Failed: ${item.name} — ${err?.message || 'unknown error'}`;
    }

    // Clean up processed item from queue and IDB
    _state.queue = _state.queue.filter(f => f.id !== item.id);
    _state.currentId = null;
    _deleteContentFromIDB(item.id);
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

  // Add a 3-minute timeout to prevent silent stalling
  const llmPromise = base44.integrations.Core.InvokeLLM({
    prompt: `You are an ADVANCED LEARNING ENGINE for a game development platform.
Your primary directive is: Learn everything from the file, store the knowledge, and use that for your own basic understanding.
Do not just summarize. You must break down, examine, and absorb the core principles, patterns, and logic so you fully comprehend it as part of your core knowledge base.

FILE: "${pf.name}" (${pf.category} file, ${(pf.size / 1024).toFixed(1)} KB)

${contentForAI ? `--- FILE CONTENT ---\n${contentForAI.substring(0, 50000)}\n--- END ---\n\n` : ''}

Perform a complete breakdown and return the following EXHAUSTIVE analysis:

## Complete Comprehension
3-5 detailed paragraphs explaining what you have learned from this file for your own understanding. What are the underlying mechanics and logic?

## Architecture & Design Patterns
How is the system built? What structural patterns are used?

## Core Mechanics & Breakdown
Break down the complex logic into digestable principles. What exactly makes this file tick?

## Key Knowledge Extracted
List every significant function, class, variable, constant, and configuration option. Explain what each one does and why it matters.

## Code Patterns & Snippets (Verbatim)
Extract the most important/complex code blocks exactly as they are. This is crucial reference material for your memory.

## Data Structures & Schemas
Document every JSON structure, type definition, database schema, or data model found.

## Actionable Integration
How you would use this knowledge going forward to build similar systems or interface with it.

## Dependencies
External libraries, APIs, or assets required.

## Tags
15-25 single-word tags covering technology, domain, patterns, and concepts.`,
    file_urls: fileUrls.length > 0 ? fileUrls : undefined,
  });

  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('LLM analysis timed out after 3 minutes')), 180000)
  );

  const analysis = await Promise.race([llmPromise, timeoutPromise]);

  const tagMatch = analysis.match(/##\s*Tags\s*\n([\s\S]*?)(?:\n##|$)/i);
  let tags = [];
  if (tagMatch) {
    tags = tagMatch[1].match(/[\w.-]+/g)?.filter(t => t.length > 1 && t.length < 30).slice(0, 25) || [];
  }

  const codeBlocks = [];
  const codeRegex = /```[\w]*\n([\s\S]*?)```/g;
  let match;
  while ((match = codeRegex.exec(analysis)) !== null) {
    codeBlocks.push(match[1].trim());
  }

  const summaryMatch = analysis.match(/##\s*Summary\s*\n([\s\S]*?)(?:\n##|$)/i);
  const summary = summaryMatch ? summaryMatch[1].trim().substring(0, 500) : pf.name;

  // Determine knowledge domain: game_reference (studying existing games) vs engine_building (building tools/systems) vs general
  let knowledgeDomain = pf.knowledgeDomain || 'general';
  if (!pf.knowledgeDomain) {
    // Auto-detect: if the folder name starts with the game emoji, it's a game reference
    const folderName = _state.folderName || '';
    if (folderName.startsWith('🎮')) {
      knowledgeDomain = 'game_reference';
    } else {
      // Check file content for game engine indicators
      const lowerContent = (pf.content || '').toLowerCase();
      const lowerName = pf.name.toLowerCase();
      const gameEngineIndicators = ['unreal', 'unity', 'godot', 'ue4', 'ue5', 'uproject', 'uasset', 'blueprint', 'gamemode', 'pawn', 'actor', 'playercontroller'];
      const engineBuildIndicators = ['three.js', 'threejs', 'react-three', 'webgl', 'shader', 'glsl', 'scene.add', 'mesh', 'renderer'];
      if (gameEngineIndicators.some(i => lowerName.includes(i) || lowerContent.substring(0, 2000).includes(i))) {
        knowledgeDomain = 'game_reference';
      } else if (engineBuildIndicators.some(i => lowerName.includes(i) || lowerContent.substring(0, 2000).includes(i))) {
        knowledgeDomain = 'engine_building';
      }
    }
  }

  await base44.entities.KnowledgeEntry.create({
    source_filename: pf.name,
    file_type: pf.name.split('.').pop()?.toLowerCase() || 'unknown',
    file_size: pf.size,
    summary,
    full_analysis: analysis,
    extracted_code: codeBlocks.join('\n\n// ───────────────────\n\n'),
    tags,
    category: pf.category || classifyFile(pf.name),
    knowledge_domain: knowledgeDomain,
    analyzed_date: new Date().toISOString(),
    is_pinned: false,
  });
}

// ─── AUTO-RESUME ON MODULE LOAD ─────────────────────
// When this module is first imported (e.g. after page refresh),
// automatically check for and resume any interrupted session.
(async function _autoResumeOnLoad() {
  // Small delay to let the app initialize auth etc.
  await new Promise(r => setTimeout(r, 2000));
  
  const data = _loadPersistedQueue();
  if (!data || !data.queue || data.queue.length === 0) return;
  if (_state.isRunning) return;
  
  console.log(`[KnowledgeLearner] Found interrupted session with ${data.queue.length} files — auto-resuming...`);
  
  const result = await resumeInterrupted();
  console.log(`[KnowledgeLearner] Auto-resume: ${result.resumed} files resumed, ${result.needsReselect} need folder re-select`);
})();