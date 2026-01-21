import React from 'react';
import { Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import ZoneChatPanel from '@/components/clan/shared/ZoneChatPanel';

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export default function FarmingZone({ game, clan }) {
    const navigate = useNavigate();

    const goToPublicFarm = () => {
        navigate(`/farm?gameId=${game.id}`, { 
            state: { 
                from: 'clan', 
                clanId: clan.id 
            } 
        });
    };

    // Mock farming data
    const farmRoutes = [
        { id: 1, title: 'Iron Route A', description: 'Best loop for iron ore. 500/hr.', author: 'Miner49er', type: 'Resource' },
        { id: 2, title: 'Rare Drop: Excalibur', description: 'Boss rotation for sword drop chance.', author: 'KingArthur', type: 'Boss' },
        { id: 3, title: 'XP Grind Spot', description: 'Elite mobs respawn every 2 mins.', author: 'GrindLord', type: 'XP' },
        { id: 4, title: 'Herb Gathering', description: 'Safe route for high tier herbs.', author: 'GreenThumb', type: 'Resource' },
    ];

    return (
        <div className="h-full flex">
            {/* Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="px-8 pt-6 pb-2 flex justify-between items-center">
                    <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider">Clan Resources</h3>
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30 gap-2 text-xs"
                        onClick={goToPublicFarm}
                    >
                        <ExternalLink className="w-3 h-3" />
                        Go to Public Farm Page
                    </Button>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-8 pt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {farmRoutes.map((item) => (
                            <div key={item.id} className="aspect-video bg-black/40 border border-white/10 rounded-2xl flex flex-col items-center justify-center hover:border-amber-500/50 hover:bg-amber-500/5 transition-all cursor-pointer group p-6 text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Target className="w-10 h-10 text-white/20 group-hover:text-amber-400 mb-3 transition-colors relative z-10" />
                                <span className="font-bold text-white/80 text-lg relative z-10">{item.title}</span>
                                <p className="text-xs text-white/50 mt-1 mb-3 relative z-10">{item.description}</p>
                                <div className="flex gap-2 relative z-10">
                                    <Badge variant="outline" className="border-white/10 text-white/40">{item.type}</Badge>
                                    <Badge variant="outline" className="border-white/10 text-white/40">By {item.author}</Badge>
                                </div>
                            </div>
                        ))}
                        
                        <div className="aspect-video border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center hover:border-white/30 hover:bg-white/5 transition-all cursor-pointer text-white/30 hover:text-white">
                            <span className="text-4xl mb-2">+</span>
                            <span className="font-medium">Add Farm Route</span>
                        </div>
                    </div>
                </ScrollArea>
            </div>

            {/* Zone Chat Sidebar */}
            <div className="w-80 flex-shrink-0 border-l border-white/5">
                <ZoneChatPanel 
                    clanId={clan?.id} 
                    gameId={game?.id} 
                    zoneId="farming" 
                    title="Farming Comms" 
                    className="bg-black/20"
                />
            </div>
        </div>
    );
}