import React from 'react';

import LibrarySidebar from '@/components/streaming/LibrarySidebar';

export default function Aura() {
  return (
    <div className="w-full h-screen">
      <LibrarySidebar />
      <iframe
        src="https://aura-fb23b6bd.base44.app/"
        title="Aura"
        className="w-full h-full border-0"
        allow="clipboard-write; fullscreen; encrypted-media; autoplay"
      />
    </div>
  );
}