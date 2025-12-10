import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Shield } from 'lucide-react';

export default function ServerList({ activeClanId, onSelectClan, onCreateClan }) {
  const { data: memberships } = useQuery({
      queryKey: ['myClanMemberships'],
      queryFn: async () => {
          const user = await base44.auth.me();
          if (!user) return [];
          const members = await base44.entities.ClanMember.filter({ userId: user.id });
          // Fetch the actual division details
          const divisions = await Promise.all(members.map(async (m) => {
              return await base44.entities.Division.get(m.divisionId);
          }));
          return divisions.filter(d => d); // Filter out nulls
      }
  });

  return (
    <div className="w-[72px] bg-[#1E1F22] flex flex-col items-center py-3 gap-2 overflow-y-auto no-scrollbar">
      {/* Home / Direct Messages - Placeholder */}
      <div className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#313338] hover:bg-[#5865F2] transition-all flex items-center justify-center cursor-pointer group">
         <img src="https://assets-global.website-files.com/6257adef93867e56f84d3092/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png" className="w-7 h-7 group-hover:invert group-hover:brightness-0 transition-all" alt="Home" />
      </div>

      <div className="w-8 h-[2px] bg-[#35363C] rounded-lg my-1" />

      {memberships?.map(clan => (
          <div key={clan.id} className="relative group flex items-center justify-center w-full">
              {/* Active Indicator */}
              {activeClanId === clan.id && (
                  <div className="absolute left-0 w-[4px] h-[40px] bg-white rounded-r-lg" />
              )}
              {!activeClanId === clan.id && (
                  <div className="absolute left-0 w-[4px] h-[8px] bg-white rounded-r-lg opacity-0 group-hover:opacity-100 transition-all group-hover:h-[20px]" />
              )}

              <button 
                onClick={() => onSelectClan(clan)}
                className={`w-12 h-12 transition-all cursor-pointer flex items-center justify-center overflow-hidden
                    ${activeClanId === clan.id ? 'rounded-[16px]' : 'rounded-[24px] group-hover:rounded-[16px]'}
                `}
              >
                  {clan.icon ? (
                      <img src={clan.icon} alt={clan.name} className="w-full h-full object-cover" />
                  ) : (
                      <div className="w-full h-full bg-[#313338] text-[#dbdee1] flex items-center justify-center text-xs font-bold">
                          {clan.name.substring(0, 2).toUpperCase()}
                      </div>
                  )}
              </button>
          </div>
      ))}

      <div className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#313338] hover:bg-[#23A559] text-[#23A559] hover:text-white transition-all flex items-center justify-center cursor-pointer group mt-2" onClick={onCreateClan}>
         <Plus className="w-6 h-6" />
      </div>
    </div>
  );
}