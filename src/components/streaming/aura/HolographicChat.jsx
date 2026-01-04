import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Send, Shield, Star, Crown } from 'lucide-react';

export default function HolographicChat({ isLive }) {
  const [messages, setMessages] = useState([
    { id: 1, user: "NeonRider", text: "This setup is insane! 🔥", type: "chat" },
    { id: 2, user: "CyberPunk_99", text: "Is that the new seasonal pass?", type: "chat" },
    { id: 3, user: "AuraSys", text: "Welcome to the stream!", type: "system" },
  ]);
  const [inputValue, setInputValue] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), user: "You", text: inputValue, type: "chat" }]);
    setInputValue("");
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden rounded-3xl"
         style={{
             background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(200,230,255,0.03) 100%)', // Translucent
             backdropFilter: 'blur(12px)',
             borderLeft: '1px solid rgba(255,255,255,0.08)'
         }}
    >
      {/* Chat Rules Header (Collapsible #12) */}
      <div className="p-4 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center justify-between text-xs font-medium text-white/60 uppercase tracking-wider">
            <span>Live Chat</span>
            <div className="flex items-center gap-2">
                <Shield className="w-3 h-3" />
                <span>Rules</span>
            </div>
        </div>
      </div>

      {/* Messages Area - Floating Text */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar mask-image-b">
        {messages.map((msg) => (
            <motion.div 
                key={msg.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`text-sm ${msg.type === 'system' ? 'text-cyan-300 italic' : 'text-white/90'}`}
            >
                {msg.type !== 'system' && (
                    <span className="font-bold text-white/50 mr-2 hover:text-cyan-400 cursor-pointer transition-colors">{msg.user}:</span>
                )}
                <span className="drop-shadow-md">{msg.text}</span>
            </motion.div>
        ))}
      </div>

      {/* Floating Reactions (#28) */}
      <div className="absolute bottom-20 right-4 pointer-events-none h-40 w-12 flex flex-col justify-end items-center">
        {/* Placeholder for reaction particles */}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gradient-to-t from-black/40 to-transparent">
        <form onSubmit={handleSend} className="relative group">
            <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Send a message..."
                className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-3 pr-10 text-sm text-white focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all placeholder:text-white/20"
                style={{
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' // Recessed feel
                }}
            />
            <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-cyan-400 hover:bg-white/10 transition-all"
            >
                <Send className="w-4 h-4" />
            </button>
        </form>
        
        {/* Quick Actions */}
        <div className="flex justify-between items-center mt-3 px-1">
            <button className="text-white/40 hover:text-pink-400 transition-colors">
                <Heart className="w-5 h-5" />
            </button>
            <button className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 flex items-center gap-2 transition-all">
                <Crown className="w-3 h-3 text-purple-400" />
                SUBSCRIBE
            </button>
        </div>
      </div>
    </div>
  );
}