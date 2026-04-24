import React, { useState } from 'react';
import StreamerFilterPanel from './StremerFilterPanel';
import StreamerDiscoveryGrid from './StreamerDiscoveryGrid';

export default function DiscoverStreamingList() {
  const [filters, setFilters] = useState({
    personalities: [],
    genres: [],
    frequency: []
  });
  const [search, setSearch] = useState('');

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="w-full min-h-screen pt-16 pb-10 px-6 text-white">
      <div className="max-w-[1920px] mx-auto">
        <div className="flex gap-8">
          {/* LEFT: Filters */}
          <StreamerFilterPanel 
            onFiltersChange={handleFiltersChange}
            search={search}
            onSearchChange={setSearch}
          />

          {/* RIGHT: Streamers Grid */}
          <StreamerDiscoveryGrid 
            filters={filters}
            search={search}
          />
        </div>
      </div>
    </div>
  );
}