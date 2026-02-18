import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, Code2, Trash2, Play, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showSuccess } from '@/components/error/ErrorToast';

const TYPE_COLORS = {
  actor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  character: 'text-green-400 bg-green-500/10 border-green-500/20',
  game_mode: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  component: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  system: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  material: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  animation: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  ai_behavior: 'text-red-400 bg-red-500/10 border-red-500/20',
  widget: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  custom: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
};

export default function BlueprintPanel() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState(null);

  const { data: blueprints = [], isLoading } = useQuery({
    queryKey: ['engine-blueprints'],
    queryFn: () => base44.entities.EngineBlueprint.list('-created_date', 50),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EngineBlueprint.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engine-blueprints'] });
      showSuccess('Blueprint deleted');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (bp) => base44.entities.EngineBlueprint.update(bp.id, { is_active: !bp.is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['engine-blueprints'] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-white font-bold text-xs">BLUEPRINTS</span>
          <Badge variant="outline" className="text-purple-400 text-[8px] border-purple-500/30 ml-auto">{blueprints.length}</Badge>
        </div>
        <p className="text-slate-500 text-[9px] mt-1">Visual logic created by Engine AI. Similar to Unreal Engine Blueprints.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5" style={{ scrollbarWidth: 'thin' }}>
        {blueprints.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-30" />
            <p className="text-[10px]">No blueprints yet</p>
            <p className="text-[9px] mt-1 text-slate-600">Ask the Engine AI to create systems — it'll generate blueprints automatically</p>
          </div>
        ) : blueprints.map(bp => {
          const colors = TYPE_COLORS[bp.blueprint_type] || TYPE_COLORS.custom;
          const isExpanded = expandedId === bp.id;

          return (
            <div
              key={bp.id}
              className={`rounded-lg border p-2.5 transition-all cursor-pointer ${isExpanded ? 'border-purple-500/40 bg-purple-500/5' : 'border-slate-700/50 hover:border-slate-600'}`}
              onClick={() => setExpandedId(isExpanded ? null : bp.id)}
            >
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded flex items-center justify-center border ${colors}`}>
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white text-[11px] font-bold truncate">{bp.name}</span>
                    {bp.is_active && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </div>
                  <Badge className={`text-[7px] py-0 px-1 ${colors}`}>{bp.blueprint_type}</Badge>
                </div>
                <ChevronRight className={`w-3 h-3 text-white/30 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="mt-2 pt-2 border-t border-slate-700/50 space-y-2">
                      {bp.description && (
                        <p className="text-[10px] text-slate-400">{bp.description}</p>
                      )}

                      {bp.nodes?.length > 0 && (
                        <div className="text-[9px] text-slate-500">
                          {bp.nodes.length} node(s): {bp.nodes.map(n => n.name || n.type).join(' → ')}
                        </div>
                      )}

                      {bp.generated_code && (
                        <div>
                          <div className="flex items-center gap-1 text-[9px] text-cyan-400 mb-1">
                            <Code2 className="w-2.5 h-2.5" /> Generated Code
                          </div>
                          <pre className="text-[8px] text-slate-400 font-mono bg-black/30 rounded p-2 max-h-[100px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                            {bp.generated_code.substring(0, 500)}
                          </pre>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); toggleActiveMutation.mutate(bp); }} className="h-6 text-[9px]">
                          {bp.is_active ? <><EyeOff className="w-2.5 h-2.5 mr-1" />Deactivate</> : <><Play className="w-2.5 h-2.5 mr-1" />Activate</>}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(bp.id); }} className="h-6 text-[9px] text-red-400 hover:text-red-300">
                          <Trash2 className="w-2.5 h-2.5 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}