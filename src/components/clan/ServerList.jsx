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
    <div className="w-[84px] h-full flex flex-col items-center pb-4 pt-20 gap-3 bg-slate-900/80 backdrop-blur-xl border-r border-white/10 overflow-y-auto no-scrollbar z-20">
      
      {/* Add Game Chat Button */}
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger>
            <div 
              className="w-14 h-14 rounded-[32px] hover:rounded-[20px] bg-white/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 border-dashed hover:border-green-400 transition-all flex items-center justify-center cursor-pointer group" 
              onClick={() => setIsCreateGameChatOpen(true)}
            >
              <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-slate-800 border-slate-700 text-white font-bold ml-2">
            <p>Create Game Chat</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Divider */}
      <div className="w-10 h-[2px] bg-white/10 rounded-full my-1" />

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
                            className={`w-14 h-14 transition-all duration-300 cursor-pointer flex items-center justify-center overflow-hidden border shadow-md
                                ${selectedGameChatId === chat.id 
                                    ? 'rounded-[20px] ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900 bg-blue-500/20 border-blue-500/50' 
                                    : 'rounded-[32px] hover:rounded-[20px] bg-white/10 border-white/10 hover:border-white/20'
                                }
                            `}
                        >
                            <div className="w-full h-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 text-blue-400 flex items-center justify-center">
                                <Gamepad2 className="w-6 h-6" />
                            </div>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-slate-800 border-slate-700 text-white font-bold ml-2">
                        <p>{chat.name}</p>
                    </TooltipContent>
                </Tooltip>
              </TooltipProvider>
          </div>
      ))}

      {/* Create Game Chat Modal */}
      <Dialog open={isCreateGameChatOpen} onOpenChange={setIsCreateGameChatOpen}>
          <DialogContent className="bg-slate-900/95 backdrop-blur-xl border border-white/10 text-white rounded-3xl shadow-2xl">
              <DialogHeader>
                  <DialogTitle className="text-center text-xl font-bold text-white flex items-center justify-center gap-2">
                      <Gamepad2 className="w-5 h-5 text-blue-400" />
                      Create Game Chat
                  </DialogTitle>
              </DialogHeader>
              <div className="py-4">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">Game Name</label>
                  <Input 
                      value={newGameName}
                      onChange={e => setNewGameName(e.target.value)}
                      className="bg-white/10 border-white/20 text-white h-12 rounded-xl focus:ring-2 focus:ring-blue-500/30 placeholder:text-white/30"
                      placeholder="e.g. Call of Duty, Fortnite..."
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateGameChat()}
                  />
              </div>
              <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsCreateGameChatOpen(false)} className="text-white/60 hover:text-white hover:bg-white/10">Cancel</Button>
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