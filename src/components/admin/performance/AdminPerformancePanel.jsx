// ─── AdminPerformancePanel ────────────────────────────────────────────────
// Admin-facing UI for the Base24 performance system.
//
// Surfaces:
//   • Detected hardware (GPU, VRAM, RAM, threads, WebGL/WebGPU, hw-accel)
//   • High Performance Mode toggle
//   • Graphics preset selector (Low / Medium / High / Ultra / Adaptive)
//   • Live FPS + frame time + adaptive preset readout
//   • Debug toggles (FPS overlay, colliders, chunks, VRAM)
//
// All controls write to `usePerformanceStore`, which publishes to
// `window.__perfSettings` for the rest of the engine to consume.

import React, { useEffect, useState } from 'react';
import { Cpu, MonitorSmartphone, Gauge, Zap, Database, Eye, Layers } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { detectHardwareProfile } from './hardwareProfile';
import { usePerformanceStore, PRESETS } from './performanceStore';
import FPSMonitor from './FPSMonitor';

const PRESET_OPTIONS = [
  { key: 'low',      label: 'Low' },
  { key: 'medium',   label: 'Medium' },
  { key: 'high',     label: 'High' },
  { key: 'ultra',    label: 'Ultra' },
  { key: 'adaptive', label: 'Adaptive Auto' },
];

function StatRow({ icon: Icon, label, value, hint }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs uppercase tracking-wider text-slate-400">{label}</div>
        <div className="text-sm text-white truncate">{value}</div>
        {hint && <div className="text-xs text-slate-500 mt-0.5">{hint}</div>}
      </div>
    </div>
  );
}

export default function AdminPerformancePanel() {
  const [hw, setHw] = useState(null);

  const preset         = usePerformanceStore((s) => s.preset);
  const adaptivePreset = usePerformanceStore((s) => s.adaptivePreset);
  const highPerfMode   = usePerformanceStore((s) => s.highPerfMode);
  const debug          = usePerformanceStore((s) => s.debug);
  const fps            = usePerformanceStore((s) => s.fps);
  const frameTimeMs    = usePerformanceStore((s) => s.frameTimeMs);
  const setPreset      = usePerformanceStore((s) => s.setPreset);
  const setHighPerf    = usePerformanceStore((s) => s.setHighPerfMode);
  const setDebug       = usePerformanceStore((s) => s.setDebug);

  useEffect(() => {
    setHw(detectHardwareProfile());
  }, []);

  const effectiveKey = preset === 'adaptive' ? adaptivePreset : preset;
  const effective = PRESETS[effectiveKey] || PRESETS.medium;

  return (
    <div className="space-y-6">
      <FPSMonitor />

      {/* Header */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-6 h-6 text-yellow-400" />
          <h2 className="text-2xl font-bold">Performance System</h2>
        </div>
        <p className="text-slate-400 text-sm">
          Detects your hardware and tunes Base24's renderer, terrain streaming, and world simulation
          to fully utilize your GPU, VRAM, RAM, and CPU threads.
        </p>
      </div>

      {/* Hardware Detection */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <MonitorSmartphone className="w-5 h-5 text-blue-400" />
          Detected Hardware
        </h3>
        {!hw ? (
          <div className="text-slate-500 text-sm">Detecting…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <StatRow icon={MonitorSmartphone} label="GPU" value={hw.gpu} hint={hw.gpuVendor} />
            <StatRow icon={Database} label="VRAM (estimated)" value={`${hw.vramMB} MB`} />
            <StatRow icon={Database} label="System RAM" value={hw.ramGB ? `${hw.ramGB} GB` : 'Unknown'} />
            <StatRow icon={Cpu} label="CPU Threads" value={hw.threads || 'Unknown'} />
            <StatRow
              icon={Zap}
              label="Hardware Acceleration"
              value={hw.hwAccel ? 'Enabled' : 'Disabled (software rendering)'}
              hint={!hw.hwAccel ? 'Enable hardware acceleration in your browser settings for best results.' : undefined}
            />
            <StatRow
              icon={Layers}
              label="Graphics API"
              value={`${hw.webgl2 ? 'WebGL2' : 'WebGL1'}${hw.webgpu ? ' + WebGPU' : ''}`}
              hint={`Max texture: ${hw.maxTextureSize}`}
            />
          </div>
        )}
        {hw && (
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="outline" className="text-cyan-300 border-cyan-500/40">
              Suggested preset: {hw.suggestedPreset.toUpperCase()}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPreset(hw.suggestedPreset)}
            >
              Apply Suggested
            </Button>
          </div>
        )}
      </div>

      {/* Live Telemetry */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Gauge className="w-5 h-5 text-green-400" />
          Live Performance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="text-xs text-slate-400 uppercase">FPS</div>
            <div className={`text-3xl font-black ${fps >= 55 ? 'text-green-400' : fps >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
              {fps}
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="text-xs text-slate-400 uppercase">Frame Time</div>
            <div className="text-3xl font-black text-white">{frameTimeMs.toFixed(1)}<span className="text-sm text-slate-400 ml-1">ms</span></div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="text-xs text-slate-400 uppercase">Active Preset</div>
            <div className="text-xl font-bold text-cyan-300 uppercase">{effectiveKey}</div>
            {preset === 'adaptive' && (
              <div className="text-[10px] text-slate-500 mt-1">auto-tuned</div>
            )}
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="text-xs text-slate-400 uppercase">Render Distance</div>
            <div className="text-xl font-bold text-white">{effective.renderDistance}m</div>
          </div>
        </div>
      </div>

      {/* High Performance Mode */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <div className="font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            High Performance Mode
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Prioritize GPU acceleration, instancing, and async terrain streaming for large MMO worlds.
          </p>
        </div>
        <Switch checked={highPerfMode} onCheckedChange={setHighPerf} />
      </div>

      {/* Preset Selector */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Graphics Preset</h3>
        <div className="flex flex-wrap gap-2">
          {PRESET_OPTIONS.map((opt) => (
            <Button
              key={opt.key}
              size="sm"
              variant={preset === opt.key ? 'default' : 'outline'}
              onClick={() => setPreset(opt.key)}
              className={preset === opt.key ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {/* Effective values readout */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div><span className="text-slate-400">Foliage Density:</span> <span className="text-white">{(effective.foliageDensity * 100).toFixed(0)}%</span></div>
          <div><span className="text-slate-400">Tree Density:</span> <span className="text-white">{(effective.treeDensity * 100).toFixed(0)}%</span></div>
          <div><span className="text-slate-400">Shadows:</span> <span className="text-white capitalize">{effective.shadowQuality}</span></div>
          <div><span className="text-slate-400">Texture Scale:</span> <span className="text-white">{(effective.textureScale * 100).toFixed(0)}%</span></div>
          <div><span className="text-slate-400">Particles:</span> <span className="text-white">{(effective.particleScale * 100).toFixed(0)}%</span></div>
          <div><span className="text-slate-400">LOD Bias:</span> <span className="text-white">{effective.lodBias.toFixed(2)}×</span></div>
          <div><span className="text-slate-400">Chunk Size:</span> <span className="text-white">{effective.chunkSize}m</span></div>
        </div>
      </div>

      {/* Debug toggles */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-purple-400" />
          Debug Visualization
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'showFPS',       label: 'FPS Overlay' },
            { key: 'showColliders', label: 'Collision Meshes' },
            { key: 'showChunks',    label: 'Terrain Chunks' },
            { key: 'showVRAM',      label: 'VRAM / Asset Usage' },
          ].map((d) => (
            <div key={d.key} className="flex items-center justify-between bg-slate-800/40 rounded-lg px-4 py-3">
              <span className="text-sm text-white">{d.label}</span>
              <Switch checked={!!debug[d.key]} onCheckedChange={(v) => setDebug(d.key, v)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}