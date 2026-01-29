import React from 'react';
import { Map as MapIcon, Flag, Navigation, MapPin } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ZoneChatPanel from '@/components/clan/shared/ZoneChatPanel';
import ReconUpload from '@/components/clan/exploration/ReconUpload';
import ReconCard from '@/components/clan/exploration/ReconCard';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function ExplorationZone({ game, clan }) {
    const queryClient = useQueryClient();
    const clanId = clan?.id;
    const gameId = game?.id;
    const { data: intel = [], isLoading } = useQuery({
        queryKey: ['explorationIntel', clanId, gameId],
        queryFn: async () => {
            const res = await base44.entities.ExplorationIntel.filter({ clan_id: clanId, game_id: gameId }, '-created_date', 50);
            return res?.data || res || [];
        },
        enabled: !!clanId && !!gameId,
    });
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['explorationIntel', clanId, gameId] });
    return (
        <div className="h-full flex">
            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-white/50 min-w-0 overflow-y-auto">
                <div className="w-full max-w-4xl aspect-[16/9] bg-black/40 border border-white/10 rounded-2xl relative overflow-hidden flex items-center justify-center group">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
                    
                    {/* Mock Map UI */}
                    <div className="absolute inset-0 flex items-center justify-center">
                       <MapIcon className="w-24 h-24 text-white/10 group-hover:text-white/20 transition-colors" />
                    </div>
                    
                    <div className="relative z-10 bg-black/60 backdrop-blur-md p-6 rounded-xl border border-white/10 max-w-sm">
                        <h3 className="text-white font-bold text-xl mb-2 flex items-center justify-center gap-2">
                            <MapPin className="w-5 h-5 text-cyan-400" /> 
                            Interactive Map
                        </h3>
                        <p className="text-sm mb-4">
                            Clan intelligence map for {game.title}. Mark active zones, enemy movements, and resource nodes.
                        </p>
                        <button className="px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm font-medium">
                            Launch Map Interface
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 w-full max-w-4xl mt-6">
                    {['Waypoints', 'Intel Reports', 'Scouting'].map((label, i) => (
                        <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                {i === 0 ? <Navigation className="w-5 h-5" /> : i === 1 ? <Flag className="w-5 h-5" /> : <MapIcon className="w-5 h-5" />}
                            </div>
                            <div className="text-left">
                                <div className="text-white font-medium">{label}</div>
                                <div className="text-xs">0 Active</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recon Upload + List */}
                <div className="w-full max-w-4xl mt-8">
                    <ReconUpload clanId={clanId} gameId={gameId} onCreated={refresh} />

                    <div className="mt-6">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-white font-bold">Recent Recon</h4>
                            {isLoading && <span className="text-white/40 text-sm">Loading…</span>}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {intel.map((i) => (
                                <ReconCard key={i.id} intel={i} />
                            ))}
                            {intel.length === 0 && !isLoading && (
                                <div className="col-span-full text-center text-white/40 py-8 border border-white/10 rounded-xl">No recon uploaded yet.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Zone Chat */}
            <div className="w-80 flex-shrink-0 border-l border-white/5">
                <ZoneChatPanel 
                    clanId={clan?.id} 
                    gameId={game?.id} 
                    zoneId="exploration" 
                    title="Exploration Radio" 
                    className="bg-black/20"
                />
            </div>
        </div>
    );
}