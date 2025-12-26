import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Hash, MoreVertical, Search, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClanChat({ clan, channel }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [message, setMessage] = useState('');
    const scrollRef = useRef(null);

    const { data: messages } = useQuery({
        queryKey: ['clanMessages', channel?.id],
        queryFn: async () => {
            if (!channel?.id) return [];
            const msgs = await base44.entities.ClanMessage.filter({ channelId: channel.id });
            return msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        },
        enabled: !!channel?.id,
        refetchInterval: 3000 // Simple polling for now
    });

    const sendMessageMutation = useMutation({
        mutationFn: (content) => base44.entities.ClanMessage.create({
            divisionId: clan.id,
            channelId: channel.id,
            author: user.full_name || user.email.split('@')[0],
            authorAvatar: user.avatar_url,
            content: content,
            userId: user.id // Assuming we add this for better tracking
        }),
        onSuccess: () => {
            setMessage('');
            queryClient.invalidateQueries(['clanMessages']);
        }
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (message.trim()) {
            sendMessageMutation.mutate(message);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900/30 backdrop-blur-sm rounded-r-2xl">
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <Hash className="w-5 h-5 text-slate-400" />
                    <div>
                        <h3 className="font-bold text-white">{channel.name}</h3>
                        <p className="text-xs text-white/40">General Discussion</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                            placeholder="Search..." 
                            className="bg-slate-800/50 border-none rounded-full pl-9 pr-4 py-1.5 text-xs text-white w-48 focus:ring-1 focus:ring-white/20 outline-none"
                        />
                    </div>
                    <Button variant="ghost" size="icon" className="text-white/40 hover:text-white">
                        <Bell className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4" ref={scrollRef}>
                {messages?.map((msg, i) => {
                    const isMe = msg.userId === user.id || msg.author === (user.full_name || user.email.split('@')[0]);
                    const showHeader = i === 0 || messages[i-1].author !== msg.author || (new Date(msg.created_date) - new Date(messages[i-1].created_date) > 300000);

                    return (
                        <div key={msg.id} className={`group ${showHeader ? 'mt-4' : 'mt-1'}`}>
                            {showHeader && (
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden">
                                        {msg.authorAvatar ? (
                                            <img src={msg.authorAvatar} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                                                {msg.author[0]}
                                            </div>
                                        )}
                                    </div>
                                    <span className="font-bold text-sm text-white hover:underline cursor-pointer">
                                        {msg.author}
                                    </span>
                                    <span className="text-[10px] text-white/30">
                                        {format(new Date(msg.created_date), 'h:mm a')}
                                    </span>
                                </div>
                            )}
                            <div className="pl-11">
                                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input */}
            <div className="p-4 bg-slate-900/50 border-t border-white/10">
                <form onSubmit={handleSend} className="relative">
                    <Input
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder={`Message #${channel.name}`}
                        className="bg-slate-800 border-white/10 h-12 rounded-xl pl-4 pr-12 text-white focus:ring-blue-500/50 focus:border-blue-500"
                    />
                    <Button 
                        type="submit" 
                        size="icon"
                        className="absolute right-2 top-2 h-8 w-8 bg-blue-600 hover:bg-blue-700 rounded-lg"
                        disabled={!message.trim()}
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}