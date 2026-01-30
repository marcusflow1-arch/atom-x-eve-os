import React from 'react';

export default function LunaStatsPanel() {
  const attributes = [
    { label: "Strength", value: 41 },
    { label: "Dexterity", value: 33 },
    { label: "Willpower", value: 36 },
    { label: "Wisdom", value: 50 },
    { label: "Wrath", value: 30 },
    { label: "Vitality", value: 178 },
    { label: "Persistence", value: 264 },
    { label: "Tenacious", value: 12 },
  ];

  const aiStats = [
    { label: "Health", value: 278 },
    { label: "Spirit", value: 364 },
    { label: "Physical (%)", value: 23 },
    { label: "Will (%)", value: 23 },
  ];

  const StatRow = ({ label, value }) => (
    <div className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0 group hover:bg-white/5 transition-colors px-2 rounded-lg">
      <span className="text-slate-300 font-light text-sm group-hover:text-white transition-colors">{label}</span>
      <span className="text-white font-mono font-medium">{value}</span>
    </div>
  );

  return (
    <div className="w-full max-w-sm flex flex-col gap-8">
      
      {/* AI Attributes Section */}
      <div>
        <div className="mb-4">
          <h3 className="text-xs font-bold tracking-[0.2em] text-white/50 uppercase mb-1">AI Attributes</h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
            <span className="text-[10px] font-mono text-green-400 uppercase tracking-wider">Online</span>
          </div>
        </div>
        
        <div className="flex flex-col">
          {attributes.map((stat, idx) => (
            <StatRow key={idx} label={stat.label} value={stat.value} />
          ))}
        </div>
      </div>

      {/* AI Section */}
      <div>
        <h3 className="text-xs font-bold tracking-[0.2em] text-white/50 uppercase mb-4">AI</h3>
        <div className="flex flex-col">
          {aiStats.map((stat, idx) => (
            <StatRow key={idx} label={stat.label} value={stat.value} />
          ))}
        </div>
      </div>

    </div>
  );
}