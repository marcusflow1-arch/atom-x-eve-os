import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Crown } from 'lucide-react';

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
                 // Sort by role (leader first)
                 const roles = { leader: 0, officer: 1, member: 2 };
                 return roles[a.role] - roles[b.role];
             });
        }
    });

    const onlineMembers = members || []; // In real app, filter by online status

    const renderRoleGroup = (roleName, roleMembers) => {
        if (!roleMembers || roleMembers.length === 0) return null;
        return (
            <div className="mb-6">
                <h4 className="text-[#949BA4] text-xs font-bold uppercase mb-2 px-4">{roleName} — {roleMembers.length}</h4>
                {roleMembers.map(m => (
                    <div key={m.id} className="flex items-center gap-3 px-2 py-1.5 mx-2 rounded hover:bg-[#35373C] cursor-pointer group opacity-90 hover:opacity-100">
                        <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-slate-600 overflow-hidden">
                                {m.user?.avatar_url && <img src={m.user.avatar_url} className="w-full h-full object-cover" />}
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#23A559] rounded-full border-[2px] border-[#2B2D31]" />
                        </div>
                        <div>
                            <div className="font-medium text-[#dbdee1] flex items-center gap-1">
                                {m.user?.full_name || 'Unknown'}
                                {m.role === 'leader' && <Crown className="w-3 h-3 text-[#F0B232]" />}
                            </div>
                             {/* Status message could go here */}
                             <div className="text-xs text-[#949BA4] truncate max-w-[120px]">Playing Call of Duty</div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const leaders = onlineMembers.filter(m => m.role === 'leader');
    const officers = onlineMembers.filter(m => m.role === 'officer');
    const plebs = onlineMembers.filter(m => m.role === 'member');

    return (
        <div className="w-60 bg-[#2B2D31] flex-shrink-0 flex flex-col overflow-y-auto h-full py-4">
            {renderRoleGroup('Leaders', leaders)}
            {renderRoleGroup('Officers', officers)}
            {renderRoleGroup('Members', plebs)}
        </div>
    );
}