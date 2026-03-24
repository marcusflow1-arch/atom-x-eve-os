import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Hash, MoreVertical, Search, Bell, Megaphone, Trash2, Shield, ShieldAlert, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClanChat({ clan, channel, myRole }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [message, setMessage] = useState('');
    const [isAnnouncement, setIsAnnouncement] = useState(false);
    const scrollRef = useRef(null);

    // Fetch My Member Role (fallback if myRole not passed)
    const { data: myMember } = useQuery({
        queryKey: ['myClanMemberRole', clan.id, user.id],
        queryFn: async () => {
            const members = await base44.entities.ClanMember.filter({ divisionId: clan.id, userId: user.id });
            return members[0];
        },
        enabled: !!clan.id && !!user.id && !myRole
    });

    const effectiveRole = myRole || myMember?.role || 'member';
    const canModerate = effectiveRole === 'leader' || effectiveRole === 'officer';

    // Check if user can post in this channel based on role_restriction
    const channelRestriction = channel?.role_restriction || 'none';
    const canPostInChannel = (() => {
        if (channelRestriction === 'none') return true;
        if (channelRestriction === 'officer') return effectiveRole === 'officer' || effectiveRole === 'leader';
        if (channelRestriction === 'leader') return effectiveRole === 'leader';
        return true;
    })();

    // Fetch Messages
    const { data: messages } = useQuery({
        queryKey: ['clanMessages', channel?.id],
        queryFn: async () => {
            if (!channel?.id) return [];
            const msgs = await base44.entities.ClanMessage.filter({ channelId: channel.id });
            // In a real app we would join with ClanMember to get up-to-date roles, 
            // but for now we'll assume author metadata or just display current user's role logic
            return msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        },
        enabled: !!channel?.id,
        refetchInterval: 3000 
    });

    const sendMessageMutation = useMutation({
        mutationFn: (content) => base44.entities.ClanMessage.create({
            divisionId: clan.id,
            channelId: channel.id,
            author: user.full_name || user.email.split('@')[0],
            authorAvatar: user.avatar_url,
            content: content,
            userId: user.id,
            isAnnouncement: isAnnouncement,
            role: myMember?.role || 'member' // Snapshot role at time of posting
        }),
        onSuccess: () => {
            setMessage('');
            setIsAnnouncement(false);
            queryClient.invalidateQueries(['clanMessages']);
        }
    });

    const deleteMessageMutation = useMutation({
        mutationFn: async (msgId) => {
            const res = await base44.functions.invoke('clanSystem', { 
                action: 'delete_message', 
                data: { messageId: msgId }
            });
            if (!res.ok) throw new Error(res.data?.error || 'Failed to delete message');
        },
        onSuccess: () => queryClient.invalidateQueries(['clanMessages'])
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

    const getRoleBadge = (role) => {
        if (role === 'leader') return <Badge className="h-5 px-1 bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]"><Crown className="w-3 h-3 mr-1" /> Leader</Badge>;
        if (role === 'officer') return <Badge className="h-5 px-1 bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px]"><ShieldAlert className="w-3 h-3 mr-1" /> Officer</Badge>;
        return null;
    };

    return (
        <div 
            className="flex flex-col h-full overflow-hidden"
            style={{
                background: 'rgba(255, 255, 255, 0.02)',
            }}
        >
            {/* Header */}
            <div 
                className="h-16 flex items-center justify-between px-6 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <Hash className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white tracking-wide">{channel.name}</h3>
                        <p className="text-[10px] text-white/40 uppercase tracking-wider">Secure Channel</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-blue-400 transition-colors" />
                        <input 
                            placeholder="Search logs..." 
                            className="bg-black/20 border border-white/5 rounded-full pl-9 pr-4 py-1.5 text-xs text-white w-48 focus:outline-none focus:border-blue-500/30 focus:bg-black/40 transition-all placeholder:text-white/20"
                        />
                    </div>
                    <div className="h-6 w-px bg-white/10" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/5">
                        <Bell className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3" ref={scrollRef}>
                {messages?.map((msg, i) => {
                    const isMe = msg.userId === user.id;
                    const showHeader = i === 0 || messages[i-1].author !== msg.author || (new Date(msg.created_date) - new Date(messages[i-1].created_date) > 300000);
                    
                    return (
                        <div key={msg.id} className={`group relative ${showHeader ? 'mt-4' : 'mt-1'} ${msg.isAnnouncement ? 'bg-amber-500/10 border border-amber-500/20 rounded-xl p-3' : ''}`}>
                            {msg.isAnnouncement && showHeader && (
                                <div className="flex items-center gap-2 mb-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                                    <Megaphone className="w-3 h-3" /> Announcement
                                </div>
                            )}
                            
                            {showHeader ? (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex-shrink-0 border border-white/10">
                                        {msg.authorAvatar ? (
                                            <img src={msg.authorAvatar} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                                                {msg.author?.[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-bold text-sm text-white hover:underline cursor-pointer">
                                                {msg.author}
                                            </span>
                                            {getRoleBadge(msg.role)}
                                            <span className="text-[10px] text-white/30 ml-auto">
                                                {format(new Date(msg.created_date), 'h:mm a')}
                                            </span>
                                        </div>
                                        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.isAnnouncement ? 'text-amber-100 font-medium' : 'text-slate-300'}`}>
                                            {msg.content}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="pl-11 pr-2 relative">
                                    <p className={`text-sm leading-relaxed whitespace-pre-wrap group-hover:bg-white/5 rounded-lg px-2 -ml-2 py-0.5 transition-colors ${msg.isAnnouncement ? 'text-amber-100 font-medium' : 'text-slate-300'}`}>
                                        {msg.content}
                                        <span className="text-[10px] text-white/20 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {format(new Date(msg.created_date), 'h:mm a')}
                                        </span>
                                    </p>
                                </div>
                            )}

                            {/* Moderation Actions */}
                            {canModerate && (
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-white/20 hover:text-white hover:bg-white/10">
                                                <MoreVertical className="w-3 h-3" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-32 p-1 bg-slate-900 border-white/10 text-white">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-8"
                                                onClick={() => deleteMessageMutation.mutate(msg.id)}
                                            >
                                                <Trash2 className="w-3 h-3 mr-2" /> Delete
                                            </Button>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Input */}
            <div 
                className="p-4 backdrop-blur-xl"
                style={{ 
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)' 
                }}
            >
                {canPostInChannel ? (
                    <form onSubmit={handleSend} className="relative flex flex-col gap-2">
                        {canModerate && (
                            <div className="flex items-center gap-2 px-1">
                                <button
                                    type="button"
                                    onClick={() => setIsAnnouncement(!isAnnouncement)}
                                    className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition-all ${
                                        isAnnouncement 
                                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/20' 
                                            : 'bg-white/5 text-white/40 hover:text-white/80 hover:bg-white/10 border border-white/5'
                                    }`}
                                >
                                    <Megaphone className="w-3 h-3" /> Announcement
                                </button>
                            </div>
                        )}
                        <div className="relative group">
                            <Input
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder={isAnnouncement ? "Broadcast announcement..." : `Message #${channel.name}`}
                                className={`
                                    h-14 rounded-2xl pl-5 pr-14 text-white transition-all
                                    ${isAnnouncement 
                                        ? 'bg-amber-950/20 border-amber-500/30 focus:border-amber-500/50 placeholder:text-amber-500/30' 
                                        : 'bg-black/40 border-white/10 focus:border-blue-500/40 focus:bg-black/60 placeholder:text-white/20'
                                    }
                                    backdrop-blur-md shadow-inner
                                `}
                            />
                            <Button 
                                type="submit" 
                                size="icon"
                                className={`
                                    absolute right-2 top-2 h-10 w-10 rounded-xl transition-all shadow-lg
                                    ${isAnnouncement 
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:brightness-110' 
                                        : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:brightness-110'
                                    }
                                    ${!message.trim() ? 'opacity-50 grayscale' : 'opacity-100'}
                                `}
                                disabled={!message.trim()}
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="flex items-center justify-center gap-2 py-4 text-white/30 text-sm">
                        <Shield className="w-4 h-4" />
                        <span>You do not have permission to send messages in this channel.</span>
                    </div>
                )}
            </div>
        </div>
    );
}