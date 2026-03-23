import React from 'react';
import { Wheat, Grid } from 'lucide-react';

export default function ForumBottomNav({ activeTab, onTabSelect }) {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="flex items-center">
        <button
          onClick={() => onTabSelect('hub')}
          className={`relative px-6 py-2 flex items-center gap-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 mx-1 ${
            activeTab === 'hub'
              ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]'
              : 'text-white/60 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
          }`}
        >
          {activeTab === 'hub' && (
            <div className="absolute inset-0 bg-emerald-400/20 blur-md rounded-full -z-10 pointer-events-none" />
          )}
          <Grid className="w-4 h-4" />
          <span>Forum Hub</span>
        </button>

        <div className="w-px h-5 bg-white/10 mx-2" />

        <button
          onClick={() => onTabSelect('farm_hub')}
          className={`relative px-6 py-2 flex items-center gap-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 mx-1 ${
            activeTab === 'farm_hub'
              ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]'
              : 'text-white/60 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
          }`}
        >
          {activeTab === 'farm_hub' && (
            <div className="absolute inset-0 bg-yellow-400/20 blur-md rounded-full -z-10 pointer-events-none" />
          )}
          <Wheat className="w-4 h-4" />
          <span>Farm Hub</span>
        </button>
      </div>
    </div>
  );
}