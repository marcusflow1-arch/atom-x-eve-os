import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../auth/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Coins, Package, ArrowUpRight, Box } from 'lucide-react';

export default function ResourcesTab({ currentUser }) {
    const [resources, setResources] = useState([]);
    const [guildTotal, setGuildTotal] = useState({ gold: 0, materials: 0 });
    const [showContribute, setShowContribute] = useState(false);
    const [contribution, setContribution] = useState({ type: 'gold', amount: 0, note: '' });

    useEffect(() => {
        const fetchResources = async () => {
            // In a real app, we'd fetch from GuildResource entity filtered by guild_id
            // For now, we'll mock some data or try to fetch if we added records
            try {
                const res = await base44.entities.GuildResource.list(); // Fetch all for demo
                setResources(res);
                
                const gold = res.filter(r => r.resource_type === 'gold').reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
                const materials = res.filter(r => r.resource_type === 'material').reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
                setGuildTotal({ gold, materials });
            } catch (e) {
                console.log("No resources found or error", e);
                // Mock data if empty
                setGuildTotal({ gold: 154200, materials: 450 });
                setResources([
                    { id: 1, contributor_id: 'Marcus', resource_type: 'gold', amount: 5000, note: 'Raid loot split', created_date: new Date().toISOString() },
                    { id: 2, contributor_id: 'Vexia', resource_type: 'material', amount: 50, note: 'Iron ore donation', created_date: new Date().toISOString() }
                ]);
            }
        };
        fetchResources();
    }, []);

    const handleContribute = async () => {
        if (contribution.amount <= 0) return;
        
        try {
            // Mock create
            const newRes = {
                guild_id: 'current_guild_id',
                contributor_id: currentUser.name,
                resource_type: contribution.type,
                amount: Number(contribution.amount),
                note: contribution.note,
                created_date: new Date().toISOString()
            };
            
            // Optimistic update
            setResources([newRes, ...resources]);
            setGuildTotal(prev => ({
                ...prev,
                [contribution.type]: prev[contribution.type] + Number(contribution.amount)
            }));
            setShowContribute(false);
            setContribution({ type: 'gold', amount: 0, note: '' });
            
            // Actual create call
            await base44.entities.GuildResource.create(newRes);
        } catch (e) {
            console.error("Failed to contribute", e);
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0">
                <Card className="bg-amber-500/10 border-amber-500/30">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <div className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">Guild Treasury</div>
                            <div className="text-3xl font-black text-white font-mono">{guildTotal.gold.toLocaleString()} <span className="text-base text-amber-500">GP</span></div>
                        </div>
                        <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                            <Coins className="w-6 h-6 text-amber-400" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Material Stockpile</div>
                            <div className="text-3xl font-black text-white font-mono">{guildTotal.materials.toLocaleString()} <span className="text-base text-slate-500">Units</span></div>
                        </div>
                        <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                            <Box className="w-6 h-6 text-slate-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex-grow bg-slate-900/40 rounded-xl border border-slate-800 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4 text-green-400" /> Contribution Log
                    </h3>
                    <Dialog open={showContribute} onOpenChange={setShowContribute}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-500">
                                <PlusIcon className="w-4 h-4 mr-2" /> Contribute
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-800 text-white">
                            <DialogHeader>
                                <DialogTitle>Contribute Resources</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Button 
                                        variant={contribution.type === 'gold' ? 'default' : 'outline'}
                                        className={contribution.type === 'gold' ? 'bg-amber-600 hover:bg-amber-500' : 'border-slate-700'}
                                        onClick={() => setContribution({...contribution, type: 'gold'})}
                                    >
                                        <Coins className="w-4 h-4 mr-2" /> Gold
                                    </Button>
                                    <Button 
                                        variant={contribution.type === 'material' ? 'default' : 'outline'}
                                        className={contribution.type === 'material' ? 'bg-slate-600 hover:bg-slate-500' : 'border-slate-700'}
                                        onClick={() => setContribution({...contribution, type: 'material'})}
                                    >
                                        <Box className="w-4 h-4 mr-2" /> Material
                                    </Button>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Amount</label>
                                    <Input 
                                        type="number" 
                                        className="bg-slate-950 border-slate-800"
                                        value={contribution.amount}
                                        onChange={(e) => setContribution({...contribution, amount: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Note (Optional)</label>
                                    <Input 
                                        className="bg-slate-950 border-slate-800"
                                        placeholder="e.g. Raid Split"
                                        value={contribution.note}
                                        onChange={(e) => setContribution({...contribution, note: e.target.value})}
                                    />
                                </div>
                                <Button className="w-full bg-green-600 hover:bg-green-500" onClick={handleContribute}>
                                    Confirm Contribution
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
                
                <div className="overflow-y-auto p-4 space-y-2">
                    {resources.map((res, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${res.resource_type === 'gold' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-700/30 text-slate-400'}`}>
                                    {res.resource_type === 'gold' ? <Coins className="w-4 h-4" /> : <Box className="w-4 h-4" />}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white">
                                        {res.contributor_id} <span className="text-slate-500 font-normal">contributed</span>
                                    </div>
                                    <div className="text-xs text-slate-500">{res.note || 'No note'}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`font-mono font-bold ${res.resource_type === 'gold' ? 'text-amber-400' : 'text-white'}`}>
                                    +{Number(res.amount).toLocaleString()}
                                </div>
                                <div className="text-[10px] text-slate-600">
                                    {new Date(res.created_date).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function PlusIcon({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    );
}