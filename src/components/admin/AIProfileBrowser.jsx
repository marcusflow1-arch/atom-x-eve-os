import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trash2, Copy, Download, Bot, Swords, Shield, Move, Eye, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { showSuccess, showError } from '@/components/error/ErrorToast';

const BEHAVIOR_ICONS = {
  passive_wander: Move,
  aggressive: Swords,
  defensive: Shield,
  follower: Eye,
  patrol_route: Target,
  idle_loop: Bot,
};

const ROLE_COLORS = {
  player: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  enemy: 'bg-red-500/20 text-red-300 border-red-500/30',
  neutral: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  companion: 'bg-green-500/20 text-green-300 border-green-500/30',
};

export default function AIProfileBrowser({ onLoadProfile, onDuplicate }) {
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['ai-behavior-profiles'],
    queryFn: () => base44.entities.AIBehaviorProfile.list('-created_date'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AIBehaviorProfile.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-behavior-profiles'] });
      showSuccess('Profile deleted');
    },
    onError: (e) => showError(e, 'Delete Profile'),
  });

  if (isLoading) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">Loading saved profiles...</div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-slate-700 rounded-xl">
        <Bot className="w-10 h-10 mx-auto mb-2 text-slate-600" />
        <p className="text-slate-500 text-sm">No saved behavior profiles yet</p>
        <p className="text-slate-600 text-xs mt-1">Configure a model above and click "Save as Profile" to create one</p>
      </div>
    );
  }

  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">
        Saved Behavior Profiles ({profiles.length})
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {profiles.map((profile) => {
          const BIcon = BEHAVIOR_ICONS[profile.ai_profile?.behavior_type] || Bot;
          return (
            <div
              key={profile.id}
              className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 hover:border-purple-500/40 transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BIcon className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-semibold text-sm truncate">{profile.name}</span>
                </div>
                <Badge className={`text-[10px] ${ROLE_COLORS[profile.role] || ROLE_COLORS.neutral}`}>
                  {profile.role}
                </Badge>
              </div>

              {profile.description && (
                <p className="text-slate-400 text-xs mb-2 line-clamp-2">{profile.description}</p>
              )}

              <div className="flex items-center gap-2 mb-3 text-[10px] text-slate-500">
                <span>Model: {profile.source_model_name || '—'}</span>
                {profile.spawn_key && <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-purple-300 font-mono">{profile.spawn_key}</kbd>}
              </div>

              <div className="flex items-center gap-1 mb-3 flex-wrap">
                <Badge variant="outline" className="text-[10px]">HP: {profile.stats?.hp || 100}</Badge>
                <Badge variant="outline" className="text-[10px]">ATK: {profile.stats?.attack || 10}</Badge>
                <Badge variant="outline" className="text-[10px]">DEF: {profile.stats?.defense || 5}</Badge>
                <Badge variant="outline" className="text-[10px]">{profile.ai_profile?.behavior_type}</Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => onLoadProfile(profile)}
                >
                  <Download className="w-3 h-3 mr-1" /> Load
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => onDuplicate(profile)}
                >
                  <Copy className="w-3 h-3 mr-1" /> Duplicate
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8"
                  onClick={() => {
                    if (window.confirm(`Delete profile "${profile.name}"?`)) {
                      deleteMutation.mutate(profile.id);
                    }
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}