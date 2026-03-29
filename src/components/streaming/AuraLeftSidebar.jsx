import React from 'react';
import { Library, Users, PlaySquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AuraLeftSidebar() {
  const navigate = useNavigate();

  return (
    <div className="w-[5%] min-w-[80px] h-full border-r border-white/20 bg-black/20 relative z-40 flex-shrink-0 shadow-[5px_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm flex flex-col items-center py-6">
      
      {/* Recently Watched Streams Section */}
      <div className="flex flex-col items-center w-full px-2 mt-20">
        <span className="text-[9px] uppercase tracking-wider text-white/50 font-bold text-center mb-1 leading-tight">Recently<br/>Watched<br/>Streams</span>
        <div className="w-8 h-px bg-white/20 mb-4 mt-2" />
        
        <div className="flex flex-col gap-3 w-full items-center">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center shadow-lg">
              <span className="text-white/30 text-lg font-bold">?</span>
            </div>
          ))}
        </div>
      </div>

      {/* Middle buttons */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full px-2">
        <button 
          onClick={() => navigate(createPageUrl('Store') + '?subview=library')}
          className="w-14 h-14 rounded-xl border border-transparent hover:border-cyan-400/50 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-1 transition-all group shadow-lg"
          title="Libraries"
        >
          <Library className="w-5 h-5 text-white/60 group-hover:text-cyan-400" />
          <span className="text-[8px] font-bold uppercase tracking-wider text-white/50 group-hover:text-cyan-400 mt-0.5">Library</span>
        </button>

        <button 
          className="w-14 h-14 rounded-xl border border-transparent hover:border-green-400/50 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-1 transition-all group shadow-lg"
          title="Friends"
        >
          <Users className="w-5 h-5 text-white/60 group-hover:text-green-400" />
          <span className="text-[8px] font-bold uppercase tracking-wider text-white/50 group-hover:text-green-400 mt-0.5">Friends</span>
        </button>

        <button 
          onClick={() => navigate(createPageUrl('Aura'))}
          className="w-14 h-14 rounded-xl border border-transparent hover:border-pink-400/50 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-1 transition-all group shadow-lg"
          title="Watch Streams"
        >
          <PlaySquare className="w-5 h-5 text-white/60 group-hover:text-pink-400" />
          <span className="text-[8px] font-bold uppercase tracking-wider text-white/50 group-hover:text-pink-400 mt-0.5 text-center leading-tight">Watch<br/>Streams</span>
        </button>
      </div>

    </div>
  );
}