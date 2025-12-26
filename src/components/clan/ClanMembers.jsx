import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Crown, User, Dot, UserPlus, Search, MoreHorizontal, UserMinus, ChevronUp, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';

export default function ClanMembers({ clan }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: members } = useQuery({
        queryKey: ['clanMembers', clan.id],
        queryFn: async () => {
            const clanMembers = await base44.entities.ClanMember.filter({ divisionId: clan.id });
            const memberDetails = await Promise.all(clanMembers.map(async (m) => {
                const u = await base44.entities.User.get(m.userId);
                return { ...m, user: u };
            }));
            return memberDetails;
        },
        enabled: !!clan.id
    });

    const inviteMutation = useMutation({
        mutationFn: (email) => base44.functions.invoke('clanSystem', { action: 'invite_member', data: { divisionId: clan.id, email } }),
        onSuccess: () => {
            setIsInviteOpen(false);
            setInviteEmail('');
        }
    });

    const kickMutation = useMutation({
        mutationFn: (targetUserId) => base44.functions.invoke('clanSystem', { action: 'kick_member', data: { divisionId: clan.id, targetUserId } }),
        onSuccess: () => queryClient.invalidateQueries(['clanMembers'])
    });

    const promoteMutation = useMutation({
        mutationFn: ({ targetUserId, newRole }) => base44.functions.invoke('clanSystem', { action: 'promote_member', data: { divisionId: clan.id, targetUserId, newRole } }),
        onSuccess: () => queryClient.invalidateQueries(['clanMembers'])
    });

    // Check my role
    const myRole = members?.find(m => m.userId === user.id)?.role || 'member';
    const isLeader = myRole === 'leader';
    const isOfficer = myRole === 'officer';

    const filteredMembers = members?.filter(m => 
        m.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getRoleIcon = (role) => {
        switch(role) {
            case 'leader': return <Crown className="w-4 h-4 text-yellow-400" />;
            case 'officer': return <Shield className="w-4 h-4 text-blue-400" />;
            default: return <User className="w-4 h-4 text-slate-400" />;
        }
    };

    return (
        <div className="h-full flex flex-col p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Roster</h2>
                    <p className="text-white/60 text-sm">{members?.length} Active Agents</p>
                </div>
                <Button onClick={() => setIsInviteOpen(true)} className="bg-white/10 hover:bg-white/20 text-white border border-white/10">
                    <UserPlus className="w-4 h-4 mr-2" /> Invite
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input 
                    placeholder="Search agents..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-slate-800/50 border-white/10 pl-10 text-white"
                />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                {filteredMembers?.map(member => (
                    <motion.div 
                        key={member.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all group"
                    >
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden ring-2 ring-white/10">
                                {member.user?.avatar_url ? (
                                    <img src={member.user.avatar_url} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white font-bold">
                                        {member.user?.full_name?.[0]}
                                    </div>
                                )}
                            </div>
                            {/* Mock Presence - Random logic for demo, replace with real presence */}
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                                Math.random() > 0.5 ? 'bg-green-500' : 'bg-slate-500'
                            }`} />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm truncate">{member.user?.full_name}</span>
                                {getRoleIcon(member.role)}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-white/40">
                                <span className="capitalize">{member.role}</span>
                                <Dot className="w-3 h-3" />
                                <span>Lvl {Math.floor(Math.random() * 50) + 1}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {(isLeader || (isOfficer && member.role === 'member')) && member.userId !== user.id && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40 hover:text-white">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-slate-900 border-white/10 text-white">
                                        {isLeader && (
                                            <>
                                                {member.role !== 'officer' && (
                                                    <DropdownMenuItem onClick={() => promoteMutation.mutate({ targetUserId: member.userId, newRole: 'officer' })}>
                                                        <ChevronUp className="w-4 h-4 mr-2" /> Promote to Officer
                                                    </DropdownMenuItem>
                                                )}
                                                {member.role === 'officer' && (
                                                    <DropdownMenuItem onClick={() => promoteMutation.mutate({ targetUserId: member.userId, newRole: 'member' })}>
                                                        <ChevronDown className="w-4 h-4 mr-2" /> Demote to Member
                                                    </DropdownMenuItem>
                                                )}
                                            </>
                                        )}
                                        <DropdownMenuItem onClick={() => kickMutation.mutate(member.userId)} className="text-red-400 focus:text-red-400">
                                            <UserMinus className="w-4 h-4 mr-2" /> Kick Member
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogContent className="bg-slate-900/95 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Invite New Agent</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input 
                            placeholder="Email address"
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            className="bg-slate-800 border-white/10"
                        />
                        <p className="text-xs text-white/40 mt-2">
                            The user will receive an invitation to join {clan.name}.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
                        <Button onClick={() => inviteMutation.mutate(inviteEmail)} className="bg-blue-600 hover:bg-blue-700">Send Invite</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}