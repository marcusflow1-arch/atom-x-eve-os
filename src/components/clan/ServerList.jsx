import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Shield } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function ServerList({ activeClanId, onSelectClan, onCreateClan }) {
  const { data: memberships } = useQuery({
      queryKey: ['myClanMemberships'],
      queryFn: async () => {
          const user = await base44.auth.me();
          if (!user) return [];
          const members = await base44.entities.ClanMember.filter({ userId: user.id });
          const divisions = await Promise.all(members.map(async (m) => {
              return await base44.entities.Division.get(m.divisionId);
          }));
          return divisions.filter(d => d);
      }
  });

  return (
    <div className="w-[84px] h-full flex flex-col items-center py-4 gap-3 bg-white/60 backdrop-blur-xl border-r border-slate-200/60 overflow-y-auto no-scrollbar z-20 shadow-lg">
      
      {/* Home / Direct Messages */}
      <TooltipProvider delayDuration={0}>
        <Tooltip>
            <TooltipTrigger>
                <div className="w-14 h-14 rounded-[28px] hover:rounded-[20px] bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-blue-500/30 transition-all duration-300 flex items-center justify-center cursor-pointer group relative overflow-hidden ring-2 ring-white ring-offset-2 ring-offset-slate-50">
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <img src="https://assets-global.website-files.com/6257adef93867e56f84d3092/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png" className="w-8 h-8 invert brightness-0 transition-transform group-hover:scale-110 opacity-90" alt="Home" />
                </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-slate-900 border-slate-700 text-white font-bold ml-2">
                <p>Direct Messages</p>
            </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="w-10 h-[2px] bg-slate-200 rounded-full my-1" />

      {memberships?.map(clan => (
          <div key={clan.id} className="relative group flex items-center justify-center w-full">
              {/* Active Indicator */}
              <div className={`absolute left-0 w-[4px] bg-slate-800 rounded-r-lg transition-all duration-300 ${activeClanId === clan.id ? 'h-[40px]' : 'h-[8px] opacity-0 group-hover:opacity-100 group-hover:h-[20px]'}`} />

              <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger>
                        <button 
                            onClick={() => onSelectClan(clan)}
                            className={`w-14 h-14 transition-all duration-300 cursor-pointer flex items-center justify-center overflow-hidden border border-transparent shadow-md
                                ${activeClanId === clan.id 
                                    ? 'rounded-[20px] ring-2 ring-blue-500 ring-offset-2 ring-offset-white' 
                                    : 'rounded-[32px] hover:rounded-[20px] hover:shadow-lg bg-white ring-1 ring-slate-100'
                                }
                            `}
                        >
                            {clan.icon ? (
                                <img src={clan.icon} alt={clan.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-black border border-slate-200 group-hover:border-slate-300 transition-colors">
                                    {clan.name.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-slate-900 border-slate-700 text-white font-bold ml-2">
                        <p>{clan.name}</p>
                    </TooltipContent>
                </Tooltip>
              </TooltipProvider>
          </div>
      ))}

      <div className="w-14 h-14 rounded-[32px] hover:rounded-[20px] bg-white hover:bg-green-50 text-green-600 border border-green-200 border-dashed hover:border-green-400 hover:shadow-md transition-all flex items-center justify-center cursor-pointer group mt-2" onClick={onCreateClan}>
         <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </div>
    </div>
  );
}