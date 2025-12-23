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
                <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 px-4 flex items-center justify-between group">
                    <span>{roleName}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono group-hover:bg-slate-200 transition-colors">{roleMembers.length}</span>
                </h4>
                {roleMembers.map(m => (
                    <div key={m.id} className="flex items-center gap-3 px-3 py-2 mx-2 rounded-lg hover:bg-white/60 hover:shadow-sm cursor-pointer group transition-all">
                        <div className="relative">
                            <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden ring-2 ring-white shadow-sm">
                                {m.user?.avatar_url && <img src={m.user.avatar_url} className="w-full h-full object-cover" />}
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-[2px] border-white shadow-sm" />
                        </div>
                        <div className="min-w-0">
                            <div className={`font-bold text-sm truncate flex items-center gap-1.5 ${colorClass}`}>
                                {m.user?.full_name || 'Unknown'}
                                {m.role === 'leader' && <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                {m.role === 'officer' && <Shield className="w-3 h-3 text-blue-500 fill-blue-500" />}
                            </div>
                             <div className="text-xs text-slate-400 truncate max-w-[120px] group-hover:text-slate-500 transition-colors font-medium">
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
        <div className="w-64 bg-white/40 backdrop-blur-xl flex-shrink-0 flex flex-col overflow-y-auto h-full py-6 border-l border-white/40 shadow-sm z-10">
            {renderRoleGroup('Commanders', leaders, 'text-slate-900')}
            {renderRoleGroup('Officers', officers, 'text-blue-600')}
            {renderRoleGroup('Agents', membersList, 'text-slate-600')}
        </div>
    );
}