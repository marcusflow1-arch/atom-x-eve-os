import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Send } from 'lucide-react';

export default function ChatZone({ game, user }) {
    const [message, setMessage] = useState('');
    // Mock Chat Messages
    const [messages, setMessages] = useState([
        { id: 1, user: 'CommanderShepard', text: 'Raid starts in 30 mins. Gear check!', time: '10:00 AM' },
        { id: 2, user: 'LeeroyJenkins', text: 'I am ready!', time: '10:05 AM' },
    ]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        setMessages([...messages, {
            id: Date.now(),
            user: user?.username || 'Me',
            text: message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setMessage('');
    };

    return (
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className="group flex gap-4 hover:bg-white/5 p-2 rounded-lg transition-colors -mx-2">
                            <Avatar className="w-10 h-10 border border-white/10">
                                <AvatarFallback className="bg-slate-700 text-white font-bold">{msg.user[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-baseline gap-2">
                                    <span className="font-bold text-amber-400">{msg.user}</span>
                                    <span className="text-[10px] text-white/30">{msg.time}</span>
                                </div>
                                <p className="text-white/80 text-sm mt-1">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
            <div className="p-4 border-t border-white/10 bg-black/20">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <div className="relative flex-1">
                        <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 cursor-pointer hover:text-white" />
                        <input 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 transition-colors"
                            placeholder={`Message #${game.title}...`}
                        />
                    </div>
                    <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-500 w-12 h-12 rounded-xl">
                        <Send className="w-5 h-5" />
                    </Button>
                </form>
            </div>
        </div>
    );
}