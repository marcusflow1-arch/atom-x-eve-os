import React, { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Send, Plus, Shield, ShieldAlert, Crown } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';

export default function ZoneChatPanel({ clanId, gameId, zoneId, title, className }) {
    const { user } = useAuth();
    const [message, setMessage] = useState('');
    const scrollRef = useRef(null);
    
    // Mock Store for messages (In reality, this would be a backend query filtered by clanId+gameId+zoneId)
    const [messages, setMessages] = useState([]);

    // Load initial mock messages based on zone to demonstrate separation
    useEffect(() => {
        const initialMessages = [];
        if (zoneId === 'farming') {
            initialMessages.push({ id: 1, user: 'FarmerJoe', role: 'Member', text: 'Found a huge iron vein at [45, 22]', time: '10:15 AM' });
        } else if (zoneId === 'strategy') {
            initialMessages.push({ id: 1, user: 'Tactician', role: 'Officer', text: 'Review the phase 3 map before pull.', time: '09:00 AM' });
        } else if (zoneId === 'exploration') {
            initialMessages.push({ id: 1, user: 'Scout', role: 'Member', text: 'Enemy patrol spotted north.', time: '11:20 AM' });
        } else {
            initialMessages.push({ id: 1, user: 'Admin', role: 'Leader', text: 'Welcome to the general channel.', time: '08:00 AM' });
        }
        setMessages(initialMessages);
    }, [zoneId]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        
        const newMessage = {
            id: Date.now(),
            user: user?.username || 'Me',
            role: 'Member', // Mock role - normally derived from clan membership
            text: message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setMessages(prev => [...prev, newMessage]);
        setMessage('');
        
        // Auto-scroll
        setTimeout(() => {
            if (scrollRef.current) {
                const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
                if (scrollElement) scrollElement.scrollTop = scrollElement.scrollHeight;
            }
        }, 100);
    };

    const getRoleIcon = (role) => {
        if (role === 'Leader') return <Crown className="w-3 h-3 text-amber-500" />;
        if (role === 'Officer') return <ShieldAlert className="w-3 h-3 text-blue-400" />;
        return <Shield className="w-3 h-3 text-slate-500" />;
    };

    const getRoleColor = (role) => {
        if (role === 'Leader') return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
        if (role === 'Officer') return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
        return 'text-slate-400 border-slate-500/30 bg-slate-500/10';
    };

    return (
        <div className={`flex flex-col h-full bg-black/20 border-l border-white/5 ${className}`}>
            <div className="p-3 border-b border-white/5 bg-white/5">
                <span className="text-xs font-bold text-white/50 uppercase tracking-wider">{title || 'Zone Chat'}</span>
            </div>
            
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className="group flex gap-3 hover:bg-white/5 p-2 rounded-lg transition-colors -mx-2">
                            <Avatar className="w-8 h-8 border border-white/10 mt-1">
                                <AvatarFallback className="bg-slate-700 text-white text-xs font-bold">{msg.user[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-bold text-sm text-white/90 truncate">{msg.user}</span>
                                    <Badge variant="outline" className={`text-[9px] h-4 px-1 gap-1 ${getRoleColor(msg.role)}`}>
                                        {getRoleIcon(msg.role)}
                                        {msg.role}
                                    </Badge>
                                    <span className="text-[9px] text-white/30 ml-auto">{msg.time}</span>
                                </div>
                                <p className="text-white/70 text-sm leading-snug break-words">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {messages.length === 0 && (
                        <div className="text-center text-white/20 text-xs py-10 italic">
                            No signals in this sector.
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
                        placeholder="Transmit..."
                    />
                    <Button type="submit" size="icon" className="h-9 w-9 bg-white/10 hover:bg-white/20 text-white">
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}