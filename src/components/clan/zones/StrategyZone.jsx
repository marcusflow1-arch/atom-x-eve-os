import React, { useState } from 'react';
import { Brain, Plus, ChevronLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ZoneChatPanel from '@/components/clan/shared/ZoneChatPanel';
import StrategyUpload from '@/components/clan/strategy/StrategyUpload';
import StrategyCard from '@/components/clan/strategy/StrategyCard';
import { useAuth } from '@/components/auth/AuthContext';

export default function StrategyZone({ game, clan }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [mode, setMode] = useState('list'); // 'list' | 'create' | 'detail'
    const [selectedStrategy, setSelectedStrategy] = useState(null);

    const isLeaderOrOfficer = clan?.leaderId === user?.id || user?.role === 'admin';

    const { data: strategies = [], isLoading } = useQuery({
        queryKey: ['strategies', game?.id, clan?.id],
        queryFn: async () => {
            if (!game?.id || !clan?.id) return [];
            const res = await base44.entities.Strategy.filter(
                { game_id: game.id, clan_id: clan.id },
                '-created_date',
                100
            );
            return res?.data || res || [];
        },
        enabled: !!game?.id && !!clan?.id,
    });

    const handleCreated = () => {
        setMode('list');
        queryClient.invalidateQueries({ queryKey: ['strategies', game?.id, clan?.id] });
    };

    return (
        <div className="h-full flex">
            {/* Strategy Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {mode !== 'list' && (
                            <Button size="sm" variant="ghost" onClick={() => { setMode('list'); setSelectedStrategy(null); }} className="text-white/50 hover:text-white gap-1">
                                <ChevronLeft className="w-4 h-4" /> Back
                            </Button>
                        )}
                        <Brain className="w-5 h-5 text-purple-400" />
                        <h3 className="font-bold text-white">
                            {mode === 'create' ? 'Create Strategy' : mode === 'detail' ? selectedStrategy?.title : 'Strategy Board'}
                        </h3>
                        <Badge variant="outline" className="text-white/40 border-white/10">{strategies.length} strategies</Badge>
                    </div>
                    {mode === 'list' && (
                        <Button size="sm" variant="outline" onClick={() => setMode('create')} className="gap-2 border-white/10 text-white/70 hover:text-white">
                            <Plus className="w-4 h-4" /> New Strategy
                        </Button>
                    )}
                </div>

                {/* Content */}
                <ScrollArea className="flex-1">
                    <div className="p-6">
                        {mode === 'create' && (
                            <StrategyUpload
                                clanId={clan.id}
                                gameId={game.id}
                                canSetVisibility={isLeaderOrOfficer}
                                onCreated={handleCreated}
                            />
                        )}

                        {mode === 'detail' && selectedStrategy && (
                            <div className="max-w-3xl space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">{selectedStrategy.title}</h2>
                                    {selectedStrategy.summary && (
                                        <p className="text-white/60 text-sm">{selectedStrategy.summary}</p>
                                    )}
                                    <div className="flex gap-2 mt-3">
                                        <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">Strategy</Badge>
                                        <Badge className="bg-white/10 text-white/60">{(selectedStrategy.visibility || 'clan').toUpperCase()}</Badge>
                                    </div>
                                    {selectedStrategy.created_date && (
                                        <p className="text-[10px] text-white/30 mt-2">
                                            Posted {new Date(selectedStrategy.created_date).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>

                                {/* Steps */}
                                {selectedStrategy.steps?.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-3">Steps</h4>
                                        <ol className="space-y-3">
                                            {selectedStrategy.steps.map((step, i) => (
                                                <li key={i} className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                                        {i + 1}
                                                    </span>
                                                    <span className="text-sm text-white/80">{step}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                )}

                                {/* Media */}
                                {selectedStrategy.media_urls?.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-3">Media</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            {selectedStrategy.media_urls.map((url, i) => {
                                                const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
                                                return isVideo ? (
                                                    <video key={i} src={url} controls className="w-full rounded-xl border border-white/10" />
                                                ) : (
                                                    <img key={i} src={url} alt="" className="w-full rounded-xl border border-white/10 object-cover aspect-video" />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Audio tips */}
                                {selectedStrategy.voice_urls?.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-3">Audio Tips</h4>
                                        <div className="space-y-2">
                                            {selectedStrategy.voice_urls.map((url, i) => (
                                                <audio key={i} src={url} controls className="w-full" />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {mode === 'list' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {isLoading && <div className="col-span-full text-center text-white/40 py-12">Loading strategies...</div>}
                                {!isLoading && strategies.map((s) => (
                                    <div key={s.id} onClick={() => { setSelectedStrategy(s); setMode('detail'); }} className="cursor-pointer">
                                        <StrategyCard s={s} />
                                    </div>
                                ))}
                                {!isLoading && strategies.length === 0 && (
                                    <div className="col-span-full text-center text-white/30 py-12 border border-dashed border-white/10 rounded-2xl">
                                        <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p className="font-medium">No strategies yet</p>
                                        <p className="text-xs mt-1 text-white/20">Click "New Strategy" to publish the first guide</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Zone Chat Sidebar */}
            <div className="w-80 flex-shrink-0 border-l border-white/5">
                <ZoneChatPanel 
                    clanId={clan?.id} 
                    gameId={game?.id} 
                    zoneId="strategy" 
                    title="Command Comms" 
                    className="bg-black/20"
                />
            </div>
        </div>
    );
}