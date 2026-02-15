import React, { useState } from 'react';
import { Target, Video, ExternalLink, Plus, Tag, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import ZoneChatPanel from '@/components/clan/shared/ZoneChatPanel';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import CreateFarmRouteModal from '@/components/farm/CreateFarmRouteModal';

const DIFFICULTY_COLORS = {
  easy: 'text-green-400 border-green-500/30',
  medium: 'text-yellow-400 border-yellow-500/30',
  hard: 'text-orange-400 border-orange-500/30',
  extreme: 'text-red-400 border-red-500/30',
};

export default function FarmingZone({ game, clan }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const goToPublicFarm = () => {
    navigate(`/farm?gameId=${game.id}`, {
      state: { from: 'clan', clanId: clan.id, activeZone: 'farming' }
    });
  };

  const { data: farmRoutes = [], isLoading } = useQuery({
    queryKey: ['farmRoutes', game?.id, clan?.id],
    queryFn: async () => {
      if (!game?.id || !clan?.id) return [];
      try {
        const res = await base44.functions.invoke('getFarmRoutes', { gameId: game.id, clanId: clan.id });
        return res.data?.routes || [];
      } catch {
        // Fallback to direct entity query
        const routes = await base44.entities.FarmRoute.filter({ clan_id: clan.id });
        return routes || [];
      }
    },
    enabled: !!game?.id && !!clan?.id
  });

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-8 pt-6 pb-2 flex justify-between items-center">
          <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider">Clan Farm Routes</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-white/60 hover:text-white border-white/10 gap-2 text-xs" onClick={() => setShowCreate(true)}>
              <Plus className="w-3 h-3" /> Add Farm Route
            </Button>
            <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30 gap-2 text-xs" onClick={goToPublicFarm}>
              <ExternalLink className="w-3 h-3" /> Go to Public Farm Page
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-8 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading && <div className="col-span-full text-center text-white/40 py-12">Loading routes...</div>}
            {!isLoading && farmRoutes.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <div key={item.id} onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="bg-black/40 border border-white/10 rounded-2xl hover:border-amber-500/50 hover:bg-amber-500/5 transition-all cursor-pointer group p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-amber-400" />
                        <span className="font-bold text-white text-lg">{item.title}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-white/30 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                    <p className="text-xs text-white/50 mb-3">{item.description || 'No description'}</p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline" className="border-white/10 text-white/40">{item.route_type || item.type || 'Resource'}</Badge>
                      {item.difficulty && <Badge variant="outline" className={DIFFICULTY_COLORS[item.difficulty] || 'text-white/40 border-white/10'}>{item.difficulty}</Badge>}
                      <Badge variant="outline" className="border-white/10 text-white/40">By {item.author_name || item.authorName || 'Unknown'}</Badge>
                    </div>
                    {isExpanded && (
                      <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                        {item.video_url && (
                          <div className="flex items-center gap-2">
                            <Video className="w-4 h-4 text-blue-400" />
                            <a href={item.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:underline truncate" onClick={(e) => e.stopPropagation()}>
                              {item.video_url}
                            </a>
                          </div>
                        )}
                        {item.tactics && (
                          <div>
                            <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1">Tactics</p>
                            <p className="text-sm text-white/70 whitespace-pre-wrap">{item.tactics}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {!isLoading && farmRoutes.length === 0 && (
              <div className="col-span-full text-center text-white/30 py-12 border border-dashed border-white/10 rounded-2xl">
                <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No farm routes yet</p>
                <p className="text-xs mt-1 text-white/20">Click "Add Farm Route" to create the first one</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      <div className="w-80 flex-shrink-0 border-l border-white/5">
        <ZoneChatPanel clanId={clan?.id} gameId={game?.id} zoneId="farming" title="Farming Comms" className="bg-black/20" />
      </div>
      <CreateFarmRouteModal open={showCreate} onClose={() => setShowCreate(false)} gameId={game?.id} clanId={clan?.id} onCreated={() => queryClient.invalidateQueries({ queryKey: ['farmRoutes', game?.id, clan?.id] })} />
    </div>
  );
}