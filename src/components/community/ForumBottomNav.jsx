import React from 'react';
import { Wheat, Grid } from 'lucide-react';

export default function ForumBottomNav({ activeTab, onTabSelect }) {
  const Item = ({ active, icon: Icon, label, id }) => (
    <button
      onClick={() => onTabSelect(id)}
      className={`px-4 h-9 rounded-full inline-flex items-center gap-2 text-sm font-semibold transition-all border backdrop-blur-md ${
        active
          ? 'bg-white/20 border-white/30 text-white shadow-[0_2px_12px_rgba(0,0,0,0.25)]'
          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex items-center justify-center gap-2 w-full">
      <Item icon={Grid} label="Forum Hub" id="hub" active={activeTab === 'hub'} />
      <Item icon={Wheat} label="Farm Hub" id="farm_hub" active={activeTab === 'farm_hub'} />
    </div>
  );
}