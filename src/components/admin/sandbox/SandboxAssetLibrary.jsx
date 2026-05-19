// ─── Sandbox Asset Library ────────────────────────────────────────────────
// Lists available assets filtered by category. Each card is draggable —
// the viewport reads the asset key from `dataTransfer` on drop.
//
// Two asset sources are merged:
//   • Built-in SANDBOX_ASSETS (curated environment props)
//   • User-uploaded Model3D entities, keyed as `model3d:<id>`

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { SANDBOX_ASSETS, SANDBOX_CATEGORIES } from './sandboxAssetCatalog';
import { useSandboxStore } from './sandboxStore';

export default function SandboxAssetLibrary() {
  const [category, setCategory] = useState('all');
  const addPlacement = useSandboxStore((s) => s.addPlacement);

  // Pull all user-uploaded Model3D entries — every upload becomes a draggable asset.
  const { data: userModels = [] } = useQuery({
    queryKey: ['sandbox-user-models'],
    queryFn: () => base44.entities.Model3D.list('-updated_date', 200),
    staleTime: 30_000,
  });

  const userAssets = useMemo(
    () => userModels
      .filter((m) => m.file_url)
      .map((m) => ({
        key: `model3d:${m.id}`,
        name: m.name || 'Untitled Model',
        category: 'uploads',
        icon: '📦',
        defaultColliderRadius: 0.6,
        collides: true,
        thumbnail: m.thumbnail_url || null,
      })),
    [userModels],
  );

  const allAssets = useMemo(() => [...SANDBOX_ASSETS, ...userAssets], [userAssets]);
  const categories = useMemo(
    () => [...SANDBOX_CATEGORIES, { id: 'uploads', label: 'My Uploads' }],
    [],
  );

  const visible = category === 'all'
    ? allAssets
    : allAssets.filter((a) => a.category === category);

  const onDragStart = (e, assetKey) => {
    e.dataTransfer.setData('application/x-sandbox-asset', assetKey);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const quickAdd = (asset) => {
    addPlacement(asset.key, { meta: asset, x: 0, y: 0, z: 0 });
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-200">Asset Library</h3>
        <span className="text-xs text-slate-500">{visible.length}</span>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1 mb-3">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              category === c.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Asset cards */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {visible.map((asset) => (
          <div
            key={asset.key}
            draggable
            onDragStart={(e) => onDragStart(e, asset.key)}
            onDoubleClick={() => quickAdd(asset)}
            title="Drag into viewport, or double-click to drop at origin"
            className="flex items-center gap-3 p-2 bg-slate-800/70 border border-slate-700 hover:border-blue-500 rounded-lg cursor-grab active:cursor-grabbing transition-colors"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-slate-900 rounded-md text-2xl overflow-hidden">
              {asset.thumbnail ? (
                <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" />
              ) : (
                asset.icon
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-slate-200 truncate">{asset.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">{asset.category}</div>
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <p className="text-xs text-slate-500 italic">No assets in this category.</p>
        )}
      </div>

      <p className="mt-3 text-[11px] text-slate-500">
        Drag assets into the viewport, or double-click to drop at world origin. Upload more under the 3D Models tab.
      </p>
    </div>
  );
}