import React, { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Send, Shield, ShieldAlert, Crown, Mic, MessageSquare } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

export default function ZoneChatPanel({ clanId, gameId, zoneId, title, className }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [message, setMessage] = useState('');
    const [chatMode, setChatMode] = useState('text'); // 'text' | 'voice'
    const scrollRef = useRef(null);

    // Fetch messages from ClanMessage entity filtered by clanId + channelId (we use zoneId as channelId)
    const channelKey = `${gameId || 'global'}_${zoneId}`;
    
    const { data: messages = [] } = useQuery({
        queryKey: ['zoneChatMessages', clanId, channelKey],
        queryFn: async () => {
            if (!clanId) return [];
            const msgs = await base44.entities.ClanMessage.filter(
                { divisionId: clanId, channelId: channelKey },
                'created_date',
                100
            );
            return msgs || [];
        },
        enabled: !!clanId,
        refetchInterval: 4000,
    });

    // Real-time subscription
    useEffect(() => {
        if (!clanId) return;
        const unsub = base44.entities.ClanMessage.subscribe((event) => {
            if (event.data?.divisionId === clanId && event.data?.channelId === channelKey) {
                queryClient.invalidateQueries({ queryKey: ['zoneChatMessages', clanId, channelKey] });
            }
        });
        return unsub;
    }, [clanId, channelKey, queryClient]);

    const sendMutation = useMutation({
        mutationFn: (content) => base44.entities.ClanMessage.create({
            divisionId: clanId,
            channelId: channelKey,
            author: user?.full_name || user?.email?.split('@')[0] || 'Unknown',
            authorAvatar: user?.avatar_url || '',
            content,
            userId: user?.id,
            isAnnouncement: false,
            isPinned: false,
        }),
        onSuccess: () => {
            setMessage('');
            queryClient.invalidateQueries({ queryKey: ['zoneChatMessages', clanId, channelKey] });
        },
    });

    // Auto-scroll on new messages
    useEffect(() => {
        setTimeout(() => {
            if (scrollRef.current) {
                const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
                if (viewport) viewport.scrollTop = viewport.scrollHeight;
            }
        }, 100);
    }, [messages?.length]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!message.trim() || !clanId) return;
        sendMutation.mutate(message.trim());
    };

    const getRoleIcon = (role) => {
        if (role === 'leader') return <Crown className="w-3 h-3 text-amber-500" />;
        if (role === 'officer') return <ShieldAlert className="w-3 h-3 text-blue-400" />;
        return <Shield className="w-3 h-3 text-slate-500" />;
    };

    const getRoleColor = (role) => {
        if (role === 'leader') return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
        if (role === 'officer') return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
        return 'text-slate-400 border-slate-500/30 bg-slate-500/10';
    };

    return (
        <div className={`flex flex-col h-full bg-black/20 border-l border-white/5 ${className}`}>
            {/* Header with mode toggle */}
            <div className="p-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-white/50 uppercase tracking-wider">{title || 'Zone Chat'}</span>
                <div className="flex gap-1">
                    <button
                        onClick={() => setChatMode('text')}
                        className={`p-1.5 rounded-lg transition-all ${chatMode === 'text' ? 'bg-blue-500/20 text-blue-400' : 'text-white/30 hover:text-white/60'}`}
                        title="Text Chat"
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => setChatMode('voice')}
                        className={`p-1.5 rounded-lg transition-all ${chatMode === 'voice' ? 'bg-green-500/20 text-green-400' : 'text-white/30 hover:text-white/60'}`}
                        title="Voice Chat"
                    >
                        <Mic className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {chatMode === 'voice' ? (
                /* Voice Chat UI */
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4">
                        <Mic className="w-8 h-8 text-green-400" />
                    </div>
                    <h4 className="text-white font-medium mb-1">Voice Channel</h4>
                    <p className="text-white/40 text-xs mb-4">Connect to talk with your team</p>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-2">
                        <Mic className="w-4 h-4" /> Join Voice
                    </Button>
                    <div className="mt-6 w-full">
                        <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">No participants</p>
                    </div>
                </div>
            ) : (
                /* Text Chat UI */
                <>
                    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className="group flex gap-3 hover:bg-white/5 p-2 rounded-lg transition-colors -mx-2">
                                    <Avatar className="w-8 h-8 border border-white/10 mt-1">
                                        {msg.authorAvatar && <AvatarImage src={msg.authorAvatar} />}
                                        <AvatarFallback className="bg-slate-700 text-white text-xs font-bold">
                                            {(msg.author || 'U')[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-bold text-sm text-white/90 truncate">{msg.author}</span>
                                            {msg.role && (
                                                <Badge variant="outline" className={`text-[9px] h-4 px-1 gap-1 ${getRoleColor(msg.role)}`}>
                                                    {getRoleIcon(msg.role)}
                                                    {msg.role}
                                                </Badge>
                                            )}
                                            <span className="text-[9px] text-white/30 ml-auto">
                                                {msg.created_date ? format(new Date(msg.created_date), 'h:mm a') : ''}
                                            </span>
                                        </div>
                                        <p className="text-white/70 text-sm leading-snug break-words">{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                            {messages.length === 0 && (
                                <div className="text-center text-white/20 text-xs py-10 italic">
                                    No messages yet. Start the conversation.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                    
                    <div className="p-3 border-t border-white/10 bg-black/20">
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <Input 
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="flex-1 bg-white/5 border-white/10 h-9 text-sm text-white placeholder:text-white/30 focus-visible:ring-blue-500/50"
                                placeholder="Type a message..."
                            />
                            <Button type="submit" size="icon" disabled={!message.trim() || sendMutation.isPending} className="h-9 w-9 bg-white/10 hover:bg-white/20 text-white">
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
}