import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Check, Clock, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ClanVoting({ clan }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newVote, setNewVote] = useState({ title: '', description: '', options: ['', ''] });

    const { data: votes } = useQuery({
        queryKey: ['clanVotes', clan.id],
        queryFn: () => base44.entities.ClanVote.filter({ divisionId: clan.id }),
        enabled: !!clan.id
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.ClanVote.create({
            ...data,
            divisionId: clan.id,
            creatorId: user.id,
            votes: {},
            status: 'active',
            expiresAt: new Date(Date.now() + 86400000 * 3).toISOString() // 3 days default
        }),
        onSuccess: () => {
            queryClient.invalidateQueries(['clanVotes']);
            setIsCreateOpen(false);
            setNewVote({ title: '', description: '', options: ['', ''] });
        }
    });

    const voteMutation = useMutation({
        mutationFn: async ({ voteId, optionIndex }) => {
            const vote = votes.find(v => v.id === voteId);
            const newVotes = { ...vote.votes, [user.id]: optionIndex };
            return await base44.entities.ClanVote.update(voteId, { votes: newVotes });
        },
        onSuccess: () => queryClient.invalidateQueries(['clanVotes'])
    });

    const handleAddOption = () => setNewVote({ ...newVote, options: [...newVote.options, ''] });
    const handleOptionChange = (idx, val) => {
        const newOptions = [...newVote.options];
        newOptions[idx] = val;
        setNewVote({ ...newVote, options: newOptions });
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Guild Decisions</h2>
                    <p className="text-white/60 text-sm">Cast your vote on strategic matters.</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" /> New Poll
                </Button>
            </div>

            <div className="grid gap-4">
                {votes?.map(vote => {
                    const totalVotes = Object.keys(vote.votes || {}).length;
                    const userVote = vote.votes?.[user.id];
                    const isClosed = vote.status === 'closed' || new Date(vote.expiresAt) < new Date();

                    // Calculate percentages
                    const counts = vote.options.map((_, idx) => 
                        Object.values(vote.votes || {}).filter(v => v === idx).length
                    );

                    return (
                        <motion.div 
                            key={vote.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-800/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white">{vote.title}</h3>
                                    <p className="text-white/60 text-sm">{vote.description}</p>
                                </div>
                                <Badge variant={isClosed ? "secondary" : "default"} className={isClosed ? "bg-slate-700" : "bg-green-500/20 text-green-300"}>
                                    {isClosed ? "Closed" : "Active"}
                                </Badge>
                            </div>

                            <div className="space-y-3">
                                {vote.options.map((opt, idx) => {
                                    const count = counts[idx];
                                    const percent = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
                                    const isSelected = userVote === idx;

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => !isClosed && voteMutation.mutate({ voteId: vote.id, optionIndex: idx })}
                                            disabled={isClosed}
                                            className={`w-full relative h-12 rounded-xl overflow-hidden border transition-all ${
                                                isSelected 
                                                    ? 'border-blue-500 ring-1 ring-blue-500/50' 
                                                    : 'border-white/10 hover:border-white/20'
                                            }`}
                                        >
                                            {/* Progress Bar Background */}
                                            <div 
                                                className="absolute top-0 left-0 h-full bg-blue-500/10 transition-all duration-500"
                                                style={{ width: `${percent}%` }}
                                            />
                                            
                                            <div className="absolute inset-0 flex items-center justify-between px-4 z-10">
                                                <span className={`font-medium ${isSelected ? 'text-blue-300' : 'text-white'}`}>
                                                    {opt}
                                                </span>
                                                <div className="flex items-center gap-3">
                                                    {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                                                    <span className="text-xs text-white/40">{count} votes ({Math.round(percent)}%)</span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-4 flex items-center gap-4 text-xs text-white/40">
                                <div className="flex items-center gap-1">
                                    <PieChart className="w-3 h-3" />
                                    {totalVotes} total votes
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Ends {new Date(vote.expiresAt).toLocaleDateString()}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
                
                {votes?.length === 0 && (
                    <div className="text-center py-12 text-white/30 bg-white/5 rounded-2xl border border-dashed border-white/10">
                        <PieChart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No active polls at the moment.</p>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="bg-slate-900/95 border-white/10 text-white sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Create New Poll</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input 
                            placeholder="Poll Question" 
                            value={newVote.title}
                            onChange={e => setNewVote({ ...newVote, title: e.target.value })}
                            className="bg-slate-800 border-white/10"
                        />
                        <Textarea 
                            placeholder="Additional context (optional)"
                            value={newVote.description}
                            onChange={e => setNewVote({ ...newVote, description: e.target.value })}
                            className="bg-slate-800 border-white/10"
                        />
                        <div className="space-y-2">
                            <label className="text-xs text-white/50 font-bold uppercase">Options</label>
                            {newVote.options.map((opt, idx) => (
                                <Input 
                                    key={idx}
                                    placeholder={`Option ${idx + 1}`}
                                    value={opt}
                                    onChange={e => handleOptionChange(idx, e.target.value)}
                                    className="bg-slate-800 border-white/10"
                                />
                            ))}
                            <Button variant="ghost" size="sm" onClick={handleAddOption} className="text-blue-400 hover:text-blue-300">
                                + Add Option
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button 
                            onClick={() => createMutation.mutate(newVote)} 
                            disabled={!newVote.title || newVote.options.some(o => !o)}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Post Poll
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}