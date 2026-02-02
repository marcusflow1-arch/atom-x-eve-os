import React from 'react';
import AvatarProgressionBox from '@/components/avatar/AvatarProgressionBox';
import InventoryGrid from '@/components/dashboard/InventoryGrid';

export default function StatsDropdown({ activeTab: controlledTab, onTabChange }) {
  const [internalTab, setInternalTab] = React.useState('ai'); // 'ai' | 'inventory'
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = (val) => {
    if (onTabChange) onTabChange(val);
    setInternalTab(val);
  };

  const TabButton = ({ id, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
        activeTab === id
          ? 'bg-white/15 text-white border-white/20'
          : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="w-full bg-[#0a0e14]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Tabs header */}
      <div className="flex items-center gap-2 p-2 bg-black/20 border-b border-white/10">
        <TabButton id="ai" label="AI Stats" />
        <TabButton id="inventory" label="Inventory" />
      </div>

      {/* Content */}
      <div className="w-full p-4">
        {activeTab === 'ai' && (
          <div className="mt-2">
            <AvatarProgressionBox />
          </div>
        )}
        {activeTab === 'inventory' && (
          <div className="mt-2">
            <InventoryGrid />
          </div>
        )}
      </div>
    </div>
  );
}