import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Gamepad2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ServerList({ activeClanId, onSelectClan, onCreateClan }) {
  const queryClient = useQueryClient();
  const [isCreateGameChatOpen, setIsCreateGameChatOpen] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [selectedGameChatId, setSelectedGameChatId] = useState(null);

  // Fetch user's clan memberships (divisions)
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

  // Fetch game chats (channels with type 'game')
  const { data: gameChats } = useQuery({
      queryKey: ['gameChats', activeClanId],
      queryFn: async () => {
          if (!activeClanId) return [];
          const channels = await base44.entities.ClanChannel.filter({ divisionId: activeClanId, type: 'game' });
          return channels || [];
      },
      enabled: !!activeClanId
  });

  // Create game chat mutation
  const createGameChatMutation = useMutation({
      mutationFn: async (gameName) => {
          return await base44.entities.ClanChannel.create({
              divisionId: activeClanId,
              name: gameName,
              type: 'game'
          });
      },
      onSuccess: () => {
          queryClient.invalidateQueries(['gameChats', activeClanId]);
          setIsCreateGameChatOpen(false);
          setNewGameName('');
      }
  });

  const handleCreateGameChat = () => {
      if (newGameName.trim()) {
          createGameChatMutation.mutate(newGameName.trim());
      }
  };

  return (
    <div className="w-[84px] h-full flex flex-col items-center pb-4 pt-20 gap-3 bg-white/60 backdrop-blur-xl border-r border-slate-200/60 overflow-y-auto no-scrollbar z-20 shadow-lg">
      
      {/* Add Game Chat Button */}
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger>
            <div 
              className="w-14 h-14 rounded-[32px] hover:rounded-[20px] bg-white hover:bg-green-50 text-green-600 border border-green-200 border-dashed hover:border-green-400 hover:shadow-md transition-all flex items-center justify-center cursor-pointer group" 
              onClick={() => setIsCreateGameChatOpen(true)}
            >
              <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-slate-900 border-slate-700 text-white font-bold ml-2">
            <p>Create Game Chat</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Divider */}
      <div className="w-10 h-[2px] bg-slate-200 rounded-full my-1" />

      {/* Game Chats List */}
      {gameChats?.map(chat => (
          <div key={chat.id} className="relative group flex items-center justify-center w-full">
              {/* Active Indicator */}
              <div className={`absolute left-0 w-[4px] bg-blue-500 rounded-r-lg transition-all duration-300 ${selectedGameChatId === chat.id ? 'h-[40px]' : 'h-[8px] opacity-0 group-hover:opacity-100 group-hover:h-[20px]'}`} />

              <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger>
                        <button 
                            onClick={() => setSelectedGameChatId(chat.id)}
                            className={`w-14 h-14 transition-all duration-300 cursor-pointer flex items-center justify-center overflow-hidden border border-transparent shadow-md
                                ${selectedGameChatId === chat.id 
                                    ? 'rounded-[20px] ring-2 ring-blue-500 ring-offset-2 ring-offset-white bg-blue-50' 
                                    : 'rounded-[32px] hover:rounded-[20px] hover:shadow-lg bg-white ring-1 ring-slate-100'
                                }
                            `}
                        >
                            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600 flex items-center justify-center">
                                <Gamepad2 className="w-6 h-6" />
                            </div>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-slate-900 border-slate-700 text-white font-bold ml-2">
                        <p>{chat.name}</p>
                    </TooltipContent>
                </Tooltip>
              </TooltipProvider>
          </div>
      ))}

      {/* Create Game Chat Modal */}
      <Dialog open={isCreateGameChatOpen} onOpenChange={setIsCreateGameChatOpen}>
          <DialogContent className="bg-white/95 backdrop-blur-2xl border border-slate-200 text-slate-900 rounded-3xl shadow-2xl">
              <DialogHeader>
                  <DialogTitle className="text-center text-xl font-bold text-slate-900 flex items-center justify-center gap-2">
                      <Gamepad2 className="w-5 h-5 text-blue-500" />
                      Create Game Chat
                  </DialogTitle>
              </DialogHeader>
              <div className="py-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Game Name</label>
                  <Input 
                      value={newGameName}
                      onChange={e => setNewGameName(e.target.value)}
                      className="bg-slate-50 border-slate-200 text-slate-900 h-12 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                      placeholder="e.g. Call of Duty, Fortnite..."
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateGameChat()}
                  />
              </div>
              <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsCreateGameChatOpen(false)} className="text-slate-500 hover:text-slate-900 hover:bg-slate-100">Cancel</Button>
                  <Button 
                      onClick={handleCreateGameChat}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                      disabled={!newGameName.trim()}
                  >
                      Create Chat
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}