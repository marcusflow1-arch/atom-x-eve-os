// ─── Sandbox Editor Panel ─────────────────────────────────────────────────
// Top-level layout that composes the asset library, viewport, toolbar,
// inspector, hierarchy, and scene manager into a single editor surface.

import React from 'react';
import SandboxAssetLibrary from './SandboxAssetLibrary';
import SandboxViewport from './SandboxViewport';
import SandboxToolbar from './SandboxToolbar';
import SandboxInspector from './SandboxInspector';
import SandboxHierarchy from './SandboxHierarchy';
import SandboxSceneManager from './SandboxSceneManager';
import SandboxTerrainPanel from './SandboxTerrainPanel';

export default function SandboxEditorPanel() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Sandbox Editor</h2>
          <p className="text-sm text-slate-400">
            Build maps by dragging assets onto a flat plane. The active scene is loaded into the live game world.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3" style={{ minHeight: 'calc(100vh - 220px)' }}>
        {/* Left column — asset library */}
        <div className="col-span-12 lg:col-span-2 lg:max-h-[calc(100vh-220px)]">
          <SandboxAssetLibrary />
        </div>

        {/* Center — viewport + toolbar */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-3 min-h-[600px]">
          <SandboxToolbar />
          <div className="flex-1 min-h-[500px] h-[600px] relative">
            <SandboxViewport />
          </div>
        </div>

        {/* Right column — scenes + terrain + hierarchy + inspector */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-3 lg:max-h-[calc(100vh-220px)]">
          <SandboxSceneManager />
          <SandboxTerrainPanel />
          <div className="flex-1 min-h-[180px]">
            <SandboxHierarchy />
          </div>
          <SandboxInspector />
        </div>
      </div>
    </div>
  );
}