import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight, Bone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const COMMON_BONES = [
  { group: 'Head', bones: ['Head', 'Neck', 'Jaw'] },
  { group: 'Spine', bones: ['Hips', 'Spine', 'Spine1', 'Spine2', 'Chest'] },
  { group: 'Right Arm', bones: ['RightShoulder', 'RightArm', 'RightForeArm', 'RightHand'] },
  { group: 'Left Arm', bones: ['LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand'] },
  { group: 'Right Leg', bones: ['RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase'] },
  { group: 'Left Leg', bones: ['LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase'] },
  { group: 'Fingers R', bones: ['RightHandThumb1', 'RightHandIndex1', 'RightHandMiddle1', 'RightHandRing1', 'RightHandPinky1'] },
  { group: 'Fingers L', bones: ['LeftHandThumb1', 'LeftHandIndex1', 'LeftHandMiddle1', 'LeftHandRing1', 'LeftHandPinky1'] },
];

export default function ReactorBoneSelector({ selectedBone, onSelect, rigBones = [] }) {
  const [search, setSearch] = useState('');
  const [expandedGroup, setExpandedGroup] = useState(null);

  // Use rig bones from actual model if available, otherwise use common bones
  const boneGroups = rigBones.length > 0
    ? [{ group: 'Model Rig', bones: rigBones }]
    : COMMON_BONES;

  const filteredGroups = boneGroups.map(g => ({
    ...g,
    bones: g.bones.filter(b => !search || b.toLowerCase().includes(search.toLowerCase()))
  })).filter(g => g.bones.length > 0);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <Input
          placeholder="Search bones..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-slate-900/50 border-slate-700 pl-8 h-8 text-xs"
        />
      </div>

      <div className="max-h-[400px] overflow-y-auto space-y-1" style={{ scrollbarWidth: 'thin' }}>
        {filteredGroups.map(group => (
          <div key={group.group}>
            <button
              onClick={() => setExpandedGroup(expandedGroup === group.group ? null : group.group)}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              <span>{group.group}</span>
              <div className="flex items-center gap-1">
                <Badge className="bg-slate-800 text-slate-500 text-[8px]">{group.bones.length}</Badge>
                <ChevronRight className={`w-3 h-3 transition-transform ${expandedGroup === group.group ? 'rotate-90' : ''}`} />
              </div>
            </button>
            <AnimatePresence>
              {(expandedGroup === group.group || search) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden ml-2"
                >
                  {group.bones.map(bone => (
                    <button
                      key={bone}
                      onClick={() => onSelect(bone)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-all ${
                        selectedBone === bone
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/30 border border-transparent'
                      }`}
                    >
                      <Bone className="w-3 h-3 flex-shrink-0" />
                      {bone}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}