
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Mic, Play, AudioWaveform } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Message = ({ msg }) => {
    const isVoice = msg.type === 'voice';
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-2 p-2 rounded-lg ${isVoice ? 'bg-blue-900/50' : 'bg-slate-800/50'}`}
        >
            <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center font-bold text-sm">{msg.author.charAt(0)}</div>
            <div className="flex-grow">
                <p className="font-bold text-blue-300 text-sm">{msg.author}</p>
                {isVoice ? (
                    <div className="flex items-center gap-2 mt-1 cursor-pointer group">
                        <Play className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
                        <AudioWaveform className="w-10 h-5 text-slate-400 group-hover:text-slate-200 transition-colors" />
                        <span className="text-xs text-slate-400">0:07</span>
                    </div>
                ) : (
                    <p className="text-slate-200">{msg.content}</p>
                )}
            </div>
        </motion.div>
    );
};

export default function StreamChatPanel() {
    const [messages, setMessages] = useState([
        { id: 1, author: 'Shadow_Stryker', content: 'This game looks amazing!', type: 'text' },
        { id: 2, author: 'Glitch_Witch', content: 'Hey everyone!', type: 'text' },
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const chatEndRef = useRef(null);

    const handleSend = () => {
        if (newMessage.trim()) {
            setMessages([...messages, { id: Date.now(), author: 'You', content: newMessage, type: 'text' }]);
            setNewMessage('');
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };
    
    const handleVoiceMessage = () => {
        setIsRecording(true);
        setTimeout(() => {
            setMessages([...messages, { id: Date.now(), author: 'You', content: 'Voice Message', type: 'voice' }]);
            setIsRecording(false);
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 1500); // Simulate recording
    };

    return (
        <div className="h-full flex flex-col bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
            <h3 className="text-lg font-bold p-4 border-b border-slate-700/50">Live Chat</h3>
            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                {messages.map(msg => <Message key={msg.id} msg={msg} />)}
                <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t border-slate-700/50 flex items-center gap-2">
                <Input
                    placeholder="Say something..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    className="bg-slate-800 border-slate-700"
                />
                <Button size="icon" onClick={handleSend}><Send className="w-4 h-4" /></Button>
                <Button
                    size="icon"
                    variant={isRecording ? "destructive" : "outline"}
                    onClick={handleVoiceMessage}
                    disabled={isRecording}
                >
                    <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} />
                </Button>
            </div>
        </div>
    );
}
