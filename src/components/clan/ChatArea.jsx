import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Hash, Volume2, PlusCircle, Gift, Sticker, Smile, Send } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { format } from 'date-fns';

export default function ChatArea({ channel, clan }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [inputValue, setInputValue] = useState('');
    const scrollRef = useRef(null);

    // Fetch messages for this channel
    const { data: messages } = useQuery({
        queryKey: ['channelMessages', channel?.id],
        queryFn: async () => {
            if (!channel) return [];
            const msgs = await base44.entities.ClanMessage.filter({ divisionId: clan.id, channelId: channel.id });
            return msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        },
        enabled: !!channel,
        refetchInterval: 3000
    });

    const sendMessageMutation = useMutation({
        mutationFn: (content) => base44.entities.ClanMessage.create({
            divisionId: clan.id,
            channelId: channel.id,
            author: user.username || 'Unknown',
            authorAvatar: user.avatar_url,
            content,
            isAnnouncement: false,
            isPinned: false
        }),
        onSuccess: () => {
            setInputValue('');
            queryClient.invalidateQueries(['channelMessages']);
        }
    });

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    if (!channel) return <div className="flex-1 bg-[#313338] flex items-center justify-center text-[#B5BAC1]">Select a channel</div>;

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (inputValue.trim()) sendMessageMutation.mutate(inputValue);
        }
    };

    return (
        <div className="flex-1 bg-[#313338] flex flex-col min-w-0">
            {/* Header */}
            <div className="h-12 px-4 border-b border-[#26272D] flex items-center shadow-sm">
                {channel.type === 'voice' ? <Volume2 className="w-6 h-6 text-[#80848E] mr-3" /> : <Hash className="w-6 h-6 text-[#80848E] mr-3" />}
                <h3 className="font-bold text-white text-base">{channel.name}</h3>
                {channel.description && (
                    <>
                        <div className="w-[1px] h-6 bg-[#3F4147] mx-4" />
                        <span className="text-[#B5BAC1] text-xs truncate">{channel.description}</span>
                    </>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4" ref={scrollRef}>
                <div className="mt-4 mb-8">
                    <div className="w-16 h-16 rounded-full bg-[#41434A] flex items-center justify-center mb-4">
                        <Hash className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome to #{channel.name}!</h1>
                    <p className="text-[#B5BAC1]">This is the start of the #{channel.name} channel.</p>
                </div>

                {messages?.map((msg, idx) => {
                    const prevMsg = messages[idx - 1];
                    const isSameAuthor = prevMsg && prevMsg.author === msg.author && (new Date(msg.created_date) - new Date(prevMsg.created_date) < 300000); // 5 mins

                    return (
                        <div key={msg.id} className={`group flex gap-4 ${isSameAuthor ? 'mt-1 py-0.5 hover:bg-[#2e3035]' : 'mt-4 py-1 hover:bg-[#2e3035]'} px-2 -mx-2 rounded`}>
                            {!isSameAuthor ? (
                                <div className="w-10 h-10 rounded-full bg-slate-600 overflow-hidden cursor-pointer hover:opacity-80 flex-shrink-0 mt-1">
                                    {msg.authorAvatar && <img src={msg.authorAvatar} className="w-full h-full object-cover" />}
                                </div>
                            ) : (
                                <div className="w-10 flex-shrink-0 text-[10px] text-[#B5BAC1] opacity-0 group-hover:opacity-100 text-right pr-3 select-none leading-6">
                                    {format(new Date(msg.created_date), 'h:mm a')}
                                </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                                {!isSameAuthor && (
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-medium text-white hover:underline cursor-pointer">{msg.author}</span>
                                        <span className="text-xs text-[#949BA4] ml-1">{format(new Date(msg.created_date), 'MM/dd/yyyy')}</span>
                                    </div>
                                )}
                                <p className={`text-[#DBDEE1] whitespace-pre-wrap ${isSameAuthor ? '' : 'leading-relaxed'}`}>{msg.content}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input */}
            <div className="px-4 pb-6 pt-2">
                <div className="bg-[#383A40] rounded-lg p-2.5 flex items-center gap-3 relative">
                    <button className="text-[#B5BAC1] hover:text-[#DBDEE1] transition-colors bg-[#404249] rounded-full p-1">
                        <PlusCircle className="w-5 h-5" />
                    </button>
                    <input 
                        className="bg-transparent border-none outline-none text-[#DBDEE1] placeholder-[#949BA4] flex-1 h-full py-1"
                        placeholder={`Message #${channel.name}`}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <div className="flex items-center gap-3 mr-1">
                        <Gift className="w-6 h-6 text-[#B5BAC1] hover:text-[#DBDEE1] cursor-pointer" />
                        <Sticker className="w-6 h-6 text-[#B5BAC1] hover:text-[#DBDEE1] cursor-pointer" />
                        <Smile className="w-6 h-6 text-[#B5BAC1] hover:text-[#DBDEE1] cursor-pointer" />
                    </div>
                </div>
            </div>
        </div>
    );
}