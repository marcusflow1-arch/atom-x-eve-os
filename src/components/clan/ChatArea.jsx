import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Hash, Volume2, PlusCircle, Gift, Sticker, Smile, Send, Shield, Crown, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthContext';
import { format } from 'date-fns';

export default function ChatArea({ channel, clan, myRole }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [inputValue, setInputValue] = useState('');
    const scrollRef = useRef(null);

    // Check if user can post in this channel based on role_restriction
    const channelRestriction = channel?.role_restriction || 'none';
    const effectiveRole = myRole || 'member';
    const canPostInChannel = (() => {
        if (channelRestriction === 'none') return true;
        if (channelRestriction === 'officer') return effectiveRole === 'officer' || effectiveRole === 'leader';
        if (channelRestriction === 'leader') return effectiveRole === 'leader';
        return true;
    })();

    const { data: messages } = useQuery({
        queryKey: ['channelMessages', channel?.id],
        queryFn: async () => {
            if (!channel) return [];
            const msgs = await base44.entities.ClanMessage.filter({ divisionId: clan.id, channelId: channel.id });
            return msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        },
        enabled: !!channel,
        refetchInterval: 4000
    });

    // Real-time subscription
    useEffect(() => {
        if (!channel?.id || !clan?.id) return;
        const unsub = base44.entities.ClanMessage.subscribe((event) => {
            if (event.data?.channelId === channel.id && event.data?.divisionId === clan.id) {
                queryClient.invalidateQueries({ queryKey: ['channelMessages', channel.id] });
            }
        });
        return unsub;
    }, [channel?.id, clan?.id, queryClient]);

    const sendMessageMutation = useMutation({
        mutationFn: (content) => base44.entities.ClanMessage.create({
            divisionId: clan.id,
            channelId: channel.id,
            author: user.full_name || user.username || user.email?.split('@')[0] || 'Unknown',
            authorAvatar: user.avatar_url,
            content,
            userId: user.id,
            role: myRole || 'member',
            isAnnouncement: false,
            isPinned: false
        }),
        onMutate: (content) => {
            // Optimistic update — show message immediately
            const optimistic = {
                id: `opt_${Date.now()}`,
                divisionId: clan.id,
                channelId: channel.id,
                author: user.full_name || user.username || user.email?.split('@')[0] || 'Unknown',
                authorAvatar: user.avatar_url,
                content,
                userId: user.id,
                role: myRole || 'member',
                created_date: new Date().toISOString(),
            };
            queryClient.setQueryData(['channelMessages', channel?.id], (old = []) => [...old, optimistic]);
            setInputValue('');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['channelMessages', channel?.id] });
        }
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    if (!channel) return <div className="flex-1 flex items-center justify-center text-slate-400">Select a channel</div>;

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (inputValue.trim()) sendMessageMutation.mutate(inputValue);
        }
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 relative z-0">
            {/* Header */}
            <div className="h-14 px-4 border-b border-white/10 flex items-center bg-slate-900/40 backdrop-blur-md z-10">
                {channel.type === 'voice' ? <Volume2 className="w-5 h-5 text-white/50 mr-3" /> : <Hash className="w-5 h-5 text-white/50 mr-3" />}
                <h3 className="font-bold text-white text-base">{channel.name}</h3>
                {channel.description && (
                    <>
                        <div className="w-[1px] h-6 bg-white/20 mx-4" />
                        <span className="text-white/50 text-xs truncate">{channel.description}</span>
                    </>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4" ref={scrollRef}>
                <div className="mt-8 mb-12 border-b border-white/10 pb-8">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 border border-white/10">
                        <Hash className="w-8 h-8 text-white/40" />
                    </div>
                    <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Welcome to #{channel.name}!</h1>
                    <p className="text-white/50">This is the start of the <span className="text-white font-bold">#{channel.name}</span> channel.</p>
                </div>

                {messages?.map((msg, idx) => {
                    const prevMsg = messages[idx - 1];
                    const isSameAuthor = prevMsg && prevMsg.author === msg.author && (new Date(msg.created_date) - new Date(prevMsg.created_date) < 300000); 

                    return (
                        <div key={msg.id} className={`group flex gap-4 ${isSameAuthor ? 'mt-1 py-0.5' : 'mt-6 py-1'} px-4 -mx-4 rounded-lg hover:bg-white/5 transition-colors`}>
                            {!isSameAuthor ? (
                                <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all flex-shrink-0 mt-0.5 ring-2 ring-white/10">
                                    {msg.authorAvatar && <img src={msg.authorAvatar} className="w-full h-full object-cover" />}
                                </div>
                            ) : (
                                <div className="w-10 flex-shrink-0 text-[10px] text-white/30 opacity-0 group-hover:opacity-100 text-right pr-3 select-none leading-6">
                                    {format(new Date(msg.created_date), 'h:mm a')}
                                </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                                {!isSameAuthor && (
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-white hover:underline cursor-pointer text-sm">{msg.author}</span>
                                        {msg.role === 'leader' && <Crown className="w-3 h-3 text-amber-400" />}
                                        {msg.role === 'officer' && <ShieldAlert className="w-3 h-3 text-blue-400" />}
                                        <span className="text-[10px] text-white/40 font-medium">{format(new Date(msg.created_date), 'MM/dd/yyyy h:mm a')}</span>
                                    </div>
                                )}
                                <p className={`text-white/80 text-[0.93rem] whitespace-pre-wrap ${isSameAuthor ? '' : 'leading-relaxed'}`}>{msg.content}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input */}
            <div className="px-4 pb-6 pt-2">
                {canPostInChannel ? (
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 flex items-center gap-3 relative border border-white/10 transition-all focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20">
                        <button className="text-white/40 hover:text-white transition-colors bg-white/10 rounded-full p-1.5 hover:bg-white/20">
                            <PlusCircle className="w-5 h-5" />
                        </button>
                        <input 
                            className="bg-transparent border-none outline-none text-white placeholder:text-white/40 flex-1 h-full py-2 font-medium"
                            placeholder={`Message #${channel.name}`}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <div className="flex items-center gap-2 mr-1">
                            <Gift className="w-6 h-6 text-white/40 hover:text-white cursor-pointer p-1 rounded hover:bg-white/10 transition-all" />
                            <Sticker className="w-6 h-6 text-white/40 hover:text-white cursor-pointer p-1 rounded hover:bg-white/10 transition-all" />
                            <Smile className="w-6 h-6 text-white/40 hover:text-white cursor-pointer p-1 rounded hover:bg-white/10 transition-all" />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-2 py-4 text-white/30 text-sm bg-white/5 rounded-xl border border-white/10">
                        <Shield className="w-4 h-4" />
                        <span>You do not have permission to send messages in this channel.</span>
                    </div>
                )}
            </div>
        </div>
    );
}