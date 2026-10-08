import React, { useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  Box,
  ChevronLeft,
  Code2,
  Database,
  File,
  FileCode2,
  FolderGit2,
  Gamepad2,
  HardDrive,
  Search,
  ShieldCheck,
  Upload,
  Wrench,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { showError, showSuccess } from '@/components/error/ErrorToast';

const GAME_KEY = 'jedi_outcast';

function formatBytes(value = 0) {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function FileRows({ rows, search, onSelect }) {
  const filtered = rows.filter(row => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return [row.path, row.display_name, row.category, row.source_origin]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(needle));
  });

  if (!filtered.length) {
    return (
      <div className="py-14 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
        No matching files.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filtered.map(row => (
        <button
          key={row.id}
          type="button"
          onClick={() => onSelect?.(row)}
          className="w-full text-left rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-900/80 hover:border-slate-700 p-3 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
              {row.area === 'source_code' ? <FileCode2 className="w-4 h-4 text-cyan-300" /> : <File className="w-4 h-4 text-slate-300" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-slate-100 truncate">{row.display_name || row.path}</div>
              <div className="text-xs text-slate-500 truncate mt-0.5">{row.path}</div>
            </div>
            <div className="text-right shrink-0">
              <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                {row.status || 'catalogued'}
              </Badge>
              <div className="text-[10px] text-slate-600 mt-1">{formatBytes(row.byte_size)}</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function GameReconstructionManager() {
  const queryClient = useQueryClient();
  const uploadInput = useRef(null);
  const [selectedGame, setSelectedGame] = useState(GAME_KEY);
  const [activeArea, setActiveArea] = useState('original_asset');
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [storingSource, setStoringSource] = useState(false);

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['reconstruction-projects'],
    queryFn: () => base44.entities.GameReconstructionProject.list('title', 50),
  });

  const { data: workspaceFiles = [] } = useQuery({
    queryKey: ['reconstruction-files', selectedGame],
    queryFn: () => base44.entities.GameReconstructionFile.filter({ game_key: selectedGame }, 'path', 1000),
    enabled: !!selectedGame,
  });

  const { data: sourceAssets = [] } = useQuery({
    queryKey: ['jedi-source-assets', selectedGame],
    queryFn: () => base44.entities.JediSourceAsset.filter({ game_key: selectedGame }, 'path', 1000),
    enabled: selectedGame === GAME_KEY,
  });

  const { data: definitions = [] } = useQuery({
    queryKey: ['jedi-definitions', selectedGame],
    queryFn: () => base44.entities.JediContentDefinition.filter({ game_key: selectedGame }, 'content_key', 1000),
    enabled: selectedGame === GAME_KEY,
  });

  const { data: pakChunks = [] } = useQuery({
    queryKey: ['jedi-pak-chunks', selectedGame],
    queryFn: () => base44.entities.JediPakChunk.filter({ game_key: selectedGame }, 'archive_name', 1000),
    enabled: selectedGame === GAME_KEY,
  });

  const project = projects.find(item => item.game_key === selectedGame) || projects[0] || null;

  const sourceFiles = useMemo(
    () => workspaceFiles.filter(file => file.area === 'source_code'),
    [workspaceFiles],
  );
  const rebuiltFiles = useMemo(
    () => workspaceFiles.filter(file => file.area === 'rebuilt_output'),
    [workspaceFiles],
  );
  const uploadedOriginals = useMemo(
    () => workspaceFiles.filter(file => file.area === 'original_asset'),
    [workspaceFiles],
  );

  const originalRows = useMemo(() => {
    const catalog = sourceAssets.map(asset => ({
      ...asset,
      display_name: asset.path?.split('/').pop() || asset.path,
      area: 'original_asset',
    }));
    return [...catalog, ...uploadedOriginals];
  }, [sourceAssets, uploadedOriginals]);

  const archiveBytes = sourceAssets
    .filter(asset => asset.category === 'retail_archive')
    .reduce((sum, asset) => sum + Number(asset.byte_size || 0), 0);

  const storeFullSourceSnapshot = async () => {
    setStoringSource(true);
    try {
      const response = await base44.functions.invoke('jediOutcastSource', { action: 'cacheSourceArchive' });
      const data = response?.data ?? response;
      if (!data?.success) throw new Error(data?.error || 'Could not store the full Raven source snapshot.');
      await queryClient.invalidateQueries({ queryKey: ['reconstruction-files', selectedGame] });
      showSuccess(data.reused ? 'Full Raven source snapshot is already stored.' : 'Full Raven source snapshot stored in Base44.');
    } catch (error) {
      showError(error, 'Store source snapshot');
    } finally {
      setStoringSource(false);
    }
  };

  const handleUpload = async event => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setUploading(true);
    try {
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        let content = '';
        const likelyText =
          activeArea === 'source_code' &&
          (file.type.startsWith('text/') || /\.(c|cc|cpp|cxx|h|hpp|js|jsx|ts|tsx|json|cfg|shader|txt|md)$/i.test(file.name));

        if (likelyText && file.size <= 5 * 1024 * 1024) {
          content = await file.text();
        }

        await base44.entities.GameReconstructionFile.create({
          game_key: selectedGame,
          area: activeArea,
          path: file.webkitRelativePath || file.name,
          display_name: file.name,
          language: activeArea === 'source_code' ? (file.name.split('.').pop() || '') : '',
          source_origin: 'admin_upload',
          storage_url: file_url,
          content,
          byte_size: file.size,
          canonical: activeArea !== 'rebuilt_output',
          editable: activeArea !== 'original_asset',
          status: activeArea === 'rebuilt_output' ? 'generated' : 'stored',
          metadata: {
            uploaded_from_admin: true,
            original_name: file.name,
            mime_type: file.type || 'application/octet-stream',
          },
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['reconstruction-files', selectedGame] });
      showSuccess(`${files.length} file${files.length === 1 ? '' : 's'} stored in the reconstruction workspace.`);
    } catch (error) {
      showError(error, 'Reconstruction upload');
    } finally {
      setUploading(false);
      if (uploadInput.current) uploadInput.current.value = '';
    }
  };

  if (projectsLoading) {
    return <div className="py-16 text-center text-slate-500">Loading reconstruction workspace…</div>;
  }

  if (!project) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-slate-400">
        No reconstruction projects are registered yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-5">
      <aside className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3 h-fit">
        <div className="px-2 pt-2 pb-3">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-600">Game Reconstruction</div>
          <div className="text-sm text-slate-400 mt-1">Private admin workspace</div>
        </div>
        <div className="space-y-2">
          {projects.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedGame(item.game_key)}
              className={`w-full rounded-xl border p-3 text-left transition-colors ${
                selectedGame === item.game_key
                  ? 'border-cyan-500/40 bg-cyan-500/10'
                  : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-slate-950 flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5 text-cyan-300" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{item.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{item.status}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="min-w-0">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/55 overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.17em] text-cyan-400/80">
                  <ShieldCheck className="w-4 h-4" /> Reconstruction Project
                </div>
                <h2 className="text-2xl font-bold mt-2">{project.title}</h2>
                <p className="text-sm text-slate-400 mt-1">{project.subtitle}</p>
                <p className="text-sm text-slate-500 mt-4 max-w-4xl leading-6">{project.description}</p>
              </div>
              <Badge className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                {project.status}
              </Badge>
            </div>

            <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100/80">
              <strong className="text-amber-200">Runtime rule:</strong> {project.runtime_policy}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-5">
              <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3">
                <div className="text-xs text-slate-500">Original assets</div>
                <div className="text-xl font-semibold mt-1">{originalRows.length}</div>
              </div>
              <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3">
                <div className="text-xs text-slate-500">Source files</div>
                <div className="text-xl font-semibold mt-1">{sourceFiles.length}</div>
              </div>
              <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3">
                <div className="text-xs text-slate-500">Editable definitions</div>
                <div className="text-xl font-semibold mt-1">{definitions.length}</div>
              </div>
              <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3">
                <div className="text-xs text-slate-500">Rebuilt outputs</div>
                <div className="text-xl font-semibold mt-1">{rebuiltFiles.length}</div>
              </div>
              <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3">
                <div className="text-xs text-slate-500">Retail cache</div>
                <div className="text-xl font-semibold mt-1">{pakChunks.length} chunks</div>
                <div className="text-[10px] text-slate-600">{formatBytes(archiveBytes)}</div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <Tabs defaultValue="assets" onValueChange={value => {
              setSelectedFile(null);
              if (value === 'assets') setActiveArea('original_asset');
              if (value === 'source') setActiveArea('source_code');
              if (value === 'rebuilt') setActiveArea('rebuilt_output');
            }}>
              <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between mb-5">
                <TabsList className="bg-slate-900 border border-slate-800">
                  <TabsTrigger value="assets"><Archive className="w-4 h-4 mr-2" />Original Assets</TabsTrigger>
                  <TabsTrigger value="source"><Code2 className="w-4 h-4 mr-2" />Source Code</TabsTrigger>
                  <TabsTrigger value="definitions"><Database className="w-4 h-4 mr-2" />Editable Content</TabsTrigger>
                  <TabsTrigger value="rebuilt"><Wrench className="w-4 h-4 mr-2" />Rebuilt Output</TabsTrigger>
                </TabsList>

                <div className="flex gap-2">
                  <div className="relative min-w-[240px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <Input
                      value={search}
                      onChange={event => setSearch(event.target.value)}
                      placeholder="Search project files…"
                      className="pl-9 bg-slate-950 border-slate-800"
                    />
                  </div>
                  <input ref={uploadInput} type="file" multiple className="hidden" onChange={handleUpload} />
                  <Button
                    type="button"
                    disabled={uploading}
                    onClick={() => uploadInput.current?.click()}
                    className="bg-cyan-700 hover:bg-cyan-600"
                  >
                    <Upload className="w-4 h-4 mr-2" /> {uploading ? 'Storing…' : 'Upload'}
                  </Button>
                </div>
              </div>

              <TabsContent value="assets" className="mt-0">
                <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                  <div className="flex items-center gap-2 font-medium"><HardDrive className="w-4 h-4 text-cyan-300" />Canonical asset store</div>
                  <p className="text-xs text-slate-500 mt-2">
                    Original retail/extracted assets are reference material. Rebuilds should consume these files but never overwrite them.
                  </p>
                </div>
                <FileRows rows={originalRows} search={search} onSelect={setSelectedFile} />
              </TabsContent>

              <TabsContent value="source" className="mt-0">
                <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 font-medium"><FolderGit2 className="w-4 h-4 text-cyan-300" />Pinned Raven source mirror</div>
                      <div className="text-xs text-slate-500 mt-2 break-all">
                        {project.source_repository} @ {project.source_commit}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={storeFullSourceSnapshot}
                      disabled={storingSource}
                      className="border-slate-700 shrink-0"
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      {storingSource ? 'Storing source…' : 'Store Full Source Snapshot'}
                    </Button>
                  </div>
                </div>
                <FileRows rows={sourceFiles} search={search} onSelect={setSelectedFile} />
              </TabsContent>

              <TabsContent value="definitions" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {definitions
                    .filter(row => !search || `${row.content_key} ${row.name} ${row.content_type}`.toLowerCase().includes(search.toLowerCase()))
                    .map(row => (
                      <div key={row.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium">{row.name}</div>
                          <Badge variant="outline" className="border-slate-700 text-slate-400">{row.content_type}</Badge>
                        </div>
                        <code className="text-xs text-cyan-300/70 block mt-2 break-all">{row.content_key}</code>
                        <div className="text-xs text-slate-600 mt-2 break-all">{row.source_path}</div>
                      </div>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="rebuilt" className="mt-0">
                <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-2 font-medium text-emerald-200"><Box className="w-4 h-4" />Atom XE rebuilt output</div>
                  <p className="text-xs text-slate-500 mt-2">
                    Files generated by the reconstruction belong here. These are separate from Raven's originals and can be edited/versioned freely.
                  </p>
                </div>
                <FileRows rows={rebuiltFiles} search={search} onSelect={setSelectedFile} />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {selectedFile && (
          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center gap-3">
              <button onClick={() => setSelectedFile(null)} className="text-slate-500 hover:text-white">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <div className="font-medium truncate">{selectedFile.display_name || selectedFile.path}</div>
                <div className="text-xs text-slate-500 truncate">{selectedFile.path}</div>
              </div>
            </div>
            {selectedFile.content ? (
              <pre className="p-5 max-h-[680px] overflow-auto text-xs leading-5 text-slate-300 bg-black/30 whitespace-pre font-mono">
                {selectedFile.content}
              </pre>
            ) : (
              <div className="p-6 text-sm text-slate-500">
                Binary or externally stored file. {selectedFile.storage_url ? 'The file bytes are stored in Base44.' : 'The canonical source record is catalogued.'}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
