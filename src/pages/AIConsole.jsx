import React, { useState, useEffect } from 'react';
import AI3DScene from '../components/ai/AI3DScene';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Bot, Mic, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function AIConsolePage() {
    const [isNearAI, setIsNearAI] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [viewMode, setViewMode] = useState('first'); // 'first' or 'third'
    const [messages, setMessages] = useState([
        { role: 'system', content: 'Initializing AI Neural Interface...' },
        { role: 'assistant', content: 'Welcome, Traveler. I am the architect of this digital realm. Approach me to converse.' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Listen for 'E' key to interact
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key.toLowerCase() === 'e' && isNearAI) {
                setIsChatOpen(true);
                document.exitPointerLock(); // Unlock mouse so user can type
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isNearAI]);

    const sendMessage = async () => {
        if (!input.trim()) return;
        
        const newMessages = [...messages, { role: 'user', content: input }];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            // Call secure backend function
            const response = await base44.functions.invoke('secureLLM', {
                prompt: `You are a sentient AI Avatar in a 3D cyberpunk world. 
                User says: ${input}
                Respond concisely and in character (futuristic, helpful, slightly enigmatic).`
            });
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to get response');
            }
            
            let reply = typeof response.result === 'string' ? response.result : JSON.stringify(response.result);
            if (reply.startsWith('"') && reply.endsWith('"')) reply = reply.slice(1, -1);

            setMessages([...newMessages, { role: 'assistant', content: reply }]);
        } catch (error) {
            console.error("AI Error:", error);
            setMessages([...newMessages, { role: 'system', content: 'Connection interrupted. Neural link unstable.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden">
            {/* 3D World Layer */}
            <AI3DScene onNearAI={setIsNearAI} viewMode={viewMode} />

            {/* HUD Layer */}
            <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
                {/* Top Bar */}
                <div className="flex justify-between items-start">
                    <div className="bg-black/60 backdrop-blur-md border border-cyan-500/30 p-4 rounded-lg text-cyan-400 font-mono">
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <Bot className="w-6 h-6" />
                            NEURAL CONSOLE v9.0
                        </h1>
                        <p className="text-xs opacity-70">System Status: ONLINE</p>
                    </div>
                    
                    <div className="bg-black/60 backdrop-blur-md border border-cyan-500/30 p-4 rounded-lg text-white font-mono text-right">
                        <p className="text-xs opacity-70">COORDINATES</p>
                        <p className="text-lg">X: 42.0 | Y: 12.5 | Z: -08.2</p>
                        <div className="mt-2 flex justify-end pointer-events-auto">
                             <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setViewMode(prev => prev === 'first' ? 'third' : 'first')}
                                className="bg-black/40 border-cyan-500/50 text-cyan-400 hover:bg-cyan-900/30"
                            >
                                {viewMode === 'first' ? 'SWITCH TO 3RD PERSON' : 'SWITCH TO 1ST PERSON'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Interaction Prompt */}
                <AnimatePresence>
                    {isNearAI && !isChatOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 bg-black/80 border border-cyan-400 px-6 py-3 rounded-full backdrop-blur-lg"
                        >
                            <p className="text-cyan-400 font-bold font-mono flex items-center gap-2">
                                <span className="bg-cyan-500 text-black px-2 py-0.5 rounded text-sm">E</span>
                                TO INTERFACE WITH AI
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Controls Hint */}
                {!isChatOpen && (
                    <div className="absolute bottom-6 left-6 text-white/50 text-xs font-mono">
                        [WASD] MOVE • [MOUSE] LOOK • [CLICK] CAPTURE CURSOR
                    </div>
                )}
            </div>

            {/* Chat Interface Overlay */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto z-50"
                    >
                        <Card className="w-full max-w-2xl bg-slate-950/90 border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.2)] text-cyan-100">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-cyan-900/50 pb-4">
                                <CardTitle className="flex items-center gap-3 font-mono text-cyan-400">
                                    <Bot className="w-6 h-6" />
                                    AI COMPANION INTERFACE
                                </CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)} className="text-cyan-400 hover:text-white hover:bg-cyan-900/50">
                                    <X className="w-5 h-5" />
                                </Button>
                            </CardHeader>
                            
                            <CardContent className="p-0">
                                {/* Chat History */}
                                <div className="h-[400px] overflow-y-auto p-6 space-y-4 font-mono scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-transparent">
                                    {messages.map((msg, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div 
                                                className={`max-w-[80%] p-3 rounded-lg ${
                                                    msg.role === 'user' 
                                                    ? 'bg-cyan-900/40 border border-cyan-700 text-cyan-100' 
                                                    : msg.role === 'system'
                                                    ? 'bg-red-900/20 border border-red-900/50 text-red-300 text-xs'
                                                    : 'bg-slate-900/80 border border-slate-700 text-slate-300'
                                                }`}
                                            >
                                                {msg.role !== 'user' && (
                                                    <div className="text-[10px] opacity-50 mb-1 uppercase tracking-wider">
                                                        {msg.role === 'assistant' ? 'AI CORE' : 'SYSTEM'}
                                                    </div>
                                                )}
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700 flex items-center gap-2">
                                                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" />
                                                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-75" />
                                                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-150" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Input Area */}
                                <div className="p-4 border-t border-cyan-900/50 bg-slate-950/50 flex gap-2">
                                    <Input 
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        placeholder="Transmit message to AI Core..."
                                        className="bg-slate-900/50 border-cyan-900/50 text-cyan-100 focus:border-cyan-500 focus:ring-cyan-900 font-mono"
                                    />
                                    <Button onClick={sendMessage} className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold">
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}