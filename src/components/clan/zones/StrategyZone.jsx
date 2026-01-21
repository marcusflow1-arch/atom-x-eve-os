import React from 'react';
import { Brain, Swords, Shield, Scroll } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import ZoneChatPanel from '@/components/clan/shared/ZoneChatPanel';

export default function StrategyZone({ game, clan }) {
    const plans = [
        { id: 1, title: 'Boss Phase 2 Tactics', author: 'RaidLead', status: 'Approved', type: 'Guide' },
        { id: 2, title: 'PvP Siege Defense', author: 'Warlord', status: 'Draft', type: 'Plan' },
    ];

    return (
        <div className="h-full flex">
            {/* Strategy Content Container */}
            <div className="flex-1 flex gap-6 p-6 min-w-0">
                {/* Plans List Sidebar */}
                <div className="w-72 flex-shrink-0 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white/70 uppercase text-xs tracking-wider">Tactical Plans</h3>
                        <Badge variant="outline" className="cursor-pointer hover:bg-white/10">+ New</Badge>
                    </div>
                    <ScrollArea className="flex-1 -mr-2 pr-2">
                        <div className="space-y-2">
                            {plans.map(plan => (
                                <div key={plan.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 cursor-pointer transition-all group">
                                    <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{plan.title}</h4>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs text-white/40">{plan.author}</span>
                                        <Badge className={plan.status === 'Approved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                                            {plan.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                {/* Active Plan / Whiteboard */}
                <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl overflow-hidden flex flex-col min-w-0">
                    <div className="h-12 border-b border-white/10 flex items-center px-4 bg-white/5 gap-4">
                        <span className="font-bold text-white/60 truncate">Boss Phase 2 Tactics</span>
                        <div className="h-4 w-px bg-white/10" />
                        <div className="flex gap-2">
                            <Badge variant="outline" className="bg-transparent border-white/10 text-white/40"><Brain className="w-3 h-3 mr-1" /> Strategy</Badge>
                        </div>
                    </div>
                    <div className="flex-1 p-8 text-white/70 overflow-y-auto">
                        <div className="prose prose-invert max-w-none">
                            <h2 className="text-xl font-bold text-white mb-4">Phase 2: Transition & Positioning</h2>
                            <p className="mb-4">
                                At 50% HP, the boss will transition to the center. Tanks must rotate clockwise.
                                Healers stay in the outer ring. DPS focus on the adds immediately.
                            </p>
                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4">
                                <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2"><Shield className="w-4 h-4" /> Tank Note</h4>
                                <p className="text-sm">Save defensive cooldowns for the "Void Blast" attack that happens 10s after transition.</p>
                            </div>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Position A: Main Tank</li>
                                <li>Position B: Off Tank (Add pickup)</li>
                                <li>Position C: Ranged DPS Camp</li>
                            </ul>
                        </div>
                    </div>
                </div>
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