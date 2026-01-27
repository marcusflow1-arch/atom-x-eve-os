import React from 'react';
import { MessageSquare, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function StreamChatBox({ isLive }) {
  return (
    <div 
        className="flex-[2] h-[400px] lg:h-full rounded-3xl overflow-hidden flex flex-col border border-white/10 shadow-2xl"
        style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
    >
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <span className="text-white font-bold text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" /> Stream Chat
            </span>
            {isLive ? (
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Online</span>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Offline</span>
                </div>
            )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative scrollbar-hide">
            {isLive ? (
                <>
                    <div className="text-center py-4">
                        <p className="text-xs text-white/30 uppercase tracking-widest font-bold">Welcome to the chat</p>
                    </div>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex gap-3 items-start animate-in slide-in-from-bottom-2 fade-in duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex-shrink-0 overflow-hidden p-0.5">
                                <img src={`https://source.unsplash.com/random/100x100?face&sig=${i}`} className="w-full h-full object-cover rounded-full" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer">Viewer_{i + 1}</span>
                                    {i % 3 === 0 && <Badge className="bg-purple-500/20 text-purple-300 text-[8px] h-4 px-1 border-0">SUB</Badge>}
                                    <span className="text-[10px] text-white/20">{format(new Date(), 'h:mm a')}</span>
                                </div>
                                <p className="text-sm text-white/80 leading-snug mt-0.5 font-medium shadow-black drop-shadow-sm">
                                    This is a simulated chat message! loving the stream!
                                </p>
                            </div>
                        </div>
                    ))}
                </>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <MessageSquare className="w-6 h-6 opacity-40" />
                    </div>
                    <p className="text-sm font-medium">Chat is offline</p>
                </div>
            )}
        </div>

        <div className="p-4 border-t border-white/10 bg-white/[0.02]">
            <div className="relative">
                <input 
                    disabled={!isLive}
                    placeholder={isLive ? "Send a message..." : "Chat is disabled when offline"}
                    className="w-full h-11 rounded-xl bg-black/40 border border-white/10 px-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-white/20"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white" disabled={!isLive}>
                        <Settings className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
}