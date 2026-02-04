import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertTriangle, Trash2, Database, Code, Layout as LayoutIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function CleanSlateTool() {
  const queryClient = useQueryClient();
  const [cleaning, setCleaning] = useState(false);

  // Fetch assets
  const { data: scripts = [] } = useQuery({
    queryKey: ['allScripts'],
    queryFn: () => base44.entities.Model3DScript.list()
  });

  const { data: layouts = [] } = useQuery({
    queryKey: ['allLayouts'],
    queryFn: () => base44.entities.SceneLayout.list()
  });

  // Hard delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }) => {
      const entity = type === 'script' ? base44.entities.Model3DScript : base44.entities.SceneLayout;
      return entity.delete(id);
    },
    onSuccess: () => queryClient.invalidateQueries()
  });

  const auditAsset = (content) => {
    try {
      const text = (content || '').toString().toLowerCase();
      const legacyTerms = ['var ', 'oldui', 'legacy-v1', 'temp-build'];
      return legacyTerms.some((t) => text.includes(t)) ? 'legacy' : 'modern';
    } catch {
      return 'modern';
    }
  };

  const allAssets = useMemo(() => [
    ...scripts.map((s) => ({ ...s, type: 'script' })),
    ...layouts.map((l) => ({ ...l, type: 'layout' }))
  ], [scripts, layouts]);

  const totalAssets = allAssets.length;
  const legacyAssets = allAssets.filter((a) => auditAsset(a.script_code || JSON.stringify(a.objects)) === 'legacy');
  const legacyCount = legacyAssets.length;
  const health = totalAssets > 0 ? Math.round(((totalAssets - legacyCount) / totalAssets) * 100) : 100;

  const handleAutoPurge = async () => {
    if (legacyAssets.length === 0) return;
    const confirmed = window.confirm(`This will permanently delete ${legacyAssets.length} legacy record(s). Continue?`);
    if (!confirmed) return;

    setCleaning(true);
    try {
      await Promise.all(
        legacyAssets.map((asset) => deleteMutation.mutateAsync({ type: asset.type, id: asset.id }))
      );
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-800/50 p-6 rounded-3xl border border-white/5 shadow-2xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <RefreshCw className={`w-7 h-7 md:w-8 md:h-8 text-cyan-400 ${cleaning ? 'animate-spin' : ''}`} />
            System Purge: Clean Slate
          </h1>
          <p className="text-slate-400 mt-1">Removing technical debt from Atom X Eve</p>
        </div>
        <div className="text-right">
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 mb-2">
            Status: System Audit Active
          </Badge>
          <div className="text-xs text-slate-500 uppercase font-bold tracking-widest">Admin Tools</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/40 p-6 rounded-2xl border border-white/5">
          <div className="flex justify-between items-end mb-4">
            <Database className="text-blue-400 w-10 h-10" />
            <span className="text-2xl font-black">{totalAssets}</span>
          </div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Total Assets</h3>
        </div>

        <div className="bg-slate-800/40 p-6 rounded-2xl border border-orange-500/20">
          <div className="flex justify-between items-end mb-4">
            <AlertTriangle className="text-orange-400 w-10 h-10" />
            <span className="text-2xl font-black text-orange-400">{legacyCount}</span>
          </div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Detected Legacy Bloat</h3>
        </div>

        <div className="bg-slate-800/40 p-6 rounded-2xl border border-emerald-500/20">
          <div className="flex justify-between items-end mb-4">
            <ShieldCheck className="text-emerald-400 w-10 h-10" />
            <span className="text-2xl font-black text-emerald-400">{health}%</span>
          </div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Code Health Score</h3>
        </div>
      </div>

      {/* Asset Explorer */}
      <div className="bg-slate-800/50 rounded-3xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between">
          <h2 className="font-bold flex items-center gap-2">
            <LayoutIcon className="w-4 h-4" /> Active Asset Index
          </h2>
          <Button size="sm" variant="destructive" onClick={handleAutoPurge} disabled={cleaning || legacyCount === 0}>
            {cleaning ? 'Purging…' : 'Execute Auto-Purge'}
          </Button>
        </div>

        <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
          {allAssets.map((asset) => {
            const status = auditAsset(asset.script_code || JSON.stringify(asset.objects));
            return (
              <div key={asset.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  {asset.type === 'script' ? <Code className="text-blue-400" /> : <LayoutIcon className="text-purple-400" />}
                  <div>
                    <h4 className="font-semibold">{asset.name || (asset.type === 'layout' ? 'Scene Layout' : 'Script')}</h4>
                    <p className="text-[10px] text-slate-500 font-mono">{asset.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {status === 'legacy' ? (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/20 animate-pulse">LEGACY DETECTED</Badge>
                  ) : (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20">VERIFIED MODERN</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-500 hover:text-red-400"
                    onClick={() => deleteMutation.mutate({ type: asset.type, id: asset.id })}
                    title="Hard delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}