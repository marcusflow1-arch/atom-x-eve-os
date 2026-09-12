import React, { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Send, Shield, ShieldAlert, Crown, MessageSquare } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

const invoke = async (action, data) => {
    const result = await base44.functions.invoke('clanOperations', { action, data });
    const payload = result?.data || result;
    if (payload?.success === false) throw new Error(payload.error || 'Clan chat request failed');
    return payload;
};

export default function ZoneChatPanel({ clanId, gameId, zoneId, title, className = '' }) {
    const queryClient = useQueryClient();
    const [message, setMessage] = useState('');
    const scrollRef = useRef(null);
    const channelKey = `${gameId || 'global'}_${zoneId}`;

    const { data: messages = [] } = useQuery({
        queryKey: ['zoneChatMessages', clanId, channelKey],
        queryFn: async () => {
            if (!clanId) return [];
            const payload = await invoke('list_messages', { clanId, channelId: channelKey });
            return payload.messages || [];
        },
        enabled: !!clanId,
        refetchInterval: 3500,
    });

    useEffect(() => {
        if (!clanId) return undefined;
        const unsub = base44.entities.ClanMessage.subscribe((event) => {
            if (event.data?.divisionId === clanId && event.data?.channelId === channelKey) {
                queryClient.invalidateQueries({ queryKey: ['zoneChatMessages', clanId, channelKey] });
            }
        });
        return () => { try { unsub?.(); } catch (_) {} };
    }, [clanId, channelKey, queryClient]);

    const sendMutation = useMutation({
        mutationFn: (content) => invoke('send_message', { clanId, channelId: channelKey, content }),
        onSuccess: () => {
            setMessage('');
            queryClient.invalidateQueries({ queryKey: ['zoneChatMessages', clanId, channelKey] });
        },
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            const viewport = scrollRef.current?.querySelector?.('[data-radix-scroll-area-viewport]');
            if (viewport) viewport.scrollTop = viewport.scrollHeight;
        }, 80);
        return () => clearTimeout(timer);
    }, [messages.length]);

    const handleSendMessage = (event) => {
        event.preventDefault();
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
            <div className="p-3 border-b border-white/5 bg-white/5 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-white/35" />
                <span className="text-xs font-bold text-white/50 uppercase tracking-wider">{title || 'Zone Chat'}</span>
                <span className="ml-auto text-[9px] text-white/25">Text comms</span>
            </div>

            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className="group flex gap-3 hover:bg-white/5 p-2 rounded-lg transition-colors -mx-2">
                            <Avatar className="w-8 h-8 border border-white/10 mt-1">
                                {msg.authorAvatar && <AvatarImage src={msg.authorAvatar} />}
                                <AvatarFallback className="bg-slate-700 text-white text-xs font-bold">{(msg.author || 'U')[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-bold text-sm text-white/90 truncate">{msg.author}</span>
                                    {msg.role && <Badge variant="outline" className={`text-[9px] h-4 px-1 gap-1 ${getRoleColor(msg.role)}`}>{getRoleIcon(msg.role)}{msg.role}</Badge>}
                                    <span className="text-[9px] text-white/30 ml-auto">{msg.created_date ? format(new Date(msg.created_date), 'h:mm a') : ''}</span>
                                </div>
                                <p className="text-white/70 text-sm leading-snug break-words">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    {messages.length === 0 && <div className="text-center text-white/20 text-xs py-10 italic">No messages yet. Start the conversation.</div>}
                </div>
            </ScrollArea>

            <div className="p-3 border-t border-white/10 bg-black/20">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        maxLength={4000}
                        className="flex-1 bg-white/5 border-white/10 h-9 text-sm text-white placeholder:text-white/30 focus-visible:ring-blue-500/50"
                        placeholder="Type a message..."
                    />
                    <Button type="submit" size="icon" disabled={!message.trim() || sendMutation.isPending} className="h-9 w-9 bg-white/10 hover:bg-white/20 text-white"><Send className="w-4 h-4" /></Button>
                </form>
            </div>
        </div>
    );
}
