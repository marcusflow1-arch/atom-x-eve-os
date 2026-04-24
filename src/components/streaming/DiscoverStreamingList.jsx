import React, { useState } from 'react';
import StreamerFilterPanel from './StremerFilterPanel';
import StreamerDiscoveryGrid from './StreamerDiscoveryGrid';

export default function DiscoverStreamingList() {
  const [filters, setFilters] = useState({
    personalities: [],
    genres: [],
    frequency: []
  });

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="w-full min-h-screen pt-20 pb-24 px-4 md:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Filter Panel */}
        <StreamerFilterPanel onFiltersChange={handleFiltersChange} />

        {/* Grid */}
        <StreamerDiscoveryGrid filters={filters} />
      </div>
    </div>
  );
}