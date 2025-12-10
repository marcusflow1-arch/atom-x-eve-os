import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Crown, Shield } from 'lucide-react';

export default function MemberList({ clan }) {
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

    const renderRoleGroup = (roleName, roleMembers, color) => {
        if (!roleMembers || roleMembers.length === 0) return null;
        return (
            <div className="mb-8">
                <h4 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3 px-4 flex items-center justify-between">
                    <span>{roleName}</span>
                    <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded">{roleMembers.length}</span>
                </h4>
                {roleMembers.map(m => (
                    <div key={m.id} className="flex items-center gap-3 px-3 py-2 mx-2 rounded-lg hover:bg-white/5 cursor-pointer group transition-all">
                        <div className="relative">
                            <div className="w-9 h-9 rounded-full bg-slate-700 overflow-hidden ring-2 ring-transparent group-hover:ring-white/10 transition-all">
                                {m.user?.avatar_url && <img src={m.user.avatar_url} className="w-full h-full object-cover" />}
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-[2px] border-slate-900 shadow-sm" />
                        </div>
                        <div className="min-w-0">
                            <div className={`font-bold text-sm truncate flex items-center gap-1.5 ${color}`}>
                                {m.user?.full_name || 'Unknown'}
                                {m.role === 'leader' && <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                {m.role === 'officer' && <Shield className="w-3 h-3 text-blue-400 fill-blue-400" />}
                            </div>
                             <div className="text-xs text-slate-500 truncate max-w-[120px] group-hover:text-slate-400 transition-colors">
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

    return (
        <div className="w-64 bg-slate-900/60 backdrop-blur-xl flex-shrink-0 flex flex-col overflow-y-auto h-full py-6 border-l border-white/5">
            {renderRoleGroup('Commanders', leaders, 'text-yellow-400')}
            {renderRoleGroup('Officers', officers, 'text-blue-400')}
            {renderRoleGroup('Agents', membersList, 'text-slate-300')}
        </div>
    );
}