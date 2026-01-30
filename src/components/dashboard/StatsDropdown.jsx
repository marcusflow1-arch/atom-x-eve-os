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
    <div className="w-full">
      {/* Tabs header */}
      <div className="flex items-center gap-2 p-2">
        <TabButton id="ai" label="AI Stats" />
        <TabButton id="inventory" label="Inventory" />
      </div>

      {/* Content */}
      <div className="w-full">
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