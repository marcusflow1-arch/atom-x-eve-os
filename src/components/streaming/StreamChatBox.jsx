import React from 'react';
import { MessageSquare, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function StreamChatBox({ isLive }) {
  return (
    <div
      className="h-full overflow-hidden flex flex-col rounded-2xl bg-[#0b1018] shadow-[0_24px_70px_rgba(0,0,0,.42),0_8px_26px_rgba(0,0,0,.24)]"
    >
      <div className="px-5 py-4 flex items-center justify-between bg-gradient-to-b from-white/[0.045] to-transparent">
        <span className="text-white font-bold text-sm flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" /> Stream Chat
        </span>
        {isLive ? (
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Online</span></div>
        ) : (
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-500" /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Offline</span></div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative scrollbar-hide">
        {isLive ? (
          <>
            <div className="text-center py-4"><p className="text-xs text-white/30 uppercase tracking-widest font-bold">Welcome to the chat</p></div>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-3 items-start animate-in slide-in-from-bottom-2 fade-in duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex-shrink-0 overflow-hidden p-0.5">
                  <img src={`https://source.unsplash.com/random/100x100?face&sig=${i}`} className="w-full h-full object-cover rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-2"><span className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer">Viewer_{i + 1}</span>{i % 3 === 0 && <Badge className="bg-purple-500/20 text-purple-300 text-[8px] h-4 px-1 border-0">SUB</Badge>}<span className="text-[10px] text-white/20">{format(new Date(), 'h:mm a')}</span></div>
                  <p className="text-sm text-white/80 leading-snug mt-0.5 font-medium shadow-black drop-shadow-sm">This is a simulated chat message! loving the stream!</p>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4"><MessageSquare className="w-6 h-6 opacity-40" /></div>
            <p className="text-sm font-medium">Chat is offline</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-gradient-to-t from-black/20 to-transparent">
        <div className="relative">
          <input disabled={!isLive} placeholder={isLive ? 'Send a message...' : 'Chat is disabled when offline'} className="w-full h-11 rounded-xl bg-black/35 px-4 text-sm text-white focus:outline-none focus:bg-black/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-white/20 shadow-inner" />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white" disabled={!isLive}><Settings className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
