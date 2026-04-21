import React from 'react';
import { GripVertical, Users, Play, Settings, Heart, Gamepad2, Radio, Gift, LogOut } from 'lucide-react';

export default function LunaLeftRail({ isEnvironmentActive, onToggleEnvironment }) {
  return (
    <div className="w-[5%] min-w-[80px] h-full border-r border-white/20 bg-black/20 relative z-40 flex-shrink-0 shadow-[5px_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm flex flex-col items-center py-6">
      {/* Top: Play Button */}
      <button className="w-10 h-10 rounded-lg bg-green-600 hover:bg-green-500 flex items-center justify-center transition-colors mb-4 shadow-lg">
        <Play className="w-5 h-5 text-white fill-white" />
      </button>

      {/* Widget Editor / Settings */}
      <button className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors mb-6 border border-white/20">
        <Settings className="w-5 h-5 text-white/70" />
      </button>

      {/* Recently Played */}
      <div className="px-2 flex flex-col items-center w-full">
        <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold text-center mb-1">Recently<br />Played</span>
        <div className="w-8 h-px bg-white/20 mb-3" />

        <div className="flex flex-col gap-2 w-full items-center">
          {[1, 2, 3, 4, 5].map((i) =>
          <div key={i} className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
              <span className="text-white/30 text-lg font-bold">?</span>
            </div>
          )}
        </div>

        <div className="mt-3 mb-3 ml-2 w-8 h-px bg-white/20" />
      </div>

      {/* Middle Buttons */}
      <div className="flex flex-col gap-3 w-full items-center mb-6">
        {/* Recommended Friends */}
        <button className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10" title="Recommended Friends">
          <Users className="w-5 h-5 text-white/70" />
        </button>

        {/* Library */}
        <button className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10" title="Library">
          <Gamepad2 className="w-5 h-5 text-white/70" />
        </button>

        {/* Rewards */}
        <button className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10" title="Rewards">
          <Gift className="w-5 h-5 text-white/70" />
        </button>

        {/* Entertainment */}
        <button className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10" title="Entertainment">
          <Radio className="w-5 h-5 text-white/70" />
        </button>
      </div>















      

      <div className="bg-white/20 mb-6 ml-2 mt-1 w-8 h-px" />

      {/* Bottom Buttons */}
      <div className="flex flex-col gap-3 mt-auto w-full items-center">
        {/* Favorites */}
        <button className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10" title="Favorites">
          <Heart className="w-5 h-5 text-white/70" />
        </button>

        {/* Logout */}
        <button className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10" title="Logout">
          <LogOut className="w-5 h-5 text-white/70" />
        </button>
      </div>




      
    </div>);

}