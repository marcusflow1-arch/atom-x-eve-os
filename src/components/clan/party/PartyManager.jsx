import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Users, Plus, Target, Mic, Shield, 
    Crown, UserPlus, LogIn, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/components/auth/AuthContext';

export default function PartyManager({ clanId, gameId }) {
    const { user } = useAuth();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newParty, setNewParty] = useState({
        goal: '',
        size: '4',
        micRequired: false,
        minLevel: ''
    });

    // Mock Parties
    const [parties, setParties] = useState([
        {
            id: '1', leader: { name: 'Vanguard', id: 'u1' }, size: 6, current: 4,
            goal: 'Grandmaster Nightfall', status: 'forming', micRequired: true,
            members: [{id: 'u1'}, {id: 'u2'}, {id: 'u3'}, {id: 'u4'}]
        },
        {
            id: '2', leader: { name: 'Drifter', id: 'u5' }, size: 4, current: 1,
            goal: 'Gambit Prime', status: 'forming', micRequired: false,
            members: [{id: 'u5'}]
        }
    ]);

    const handleCreateParty = () => {
        if (!newParty.goal.trim()) return;
        const party = {
            id: Date.now().toString(),
            leader: { name: user?.username || 'Me', id: user?.id || 'me' },
            size: parseInt(newParty.size),
            current: 1,
            goal: newParty.goal,
            status: 'forming',
            micRequired: newParty.micRequired,
            members: [{id: user?.id || 'me'}]
        };
        setParties([party, ...parties]);
        setIsCreateOpen(false);
        setNewParty({ goal: '', size: '4', micRequired: false, minLevel: '' });
    };

    const handleJoin = (partyId) => {
        setParties(parties.map(p => {
            if (p.id === partyId && p.current < p.size) {
                return { ...p, current: p.current + 1, members: [...p.members, {id: 'me'}] };
            }
            return p;
        }));
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-400" /> Active Squads
                    </h3>
                    <p className="text-xs text-white/40">Find a team or start your own.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white gap-2">
                            <Plus className="w-4 h-4" /> Create Party
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#12141a] border-white/10 text-white">
                        <DialogHeader>
                            <DialogTitle>Form New Squad</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70">Squad Goal</label>
                                <Input 
                                    placeholder="e.g. Dungeon Speedrun" 
                                    value={newParty.goal}
                                    onChange={(e) => setNewParty({...newParty, goal: e.target.value})}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/70">Max Size</label>
                                    <Select 
                                        value={newParty.size} 
                                        onValueChange={(val) => setNewParty({...newParty, size: val})}
                                    >
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-white/10 text-white">
                                            <SelectItem value="3">3 Players</SelectItem>
                                            <SelectItem value="4">4 Players</SelectItem>
                                            <SelectItem value="6">6 Players</SelectItem>
                                            <SelectItem value="12">12 Players (Raid)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/70">Requirements</label>
                                    <div 
                                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${newParty.micRequired ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'bg-white/5 border-white/10 text-white/50'}`}
                                        onClick={() => setNewParty({...newParty, micRequired: !newParty.micRequired})}
                                    >
                                        <Mic className="w-4 h-4" />
                                        <span className="text-sm">Mic Required</span>
                                    </div>
                                </div>
                            </div>
                            <Button onClick={handleCreateParty} className="w-full bg-blue-600 hover:bg-blue-500 mt-2">
                                Post LFG
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                    {parties.map(party => (
                        <div 
                            key={party.id} 
                            className="bg-black/40 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all group"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-white text-lg">{party.goal}</h4>
                                    <div className="flex items-center gap-2 text-xs text-white/40 mt-1">
                                        <Crown className="w-3 h-3 text-amber-400" />
                                        Leader: <span className="text-white/60">{party.leader.name}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <Badge variant="outline" className={`
                                        ${party.status === 'full' ? 'border-red-500/30 text-red-400' : 'border-green-500/30 text-green-400'}
                                    `}>
                                        {party.current}/{party.size} Players
                                    </Badge>
                                    {party.micRequired && (
                                        <div className="flex items-center gap-1 text-[10px] text-blue-400">
                                            <Mic className="w-3 h-3" /> Mic Req
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Member Slots */}
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex -space-x-2">
                                    {/* Existing Members */}
                                    {party.members.map((m, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0a0c10] bg-slate-800 flex items-center justify-center relative">
                                            {m.id === party.leader.id ? (
                                                <Crown className="w-3 h-3 text-amber-400" />
                                            ) : (
                                                <span className="text-[10px] font-bold text-white/50">{i + 1}</span>
                                            )}
                                        </div>
                                    ))}
                                    {/* Empty Slots */}
                                    {[...Array(party.size - party.members.length)].map((_, i) => (
                                        <div key={`empty-${i}`} className="w-8 h-8 rounded-full border-2 border-[#0a0c10] bg-white/5 flex items-center justify-center border-dashed border-white/20">
                                            <span className="text-[10px] text-white/10">?</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full text-white/30 hover:text-white bg-white/5 hover:bg-white/10">
                                        <UserPlus className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        onClick={() => handleJoin(party.id)}
                                        disabled={party.current >= party.size}
                                        className="h-8 bg-white/10 hover:bg-white/20 text-white border border-white/10"
                                    >
                                        Join Squad
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}