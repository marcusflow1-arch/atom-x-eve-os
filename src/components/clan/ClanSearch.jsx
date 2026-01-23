import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Users, Shield, LogIn } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function ClanSearch({ onJoinSuccess }) {
    const [searchQuery, setSearchQuery] = useState('');
    const queryClient = useQueryClient();

    const { data: clans, isLoading } = useQuery({
        queryKey: ['publicClans'],
        queryFn: async () => {
            // Fetch public clans
            const allClans = await base44.entities.Division.list();
            return allClans.filter(c => !c.isPrivate && !c.is_development);
        }
    });

    const joinMutation = useMutation({
        mutationFn: (divisionId) => base44.functions.invoke('clanSystem', { action: 'join_clan', data: { divisionId } }),
        onSuccess: (res) => {
            if (res.data.success) {
                queryClient.invalidateQueries(['myClanMemberships']);
                if (onJoinSuccess) onJoinSuccess();
            } else {
                alert(res.data.error || 'Failed to join clan');
            }
        }
    });

    const filteredClans = clans?.filter(clan => 
        clan.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        clan.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col p-6 space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Find a Division</h2>
                <p className="text-white/60">Search for active units to join their ranks.</p>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input 
                    placeholder="Search by name or tag..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-slate-800/50 border-white/10 pl-10 text-white h-12 rounded-xl"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto custom-scrollbar pb-20">
                {isLoading ? (
                    <div className="col-span-2 text-center text-white/30 py-8">Scanning frequencies...</div>
                ) : filteredClans?.length === 0 ? (
                    <div className="col-span-2 text-center text-white/30 py-8">No divisions found matching your criteria.</div>
                ) : (
                    filteredClans?.map((clan) => (
                        <motion.div 
                            key={clan.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 border border-white/5 hover:border-blue-500/30 rounded-xl p-4 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-slate-800 overflow-hidden">
                                        <img src={clan.icon || "https://via.placeholder.com/150"} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{clan.name}</h3>
                                        <div className="flex items-center gap-2 text-xs text-white/40">
                                            <Shield className="w-3 h-3" />
                                            <span>Lvl {clan.level || 1}</span>
                                            <span>•</span>
                                            <Users className="w-3 h-3" />
                                            <span>{clan.memberCount || 1} Members</span>
                                        </div>
                                    </div>
                                </div>
                                <Button 
                                    size="sm" 
                                    onClick={() => joinMutation.mutate(clan.id)}
                                    disabled={joinMutation.isPending}
                                    className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30"
                                >
                                    <LogIn className="w-4 h-4 mr-2" /> Join
                                </Button>
                            </div>
                            
                            <p className="text-sm text-white/60 line-clamp-2 mb-3">
                                {clan.description || "No description provided."}
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {clan.gameTags?.map(tag => (
                                    <Badge key={tag} variant="outline" className="bg-white/5 border-white/10 text-[10px] text-white/40">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}