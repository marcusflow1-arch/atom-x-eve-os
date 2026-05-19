// ─── MapBuilderLibrary ────────────────────────────────────────────────
// Side panel listing draggable 3D assets the user can place in the
// MapBuilder viewport. Three sources are merged:
//   • Built-in environment assets (trees, rocks, altar, water…)
//   • User-uploaded Model3D entities  → drag key "model3d:<id>"
//   • User-uploaded ModelFBX entities → drag key "modelfbx:<id>"
//
// Drag payload format: `${type}|${id_or_key}|${name}` so the viewport
// knows what to load without re-querying the entity.

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { SANDBOX_ASSETS } from '@/components/admin/sandbox/sandboxAssetCatalog';
import { Box, Package, Trees, Search } from 'lucide-react';

export default function MapBuilderLibrary() {
  const [tab, setTab] = useState('uploads');
  const [search, setSearch] = useState('');

  const { data: model3Ds = [], isLoading: l3d } = useQuery({
    queryKey: ['mapbuilder-model3d'],
    queryFn: () => base44.entities.Model3D.list('-updated_date', 200),
    staleTime: 30_000,
  });
  const { data: modelFBXs = [], isLoading: lfbx } = useQuery({
    queryKey: ['mapbuilder-modelfbx'],
    queryFn: () => base44.entities.ModelFBX.list('-updated_date', 200),
    staleTime: 30_000,
  });

  const uploads = useMemo(() => {
    const m3d = model3Ds.filter((m) => m.file_url).map((m) => ({
      key: `model3d:${m.id}`,
      type: 'model3d',
      id: m.id,
      name: m.name || 'Untitled Model',
      icon: '📦',
      thumbnail: m.thumbnail_url,
      url: m.file_url,
      fileType: (m.file_type || '').toLowerCase(),
    }));
    const fbx = modelFBXs.filter((m) => m.file_url).map((m) => ({
      key: `modelfbx:${m.id}`,
      type: 'modelfbx',
      id: m.id,
      name: m.name || 'Untitled FBX',
      icon: '🎭',
      thumbnail: m.thumbnail_url,
      url: m.file_url,
      fileType: 'fbx',
    }));
    return [...m3d, ...fbx];
  }, [model3Ds, modelFBXs]);

  const builtins = useMemo(
    () => SANDBOX_ASSETS.map((a) => ({
      key: a.key,
      type: 'builtin',
      id: a.key,
      name: a.name,
      icon: a.icon,
      thumbnail: null,
    })),
    [],
  );

  const list = tab === 'uploads' ? uploads : builtins;
  const filtered = search
    ? list.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
    : list;

  const onDragStart = (e, asset) => {
    const payload = `${asset.type}|${asset.id}|${asset.name}`;
    e.dataTransfer.setData('application/x-mapbuilder-asset', payload);
    e.dataTransfer.setData('text/plain', payload);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/80 backdrop-blur-md border-r border-slate-800">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <Box className="w-5 h-5 text-cyan-400" />
          Asset Library
        </h2>
        <p className="text-slate-400 text-xs mt-1">Drag onto the map to place</p>
      </div>

      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setTab('uploads')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            tab === 'uploads' ? 'text-cyan-300 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4 inline mr-1" />
          My Uploads
          <span className="ml-1 text-xs text-slate-500">({uploads.length})</span>
        </button>
        <button
          onClick={() => setTab('builtins')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            tab === 'builtins' ? 'text-cyan-300 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trees className="w-4 h-4 inline mr-1" />
          Nature
        </button>
      </div>

      <div className="px-3 py-2 border-b border-slate-800">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {(l3d || lfbx) && tab === 'uploads' && (
          <p className="text-slate-500 text-xs italic">Loading your uploads…</p>
        )}
        {filtered.length === 0 && !(l3d || lfbx) && (
          <p className="text-slate-500 text-xs italic">
            {tab === 'uploads'
              ? 'No uploads yet. Add models in Admin → 3D Models or FBX Models.'
              : 'No assets match.'}
          </p>
        )}
        {filtered.map((asset) => (
          <div
            key={asset.key}
            draggable
            onDragStart={(e) => onDragStart(e, asset)}
            className="flex items-center gap-3 p-2 bg-slate-800/70 border border-slate-700 hover:border-cyan-500 rounded-lg cursor-grab active:cursor-grabbing transition-colors"
            title="Drag onto the map to place"
          >
            <div className="w-12 h-12 flex items-center justify-center bg-slate-900 rounded-md text-2xl overflow-hidden flex-shrink-0">
              {asset.thumbnail ? (
                <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" />
              ) : (
                asset.icon
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate font-medium">{asset.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">
                {asset.type === 'builtin' ? 'Built-in' : asset.fileType?.toUpperCase() || asset.type}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}