/**
 * Local Knowledge Store — IndexedDB-based persistent storage
 * 
 * Stores a copy of all knowledge entries on the user's device.
 * When the PWA/desktop app is installed, this data persists offline.
 * Also supports export to JSON file for backup.
 */

const DB_NAME = 'atom_eve_knowledge';
const DB_VERSION = 1;
const STORE_NAME = 'entries';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('source_filename', 'source_filename', { unique: false });
        store.createIndex('category', 'category', { unique: false });
      }
    };
  });
}

/**
 * Save/update knowledge entries to IndexedDB (deduplicates by id)
 */
export async function saveKnowledgeLocally(entries) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    for (const entry of entries) {
      store.put({
        id: entry.id,
        source_filename: entry.source_filename,
        file_type: entry.file_type,
        file_size: entry.file_size,
        summary: entry.summary,
        full_analysis: entry.full_analysis,
        extracted_code: entry.extracted_code,
        tags: entry.tags,
        category: entry.category,
        is_pinned: entry.is_pinned,
        created_date: entry.created_date,
        updated_date: entry.updated_date,
        synced_at: new Date().toISOString(),
      });
    }
    
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    
    db.close();
  } catch (err) {
    console.error('[LocalKnowledge] Save failed:', err);
  }
}

/**
 * Get count of locally stored entries
 */
export async function getLocalKnowledgeCount() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const count = await new Promise((resolve) => {
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    });
    db.close();
    return count;
  } catch {
    return 0;
  }
}

/**
 * Get all local knowledge entries
 */
export async function getAllLocalKnowledge() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const entries = await new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve([]);
    });
    db.close();
    return entries;
  } catch {
    return [];
  }
}

/**
 * Export all local knowledge as a downloadable JSON blob
 */
export async function exportLocalKnowledge() {
  const entries = await getAllLocalKnowledge();
  if (entries.length === 0) return null;
  
  const exportData = {
    app: 'ATOM × EVE Knowledge Bank',
    exported_at: new Date().toISOString(),
    entry_count: entries.length,
    entries,
  };
  
  return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
}

/**
 * Clear all local knowledge
 */
export async function clearLocalKnowledge() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (err) {
    console.error('[LocalKnowledge] Clear failed:', err);
  }
}