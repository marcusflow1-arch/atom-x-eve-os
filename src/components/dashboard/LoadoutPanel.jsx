import React from 'react';

export default function LoadoutPanel() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black text-xs tracking-widest uppercase">Preset D</h3>
        <div className="flex gap-1">
          {['A', 'B', 'C', 'D'].map((preset) => (
            <button
              key={preset}
              className={`w-7 h-7 rounded-md text-[10px] font-bold transition-all flex items-center justify-center ${
                preset === 'D'
                  ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]'
                  : 'bg-black/50 text-white/60 hover:bg-black/60 hover:text-white border border-slate-700'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Weapons Section */}
      <div className="space-y-2">
        <div className="text-white font-black text-[9px] uppercase tracking-widest">Weapons</div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="aspect-square rounded-xl bg-black/50 border border-slate-700 hover:border-slate-500 hover:bg-black/60 transition-all cursor-pointer" />
          ))}
        </div>
      </div>

      {/* Equipment Section */}
      <div className="space-y-2">
        <div className="text-white font-black text-[9px] uppercase tracking-widest">Equipment</div>
        <div className="grid grid-cols-3 gap-3">
          {['Armor', 'Gloves', 'Boots', 'Legs', 'Ring', 'Cape'].map((item) => (
            <div key={item} className="aspect-square rounded-xl bg-black/50 border border-slate-700 hover:border-slate-500 hover:bg-black/60 transition-all cursor-pointer flex items-center justify-center group">
              <span className="text-white/60 text-[8px] group-hover:text-white/80 transition-colors">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Aspect Section */}
      <div className="space-y-2">
        <div className="text-white font-black text-[9px] uppercase tracking-widest">Aspect</div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="aspect-square rounded-xl bg-black/50 border border-slate-700 hover:border-slate-500 hover:bg-black/60 transition-all cursor-pointer" />
          ))}
        </div>
      </div>

      {/* Artifacts Section */}
      <div className="space-y-2">
        <div className="text-white font-black text-[9px] uppercase tracking-widest">Artifacts</div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="aspect-square rounded-xl bg-black/50 border border-slate-700 hover:border-slate-500 hover:bg-black/60 transition-all cursor-pointer" />
          ))}
        </div>
      </div>
    </div>
  );
}