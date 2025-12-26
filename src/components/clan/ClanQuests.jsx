import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Target, Sword, Users, Clock, Plus, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ClanQuests({ clan }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newQuest, setNewQuest] = useState({ title: '', description: '', requirements: '', rewards: '', maxParticipants: 5 });

    const { data: quests } = useQuery({
        queryKey: ['clanQuests', clan.id],
        queryFn: () => base44.entities.ClanQuest.filter({ divisionId: clan.id }),
        enabled: !!clan.id
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.ClanQuest.create({
            ...data,
            divisionId: clan.id,
            creatorId: user.id,
            participants: [],
            status: 'open',
            deadline: new Date(Date.now() + 86400000 * 7).toISOString() // 7 days default
        }),
        onSuccess: () => {
            queryClient.invalidateQueries(['clanQuests']);
            setIsCreateOpen(false);
            setNewQuest({ title: '', description: '', requirements: '', rewards: '', maxParticipants: 5 });
        }
    });

    const joinMutation = useMutation({
        mutationFn: async (questId) => {
            const quest = quests.find(q => q.id === questId);
            if (quest.participants.includes(user.id)) return;
            const newParticipants = [...quest.participants, user.id];
            return await base44.entities.ClanQuest.update(questId, { participants: newParticipants });
        },
        onSuccess: () => queryClient.invalidateQueries(['clanQuests'])
    });

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Mission Board</h2>
                    <p className="text-white/60 text-sm">Coordinate efforts and earn rewards.</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-red-600 hover:bg-red-700">
                    <Plus className="w-4 h-4 mr-2" /> Post Mission
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {quests?.map(quest => {
                    const isJoined = quest.participants.includes(user.id);
                    const isFull = quest.participants.length >= quest.maxParticipants;

                    return (
                        <motion.div 
                            key={quest.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-slate-800/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-white/20 transition-all"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10">
                                        <Sword className="w-3 h-3 mr-1" /> Operation
                                    </Badge>
                                    <Badge className="bg-white/10 text-white/60 hover:bg-white/20">
                                        {quest.participants.length}/{quest.maxParticipants} Agents
                                    </Badge>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{quest.title}</h3>
                                <p className="text-white/60 text-sm mb-4 line-clamp-2">{quest.description}</p>
                                
                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center gap-2 text-white/50">
                                        <Target className="w-3 h-3 text-red-400" />
                                        <span>Req: {quest.requirements || 'None'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/50">
                                        <CheckCircle2 className="w-3 h-3 text-yellow-400" />
                                        <span>Reward: {quest.rewards || 'Glory'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 pt-4 border-t border-white/10 flex justify-between items-center">
                                <span className="text-xs text-white/30 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Ends {new Date(quest.deadline).toLocaleDateString()}
                                </span>
                                {isJoined ? (
                                    <Button disabled variant="secondary" className="bg-green-500/20 text-green-300">
                                        <CheckCircle2 className="w-4 h-4 mr-2" /> Joined
                                    </Button>
                                ) : (
                                    <Button 
                                        onClick={() => joinMutation.mutate(quest.id)}
                                        disabled={isFull}
                                        className="bg-white/10 hover:bg-white/20 text-white"
                                    >
                                        {isFull ? 'Squad Full' : 'Accept Mission'}
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
                
                {quests?.length === 0 && (
                    <div className="col-span-full text-center py-16 text-white/30 bg-white/5 rounded-2xl border border-dashed border-white/10">
                        <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No active operations. Check back later.</p>
                    </div>
                )}
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="bg-slate-900/95 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Post New Mission</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input 
                            placeholder="Mission Title" 
                            value={newQuest.title}
                            onChange={e => setNewQuest({ ...newQuest, title: e.target.value })}
                            className="bg-slate-800 border-white/10"
                        />
                        <Textarea 
                            placeholder="Mission Details..."
                            value={newQuest.description}
                            onChange={e => setNewQuest({ ...newQuest, description: e.target.value })}
                            className="bg-slate-800 border-white/10"
                        />
                        <Input 
                            placeholder="Requirements (e.g. Lvl 50+)" 
                            value={newQuest.requirements}
                            onChange={e => setNewQuest({ ...newQuest, requirements: e.target.value })}
                            className="bg-slate-800 border-white/10"
                        />
                        <Input 
                            placeholder="Rewards (e.g. 500 Guild XP)" 
                            value={newQuest.rewards}
                            onChange={e => setNewQuest({ ...newQuest, rewards: e.target.value })}
                            className="bg-slate-800 border-white/10"
                        />
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-white/60">Max Agents:</span>
                            <Input 
                                type="number"
                                value={newQuest.maxParticipants}
                                onChange={e => setNewQuest({ ...newQuest, maxParticipants: parseInt(e.target.value) })}
                                className="bg-slate-800 border-white/10 w-24"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={() => createMutation.mutate(newQuest)} className="bg-red-600 hover:bg-red-700">Post Mission</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}