import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEntitySubscription } from '@/components/clan/shared/useEntitySubscription';
import { base44 } from '@/api/base44Client';
import { 
    Users, Plus, Target, Mic, Shield, 
    Crown, UserPlus, LogIn, ChevronRight, PhoneCall, Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/components/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { base44 as sdk } from '@/api/base44Client';

export default function PartyManager({ clanId, gameId }) {
    const { user, updatePresenceContext } = useAuth();
    const navigate = useNavigate();
    const [launchPrompt, setLaunchPrompt] = useState(null);
    const [voiceDialog, setVoiceDialog] = useState({ open: false, partyId: null, name: '' });
    const [activePartyId, setActivePartyId] = useState(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Sync party presence
    useEffect(() => {
        if (activePartyId) {
            base44.auth.updateMe({ party_id: activePartyId });
        } else {
            base44.auth.updateMe({ party_id: null });
        }
    }, [activePartyId]);
    const [newParty, setNewParty] = useState({
        goal: '',
        size: [4],
        micRequired: false,
        context: 'general',
        linkedTask: 'none'
    });

    const { data: mockTasks = [] } = useQuery({
        queryKey: ['availableAssignments', clanId, gameId],
        queryFn: async () => {
             const items = await base44.entities.ClanAssignment.filter({
                 clanId,
                 targetId: gameId,
                 status: 'pending'
             });
             return items.map(i => ({ id: i.id, label: i.title || i.targetName, type: 'assignment' }));
        }
    });

    // Real Data Fetching
    const { data: parties = [] } = useQuery({
        queryKey: ['clanParties', clanId, gameId],
        queryFn: async () => {
             const items = await base44.entities.Party.filter({ 
                 clanId, 
                 gameId, 
                 status: { $ne: 'completed' } 
             });
             // Enrich leader names (optional optimization: fetch users in bulk or just show ID)
             // For now, keeping it simple
             return items;
        }
    });

    useEntitySubscription('Party', ['clanParties', clanId, gameId]);

    // Listen for launch prompts targeted to current user
    useEffect(() => {
        const unsub = base44.entities.PartyEvent.subscribe((e) => {
            try {
                if (e.type === 'create' && e.data?.type === 'launch' && e.data?.target_user_id === user?.id && e.data?.party_id) {
                    setLaunchPrompt({ id: e.id, game_id: e.data.game_id, party_id: e.data.party_id });
                }
            } catch {}
        });
        return () => { try { unsub(); } catch {} };
    }, [user?.id]);

    const handleCreateParty = async () => {
        if (!newParty.goal.trim()) return;
        
        try {
            await base44.entities.Party.create({
                clanId,
                gameId,
                leaderId: user.id,
                goal: newParty.goal,
                description: newParty.context, // Storing context in description for now
                maxSize: newParty.size[0],
                status: 'forming',
                micRequired: newParty.micRequired,
                assignmentId: newParty.linkedTask !== 'none' ? newParty.linkedTask : null,
                members: [user.id],
                lastActive: new Date().toISOString()
            });
            setIsCreateOpen(false);
            setNewParty({ goal: '', size: [4], micRequired: false, context: 'general', linkedTask: 'none' });
        } catch (e) {
            console.error("Failed to create party", e);
        }
    };

    const getContextBadge = (ctx) => {
        // Fallback or mapping
        const label = ctx || 'General';
        if (label.toLowerCase().includes('farm')) return { label: 'Farming', color: 'text-emerald-400 border-emerald-500/30' };
        if (label.toLowerCase().includes('raid')) return { label: 'Raid', color: 'text-purple-400 border-purple-500/30' };
        if (label.toLowerCase().includes('pvp')) return { label: 'PvP', color: 'text-red-400 border-red-500/30' };
        return { label: 'General', color: 'text-blue-400 border-blue-500/30' };
    };

    const handleJoin = async (partyId) => {
        await base44.functions.invoke('managePartyMembership', {
            action: 'join',
            partyId
        });
        // Subscription will update UI
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
                        <div className="space-y-5 py-2">
                            {/* Goal Input */}
                            <div className="space-y-2">
                                <Label className="text-white/80">Squad Goal</Label>
                                <Input 
                                    placeholder="e.g. Dungeon Speedrun" 
                                    value={newParty.goal}
                                    onChange={(e) => setNewParty({...newParty, goal: e.target.value})}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>

                            {/* Zone Context & Size */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-white/80">Context</Label>
                                    <Select 
                                        value={newParty.context} 
                                        onValueChange={(val) => setNewParty({...newParty, context: val})}
                                    >
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-white/10 text-white">
                                            <SelectItem value="general">General</SelectItem>
                                            <SelectItem value="farming">Farming</SelectItem>
                                            <SelectItem value="raid">Raid</SelectItem>
                                            <SelectItem value="pvp">PvP</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label className="text-white/80">Size</Label>
                                        <span className="text-xs text-white/50">{newParty.size[0]} Players</span>
                                    </div>
                                    <Slider 
                                        value={newParty.size} 
                                        onValueChange={(val) => setNewParty({...newParty, size: val})} 
                                        min={2} max={12} step={1}
                                        className="py-2"
                                    />
                                </div>
                            </div>

                            {/* Link Task */}
                            <div className="space-y-2">
                                <Label className="text-white/80">Link Assignment (Optional)</Label>
                                <Select 
                                    value={newParty.linkedTask} 
                                    onValueChange={(val) => setNewParty({...newParty, linkedTask: val})}
                                >
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue placeholder="None" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                                        <SelectItem value="none">None</SelectItem>
                                        {mockTasks.map(task => (
                                            <SelectItem key={task.id} value={task.id}>
                                                {task.type === 'assignment' ? '📋' : '🌾'} {task.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Requirements Toggle */}
                            <div 
                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${newParty.micRequired ? 'bg-blue-500/10 border-blue-500/50 text-blue-300' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
                                onClick={() => setNewParty({...newParty, micRequired: !newParty.micRequired})}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${newParty.micRequired ? 'bg-blue-500 text-white' : 'bg-white/10'}`}>
                                    <Mic className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Microphone Required</p>
                                    <p className="text-[10px] opacity-60">Voice chat participation mandatory</p>
                                </div>
                            </div>

                            <Button onClick={handleCreateParty} className="w-full bg-blue-600 hover:bg-blue-500 py-6 text-base font-bold shadow-lg shadow-blue-900/20">
                                <Plus className="w-5 h-5 mr-2" />
                                Post Party
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
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${getContextBadge(party.context).color}`}>
                                            {getContextBadge(party.context).label}
                                        </Badge>
                                        {party.linkedTask !== 'none' && (
                                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-amber-400 border-amber-500/30">
                                                <Target className="w-3 h-3 mr-1" /> Linked
                                            </Badge>
                                        )}
                                    </div>
                                    <h4 className="font-bold text-white text-lg">{party.goal}</h4>
                                    <div className="flex items-center gap-2 text-xs text-white/40 mt-1">
                                        <Crown className="w-3 h-3 text-amber-400" />
                                        Leader: <span className="text-white/60">{party.leaderId === user?.id ? 'Me' : 'Unknown'}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <Badge variant="outline" className={`
                                        ${party.status === 'full' ? 'border-red-500/30 text-red-400' : 'border-green-500/30 text-green-400'}
                                    `}>
                                        {party.members?.length || 0}/{party.maxSize} Players
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
                                    {(party.members || []).map((mId, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0a0c10] bg-slate-800 flex items-center justify-center relative" title={mId}>
                                            {mId === party.leaderId ? (
                                                <Crown className="w-3 h-3 text-amber-400" />
                                            ) : (
                                                <span className="text-[10px] font-bold text-white/50">{i + 1}</span>
                                            )}
                                        </div>
                                    ))}
                                    {/* Empty Slots */}
                                    {[...Array(Math.max(0, (party.maxSize || 0) - (party.members?.length || 0)))].map((_, i) => (
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
                                       disabled={(party.members?.length || 0) >= party.maxSize}
                                       className="h-8 bg-white/10 hover:bg-white/20 text-white border border-white/10"
                                    >
                                       Join Squad
                                    </Button>
                                    {party.leaderId === user?.id && (
                                     <>
                                       <Button size="sm" onClick={async () => {
                                         await base44.functions.invoke('partyLaunchGame', { partyId: party.id, gameId });
                                       }} disabled={(party.members?.length || 0) < (party.maxSize || 0)} className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white border border-white/10">
                                         <Rocket className="w-4 h-4 mr-1" /> Launch Game
                                       </Button>
                                       <Button size="sm" variant="outline" onClick={() => setVoiceDialog({ open: true, partyId: party.id, name: `party-${party.id}` })} className="h-8">
                                         <PhoneCall className="w-4 h-4 mr-1" /> Voice
                                       </Button>
                                     </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>

        {/* Launch Prompt Modal */}
        <Dialog open={!!launchPrompt} onOpenChange={(o) => { if (!o) setLaunchPrompt(null); }}>
          <DialogContent className="bg-[#12141a] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Squad Launch Request</DialogTitle>
            </DialogHeader>
            <p className="text-white/70 text-sm">Your squad leader wants to launch the game. Ready to start?</p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={async () => { if (launchPrompt) { await base44.entities.PartyEvent.update(launchPrompt.id, { status: 'dismissed' }); setLaunchPrompt(null);} }}>Not Now</Button>
              <Button onClick={async () => { if (launchPrompt) { await base44.entities.PartyEvent.update(launchPrompt.id, { status: 'acknowledged' }); setLaunchPrompt(null); navigate('/' + 'Library'); } }} className="bg-emerald-600 hover:bg-emerald-700">Launch</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Voice Room Dialog */}
        <Dialog open={voiceDialog.open} onOpenChange={(o) => setVoiceDialog(v => ({ ...v, open: o }))}>
          <DialogContent className="bg-[#12141a] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Join Voice Room</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Label className="text-white/80">Room Name</Label>
              <Input value={voiceDialog.name} onChange={(e) => setVoiceDialog(v => ({ ...v, name: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setVoiceDialog({ open: false, partyId: null, name: '' })}>Cancel</Button>
                <Button onClick={async () => { await base44.functions.invoke('joinVoiceRoom', { room_name: voiceDialog.name, party_id: voiceDialog.partyId, clan_id: clanId, game_id: gameId }); setVoiceDialog({ open: false, partyId: null, name: '' }); }} className="bg-blue-600 hover:bg-blue-500">Join</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    );
}