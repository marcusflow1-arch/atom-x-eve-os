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



    </div>
  );
}