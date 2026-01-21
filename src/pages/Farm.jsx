import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wheat, Map, Target, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Farm() {
    const location = useLocation();
    const navigate = useNavigate();
    const query = new URLSearchParams(location.search);
    const gameId = query.get('gameId');
    
    // Context from navigation (Clan Workspace)
    const { from, clanId, activeZone } = location.state || {};

    const { data: game } = useQuery({
        queryKey: ['game', gameId],
        queryFn: () => base44.entities.Game.get(gameId),
        enabled: !!gameId
    });

    const { data: clan } = useQuery({
        queryKey: ['clan', clanId],
        queryFn: () => base44.entities.Division.get(clanId),
        enabled: !!clanId
    });

    const handleBack = () => {
        if (from === 'clan' && clanId) {
            navigate('/clan', { 
                state: { 
                    restoreGameId: gameId, 
                    restoreClanId: clanId,
                    restoreZone: activeZone 
                } 
            });
        } else {
            navigate('/library');
        }
    };

    if (!game) return <div className="h-screen flex items-center justify-center text-white/50">Loading Farm Data...</div>;

    return (
        <div className="min-h-screen bg-[#0a0c10] text-white flex flex-col">
            {/* Header */}
            <div className="h-20 border-b border-white/10 flex items-center px-8 bg-black/40 backdrop-blur-md sticky top-0 z-50">
                {clan && (
                    <Button 
                        variant="ghost" 
                        onClick={handleBack}
                        className="mr-4 text-white/60 hover:text-white gap-2 pl-0 hover:bg-transparent"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <div className="flex flex-col items-start">
                            <span className="text-xs uppercase font-bold tracking-wider">Back to Workspace</span>
                            <span className="text-sm font-bold text-cyan-400">{clan.name}</span>
                        </div>
                    </Button>
                )}
                
                <div className="h-10 w-px bg-white/10 mx-4" />

                <div className="flex items-center gap-4">
                    <img src={game.cover_image} className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            {game.title} <span className="text-white/30 font-light">|</span> Public Farm Database
                        </h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Featured Route */}
                    <div className="md:col-span-2 relative h-64 rounded-2xl overflow-hidden border border-white/10 group cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/80 to-black/50 z-10" />
                        <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end">
                            <Badge className="w-fit bg-amber-500/20 text-amber-300 border-amber-500/30 mb-2">🔥 Trending Route</Badge>
                            <h2 className="text-3xl font-bold text-white mb-1">Iron Vein Loop (Safe)</h2>
                            <p className="text-white/60">Optimized for low-level players. 500 Iron/hr.</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">Global Drops</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="flex items-center gap-2"><Target className="w-4 h-4 text-red-400" /> Rare Swords</span>
                                <span className="font-mono text-xl">0.04%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="flex items-center gap-2"><Wheat className="w-4 h-4 text-green-400" /> Ancient Herbs</span>
                                <span className="font-mono text-xl">12%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="flex items-center gap-2"><Map className="w-4 h-4 text-blue-400" /> Secret Areas</span>
                                <span className="font-mono text-xl">5/12</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <h3 className="text-lg font-bold mb-4">Community Routes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1,2,3,4,5,6].map(i => (
                            <div key={i} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-4 transition-all cursor-pointer">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold">Route #{i}49</h4>
                                    <Badge variant="outline" className="text-xs">Resource</Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-white/40 mb-4">
                                    <span>By Farmer{i}</span>
                                    <span>•</span>
                                    <span>Updated 2h ago</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="secondary" className="w-full h-8 text-xs">View Map</Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8"><Share2 className="w-3 h-3" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}