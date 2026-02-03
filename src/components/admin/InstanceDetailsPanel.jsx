import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, X } from 'lucide-react';

export default function InstanceDetailsPanel({ obj, scriptsCatalog = [], onChangeName, onChangeRole, onAddScript, onRemoveScript, onClose }) {
  if (!obj) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 relative">
      <Button size="icon" variant="ghost" className="absolute top-2 right-2 text-slate-400 hover:text-white hover:bg-white/10" onClick={() => onClose?.()}>
        <X className="w-4 h-4" />
      </Button>
      <h4 className="text-white font-semibold mb-3 pr-8">Character / Instance Details</h4>

      <div className="space-y-3">
        <div>
          <Label htmlFor="instance_name" className="text-slate-300">Instance Name</Label>
          <Input id="instance_name" value={obj.instance_name || ''} onChange={(e) => onChangeName?.(e.target.value)} className="bg-slate-800 border-slate-700 mt-1" />
        </div>

        <div>
          <Label className="text-slate-300">Role</Label>
          <Select value={obj.role || 'static'} onValueChange={(v) => onChangeRole?.(v)}>
            <SelectTrigger className="bg-slate-800 border-slate-700 mt-1">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="player">Player</SelectItem>
              <SelectItem value="npc">NPC</SelectItem>
              <SelectItem value="autonomous">Autonomous</SelectItem>
              <SelectItem value="static">Static</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-slate-300">Attached Scripts</Label>
            <div className="flex items-center gap-2">
              <Select onValueChange={(id) => onAddScript?.(id)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 h-8">
                  <SelectValue placeholder="Add script" />
                </SelectTrigger>
                <SelectContent>
                  {scriptsCatalog.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" className="hidden">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {(obj.scripts || []).length === 0 && (
              <p className="text-xs text-slate-500">No scripts attached</p>
            )}
            {(obj.scripts || []).map((binding, idx) => {
              const script = scriptsCatalog.find((s) => s.id === binding.script_id);
              return (
                <div key={idx} className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-md p-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className="text-[10px]">{script?.script_type || 'general'}</Badge>
                    <span className="text-sm text-white truncate">{script?.name || binding.script_id}</span>
                  </div>
                  <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => onRemoveScript?.(idx)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}