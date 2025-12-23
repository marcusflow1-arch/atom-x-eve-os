import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Crown, Shield, Users } from 'lucide-react';

export default function MemberList({ clan, fullView = false }) {
    const { data: members } = useQuery({
        queryKey: ['clanMembersList', clan.id],
        queryFn: async () => {
             const clanMembers = await base44.entities.ClanMember.filter({ divisionId: clan.id });
             const memberDetails = await Promise.all(clanMembers.map(async (m) => {
                 const u = await base44.entities.User.get(m.userId);
                 return { ...m, user: u };
             }));
             return memberDetails.sort((a, b) => {
                 const roles = { leader: 0, officer: 1, member: 2 };
                 return roles[a.role] - roles[b.role];
             });
        }
    });

    const onlineMembers = members || []; 

    const renderRoleGroup = (roleName, roleMembers, colorClass) => {
        if (!roleMembers || roleMembers.length === 0) return null;
        return (
            <div className="mb-8">
                <h4 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3 px-4 flex items-center justify-between group">
                    <span>{roleName}</span>
                    <span className="text-[10px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded font-mono group-hover:bg-white/20 transition-colors">{roleMembers.length}</span>
                </h4>
                {roleMembers.map(m => (
                    <div key={m.id} className="flex items-center gap-3 px-3 py-2 mx-2 rounded-lg hover:bg-white/10 cursor-pointer group transition-all">
                        <div className="relative">
                            <div className="w-9 h-9 rounded-full bg-slate-700 overflow-hidden ring-2 ring-white/20">
                                {m.user?.avatar_url && <img src={m.user.avatar_url} className="w-full h-full object-cover" />}
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-[2px] border-slate-900" />
                        </div>
                        <div className="min-w-0">
                            <div className={`font-bold text-sm truncate flex items-center gap-1.5 ${colorClass}`}>
                                {m.user?.full_name || 'Unknown'}
                                {m.role === 'leader' && <Crown className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                                {m.role === 'officer' && <Shield className="w-3 h-3 text-blue-400 fill-blue-400" />}
                            </div>
                             <div className="text-xs text-white/40 truncate max-w-[120px] group-hover:text-white/60 transition-colors font-medium">
                                 Lvl 60 • Paladin
                             </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const leaders = onlineMembers.filter(m => m.role === 'leader');
    const officers = onlineMembers.filter(m => m.role === 'officer');
    const membersList = onlineMembers.filter(m => m.role === 'member');

    // Full view mode for the Members page
    if (fullView) {
        return (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-sm h-full overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                                <Users className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Clan Members</h2>
                                <p className="text-white/50 text-sm">{onlineMembers.length} members in {clan.name}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Members Grid */}
                <div className="p-6 overflow-y-auto max-h-[calc(100vh-250px)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {onlineMembers.map(m => {
                            const roleColors = {
                                leader: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-300', icon: Crown },
                                officer: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-300', icon: Shield },
                                member: { bg: 'bg-white/5', border: 'border-white/10', text: 'text-white', icon: Users }
                            };
                            const roleStyle = roleColors[m.role] || roleColors.member;
                            const RoleIcon = roleStyle.icon;
                            
                            return (
                                <div key={m.id} className={`${roleStyle.bg} ${roleStyle.border} border rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer`}>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-full bg-slate-700 overflow-hidden ring-2 ring-white/20">
                                                {m.user?.avatar_url && <img src={m.user.avatar_url} className="w-full h-full object-cover" alt="" />}
                                            </div>
                                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-slate-900" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-bold text-sm truncate flex items-center gap-1.5 ${roleStyle.text}`}>
                                                {m.user?.full_name || 'Unknown'}
                                                <RoleIcon className={`w-3.5 h-3.5 ${m.role === 'leader' ? 'text-yellow-400 fill-yellow-400' : m.role === 'officer' ? 'text-blue-400 fill-blue-400' : 'text-white/40'}`} />
                                            </div>
                                            <div className="text-xs text-white/50 truncate font-medium capitalize">{m.role}</div>
                                            <div className="text-[10px] text-white/40 mt-0.5">Lvl 60 • Paladin</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // Sidebar view (default)
    return (
        <div className="w-64 bg-slate-900/40 backdrop-blur-xl flex-shrink-0 flex flex-col overflow-y-auto h-full py-6 border-l border-white/10 z-10">
            {renderRoleGroup('Commanders', leaders, 'text-white')}
            {renderRoleGroup('Officers', officers, 'text-blue-300')}
            {renderRoleGroup('Agents', membersList, 'text-white/70')}
        </div>
    );
}