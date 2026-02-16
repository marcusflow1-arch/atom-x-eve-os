import React, { useMemo } from 'react';
import { Film, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ANIM_CATEGORIES = [
  { key: 'idle', label: 'Idle', color: 'text-blue-400' },
  { key: 'walk', label: 'Walk', color: 'text-green-400' },
  { key: 'run', label: 'Run', color: 'text-cyan-400' },
  { key: 'attack', label: 'Attack', color: 'text-red-400' },
  { key: 'hit', label: 'Hit Reaction', color: 'text-orange-400' },
  { key: 'death', label: 'Death', color: 'text-gray-400' },
  { key: 'block', label: 'Block', color: 'text-yellow-400' },
  { key: 'dodge', label: 'Dodge', color: 'text-purple-400' },
  { key: 'special', label: 'Special', color: 'text-pink-400' },
];

export default function AIAnimationAssigner({ assignedAnimations, allAnimations, onChange }) {
  const animMap = useMemo(() => {
    const map = {};
    allAnimations.forEach(a => { map[a.id] = a; });
    return map;
  }, [allAnimations]);

  const handleAssign = (category, animId) => {
    const updated = { ...assignedAnimations };
    if (animId === '') {
      delete updated[category];
    } else {
      updated[category] = animId;
    }
    onChange(updated);
  };

  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block flex items-center gap-2">
        <Film className="w-3 h-3" />
        AI Animation Assignment
      </label>
      <p className="text-slate-400 text-[11px] mb-4">
        Each animation assigned here will be preloaded, bound to the model skeleton, and registered for AI script triggering at runtime.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {ANIM_CATEGORIES.map(cat => {
          const assignedId = assignedAnimations[cat.key];
          const assignedAnim = assignedId ? animMap[assignedId] : null;

          return (
            <div key={cat.key} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <label className={`text-[10px] font-bold uppercase tracking-wider mb-2 block ${cat.color}`}>
                {cat.label}
              </label>
              <select
                value={assignedId || ''}
                onChange={(e) => handleAssign(cat.key, e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">— None —</option>
                {allAnimations.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.animation_type})</option>
                ))}
              </select>
              {assignedAnim && (
                <div className="mt-2 flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-green-400" />
                  <span className="text-green-300 text-[10px] truncate">{assignedAnim.name}</span>
                  <Badge className="text-[8px] bg-slate-700 text-slate-300 ml-auto">{assignedAnim.animation_type}</Badge>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}