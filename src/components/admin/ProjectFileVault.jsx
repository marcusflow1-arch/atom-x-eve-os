import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Download,
  File,
  FolderArchive,
  HardDrive,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { showError, showSuccess } from '@/components/error/ErrorToast';

const VAULT_ROOT = 'atom-xe-admin-project-vault';
const PACKAGES_DIR = 'packages';
const MANIFEST_FILE = '.atom-xe-vault.json';
const GIB = 1024 ** 3;
const MIN_TARGET_BYTES = 1.5 * GIB;
const SAFETY_RESERVE_BYTES = 64 * 1024 ** 2;

function formatBytes(value = 0) {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let current = bytes / 1024;
  let unit = 0;
  while (current >= 1024 && unit < units.length - 1) {
    current /= 1024;
    unit += 1;
  }
  return `${current >= 100 ? current.toFixed(0) : current >= 10 ? current.toFixed(1) : current.toFixed(2)} ${units[unit]}`;
}

function safeRelativePath(value, fallback = 'file') {
  const normalized = String(value || fallback).replace(/\\/g, '/').replace(/^\/+/, '');
  const parts = normalized.split('/').filter(Boolean);
  if (!parts.length || parts.some(part => part === '.' || part === '..' || /[\x00-\x1f]/.test(part))) {
    throw new Error(`Unsafe file path: ${value || fallback}`);
  }
  return parts.join('/');
}

function safeExportName(value) {
  return String(value || 'Project Files')
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/[. ]+$/g, '')
    .trim() || 'Project Files';
}

function storageSupported() {
  return Boolean(navigator.storage?.getDirectory && navigator.storage?.estimate);
}

async function getPackagesDirectory() {
  if (!storageSupported()) {
    throw new Error('Large project storage requires a current desktop Chromium browser with Origin Private File System support.');
  }
  const root = await navigator.storage.getDirectory();
  const vault = await root.getDirectoryHandle(VAULT_ROOT, { create: true });
  return vault.getDirectoryHandle(PACKAGES_DIR, { create: true });
}

async function writeJson(directory, name, value) {
  const fileHandle = await directory.getFileHandle(name, { create: true });
  const writable = await fileHandle.createWritable();
  try {
    await writable.write(JSON.stringify(value, null, 2));
    await writable.close();
  } catch (error) {
    await writable.abort?.().catch(() => {});
    throw error;
  }
}

async function readJson(directory, name) {
  const fileHandle = await directory.getFileHandle(name);
  const file = await fileHandle.getFile();
  return JSON.parse(await file.text());
}

async function streamFileToHandle(file, targetHandle, onBytes = () => {}) {
  const writable = await targetHandle.createWritable();
  const reader = file.stream().getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      await writable.write(value);
      onBytes(value.byteLength);
    }
    await writable.close();
  } catch (error) {
    await writable.abort?.().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}

async function storeFile(rootDirectory, relativePath, file, onBytes) {
  const parts = safeRelativePath(relativePath, file.name).split('/');
  const fileName = parts.pop();
  let directory = rootDirectory;
  for (const part of parts) {
    directory = await directory.getDirectoryHandle(part, { create: true });
  }
  const target = await directory.getFileHandle(fileName, { create: true });
  await streamFileToHandle(file, target, onBytes);
}

async function copyDirectory(sourceDirectory, targetDirectory, onBytes) {
  for await (const [name, handle] of sourceDirectory.entries()) {
    if (handle.kind === 'directory') {
      const child = await targetDirectory.getDirectoryHandle(name, { create: true });
      await copyDirectory(handle, child, onBytes);
    } else {
      const sourceFile = await handle.getFile();
      const targetFile = await targetDirectory.getFileHandle(name, { create: true });
      await streamFileToHandle(sourceFile, targetFile, onBytes);
    }
  }
}

async function listPackages() {
  const packagesDirectory = await getPackagesDirectory();
  const rows = [];
  for await (const [id, handle] of packagesDirectory.entries()) {
    if (handle.kind !== 'directory') continue;
    try {
      const manifest = await readJson(handle, MANIFEST_FILE);
      rows.push({ ...manifest, id });
    } catch {
      // Ignore incomplete imports. Failed imports are removed immediately when possible.
    }
  }
  rows.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  return rows;
}

async function getStorageStatus() {
  if (!storageSupported()) {
    return { supported: false, persisted: false, quota: 0, usage: 0, available: 0 };
  }
  const estimate = await navigator.storage.estimate();
  const quota = Number(estimate.quota || 0);
  const usage = Number(estimate.usage || 0);
  const persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;
  return {
    supported: true,
    persisted,
    quota,
    usage,
    available: Math.max(0, quota - usage),
  };
}

export default function ProjectFileVault() {
  const fileInput = useRef(null);
  const folderInput = useRef(null);
  const [packages, setPackages] = useState([]);
  const [storage, setStorage] = useState({ supported: true, persisted: false, quota: 0, usage: 0, available: 0 });
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ label: '', current: 0, total: 0 });

  const refresh = useCallback(async () => {
    try {
      const status = await getStorageStatus();
      setStorage(status);
      setPackages(status.supported ? await listPackages() : []);
    } catch (error) {
      setStorage({ supported: false, persisted: false, quota: 0, usage: 0, available: 0 });
      setPackages([]);
      showError(error, 'Project File Vault');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const requestPersistence = async () => {
    if (!navigator.storage?.persist) {
      showError('This browser cannot request persistent storage.');
      return;
    }
    try {
      const granted = await navigator.storage.persist();
      await refresh();
      if (granted) showSuccess('Persistent browser storage is enabled for the project vault.');
      else showError('The browser did not grant persistent storage. Files still work, but browser cleanup may remove them.');
    } catch (error) {
      showError(error, 'Persistent Storage');
    }
  };

  const importSelection = async (selection, mode) => {
    const files = Array.from(selection || []);
    if (!files.length || busy) return;

    setBusy(true);
    let packageId = null;
    let packagesDirectory = null;
    try {
      if (!storageSupported()) throw new Error('This browser does not support large local project storage.');

      if (navigator.storage.persist) {
        await navigator.storage.persist().catch(() => false);
      }

      const totalBytes = files.reduce((sum, file) => sum + Number(file.size || 0), 0);
      const estimate = await navigator.storage.estimate();
      const available = Math.max(0, Number(estimate.quota || 0) - Number(estimate.usage || 0));
      if (available && totalBytes + SAFETY_RESERVE_BYTES > available) {
        throw new Error(`Not enough browser storage. This import needs about ${formatBytes(totalBytes + SAFETY_RESERVE_BYTES)}, but only ${formatBytes(available)} is available.`);
      }

      const firstRelativePath = files[0]?.webkitRelativePath || '';
      const detectedRoot = mode === 'installation' && firstRelativePath.includes('/')
        ? firstRelativePath.split('/')[0]
        : '';
      const displayName = name.trim() || detectedRoot || (files.length === 1 ? files[0].name : `Project Files ${new Date().toLocaleDateString()}`);

      packageId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      packagesDirectory = await getPackagesDirectory();
      const packageDirectory = await packagesDirectory.getDirectoryHandle(packageId, { create: true });
      const dataDirectory = await packageDirectory.getDirectoryHandle('data', { create: true });

      const seen = new Set();
      let copiedBytes = 0;
      setProgress({ label: 'Preparing import', current: 0, total: totalBytes });

      for (const file of files) {
        const originalPath = file.webkitRelativePath || file.name;
        const relativePath = mode === 'installation' && detectedRoot && originalPath.startsWith(`${detectedRoot}/`)
          ? originalPath.slice(detectedRoot.length + 1)
          : originalPath;
        const safePath = safeRelativePath(relativePath, file.name);
        if (seen.has(safePath)) throw new Error(`Duplicate path in selection: ${safePath}`);
        seen.add(safePath);

        setProgress(current => ({ ...current, label: safePath }));
        await storeFile(dataDirectory, safePath, file, bytes => {
          copiedBytes += bytes;
          setProgress({ label: safePath, current: copiedBytes, total: totalBytes });
        });
      }

      await writeJson(packageDirectory, MANIFEST_FILE, {
        version: 1,
        name: displayName,
        mode,
        sourceRoot: detectedRoot,
        fileCount: files.length,
        totalBytes,
        createdAt: new Date().toISOString(),
      });

      setName('');
      showSuccess(`${displayName} stored in the Project File Vault.`);
      await refresh();
    } catch (error) {
      if (packageId && packagesDirectory) {
        await packagesDirectory.removeEntry(packageId, { recursive: true }).catch(() => {});
      }
      showError(error, 'Project File Import');
    } finally {
      setBusy(false);
      setProgress({ label: '', current: 0, total: 0 });
      if (fileInput.current) fileInput.current.value = '';
      if (folderInput.current) folderInput.current.value = '';
    }
  };

  const exportPackage = async item => {
    if (!window.showDirectoryPicker) {
      showError('Exporting a complete installation requires current Chrome or Edge on desktop.');
      return;
    }
    if (busy) return;

    setBusy(true);
    let copiedBytes = 0;
    setProgress({ label: `Exporting ${item.name}`, current: 0, total: item.totalBytes || 0 });
    try {
      const targetRoot = await window.showDirectoryPicker({ mode: 'readwrite' });
      const exportRoot = await targetRoot.getDirectoryHandle(safeExportName(item.sourceRoot || item.name), { create: true });
      const packagesDirectory = await getPackagesDirectory();
      const packageDirectory = await packagesDirectory.getDirectoryHandle(item.id);
      const dataDirectory = await packageDirectory.getDirectoryHandle('data');

      await copyDirectory(dataDirectory, exportRoot, bytes => {
        copiedBytes += bytes;
        setProgress({ label: `Exporting ${item.name}`, current: copiedBytes, total: item.totalBytes || copiedBytes });
      });

      showSuccess(`${item.name} exported with its folder structure intact.`);
    } catch (error) {
      if (error?.name !== 'AbortError') showError(error, 'Export Installation');
    } finally {
      setBusy(false);
      setProgress({ label: '', current: 0, total: 0 });
    }
  };

  const deletePackage = async item => {
    if (busy) return;
    if (!window.confirm(`Delete "${item.name}" from this browser's Project File Vault? This cannot be undone unless you have another copy.`)) return;

    setBusy(true);
    try {
      const packagesDirectory = await getPackagesDirectory();
      await packagesDirectory.removeEntry(item.id, { recursive: true });
      showSuccess(`${item.name} removed from the Project File Vault.`);
      await refresh();
    } catch (error) {
      showError(error, 'Delete Project Files');
    } finally {
      setBusy(false);
    }
  };

  const percent = progress.total > 0 ? Math.min(100, Math.round((progress.current / progress.total) * 100)) : 0;
  const targetReady = storage.available >= MIN_TARGET_BYTES;

  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-cyan-400" />
            Project File Vault
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-3xl">
            Store complete project files and installation folders in this browser without sending the file bytes through Base44. Large files are streamed to persistent browser storage so multi-gigabyte imports do not need to fit in memory.
          </p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={busy} className="border-slate-700">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {!storage.supported ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-100">
          <div className="font-semibold">Large-file vault is unavailable in this browser.</div>
          <p className="text-sm text-red-200/80 mt-1">Use current Chrome or Edge on desktop over HTTPS (or localhost) so the Origin Private File System is available.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
              <div className="text-xs uppercase tracking-wider text-slate-500">Browser quota</div>
              <div className="text-xl font-bold mt-1">{formatBytes(storage.quota)}</div>
              <div className="text-xs text-slate-500 mt-1">{formatBytes(storage.available)} available · {formatBytes(storage.usage)} used by this site</div>
            </div>
            <div className={`rounded-xl border p-4 ${targetReady ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
              <div className="text-xs uppercase tracking-wider text-slate-400">1.5 GB installation target</div>
              <div className={`text-xl font-bold mt-1 ${targetReady ? 'text-emerald-300' : 'text-amber-300'}`}>
                {targetReady ? 'Ready' : 'More space needed'}
              </div>
              <div className="text-xs text-slate-400 mt-1">Imports are checked against the browser's real remaining quota before copying.</div>
            </div>
            <div className={`rounded-xl border p-4 ${storage.persisted ? 'border-cyan-500/30 bg-cyan-500/10' : 'border-slate-700 bg-slate-950/60'}`}>
              <div className="text-xs uppercase tracking-wider text-slate-500">Storage protection</div>
              <div className="flex items-center gap-2 mt-1">
                <ShieldCheck className={`w-5 h-5 ${storage.persisted ? 'text-cyan-300' : 'text-slate-500'}`} />
                <span className="font-bold">{storage.persisted ? 'Persistent' : 'Best effort'}</span>
              </div>
              {!storage.persisted && (
                <Button size="sm" variant="outline" onClick={requestPersistence} className="mt-3 border-slate-600">
                  Protect stored files
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <FolderArchive className="w-5 h-5 text-cyan-300" />
              <h3 className="font-semibold">Import project files</h3>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Installation-folder imports preserve relative paths exactly. Select the top-level folder (for example, a complete game installation or extracted asset tree), not thousands of files one by one.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-3">
              <Input
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="Optional vault name (otherwise use folder/file name)"
                className="bg-slate-950 border-slate-700"
                disabled={busy}
              />
              <label className="cursor-pointer">
                <input
                  ref={fileInput}
                  type="file"
                  multiple
                  className="hidden"
                  disabled={busy}
                  onChange={event => importSelection(event.target.files, 'files')}
                />
                <Button asChild disabled={busy} className="w-full bg-slate-700 hover:bg-slate-600">
                  <span><Upload className="w-4 h-4 mr-2" /> Add whole file(s)</span>
                </Button>
              </label>
              <label className="cursor-pointer">
                <input
                  ref={folderInput}
                  type="file"
                  multiple
                  webkitdirectory="true"
                  directory="true"
                  className="hidden"
                  disabled={busy}
                  onChange={event => importSelection(event.target.files, 'installation')}
                />
                <Button asChild disabled={busy} className="w-full bg-cyan-700 hover:bg-cyan-600">
                  <span><FolderArchive className="w-4 h-4 mr-2" /> Import installation folder</span>
                </Button>
              </label>
            </div>

            {busy && progress.label && (
              <div className="mt-5">
                <div className="flex items-center justify-between gap-4 text-xs mb-2">
                  <span className="text-slate-300 truncate">{progress.label}</span>
                  <span className="text-slate-500 shrink-0">{formatBytes(progress.current)} / {formatBytes(progress.total)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div className="h-full bg-cyan-500 transition-[width] duration-150" style={{ width: `${percent}%` }} />
                </div>
              </div>
            )}

            <div className="mt-4 text-xs text-slate-500">
              These bytes stay in this browser profile. They are not Git commits and are not Base44 cloud uploads. Keep an external backup; clearing site data can remove the vault unless the browser preserves it.
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="text-lg font-semibold">Stored installations and file sets</h3>
              <span className="text-xs text-slate-500">{packages.length} package{packages.length === 1 ? '' : 's'}</span>
            </div>

            {packages.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
                <HardDrive className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Nothing is stored in the Project File Vault yet.</p>
                <p className="text-sm text-slate-600 mt-1">Import a full installation folder or one or more whole files above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {packages.map(item => (
                  <div key={item.id} className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="w-11 h-11 rounded-lg bg-slate-950 flex items-center justify-center shrink-0">
                      {item.mode === 'installation' ? <FolderArchive className="w-6 h-6 text-cyan-300" /> : <File className="w-6 h-6 text-slate-300" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold truncate" title={item.name}>{item.name}</h4>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                        <span>{formatBytes(item.totalBytes)}</span>
                        <span>{Number(item.fileCount || 0).toLocaleString()} file{Number(item.fileCount || 0) === 1 ? '' : 's'}</span>
                        <span>{item.mode === 'installation' ? 'Installation folder' : 'File set'}</span>
                        {item.createdAt && <span>{new Date(item.createdAt).toLocaleString()}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" onClick={() => exportPackage(item)} disabled={busy} className="border-slate-600">
                        <Download className="w-4 h-4 mr-2" /> Export whole
                      </Button>
                      <Button variant="ghost" onClick={() => deletePackage(item)} disabled={busy} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
